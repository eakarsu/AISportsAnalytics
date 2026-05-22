const express = require('express');
const https = require('https');
const { default: rateLimit, ipKeyGenerator } = require('express-rate-limit');
const NodeCache = require('node-cache');
const pool = require('../db/pool');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Cache for AI responses (15-minute TTL)
const aiCache = new NodeCache({ stdTTL: 900, checkperiod: 120 });

// parseAIJson utility
function parseAIJson(text) {
  if (!text) return null;
  try { return JSON.parse(text); } catch (_) {}
  let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  try { return JSON.parse(cleaned); } catch (_) {}
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    try { return JSON.parse(cleaned.slice(start, end + 1)); } catch (_) {}
  }
  return null;
}

function hashInput(obj) {
  const str = JSON.stringify(obj);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(36);
}

// AI-specific rate limiter: 20 requests per hour
const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: 'AI rate limit exceeded. Maximum 20 AI requests per hour.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user ? 'user:' + (req.user.id || req.user.userId) : ipKeyGenerator(req.ip),
});

// Apply AI rate limiter to all routes in this router
router.use(aiRateLimiter);

// 503 guard when LLM not configured
router.use((req, res, next) => {
  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(503).json({
      error: 'AI service not configured',
      detail: 'OPENROUTER_API_KEY environment variable is not set'
    });
  }
  next();
});

