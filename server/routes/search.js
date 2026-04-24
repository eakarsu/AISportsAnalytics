const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

// Search across all entity types
router.get('/', async (req, res) => {
  try {
    const { q, type } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query (q) is required' });
    }

    const searchTerm = '%' + q.trim() + '%';
    const searchType = type || 'all';
    const results = {};

    // Search betting analyses
    if (searchType === 'all' || searchType === 'betting') {
      const bettingResult = await pool.query(
        `SELECT id, match_name, sport, team_a, team_b, predicted_winner, analysis_notes, created_at,
                'betting' AS source_type
         FROM betting_analyses
         WHERE match_name ILIKE $1 OR sport ILIKE $1 OR team_a ILIKE $1 OR team_b ILIKE $1
               OR predicted_winner ILIKE $1 OR analysis_notes ILIKE $1
         ORDER BY created_at DESC
         LIMIT 20`,
        [searchTerm]
      );
      results.betting = bettingResult.rows;
    }

    // Search fantasy teams
    if (searchType === 'all' || searchType === 'fantasy') {
      const fantasyResult = await pool.query(
        `SELECT id, team_name, sport, formation, strategy, created_at,
                'fantasy' AS source_type
         FROM fantasy_teams
         WHERE team_name ILIKE $1 OR sport ILIKE $1 OR formation ILIKE $1 OR strategy ILIKE $1
         ORDER BY created_at DESC
         LIMIT 20`,
        [searchTerm]
      );
      results.fantasy = fantasyResult.rows;
    }

    // Search game strategies
    if (searchType === 'all' || searchType === 'strategy') {
      const strategyResult = await pool.query(
        `SELECT id, game_type, strategy_name, description, difficulty_level, key_moves, created_at,
                'strategy' AS source_type
         FROM game_strategies
         WHERE game_type ILIKE $1 OR strategy_name ILIKE $1 OR description ILIKE $1
               OR key_moves ILIKE $1 OR counter_strategies ILIKE $1 OR best_situations ILIKE $1
         ORDER BY created_at DESC
         LIMIT 20`,
        [searchTerm]
      );
      results.strategy = strategyResult.rows;
    }

    // Search esports stats
    if (searchType === 'all' || searchType === 'esports') {
      const esportsResult = await pool.query(
        `SELECT id, player_name, game_title, team_name, region, role, created_at,
                'esports' AS source_type
         FROM esports_stats
         WHERE player_name ILIKE $1 OR game_title ILIKE $1 OR team_name ILIKE $1
               OR region ILIKE $1 OR role ILIKE $1
         ORDER BY created_at DESC
         LIMIT 20`,
        [searchTerm]
      );
      results.esports = esportsResult.rows;
    }

    // Search referee incidents
    if (searchType === 'all' || searchType === 'referee') {
      const refereeResult = await pool.query(
        `SELECT id, match_name, sport, incident_type, description, players_involved, ai_ruling, created_at,
                'referee' AS source_type
         FROM referee_incidents
         WHERE match_name ILIKE $1 OR sport ILIKE $1 OR incident_type ILIKE $1
               OR description ILIKE $1 OR players_involved ILIKE $1 OR ai_ruling ILIKE $1
         ORDER BY created_at DESC
         LIMIT 20`,
        [searchTerm]
      );
      results.referee = refereeResult.rows;
    }

    // Calculate total results count
    let totalResults = 0;
    for (const key of Object.keys(results)) {
      totalResults += results[key].length;
    }

    // Save to search history (fire-and-forget, don't block response)
    pool.query(
      `INSERT INTO search_history (query, entity_type, results_count)
       VALUES ($1, $2, $3)`,
      [q.trim(), searchType, totalResults]
    ).catch(err => console.error('Error saving search history:', err));

    res.json({
      query: q.trim(),
      type: searchType,
      total_results: totalResults,
      results
    });
  } catch (error) {
    console.error('Error performing search:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
