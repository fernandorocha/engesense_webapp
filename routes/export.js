const express = require('express');
const { querySensorReadings } = require('../utils/influx');
const { ensureAuth }        = require('../middleware/auth');
const { validateSensorQuery } = require('../middleware/validation');
const logger                = require('../utils/logger');
const { Parser } = require('json2csv');

const router = express.Router();

router.get('/export', ensureAuth, validateSensorQuery, async (req, res) => {
  const { range, start, stop, limit = '5000' } = req.query;

  try {
    const readings = await querySensorReadings({
      range,
      start,
      stop,
      limit: parseInt(limit, 10)
    });
    
    if (readings.length === 0) {
      logger.warn('No data found for export', { range, start, stop });
      return res.status(404).send('No sensor data found for the specified time range.');
    }
    
    const parser = new Parser();
    const csv = parser.parse(readings);

    // Generate filename with timestamp range if available
    const filename = start && stop 
      ? `sensor_home_pt_${start.replace(/:/g, '-')}_${stop.replace(/:/g, '-')}.csv`
      : `sensor_home_pt_${new Date().toISOString().slice(0, 10)}.csv`;

    res.header('Content-Type', 'text/csv');
    res.attachment(filename);
    res.send(csv);
    
    logger.info('CSV export completed', { 
      filename,
      recordCount: readings.length,
      range,
      start,
      stop
    });
    
  } catch (err) {
    logger.error('CSV export failed', { 
      error: err.message,
      range,
      start,
      stop,
      limit
    });
    res.status(500).send('Error generating CSV export.');
  }
});

module.exports = router;
