// routes/auth.js
const express = require('express');
const bcrypt  = require('bcrypt');
const db      = require('../utils/db');
const { validateLogin } = require('../middleware/validation');
const logger  = require('../utils/logger');
const router  = express.Router();

// GET /login
router.get('/login', (req, res) => {
   // no error to show on first visit
   res.render('login', {error: null});
});

// POST /login
router.post('/login', validateLogin, (req, res) => {
  const { username, password } = req.body;
  
  // Join with organizations table to get organization name
  db.get(`
    SELECT u.*, o.name as organization_name 
    FROM users u 
    LEFT JOIN organizations o ON u.organization_id = o.id 
    WHERE u.username = ?
  `, [username], (err, user) => {
    if (err) {
      logger.error('Database error during login', { error: err.message, username });
      return res.render('login', { error: 'Login failed. Please try again.' });
    }
    
    if (!user || !bcrypt.compareSync(password, user.password)) {
      logger.warn('Failed login attempt', { username });
      return res.render('login', { error: 'Invalid credentials' });
    }
    
    req.session.user = { 
      id: user.id, 
      username: user.username, 
      role: user.role,
      organization: user.organization_name || 'Unknown'
    };
    
    logger.info('User logged in successfully', { 
      userId: user.id, 
      username: user.username,
      role: user.role,
      organization: user.organization_name || 'Unknown'
    });
    
    res.redirect('/dashboard');
  });
});

// POST /logout
router.post('/logout', (req, res) => {
  const username = req.session.user?.username;
  req.session.destroy(() => {
    logger.info('User logged out', { username });
    res.redirect('/login');
  });
});

module.exports = router;
