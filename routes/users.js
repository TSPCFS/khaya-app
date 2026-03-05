const express = require('express');
const bcrypt = require('bcryptjs');
const { getDB } = require('../db/schema');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/users/profile
 * Get user profile with stats
 */
router.get('/profile', requireAuth, (req, res) => {
  try {
    const db = getDB();
    const userId = req.user.id;

    // Get user info
    const user = db.prepare(
      'SELECT id, name, email, phone, avatar_url, province, created_at, last_login FROM users WHERE id = ?'
    ).get(userId);

    if (!user) {
      db.close();
      return res.status(404).json({ error: 'User not found' });
    }

    // Get stats
    const savedCount = db.prepare('SELECT COUNT(*) as count FROM saved_properties WHERE user_id = ?').get(userId);
    const viewsCount = db.prepare('SELECT COUNT(*) as count FROM property_views WHERE user_id = ?').get(userId);
    const chatsCount = db.prepare('SELECT COUNT(*) as count FROM chat_threads WHERE user_id = ?').get(userId);

    db.close();

    res.json({
      user: {
        ...user,
        stats: {
          savedProperties: savedCount.count,
          viewedProperties: viewsCount.count,
          activeChats: chatsCount.count,
        },
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/users/profile
 * Update user profile
 */
router.put('/profile', requireAuth, (req, res) => {
  try {
    const { name, phone, province, avatar_url } = req.body;
    const db = getDB();
    const userId = req.user.id;

    // Build update query
    const updates = [];
    const values = [];

    if (name) {
      updates.push('name = ?');
      values.push(name);
    }
    if (phone) {
      updates.push('phone = ?');
      values.push(phone);
    }
    if (province) {
      updates.push('province = ?');
      values.push(province);
    }
    if (avatar_url) {
      updates.push('avatar_url = ?');
      values.push(avatar_url);
    }

    if (updates.length === 0) {
      db.close();
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(userId);
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    db.prepare(query).run(...values);

    // Get updated user
    const user = db.prepare(
      'SELECT id, name, email, phone, avatar_url, province, created_at, last_login FROM users WHERE id = ?'
    ).get(userId);

    db.close();

    res.json({ user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/users/saved
 * Get user's saved properties
 */
router.get('/saved', requireAuth, (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const db = getDB();
    const userId = req.user.id;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get total count
    const countResult = db.prepare('SELECT COUNT(*) as count FROM saved_properties WHERE user_id = ?').get(userId);
    const total = countResult.count;

    // Get saved properties
    const saved = db.prepare(
      `SELECT p.id, p.title, p.price, p.suburb, p.city, p.bedrooms, p.bathrooms, p.property_type, p.images, p.featured, sp.saved_at
       FROM saved_properties sp
       JOIN properties p ON sp.property_id = p.id
       WHERE sp.user_id = ?
       ORDER BY sp.saved_at DESC
       LIMIT ? OFFSET ?`
    ).all(userId, parseInt(limit), offset);

    const parsed = saved.map(p => ({
      ...p,
      images: p.images ? JSON.parse(p.images) : [],
    }));

    db.close();

    res.json({
      data: parsed,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get saved error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/users/saved/:propertyId
 * Save a property
 */
router.post('/saved/:propertyId', requireAuth, (req, res) => {
  try {
    const { propertyId } = req.params;
    const db = getDB();
    const userId = req.user.id;

    // Check property exists
    const property = db.prepare('SELECT id FROM properties WHERE id = ?').get(propertyId);
    if (!property) {
      db.close();
      return res.status(404).json({ error: 'Property not found' });
    }

    // Check if already saved
    const existing = db.prepare('SELECT id FROM saved_properties WHERE user_id = ? AND property_id = ?')
      .get(userId, propertyId);

    if (existing) {
      db.close();
      return res.status(409).json({ error: 'Property already saved' });
    }

    // Save property
    db.prepare('INSERT INTO saved_properties (user_id, property_id, saved_at) VALUES (?, ?, ?)')
      .run(userId, propertyId, new Date().toISOString());

    db.close();

    res.status(201).json({ message: 'Property saved' });
  } catch (error) {
    console.error('Save property error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/users/saved/:propertyId
 * Unsave a property
 */
router.delete('/saved/:propertyId', requireAuth, (req, res) => {
  try {
    const { propertyId } = req.params;
    const db = getDB();
    const userId = req.user.id;

    db.prepare('DELETE FROM saved_properties WHERE user_id = ? AND property_id = ?')
      .run(userId, propertyId);

    db.close();

    res.json({ message: 'Property unsaved' });
  } catch (error) {
    console.error('Unsave property error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/users/searches
 * Get user's saved searches
 */
router.get('/searches', requireAuth, (req, res) => {
  try {
    const db = getDB();
    const userId = req.user.id;

    const searches = db.prepare(
      'SELECT id, name, filters, created_at FROM saved_searches WHERE user_id = ? ORDER BY created_at DESC'
    ).all(userId);

    const parsed = searches.map(s => ({
      ...s,
      filters: s.filters ? JSON.parse(s.filters) : {},
    }));

    db.close();

    res.json({ data: parsed });
  } catch (error) {
    console.error('Get searches error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/users/searches
 * Create a saved search
 */
router.post('/searches', requireAuth, (req, res) => {
  try {
    const { name, filters } = req.body;
    const db = getDB();
    const userId = req.user.id;

    if (!name) {
      db.close();
      return res.status(400).json({ error: 'Search name is required' });
    }

    const result = db.prepare(
      'INSERT INTO saved_searches (user_id, name, filters, created_at) VALUES (?, ?, ?, ?)'
    ).run(userId, name, filters ? JSON.stringify(filters) : null, new Date().toISOString());

    db.close();

    res.status(201).json({
      id: result.lastInsertRowid,
      name,
      filters: filters || {},
    });
  } catch (error) {
    console.error('Create search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/users/searches/:id
 * Delete a saved search
 */
router.delete('/searches/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    const userId = req.user.id;

    db.prepare('DELETE FROM saved_searches WHERE id = ? AND user_id = ?').run(id, userId);

    db.close();

    res.json({ message: 'Search deleted' });
  } catch (error) {
    console.error('Delete search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/users/history
 * Get user's viewing history
 */
router.get('/history', requireAuth, (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const db = getDB();
    const userId = req.user.id;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const countResult = db.prepare('SELECT COUNT(*) as count FROM property_views WHERE user_id = ?').get(userId);
    const total = countResult.count;

    const history = db.prepare(
      `SELECT p.id, p.title, p.price, p.suburb, p.city, p.bedrooms, p.bathrooms, p.property_type, p.images, pv.viewed_at
       FROM property_views pv
       JOIN properties p ON pv.property_id = p.id
       WHERE pv.user_id = ?
       ORDER BY pv.viewed_at DESC
       LIMIT ? OFFSET ?`
    ).all(userId, parseInt(limit), offset);

    const parsed = history.map(p => ({
      ...p,
      images: p.images ? JSON.parse(p.images) : [],
    }));

    db.close();

    res.json({
      data: parsed,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/users/stats
 * Get user statistics
 */
router.get('/stats', requireAuth, (req, res) => {
  try {
    const db = getDB();
    const userId = req.user.id;

    const saved = db.prepare('SELECT COUNT(*) as count FROM saved_properties WHERE user_id = ?').get(userId);
    const viewed = db.prepare('SELECT COUNT(*) as count FROM property_views WHERE user_id = ?').get(userId);
    const chats = db.prepare('SELECT COUNT(*) as count FROM chat_threads WHERE user_id = ?').get(userId);
    const agentsContacted = db.prepare('SELECT COUNT(DISTINCT agent_id) as count FROM chat_threads WHERE user_id = ?').get(userId);

    // Most viewed property type
    const topType = db.prepare(
      `SELECT p.property_type, COUNT(*) as views
       FROM property_views pv
       JOIN properties p ON pv.property_id = p.id
       WHERE pv.user_id = ?
       GROUP BY p.property_type
       ORDER BY views DESC
       LIMIT 1`
    ).get(userId);

    db.close();

    res.json({
      statistics: {
        savedProperties: saved.count,
        viewedProperties: viewed.count,
        chatThreads: chats.count,
        agentsContacted: agentsContacted.count,
        favoritePropertyType: topType?.property_type || null,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
