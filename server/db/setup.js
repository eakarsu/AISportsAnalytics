const pool = require('./pool');

const setupDatabase = async () => {
  if (process.env.ALLOW_SCHEMA_MIGRATION !== '1' && process.env.ALLOW_DESTRUCTIVE_SEED !== '1') {
    throw new Error('Set ALLOW_SCHEMA_MIGRATION=1 for schema setup');
  }
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  try {
    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user',
        email_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Betting Analysis table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS betting_analyses (
        id SERIAL PRIMARY KEY,
        match_name VARCHAR(255) NOT NULL,
        sport VARCHAR(100) NOT NULL,
        team_a VARCHAR(255) NOT NULL,
        team_b VARCHAR(255) NOT NULL,
        odds_team_a DECIMAL(10,2),
        odds_team_b DECIMAL(10,2),
        odds_draw DECIMAL(10,2),
        predicted_winner VARCHAR(255),
        confidence_score DECIMAL(5,2),
        analysis_notes TEXT,
        match_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Fantasy Teams table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS fantasy_teams (
        id SERIAL PRIMARY KEY,
        team_name VARCHAR(255) NOT NULL,
        sport VARCHAR(100) NOT NULL,
        budget DECIMAL(12,2),
        total_points DECIMAL(10,2) DEFAULT 0,
        player_count INTEGER DEFAULT 0,
        formation VARCHAR(50),
        strategy TEXT,
        optimization_score DECIMAL(5,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Fantasy Players table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS fantasy_players (
        id SERIAL PRIMARY KEY,
        team_id INTEGER REFERENCES fantasy_teams(id) ON DELETE CASCADE,
        player_name VARCHAR(255) NOT NULL,
        position VARCHAR(100),
        real_team VARCHAR(255),
        price DECIMAL(10,2),
        projected_points DECIMAL(10,2),
        form_rating DECIMAL(5,2),
        injury_status VARCHAR(100) DEFAULT 'Healthy'
      )
    `);

    // Game Strategies table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS game_strategies (
        id SERIAL PRIMARY KEY,
        game_type VARCHAR(100) NOT NULL,
        strategy_name VARCHAR(255) NOT NULL,
        description TEXT,
        difficulty_level VARCHAR(50),
        win_rate DECIMAL(5,2),
        key_moves TEXT,
        counter_strategies TEXT,
        best_situations TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Esports Stats table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS esports_stats (
        id SERIAL PRIMARY KEY,
        player_name VARCHAR(255) NOT NULL,
        game_title VARCHAR(255) NOT NULL,
        team_name VARCHAR(255),
        region VARCHAR(100),
        role VARCHAR(100),
        matches_played INTEGER DEFAULT 0,
        wins INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0,
        kda_ratio DECIMAL(10,2),
        avg_score DECIMAL(10,2),
        ranking INTEGER,
        earnings DECIMAL(12,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Referee Incidents table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS referee_incidents (
        id SERIAL PRIMARY KEY,
        match_name VARCHAR(255) NOT NULL,
        sport VARCHAR(100) NOT NULL,
        incident_type VARCHAR(255) NOT NULL,
        description TEXT,
        time_occurred VARCHAR(50),
        players_involved TEXT,
        severity VARCHAR(50),
        ai_ruling TEXT,
        actual_ruling TEXT,
        video_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add new columns to users table if they don't exist
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='role') THEN
          ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'user';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='email_verified') THEN
          ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false;
        END IF;
      END $$;
    `);

    // Password Resets table (#1)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Email Verifications table (#2)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS email_verifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL,
        verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // User Profiles table (#3)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        display_name VARCHAR(255),
        bio TEXT,
        avatar_url VARCHAR(500),
        phone VARCHAR(50),
        location VARCHAR(255),
        favorite_sport VARCHAR(100),
        experience_level VARCHAR(50) DEFAULT 'Beginner',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // User Settings table (#4)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_settings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        theme VARCHAR(50) DEFAULT 'dark',
        language VARCHAR(50) DEFAULT 'en',
        notifications_enabled BOOLEAN DEFAULT true,
        email_alerts BOOLEAN DEFAULT true,
        timezone VARCHAR(100) DEFAULT 'UTC',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Notifications table (#12)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        read BOOLEAN DEFAULT false,
        priority VARCHAR(50) DEFAULT 'normal',
        related_entity VARCHAR(100),
        related_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Favorites table (#35)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        entity_type VARCHAR(100) NOT NULL,
        entity_id INTEGER,
        entity_name VARCHAR(255) NOT NULL,
        sport VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Feedback table (#28)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS feedback (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        type VARCHAR(50) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        rating INTEGER DEFAULT 5,
        status VARCHAR(50) DEFAULT 'open',
        admin_response TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Audit Logs table (#24)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        action VARCHAR(255) NOT NULL,
        entity_type VARCHAR(100),
        entity_id INTEGER,
        details TEXT,
        ip_address VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Contact Messages table (#27)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        category VARCHAR(100) DEFAULT 'support',
        status VARCHAR(50) DEFAULT 'open',
        admin_reply TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // File Uploads table (#22)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS file_uploads (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_type VARCHAR(100),
        file_size INTEGER,
        upload_path VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Search History table (#9)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS search_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        query VARCHAR(255) NOT NULL,
        entity_type VARCHAR(100) DEFAULT 'all',
        results_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // AI Analyses persistence table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_analyses (
        id SERIAL PRIMARY KEY,
        endpoint VARCHAR(100) NOT NULL,
        input_data JSONB NOT NULL,
        result_data JSONB NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        model_used VARCHAR(255),
        tokens_used INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // AI Picks History table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_picks_history (
        id SERIAL PRIMARY KEY,
        ai_analysis_id INTEGER REFERENCES ai_analyses(id) ON DELETE SET NULL,
        betting_id INTEGER REFERENCES betting_analyses(id) ON DELETE SET NULL,
        predicted_winner VARCHAR(255),
        confidence_score DECIMAL(5,2),
        sport VARCHAR(100),
        match_name VARCHAR(255),
        actual_outcome VARCHAR(255),
        is_correct BOOLEAN,
        recorded_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add ai_analysis column to referee_incidents if not exists
    await pool.query(`
      ALTER TABLE referee_incidents ADD COLUMN IF NOT EXISTS ai_analysis JSONB
    `);

    // Add ai_analysis column to betting_analyses if not exists
    await pool.query(`
      ALTER TABLE betting_analyses ADD COLUMN IF NOT EXISTS ai_analysis JSONB
    `);

    // Add email_verify_token column
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verify_token VARCHAR(255)
    `);

    // Add reset_token columns to users
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255)
    `);
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP
    `);

    // Create index on ai_analyses for fast lookup by endpoint and user
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_ai_analyses_endpoint ON ai_analyses(endpoint);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_ai_analyses_user_id ON ai_analyses(user_id);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_ai_analyses_created_at ON ai_analyses(created_at DESC);
    `);

    // Weekly insights digest table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS weekly_insights (
        id SERIAL PRIMARY KEY,
        week_start DATE NOT NULL,
        week_end DATE NOT NULL,
        digest JSONB NOT NULL,
        analyses_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
    throw error;
  }
};

module.exports = setupDatabase;

// Run if called directly
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log('Database setup complete');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Database setup failed:', err);
      process.exit(1);
    });
}
