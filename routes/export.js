const express = require('express');
const { querySensorReadings } = require('../utils/influx');
const { ensureAuth }        = require('../middleware/auth');
const { validateSensorQuery } = require('../middleware/validation');
const logger                = require('../utils/logger');
const { Parser } = require('json2csv');

const router = express.Router();

router.get('/export', ensureAuth, validateSensorQuery, async (req, res) => {
  const { range, start, stop, limit = '5000', buckets, measurements } = req.query;

  try {
    // Parse buckets and measurements from query parameters
    const bucketList = buckets ? buckets.split(',').map(b => b.trim()).filter(b => b) : [];
    const measurementList = measurements ? measurements.split(',').map(m => m.trim()).filter(m => m) : [];
    
    const readings = await querySensorReadings({
      range,
      start,
      stop,
      limit: parseInt(limit, 10),
      buckets: bucketList,
      measurements: measurementList
    });
    
    if (readings.length === 0) {
      logger.warn('No data found for export', { range, start, stop, buckets: bucketList, measurements: measurementList });
      return res.status(404).send('No sensor data found for the specified parameters.');
    }
    
    const parser = new Parser();
    const csv = parser.parse(readings);

    // Generate filename with measurements and timestamp range if available
    const measurementSuffix = measurementList.length > 0 ? measurementList.join('_') : 'data';
    const filename = start && stop 
      ? `sensor_${measurementSuffix}_${start.replace(/:/g, '-')}_${stop.replace(/:/g, '-')}.csv`
      : `sensor_${measurementSuffix}_${new Date().toISOString().slice(0, 10)}.csv`;

    res.header('Content-Type', 'text/csv');
    res.attachment(filename);
    res.send(csv);
    
    logger.info('CSV export completed', { 
      filename,
      recordCount: readings.length,
      range,
      start,
      stop,
      buckets: bucketList,
      measurements: measurementList
    });
    
  } catch (err) {
    logger.error('CSV export failed', { 
      error: err.message,
      range,
      start,
      stop,
      limit,
      buckets,
      measurements
    });
    res.status(500).send('Error generating CSV export.');
  }
});

module.exports = router;
