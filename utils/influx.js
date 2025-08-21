// utils/influx.js
require('dotenv').config();
const { InfluxDB } = require('@influxdata/influxdb-client');
const logger = require('./logger');

const client = new InfluxDB({
  url:   process.env.INFLUX_URL,
  token: process.env.INFLUX_TOKEN,
  timeout: 0 // Remove any timeout limits for queries
});

/**
 * Get available buckets filtered by organization
 * @param {string} organization - Organization name to filter buckets
 * @returns {Promise<Array>} Array of bucket names
 */
async function getBuckets(organization) {
  const queryApi = client.getQueryApi(organization);
  
  try {
    const flux = `
      import "strings"
      
      buckets()
        |> filter(fn: (r) => not strings.hasPrefix(v: r.name, prefix: "_"))
        |> keep(columns: ["name"])
    `;
    
    logger.debug('Executing buckets query', { query: flux.trim(), organization });
    console.log('InfluxDB Query - getBuckets():', flux.trim());

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
          reject(err);
        },
        complete() {
          logger.info('Buckets query completed', { 
            bucketsFound: buckets.length,
            organization
          });
          resolve(buckets);
        }
      }, { /* No query options - remove any default limits */ });
    });
  } catch (err) {
    logger.error('InfluxDB connection failed', { error: err.message });
    throw err;
  }
}

/**
 * Get available measurements from specified buckets
 * @param {string} organization - Organization name for InfluxDB connection
 * @param {Array<string>} buckets - Array of bucket names
 * @returns {Promise<Array>} Array of measurement names
 */
async function getMeasurements(organization, buckets) {
  if (!buckets || buckets.length === 0) {
    return [];
  }

  const queryApi = client.getQueryApi(organization);
  const measurementsSet = new Set();
  try {
    for (const bucket of buckets) {
      const flux = `
        import "influxdata/influxdb/schema"
        schema.measurements(bucket: "${bucket}")
      `;
      logger.debug('Executing measurements query', { query: flux.trim(), bucket });
      console.log(`InfluxDB Query - getMeasurements() for bucket "${bucket}":`, flux.trim());
      await new Promise((resolve, reject) => {
        queryApi.queryRows(flux, {
          next(row, tableMeta) {
            try {
              const o = tableMeta.toObject(row);
              if (o._value) {
                // Prefix with bucket name for uniqueness
                const prefixed = `${bucket}:${o._value}`;
                measurementsSet.add(prefixed);
              }
            } catch (err) {
              logger.error('Error parsing measurement row data', { error: err.message });
            }
          },
          error(err) {
            logger.error('InfluxDB measurements query error', { 
              error: err.message,
              query: flux.trim(),
              bucket
            });
            reject(err);
          },
          complete() {
            logger.info('Measurements query completed', { 
              bucket,
              measurementsFound: Array.from(measurementsSet).filter(m => m.startsWith(`${bucket}:`)).length
            });
            resolve();
          }
        }, { /* No query options - remove any default limits */ });
      });
    }
    return Array.from(measurementsSet);
  } catch (err) {
    logger.error('InfluxDB connection failed', { error: err.message });
    throw err;
  }
}



/**
 * Query sensor readings with flexible time range support
 * @param {Object} params - Query parameters
 * @param {string} params.organization - Organization name for InfluxDB connection
 * @param {string} [params.range] - Relative time range (e.g., '-1h', '-30m')
 * @param {string} [params.start] - Start time (ISO 8601)
 * @param {string} [params.stop] - Stop time (ISO 8601)
 * @param {Array<string>} params.buckets - Array of bucket names to query (required)
 * @param {Array<string>} [params.measurements] - Array of measurement names to query
 * @returns {Promise<Array>} Array of sensor readings with measurement info
 */
