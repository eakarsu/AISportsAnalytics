require('dotenv').config();
const pool = require('./db/pool');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const setupDatabase = require('./db/setup');

function requireDestructiveSeed() {
  if (process.env.ALLOW_DESTRUCTIVE_SEED !== '1') throw new Error('Set ALLOW_DESTRUCTIVE_SEED=1 to reset and seed the database');
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  if ((process.env.SEED_ADMIN_PASSWORD || '').length < 12) throw new Error('SEED_ADMIN_PASSWORD must contain at least 12 characters');
  return process.env.SEED_ADMIN_PASSWORD;
}

const seedData = async () => {
  try {
    const seedPassword = requireDestructiveSeed();
    console.log('Starting database seeding...');

    // Setup tables first
    await setupDatabase();

    // Clear existing data
    await pool.query(`
      TRUNCATE TABLE
        search_history, file_uploads, contact_messages, audit_logs, feedback,
        favorites, notifications, user_settings, user_profiles, email_verifications,
        password_resets, fantasy_players, fantasy_teams, betting_analyses,
        game_strategies, esports_stats, referee_incidents, users
      RESTART IDENTITY CASCADE
    `);

    // Seed demo user and admin user
    const hashedPassword = await bcrypt.hash(seedPassword, 12);
    const adminPassword = await bcrypt.hash(seedPassword, 12);

    const demoUser = await pool.query(
      "INSERT INTO users (email, password, name, role, email_verified) VALUES ($1, $2, $3, 'user', true) RETURNING id",
      [process.env.DEMO_EMAIL || 'demo@sportsanalytics.com', hashedPassword, 'Demo User']
    );
    const demoUserId = demoUser.rows[0].id;

    const adminUser = await pool.query(
      "INSERT INTO users (email, password, name, role, email_verified) VALUES ($1, $2, $3, 'admin', true) RETURNING id",
      ['admin@sportsanalytics.com', adminPassword, 'Admin User']
    );
    const adminUserId = adminUser.rows[0].id;
    console.log('Users created');

    // Seed User Profiles (2 items)
    await pool.query(
      `INSERT INTO user_profiles (user_id, display_name, bio, avatar_url, phone, location, favorite_sport, experience_level) VALUES
       ($1, 'Demo User', 'Sports analytics enthusiast and data-driven bettor. Love exploring AI predictions.', null, '+1-555-0100', 'New York, USA', 'Football', 'Intermediate'),
       ($2, 'Admin User', 'Platform administrator and sports analytics expert.', null, '+1-555-0200', 'San Francisco, USA', 'Basketball', 'Expert')`,
      [demoUserId, adminUserId]
    );
    console.log('User profiles seeded');

    // Seed User Settings (2 items)
    await pool.query(
      `INSERT INTO user_settings (user_id, theme, language, notifications_enabled, email_alerts, timezone) VALUES
       ($1, 'dark', 'en', true, true, 'America/New_York'),
       ($2, 'dark', 'en', true, true, 'America/Los_Angeles')`,
      [demoUserId, adminUserId]
    );
    console.log('User settings seeded');

    // Seed Password Resets (3 items - expired samples)
    await pool.query(
      `INSERT INTO password_resets (user_id, token, expires_at, used) VALUES
       ($1, $2, NOW() - INTERVAL '2 hours', true),
       ($1, $3, NOW() - INTERVAL '1 day', false),
       ($4, $5, NOW() - INTERVAL '3 hours', true)`,
      [demoUserId, crypto.randomBytes(32).toString('hex'), crypto.randomBytes(32).toString('hex'), adminUserId, crypto.randomBytes(32).toString('hex')]
    );
    console.log('Password resets seeded');

    // Seed Email Verifications (2 items)
    await pool.query(
      `INSERT INTO email_verifications (user_id, token, verified) VALUES
       ($1, $2, true),
       ($3, $4, true)`,
      [demoUserId, crypto.randomBytes(32).toString('hex'), adminUserId, crypto.randomBytes(32).toString('hex')]
    );
    console.log('Email verifications seeded');

    // Seed Betting Analyses (16 items)
    const bettingData = [
      { match_name: 'Manchester United vs Liverpool', sport: 'Football', team_a: 'Manchester United', team_b: 'Liverpool', odds_team_a: 2.80, odds_team_b: 2.50, odds_draw: 3.40, predicted_winner: 'Liverpool', confidence_score: 68.5, analysis_notes: 'Liverpool in better form, strong away record', match_date: '2024-02-15' },
      { match_name: 'Lakers vs Warriors', sport: 'Basketball', team_a: 'LA Lakers', team_b: 'Golden State Warriors', odds_team_a: 1.95, odds_team_b: 1.90, odds_draw: null, predicted_winner: 'Golden State Warriors', confidence_score: 55.2, analysis_notes: 'Close matchup, Warriors slight edge at home', match_date: '2024-02-16' },
      { match_name: 'Real Madrid vs Barcelona', sport: 'Football', team_a: 'Real Madrid', team_b: 'Barcelona', odds_team_a: 2.20, odds_team_b: 3.10, odds_draw: 3.50, predicted_winner: 'Real Madrid', confidence_score: 62.0, analysis_notes: 'El Clasico - Madrid favorites at Bernabeu', match_date: '2024-02-18' },
      { match_name: 'Djokovic vs Alcaraz', sport: 'Tennis', team_a: 'Novak Djokovic', team_b: 'Carlos Alcaraz', odds_team_a: 1.75, odds_team_b: 2.10, odds_draw: null, predicted_winner: 'Novak Djokovic', confidence_score: 58.0, analysis_notes: 'Hard court favors Djokovic experience', match_date: '2024-02-20' },
      { match_name: 'Chiefs vs 49ers', sport: 'American Football', team_a: 'Kansas City Chiefs', team_b: 'San Francisco 49ers', odds_team_a: 1.85, odds_team_b: 2.00, odds_draw: null, predicted_winner: 'Kansas City Chiefs', confidence_score: 54.5, analysis_notes: 'Mahomes factor gives Chiefs edge', match_date: '2024-02-11' },
      { match_name: 'Bayern Munich vs PSG', sport: 'Football', team_a: 'Bayern Munich', team_b: 'PSG', odds_team_a: 2.10, odds_team_b: 3.40, odds_draw: 3.60, predicted_winner: 'Bayern Munich', confidence_score: 65.0, analysis_notes: 'Champions League knockout - Bayern strong at home', match_date: '2024-02-21' },
      { match_name: 'Celtics vs Bucks', sport: 'Basketball', team_a: 'Boston Celtics', team_b: 'Milwaukee Bucks', odds_team_a: 1.80, odds_team_b: 2.05, odds_draw: null, predicted_winner: 'Boston Celtics', confidence_score: 60.0, analysis_notes: 'Celtics defensive strength key factor', match_date: '2024-02-22' },
      { match_name: 'Nadal vs Medvedev', sport: 'Tennis', team_a: 'Rafael Nadal', team_b: 'Daniil Medvedev', odds_team_a: 2.30, odds_team_b: 1.65, odds_draw: null, predicted_winner: 'Daniil Medvedev', confidence_score: 63.0, analysis_notes: 'Indoor hard court favors Medvedev', match_date: '2024-02-23' },
      { match_name: 'Man City vs Arsenal', sport: 'Football', team_a: 'Manchester City', team_b: 'Arsenal', odds_team_a: 1.70, odds_team_b: 4.50, odds_draw: 4.00, predicted_winner: 'Manchester City', confidence_score: 72.0, analysis_notes: 'City dominant at Etihad, title race decider', match_date: '2024-02-25' },
      { match_name: 'Heat vs Nuggets', sport: 'Basketball', team_a: 'Miami Heat', team_b: 'Denver Nuggets', odds_team_a: 2.40, odds_team_b: 1.55, odds_draw: null, predicted_winner: 'Denver Nuggets', confidence_score: 70.0, analysis_notes: 'Altitude advantage for Nuggets', match_date: '2024-02-26' },
      { match_name: 'Inter Milan vs Juventus', sport: 'Football', team_a: 'Inter Milan', team_b: 'Juventus', odds_team_a: 2.00, odds_team_b: 3.60, odds_draw: 3.50, predicted_winner: 'Inter Milan', confidence_score: 64.0, analysis_notes: 'Derby dItalia - Inter in superior form', match_date: '2024-02-27' },
      { match_name: 'Sinner vs Zverev', sport: 'Tennis', team_a: 'Jannik Sinner', team_b: 'Alexander Zverev', odds_team_a: 1.60, odds_team_b: 2.35, odds_draw: null, predicted_winner: 'Jannik Sinner', confidence_score: 66.0, analysis_notes: 'Sinner riding momentum from AO win', match_date: '2024-02-28' },
      { match_name: 'Bills vs Ravens', sport: 'American Football', team_a: 'Buffalo Bills', team_b: 'Baltimore Ravens', odds_team_a: 2.10, odds_team_b: 1.75, odds_draw: null, predicted_winner: 'Baltimore Ravens', confidence_score: 58.0, analysis_notes: 'Ravens running game advantage', match_date: '2024-03-01' },
      { match_name: 'Atletico Madrid vs Dortmund', sport: 'Football', team_a: 'Atletico Madrid', team_b: 'Borussia Dortmund', odds_team_a: 2.30, odds_team_b: 3.00, odds_draw: 3.40, predicted_winner: 'Atletico Madrid', confidence_score: 56.0, analysis_notes: 'Tight defensive battle expected', match_date: '2024-03-02' },
      { match_name: 'Suns vs Mavericks', sport: 'Basketball', team_a: 'Phoenix Suns', team_b: 'Dallas Mavericks', odds_team_a: 1.90, odds_team_b: 1.95, odds_draw: null, predicted_winner: 'Phoenix Suns', confidence_score: 52.0, analysis_notes: 'Coin flip game, slight home edge', match_date: '2024-03-03' },
      { match_name: 'Tottenham vs Chelsea', sport: 'Football', team_a: 'Tottenham', team_b: 'Chelsea', odds_team_a: 2.60, odds_team_b: 2.70, odds_draw: 3.40, predicted_winner: 'Tottenham', confidence_score: 48.0, analysis_notes: 'London derby - form unpredictable', match_date: '2024-03-04' }
    ];

    for (const bet of bettingData) {
      await pool.query(
        `INSERT INTO betting_analyses (match_name, sport, team_a, team_b, odds_team_a, odds_team_b, odds_draw, predicted_winner, confidence_score, analysis_notes, match_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [bet.match_name, bet.sport, bet.team_a, bet.team_b, bet.odds_team_a, bet.odds_team_b, bet.odds_draw, bet.predicted_winner, bet.confidence_score, bet.analysis_notes, bet.match_date]
      );
    }
    console.log('Betting analyses seeded (16 items)');

    // Seed Fantasy Teams (16 items)
    const fantasyTeams = [
      { team_name: 'Dream XI Champions', sport: 'Football', budget: 100000000, total_points: 2450, player_count: 11, formation: '4-3-3', strategy: 'Balanced attack with strong midfield', optimization_score: 87.5 },
      { team_name: 'NBA All Stars', sport: 'Basketball', budget: 150000000, total_points: 1890, player_count: 12, formation: null, strategy: 'High scoring guards with rim protection', optimization_score: 82.0 },
      { team_name: 'Premier League Elite', sport: 'Football', budget: 100000000, total_points: 2680, player_count: 15, formation: '3-5-2', strategy: 'Wing play focused', optimization_score: 91.2 },
      { team_name: 'La Liga Masters', sport: 'Football', budget: 95000000, total_points: 2320, player_count: 11, formation: '4-4-2', strategy: 'Traditional formation, clinical finishing', optimization_score: 85.0 },
      { team_name: 'Hoops Dynasty', sport: 'Basketball', budget: 140000000, total_points: 2100, player_count: 13, formation: null, strategy: 'Three-point shooting focus', optimization_score: 88.5 },
      { team_name: 'Serie A Legends', sport: 'Football', budget: 90000000, total_points: 2150, player_count: 11, formation: '5-3-2', strategy: 'Defensive solidity with counter-attacks', optimization_score: 79.0 },
      { team_name: 'Bundesliga Force', sport: 'Football', budget: 85000000, total_points: 2280, player_count: 11, formation: '4-2-3-1', strategy: 'High pressing, gegenpressing', optimization_score: 86.0 },
      { team_name: 'MLB Sluggers', sport: 'Baseball', budget: 200000000, total_points: 1560, player_count: 25, formation: null, strategy: 'Power hitting lineup', optimization_score: 78.5 },
      { team_name: 'NHL Ice Kings', sport: 'Hockey', budget: 80000000, total_points: 1780, player_count: 20, formation: null, strategy: 'Speed and skill lines', optimization_score: 83.0 },
      { team_name: 'Fantasy FC United', sport: 'Football', budget: 100000000, total_points: 2520, player_count: 11, formation: '4-3-3', strategy: 'Possession based football', optimization_score: 89.5 },
      { team_name: 'Court Kings', sport: 'Basketball', budget: 155000000, total_points: 2050, player_count: 12, formation: null, strategy: 'Inside-out offense', optimization_score: 84.0 },
      { team_name: 'Champions Draft', sport: 'Football', budget: 105000000, total_points: 2390, player_count: 11, formation: '3-4-3', strategy: 'Attacking wing-backs', optimization_score: 87.0 },
      { team_name: 'Gridiron Giants', sport: 'American Football', budget: 180000000, total_points: 1420, player_count: 16, formation: null, strategy: 'Balanced offense and defense', optimization_score: 81.0 },
      { team_name: 'Cricket XI Pro', sport: 'Cricket', budget: 90000000, total_points: 1950, player_count: 11, formation: null, strategy: 'All-rounders focused', optimization_score: 85.5 },
      { team_name: 'Diamond Dream Team', sport: 'Baseball', budget: 195000000, total_points: 1680, player_count: 25, formation: null, strategy: 'Contact hitters with speed', optimization_score: 80.0 },
      { team_name: 'Ligue 1 Lions', sport: 'Football', budget: 88000000, total_points: 2180, player_count: 11, formation: '4-3-3', strategy: 'Quick transitions', optimization_score: 82.5 }
    ];

    for (const team of fantasyTeams) {
      await pool.query(
        `INSERT INTO fantasy_teams (team_name, sport, budget, total_points, player_count, formation, strategy, optimization_score)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [team.team_name, team.sport, team.budget, team.total_points, team.player_count, team.formation, team.strategy, team.optimization_score]
      );
    }
    console.log('Fantasy teams seeded (16 items)');

    // Seed Game Strategies (16 items)
    const strategies = [
      { game_type: 'Chess', strategy_name: 'Sicilian Defense', description: 'Aggressive counter-attacking defense against 1.e4', difficulty_level: 'Advanced', win_rate: 54.2, key_moves: '1.e4 c5 - Black fights for center control asymmetrically', counter_strategies: 'Anti-Sicilian systems like 2.Nc3 or 2.c3', best_situations: 'When seeking winning chances with black' },
      { game_type: 'Poker', strategy_name: 'Tight Aggressive (TAG)', description: 'Play fewer hands but play them aggressively', difficulty_level: 'Intermediate', win_rate: 62.0, key_moves: 'Raise premium hands, fold marginal hands preflop', counter_strategies: 'Loose aggressive players can exploit predictability', best_situations: 'Tournament play, inexperienced opponents' },
      { game_type: 'Chess', strategy_name: 'Italian Game', description: 'Classical opening targeting the weak f7 square', difficulty_level: 'Beginner', win_rate: 52.5, key_moves: '1.e4 e5 2.Nf3 Nc6 3.Bc4', counter_strategies: 'Two Knights Defense or Giuoco Piano', best_situations: 'Solid positional play, beginners' },
      { game_type: 'Poker', strategy_name: 'Small Ball Poker', description: 'Control pot sizes while maximizing fold equity', difficulty_level: 'Advanced', win_rate: 58.5, key_moves: 'Small raises and bets, frequent cbets, position play', counter_strategies: 'Large 3-bets, polarized ranges', best_situations: 'Deep stack tournaments' },
      { game_type: 'Chess', strategy_name: 'London System', description: 'Solid universal system for white', difficulty_level: 'Beginner', win_rate: 51.8, key_moves: '1.d4 and 2.Bf4 setup regardless of black response', counter_strategies: 'Early c5 breaks, aggressive pawn storms', best_situations: 'Avoiding theory, solid positions' },
      { game_type: 'Poker', strategy_name: 'GTO Play', description: 'Game theory optimal unexploitable strategy', difficulty_level: 'Expert', win_rate: 55.0, key_moves: 'Balanced ranges, mixed frequencies, solver-approved lines', counter_strategies: 'Exploitative adjustments against fish', best_situations: 'Against strong regulars' },
      { game_type: 'Chess', strategy_name: 'Kings Indian Defense', description: 'Hypermodern defense with kingside attack plans', difficulty_level: 'Advanced', win_rate: 48.5, key_moves: '1.d4 Nf6 2.c4 g6 - Fianchetto and f5 break', counter_strategies: 'Bayonet attack, positional squeeze', best_situations: 'Complex tactical battles' },
      { game_type: 'Poker', strategy_name: 'LAG Strategy', description: 'Loose aggressive - play many hands aggressively', difficulty_level: 'Expert', win_rate: 56.0, key_moves: 'Wide opening ranges, frequent 3-bets, relentless pressure', counter_strategies: 'Tight trapping, slow plays', best_situations: 'Cash games, weak passive players' },
      { game_type: 'Chess', strategy_name: 'Queens Gambit', description: 'Classic opening offering pawn sacrifice for development', difficulty_level: 'Intermediate', win_rate: 53.0, key_moves: '1.d4 d5 2.c4 - Fight for central control', counter_strategies: 'Queens Gambit Declined, Slav Defense', best_situations: 'Positional mastery required' },
      { game_type: 'Poker', strategy_name: 'Short Stack Strategy', description: 'Simplified push/fold game with limited chips', difficulty_level: 'Beginner', win_rate: 51.0, key_moves: 'Push or fold based on M-ratio and hand strength', counter_strategies: 'ICM pressure, isolation raises', best_situations: 'Tournament short stacks, SNGs' },
      { game_type: 'Chess', strategy_name: 'Caro-Kann Defense', description: 'Solid defense maintaining pawn structure', difficulty_level: 'Intermediate', win_rate: 50.5, key_moves: '1.e4 c6 - Support d5 push solidly', counter_strategies: 'Advance variation, Fantasy variation', best_situations: 'Solid drawing chances with black' },
      { game_type: 'Poker', strategy_name: 'Pot Control', description: 'Managing pot sizes based on hand strength', difficulty_level: 'Intermediate', win_rate: 54.0, key_moves: 'Check-call with medium hands, small bets for value', counter_strategies: 'Aggressive overbetting', best_situations: 'Out of position with marginal hands' },
      { game_type: 'Chess', strategy_name: 'English Opening', description: 'Flexible flank opening with many transpositions', difficulty_level: 'Intermediate', win_rate: 52.0, key_moves: '1.c4 - Control d5 square, flexible development', counter_strategies: 'Symmetrical English, reversed Sicilian', best_situations: 'Avoiding main line theory' },
      { game_type: 'Poker', strategy_name: 'Bluff Catching', description: 'Identifying and calling opponents bluffs', difficulty_level: 'Advanced', win_rate: 48.0, key_moves: 'Read timing tells, blockers analysis, range assessment', counter_strategies: 'Value heavy ranges', best_situations: 'Against aggressive bluffers' },
      { game_type: 'Chess', strategy_name: 'French Defense', description: 'Solid counterattacking defense with central tension', difficulty_level: 'Intermediate', win_rate: 49.8, key_moves: '1.e4 e6 - Prepare d5 break', counter_strategies: 'Exchange variation, Tarrasch variation', best_situations: 'Strategic complexity desired' },
      { game_type: 'Poker', strategy_name: 'Check-Raise Strategy', description: 'Powerful tool combining deception with aggression', difficulty_level: 'Advanced', win_rate: 60.0, key_moves: 'Check to induce bet, then raise for value or bluff', counter_strategies: 'Checking back, pot control', best_situations: 'Strong made hands out of position' }
    ];

    for (const strategy of strategies) {
      await pool.query(
        `INSERT INTO game_strategies (game_type, strategy_name, description, difficulty_level, win_rate, key_moves, counter_strategies, best_situations)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [strategy.game_type, strategy.strategy_name, strategy.description, strategy.difficulty_level, strategy.win_rate, strategy.key_moves, strategy.counter_strategies, strategy.best_situations]
      );
    }
    console.log('Game strategies seeded (16 items)');

    // Seed Esports Stats (16 items)
    const esportsStats = [
      { player_name: 'Faker', game_title: 'League of Legends', team_name: 'T1', region: 'Korea', role: 'Mid Lane', matches_played: 1250, wins: 876, losses: 374, kda_ratio: 5.21, avg_score: 89.5, ranking: 1, earnings: 1500000 },
      { player_name: 's1mple', game_title: 'CS2', team_name: 'NAVI', region: 'CIS', role: 'AWPer', matches_played: 980, wins: 612, losses: 368, kda_ratio: 1.35, avg_score: 91.2, ranking: 1, earnings: 2100000 },
      { player_name: 'Bugha', game_title: 'Fortnite', team_name: 'Sentinels', region: 'North America', role: 'Solo', matches_played: 450, wins: 89, losses: 361, kda_ratio: 3.80, avg_score: 85.0, ranking: 3, earnings: 3500000 },
      { player_name: 'Caps', game_title: 'League of Legends', team_name: 'G2 Esports', region: 'Europe', role: 'Mid Lane', matches_played: 820, wins: 534, losses: 286, kda_ratio: 4.65, avg_score: 86.8, ranking: 5, earnings: 850000 },
      { player_name: 'ZywOo', game_title: 'CS2', team_name: 'Vitality', region: 'Europe', role: 'AWPer', matches_played: 750, wins: 487, losses: 263, kda_ratio: 1.28, avg_score: 88.9, ranking: 2, earnings: 1800000 },
      { player_name: 'TenZ', game_title: 'Valorant', team_name: 'Sentinels', region: 'North America', role: 'Duelist', matches_played: 420, wins: 268, losses: 152, kda_ratio: 1.45, avg_score: 84.2, ranking: 4, earnings: 950000 },
      { player_name: 'Yay', game_title: 'Valorant', team_name: 'Cloud9', region: 'North America', role: 'Duelist', matches_played: 380, wins: 241, losses: 139, kda_ratio: 1.52, avg_score: 87.1, ranking: 2, earnings: 780000 },
      { player_name: 'ShowMaker', game_title: 'League of Legends', team_name: 'DWG KIA', region: 'Korea', role: 'Mid Lane', matches_played: 680, wins: 462, losses: 218, kda_ratio: 4.89, avg_score: 88.3, ranking: 2, earnings: 1200000 },
      { player_name: 'NiKo', game_title: 'CS2', team_name: 'G2 Esports', region: 'Europe', role: 'Rifler', matches_played: 1100, wins: 682, losses: 418, kda_ratio: 1.22, avg_score: 85.6, ranking: 5, earnings: 1600000 },
      { player_name: 'Mongraal', game_title: 'Fortnite', team_name: 'FaZe Clan', region: 'Europe', role: 'Duo/Trio', matches_played: 520, wins: 78, losses: 442, kda_ratio: 3.20, avg_score: 79.5, ranking: 8, earnings: 1400000 },
      { player_name: 'Uzi', game_title: 'League of Legends', team_name: 'RNG', region: 'China', role: 'Bot Lane', matches_played: 950, wins: 608, losses: 342, kda_ratio: 4.12, avg_score: 85.2, ranking: 7, earnings: 980000 },
      { player_name: 'device', game_title: 'CS2', team_name: 'Astralis', region: 'Europe', role: 'AWPer', matches_played: 1050, wins: 714, losses: 336, kda_ratio: 1.18, avg_score: 84.8, ranking: 6, earnings: 1750000 },
      { player_name: 'Aspas', game_title: 'Valorant', team_name: 'LOUD', region: 'Brazil', role: 'Duelist', matches_played: 290, wins: 192, losses: 98, kda_ratio: 1.38, avg_score: 86.5, ranking: 3, earnings: 620000 },
      { player_name: 'Chovy', game_title: 'League of Legends', team_name: 'Gen.G', region: 'Korea', role: 'Mid Lane', matches_played: 580, wins: 385, losses: 195, kda_ratio: 5.85, avg_score: 90.1, ranking: 3, earnings: 750000 },
      { player_name: 'm0NESY', game_title: 'CS2', team_name: 'G2 Esports', region: 'CIS', role: 'AWPer', matches_played: 320, wins: 198, losses: 122, kda_ratio: 1.31, avg_score: 87.8, ranking: 4, earnings: 450000 },
      { player_name: 'Kyedae', game_title: 'Valorant', team_name: '100 Thieves', region: 'North America', role: 'Controller', matches_played: 180, wins: 95, losses: 85, kda_ratio: 1.05, avg_score: 72.3, ranking: 45, earnings: 120000 }
    ];

    for (const player of esportsStats) {
      await pool.query(
        `INSERT INTO esports_stats (player_name, game_title, team_name, region, role, matches_played, wins, losses, kda_ratio, avg_score, ranking, earnings)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [player.player_name, player.game_title, player.team_name, player.region, player.role, player.matches_played, player.wins, player.losses, player.kda_ratio, player.avg_score, player.ranking, player.earnings]
      );
    }
    console.log('Esports stats seeded (16 items)');

    // Seed Referee Incidents (16 items)
    const refereeIncidents = [
      { match_name: 'World Cup Final 2022', sport: 'Football', incident_type: 'Handball', description: 'Defender blocked shot with arm extended away from body in penalty area', time_occurred: '65:32', players_involved: 'Ousmane Dembele', severity: 'Major', ai_ruling: 'Penalty - Arm in unnatural position', actual_ruling: 'Penalty Awarded', video_url: null },
      { match_name: 'Lakers vs Celtics G7', sport: 'Basketball', incident_type: 'Flagrant Foul', description: 'Hard contact to head during layup attempt', time_occurred: 'Q4 2:15', players_involved: 'Player A on Player B', severity: 'Major', ai_ruling: 'Flagrant 1 - Unnecessary contact but not excessive', actual_ruling: 'Flagrant 1', video_url: null },
      { match_name: 'UCL Semi-Final', sport: 'Football', incident_type: 'Offside', description: 'Attacker appeared level with defender on through ball', time_occurred: '78:45', players_involved: 'Vinicius Jr', severity: 'Minor', ai_ruling: 'Onside - Shoulder level with defender hip', actual_ruling: 'Goal Allowed', video_url: null },
      { match_name: 'Super Bowl LVIII', sport: 'American Football', incident_type: 'Pass Interference', description: 'Contact between receiver and defender before ball arrived', time_occurred: 'Q3 8:45', players_involved: 'DB #24', severity: 'Medium', ai_ruling: 'Defensive PI - Impeded receiver route', actual_ruling: 'Flag Thrown - PI', video_url: null },
      { match_name: 'Wimbledon Final', sport: 'Tennis', incident_type: 'Line Call Challenge', description: 'Serve called out on match point', time_occurred: 'Set 5, 6-5', players_involved: 'Server challenged call', severity: 'Minor', ai_ruling: 'Ball touched line - Overturned', actual_ruling: 'Challenge Successful', video_url: null },
      { match_name: 'El Clasico', sport: 'Football', incident_type: 'Red Card Challenge', description: 'Last man tackle outside penalty area', time_occurred: '34:12', players_involved: 'Casemiro', severity: 'Major', ai_ruling: 'Red Card - Denied obvious goal scoring opportunity', actual_ruling: 'Red Card', video_url: null },
      { match_name: 'NHL Stanley Cup Finals', sport: 'Hockey', incident_type: 'Goaltender Interference', description: 'Player contact with goalie before puck crossed line', time_occurred: '2nd Period 14:22', players_involved: 'Forward #88', severity: 'Medium', ai_ruling: 'No Goal - Incidental contact initiated by attacker', actual_ruling: 'Goal Disallowed', video_url: null },
      { match_name: 'NBA Finals Game 5', sport: 'Basketball', incident_type: 'Charge/Block', description: 'Collision in restricted area, defender moving', time_occurred: 'Q4 0:45', players_involved: 'LeBron James vs Defender', severity: 'Medium', ai_ruling: 'Blocking Foul - Defender not set, in restricted area', actual_ruling: 'Block Called', video_url: null },
      { match_name: 'FA Cup Final', sport: 'Football', incident_type: 'Simulation/Dive', description: 'Player went down in box with minimal contact', time_occurred: '88:30', players_involved: 'Attacker went down easily', severity: 'Medium', ai_ruling: 'Yellow Card for Simulation - No significant contact', actual_ruling: 'No Penalty, Yellow Card', video_url: null },
      { match_name: 'US Open Final', sport: 'Tennis', incident_type: 'Time Violation', description: 'Server exceeded 25 second serve clock', time_occurred: 'Set 3, 4-4', players_involved: 'Server', severity: 'Minor', ai_ruling: 'Time Violation - First Warning', actual_ruling: 'Warning Issued', video_url: null },
      { match_name: 'UEFA Euro Final', sport: 'Football', incident_type: 'Goal Line Technology', description: 'Ball appeared to fully cross line before cleared', time_occurred: '52:18', players_involved: 'England vs Italy', severity: 'Major', ai_ruling: 'Goal - Ball 2.3cm over line per GLT', actual_ruling: 'Goal Given', video_url: null },
      { match_name: 'MLB World Series G7', sport: 'Baseball', incident_type: 'Check Swing Appeal', description: 'Batter checked swing on 3-2 count with bases loaded', time_occurred: 'Bottom 9th, 2 outs', players_involved: 'Batter #22', severity: 'Major', ai_ruling: 'Swing - Bat broke plane of front of plate', actual_ruling: 'Strikeout Called', video_url: null },
      { match_name: 'Premier League Match', sport: 'Football', incident_type: 'VAR Offside Review', description: 'Armpit offside call on close goal', time_occurred: '67:55', players_involved: 'Gabriel Jesus', severity: 'Minor', ai_ruling: 'Offside by 1.2cm - Armpit ahead of defender', actual_ruling: 'Goal Disallowed', video_url: null },
      { match_name: 'NFL Playoff Game', sport: 'American Football', incident_type: 'Roughing the Passer', description: 'Defender hit QB after ball released', time_occurred: 'Q2 5:30', players_involved: 'DE #95', severity: 'Medium', ai_ruling: 'Roughing - Late hit with body weight', actual_ruling: 'Flag - 15 yard penalty', video_url: null },
      { match_name: 'Champions League QF', sport: 'Football', incident_type: 'Penalty Review', description: 'Defender clipped attacker in box during shot', time_occurred: '45+2', players_involved: 'Mbappe fouled', severity: 'Major', ai_ruling: 'Penalty - Contact affected shot attempt', actual_ruling: 'Penalty Awarded', video_url: null },
      { match_name: 'Boxing World Title', sport: 'Boxing', incident_type: 'Knockdown vs Slip', description: 'Fighter went down from punch that appeared to graze', time_occurred: 'Round 8', players_involved: 'Challenger', severity: 'Major', ai_ruling: 'Knockdown - Punch caused loss of balance', actual_ruling: 'Knockdown Ruled', video_url: null }
    ];

    for (const incident of refereeIncidents) {
      await pool.query(
        `INSERT INTO referee_incidents (match_name, sport, incident_type, description, time_occurred, players_involved, severity, ai_ruling, actual_ruling, video_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [incident.match_name, incident.sport, incident.incident_type, incident.description, incident.time_occurred, incident.players_involved, incident.severity, incident.ai_ruling, incident.actual_ruling, incident.video_url]
      );
    }
    console.log('Referee incidents seeded (16 items)');

    // Seed Notifications (15 items)
    const notifications = [
      { user_id: demoUserId, type: 'alert', title: 'Match Starting Soon', message: 'Manchester United vs Liverpool kicks off in 30 minutes. Check your betting analysis!', priority: 'high', related_entity: 'betting', related_id: 1 },
      { user_id: demoUserId, type: 'update', title: 'Odds Changed', message: 'Lakers vs Warriors odds have shifted. New odds: Lakers 2.10, Warriors 1.80.', priority: 'normal', related_entity: 'betting', related_id: 2 },
      { user_id: demoUserId, type: 'alert', title: 'Lineup Change Detected', message: 'Key player injury reported for Real Madrid. Starting XI may change for El Clasico.', priority: 'high', related_entity: 'betting', related_id: 3 },
      { user_id: demoUserId, type: 'system', title: 'AI Analysis Complete', message: 'Your requested AI analysis for Djokovic vs Alcaraz is ready to view.', priority: 'normal', related_entity: 'betting', related_id: 4 },
      { user_id: demoUserId, type: 'reminder', title: 'Fantasy Team Deadline', message: 'Fantasy Premier League deadline is in 2 hours. Make your transfers now!', priority: 'high', related_entity: 'fantasy', related_id: 1 },
      { user_id: demoUserId, type: 'update', title: 'Player Performance Update', message: 'Faker achieved a new KDA record of 12.5 in his latest match. Rankings updated.', priority: 'normal', related_entity: 'esports', related_id: 1 },
      { user_id: demoUserId, type: 'system', title: 'System Maintenance', message: 'Scheduled maintenance window: Saturday 2AM-4AM EST. Brief downtime expected.', priority: 'low', related_entity: null, related_id: null },
      { user_id: demoUserId, type: 'alert', title: 'New Referee Decision', message: 'Controversial VAR decision in Premier League match. AI analysis differs from actual ruling.', priority: 'normal', related_entity: 'referee', related_id: 13 },
      { user_id: demoUserId, type: 'update', title: 'Strategy Win Rate Updated', message: 'Sicilian Defense win rate updated to 54.5% based on latest tournament data.', priority: 'low', related_entity: 'strategy', related_id: 1 },
      { user_id: demoUserId, type: 'system', title: 'New Feature Available', message: 'Charts & Analytics page is now live! Visualize your data with interactive graphs.', priority: 'normal', related_entity: null, related_id: null },
      { user_id: demoUserId, type: 'alert', title: 'High Confidence Pick', message: 'AI detected a high confidence (85%+) betting opportunity for Man City vs Arsenal.', priority: 'high', related_entity: 'betting', related_id: 9 },
      { user_id: demoUserId, type: 'reminder', title: 'Weekly Report Ready', message: 'Your weekly sports analytics report is ready. View insights and trends.', priority: 'normal', related_entity: null, related_id: null },
      { user_id: demoUserId, type: 'update', title: 'Esports Tournament Started', message: 'League of Legends World Championship has begun. Track live stats in Esports Tracker.', priority: 'high', related_entity: 'esports', related_id: null },
      { user_id: demoUserId, type: 'system', title: 'Account Security', message: 'A new login was detected from New York, USA. If this was not you, please change your password.', priority: 'high', related_entity: null, related_id: null },
      { user_id: demoUserId, type: 'reminder', title: 'Review Your Predictions', message: '5 of your predictions from last week have results available. Check your accuracy!', priority: 'low', related_entity: 'betting', related_id: null }
    ];

    for (const notif of notifications) {
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, priority, related_entity, related_id) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [notif.user_id, notif.type, notif.title, notif.message, notif.priority, notif.related_entity, notif.related_id]
      );
    }
    console.log('Notifications seeded (15 items)');

    // Seed Favorites (15 items)
    const favorites = [
      { user_id: demoUserId, entity_type: 'team', entity_id: null, entity_name: 'LA Lakers', sport: 'Basketball', notes: 'My favorite NBA team' },
      { user_id: demoUserId, entity_type: 'team', entity_id: null, entity_name: 'Manchester United', sport: 'Football', notes: 'Following since childhood' },
      { user_id: demoUserId, entity_type: 'team', entity_id: null, entity_name: 'T1', sport: 'Esports', notes: 'Best LoL team ever' },
      { user_id: demoUserId, entity_type: 'player', entity_id: 1, entity_name: 'Faker', sport: 'Esports', notes: 'GOAT of League of Legends' },
      { user_id: demoUserId, entity_type: 'player', entity_id: null, entity_name: 'LeBron James', sport: 'Basketball', notes: 'All-time great' },
      { user_id: demoUserId, entity_type: 'player', entity_id: null, entity_name: 'Lionel Messi', sport: 'Football', notes: 'Greatest footballer of all time' },
      { user_id: demoUserId, entity_type: 'match', entity_id: 1, entity_name: 'Manchester United vs Liverpool', sport: 'Football', notes: 'Classic rivalry match' },
      { user_id: demoUserId, entity_type: 'match', entity_id: 3, entity_name: 'Real Madrid vs Barcelona', sport: 'Football', notes: 'El Clasico - never miss it' },
      { user_id: demoUserId, entity_type: 'team', entity_id: null, entity_name: 'Golden State Warriors', sport: 'Basketball', notes: 'Dynasty team' },
      { user_id: demoUserId, entity_type: 'league', entity_id: null, entity_name: 'Premier League', sport: 'Football', notes: 'Best football league in the world' },
      { user_id: demoUserId, entity_type: 'league', entity_id: null, entity_name: 'NBA', sport: 'Basketball', notes: 'Follow every season' },
      { user_id: demoUserId, entity_type: 'player', entity_id: 2, entity_name: 's1mple', sport: 'Esports', notes: 'Best CS player ever' },
      { user_id: demoUserId, entity_type: 'team', entity_id: null, entity_name: 'Kansas City Chiefs', sport: 'American Football', notes: 'Mahomes era' },
      { user_id: demoUserId, entity_type: 'match', entity_id: 5, entity_name: 'Chiefs vs 49ers', sport: 'American Football', notes: 'Super Bowl rematch' },
      { user_id: demoUserId, entity_type: 'player', entity_id: null, entity_name: 'Novak Djokovic', sport: 'Tennis', notes: 'Most Grand Slams in history' }
    ];

    for (const fav of favorites) {
      await pool.query(
        `INSERT INTO favorites (user_id, entity_type, entity_id, entity_name, sport, notes) VALUES ($1, $2, $3, $4, $5, $6)`,
        [fav.user_id, fav.entity_type, fav.entity_id, fav.entity_name, fav.sport, fav.notes]
      );
    }
    console.log('Favorites seeded (15 items)');

    // Seed Feedback (15 items)
    const feedbackData = [
      { user_id: demoUserId, type: 'feature', subject: 'Add Live Score Tracking', message: 'Would love to see real-time score updates integrated into the betting analyzer.', rating: 5, status: 'open' },
      { user_id: demoUserId, type: 'bug', subject: 'Chart Not Loading on Mobile', message: 'The charts page shows a blank screen on iPhone Safari. Works fine on desktop.', rating: 3, status: 'in_progress', admin_response: 'We are investigating the mobile rendering issue.' },
      { user_id: demoUserId, type: 'praise', subject: 'Amazing AI Predictions', message: 'The AI betting analyzer correctly predicted 8 out of 10 matches last week!', rating: 5, status: 'closed' },
      { user_id: demoUserId, type: 'suggestion', subject: 'Dark Mode Toggle in Header', message: 'It would be convenient to have the dark/light mode toggle accessible from the header.', rating: 4, status: 'open' },
      { user_id: adminUserId, type: 'feature', subject: 'Multi-language Support', message: 'Please add support for Spanish and Portuguese for our Latin American users.', rating: 4, status: 'open' },
      { user_id: demoUserId, type: 'bug', subject: 'Fantasy Team Score Calculation', message: 'The total points for my fantasy team seem incorrect after the latest update.', rating: 2, status: 'in_progress', admin_response: 'We found a calculation bug and are deploying a fix.' },
      { user_id: demoUserId, type: 'praise', subject: 'Great Esports Coverage', message: 'Love the depth of esports stats. The KDA tracking is really helpful for my analysis.', rating: 5, status: 'closed' },
      { user_id: adminUserId, type: 'suggestion', subject: 'Keyboard Shortcuts', message: 'Adding keyboard shortcuts for navigation would improve power user experience.', rating: 4, status: 'open' },
      { user_id: demoUserId, type: 'feature', subject: 'Team Comparison Tool', message: 'A side-by-side team comparison feature would help with betting decisions.', rating: 5, status: 'open' },
      { user_id: demoUserId, type: 'bug', subject: 'Search Not Finding Players', message: 'When I search for "Faker" in global search, no results appear despite having esports data.', rating: 2, status: 'closed', admin_response: 'Fixed in the latest update. Search now covers all entity types.' },
      { user_id: demoUserId, type: 'suggestion', subject: 'Export to PDF', message: 'Besides CSV and JSON, it would be great to export analysis reports as PDF documents.', rating: 4, status: 'open' },
      { user_id: adminUserId, type: 'praise', subject: 'Clean UI Design', message: 'The dark theme looks professional and the cards layout is intuitive.', rating: 5, status: 'closed' },
      { user_id: demoUserId, type: 'feature', subject: 'Social Sharing', message: 'Allow sharing predictions and analysis on social media platforms.', rating: 3, status: 'open' },
      { user_id: demoUserId, type: 'bug', subject: 'Notification Count Badge', message: 'The notification count in the sidebar does not update in real-time.', rating: 3, status: 'in_progress' },
      { user_id: demoUserId, type: 'suggestion', subject: 'Historical Performance Graph', message: 'A graph showing prediction accuracy over time would be motivating and informative.', rating: 5, status: 'open' }
    ];

    for (const fb of feedbackData) {
      await pool.query(
        `INSERT INTO feedback (user_id, type, subject, message, rating, status, admin_response) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [fb.user_id, fb.type, fb.subject, fb.message, fb.rating, fb.status, fb.admin_response || null]
      );
    }
    console.log('Feedback seeded (15 items)');

    // Seed Audit Logs (15 items)
    const auditLogs = [
      { user_id: demoUserId, action: 'login', entity_type: 'user', entity_id: demoUserId, details: 'User logged in successfully', ip_address: '192.168.1.100' },
      { user_id: demoUserId, action: 'create', entity_type: 'betting_analysis', entity_id: 1, details: 'Created betting analysis: Manchester United vs Liverpool', ip_address: '192.168.1.100' },
      { user_id: demoUserId, action: 'update', entity_type: 'profile', entity_id: demoUserId, details: 'Updated display name and bio', ip_address: '192.168.1.100' },
      { user_id: adminUserId, action: 'login', entity_type: 'user', entity_id: adminUserId, details: 'Admin user logged in', ip_address: '10.0.0.1' },
      { user_id: demoUserId, action: 'create', entity_type: 'fantasy_team', entity_id: 1, details: 'Created fantasy team: Dream XI Champions', ip_address: '192.168.1.100' },
      { user_id: demoUserId, action: 'export', entity_type: 'betting_analyses', entity_id: null, details: 'Exported betting analyses as CSV', ip_address: '192.168.1.100' },
      { user_id: demoUserId, action: 'update', entity_type: 'settings', entity_id: demoUserId, details: 'Changed theme to dark mode, enabled notifications', ip_address: '192.168.1.100' },
      { user_id: adminUserId, action: 'delete', entity_type: 'user', entity_id: 99, details: 'Deleted spam user account', ip_address: '10.0.0.1' },
      { user_id: demoUserId, action: 'create', entity_type: 'favorite', entity_id: 1, details: 'Added LA Lakers to favorites', ip_address: '192.168.1.100' },
      { user_id: demoUserId, action: 'ai_analysis', entity_type: 'betting_analysis', entity_id: 1, details: 'Requested AI analysis for Manchester United vs Liverpool', ip_address: '192.168.1.100' },
      { user_id: demoUserId, action: 'update', entity_type: 'betting_analysis', entity_id: 3, details: 'Updated odds for Real Madrid vs Barcelona', ip_address: '192.168.1.101' },
      { user_id: adminUserId, action: 'update', entity_type: 'feedback', entity_id: 2, details: 'Responded to bug report: Chart Not Loading on Mobile', ip_address: '10.0.0.1' },
      { user_id: demoUserId, action: 'search', entity_type: 'all', entity_id: null, details: 'Searched for "Lakers" across all entities', ip_address: '192.168.1.100' },
      { user_id: demoUserId, action: 'login', entity_type: 'user', entity_id: demoUserId, details: 'User logged in from new device', ip_address: '192.168.1.200' },
      { user_id: demoUserId, action: 'upload', entity_type: 'file', entity_id: 1, details: 'Uploaded team-analysis-report.pdf', ip_address: '192.168.1.100' }
    ];

    for (const log of auditLogs) {
      await pool.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES ($1, $2, $3, $4, $5, $6)`,
        [log.user_id, log.action, log.entity_type, log.entity_id, log.details, log.ip_address]
      );
    }
    console.log('Audit logs seeded (15 items)');

    // Seed Contact Messages (15 items)
    const contactMessages = [
      { name: 'John Smith', email: 'john@example.com', subject: 'API Access Request', message: 'I would like to integrate your AI predictions into my own application. Is there an API available?', category: 'partnership', status: 'open' },
      { name: 'Sarah Connor', email: 'sarah@example.com', subject: 'Cannot Login', message: 'I created an account yesterday but keep getting "Invalid credentials" error when trying to login.', category: 'support', status: 'resolved', admin_reply: 'Password reset link has been sent to your email.' },
      { name: 'Mike Johnson', email: 'mike@sportsblog.com', subject: 'Media Partnership', message: 'We run a popular sports blog and would love to feature your AI analytics. Interested in a partnership?', category: 'partnership', status: 'open' },
      { name: 'Emily Davis', email: 'emily@example.com', subject: 'Bug Report - Fantasy Points', message: 'The fantasy team optimizer is showing negative points for some players. This seems like a bug.', category: 'bug', status: 'in_progress', admin_reply: 'We have identified the issue and working on a fix.' },
      { name: 'Alex Chen', email: 'alex@techco.com', subject: 'Enterprise Plan Inquiry', message: 'Our company is interested in an enterprise plan for 50+ users. What are your pricing options?', category: 'partnership', status: 'open' },
      { name: 'Lisa Brown', email: 'lisa@example.com', subject: 'Feature Request - Cricket', message: 'Please add more cricket analytics. IPL and international cricket coverage would be amazing.', category: 'feature', status: 'open' },
      { name: 'David Wilson', email: 'david@example.com', subject: 'Data Export Issue', message: 'When I try to export betting data as CSV, the file downloads but appears to be empty.', category: 'bug', status: 'resolved', admin_reply: 'This has been fixed in the latest update. Please try again.' },
      { name: 'Maria Garcia', email: 'maria@example.com', subject: 'Account Deletion Request', message: 'I would like to delete my account and all associated data per GDPR regulations.', category: 'support', status: 'resolved', admin_reply: 'Your account has been deleted and all data removed.' },
      { name: 'Tom Anderson', email: 'tom@esportsteam.gg', subject: 'Esports Team Data', message: 'Can we submit our team statistics directly to your platform for tracking?', category: 'partnership', status: 'open' },
      { name: 'Rachel Kim', email: 'rachel@example.com', subject: 'Mobile App Request', message: 'Any plans for a native mobile app? The web version is great but a mobile app would be more convenient.', category: 'feature', status: 'open' },
      { name: 'James Taylor', email: 'james@example.com', subject: 'Incorrect Odds Display', message: 'The odds for the Chiefs vs 49ers game seem outdated. They were updated on the bookmaker site hours ago.', category: 'bug', status: 'open' },
      { name: 'Amanda White', email: 'amanda@university.edu', subject: 'Academic Research', message: 'I am a researcher studying AI in sports. Can I access your prediction accuracy data for my thesis?', category: 'other', status: 'open' },
      { name: 'Chris Martin', email: 'chris@example.com', subject: 'Payment Failed', message: 'My subscription payment failed but I was still charged. Please investigate and refund if needed.', category: 'support', status: 'in_progress' },
      { name: 'Sophie Turner', email: 'sophie@example.com', subject: 'Great Platform!', message: 'Just wanted to say thank you for building this amazing tool. It has really improved my betting strategy.', category: 'other', status: 'resolved' },
      { name: 'Ryan Martinez', email: 'ryan@example.com', subject: 'Two-Factor Authentication', message: 'Is there any plan to add 2FA for account security? I have sensitive betting data on the platform.', category: 'feature', status: 'open' }
    ];

    for (const msg of contactMessages) {
      await pool.query(
        `INSERT INTO contact_messages (name, email, subject, message, category, status, admin_reply) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [msg.name, msg.email, msg.subject, msg.message, msg.category, msg.status, msg.admin_reply || null]
      );
    }
    console.log('Contact messages seeded (15 items)');

    // Seed File Uploads (15 items)
    const fileUploads = [
      { user_id: demoUserId, filename: 'upload_1707000001_team_logo.png', original_name: 'lakers_logo.png', file_type: 'image/png', file_size: 245000, upload_path: '/uploads/upload_1707000001_team_logo.png' },
      { user_id: demoUserId, filename: 'upload_1707000002_analysis.pdf', original_name: 'betting_analysis_feb.pdf', file_type: 'application/pdf', file_size: 1520000, upload_path: '/uploads/upload_1707000002_analysis.pdf' },
      { user_id: demoUserId, filename: 'upload_1707000003_screenshot.jpg', original_name: 'match_screenshot.jpg', file_type: 'image/jpeg', file_size: 890000, upload_path: '/uploads/upload_1707000003_screenshot.jpg' },
      { user_id: demoUserId, filename: 'upload_1707000004_report.csv', original_name: 'weekly_predictions.csv', file_type: 'text/csv', file_size: 45000, upload_path: '/uploads/upload_1707000004_report.csv' },
      { user_id: adminUserId, filename: 'upload_1707000005_logo.svg', original_name: 'platform_logo.svg', file_type: 'image/svg+xml', file_size: 12000, upload_path: '/uploads/upload_1707000005_logo.svg' },
      { user_id: demoUserId, filename: 'upload_1707000006_stats.xlsx', original_name: 'esports_stats_export.xlsx', file_type: 'application/vnd.openxmlformats', file_size: 320000, upload_path: '/uploads/upload_1707000006_stats.xlsx' },
      { user_id: demoUserId, filename: 'upload_1707000007_photo.png', original_name: 'faker_highlight.png', file_type: 'image/png', file_size: 1100000, upload_path: '/uploads/upload_1707000007_photo.png' },
      { user_id: demoUserId, filename: 'upload_1707000008_data.json', original_name: 'fantasy_team_backup.json', file_type: 'application/json', file_size: 78000, upload_path: '/uploads/upload_1707000008_data.json' },
      { user_id: adminUserId, filename: 'upload_1707000009_report.pdf', original_name: 'monthly_report_jan.pdf', file_type: 'application/pdf', file_size: 2400000, upload_path: '/uploads/upload_1707000009_report.pdf' },
      { user_id: demoUserId, filename: 'upload_1707000010_img.jpg', original_name: 'stadium_photo.jpg', file_type: 'image/jpeg', file_size: 1800000, upload_path: '/uploads/upload_1707000010_img.jpg' },
      { user_id: demoUserId, filename: 'upload_1707000011_notes.txt', original_name: 'strategy_notes.txt', file_type: 'text/plain', file_size: 5400, upload_path: '/uploads/upload_1707000011_notes.txt' },
      { user_id: demoUserId, filename: 'upload_1707000012_chart.png', original_name: 'odds_comparison_chart.png', file_type: 'image/png', file_size: 560000, upload_path: '/uploads/upload_1707000012_chart.png' },
      { user_id: adminUserId, filename: 'upload_1707000013_doc.pdf', original_name: 'api_documentation.pdf', file_type: 'application/pdf', file_size: 980000, upload_path: '/uploads/upload_1707000013_doc.pdf' },
      { user_id: demoUserId, filename: 'upload_1707000014_data.csv', original_name: 'referee_decisions_2024.csv', file_type: 'text/csv', file_size: 67000, upload_path: '/uploads/upload_1707000014_data.csv' },
      { user_id: demoUserId, filename: 'upload_1707000015_thumb.png', original_name: 'team_thumbnail.png', file_type: 'image/png', file_size: 180000, upload_path: '/uploads/upload_1707000015_thumb.png' }
    ];

    for (const file of fileUploads) {
      await pool.query(
        `INSERT INTO file_uploads (user_id, filename, original_name, file_type, file_size, upload_path) VALUES ($1, $2, $3, $4, $5, $6)`,
        [file.user_id, file.filename, file.original_name, file.file_type, file.file_size, file.upload_path]
      );
    }
    console.log('File uploads seeded (15 items)');

    // Seed Search History (15 items)
    const searchHistory = [
      { user_id: demoUserId, query: 'Lakers', entity_type: 'all', results_count: 5 },
      { user_id: demoUserId, query: 'Faker', entity_type: 'esports', results_count: 3 },
      { user_id: demoUserId, query: 'Manchester United', entity_type: 'betting', results_count: 2 },
      { user_id: demoUserId, query: 'Sicilian Defense', entity_type: 'strategy', results_count: 1 },
      { user_id: demoUserId, query: 'football penalty', entity_type: 'referee', results_count: 4 },
      { user_id: demoUserId, query: 'Premier League', entity_type: 'all', results_count: 8 },
      { user_id: adminUserId, query: 'CS2 rankings', entity_type: 'esports', results_count: 5 },
      { user_id: demoUserId, query: 'high confidence picks', entity_type: 'betting', results_count: 3 },
      { user_id: demoUserId, query: 'chess opening', entity_type: 'strategy', results_count: 7 },
      { user_id: demoUserId, query: 'offside', entity_type: 'referee', results_count: 2 },
      { user_id: demoUserId, query: 'fantasy basketball', entity_type: 'fantasy', results_count: 4 },
      { user_id: adminUserId, query: 'bug report', entity_type: 'all', results_count: 3 },
      { user_id: demoUserId, query: 'Valorant', entity_type: 'esports', results_count: 4 },
      { user_id: demoUserId, query: 'poker strategy', entity_type: 'strategy', results_count: 6 },
      { user_id: demoUserId, query: 'Super Bowl', entity_type: 'all', results_count: 2 }
    ];

    for (const search of searchHistory) {
      await pool.query(
        `INSERT INTO search_history (user_id, query, entity_type, results_count) VALUES ($1, $2, $3, $4)`,
        [search.user_id, search.query, search.entity_type, search.results_count]
      );
    }
    console.log('Search history seeded (15 items)');

    console.log('Database seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
