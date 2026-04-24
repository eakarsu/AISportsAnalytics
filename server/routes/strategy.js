const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

// Get all game strategies (with pagination)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 0;
    if (page > 0 && limit > 0) {
      const offset = (page - 1) * limit;
      const countResult = await pool.query('SELECT COUNT(*) FROM game_strategies');
      const total = parseInt(countResult.rows[0].count);
      const result = await pool.query('SELECT * FROM game_strategies ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
      return res.json({ data: result.rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    }
    const result = await pool.query('SELECT * FROM game_strategies ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching game strategies:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single strategy
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM game_strategies WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Strategy not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching strategy:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create strategy
router.post('/', async (req, res) => {
  try {
    const {
      game_type, strategy_name, description, difficulty_level,
      win_rate, key_moves, counter_strategies, best_situations
    } = req.body;

    const result = await pool.query(
      `INSERT INTO game_strategies
       (game_type, strategy_name, description, difficulty_level, win_rate, key_moves, counter_strategies, best_situations)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [game_type, strategy_name, description, difficulty_level, win_rate, key_moves, counter_strategies, best_situations]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating strategy:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update strategy
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      game_type, strategy_name, description, difficulty_level,
      win_rate, key_moves, counter_strategies, best_situations
    } = req.body;

    const result = await pool.query(
      `UPDATE game_strategies
       SET game_type = $1, strategy_name = $2, description = $3, difficulty_level = $4,
           win_rate = $5, key_moves = $6, counter_strategies = $7, best_situations = $8, updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [game_type, strategy_name, description, difficulty_level, win_rate, key_moves, counter_strategies, best_situations, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Strategy not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating strategy:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete strategy
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM game_strategies WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Strategy not found' });
    }
    res.json({ message: 'Strategy deleted successfully' });
  } catch (error) {
    console.error('Error deleting strategy:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
