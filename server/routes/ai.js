const express = require('express');
const https = require('https');

const router = express.Router();

// Helper function to call OpenRouter API
const callOpenRouter = (prompt, systemPrompt = '') => {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5',
      messages: [
        { role: 'system', content: systemPrompt || 'You are an expert sports analyst AI assistant.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 10000,
      temperature: 0.7
    });

    const options = {
      hostname: 'openrouter.ai',
      port: 443,
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'AI Sports Analytics'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

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

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
};

// AI Betting Analysis
router.post('/betting/analyze', async (req, res) => {
  try {
    const { team_a, team_b, sport, odds_team_a, odds_team_b, odds_draw, additional_info } = req.body;

    const prompt = `Analyze this betting opportunity:
Sport: ${sport}
Match: ${team_a} vs ${team_b}
Odds - ${team_a}: ${odds_team_a}, ${team_b}: ${odds_team_b}${odds_draw ? `, Draw: ${odds_draw}` : ''}
${additional_info ? `Additional context: ${additional_info}` : ''}

Provide a detailed betting analysis including:
1. Value Assessment: Are these odds offering value?
2. Predicted Winner with confidence percentage
3. Key factors influencing the outcome
4. Risk Assessment (Low/Medium/High)
5. Recommended bet type and stake suggestion
6. Historical context if relevant

Format your response in clear sections.`;

    const systemPrompt = 'You are an expert sports betting analyst with deep knowledge of odds calculation, probability assessment, and sports statistics. Provide data-driven insights while emphasizing responsible gambling.';

    const response = await callOpenRouter(prompt, systemPrompt);
    const aiContent = response.choices?.[0]?.message?.content || 'Unable to generate analysis';

    res.json({
      success: true,
      analysis: {
        content: aiContent,
        model: response.model,
        usage: response.usage,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('AI Betting Analysis error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate betting analysis' });
  }
});

// AI Fantasy Team Optimization
router.post('/fantasy/optimize', async (req, res) => {
  try {
    const { sport, budget, current_players, available_positions, strategy_preference } = req.body;

    const prompt = `Optimize this fantasy sports team:
Sport: ${sport}
Budget: $${budget}
Current Players: ${current_players ? JSON.stringify(current_players, null, 2) : 'None'}
Positions needed: ${available_positions || 'All positions'}
Strategy preference: ${strategy_preference || 'Balanced'}

Provide optimization suggestions including:
1. Recommended lineup changes
2. High-value players to target within budget
3. Players to consider dropping
4. Formation/lineup optimization
5. Projected point improvements
6. Risk vs reward analysis for each suggestion

Format your response clearly with actionable recommendations.`;

    const systemPrompt = 'You are an expert fantasy sports analyst specializing in lineup optimization, player value assessment, and statistical projections. Provide data-driven recommendations to maximize fantasy points.';

    const response = await callOpenRouter(prompt, systemPrompt);
    const aiContent = response.choices?.[0]?.message?.content || 'Unable to generate optimization';

    res.json({
      success: true,
      optimization: {
        content: aiContent,
        model: response.model,
        usage: response.usage,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('AI Fantasy Optimization error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate fantasy optimization' });
  }
});

// AI Game Strategy Analysis
router.post('/strategy/analyze', async (req, res) => {
  try {
    const { game_type, current_situation, opponent_style, skill_level, specific_question } = req.body;

    const prompt = `Provide game strategy advice:
Game: ${game_type}
Current Situation: ${current_situation || 'General advice needed'}
Opponent's Style: ${opponent_style || 'Unknown'}
Player Skill Level: ${skill_level || 'Intermediate'}
${specific_question ? `Specific Question: ${specific_question}` : ''}

Analyze and provide:
1. Recommended Strategy: Best approach for this situation
2. Key Tactical Moves: Specific actions to take
3. Common Mistakes to Avoid
4. Counter-strategies if opponent adapts
5. Practice Tips: How to improve in this area
6. Win Rate Improvement: Expected success rate with this strategy

Provide clear, actionable advice suitable for the skill level.`;

    const systemPrompt = 'You are a master strategist with expertise in chess, poker, and competitive gaming. Provide expert-level strategic analysis while making it accessible to the player\'s skill level.';

    const response = await callOpenRouter(prompt, systemPrompt);
    const aiContent = response.choices?.[0]?.message?.content || 'Unable to generate strategy';

    res.json({
      success: true,
      strategy: {
        content: aiContent,
        model: response.model,
        usage: response.usage,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('AI Strategy Analysis error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate strategy analysis' });
  }
});

// AI Esports Performance Analysis
router.post('/esports/analyze', async (req, res) => {
  try {
    const { player_name, game_title, stats, recent_matches, comparison_players } = req.body;

    const prompt = `Analyze this esports player's performance:
Player: ${player_name}
Game: ${game_title}
Stats: ${stats ? JSON.stringify(stats, null, 2) : 'Not provided'}
Recent Match Performance: ${recent_matches || 'Not provided'}
${comparison_players ? `Compare with: ${comparison_players}` : ''}

Provide comprehensive analysis:
1. Performance Rating: Overall assessment (1-100)
2. Strengths: Key areas where the player excels
3. Areas for Improvement: Weaknesses to work on
4. Meta Relevance: How well the player fits current game meta
5. Team Synergy: Potential team compositions
6. Career Trajectory: Predicted growth path
7. Training Recommendations: Specific drills and focus areas

Include statistical insights where possible.`;

    const systemPrompt = 'You are an esports analyst with expertise in competitive gaming statistics, player performance metrics, and game-specific meta analysis. Provide professional-level insights similar to broadcast analysts.';

    const response = await callOpenRouter(prompt, systemPrompt);
    const aiContent = response.choices?.[0]?.message?.content || 'Unable to generate analysis';

    res.json({
      success: true,
      analysis: {
        content: aiContent,
        model: response.model,
        usage: response.usage,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('AI Esports Analysis error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate esports analysis' });
  }
});

// AI Referee Decision Analysis
router.post('/referee/analyze', async (req, res) => {
  try {
    const { sport, incident_description, players_involved, time_of_incident, video_description } = req.body;

    const prompt = `Analyze this sports incident from a referee's perspective:
Sport: ${sport}
Incident: ${incident_description}
Players Involved: ${players_involved || 'Not specified'}
Time of Incident: ${time_of_incident || 'Not specified'}
${video_description ? `Video Analysis Notes: ${video_description}` : ''}

Provide official ruling analysis:
1. Rule Identification: Which specific rules apply
2. AI Ruling: What the correct call should be
3. Severity Assessment: (Warning/Minor Foul/Major Foul/Ejection)
4. Reasoning: Detailed explanation of the ruling
5. Precedent: Similar incidents and how they were ruled
6. VAR/Review Recommendation: Should this be reviewed?
7. Player Impact: Consequences for involved players

Base your analysis on official ${sport} rules and regulations.`;

    const systemPrompt = `You are an expert sports official and rules analyst with comprehensive knowledge of ${sport || 'sports'} regulations, officiating standards, and VAR/review protocols. Provide accurate rulings based on official rules.`;

    const response = await callOpenRouter(prompt, systemPrompt);
    const aiContent = response.choices?.[0]?.message?.content || 'Unable to generate ruling';

    res.json({
      success: true,
      ruling: {
        content: aiContent,
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

module.exports = router;
