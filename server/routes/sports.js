/**
 * Sports Data Routes
 * Uses ESPN public API (no key required) and TheSportsDB free tier.
 * Endpoints:
 *   GET /api/sports/live-scores
 *   GET /api/sports/team/:id/stats
 *   GET /api/sports/leagues
 */
const express = require('express');
const https = require('https');

const router = express.Router();

// Simple in-memory cache to avoid hammering free-tier APIs
const cache = new Map();
const CACHE_TTL_MS = 60 * 1000; // 1 minute for live data

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data) {
  cache.set(key, { data, ts: Date.now() });
}

// Generic HTTPS GET helper
function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'AISportsAnalytics/1.0',
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Failed to parse API response'));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(8000, () => {
      req.destroy(new Error('Request timed out'));
    });
    req.end();
  });
}

// Map sport names to ESPN sport/league slugs
const ESPN_SPORT_MAP = {
  football: { sport: 'football', league: 'nfl' },
  nfl: { sport: 'football', league: 'nfl' },
  soccer: { sport: 'soccer', league: 'eng.1' },
  'soccer-epl': { sport: 'soccer', league: 'eng.1' },
  'soccer-laliga': { sport: 'soccer', league: 'esp.1' },
  'soccer-ucl': { sport: 'soccer', league: 'uefa.champions' },
  basketball: { sport: 'basketball', league: 'nba' },
  nba: { sport: 'basketball', league: 'nba' },
  baseball: { sport: 'baseball', league: 'mlb' },
  mlb: { sport: 'baseball', league: 'mlb' },
  hockey: { sport: 'hockey', league: 'nhl' },
  nhl: { sport: 'hockey', league: 'nhl' }
};

/**
 * GET /api/sports/live-scores
 * Query params:
 *   sport  — one of: football, basketball, soccer, baseball, hockey (default: basketball)
 *   league — optional league override (e.g. eng.1)
 */
router.get('/live-scores', async (req, res) => {
  try {
    const sportKey = (req.query.sport || 'basketball').toLowerCase();
    const mapping = ESPN_SPORT_MAP[sportKey] || ESPN_SPORT_MAP['basketball'];
    const league = req.query.league || mapping.league;
    const sport = mapping.sport;

    const cacheKey = `live-scores:${sport}:${league}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json({ success: true, source: 'cache', ...cached });
    }

    const url = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/scoreboard`;
    const data = await httpsGet(url);

    const events = (data.events || []).map((event) => {
      const competition = event.competitions?.[0];
      const home = competition?.competitors?.find(c => c.homeAway === 'home');
      const away = competition?.competitors?.find(c => c.homeAway === 'away');
      const status = competition?.status?.type;

      return {
        id: event.id,
        name: event.name,
        shortName: event.shortName,
        date: event.date,
        status: {
          state: status?.state,
          detail: status?.detail,
          completed: status?.completed
        },
        homeTeam: home ? {
          id: home.id,
          name: home.team?.displayName,
          abbreviation: home.team?.abbreviation,
          logo: home.team?.logo,
          score: home.score,
          record: home.records?.[0]?.summary
        } : null,
        awayTeam: away ? {
          id: away.id,
          name: away.team?.displayName,
          abbreviation: away.team?.abbreviation,
          logo: away.team?.logo,
          score: away.score,
          record: away.records?.[0]?.summary
        } : null,
        venue: competition?.venue?.fullName,
        broadcasts: competition?.broadcasts?.map(b => b.names).flat()
      };
    });

    const result = {
      sport,
      league,
      season: data.season,
      week: data.week,
      gamesCount: events.length,
      games: events,
      fetchedAt: new Date().toISOString()
    };

    setCache(cacheKey, result);

    res.json({ success: true, source: 'espn', ...result });
  } catch (error) {
    console.error('Live scores error:', error);
    res.status(502).json({
      error: 'Failed to fetch live scores from sports data provider',
      detail: error.message
    });
  }
});

