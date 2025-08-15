// db.js
require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const bcrypt   = require('bcrypt');
const logger   = require('./utils/logger');

const db = new sqlite3.Database(process.env.DB_FILE);

db.serialize(() => {
  // Create users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      role     TEXT CHECK(role IN ('admin','client')) NOT NULL
    )
  `, (err) => {
    if (err) {
      logger.error('Failed to create users table', { error: err.message });
    } else {
      logger.info('Users table ready');
    }
  });

  // Seed initial admin (admin/admin)
  db.get(`SELECT 1 FROM users WHERE username = ?`, ['admin'], (err, row) => {
    if (err) {
      logger.error('Failed to check for admin user', { error: err.message });
      return;
    }
    
    if (!row) {
      const hash = bcrypt.hashSync('admin', 10);
      db.run(
        `INSERT INTO users (username, password, role) VALUES (?, ?, 'admin')`,
        ['admin', hash],
        err => { 
          if (err) {
            logger.error('Failed to seed admin user', { error: err.message });
          } else {
            logger.warn('Seeded default admin user (admin/admin) - CHANGE PASSWORD IN PRODUCTION!');
          }
        }
      );
    } else {
      logger.info('Admin user exists');
    }
  });
});

module.exports = db;
