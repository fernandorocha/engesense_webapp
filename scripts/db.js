// Database initialization script
require('dotenv').config();
const bcrypt = require('bcrypt');
const logger = require('../utils/logger');
const db     = require('../utils/db');

db.serialize(() => {
  // Create organizations table
  db.run(`
    CREATE TABLE IF NOT EXISTS organizations (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      name         TEXT UNIQUE NOT NULL,
      description  TEXT,
      influx_url   TEXT,
      influx_token TEXT,
      created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      logger.error('Failed to create organizations table', { error: err.message });
      process.exit(1);
    } else {
      logger.info('Organizations table ready');
    }
  });

  // Create users table with enhanced fields
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      username        TEXT UNIQUE NOT NULL,
      password        TEXT NOT NULL,
      role            TEXT CHECK(role IN ('admin','client')) NOT NULL,
      organization_id INTEGER,
      first_name      TEXT,
      last_name       TEXT,
      email           TEXT,
      phone           TEXT,
      job_title       TEXT,
      status          TEXT CHECK(status IN ('active','inactive','suspended')) DEFAULT 'active',
      timezone        TEXT DEFAULT 'UTC',
      language        TEXT DEFAULT 'en',
      created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login_at   DATETIME,
      FOREIGN KEY (organization_id) REFERENCES organizations(id)
    )
  `, (err) => {
    if (err) {
      logger.error('Failed to create users table', { error: err.message });
      process.exit(1);
    } else {
      logger.info('Users table ready');
    }
  });

  // Seed default organization
  db.get(`SELECT id FROM organizations WHERE name = ?`, ['Engesense'], (err, orgRow) => {
    if (err) {
      logger.error('Failed to check for default organization', { error: err.message });
      process.exit(1);
    }
    
    let orgId;
    if (!orgRow) {
      db.run(
        `INSERT INTO organizations (name, description, influx_url, influx_token) VALUES (?, ?, ?, ?)`,
        ['Engesense', 'Default Engesense Organization', process.env.INFLUX_URL || '', process.env.INFLUX_TOKEN || ''],
        function(err) {
          if (err) {
            logger.error('Failed to seed default organization', { error: err.message });
            process.exit(1);
          } else {
            orgId = this.lastID;
            logger.info('Seeded default organization');
            seedAdminUser(orgId);
          }
        }
      );
    } else {
      orgId = orgRow.id;
      logger.info('Default organization exists');
      seedAdminUser(orgId);
    }
  });
});

function seedAdminUser(organizationId) {
  // Seed initial admin (admin/admin)
  db.get(`SELECT 1 FROM users WHERE username = ?`, ['admin'], (err, row) => {
    if (err) {
      logger.error('Failed to check for admin user', { error: err.message });
      process.exit(1);
    }
    
    if (!row) {
      const hash = bcrypt.hashSync('admin', 10);
      db.run(
        `INSERT INTO users (username, password, role, organization_id, first_name, last_name, email, status) 
         VALUES (?, ?, 'admin', ?, ?, ?, ?, 'active')`,
        ['admin', hash, organizationId, 'Admin', 'User', 'admin@engesense.com'],
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
}

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
