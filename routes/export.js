const express = require('express');
const { querySensorReadings } = require('../utils/influx');
const { ensureAuth }        = require('../middleware/auth');
const { validateSensorQuery } = require('../middleware/validation');
const logger                = require('../utils/logger');
const { Parser } = require('json2csv');
const XLSX = require('xlsx');

const router = express.Router();

router.get('/export', ensureAuth, validateSensorQuery, async (req, res) => {
  const { range, start, stop, limit = '5000', buckets, measurements, format = 'csv' } = req.query;

  try {
    const organization = req.session.user.organization;
    
    if (!organization) {
      return res.status(400).send('User organization not found');
    }
    
    // Parse buckets and measurements from query parameters
    const bucketList = buckets ? buckets.split(',').map(b => b.trim()).filter(b => b) : [];
    const measurementList = measurements ? measurements.split(',').map(m => m.trim()).filter(m => m) : [];
    
    if (bucketList.length === 0) {
      return res.status(400).send('At least one bucket must be specified');
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
    
    if (readings.length === 0) {
      logger.warn('No data found for export', { 
        range, start, stop, buckets: bucketList, measurements: measurementList, organization 
      });
      return res.status(404).send('No sensor data found for the specified parameters.');
    }
    
    // Generate filename with measurements and timestamp range if available
    const measurementSuffix = measurementList.length > 0 ? measurementList.join('_') : 'data';
    const baseFilename = start && stop 
      ? `sensor_${measurementSuffix}_${start.replace(/:/g, '-')}_${stop.replace(/:/g, '-')}`
      : `sensor_${measurementSuffix}_${new Date().toISOString().slice(0, 10)}`;

    if (format.toLowerCase() === 'excel' || format.toLowerCase() === 'xlsx') {
      // Excel export
      const worksheet = XLSX.utils.json_to_sheet(readings);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sensor Data');
      
      const filename = `${baseFilename}.xlsx`;
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.attachment(filename);
      res.send(buffer);
      
      logger.info('Excel export completed', { 
        filename,
        recordCount: readings.length,
        range,
        start,
        stop,
        buckets: bucketList,
        measurements: measurementList,
        organization
      });
    } else {
      // CSV export (default)
      const parser = new Parser();
      const csv = parser.parse(readings);
      const filename = `${baseFilename}.csv`;

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
        measurements: measurementList,
        organization
      });
    }
    
  } catch (err) {
    logger.error('Export failed', { 
      error: err.message,
      format,
      range,
      start,
      stop,
      limit,
      buckets,
      measurements,
      organization: req.session.user.organization
    });
    res.status(500).send(`Error generating ${format.toUpperCase()} export.`);
  }
});

module.exports = router;
