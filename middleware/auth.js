// middleware/auth.js

function ensureAuth(req, res, next) {
  if (req.session.user) return next();
  res.redirect('/login');
}

function ensureAdmin(req, res, next) {
  if (req.session.user?.role === 'admin') return next();
  res.status(403).send('Forbidden');
}

module.exports = { ensureAuth, ensureAdmin };
