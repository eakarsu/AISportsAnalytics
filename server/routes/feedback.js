const express = require('express');
const pool = require('../db/pool');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all feedback (paginated)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const countResult = await pool.query('SELECT COUNT(*) FROM feedback');
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      'SELECT * FROM feedback ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
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
    console.error('Error fetching feedback:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single feedback
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM feedback WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create feedback
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, subject, message, rating } = req.body;

    const result = await pool.query(
      `INSERT INTO feedback (user_id, type, subject, message, rating)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, type, subject, message, rating]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating feedback:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update feedback
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, subject, message, rating, status } = req.body;

    const result = await pool.query(
      `UPDATE feedback
       SET type = $1, subject = $2, message = $3, rating = $4, status = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [type, subject, message, rating, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating feedback:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete feedback
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM feedback WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