// Helper: persist AI result to database
const persistAnalysis = async (endpoint, inputData, resultData, userId, modelUsed, tokensUsed) => {
  try {
    await pool.query(
      `INSERT INTO ai_analyses (endpoint, input_data, result_data, user_id, model_used, tokens_used)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [endpoint, JSON.stringify(inputData), JSON.stringify(resultData), userId || null, modelUsed || null, tokensUsed || null]
    );
  } catch (err) {
    console.error('Failed to persist AI analysis:', err.message);
  }
};

// Helper function to call OpenRouter API (standard, buffered)
const callOpenRouter = (prompt, systemPrompt = '') => {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022',
      messages: [
        { role: 'system', content: systemPrompt || 'You are an expert sports analyst AI assistant. Always respond with valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 2000,
      temperature: 0.3
    });

    const options = {
      hostname: 'openrouter.ai',
      port: 443,
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.CORS_ORIGIN || 'http://localhost:3000',
        'X-Title': 'AI Sports Analytics'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          if (parsed.error) {
            reject(new Error(parsed.error.message || 'OpenRouter API error'));
          } else {
            resolve(parsed);
          }
        } catch (e) {
          reject(new Error('Failed to parse OpenRouter response'));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
};

// Helper: stream response from OpenRouter and pipe to client SSE
const streamOpenRouter = (prompt, systemPrompt, res) => {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022',
      messages: [
        { role: 'system', content: systemPrompt || 'You are an expert sports analyst AI assistant.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 2000,
      temperature: 0.7,
      stream: true
    });

    const options = {
      hostname: 'openrouter.ai',
      port: 443,
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.CORS_ORIGIN || 'http://localhost:3000',
        'X-Title': 'AI Sports Analytics'
      }
    };

    let fullContent = '';

    const req = https.request(options, (apiRes) => {
      apiRes.on('data', (chunk) => {
        const lines = chunk.toString().split('\n').filter(l => l.trim());
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const token = parsed.choices?.[0]?.delta?.content || '';
              if (token) {
                fullContent += token;
                res.write(`data: ${JSON.stringify({ token })}\n\n`);
              }
            } catch (_) { /* skip malformed chunks */ }
          }
        }
      });

      apiRes.on('end', () => {
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        resolve(fullContent);
      });
    });

    req.on('error', (err) => {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      reject(err);
    });

    req.write(data);
    req.end();
  });
};

// ============================================================
// GET /api/ai/analytics/:type/history — retrieve stored analyses
// ============================================================
router.get('/analytics/:type/history', authenticateToken, async (req, res) => {
  try {
    const { type } = req.params;
    const validTypes = ['betting', 'fantasy', 'strategy', 'esports', 'referee'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const offset = (page - 1) * limit;

    const { rows: analyses } = await pool.query(
      `SELECT id, endpoint, input_data, result_data, model_used, tokens_used, created_at
       FROM ai_analyses WHERE endpoint = $1
       ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [type, limit, offset]
    );

    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) as total FROM ai_analyses WHERE endpoint = $1`,
      [type]
    );

    res.json({
      success: true,
      data: analyses,
      pagination: {
        page, limit,
        total: parseInt(countRows[0].total),
        totalPages: Math.ceil(parseInt(countRows[0].total) / limit)
      }
    });
  } catch (error) {
    console.error('AI history fetch error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch analysis history' });
  }
});

// ============================================================
// POST /api/ai/betting/analyze - Structured JSON output
// ============================================================
router.post('/betting/analyze', authenticateToken, async (req, res) => {
  const { team_a, team_b, sport, odds_team_a, odds_team_b, odds_draw, additional_info } = req.body;

  if (!team_a || !team_b || !sport) {
    return res.status(400).json({ error: 'team_a, team_b, and sport are required' });
  }

  // Check cache
  const cacheKey = hashInput({ team_a, team_b, sport, odds_team_a, odds_team_b, odds_draw });
  const cached = aiCache.get(cacheKey);
  if (cached && req.headers.accept !== 'text/event-stream') {
    return res.json({ ...cached, cached: true });
  }

  const prompt = `Analyze this betting opportunity:
Sport: ${sport}
Match: ${team_a} vs ${team_b}
Odds - ${team_a}: ${odds_team_a}, ${team_b}: ${odds_team_b}${odds_draw ? `, Draw: ${odds_draw}` : ''}
${additional_info ? `Additional context: ${additional_info}` : ''}

Respond ONLY with valid JSON:
{
  "analysis": {
    "confidence": <number 0-100>,
    "recommendation": "<string>",
    "risk_level": "<Low|Medium|High>",
    "factors": ["<string>", ...],
    "predicted_winner": "<team name or Draw>",
    "value_assessment": "<Overvalued|Undervalued|Fair>",
    "stake_suggestion": "<string>"
  }
}`;

  const systemPrompt = 'You are an expert sports betting analyst. Always respond with valid JSON only, no markdown or extra text.';

  const wantsStream = req.headers.accept === 'text/event-stream';

  if (wantsStream) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    try {
      const fullContent = await streamOpenRouter(prompt, systemPrompt, res);
      const inputData = { team_a, team_b, sport, odds_team_a, odds_team_b, odds_draw, additional_info };
      await persistAnalysis('betting', inputData, { content: fullContent }, req.user?.id, process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022', null);
      res.end();
    } catch (error) {
      console.error('AI Betting streaming error:', error);
      res.write(`data: ${JSON.stringify({ error: error.message || 'Streaming failed' })}\n\n`);
      res.end();
    }
  } else {
    try {
      const response = await callOpenRouter(prompt, systemPrompt);
      const rawContent = response.choices?.[0]?.message?.content || '';
      const parsed = parseAIJson(rawContent);
      const inputData = { team_a, team_b, sport, odds_team_a, odds_team_b, odds_draw, additional_info };
      const resultData = parsed || { content: rawContent };

      await persistAnalysis('betting', inputData, resultData, req.user?.id, response.model, response.usage?.total_tokens);

      const responsePayload = {
        success: true,
        analysis: {
          ...(parsed?.analysis || { content: rawContent }),
          model: response.model,
          usage: response.usage,
          timestamp: new Date().toISOString()
        }
      };

      aiCache.set(cacheKey, responsePayload);
      res.json(responsePayload);
    } catch (error) {
      console.error('AI Betting Analysis error:', error);
      res.status(500).json({ error: error.message || 'Failed to generate betting analysis' });
    }
  }
});

// ============================================================
// POST /api/ai/fantasy/optimize - Structured JSON output
// ============================================================
router.post('/fantasy/optimize', authenticateToken, async (req, res) => {
  try {
    const { sport, budget, current_players, available_positions, strategy_preference } = req.body;

    const cacheKey = hashInput({ sport, budget, current_players, available_positions, strategy_preference });
    const cached = aiCache.get(cacheKey);
    if (cached) return res.json({ ...cached, cached: true });

    const prompt = `Optimize this fantasy sports team:
Sport: ${sport}
Budget: $${budget}
Current Players: ${current_players ? JSON.stringify(current_players, null, 2) : 'None'}
Positions needed: ${available_positions || 'All positions'}
Strategy preference: ${strategy_preference || 'Balanced'}

Respond ONLY with valid JSON:
{
  "analysis": {
    "confidence": <number 0-100>,
    "recommendation": "<primary recommendation string>",
    "risk_level": "<Low|Medium|High>",
    "factors": ["<string>", ...],
    "lineup_changes": ["<string>", ...],
    "players_to_target": ["<string>", ...],
    "players_to_drop": ["<string>", ...]
  }
}`;

    const systemPrompt = 'You are an expert fantasy sports analyst. Always respond with valid JSON only.';

    const response = await callOpenRouter(prompt, systemPrompt);
    const rawContent = response.choices?.[0]?.message?.content || '';
    const parsed = parseAIJson(rawContent);
    const inputData = { sport, budget, current_players, available_positions, strategy_preference };
    const resultData = parsed || { content: rawContent };

    await persistAnalysis('fantasy', inputData, resultData, req.user?.id, response.model, response.usage?.total_tokens);

    const responsePayload = {
      success: true,
      optimization: {
        ...(parsed?.analysis || { content: rawContent }),
        model: response.model,
        usage: response.usage,
        timestamp: new Date().toISOString()
      }
    };

    aiCache.set(cacheKey, responsePayload);
    res.json(responsePayload);
  } catch (error) {
    console.error('AI Fantasy Optimization error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate fantasy optimization' });
  }
});

// ============================================================
// POST /api/ai/strategy/analyze - Structured JSON output (SSE)
// ============================================================
router.post('/strategy/analyze', authenticateToken, async (req, res) => {
  const { game_type, current_situation, opponent_style, skill_level, specific_question } = req.body;

  const prompt = `Provide game strategy advice:
Game: ${game_type}
Current Situation: ${current_situation || 'General advice needed'}
Opponent's Style: ${opponent_style || 'Unknown'}
Player Skill Level: ${skill_level || 'Intermediate'}
${specific_question ? `Specific Question: ${specific_question}` : ''}

Respond ONLY with valid JSON:
{
  "analysis": {
    "confidence": <number 0-100>,
    "recommendation": "<primary strategy recommendation>",
    "risk_level": "<Low|Medium|High>",
    "factors": ["<key factor>", ...],
    "key_moves": ["<string>", ...],
    "mistakes_to_avoid": ["<string>", ...],
    "win_rate_estimate": "<string>"
  }
}`;

  const systemPrompt = 'You are a master strategist. Always respond with valid JSON only.';

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  try {
    const fullContent = await streamOpenRouter(prompt, systemPrompt, res);
    const inputData = { game_type, current_situation, opponent_style, skill_level, specific_question };
    await persistAnalysis('strategy', inputData, { content: fullContent }, req.user?.id, process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022', null);
    res.end();
  } catch (error) {
    console.error('AI Strategy streaming error:', error);
    res.write(`data: ${JSON.stringify({ error: error.message || 'Streaming failed' })}\n\n`);
    res.end();
  }
});

// ============================================================
// POST /api/ai/esports/analyze - Structured JSON output
// ============================================================
router.post('/esports/analyze', authenticateToken, async (req, res) => {
  try {
    const { player_name, game_title, stats, recent_matches, comparison_players } = req.body;

    const cacheKey = hashInput({ player_name, game_title, stats });
    const cached = aiCache.get(cacheKey);
    if (cached) return res.json({ ...cached, cached: true });

    const prompt = `Analyze this esports player's performance:
Player: ${player_name}
Game: ${game_title}
Stats: ${stats ? JSON.stringify(stats, null, 2) : 'Not provided'}
Recent Match Performance: ${recent_matches || 'Not provided'}
${comparison_players ? `Compare with: ${comparison_players}` : ''}

Respond ONLY with valid JSON:
{
  "analysis": {
    "confidence": <number 0-100>,
    "recommendation": "<primary recommendation>",
    "risk_level": "<Low|Medium|High>",
    "factors": ["<string>", ...],
    "performance_rating": <number 1-100>,
    "strengths": ["<string>", ...],
    "improvements": ["<string>", ...],
    "career_trajectory": "<string>"
  }
}`;

    const systemPrompt = 'You are an esports analyst. Always respond with valid JSON only.';

    const response = await callOpenRouter(prompt, systemPrompt);
    const rawContent = response.choices?.[0]?.message?.content || '';
    const parsed = parseAIJson(rawContent);
    const inputData = { player_name, game_title, stats, recent_matches, comparison_players };
    const resultData = parsed || { content: rawContent };

    await persistAnalysis('esports', inputData, resultData, req.user?.id, response.model, response.usage?.total_tokens);

    const responsePayload = {
      success: true,
      analysis: {
        ...(parsed?.analysis || { content: rawContent }),
        model: response.model,
        usage: response.usage,
        timestamp: new Date().toISOString()
      }
    };

    aiCache.set(cacheKey, responsePayload);
    res.json(responsePayload);
  } catch (error) {
    console.error('AI Esports Analysis error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate esports analysis' });
  }
});

// ============================================================
// POST /api/ai/referee/analyze - Structured JSON, connected to CRUD
// ============================================================
router.post('/referee/analyze', authenticateToken, async (req, res) => {
  try {
    const { sport, incident_description, players_involved, time_of_incident, video_description, incident_id } = req.body;

    const prompt = `Analyze this sports incident from a referee's perspective:
Sport: ${sport}
Incident: ${incident_description}
Players Involved: ${players_involved || 'Not specified'}
Time of Incident: ${time_of_incident || 'Not specified'}
${video_description ? `Video Analysis Notes: ${video_description}` : ''}

Respond ONLY with valid JSON:
{
  "analysis": {
    "confidence": <number 0-100>,
    "recommendation": "<correct ruling>",
    "risk_level": "<Warning|Minor Foul|Major Foul|Ejection>",
    "factors": ["<string>", ...],
    "rule_applied": "<specific rule>",
    "var_recommended": <true|false>,
    "player_consequences": "<string>"
  }
}`;

    const systemPrompt = `You are an expert sports official for ${sport || 'sports'}. Always respond with valid JSON only.`;

    const response = await callOpenRouter(prompt, systemPrompt);
    const rawContent = response.choices?.[0]?.message?.content || '';
    const parsed = parseAIJson(rawContent);
    const inputData = { sport, incident_description, players_involved, time_of_incident, video_description };
    const resultData = parsed || { content: rawContent };

    await persistAnalysis('referee', inputData, resultData, req.user?.id, response.model, response.usage?.total_tokens);

    // If incident_id provided, save ai_analysis to the referee_incidents record
    if (incident_id) {
      try {
        await pool.query(
          'UPDATE referee_incidents SET ai_analysis=$1, updated_at=NOW() WHERE id=$2',
          [JSON.stringify(resultData), incident_id]
        );
      } catch (e) { console.error('Failed to update incident AI analysis:', e.message); }
    }

    res.json({
      success: true,
      ruling: {
        ...(parsed?.analysis || { content: rawContent }),
        model: response.model,
        usage: response.usage,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('AI Referee Analysis error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate referee analysis' });
  }
});

// ============================================================
// POST /api/ai/betting/analyze/stream — STREAMING version for betting
// ============================================================
router.post('/betting/analyze/stream', authenticateToken, async (req, res) => {
  const { team_a, team_b, sport, odds_team_a, odds_team_b, odds_draw, additional_info } = req.body;

  const prompt = `Analyze this betting opportunity and respond with valid JSON:
{
  "analysis": { "confidence": <0-100>, "recommendation": "<string>", "risk_level": "<Low|Medium|High>", "factors": ["..."], "predicted_winner": "<string>" }
}
Sport: ${sport}, Match: ${team_a} vs ${team_b}`;

  const systemPrompt = 'You are an expert sports betting analyst.';

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  try {
    const fullContent = await streamOpenRouter(prompt, systemPrompt, res);
    const inputData = { team_a, team_b, sport, odds_team_a, odds_team_b, odds_draw, additional_info };
    await persistAnalysis('betting', inputData, { content: fullContent }, req.user?.id, process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022', null);
    res.end();
  } catch (error) {
    console.error('AI Betting streaming error:', error);
    res.write(`data: ${JSON.stringify({ error: error.message || 'Streaming failed' })}\n\n`);
    res.end();
  }
});

// ============================================================
// POST /api/ai/picks/record-outcome - Record actual outcome vs AI prediction
// ============================================================
router.post('/picks/record-outcome', authenticateToken, async (req, res) => {
  try {
    const { ai_analysis_id, betting_id, predicted_winner, confidence_score, sport, match_name, actual_outcome } = req.body;
    if (!actual_outcome) return res.status(400).json({ error: 'actual_outcome is required.' });

    const is_correct = predicted_winner && actual_outcome
      ? actual_outcome.toLowerCase().includes(predicted_winner.toLowerCase())
      : null;

    const result = await pool.query(
      `INSERT INTO ai_picks_history (ai_analysis_id, betting_id, predicted_winner, confidence_score, sport, match_name, actual_outcome, is_correct)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [ai_analysis_id || null, betting_id || null, predicted_winner, confidence_score, sport, match_name, actual_outcome, is_correct]
    );

    res.status(201).json({ success: true, pick: result.rows[0] });
  } catch (error) {
    console.error('Record outcome error:', error);
    res.status(500).json({ error: 'Failed to record outcome.' });
  }
});

