/**
 * Cron Endpoints
 * POST /api/cron/weekly-insights
 *   - Reads ai_analyses from the past 7 days
 *   - Runs AI to generate a digest report
 *   - Stores in weekly_insights table
 *
 * These endpoints should be protected by a cron secret in production.
 * Set CRON_SECRET env var and pass it as Authorization: Bearer <CRON_SECRET>
 */
const express = require('express');
const https = require('https');
const pool = require('../db/pool');

const router = express.Router();

// Simple cron auth middleware
const cronAuth = (req, res, next) => {
  const cronSecret = process.env.CRON_SECRET;
  // If no secret is set, allow in development only
  if (!cronSecret) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(401).json({ error: 'CRON_SECRET not configured' });
    }
    return next();
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];
  if (token !== cronSecret) {
    return res.status(401).json({ error: 'Invalid cron authorization token' });
  }
  next();
};

// Helper: call OpenRouter for digest generation
const callOpenRouterForDigest = (prompt) => {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5',
      messages: [
        {
          role: 'system',
          content: 'You are a sports analytics intelligence system. Generate concise, insightful weekly digest reports from AI analysis data. Focus on patterns, trends, and actionable insights.'
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 4000,
      temperature: 0.5
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
        'X-Title': 'AI Sports Analytics Cron'
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
    req.setTimeout(30000, () => req.destroy(new Error('Request timed out')));
    req.write(data);
    req.end();
  });
};

/**
 * POST /api/cron/weekly-insights
 * Generates a weekly AI digest from the past 7 days of analyses.
 */
router.post('/weekly-insights', cronAuth, async (req, res) => {
  const weekEnd = new Date();
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);

  try {
    // Check if digest already exists for this week
    const { rows: existing } = await pool.query(
      `SELECT id FROM weekly_insights
       WHERE week_start >= $1 AND week_start <= $2
       ORDER BY created_at DESC LIMIT 1`,
      [weekStart.toISOString().split('T')[0], weekEnd.toISOString().split('T')[0]]
    );

    if (existing.length > 0 && !req.query.force) {
      return res.json({
        success: true,
        message: 'Weekly digest already exists for this period. Pass ?force=1 to regenerate.',
        existingId: existing[0].id
      });
    }

    // Fetch all analyses from past 7 days
    const { rows: analyses } = await pool.query(
      `SELECT endpoint, input_data, result_data, created_at
       FROM ai_analyses
       WHERE created_at >= $1 AND created_at <= $2
       ORDER BY endpoint, created_at DESC`,
      [weekStart.toISOString(), weekEnd.toISOString()]
    );

    if (analyses.length === 0) {
      return res.json({
        success: true,
        message: 'No AI analyses found for the past 7 days. No digest generated.',
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString()
      });
    }

    // Group by endpoint for summary
    const grouped = {};
    for (const row of analyses) {
      if (!grouped[row.endpoint]) grouped[row.endpoint] = [];
      grouped[row.endpoint].push(row);
    }

    // Build summary for the prompt
    const summaryLines = [];
    for (const [endpoint, rows] of Object.entries(grouped)) {
      summaryLines.push(`\n=== ${endpoint.toUpperCase()} ANALYSES (${rows.length} total) ===`);
      // Include up to 5 representative results per type to stay within token limits
      const samples = rows.slice(0, 5);
      for (const row of samples) {
        const input = typeof row.input_data === 'string' ? JSON.parse(row.input_data) : row.input_data;
        const result = typeof row.result_data === 'string' ? JSON.parse(row.result_data) : row.result_data;
        summaryLines.push(`Date: ${new Date(row.created_at).toLocaleDateString()}`);
        summaryLines.push(`Input: ${JSON.stringify(input).slice(0, 200)}`);
        summaryLines.push(`Analysis excerpt: ${(result.content || '').slice(0, 300)}`);
        summaryLines.push('---');
      }
    }

    const prompt = `You are generating a weekly sports analytics intelligence digest.

Period: ${weekStart.toLocaleDateString()} to ${weekEnd.toLocaleDateString()}
Total analyses performed: ${analyses.length}

Here is a sample of the analyses conducted this week:
${summaryLines.join('\n')}

Generate a comprehensive weekly insights digest that includes:
1. EXECUTIVE SUMMARY: Key highlights from this week's analyses
2. BETTING INSIGHTS: Patterns in betting analysis (value opportunities, risk trends)
3. FANTASY INSIGHTS: Fantasy optimization trends and top recommendations
4. STRATEGY TRENDS: Common strategies analyzed and their effectiveness patterns
5. ESPORTS ANALYSIS TRENDS: Player performance patterns observed
6. REFEREE/RULING TRENDS: Common incident types and ruling patterns
7. NOTABLE FINDINGS: Any surprising or particularly insightful analyses
8. RECOMMENDATIONS FOR NEXT WEEK: Actionable intelligence for users

Format as a professional sports analytics report.`;

    const response = await callOpenRouterForDigest(prompt);
    const digestContent = response.choices?.[0]?.message?.content || 'Digest generation failed';

    const digestData = {
      content: digestContent,
      analysesBreakdown: Object.fromEntries(
        Object.entries(grouped).map(([k, v]) => [k, v.length])
      ),
      model: response.model,
      generatedAt: new Date().toISOString()
    };

    // Store in database
    const { rows: inserted } = await pool.query(
      `INSERT INTO weekly_insights (week_start, week_end, digest, analyses_count)
       VALUES ($1, $2, $3, $4)
       RETURNING id, created_at`,
      [
        weekStart.toISOString().split('T')[0],
        weekEnd.toISOString().split('T')[0],
        JSON.stringify(digestData),
        analyses.length
      ]
    );

    res.json({
      success: true,
      message: 'Weekly insights digest generated and stored successfully',
      insightId: inserted[0].id,
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      analysesProcessed: analyses.length,
      breakdown: digestData.analysesBreakdown,
      digest: digestContent,
      createdAt: inserted[0].created_at
    });

  } catch (error) {
    console.error('Weekly insights cron error:', error);
    res.status(500).json({
      error: 'Failed to generate weekly insights',
      detail: error.message
    });
  }
});

/**
 * GET /api/cron/weekly-insights
 * Retrieve stored weekly digests
 */
router.get('/weekly-insights', cronAuth, async (req, res) => {
  try {
    const limit = Math.min(10, parseInt(req.query.limit) || 5);
    const { rows } = await pool.query(
      `SELECT id, week_start, week_end, analyses_count, digest->>'generatedAt' as generated_at, created_at
       FROM weekly_insights
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );

    res.json({
      success: true,
      digests: rows.map(r => ({
        id: r.id,
        weekStart: r.week_start,
        weekEnd: r.week_end,
        analysesCount: r.analyses_count,
        generatedAt: r.generated_at,
        createdAt: r.created_at
      }))
    });
  } catch (error) {
    console.error('Weekly insights fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/cron/weekly-insights/:id
 * Retrieve a specific weekly digest with full content
 */
router.get('/weekly-insights/:id', cronAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, week_start, week_end, analyses_count, digest, created_at
       FROM weekly_insights WHERE id = $1`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Weekly digest not found' });
    }

    const row = rows[0];
    const digest = typeof row.digest === 'string' ? JSON.parse(row.digest) : row.digest;

    res.json({
      success: true,
      id: row.id,
      weekStart: row.week_start,
      weekEnd: row.week_end,
      analysesCount: row.analyses_count,
      digest,
      createdAt: row.created_at
    });
  } catch (error) {
    console.error('Weekly insight fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
