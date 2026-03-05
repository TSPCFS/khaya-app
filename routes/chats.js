const express = require('express');
const { getDB } = require('../db/schema');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/chats
 * List chat threads for the user
 */
router.get('/', requireAuth, (req, res) => {
  try {
    const db = getDB();
    const userId = req.user.id;

    const threads = db.prepare(
      `SELECT
        ct.id, ct.user_id, ct.agent_id, ct.property_id, ct.created_at,
        a.name as agent_name, a.avatar_url as agent_avatar, a.phone as agent_phone,
        p.title as property_title
       FROM chat_threads ct
       JOIN agents a ON ct.agent_id = a.id
       LEFT JOIN properties p ON ct.property_id = p.id
       WHERE ct.user_id = ?
       ORDER BY ct.created_at DESC`
    ).all(userId);

    // Get unread count for each thread
    const threadsWithMessages = threads.map(t => {
      const unreadCount = db.prepare(
        `SELECT COUNT(*) as count FROM chat_messages WHERE thread_id = ? AND read = 0 AND sender_type = 'agent'`
      ).get(t.id);

      const lastMessage = db.prepare(
        'SELECT message, created_at FROM chat_messages WHERE thread_id = ? ORDER BY created_at DESC LIMIT 1'
      ).get(t.id);

      return {
        ...t,
        unreadCount: unreadCount.count,
        lastMessage: lastMessage || null,
      };
    });

    db.close();

    res.json({ data: threadsWithMessages });
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/chats/:threadId
 * Get messages for a specific chat thread
 */
router.get('/:threadId', requireAuth, (req, res) => {
  try {
    const { threadId } = req.params;
    const db = getDB();
    const userId = req.user.id;

    // Check thread exists and user has access
    const thread = db.prepare('SELECT * FROM chat_threads WHERE id = ? AND user_id = ?').get(threadId, userId);
    if (!thread) {
      db.close();
      return res.status(404).json({ error: 'Chat thread not found' });
    }

    // Get agent info
    const agent = db.prepare('SELECT id, name, avatar_url, phone, email, rating, agency FROM agents WHERE id = ?')
      .get(thread.agent_id);

    // Get property info
    let property = null;
    if (thread.property_id) {
      property = db.prepare('SELECT id, title, price, suburb, city, images FROM properties WHERE id = ?')
        .get(thread.property_id);
      if (property && property.images) {
        property.images = JSON.parse(property.images);
      }
    }

    // Get messages
    const messages = db.prepare(
      'SELECT id, sender_type, sender_id, message, read, created_at FROM chat_messages WHERE thread_id = ? ORDER BY created_at ASC'
    ).all(threadId);

    // Mark messages as read
    db.prepare(`UPDATE chat_messages SET read = 1 WHERE thread_id = ? AND sender_type = 'agent' AND read = 0`)
      .run(threadId);

    db.close();

    res.json({
      thread: {
        id: thread.id,
        agent,
        property,
        created_at: thread.created_at,
      },
      messages,
    });
  } catch (error) {
    console.error('Get chat messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/chats
 * Start a new chat thread
 * Body: { agent_id, property_id?, message }
 */
router.post('/', requireAuth, (req, res) => {
  try {
    const { agent_id, property_id, message } = req.body;
    const db = getDB();
    const userId = req.user.id;

    if (!agent_id || !message) {
      db.close();
      return res.status(400).json({ error: 'Missing agent_id or message' });
    }

    // Check agent exists
    const agent = db.prepare('SELECT id FROM agents WHERE id = ?').get(agent_id);
    if (!agent) {
      db.close();
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Check property exists if provided
    if (property_id) {
      const property = db.prepare('SELECT id FROM properties WHERE id = ?').get(property_id);
      if (!property) {
        db.close();
        return res.status(404).json({ error: 'Property not found' });
      }
    }

    // Create thread
    const now = new Date().toISOString();
    const threadResult = db.prepare(
      'INSERT INTO chat_threads (user_id, agent_id, property_id, created_at) VALUES (?, ?, ?, ?)'
    ).run(userId, agent_id, property_id || null, now);

    const threadId = threadResult.lastInsertRowid;

    // Add initial message
    db.prepare(
      'INSERT INTO chat_messages (thread_id, sender_type, sender_id, message, read, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(threadId, 'user', userId, message, 0, now);

    db.close();

    res.status(201).json({
      thread_id: threadId,
      message: 'Chat thread created',
    });
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/chats/:threadId/messages
 * Send a message in a chat thread
 * Body: { message }
 */
router.post('/:threadId/messages', requireAuth, (req, res) => {
  try {
    const { threadId } = req.params;
    const { message } = req.body;
    const db = getDB();
    const userId = req.user.id;

    if (!message) {
      db.close();
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check thread exists and user has access
    const thread = db.prepare('SELECT id FROM chat_threads WHERE id = ? AND user_id = ?').get(threadId, userId);
    if (!thread) {
      db.close();
      return res.status(404).json({ error: 'Chat thread not found' });
    }

    // Insert message
    const result = db.prepare(
      'INSERT INTO chat_messages (thread_id, sender_type, sender_id, message, read, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(threadId, 'user', userId, message, 0, new Date().toISOString());

    db.close();

    res.status(201).json({
      id: result.lastInsertRowid,
      thread_id: threadId,
      message: 'Message sent',
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/chats/:threadId/read
 * Mark all messages in a thread as read
 */
router.put('/:threadId/read', requireAuth, (req, res) => {
  try {
    const { threadId } = req.params;
    const db = getDB();
    const userId = req.user.id;

    // Check thread exists and user has access
    const thread = db.prepare('SELECT id FROM chat_threads WHERE id = ? AND user_id = ?').get(threadId, userId);
    if (!thread) {
      db.close();
      return res.status(404).json({ error: 'Chat thread not found' });
    }

    // Mark as read
    db.prepare(`UPDATE chat_messages SET read = 1 WHERE thread_id = ? AND sender_type = 'agent'`)
      .run(threadId);

    db.close();

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