// ============================================================
// GET /api/ai/model-performance - AI model accuracy stats
// ============================================================
router.get('/model-performance', authenticateToken, async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT
        COUNT(*) as total_picks,
        COUNT(CASE WHEN is_correct = true THEN 1 END) as correct_picks,
        COUNT(CASE WHEN is_correct = false THEN 1 END) as incorrect_picks,
        COUNT(CASE WHEN is_correct IS NULL THEN 1 END) as unverified_picks,
        ROUND(AVG(confidence_score)::numeric, 2) as avg_confidence,
        ROUND((COUNT(CASE WHEN is_correct = true THEN 1 END)::decimal / NULLIF(COUNT(CASE WHEN is_correct IS NOT NULL THEN 1 END), 0) * 100)::numeric, 2) as accuracy_rate
      FROM ai_picks_history
    `);

    const bySport = await pool.query(`
      SELECT sport,
        COUNT(*) as picks,
        COUNT(CASE WHEN is_correct = true THEN 1 END) as correct,
        ROUND((COUNT(CASE WHEN is_correct = true THEN 1 END)::decimal / NULLIF(COUNT(CASE WHEN is_correct IS NOT NULL THEN 1 END), 0) * 100)::numeric, 2) as accuracy
      FROM ai_picks_history
      WHERE sport IS NOT NULL
      GROUP BY sport ORDER BY accuracy DESC NULLS LAST
    `);

    const recent = await pool.query(`
      SELECT * FROM ai_picks_history ORDER BY created_at DESC LIMIT 20
    `);

    res.json({
      success: true,
      performance: stats.rows[0],
      by_sport: bySport.rows,
      recent_picks: recent.rows
    });
  } catch (error) {
    console.error('Model performance error:', error);
    res.status(500).json({ error: 'Failed to compute model performance.' });
  }
});

// ============================================================
// POST /api/ai/fantasy/head-to-head - Fantasy lineup contest simulator
// ============================================================
router.post('/fantasy/head-to-head', authenticateToken, async (req, res) => {
  try {
    const { lineup_a_id, lineup_b_id } = req.body;
    if (!lineup_a_id || !lineup_b_id) return res.status(400).json({ error: 'lineup_a_id and lineup_b_id are required.' });

    const lineupA = await pool.query('SELECT * FROM fantasy_teams WHERE id=$1', [lineup_a_id]);
    const lineupB = await pool.query('SELECT * FROM fantasy_teams WHERE id=$1', [lineup_b_id]);

    if (!lineupA.rows[0] || !lineupB.rows[0]) return res.status(404).json({ error: 'One or both lineups not found.' });

    const playersA = await pool.query('SELECT * FROM fantasy_players WHERE team_id=$1', [lineup_a_id]);
    const playersB = await pool.query('SELECT * FROM fantasy_players WHERE team_id=$1', [lineup_b_id]);

    const prompt = `Simulate a fantasy sports head-to-head matchup:
Team A: ${lineupA.rows[0].team_name} (${lineupA.rows[0].sport})
Players A: ${JSON.stringify(playersA.rows, null, 2)}

Team B: ${lineupB.rows[0].team_name}
Players B: ${JSON.stringify(playersB.rows, null, 2)}

Respond ONLY with valid JSON:
{
  "analysis": {
    "confidence": <number 0-100>,
    "recommendation": "<winner team name>",
    "risk_level": "<Low|Medium|High>",
    "factors": ["<string>", ...],
    "team_a_score_projection": <number>,
    "team_b_score_projection": <number>,
    "winner_probability_a": <number 0-100>,
    "winner_probability_b": <number 0-100>,
    "key_matchups": ["<string>", ...]
  }
}`;

    const response = await callOpenRouter(prompt, 'You are an expert fantasy sports analyst. Always respond with valid JSON only.');
    const rawContent = response.choices?.[0]?.message?.content || '';
    const parsed = parseAIJson(rawContent);

    await persistAnalysis('fantasy-h2h', { lineup_a_id, lineup_b_id }, parsed || { content: rawContent }, req.user?.id, response.model, response.usage?.total_tokens);

    res.json({
      success: true,
      simulation: {
        ...(parsed?.analysis || { content: rawContent }),
        team_a: lineupA.rows[0].team_name,
        team_b: lineupB.rows[0].team_name,
        model: response.model,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Fantasy H2H error:', error);
    res.status(500).json({ error: 'Failed to simulate matchup.' });
  }
});

// ============================================================
// POST /api/ai/betting/import-odds - Bulk import odds data
// ============================================================
router.post('/betting/import-odds', authenticateToken, async (req, res) => {
  try {
    const { odds_data, source = 'external' } = req.body;
    if (!Array.isArray(odds_data) || odds_data.length === 0) {
      return res.status(400).json({ error: 'odds_data must be a non-empty array.' });
    }

    const inserted = [];
    for (const item of odds_data) {
      try {
        const result = await pool.query(
          `INSERT INTO betting_analyses (match_name, sport, team_a, team_b, odds_team_a, odds_team_b, odds_draw, match_date, analysis_notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
          [
            item.match_name || `${item.team_a} vs ${item.team_b}`,
            item.sport || 'Unknown',
            item.team_a, item.team_b,
            item.odds_team_a || null, item.odds_team_b || null, item.odds_draw || null,
            item.match_date || null,
            `Imported from ${source}`
          ]
        );
        inserted.push(result.rows[0].id);
      } catch (e) { console.error('Failed to insert odds row:', e.message); }
    }

    res.json({ success: true, imported: inserted.length, ids: inserted });
  } catch (error) {
    console.error('Import odds error:', error);
    res.status(500).json({ error: 'Failed to import odds data.' });
  }
});

