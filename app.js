// app.js
require('dotenv').config();
const express       = require('express');
const path          = require('path');
const session       = require('express-session');
const { validateEnvironment, getConfig } = require('./utils/config');
const logger        = require('./utils/logger');
const db            = require('./db');
const authRoutes    = require('./routes/auth');
const adminRoutes   = require('./routes/admin');
const sensorRoutes  = require('./routes/sensors');
const exportRoute = require('./routes/export');
const { ensureAuth }= require('./middleware/auth');

// Validate environment before starting
validateEnvironment();
const config = getConfig();

const app = express();
const PORT = config.port;

// View engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Static & body parsing
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Session with improved security
app.use(session({
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.nodeEnv === 'production', // HTTPS in production
    httpOnly: true, // Prevent XSS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
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
app.use(exportRoute);

// Protected dashboard
app.get('/dashboard', ensureAuth, (req, res) => {
  res.render('dashboard');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).send('Not Found');
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { 
    error: err.message, 
    stack: err.stack,
    url: req.url,
    method: req.method
  });
  
  // Don't expose error details in production
  const isDevelopment = config.nodeEnv === 'development';
  res.status(500).json({
    error: 'Internal server error',
    ...(isDevelopment && { details: err.message })
  });
});

// Start
app.listen(PORT, () => {
  logger.info(`Server listening on port ${PORT}`, { 
    nodeEnv: config.nodeEnv,
    logLevel: config.logLevel
  });
});
