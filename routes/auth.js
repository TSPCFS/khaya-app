const express = require('express');
const bcrypt = require('bcryptjs');
const { getDB } = require('../db/schema');
const { requireAuth, createToken } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields: name, email, password' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const db = getDB();

    // Check if user exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      db.close();
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = bcrypt.hashSync(password, 10);

    // Insert user
    const result = db.prepare(
      'INSERT INTO users (name, email, password_hash, phone, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run(name, email, passwordHash, phone || null, new Date().toISOString());

    const userId = result.lastInsertRowid;
    const token = createToken(userId, email);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    db.close();

    res.status(201).json({
      message: 'User registered successfully',
      user: { id: userId, name, email },
      token,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/login
 * Login a user
 */
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }

    const db = getDB();

    // Find user
    const user = db.prepare('SELECT id, name, email, password_hash, phone, province FROM users WHERE email = ?')
      .get(email);

    if (!user) {
      db.close();
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      db.close();
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login
    db.prepare('UPDATE users SET last_login = ? WHERE id = ?').run(new Date().toISOString(), user.id);

    const token = createToken(user.id, user.email);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    db.close();

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        province: user.province,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/auth/me
 * Get current user (requires auth)
 */
router.get('/me', requireAuth, (req, res) => {
  try {
    const db = getDB();
    const user = db.prepare(
      'SELECT id, name, email, phone, avatar_url, province, created_at, last_login FROM users WHERE id = ?'
    ).get(req.user.id);

    db.close();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/logout
 * Logout a user (clear cookie)
 */
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