// ============================================================
// POST /api/ai/injury-impact - Injury impact prediction (cross-sport)
// ============================================================
router.post('/injury-impact', authenticateToken, async (req, res) => {
  try {
    const { player_name, sport, position, injury_type, injury_severity, age, fantasy_format } = req.body;
    if (!injury_type) return res.status(400).json({ error: 'injury_type is required.' });

    const inputData = { player_name, sport, position, injury_type, injury_severity, age, fantasy_format };
    const cacheKey = 'injury-impact:' + hashInput(inputData);
    const cached = aiCache.get(cacheKey);
    if (cached) return res.json({ cached: true, ...cached });

    const prompt = `You are a sports medicine and analytics expert. Project recovery and downstream impact for the player.
Player: ${player_name || 'Unknown'} | Sport: ${sport || 'unknown'} | Pos: ${position || 'unknown'} | Age: ${age || 'unknown'}
Injury: ${injury_type} (${injury_severity || 'unspecified'})
Fantasy format: ${fantasy_format || 'season'}

Respond ONLY with JSON:
{
  "impact": {
    "recovery_weeks_low": <number>,
    "recovery_weeks_high": <number>,
    "performance_decline_pct": <0-100>,
    "fantasy_value_impact": "low|moderate|severe",
    "career_risk": "low|medium|high",
    "watch_list_signals": ["..."],
    "confidence": "low|medium|high",
    "rationale": "..."
  }
}`;
    const response = await callOpenRouter(prompt, 'You are a sports medicine analyst. Respond with valid JSON only.');
    const rawContent = response.choices?.[0]?.message?.content || '';
    const parsed = parseAIJson(rawContent);
    const resultData = { impact: parsed?.impact || { summary: rawContent }, model: response.model, tokensUsed: response.usage?.total_tokens || 0 };
    aiCache.set(cacheKey, resultData);
    await persistAnalysis('injury-impact', inputData, resultData, req.user?.id, response.model, response.usage?.total_tokens);
    res.json(resultData);
  } catch (error) {
    console.error('Injury impact error:', error);
    res.status(500).json({ error: 'Failed to predict injury impact.' });
  }
});

