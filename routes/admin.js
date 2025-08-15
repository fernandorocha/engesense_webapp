// routes/admin.js
const express              = require('express');
const bcrypt               = require('bcrypt');
const db                   = require('../db');
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
    db.all(
      `SELECT id, username, role, organization FROM users`,
      (err, rows) => {
        if (err) {
          logger.error('Failed to fetch users list', { error: err.message });
          return res.status(500).render('admin_users', { 
            users: [], 
            error: 'Failed to load users' 
          });
        }
        res.render('admin_users', { users: rows, error: null });
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
    const { username, password, role, organization } = req.body;
    const hash = bcrypt.hashSync(password, 10);
    
    db.run(
      `INSERT INTO users (username, password, role, organization)
       VALUES (?, ?, ?, ?)`,
      [username, hash, role, organization],
      err => {
        if (err) {
          logger.error('Failed to create user', { 
            error: err.message, 
            username,
            role
          });
          
          return db.all(
            `SELECT id, username, role, organization FROM users`,
            (_, rows) =>
              res.render('admin_users', {
                users: rows,
                error: 'Username already exists'
              })
          );
        }
        
        logger.info('User created successfully', { username, role });
        res.redirect('/admin/users');
      }
    );
  }
);

module.exports = router;
