const express = require('express');
const { querySensorReadings } = require('../utils/influx');
const { ensureAuth }        = require('../middleware/auth');
const { Parser } = require('json2csv');

const router = express.Router();

router.get('/export', ensureAuth, async (req, res) => {
  const { range, start, stop, limit = '5000' } = req.query;

  try {
    const readings = await querySensorReadings({
      range,
      start,
      stop,
      limit: parseInt(limit, 10)
    });
    
    //res.json({ readings });
    
    const parser = new Parser();
    const csv = parser.parse(readings);

    res.header('Content-Type', 'text/csv');
    //res.attachment(`sensor_home_pt_${start}_${stop}.csv`);
    res.attachment(`sensor_home_pt.csv`);
    res.send(csv);
  } catch (err) {
    console.error('CSV export error:', err);
    res.status(500).send('Error generating CSV.');
  }
});

module.exports = router;
