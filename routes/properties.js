const express = require('express');
const { getDB } = require('../db/schema');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/properties
 * List properties with pagination, filters, and sorting
 */
router.get('/', optionalAuth, (req, res) => {
  try {
    const {
      min_price, max_price, bedrooms, city, province,
      property_type, sort = 'newest', page = 1, limit = 20,
    } = req.query;

    const db = getDB();

    let query = `SELECT p.*, a.name as agent_name, a.agency as agent_agency, a.phone as agent_phone, a.rating as agent_rating, a.reviews as agent_reviews, a.response_time as agent_response_time, a.verified as agent_verified, a.ffc as agent_ffc, a.email as agent_email FROM properties p LEFT JOIN agents a ON p.agent_id = a.id WHERE p.status = 'active'`;
    const params = [];

    if (min_price) { query += ' AND p.price >= ?'; params.push(parseInt(min_price)); }
    if (max_price) { query += ' AND p.price <= ?'; params.push(parseInt(max_price)); }
    if (bedrooms) { query += ' AND p.bedrooms >= ?'; params.push(parseInt(bedrooms)); }
    if (city) { query += ' AND p.city = ?'; params.push(city); }
    if (province) { query += ' AND p.province = ?'; params.push(province); }
    if (property_type) { query += ' AND p.property_type = ?'; params.push(property_type); }
    if (req.query.q) {
      query += ' AND (p.title LIKE ? OR p.suburb LIKE ? OR p.city LIKE ?)';
      const q = '%' + req.query.q + '%';
      params.push(q, q, q);
    }

    const sortMap = {
      'price_asc': 'ORDER BY p.price ASC',
      'price_desc': 'ORDER BY p.price DESC',
      'newest': 'ORDER BY p.created_at DESC',
      'oldest': 'ORDER BY p.created_at ASC',
      'views': 'ORDER BY p.views DESC',
    };
    query += ' ' + (sortMap[sort] || sortMap['newest']);

    // Count total
    const countParams = [...params];
    let countSql = `SELECT COUNT(*) as count FROM properties p WHERE p.status = 'active'`;
    if (min_price) countSql += ' AND p.price >= ?';
    if (max_price) countSql += ' AND p.price <= ?';
    if (bedrooms) countSql += ' AND p.bedrooms >= ?';
    if (city) countSql += ' AND p.city = ?';
    if (province) countSql += ' AND p.province = ?';
    if (property_type) countSql += ' AND p.property_type = ?';
    if (req.query.q) countSql += ' AND (p.title LIKE ? OR p.suburb LIKE ? OR p.city LIKE ?)';

    const countResult = db.prepare(countSql).get(...params);
    const total = countResult.count;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const properties = db.prepare(query).all(...params);

    const parsed = properties.map(p => ({
      id: p.id, title: p.title, price: p.price, address: p.address, suburb: p.suburb,
      city: p.city, province: p.province, lat: p.lat, lng: p.lng, bedrooms: p.bedrooms,
      bathrooms: p.bathrooms, garages: p.garages, erf_size: p.erf_size, floor_size: p.floor_size,
      property_type: p.property_type, description: p.description, features: p.features,
      images: p.images, listed_date: p.listed_date, featured: p.featured,
      valuation_estimate: p.valuation_estimate, valuation_confidence: p.valuation_confidence,
      views: p.views,
      agent: p.agent_name ? {
        id: p.agent_id, name: p.agent_name, agency: p.agent_agency, phone: p.agent_phone,
        rating: p.agent_rating, reviews: p.agent_reviews, response_time: p.agent_response_time,
        verified: p.agent_verified, ffc: p.agent_ffc
      } : null
    }));

    db.close();
    res.json({ data: parsed, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    console.error('Get properties error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/properties/featured — MUST be before /:id
 */
router.get('/featured', (req, res) => {
  try {
    const db = getDB();
    const properties = db.prepare(
      `SELECT * FROM properties WHERE featured = 1 AND status = 'active' ORDER BY views DESC LIMIT 12`
    ).all();
    db.close();
    res.json({ data: properties });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/properties/nearby — MUST be before /:id
 */
router.get('/nearby', (req, res) => {
  try {
    const { lat, lng, radius = 10, limit = 20 } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'Missing lat or lng' });
    const db = getDB();
    const latNum = parseFloat(lat), lngNum = parseFloat(lng), r = parseFloat(radius);
    const latOff = r / 111, lngOff = r / (111 * Math.cos(latNum * Math.PI / 180));
    const properties = db.prepare(
      `SELECT * FROM properties WHERE status = 'active' AND lat BETWEEN ? AND ? AND lng BETWEEN ? AND ? ORDER BY featured DESC LIMIT ?`
    ).all(latNum - latOff, latNum + latOff, lngNum - lngOff, lngNum + lngOff, parseInt(limit));
    db.close();
    res.json({ data: properties });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/properties/stats — MUST be before /:id
 */
router.get('/stats', (req, res) => {
  try {
    const db = getDB();
    const priceByProvince = db.prepare(`SELECT province, AVG(price) as avg_price, COUNT(*) as count FROM properties WHERE status = 'active' GROUP BY province`).all();
    const priceByType = db.prepare(`SELECT property_type, AVG(price) as avg_price, COUNT(*) as count FROM properties WHERE status = 'active' GROUP BY property_type`).all();
    const total = db.prepare(`SELECT COUNT(*) as count FROM properties WHERE status = 'active'`).get();
    db.close();
    res.json({ statistics: { totalProperties: total.count, priceByProvince, priceByType } });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/properties/:id
 */
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(id);
    if (!property) { db.close(); return res.status(404).json({ error: 'Property not found' }); }

    let agent = null;
    if (property.agent_id) {
      agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(property.agent_id);
    }

    const parsed = {
      ...property,
      features: property.features ? JSON.parse(property.features) : [],
      images: property.images ? JSON.parse(property.images) : [],
      agent,
    };

    if (req.user) {
      const saved = db.prepare('SELECT id FROM saved_properties WHERE user_id = ? AND property_id = ?').get(req.user.id, id);
      parsed.isSaved = !!saved;
    }

    db.close();
    res.json({ property: parsed });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/properties/:id/view
 */
router.post('/:id/view', optionalAuth, (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    const property = db.prepare('SELECT id FROM properties WHERE id = ?').get(id);
    if (!property) { db.close(); return res.status(404).json({ error: 'Property not found' }); }
    db.prepare('INSERT INTO property_views (user_id, property_id, viewed_at) VALUES (?, ?, ?)').run(req.user?.id || null, id, new Date().toISOString());
    db.prepare('UPDATE properties SET views = views + 1 WHERE id = ?').run(id);
    db.close();
    res.json({ message: 'View logged' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
