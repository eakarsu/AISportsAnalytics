require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const logger = require('./middleware/logger');
const pool = require('./db/pool');

const authRoutes = require('./routes/auth');
const bettingRoutes = require('./routes/betting');
const fantasyRoutes = require('./routes/fantasy');
const strategyRoutes = require('./routes/strategy');
const esportsRoutes = require('./routes/esports');
const refereeRoutes = require('./routes/referee');
const aiRoutes = require('./routes/ai');
const profileRoutes = require('./routes/profile');
const settingsRoutes = require('./routes/settings');
const notificationRoutes = require('./routes/notifications');
const favoritesRoutes = require('./routes/favorites');
const feedbackRoutes = require('./routes/feedback');
const auditRoutes = require('./routes/audit');
const contactRoutes = require('./routes/contact');
const uploadRoutes = require('./routes/upload');
const searchRoutes = require('./routes/search');
const adminRoutes = require('./routes/admin');
const exportRoutes = require('./routes/export');
const swaggerRoutes = require('./routes/swagger');
const sportsRoutes = require('./routes/sports');
const cronRoutes = require('./routes/cron');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware (#7)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false
}));

// CORS configuration - supports comma-separated CORS_ORIGINS env var
const corsOrigins = (process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',').map(o => o.trim());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || corsOrigins.includes(origin) || corsOrigins.includes('*')) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Request logging (#18)
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) }
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting (#6)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later.' }
});

app.use('/api/auth', authLimiter);
app.use('/api/', apiLimiter);

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/betting', bettingRoutes);
app.use('/api/fantasy', fantasyRoutes);
app.use('/api/strategy', strategyRoutes);
app.use('/api/esports', esportsRoutes);
app.use('/api/referee', refereeRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/docs', swaggerRoutes);
app.use('/api/sports', sportsRoutes);
app.use('/api/cron', cronRoutes);

// Enhanced health check (#21)
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected'
    });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Global error handler (#20)
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', { error: err.message, stack: err.stack, path: req.path });
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

app.use('/api/cross-sport-valuation', require('./routes/crossSportValuation')); app.use('/api/injury-decay-prediction', require('./routes/injuryDecayPrediction')); app.use('/api/live-betting-optimization', require('./routes/liveBettingOptimization')); app.use('/api/referee-decision-prediction', require('./routes/refereeDecisionPrediction')); app.use('/api/news-sentiment-line-movement', require('./routes/newsSentimentLineMovement')); app.use('/api/social-leaderboards', require('./routes/socialLeaderboards'));

// === Batch 08 Gaps & Frontend Mounts ===
app.use('/api/gap-no-ai-driven-injury-impact-prediction', require('./routes/gapNoAiDrivenInjuryImpactPrediction'));
app.use('/api/gap-no-player-performance-regression-modeling', require('./routes/gapNoPlayerPerformanceRegressionModeling'));
app.use('/api/gap-no-live-betting-probability-updates', require('./routes/gapNoLiveBettingProbabilityUpdates'));
app.use('/api/gap-no-integration-with-official-league-data-apis-espn', require('./routes/gapNoIntegrationWithOfficialLeagueDataApisEspn'));
app.use('/api/gap-no-multi-sport-cross-impact-modeling', require('./routes/gapNoMultiSportCrossImpactModeling'));
app.use('/api/gap-no-live-chat-for-user-discussion-tips', require('./routes/gapNoLiveChatForUserDiscussionTips'));
app.use('/api/gap-no-social-features-following-picks-leaderboards', require('./routes/gapNoSocialFeaturesFollowingPicksLeaderboards'));
app.use('/api/gap-no-webhooks-for-downstream-notifications', require('./routes/gapNoWebhooksForDownstreamNotifications'));
app.use('/api/gap-no-third-party-integrations-beyond-import-export', require('./routes/gapNoThirdPartyIntegrationsBeyondImportExport'));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API docs available at http://localhost:${PORT}/api/docs`);
});
