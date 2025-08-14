// utils/influx.js
require('dotenv').config();
const { InfluxDB } = require('@influxdata/influxdb-client');

const client   = new InfluxDB({
  url:   process.env.INFLUX_URL,
  token: process.env.INFLUX_TOKEN
});
const queryApi = client.getQueryApi(process.env.INFLUX_ORG);

async function querySensorReadings({ range, start, stop, limit = 5000 }) {
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
  console.log('[influx] Flux Query:', flux.trim());

  const readings = [];
  return new Promise((resolve, reject) => {
    queryApi.queryRows(flux, {
      next(row, tableMeta) {
        const o = tableMeta.toObject(row);
        readings.push({ timestamp: o._time, value: parseFloat(o._value) });
      },
      error(err) {
        console.error('[influx] query error:', err);
        reject(err);
      },
      complete() {
        console.log(`[influx] fetched ${readings.length} points`);
        resolve(readings);
      }
    });
  });
}

module.exports = { querySensorReadings };
