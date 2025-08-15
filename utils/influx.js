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
 * Query sensor readings with flexible time range support
 * @param {Object} params - Query parameters
 * @param {string} [params.range] - Relative time range (e.g., '-1h', '-30m')
 * @param {string} [params.start] - Start time (ISO 8601)
 * @param {string} [params.stop] - Stop time (ISO 8601)
 * @param {number} [params.limit=1000] - Maximum number of readings to return
 * @returns {Promise<Array>} Array of sensor readings
 */
async function querySensorReadings({ range, start, stop, limit = 1000 }) {
  if (!process.env.INFLUX_BUCKET) {
    throw new Error('INFLUX_BUCKET not defined in .env');
  }

  // Build the correct Flux range clause
  // If absolute times provided, wrap them in time(v: "...") so Flux treats them as instants
  let rangeClause;
  if (start && stop) {
    rangeClause = [
      `|> range(`,
      `  start: time(v: "${start}"),`,
      `  stop:  time(v: "${stop}")`,
      `)`
    ].join('\n');
  } else {
    // relative e.g. -1h, -30m
    rangeClause = `|> range(start: ${range || '-1h'})`;
  }

  const flux = `
    from(bucket: "${process.env.INFLUX_BUCKET}")
      ${rangeClause}
      |> filter(fn: (r) => r._measurement == "home_pt" and r._field == "value")
      |> sort(columns: ["_time"], desc: false)
      |> limit(n: ${limit})
  `;
  
  logger.debug('Executing Flux query', { query: flux.trim() });

  const readings = [];
  return new Promise((resolve, reject) => {
    queryApi.queryRows(flux, {
      next(row, tableMeta) {
        try {
          const o = tableMeta.toObject(row);
          readings.push({ 
            timestamp: o._time, 
            value: parseFloat(o._value) 
          });
        } catch (err) {
          logger.error('Error parsing row data', { error: err.message });
          // Continue processing other rows
        }
      },
      error(err) {
        logger.error('InfluxDB query error', { 
          error: err.message,
          query: flux.trim()
        });
        reject(new Error('Failed to query sensor data'));
      },
      complete() {
        logger.info('InfluxDB query completed', { 
          pointsReturned: readings.length,
          limit
        });
        resolve(readings);
      }
    });
  });
}

module.exports = { querySensorReadings };
