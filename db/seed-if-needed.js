const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'khaya.db');

if (!fs.existsSync(DB_PATH)) {
  console.log('Database not found — running seed...');
  require('./seed');
} else {
  console.log('Database already exists — skipping seed.');
}
