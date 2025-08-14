// app.js
require('dotenv').config();
const express       = require('express');
const path          = require('path');
const session       = require('express-session');
const db            = require('./db');
const authRoutes    = require('./routes/auth');
const adminRoutes   = require('./routes/admin');
const sensorRoutes  = require('./routes/sensors');
const { ensureAuth }= require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3100;

// View engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Static & body parsing
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

// Expose user to views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Mount routes
app.use(authRoutes);
app.use(adminRoutes);
app.use(sensorRoutes);

// Protected dashboard
app.get('/dashboard', ensureAuth, (req, res) => {
  res.render('dashboard');
});

// 404 handler
app.use((req, res) => {
  res.status(404).send('Not Found');
});

// Start
app.listen(PORT, () => {
  console.log(`Listening: http://localhost:${PORT}`);
});
