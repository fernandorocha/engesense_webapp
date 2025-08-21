// routes/admin.js
const express              = require('express');
const bcrypt               = require('bcrypt');
const db                   = require('../utils/db');
const { ensureAuth, ensureAdmin } = require('../middleware/auth');
const { validateUserCreation } = require('../middleware/validation');
const logger               = require('../utils/logger');
const router               = express.Router();

// GET /admin/users — list users
router.get(
  '/admin/users',
  ensureAuth,
  ensureAdmin,
  (req, res) => {
    // First check if database has been migrated to new schema
    db.all("PRAGMA table_info(users)", (err, columns) => {
      if (err) {
        logger.error('Failed to check users table structure', { error: err.message });
        return res.status(500).render('admin_users', { 
          users: [], 
          organizations: [],
          error: 'Failed to check database structure' 
        });
      }

      const columnNames = columns.map(col => col.name);
      const hasNewSchema = columnNames.includes('organization_id') && 
                          columnNames.includes('first_name') && 
                          columnNames.includes('created_at');

      if (!hasNewSchema) {
        // Database hasn't been migrated yet - show migration notice
        logger.warn('Database has not been migrated to new schema');
        return res.status(500).render('admin_users', { 
          users: [], 
          organizations: [],
          error: 'Database migration required. Please run: node scripts/migrate.js',
          needsMigration: true
        });
      }

      // Get users with organization information (new schema)
      db.all(
        `SELECT u.id, u.username, u.role, u.first_name, u.last_name, u.email, u.phone, 
                u.job_title, u.status, u.created_at, o.name as organization_name
         FROM users u 
         LEFT JOIN organizations o ON u.organization_id = o.id`,
        (err, rows) => {
          if (err) {
            logger.error('Failed to fetch users list', { error: err.message });
            return res.status(500).render('admin_users', { 
              users: [], 
              organizations: [],
              error: 'Failed to load users' 
            });
          }
          
          // Get organizations for the dropdown
          db.all(`SELECT id, name FROM organizations ORDER BY name`, (err, organizations) => {
            if (err) {
              logger.error('Failed to fetch organizations', { error: err.message });
              return res.status(500).render('admin_users', { 
                users: [], 
                organizations: [],
                error: 'Failed to load organizations' 
              });
            }
            
            res.render('admin_users', { 
              users: rows, 
              organizations: organizations,
              error: null,
              needsMigration: false
            });
          });
        }
      );
    });
  }
);