// ============================================================
// POST /api/ai/performance-regression - Performance regression model
// ============================================================
router.post('/performance-regression', authenticateToken, async (req, res) => {
  try {
    const { player_name, sport, position, recent_stats, season, age } = req.body;
    if (!player_name) return res.status(400).json({ error: 'player_name is required.' });

    const inputData = { player_name, sport, position, recent_stats, season, age };
    const cacheKey = 'performance-regression:' + hashInput(inputData);
    const cached = aiCache.get(cacheKey);
    if (cached) return res.json({ cached: true, ...cached });

    const prompt = `You are a sports performance analytics expert. Detect regression signals and project upcoming production.
Player: ${player_name} | Sport: ${sport || 'unknown'} | Pos: ${position || 'unknown'} | Age: ${age || 'unknown'} | Season: ${season || 'current'}
Recent stats: ${JSON.stringify(recent_stats || {})}

Respond ONLY with JSON:
{
  "analysis": {
    "regression_signal": "improving|stable|declining|sharp_decline",
    "projected_decline_pct": <0-100>,
    "drivers": ["..."],
    "compare_to_career_avg_pct": <number>,
    "next_segment_projection": {"games": <number>, "expected_value_per_game": <number>},
    "confidence": "low|medium|high",
    "rationale": "..."
  }
}`;
    const response = await callOpenRouter(prompt, 'You are a sports analyst. Respond with valid JSON only.');
    const rawContent = response.choices?.[0]?.message?.content || '';
    const parsed = parseAIJson(rawContent);
    const resultData = { analysis: parsed?.analysis || { summary: rawContent }, model: response.model, tokensUsed: response.usage?.total_tokens || 0 };
    aiCache.set(cacheKey, resultData);
    await persistAnalysis('performance-regression', inputData, resultData, req.user?.id, response.model, response.usage?.total_tokens);
    res.json(resultData);
  } catch (error) {
    console.error('Performance regression error:', error);
    res.status(500).json({ error: 'Failed to analyze performance regression.' });
  }
});

