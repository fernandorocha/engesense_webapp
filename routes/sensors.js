// routes/sensors.js
const express               = require('express');
const { querySensorReadings, getBuckets, getMeasurements } = require('../utils/influx');
const { ensureAuth }        = require('../middleware/auth');
const { validateSensorQuery } = require('../middleware/validation');
const logger                = require('../utils/logger');

const router = express.Router();

// GET /api/buckets - Get available buckets for user's organization
router.get('/api/buckets', ensureAuth, async (req, res) => {
  try {
    const organization = req.session.user.organization;
    
    if (!organization) {
      return res.status(400).json({ error: 'User organization not found' });
    }
    
    const buckets = await getBuckets(organization);
    
    logger.info('Buckets fetched successfully', { 
      count: buckets.length,
      organization,
      user: req.session.user.username
    });
    
    res.json({ buckets });
  } catch (err) {
    logger.error('Failed to fetch buckets', { 
      error: err.message,
      organization: req.session.user.organization,
      user: req.session.user.username
    });
    res.status(500).json({ error: 'Could not fetch buckets' });
  }
});

// GET /api/measurements - Get available measurements from specified buckets
router.get('/api/measurements', ensureAuth, async (req, res) => {
  try {
    const { buckets } = req.query;
    const bucketList = buckets ? buckets.split(',').map(b => b.trim()).filter(b => b) : [];
    const organization = req.session.user.organization;
    
    if (!organization) {
      return res.status(400).json({ error: 'User organization not found' });
    }
    
    if (bucketList.length === 0) {
      return res.json({ measurements: [] });
    }
    
    const measurements = await getMeasurements(organization, bucketList);
    
    logger.info('Measurements fetched successfully', { 
      count: measurements.length,
      buckets: bucketList,
      organization,
      user: req.session.user.username
    });
    
    res.json({ measurements });
  } catch (err) {
    logger.error('Failed to fetch measurements', { 
      error: err.message,
      buckets: req.query.buckets,
      organization: req.session.user.organization,
      user: req.session.user.username
    });
    res.status(500).json({ error: 'Could not fetch measurements' });
  }
});

router.get('/api/sensors', ensureAuth, validateSensorQuery, async (req, res) => {
  const { range, start, stop, limit = '5000', buckets, measurements } = req.query;

  try {
    const organization = req.session.user.organization;
    
    if (!organization) {
      return res.status(400).json({ error: 'User organization not found' });
    }
    
    // Parse buckets and measurements from query parameters
    const bucketList = buckets ? buckets.split(',').map(b => b.trim()).filter(b => b) : [];
    const measurementList = measurements ? measurements.split(',').map(m => m.trim()).filter(m => m) : [];
    
    if (bucketList.length === 0) {
      return res.status(400).json({ error: 'At least one bucket must be specified' });
    }
    
    const readings = await querySensorReadings({
      organization,
      range,
      start,
      stop,
      limit: parseInt(limit, 10),
      buckets: bucketList,
      measurements: measurementList
    });
    
    logger.info('Sensor data fetched successfully', { 
      count: readings.length,
      range,
      start,
      stop,
      limit,
      buckets: bucketList,
      measurements: measurementList,
      organization,
      user: req.session.user.username
    });
    
    res.json({ readings });
  } catch (err) {
    logger.error('Failed to fetch sensor data', { 
      error: err.message,
      range,
      start,
      stop,
      limit,
      buckets,
      measurements,
      organization: req.session.user.organization,
      user: req.session.user.username
    });
    res.status(500).json({ error: 'Could not fetch sensor data' });
  }
});

module.exports = router;
