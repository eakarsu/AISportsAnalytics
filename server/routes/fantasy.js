const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

// Get all fantasy teams (with pagination)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 0;
    if (page > 0 && limit > 0) {
      const offset = (page - 1) * limit;
      const countResult = await pool.query('SELECT COUNT(*) FROM fantasy_teams');
      const total = parseInt(countResult.rows[0].count);
      const result = await pool.query('SELECT * FROM fantasy_teams ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
      return res.json({ data: result.rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    }
    const result = await pool.query('SELECT * FROM fantasy_teams ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching fantasy teams:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single fantasy team with players
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const teamResult = await pool.query('SELECT * FROM fantasy_teams WHERE id = $1', [id]);
    if (teamResult.rows.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const playersResult = await pool.query('SELECT * FROM fantasy_players WHERE team_id = $1', [id]);

    res.json({
      ...teamResult.rows[0],
      players: playersResult.rows
    });
  } catch (error) {
    console.error('Error fetching fantasy team:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create fantasy team
router.post('/', async (req, res) => {
  try {
    const { team_name, sport, budget, formation, strategy, players } = req.body;

    const teamResult = await pool.query(
      `INSERT INTO fantasy_teams (team_name, sport, budget, formation, strategy, player_count)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [team_name, sport, budget, formation, strategy, players?.length || 0]
    );

    const team = teamResult.rows[0];

    // Add players if provided
    if (players && players.length > 0) {
      for (const player of players) {
        await pool.query(
          `INSERT INTO fantasy_players (team_id, player_name, position, real_team, price, projected_points, form_rating)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [team.id, player.player_name, player.position, player.real_team, player.price, player.projected_points, player.form_rating]
        );
      }
    }

    res.status(201).json(team);
  } catch (error) {
    console.error('Error creating fantasy team:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update fantasy team
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { team_name, sport, budget, formation, strategy, total_points, optimization_score } = req.body;

    const result = await pool.query(
      `UPDATE fantasy_teams
       SET team_name = $1, sport = $2, budget = $3, formation = $4, strategy = $5,
           total_points = $6, optimization_score = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [team_name, sport, budget, formation, strategy, total_points, optimization_score, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating fantasy team:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete fantasy team
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM fantasy_teams WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }
    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Error deleting fantasy team:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add player to team
router.post('/:id/players', async (req, res) => {
  try {
    const { id } = req.params;
    const { player_name, position, real_team, price, projected_points, form_rating } = req.body;

    const result = await pool.query(
      `INSERT INTO fantasy_players (team_id, player_name, position, real_team, price, projected_points, form_rating)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, player_name, position, real_team, price, projected_points, form_rating]
    );

    // Update player count
    await pool.query(
      'UPDATE fantasy_teams SET player_count = player_count + 1 WHERE id = $1',
      [id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding player:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
