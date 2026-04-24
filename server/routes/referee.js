const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

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
    res.status(201).json(result.rows[0]);
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
