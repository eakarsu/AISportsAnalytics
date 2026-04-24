const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

// Get all esports stats (with pagination)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 0;
    if (page > 0 && limit > 0) {
      const offset = (page - 1) * limit;
      const countResult = await pool.query('SELECT COUNT(*) FROM esports_stats');
      const total = parseInt(countResult.rows[0].count);
      const result = await pool.query('SELECT * FROM esports_stats ORDER BY ranking ASC NULLS LAST, created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
      return res.json({ data: result.rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    }
    const result = await pool.query('SELECT * FROM esports_stats ORDER BY ranking ASC NULLS LAST, created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching esports stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single player stats
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM esports_stats WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Player stats not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching player stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create player stats
router.post('/', async (req, res) => {
  try {
    const {
      player_name, game_title, team_name, region, role,
      matches_played, wins, losses, kda_ratio, avg_score, ranking, earnings
    } = req.body;

    const result = await pool.query(
      `INSERT INTO esports_stats
       (player_name, game_title, team_name, region, role, matches_played, wins, losses, kda_ratio, avg_score, ranking, earnings)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [player_name, game_title, team_name, region, role, matches_played, wins, losses, kda_ratio, avg_score, ranking, earnings]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating player stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update player stats
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      player_name, game_title, team_name, region, role,
      matches_played, wins, losses, kda_ratio, avg_score, ranking, earnings
    } = req.body;

    const result = await pool.query(
      `UPDATE esports_stats
       SET player_name = $1, game_title = $2, team_name = $3, region = $4, role = $5,
           matches_played = $6, wins = $7, losses = $8, kda_ratio = $9, avg_score = $10,
           ranking = $11, earnings = $12, updated_at = CURRENT_TIMESTAMP
       WHERE id = $13
       RETURNING *`,
      [player_name, game_title, team_name, region, role, matches_played, wins, losses, kda_ratio, avg_score, ranking, earnings, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Player stats not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating player stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete player stats
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM esports_stats WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Player stats not found' });
    }
    res.json({ message: 'Player stats deleted successfully' });
  } catch (error) {
    console.error('Error deleting player stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
