const express = require('express');
const pool = require('../db/pool');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all betting analyses (with pagination)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 0;
    if (page > 0 && limit > 0) {
      const offset = (page - 1) * limit;
      const countResult = await pool.query('SELECT COUNT(*) FROM betting_analyses');
      const total = parseInt(countResult.rows[0].count);
      const result = await pool.query('SELECT * FROM betting_analyses ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
      return res.json({ data: result.rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    }
    const result = await pool.query('SELECT * FROM betting_analyses ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching betting analyses:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single betting analysis
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM betting_analyses WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Analysis not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching betting analysis:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create betting analysis
router.post('/', async (req, res) => {
  try {
    const {
      match_name, sport, team_a, team_b, odds_team_a, odds_team_b,
      odds_draw, predicted_winner, confidence_score, analysis_notes, match_date
    } = req.body;

    const result = await pool.query(
      `INSERT INTO betting_analyses
       (match_name, sport, team_a, team_b, odds_team_a, odds_team_b, odds_draw, predicted_winner, confidence_score, analysis_notes, match_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [match_name, sport, team_a, team_b, odds_team_a, odds_team_b, odds_draw, predicted_winner, confidence_score, analysis_notes, match_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating betting analysis:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update betting analysis
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      match_name, sport, team_a, team_b, odds_team_a, odds_team_b,
      odds_draw, predicted_winner, confidence_score, analysis_notes, match_date
    } = req.body;

    const result = await pool.query(
      `UPDATE betting_analyses
       SET match_name = $1, sport = $2, team_a = $3, team_b = $4, odds_team_a = $5,
           odds_team_b = $6, odds_draw = $7, predicted_winner = $8, confidence_score = $9,
           analysis_notes = $10, match_date = $11, updated_at = CURRENT_TIMESTAMP
       WHERE id = $12
       RETURNING *`,
      [match_name, sport, team_a, team_b, odds_team_a, odds_team_b, odds_draw, predicted_winner, confidence_score, analysis_notes, match_date, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Analysis not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating betting analysis:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete betting analysis
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM betting_analyses WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Analysis not found' });
    }
    res.json({ message: 'Analysis deleted successfully' });
  } catch (error) {
    console.error('Error deleting betting analysis:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
