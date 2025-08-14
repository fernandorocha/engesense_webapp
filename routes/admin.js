// routes/admin.js
const express              = require('express');
const bcrypt               = require('bcrypt');
const db                   = require('../db');
const { ensureAuth, ensureAdmin } = require('../middleware/auth');
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
        if (err) throw err;
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
  (req, res) => {
    const { username, password, role, organization } = req.body;
    const hash = bcrypt.hashSync(password, 10);
    db.run(
      `INSERT INTO users (username, password, role, organization)
       VALUES (?, ?, ?, ?)`,
      [username, hash, role, organization],
      err => {
        if (err) {
          return db.all(
            `SELECT id, username, role, organization FROM users`,
            (_, rows) =>
              res.render('admin_users', {
                users: rows,
                error: 'Username already exists'
              })
          );
        }
        res.redirect('/admin/users');
      }
    );
  }
);

module.exports = router;