// ============================================================
// POST /api/ai/live-betting-optimize - Live in-game betting optimization
// ============================================================
router.post('/live-betting-optimize', authenticateToken, async (req, res) => {
  try {
    const { sport, match, score, time_remaining, current_odds, momentum, bankroll, risk_tolerance } = req.body || {};
    if (!sport || !match) return res.status(400).json({ error: 'sport and match are required.' });

    const inputData = { sport, match, score, time_remaining, current_odds, momentum, bankroll, risk_tolerance };
    const cacheKey = 'live-betting-optimize:' + hashInput(inputData);
    const cached = aiCache.get(cacheKey);
    if (cached) return res.json({ cached: true, ...cached });

    const prompt = `You are a live in-play betting optimization expert. Recommend stake sizing and timing for live wagers.
Sport: ${sport}
Match: ${typeof match === 'string' ? match : JSON.stringify(match)}
Score: ${typeof score === 'string' ? score : JSON.stringify(score || {})}
Time remaining: ${time_remaining || 'unknown'}
Current odds: ${JSON.stringify(current_odds || {})}
Momentum signals: ${JSON.stringify(momentum || {})}
Bankroll: ${bankroll || 'unspecified'}
Risk tolerance: ${risk_tolerance || 'medium'}

Respond ONLY with JSON:
{
  "optimization": {
    "recommended_action": "back|lay|hedge|skip",
    "selection": "...",
    "stake_pct_of_bankroll": <0-100>,
    "expected_value_pct": <number>,
    "kelly_fraction": <0-1>,
    "best_window": "now|next_5_min|next_quarter|end_of_period",
    "hedging_strategy": "...",
    "risks": ["..."],
    "confidence": "low|medium|high",
    "rationale": "..."
  }
}`;
    const response = await callOpenRouter(prompt, 'You are a live betting optimization analyst. Respond with valid JSON only.');
    const rawContent = response.choices?.[0]?.message?.content || '';
    const parsed = parseAIJson(rawContent);
    const resultData = { optimization: parsed?.optimization || { summary: rawContent }, model: response.model, tokensUsed: response.usage?.total_tokens || 0 };
    aiCache.set(cacheKey, resultData);
    await persistAnalysis('live-betting-optimize', inputData, resultData, req.user?.id, response.model, response.usage?.total_tokens);
    res.json(resultData);
  } catch (error) {
    console.error('Live betting optimize error:', error);
    res.status(500).json({ error: 'Failed to optimize live betting.' });
  }
});

