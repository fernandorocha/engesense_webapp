// routes/sensors.js
const express               = require('express');
const { querySensorReadings } = require('../utils/influx');
const { ensureAuth }        = require('../middleware/auth');
const { validateSensorQuery } = require('../middleware/validation');
const logger                = require('../utils/logger');

const router = express.Router();

router.get('/api/sensors', ensureAuth, validateSensorQuery, async (req, res) => {
  const { range, start, stop, limit = '5000' } = req.query;

  try {
    const readings = await querySensorReadings({
      range,
      start,
      stop,
      limit: parseInt(limit, 10)
    });
    
    logger.info('Sensor data fetched successfully', { 
      count: readings.length,
      range,
      start,
      stop,
      limit
    });
    
    res.json({ readings });
  } catch (err) {
    logger.error('Failed to fetch sensor data', { 
      error: err.message,
      range,
      start,
      stop,
      limit
    });
    res.status(500).json({ error: 'Could not fetch sensor data' });
  }
});

module.exports = router;
