const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

// Get system stats (counts from all tables)
router.get('/stats', async (req, res) => {
  try {
    const tables = [
      { name: 'users', query: 'SELECT COUNT(*) FROM users' },
      { name: 'betting_analyses', query: 'SELECT COUNT(*) FROM betting_analyses' },
      { name: 'fantasy_teams', query: 'SELECT COUNT(*) FROM fantasy_teams' },
      { name: 'fantasy_players', query: 'SELECT COUNT(*) FROM fantasy_players' },
      { name: 'game_strategies', query: 'SELECT COUNT(*) FROM game_strategies' },
      { name: 'esports_stats', query: 'SELECT COUNT(*) FROM esports_stats' },
      { name: 'referee_incidents', query: 'SELECT COUNT(*) FROM referee_incidents' },
      { name: 'notifications', query: 'SELECT COUNT(*) FROM notifications' },
      { name: 'favorites', query: 'SELECT COUNT(*) FROM favorites' },
      { name: 'feedback', query: 'SELECT COUNT(*) FROM feedback' },
      { name: 'audit_logs', query: 'SELECT COUNT(*) FROM audit_logs' },
      { name: 'contact_messages', query: 'SELECT COUNT(*) FROM contact_messages' },
      { name: 'file_uploads', query: 'SELECT COUNT(*) FROM file_uploads' },
      { name: 'search_history', query: 'SELECT COUNT(*) FROM search_history' }
    ];

    const stats = {};

    for (const table of tables) {
      try {
        const result = await pool.query(table.query);
        stats[table.name] = parseInt(result.rows[0].count);
      } catch (err) {
        // Table may not exist yet, set count to 0
        stats[table.name] = 0;
      }
    }

    res.json(stats);
  } catch (error) {
    console.error('Error fetching system stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// List all users (paginated)
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const countResult = await pool.query('SELECT COUNT(*) FROM users');
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      'SELECT id, email, name, role, email_verified, created_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
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
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id, email, name',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully', user: result.rows[0] });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
