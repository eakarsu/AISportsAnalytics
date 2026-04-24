const express = require('express');
const pool = require('../db/pool');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all favorites for user (paginated)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM favorites WHERE user_id = $1',
      [userId]
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      'SELECT * FROM favorites WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [userId, limit, offset]
    );

    res.json({
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single favorite
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM favorites WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Favorite not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching favorite:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create favorite
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { entity_type, entity_id, entity_name, sport, notes } = req.body;

    const result = await pool.query(
      `INSERT INTO favorites (user_id, entity_type, entity_id, entity_name, sport, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, entity_type, entity_id, entity_name, sport, notes]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating favorite:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update favorite
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { entity_type, entity_id, entity_name, sport, notes } = req.body;

    const result = await pool.query(
      `UPDATE favorites
       SET entity_type = $1, entity_id = $2, entity_name = $3, sport = $4, notes = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [entity_type, entity_id, entity_name, sport, notes, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Favorite not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating favorite:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete favorite
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM favorites WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Favorite not found' });
    }

    res.json({ message: 'Favorite deleted successfully' });
  } catch (error) {
    console.error('Error deleting favorite:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
