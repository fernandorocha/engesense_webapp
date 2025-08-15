// utils/influx.js
require('dotenv').config();
const { InfluxDB } = require('@influxdata/influxdb-client');
const logger = require('./logger');

const client   = new InfluxDB({
  url:   process.env.INFLUX_URL,
  token: process.env.INFLUX_TOKEN
});
const queryApi = client.getQueryApi(process.env.INFLUX_ORG);

/**
 * Get available buckets filtered by organization
 * @param {string} organization - Organization name to filter buckets
 * @returns {Promise<Array>} Array of bucket names
 */
async function getBuckets(organization) {
  const flux = `
    buckets()
      |> filter(fn: (r) => r.name =~ /^${organization}_/ or r.name == "${process.env.INFLUX_BUCKET}")
      |> keep(columns: ["name"])
  `;
  
  logger.debug('Executing buckets query', { query: flux.trim(), organization });

  const buckets = [];
  return new Promise((resolve, reject) => {
    queryApi.queryRows(flux, {
      next(row, tableMeta) {
        try {
          const o = tableMeta.toObject(row);
          buckets.push(o.name);
        } catch (err) {
          logger.error('Error parsing bucket row data', { error: err.message });
        }
      },
      error(err) {
        logger.error('InfluxDB buckets query error', { 
          error: err.message,
          query: flux.trim()
        });
        reject(new Error('Failed to query buckets'));
      },
      complete() {
        logger.info('Buckets query completed', { 
          bucketsFound: buckets.length,
          organization
        });
        resolve(buckets);
      }
    });
  });
}

/**
 * Get available measurements from specified buckets
 * @param {Array<string>} buckets - Array of bucket names
 * @returns {Promise<Array>} Array of measurement names
 */
async function getMeasurements(buckets) {
  if (!buckets || buckets.length === 0) {
    return [];
  }

  const bucketList = buckets.map(b => `"${b}"`).join(', ');
  const flux = `
    import "influxdata/influxdb/schema"
    
    schema.measurements(bucket: ${buckets.length === 1 ? buckets[0] : bucketList})
  `;
  
  logger.debug('Executing measurements query', { query: flux.trim(), buckets });

  const measurements = [];
  return new Promise((resolve, reject) => {
    queryApi.queryRows(flux, {
      next(row, tableMeta) {
        try {
          const o = tableMeta.toObject(row);
          if (o._value && !measurements.includes(o._value)) {
            measurements.push(o._value);
          }
        } catch (err) {
          logger.error('Error parsing measurement row data', { error: err.message });
        }
      },
      error(err) {
        logger.error('InfluxDB measurements query error', { 
          error: err.message,
          query: flux.trim()
        });
        reject(new Error('Failed to query measurements'));
      },
      complete() {
        logger.info('Measurements query completed', { 
          measurementsFound: measurements.length,
          buckets
        });
        resolve(measurements);
      }
    });
  });
}

/**
 * Query sensor readings with flexible time range support
 * @param {Object} params - Query parameters
 * @param {string} [params.range] - Relative time range (e.g., '-1h', '-30m')
 * @param {string} [params.start] - Start time (ISO 8601)
 * @param {string} [params.stop] - Stop time (ISO 8601)
 * @param {number} [params.limit=1000] - Maximum number of readings to return
 * @param {Array<string>} [params.buckets] - Array of bucket names to query
 * @param {Array<string>} [params.measurements] - Array of measurement names to query
 * @returns {Promise<Array>} Array of sensor readings with measurement info
 */
async function querySensorReadings({ range, start, stop, limit = 1000, buckets, measurements }) {
  // Use provided buckets or fall back to default
  const queryBuckets = buckets && buckets.length > 0 ? buckets : [process.env.INFLUX_BUCKET];
  const queryMeasurements = measurements && measurements.length > 0 ? measurements : ['home_pt'];
  
  if (!queryBuckets[0]) {
    throw new Error('No buckets specified and INFLUX_BUCKET not defined in .env');
  }

  // Build the correct Flux range clause
  let rangeClause;
  if (start && stop) {
    rangeClause = [
      `|> range(`,
      `  start: time(v: "${start}"),`,
      `  stop:  time(v: "${stop}")`,
      `)`
    ].join('\n');
  } else {
    rangeClause = `|> range(start: ${range || '-1h'})`;
  }

  // Build measurement filter
  const measurementFilter = queryMeasurements.length === 1 
    ? `r._measurement == "${queryMeasurements[0]}"` 
    : `contains(value: r._measurement, set: [${queryMeasurements.map(m => `"${m}"`).join(', ')}])`;

  const readings = [];
  
  // Query each bucket and combine results
  for (const bucket of queryBuckets) {
    const flux = `
      from(bucket: "${bucket}")
        ${rangeClause}
        |> filter(fn: (r) => ${measurementFilter} and r._field == "value")
        |> sort(columns: ["_time"], desc: false)
        |> limit(n: ${Math.ceil(limit / queryBuckets.length)})
    `;
    
    logger.debug('Executing Flux query', { query: flux.trim(), bucket });

    await new Promise((resolve, reject) => {
      queryApi.queryRows(flux, {
        next(row, tableMeta) {
          try {
            const o = tableMeta.toObject(row);
            readings.push({ 
              timestamp: o._time, 
              value: parseFloat(o._value),
              measurement: o._measurement,
              bucket: bucket
            });
          } catch (err) {
            logger.error('Error parsing row data', { error: err.message });
          }
        },
        error(err) {
          logger.error('InfluxDB query error', { 
            error: err.message,
            query: flux.trim(),
            bucket
          });
          reject(new Error(`Failed to query sensor data from bucket: ${bucket}`));
        },
        complete() {
          logger.debug('Bucket query completed', { 
            bucket,
            pointsReturned: readings.filter(r => r.bucket === bucket).length
          });
          resolve();
        }
      });
    });
  }

  // Sort combined results by timestamp and apply overall limit
  readings.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const limitedReadings = readings.slice(0, limit);
  
  logger.info('InfluxDB query completed', { 
    pointsReturned: limitedReadings.length,
    buckets: queryBuckets,
    measurements: queryMeasurements,
    limit
  });
  
  return limitedReadings;
}

module.exports = { querySensorReadings, getBuckets, getMeasurements };
