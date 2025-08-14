// db.js
require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const bcrypt   = require('bcrypt');

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
  `);

  // Seed initial admin (admin/admin)
  db.get(`SELECT 1 FROM users WHERE username = ?`, ['admin'], (err, row) => {
    if (err) throw err;
    if (!row) {
      const hash = bcrypt.hashSync('admin', 10);
      db.run(
        `INSERT INTO users (username, password, role) VALUES (?, ?, 'admin')`,
        ['admin', hash],
        err => { if (err) throw err; console.log('Seeded admin/admin'); }
      );
    }
  });
});

module.exports = db;
