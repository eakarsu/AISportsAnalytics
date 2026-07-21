const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../db/pool');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !name || typeof password !== 'string' || password.length < 12) return res.status(400).json({ error: 'Email, name, and a password of at least 12 characters are required' });

    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email, hashedPassword, name]
    );

    // Create default profile and settings
    await pool.query(
      'INSERT INTO user_profiles (user_id, display_name) VALUES ($1, $2) ON CONFLICT (user_id) DO NOTHING',
      [result.rows[0].id, name]
    );
    await pool.query(
      'INSERT INTO user_settings (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING',
      [result.rows[0].id]
    );

    // Create email verification token
    const verifyToken = crypto.randomBytes(32).toString('hex');
    await pool.query(
      'INSERT INTO email_verifications (user_id, token) VALUES ($1, $2)',
      [result.rows[0].id, verifyToken]
    );

    const token = jwt.sign({ id: result.rows[0].id, email, role: 'analyst', tenantId: process.env.GOVERNANCE_TENANT_ID, subjectIds: [`actor:user:${result.rows[0].id}`] }, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '24h' });

    res.status(201).json({
      user: result.rows[0],
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const role = user.role || 'analyst';
    const token = jwt.sign({ id: user.id, email: user.email, role, tenantId: process.env.GOVERNANCE_TENANT_ID, subjectIds: [`actor:user:${user.id}`] }, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '24h' });

    // Log the login
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES ($1, $2, $3, $4, $5, $6)',
      [user.id, 'login', 'user', user.id, 'User logged in', req.ip]
    ).catch(() => {});

    res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, email_verified: user.email_verified },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Forgot Password (#1)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      return res.json({ message: 'If that email exists, a reset link has been sent.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    await pool.query(
      'INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.rows[0].id, token, expiresAt]
    );

    // In production, send email here
    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reset Password (#1)
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (typeof password !== 'string' || password.length < 12) return res.status(400).json({ error: 'Password must be at least 12 characters' });

    const result = await pool.query(
      'SELECT * FROM password_resets WHERE token = $1 AND used = false AND expires_at > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, result.rows[0].user_id]);
    await pool.query('UPDATE password_resets SET used = true WHERE id = $1', [result.rows[0].id]);

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify Email (#2)
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    const result = await pool.query(
      'SELECT * FROM email_verifications WHERE token = $1 AND verified = false',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid verification token' });
    }

    await pool.query('UPDATE users SET email_verified = true WHERE id = $1', [result.rows[0].user_id]);
    await pool.query('UPDATE email_verifications SET verified = true WHERE id = $1', [result.rows[0].id]);

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Resend Verification (#2)
router.post('/resend-verification', authenticateToken, async (req, res) => {
  try {
    const token = crypto.randomBytes(32).toString('hex');
    await pool.query(
      'INSERT INTO email_verifications (user_id, token) VALUES ($1, $2)',
      [req.user.id, token]
    );

    res.json({ message: 'If delivery is configured, a verification email will be sent' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Refresh Token (#31)
router.post('/refresh-token', authenticateToken, async (req, res) => {
  try {
    const newToken = jwt.sign(
      { id: req.user.id, email: req.user.email, role: req.user.role, tenantId: req.user.tenantId, subjectIds: req.user.subjectIds },
      process.env.JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '24h' }
    );

    res.json({ token: newToken });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
