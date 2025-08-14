// routes/auth.js
const express = require('express');
const bcrypt  = require('bcrypt');
const db      = require('../db');
const router  = express.Router();

// GET /login
router.get('/login', (req, res) => {
   // no error to show on first visit
   res.render('login', {error: null});
});

// POST /login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
    if (err) throw err;
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.render('login', { error: 'Invalid credentials' });
    }
    req.session.user = { id: user.id, username: user.username, role: user.role };
    res.redirect('/dashboard');
  });
});

// POST /logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

module.exports = router;
