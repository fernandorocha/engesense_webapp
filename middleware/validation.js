// middleware/validation.js

/**
 * Validates sensor query parameters
 */
function validateSensorQuery(req, res, next) {
  const { range, start, stop } = req.query;
  
  // Validate time range parameters
  if (start && stop) {
    // Basic ISO date validation
    const startDate = new Date(start);
    const stopDate = new Date(stop);
    
    if (isNaN(startDate.getTime()) || isNaN(stopDate.getTime())) {
      return res.status(400).json({ 
        error: 'Invalid start/stop parameters. Must be valid ISO 8601 dates.' 
      });
    }
    
    if (startDate >= stopDate) {
      return res.status(400).json({ 
        error: 'Start time must be before stop time.' 
      });
    }
  }
  
  // Validate range parameter (if no start/stop provided)
  if (range && !start && !stop) {
    const validRangePattern = /^-?\d+[smhd]$/;
    if (!validRangePattern.test(range)) {
      return res.status(400).json({ 
        error: 'Invalid range parameter. Use format like -1h, -30m, -7d.' 
      });
    }
  }
  
  next();
}

/**
 * Validates user creation parameters
 */
function validateUserCreation(req, res, next) {
  const { username, password, role, organization_id, email } = req.body;
  
  if (!username || typeof username !== 'string' || username.trim().length < 3) {
    return res.status(400).json({ 
      error: 'Username must be at least 3 characters long.' 
    });
  }
  
  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ 
      error: 'Password must be at least 6 characters long.' 
    });
  }
  
  if (!role || !['admin', 'client'].includes(role)) {
    return res.status(400).json({ 
      error: 'Role must be either "admin" or "client".' 
    });
  }
  
  if (!organization_id || isNaN(parseInt(organization_id))) {
    return res.status(400).json({ 
      error: 'Valid organization is required.' 
    });
  }
  
  // Email validation (optional but if provided must be valid)
  if (email && email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ 
        error: 'Invalid email format.' 
      });
    }
  }
  
  // Sanitize inputs
  req.body.username = username.trim().toLowerCase();
  req.body.organization_id = parseInt(organization_id);
  if (req.body.first_name) req.body.first_name = req.body.first_name.trim();
  if (req.body.last_name) req.body.last_name = req.body.last_name.trim();
  if (req.body.email) req.body.email = req.body.email.trim().toLowerCase();
  if (req.body.phone) req.body.phone = req.body.phone.trim();
  if (req.body.job_title) req.body.job_title = req.body.job_title.trim();
  
  next();
}

/**
 * Validates login parameters
 */
function validateLogin(req, res, next) {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.render('login', { 
      error: 'Username and password are required.' 
    });
  }
  
  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.render('login', { 
      error: 'Invalid credentials format.' 
    });
  }
  
  // Sanitize username
  req.body.username = username.trim().toLowerCase();
  
  next();
}

module.exports = {
  validateSensorQuery,
  validateUserCreation,
  validateLogin
};