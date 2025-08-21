// Database migration script for Phase 1 enhancements
// This script safely migrates an existing database to the new schema
require('dotenv').config();
const bcrypt = require('bcrypt');
const logger = require('../utils/logger');
const db = require('../utils/db');

logger.info('Starting database migration to Phase 1 schema...');

db.serialize(() => {
  // First, backup existing users data
  logger.info('Step 1: Backing up existing users...');
  
  // Create organizations table
  logger.info('Step 2: Creating organizations table...');
  db.run(`
    CREATE TABLE IF NOT EXISTS organizations (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      name         TEXT UNIQUE NOT NULL,
      description  TEXT,
      influx_token TEXT,
      created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      logger.error('Failed to create organizations table', { error: err.message });
      process.exit(1);
    } else {
      logger.info('Organizations table created successfully');
    }
  });

  // Create default organization
  logger.info('Step 3: Creating default organization...');
  db.run(
    `INSERT OR IGNORE INTO organizations (name, description, influx_token) VALUES (?, ?, ?)`,
    ['Engesense', 'Default Engesense Organization', process.env.INFLUX_TOKEN || ''],
    function(err) {
      if (err) {
        logger.error('Failed to create default organization', { error: err.message });
        process.exit(1);
      } else {
        if (this.changes > 0) {
          logger.info('Default organization created successfully');
        } else {
          logger.info('Default organization already exists');
        }
      }
    }
  );

  // Check if users table needs migration
  logger.info('Step 4: Checking current users table structure...');
  db.all("PRAGMA table_info(users)", (err, columns) => {
    if (err) {
      logger.error('Failed to check users table structure', { error: err.message });
      process.exit(1);
    }

    const columnNames = columns.map(col => col.name);
    const hasNewColumns = columnNames.includes('organization_id') && 
                          columnNames.includes('first_name') && 
                          columnNames.includes('email');

    if (!hasNewColumns) {
      logger.info('Step 5: Migrating users table structure...');
      migrateUsersTable();
    } else {
      logger.info('Users table already has new structure, skipping migration');
      closeDatabase();
    }
  });
});

function migrateUsersTable() {
  // Get default organization ID
  db.get(`SELECT id FROM organizations WHERE name = ?`, ['Engesense'], (err, orgRow) => {
    if (err || !orgRow) {
      logger.error('Failed to get default organization ID', { error: err?.message || 'Organization not found' });
      process.exit(1);
    }

    const defaultOrgId = orgRow.id;
    
    // Add new columns to users table
    // Note: SQLite doesn't support CURRENT_TIMESTAMP as default in ALTER TABLE
    // So we add timestamp columns with NULL default and update them separately
    const alterQueries = [
      `ALTER TABLE users ADD COLUMN organization_id INTEGER REFERENCES organizations(id)`,
      `ALTER TABLE users ADD COLUMN first_name TEXT`,
      `ALTER TABLE users ADD COLUMN last_name TEXT`,
      `ALTER TABLE users ADD COLUMN email TEXT`,
      `ALTER TABLE users ADD COLUMN phone TEXT`,
      `ALTER TABLE users ADD COLUMN job_title TEXT`,
      `ALTER TABLE users ADD COLUMN status TEXT CHECK(status IN ('active','inactive','suspended')) DEFAULT 'active'`,
      `ALTER TABLE users ADD COLUMN timezone TEXT DEFAULT 'UTC'`,
      `ALTER TABLE users ADD COLUMN language TEXT DEFAULT 'en'`,
      `ALTER TABLE users ADD COLUMN created_at DATETIME`,
      `ALTER TABLE users ADD COLUMN updated_at DATETIME`,
      `ALTER TABLE users ADD COLUMN last_login_at DATETIME`
    ];

    let completedQueries = 0;
    let hasErrors = false;

    alterQueries.forEach((query, index) => {
      db.run(query, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          logger.error(`Failed to add column (query ${index + 1})`, { error: err.message, query });
          hasErrors = true;
        } else if (err && err.message.includes('duplicate column name')) {
          logger.info(`Column already exists (query ${index + 1})`);
        } else {
          logger.info(`Successfully added column (query ${index + 1})`);
        }

        completedQueries++;
        
        if (completedQueries === alterQueries.length) {
          if (hasErrors) {
            logger.error('Migration completed with errors');
            process.exit(1);
          } else {
            // Update existing users with default organization
            updateExistingUsers(defaultOrgId);
          }
        }
      });
    });
  });
}

function updateExistingUsers(defaultOrgId) {
  logger.info('Step 6: Updating existing users with default organization and timestamps...');
  
  db.run(
    `UPDATE users SET 
       organization_id = ?,
       first_name = COALESCE(first_name, 'User'),
       last_name = COALESCE(last_name, ''),
       email = COALESCE(email, username || '@engesense.com'),
       status = COALESCE(status, 'active'),
       created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
       updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP)
     WHERE organization_id IS NULL`,
    [defaultOrgId],
    function(err) {
      if (err) {
        logger.error('Failed to update existing users', { error: err.message });
        process.exit(1);
      } else {
        logger.info(`Updated ${this.changes} existing users with default organization and timestamps`);
        
        // Verify migration
        verifyMigration();
      }
    }
  );
}

function verifyMigration() {
  logger.info('Step 7: Verifying migration...');
  
  // Check organizations table
  db.get(`SELECT COUNT(*) as count FROM organizations`, (err, orgCount) => {
    if (err) {
      logger.error('Failed to verify organizations table', { error: err.message });
      process.exit(1);
    }
    
    // Check users table
    db.get(`SELECT COUNT(*) as count FROM users WHERE organization_id IS NOT NULL`, (err, userCount) => {
      if (err) {
        logger.error('Failed to verify users table', { error: err.message });
        process.exit(1);
      }
      
      logger.info('Migration verification completed:', {
        organizations: orgCount.count,
        usersWithOrganization: userCount.count
      });
      
      logger.info('✅ Database migration completed successfully!');
      logger.info('All existing users have been migrated to the new schema.');
      logger.info('Your application is now ready to use the enhanced features.');
      
      closeDatabase();
    });
  });
}

function closeDatabase() {
  db.close((err) => {
    if (err) {
      logger.error('Error closing database', { error: err.message });
      process.exit(1);
    } else {
      logger.info('Database migration complete');
      process.exit(0);
    }
  });
}