const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

// Get all contact messages (paginated)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const countResult = await pool.query('SELECT COUNT(*) FROM contact_messages');
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      'SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT $1 OFFSET $2',
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
    console.error('Error fetching contact messages:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single contact message
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM contact_messages WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contact message not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching contact message:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create contact message
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message, category } = req.body;

    const result = await pool.query(
      `INSERT INTO contact_messages (name, email, subject, message, category)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, email, subject, message, category]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating contact message:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update contact message (for admin replies)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, subject, message, category, status, admin_reply } = req.body;

    const result = await pool.query(
      `UPDATE contact_messages
       SET name = $1, email = $2, subject = $3, message = $4, category = $5,
           status = $6, admin_reply = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [name, email, subject, message, category, status, admin_reply, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contact message not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating contact message:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete contact message
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM contact_messages WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contact message not found' });
    }

    res.json({ message: 'Contact message deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact message:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
