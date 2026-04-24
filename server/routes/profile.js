const express = require('express');
const pool = require('../db/pool');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      'SELECT * FROM user_profiles WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      // Return a default profile if none exists yet
      return res.json({
        user_id: userId,
        display_name: null,
        bio: null,
        avatar_url: null,
        phone: null,
        location: null,
        favorite_sport: null,
        experience_level: null
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user profile (upsert)
router.put('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      display_name, bio, avatar_url, phone,
      location, favorite_sport, experience_level
    } = req.body;

    const result = await pool.query(
      `INSERT INTO user_profiles (user_id, display_name, bio, avatar_url, phone, location, favorite_sport, experience_level)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (user_id)
       DO UPDATE SET
         display_name = $2,
         bio = $3,
         avatar_url = $4,
         phone = $5,
         location = $6,
         favorite_sport = $7,
         experience_level = $8,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, display_name, bio, avatar_url, phone, location, favorite_sport, experience_level]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
