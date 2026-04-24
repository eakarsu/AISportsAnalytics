const express = require('express');
const pool = require('../db/pool');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user settings
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      'SELECT * FROM user_settings WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      // Return default settings if none exist yet
      return res.json({
        user_id: userId,
        theme: 'light',
        language: 'en',
        notifications_enabled: true,
        email_alerts: true,
        timezone: 'UTC'
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user settings:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user settings (upsert)
router.put('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      theme, language, notifications_enabled, email_alerts, timezone
    } = req.body;

    const result = await pool.query(
      `INSERT INTO user_settings (user_id, theme, language, notifications_enabled, email_alerts, timezone)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id)
       DO UPDATE SET
         theme = $2,
         language = $3,
         notifications_enabled = $4,
         email_alerts = $5,
         timezone = $6,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, theme, language, notifications_enabled, email_alerts, timezone]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user settings:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
