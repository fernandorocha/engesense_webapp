const express = require('express');
const { Parser } = require('json2csv');
const router = express.Router();
const influxService = require('../utils/influx');

router.get('/export', async (req, res) => {
  const { sensorId, start, end } = req.query;

  try {
    const data = await influxService.querySensorData(sensorId, start, end);

    if (!data || data.length === 0) {
      return res.status(404).send('No data found.');
    }

    const parser = new Parser();
    const csv = parser.parse(data);

    res.header('Content-Type', 'text/csv');
    res.attachment(`sensor_${sensorId}_${start}_${end}.csv`);
    res.send(csv);
  } catch (err) {
    console.error('CSV export error:', err);
    res.status(500).send('Error generating CSV.');
  }
});

module.exports = router;
