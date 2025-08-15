// Database initialization script
require('dotenv').config();
const bcrypt = require('bcrypt');
const logger = require('../utils/logger');
const db     = require('../utils/db');

db.serialize(() => {
  // Create users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      username     TEXT UNIQUE,
      password     TEXT,
      role         TEXT CHECK(role IN ('admin','client')) NOT NULL,
      organization TEXT NOT NULL DEFAULT 'engesense'
    )
  `, (err) => {
    if (err) {
      logger.error('Failed to create users table', { error: err.message });
      process.exit(1);
    } else {
      logger.info('Users table ready');
    }
  });

  // Seed initial admin (admin/admin)
  db.get(`SELECT 1 FROM users WHERE username = ?`, ['admin'], (err, row) => {
    if (err) {
      logger.error('Failed to check for admin user', { error: err.message });
      process.exit(1);
    }
    
    if (!row) {
      const hash = bcrypt.hashSync('admin', 10);
      db.run(
        `INSERT INTO users (username, password, role, organization) VALUES (?, ?, 'admin', 'engesense')`,
        ['admin', hash],
        err => { 
          if (err) {
            logger.error('Failed to seed admin user', { error: err.message });
            process.exit(1);
          } else {
            logger.warn('Seeded default admin user (admin/admin) - CHANGE PASSWORD IN PRODUCTION!');
            closeDatabase();
          }
        }
      );
    } else {
      logger.info('Admin user exists');
      closeDatabase();
    }
  });
});

function closeDatabase() {
  db.close((err) => {
    if (err) {
      logger.error('Error closing database', { error: err.message });
      process.exit(1);
    } else {
      logger.info('Database initialization complete');
      process.exit(0);
    }
  });
}