// POST /admin/users — create new user
router.post(
  '/admin/users',
  ensureAuth,
  ensureAdmin,
  validateUserCreation,
  (req, res) => {
    // Check if database has been migrated first
    db.all("PRAGMA table_info(users)", (err, columns) => {
      if (err) {
        logger.error('Failed to check users table structure', { error: err.message });
        return res.status(500).render('admin_users', { 
          users: [], 
          organizations: [],
          error: 'Failed to check database structure' 
        });
      }

      const columnNames = columns.map(col => col.name);
      const hasNewSchema = columnNames.includes('organization_id') && 
                          columnNames.includes('first_name') && 
                          columnNames.includes('created_at');

      if (!hasNewSchema) {
        // Database hasn't been migrated yet
        return res.status(500).render('admin_users', { 
          users: [], 
          organizations: [],
          error: 'Database migration required. Please run: node scripts/migrate.js',
          needsMigration: true
        });
      }

      const { 
        username, password, role, organization_id, 
        first_name, last_name, email, phone, job_title 
      } = req.body;
      const hash = bcrypt.hashSync(password, 10);
      
      db.run(
        `INSERT INTO users (username, password, role, organization_id, first_name, last_name, email, phone, job_title, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
        [username, hash, role, organization_id, first_name, last_name, email, phone, job_title],
        err => {
          if (err) {
            logger.error('Failed to create user', { 
              error: err.message, 
              username,
              role
            });
            
            // Re-fetch data for the form
            return db.all(
              `SELECT u.id, u.username, u.role, u.first_name, u.last_name, u.email, u.phone, 
                      u.job_title, u.status, u.created_at, o.name as organization_name
               FROM users u 
               LEFT JOIN organizations o ON u.organization_id = o.id`,
              (_, userRows) => {
                db.all(`SELECT id, name FROM organizations ORDER BY name`, (_, orgRows) => {
                  res.render('admin_users', {
                    users: userRows || [],
                    organizations: orgRows || [],
                    error: 'Username already exists or invalid data',
                    needsMigration: false
                  });
                });
              }
            );
          }
          
          logger.info('User created successfully', { username, role, email });
          res.redirect('/admin/users');
        }
      );
    });
  }
);

// ============= ORGANIZATION MANAGEMENT ROUTES =============

// GET /admin/organizations — list organizations
router.get(
  '/admin/organizations',
  ensureAuth,
  ensureAdmin,
  (req, res) => {
    // Get query parameters for success/error messages
    const error = req.query.error || null;
    const success = req.query.success || null;
    
    // First check if database has been migrated to new schema
    db.all("PRAGMA table_info(organizations)", (err, columns) => {
      if (err) {
        logger.error('Failed to check organizations table structure', { error: err.message });
        return res.status(500).render('admin_organizations', { 
          organizations: [], 
          error: 'Failed to check database structure',
          success: null
        });
      }

      const columnNames = columns.map(col => col.name);
      const hasOrgTable = columnNames.length > 0;

      if (!hasOrgTable) {
        // Database hasn't been migrated yet - show migration notice
        logger.warn('Database has not been migrated to new schema');
        return res.status(500).render('admin_organizations', { 
          organizations: [], 
          error: 'Database migration required. Please run: node scripts/migrate.js',
          needsMigration: true,
          success: null
        });
      }

      // Get organizations
      db.all(
        `SELECT id, name, description, influx_token, created_at, updated_at 
         FROM organizations 
         ORDER BY name`,
        (err, rows) => {
          if (err) {
            logger.error('Failed to fetch organizations list', { error: err.message });
            return res.status(500).render('admin_organizations', { 
              organizations: [], 
              error: 'Failed to load organizations',
              success: null
            });
          }
          
          res.render('admin_organizations', { 
            organizations: rows, 
            error: error,
            success: success,
            needsMigration: false
          });
        }
      );
    });
  }
);

// POST /admin/organizations — create new organization
router.post(
  '/admin/organizations',
  ensureAuth,
  ensureAdmin,
  (req, res) => {
    const { name, description, influx_token } = req.body;
    
    // Basic validation
    if (!name || !name.trim()) {
      return res.redirect('/admin/organizations?error=Organization name is required');
    }
    
    if (!influx_token || !influx_token.trim()) {
      return res.redirect('/admin/organizations?error=InfluxDB token is required');
    }
    
    db.run(
      `INSERT INTO organizations (name, description, influx_token) 
       VALUES (?, ?, ?)`,
      [name.trim(), description?.trim() || '', influx_token.trim()],
      function(err) {
        if (err) {
          logger.error('Failed to create organization', { 
            error: err.message, 
            name,
            description
          });
          
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.redirect('/admin/organizations?error=Organization name already exists');
          }
          
          return res.redirect('/admin/organizations?error=Failed to create organization');
        }
        
        logger.info('Organization created successfully', { 
          id: this.lastID, 
          name, 
          description 
        });
        res.redirect('/admin/organizations?success=Organization created successfully');
      }
    );
  }
);

// POST /admin/organizations/:id/delete — delete organization
router.post(
  '/admin/organizations/:id/delete',
  ensureAuth,
  ensureAdmin,
  (req, res) => {
    const orgId = parseInt(req.params.id);
    
    // Don't allow deletion of the default organization (ID 1)
    if (orgId === 1) {
      return res.redirect('/admin/organizations?error=Cannot delete the default organization');
    }
    
    // Check if organization has users
    db.get(
      `SELECT COUNT(*) as user_count FROM users WHERE organization_id = ?`,
      [orgId],
      (err, result) => {
        if (err) {
          logger.error('Failed to check organization users', { error: err.message, orgId });
          return res.redirect('/admin/organizations?error=Failed to check organization users');
        }
        
        if (result.user_count > 0) {
          return res.redirect('/admin/organizations?error=Cannot delete organization with existing users');
        }
        
        // Delete the organization
        db.run(
          `DELETE FROM organizations WHERE id = ?`,
          [orgId],
          function(err) {
            if (err) {
              logger.error('Failed to delete organization', { error: err.message, orgId });
              return res.redirect('/admin/organizations?error=Failed to delete organization');
            }
            
            if (this.changes === 0) {
              return res.redirect('/admin/organizations?error=Organization not found');
            }
            
            logger.info('Organization deleted successfully', { orgId });
            res.redirect('/admin/organizations?success=Organization deleted successfully');
          }
        );
      }
    );
  }
);

module.exports = router;
