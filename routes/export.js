const express = require('express');
const { querySensorReadings } = require('../utils/influx');
const { ensureAuth }        = require('../middleware/auth');
const { validateSensorQuery } = require('../middleware/validation');
const logger                = require('../utils/logger');
const { Parser } = require('json2csv');
const XLSX = require('xlsx');

const router = express.Router();

/**
 * Groups readings by bucket and timestamp for Excel export
 * @param {Array} readings - Array of sensor readings
 * @returns {Object} Grouped data by bucket, then by timestamp
 */
function groupDataByTimestampAndBucket(readings) {
  const grouped = {};
  
  readings.forEach(reading => {
    const { bucket, timestamp, measurement, value } = reading;
    
    if (!grouped[bucket]) {
      grouped[bucket] = {};
    }
    
    if (!grouped[bucket][timestamp]) {
      grouped[bucket][timestamp] = {};
    }
    
    grouped[bucket][timestamp][measurement] = value;
  });
  
  return grouped;
}

/**
 * Converts timestamped data to an array format suitable for Excel sheets
 * @param {Object} timestampData - Data grouped by timestamp
 * @returns {Array} Array of objects for Excel sheet
 */
function convertToTimeseriesFormat(timestampData) {
  const result = [];
  const timestamps = Object.keys(timestampData).sort();
  
  timestamps.forEach(timestamp => {
    const row = { timestamp };
    const measurements = timestampData[timestamp];
    
    // Add each measurement as a column
    Object.keys(measurements).forEach(measurement => {
      row[measurement] = measurements[measurement];
    });
    
    result.push(row);
  });
  
  return result;
}

/**
 * Groups readings by timestamp for CSV export with bucket:measurement columns
 * @param {Array} readings - Array of sensor readings
 * @returns {Array} Array of objects grouped by timestamp
 */
function groupDataForCSV(readings) {
  const grouped = {};
  
  readings.forEach(reading => {
    const { timestamp, bucket, measurement, value } = reading;
    
    if (!grouped[timestamp]) {
      grouped[timestamp] = { timestamp };
    }
    
    const columnName = `${bucket}:${measurement}`;
    grouped[timestamp][columnName] = value;
  });
  
  // Convert to array and sort by timestamp
  const result = Object.values(grouped);
  result.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  return result;
}

router.get('/export', ensureAuth, validateSensorQuery, async (req, res) => {
  const { range, start, stop, buckets, measurements, format = 'csv' } = req.query;

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
      // Excel export - group by timestamp with separate sheets per bucket
      const groupedData = groupDataByTimestampAndBucket(readings);
      const workbook = XLSX.utils.book_new();
      
      // Create a sheet for each bucket
      for (const [bucket, timestampData] of Object.entries(groupedData)) {
        const sheetData = convertToTimeseriesFormat(timestampData);
        const worksheet = XLSX.utils.json_to_sheet(sheetData);
        XLSX.utils.book_append_sheet(workbook, worksheet, bucket);
      }
      
      const filename = `${baseFilename}.xlsx`;
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.attachment(filename);
      res.send(buffer);
      
      logger.info('Excel export completed', { 
        filename,
        recordCount: readings.length,
        sheets: Object.keys(groupedData).length,
        range,
        start,
        stop,
        buckets: bucketList,
        measurements: measurementList,
        organization
      });
    } else {
      // CSV export (default) - group by timestamp with bucket:measurement columns
      const csvData = groupDataForCSV(readings);
      const parser = new Parser();
      const csv = parser.parse(csvData);
      const filename = `${baseFilename}.csv`;

      res.header('Content-Type', 'text/csv');
      res.attachment(filename);
      res.send(csv);
      
      logger.info('CSV export completed', { 
        filename,
        recordCount: readings.length,
        timePoints: csvData.length,
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
      buckets,
      measurements,
      organization: req.session.user.organization
    });
    res.status(500).send(`Error generating ${format.toUpperCase()} export.`);
  }
});

module.exports = router;
