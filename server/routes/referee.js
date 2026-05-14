const express = require('express');
const https = require('https');
const pool = require('../db/pool');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Auto-trigger AI analysis when creating referee incident
async function autoAnalyzeRefereeIncident(incident) {
  try {
    const prompt = `Analyze this ${incident.sport} referee incident: ${incident.description}. Players: ${incident.players_involved || 'N/A'}. Severity: ${incident.severity}.
Respond ONLY with valid JSON: {"analysis":{"confidence":<0-100>,"recommendation":"<ruling>","risk_level":"<Warning|Minor Foul|Major Foul|Ejection>","factors":["<string>"],"rule_applied":"<string>","var_recommended":<true|false>}}`;

    const data = JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022',
      messages: [
        { role: 'system', content: 'You are an expert sports official. Always respond with valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 500, temperature: 0.3
    });

    const options = {
      hostname: 'openrouter.ai', port: 443, path: '/api/v1/chat/completions', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`, 'HTTP-Referer': process.env.CORS_ORIGIN || 'http://localhost:3000', 'X-Title': 'AI Sports Analytics' }
    };

    const responseText = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => resolve(body));
      });
      req.on('error', reject);
      req.write(data);
      req.end();
    });

    const parsed = JSON.parse(responseText);
    const content = parsed.choices?.[0]?.message?.content || '';
    let analysisJson = null;
    try { analysisJson = JSON.parse(content); } catch (_) {
      const s = content.indexOf('{'); const e = content.lastIndexOf('}');
      if (s !== -1 && e !== -1) try { analysisJson = JSON.parse(content.slice(s, e + 1)); } catch (_) {}
    }

    if (analysisJson) {
      await pool.query('UPDATE referee_incidents SET ai_analysis=$1, ai_ruling=$2, updated_at=NOW() WHERE id=$3',
        [JSON.stringify(analysisJson), analysisJson?.analysis?.recommendation || '', incident.id]);
    }
  } catch (e) { console.error('Auto AI analysis failed:', e.message); }
}

// Get all referee incidents (with pagination)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 0;
    if (page > 0 && limit > 0) {
      const offset = (page - 1) * limit;
      const countResult = await pool.query('SELECT COUNT(*) FROM referee_incidents');
      const total = parseInt(countResult.rows[0].count);
      const result = await pool.query('SELECT * FROM referee_incidents ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
      return res.json({ data: result.rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    }
    const result = await pool.query('SELECT * FROM referee_incidents ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching referee incidents:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single incident
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM referee_incidents WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching incident:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create incident
router.post('/', async (req, res) => {
  try {
    const {
      match_name, sport, incident_type, description, time_occurred,
      players_involved, severity, ai_ruling, actual_ruling, video_url
    } = req.body;

    const result = await pool.query(
      `INSERT INTO referee_incidents
       (match_name, sport, incident_type, description, time_occurred, players_involved, severity, ai_ruling, actual_ruling, video_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [match_name, sport, incident_type, description, time_occurred, players_involved, severity, ai_ruling, actual_ruling, video_url]
    );
    const incident = result.rows[0];
    // Auto-trigger AI analysis asynchronously (don't await - fire and forget)
    if (process.env.OPENROUTER_API_KEY) {
      autoAnalyzeRefereeIncident(incident).catch(() => {});
    }
    res.status(201).json(incident);
  } catch (error) {
    console.error('Error creating incident:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update incident
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      match_name, sport, incident_type, description, time_occurred,
      players_involved, severity, ai_ruling, actual_ruling, video_url
    } = req.body;

    const result = await pool.query(
      `UPDATE referee_incidents
       SET match_name = $1, sport = $2, incident_type = $3, description = $4, time_occurred = $5,
           players_involved = $6, severity = $7, ai_ruling = $8, actual_ruling = $9, video_url = $10, updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING *`,
      [match_name, sport, incident_type, description, time_occurred, players_involved, severity, ai_ruling, actual_ruling, video_url, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating incident:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete incident
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM referee_incidents WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    res.json({ message: 'Incident deleted successfully' });
  } catch (error) {
    console.error('Error deleting incident:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
