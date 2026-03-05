const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'khaya.db');

/**
 * Initialize the database with schema
 */
function initDB() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  // Users table - multi-user support
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      phone TEXT,
      avatar_url TEXT,
      province TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    );
  `);

  // Properties table
  db.exec(`
    CREATE TABLE IF NOT EXISTS properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      price INTEGER NOT NULL,
      address TEXT NOT NULL,
      suburb TEXT NOT NULL,
      city TEXT NOT NULL,
      province TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      bedrooms INTEGER NOT NULL,
      bathrooms INTEGER NOT NULL,
      garages INTEGER DEFAULT 0,
      erf_size INTEGER DEFAULT 0,
      floor_size INTEGER NOT NULL,
      property_type TEXT NOT NULL,
      description TEXT,
      features TEXT,
      images TEXT,
      listed_date TEXT,
      featured BOOLEAN DEFAULT 0,
      valuation_estimate INTEGER,
      valuation_confidence REAL,
      agent_id INTEGER,
      status TEXT DEFAULT 'active',
      views INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agent_id) REFERENCES agents(id)
    );
  `);

  // Agents table
  db.exec(`
    CREATE TABLE IF NOT EXISTS agents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      agency TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      rating REAL DEFAULT 0,
      reviews INTEGER DEFAULT 0,
      response_time TEXT,
      verified BOOLEAN DEFAULT 0,
      ffc TEXT,
      avatar_url TEXT,
      bio TEXT
    );
  `);

  // Saved properties (user favorites)
  db.exec(`
    CREATE TABLE IF NOT EXISTS saved_properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      property_id INTEGER NOT NULL,
      saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (property_id) REFERENCES properties(id),
      UNIQUE(user_id, property_id)
    );
  `);

  // Saved searches
  db.exec(`
    CREATE TABLE IF NOT EXISTS saved_searches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      filters TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // Chat threads
  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_threads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      agent_id INTEGER NOT NULL,
      property_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (agent_id) REFERENCES agents(id),
      FOREIGN KEY (property_id) REFERENCES properties(id)
    );
  `);

  // Chat messages
  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_id INTEGER NOT NULL,
      sender_type TEXT NOT NULL,
      sender_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      read BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (thread_id) REFERENCES chat_threads(id)
    );
  `);

  // Property views tracking
  db.exec(`
    CREATE TABLE IF NOT EXISTS property_views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      property_id INTEGER NOT NULL,
      viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (property_id) REFERENCES properties(id)
    );
  `);

  db.close();
  return true;
}

/**
 * Get a database connection
 */
function getDB() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  return db;
}

module.exports = {
  initDB,
  getDB,
  DB_PATH
};