/**
 * GET /api/sports/team/:id/stats
 * Query params:
 *   sport — one of: football, basketball, soccer, baseball, hockey (default: basketball)
 *
 * :id is the ESPN team ID
 */
router.get('/team/:id/stats', async (req, res) => {
  try {
    const teamId = req.params.id;
    const sportKey = (req.query.sport || 'basketball').toLowerCase();
    const mapping = ESPN_SPORT_MAP[sportKey] || ESPN_SPORT_MAP['basketball'];
    const league = req.query.league || mapping.league;
    const sport = mapping.sport;

    const cacheKey = `team-stats:${sport}:${league}:${teamId}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json({ success: true, source: 'cache', ...cached });
    }

    // Fetch team info and recent schedule in parallel
    const [teamData, scheduleData] = await Promise.allSettled([
      httpsGet(`https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/teams/${teamId}`),
      httpsGet(`https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/teams/${teamId}/schedule`)
    ]);

    if (teamData.status === 'rejected') {
      return res.status(502).json({ error: 'Failed to fetch team data', detail: teamData.reason?.message });
    }

    const team = teamData.value?.team;
    if (!team) {
      return res.status(404).json({ error: `Team ${teamId} not found for sport ${sport}/${league}` });
    }

    // Parse schedule for recent form
    const recentGames = [];
    if (scheduleData.status === 'fulfilled') {
      const events = scheduleData.value?.events || [];
      const completed = events.filter(e => e.competitions?.[0]?.status?.type?.completed);
      const recent = completed.slice(-10);

      for (const event of recent) {
        const competition = event.competitions?.[0];
        const teamComp = competition?.competitors?.find(c => c.id === teamId);
        const opponent = competition?.competitors?.find(c => c.id !== teamId);
        if (teamComp && opponent) {
          recentGames.push({
            date: event.date,
            opponent: opponent.team?.displayName,
            homeAway: teamComp.homeAway,
            score: teamComp.score,
            opponentScore: opponent.score,
            result: parseInt(teamComp.score) > parseInt(opponent.score) ? 'W' : 'L'
          });
        }
      }
    }

    // Calculate win/loss from recent form
    const wins = recentGames.filter(g => g.result === 'W').length;
    const losses = recentGames.filter(g => g.result === 'L').length;

    const result = {
      team: {
        id: team.id,
        name: team.displayName,
        abbreviation: team.abbreviation,
        nickname: team.nickname,
        location: team.location,
        color: team.color,
        alternateColor: team.alternateColor,
        logo: team.logos?.[0]?.href,
        venue: team.venue?.fullName,
        record: team.record?.items?.[0]?.summary,
        standingSummary: team.standingSummary
      },
      recentForm: {
        last10: recentGames,
        wins,
        losses,
        winPct: recentGames.length > 0 ? (wins / recentGames.length * 100).toFixed(1) : null
      },
      sport,
      league,
      fetchedAt: new Date().toISOString()
    };

    // Cache for 5 minutes for team stats
    cache.set(cacheKey, { data: result, ts: Date.now() - (CACHE_TTL_MS * 4) }); // 5min TTL trick
    setCache(cacheKey, result);

    res.json({ success: true, source: 'espn', ...result });
  } catch (error) {
    console.error('Team stats error:', error);
    res.status(502).json({
      error: 'Failed to fetch team stats from sports data provider',
      detail: error.message
    });
  }
});

/**
 * GET /api/sports/leagues
 * Returns supported leagues/sports
 */
router.get('/leagues', (req, res) => {
  res.json({
    success: true,
    supported: Object.entries(ESPN_SPORT_MAP).map(([key, val]) => ({
      key,
      sport: val.sport,
      league: val.league
    })),
    notes: {
      livescores: 'GET /api/sports/live-scores?sport=basketball',
      teamStats: 'GET /api/sports/team/:espnTeamId/stats?sport=basketball',
      dataSource: 'ESPN public API (no key required)'
    }
  });
});

module.exports = router;