// ============================================================
// POST /api/ai/news-sentiment - Sports news sentiment analysis
// ============================================================
router.post('/news-sentiment', authenticateToken, async (req, res) => {
  try {
    const { headlines, sport, team_or_player, timeframe } = req.body || {};
    if (!Array.isArray(headlines) || headlines.length === 0) {
      return res.status(400).json({ error: 'headlines (array) is required.' });
    }

    const inputData = { headlines, sport, team_or_player, timeframe };
    const cacheKey = 'news-sentiment:' + hashInput(inputData);
    const cached = aiCache.get(cacheKey);
    if (cached) return res.json({ cached: true, ...cached });

    const prompt = `You are a sports media sentiment analyst. Score sentiment across the supplied news headlines.
Sport: ${sport || 'unknown'}
Subject: ${team_or_player || 'unspecified'}
Timeframe: ${timeframe || 'recent'}
Headlines:
${headlines.map((h, i) => `${i + 1}. ${typeof h === 'string' ? h : JSON.stringify(h)}`).join('\n')}

Respond ONLY with JSON:
{
  "sentiment": {
    "overall_score": <-1.0 to 1.0>,
    "label": "very_negative|negative|neutral|positive|very_positive",
    "polarity_distribution": {"positive_pct": <0-100>, "neutral_pct": <0-100>, "negative_pct": <0-100>},
    "themes": ["..."],
    "per_headline": [{"headline": "...", "score": <-1.0 to 1.0>, "label": "..."}],
    "fantasy_betting_impact": "negligible|minor|moderate|major",
    "confidence": "low|medium|high",
    "rationale": "..."
  }
}`;
    const response = await callOpenRouter(prompt, 'You are a sports news sentiment analyst. Respond with valid JSON only.');
    const rawContent = response.choices?.[0]?.message?.content || '';
    const parsed = parseAIJson(rawContent);
    const resultData = { sentiment: parsed?.sentiment || { summary: rawContent }, model: response.model, tokensUsed: response.usage?.total_tokens || 0 };
    aiCache.set(cacheKey, resultData);
    await persistAnalysis('news-sentiment', inputData, resultData, req.user?.id, response.model, response.usage?.total_tokens);
    res.json(resultData);
  } catch (error) {
    console.error('News sentiment error:', error);
    res.status(500).json({ error: 'Failed to analyze news sentiment.' });
  }
});

module.exports = router;
