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
    // Get users with organization information
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
            error: null 
          });
        });
      }
    );
  }
);

// POST /admin/users — create new user
router.post(
  '/admin/users',
  ensureAuth,
  ensureAdmin,
  validateUserCreation,
  (req, res) => {
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
                  error: 'Username already exists or invalid data'
                });
              });
            }
          );
        }
        
        logger.info('User created successfully', { username, role, email });
        res.redirect('/admin/users');
      }
    );
  }
);

module.exports = router;