async function querySensorReadings({ organization, range, start, stop, buckets, measurements }) {
  if (!organization) {
    throw new Error('Organization is required for InfluxDB queries');
  }
  
  if (!buckets || buckets.length === 0) {
    throw new Error('At least one bucket must be specified');
  }
  
  const queryApi = client.getQueryApi(organization);
  const queryMeasurements = measurements && measurements.length > 0 ? measurements : ['home_pt'];

  // Group measurements by bucket to maintain bucket-measurement relationships
  const bucketMeasurements = {};
  
  // If measurements include bucket prefixes (bucket:measurement), group them by bucket
  queryMeasurements.forEach(m => {
    if (m.includes(':')) {
      const [bucket, measurement] = m.split(':', 2);
      if (!bucketMeasurements[bucket]) {
        bucketMeasurements[bucket] = [];
      }
      bucketMeasurements[bucket].push(measurement);
    } else {
      // If no bucket prefix, apply to all specified buckets
      buckets.forEach(bucket => {
        if (!bucketMeasurements[bucket]) {
          bucketMeasurements[bucket] = [];
        }
        bucketMeasurements[bucket].push(m);
      });
    }
  });

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

  let readings = [];
  
  try {
    // Create promises for parallel bucket processing
    const bucketPromises = buckets.map(async (bucket) => {
      const bucketSpecificMeasurements = bucketMeasurements[bucket];
      
      // Skip buckets that have no measurements to query
      if (!bucketSpecificMeasurements || bucketSpecificMeasurements.length === 0) {
        logger.debug('Skipping bucket with no measurements', { bucket });
        return [];
      }

      // Remove duplicates from measurements for this bucket
      const uniqueMeasurements = [...new Set(bucketSpecificMeasurements)];

      // Build measurement filter using OR conditions as requested
      const measurementFilter = uniqueMeasurements.length === 1 
        ? `r["_measurement"] == "${uniqueMeasurements[0]}"` 
        : uniqueMeasurements.map(m => `r["_measurement"] == "${m}"`).join(' or ');

      const flux = `
        from(bucket: "${bucket}")
          ${rangeClause}
          |> filter(fn: (r) => (${measurementFilter}) and r._field == "value")
          //|> sort(columns: ["_time"], desc: false)
      `;
      
      logger.debug('Executing Flux query', { 
        query: flux.trim(), 
        bucket, 
        measurements: uniqueMeasurements,
        organization 
      });
      console.log(`InfluxDB Query - querySensorReadings() for bucket "${bucket}":`, flux.trim());

      return new Promise((resolve, reject) => {
        const bucketReadings = [];
        
        queryApi.queryRows(flux, {
          next(row, tableMeta) {
            try {
              const o = tableMeta.toObject(row);
              bucketReadings.push({ 
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
              bucket,
              measurements: uniqueMeasurements,
              organization
            });
            reject(err);
          },
          complete() {
            logger.debug('Bucket query completed', { 
              bucket,
              measurements: uniqueMeasurements,
              organization,
              pointsReturned: bucketReadings.length
            });
            resolve(bucketReadings);
          }
        }, { /* No query options - remove any default limits */ });
      });
    });

    // Execute all bucket queries in parallel with improved error handling
    const bucketResults = await Promise.allSettled(bucketPromises);
    
    // Process results and handle any rejections gracefully
    bucketResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        // Use concat instead of spread operator for large arrays to avoid call stack overflow
        readings = readings.concat(result.value);
      } else {
        logger.warn('Bucket query failed, skipping bucket', { 
          bucket: buckets[index], 
          error: result.reason?.message || 'Unknown error' 
        });
      }
    });
  } catch (err) {
    logger.error('InfluxDB connection failed', { error: err.message, organization });
    throw err;
  }

  // Sort combined results by timestamp efficiently for large datasets
  // Since individual bucket queries are already sorted, we only need to merge-sort for multiple buckets
  if (buckets.length === 1) {
    // Single bucket: data is already sorted from InfluxDB
    logger.debug('Single bucket query, data already sorted', { pointsReturned: readings.length });
  } else {
    // Multiple buckets: use efficient merge approach
    logger.debug('Multiple bucket query, merging sorted results', { 
      pointsReturned: readings.length, 
      bucketCount: buckets.length 
    });
    readings.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }
  
  logger.info('InfluxDB query completed', { 
    pointsReturned: readings.length,
    buckets: buckets,
    bucketMeasurements: bucketMeasurements,
    originalMeasurements: queryMeasurements,
    organization
  });
  
  return readings;
}

module.exports = { querySensorReadings, getBuckets, getMeasurements };
