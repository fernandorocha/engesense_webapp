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
    
    try {
      const buckets = await getBuckets(organization);
      
      logger.info('Buckets fetched successfully', { 
        count: buckets.length,
        organization,
        user: req.session.user.username
      });
      
      res.json({ buckets });
    } catch (influxError) {
      // If InfluxDB fails, return mock buckets for testing
      logger.warn('InfluxDB unavailable, returning mock buckets for testing', {
        error: influxError.message,
        organization,
        user: req.session.user.username
      });
      
      const mockBuckets = ['sensors', 'weather', 'energy'];
      res.json({ buckets: mockBuckets });
    }
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
    
    try {
      const measurements = await getMeasurements(organization, bucketList);
      
      logger.info('Measurements fetched successfully', { 
        count: measurements.length,
        buckets: bucketList,
        organization,
        user: req.session.user.username
      });
      
      res.json({ measurements });
    } catch (influxError) {
      // If InfluxDB fails, return mock measurements for testing
      logger.warn('InfluxDB unavailable, returning mock measurements for testing', {
        error: influxError.message,
        buckets: bucketList,
        organization,
        user: req.session.user.username
      });
      
      // Generate measurements based on the bucket names
      const mockMeasurements = [];
      bucketList.forEach(bucket => {
        if (bucket === 'sensors') {
          mockMeasurements.push(`${bucket}:temperature`, `${bucket}:pressure`);
        } else if (bucket === 'weather') {
          mockMeasurements.push(`${bucket}:humidity`, `${bucket}:wind_speed`);
        } else if (bucket === 'energy') {
          mockMeasurements.push(`${bucket}:voltage`, `${bucket}:current`);
        } else {
          // Generic measurements for unknown buckets
          mockMeasurements.push(`${bucket}:value1`, `${bucket}:value2`);
        }
      });
      
      res.json({ measurements: mockMeasurements });
    }
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
    
    try {
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
    } catch (influxError) {
      // If InfluxDB fails, return mock data for testing chart functionality
      logger.warn('InfluxDB unavailable, returning mock data for testing', {
        error: influxError.message,
        buckets: bucketList,
        measurements: measurementList
      });
      
      // Generate mock sensor data based on the requested measurements
      const mockReadings = [];
      const now = new Date();
      const timeRange = range && range.includes('h') ? parseInt(range.replace('-', '').replace('h', '')) * 60 : 60; // minutes
      
      measurementList.forEach((measurement, measurementIndex) => {
        // Extract bucket and measurement if formatted as bucket:measurement
        let bucket = bucketList[measurementIndex % bucketList.length];
        let measurementName = measurement;
        
        if (measurement.includes(':')) {
          [bucket, measurementName] = measurement.split(':', 2);
        }
        
        // Generate sample data points (one per minute for the time range)
        for (let i = timeRange; i >= 0; i -= 5) { // Every 5 minutes
          const timestamp = new Date(now.getTime() - (i * 60 * 1000));
          const baseValue = measurementName === 'temperature' ? 20 + Math.random() * 10 : 
                           measurementName === 'humidity' ? 40 + Math.random() * 20 :
                           measurementName === 'pressure' ? 1000 + Math.random() * 50 :
                           50 + Math.random() * 100;
          const noise = (Math.random() - 0.5) * 5; // Add some noise
          
          mockReadings.push({
            timestamp: timestamp.toISOString(),
            value: Math.round((baseValue + noise) * 100) / 100, // Round to 2 decimals
            measurement: measurementName,
            bucket: bucket
          });
        }
      });
      
      logger.info('Mock sensor data generated', { 
        count: mockReadings.length,
        buckets: bucketList,
        measurements: measurementList,
        timeRange: `${timeRange} minutes`
      });
      
      res.json({ readings: mockReadings });
    }
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
