// routes/sensors.js
const express               = require('express');
const { querySensorReadings } = require('../utils/influx');
const { ensureAuth }        = require('../middleware/auth');

const router = express.Router();

router.get('/api/sensors', ensureAuth, async (req, res) => {
  const { range, start, stop, limit = '5000' } = req.query;

  try {
    const readings = await querySensorReadings({
      range,
      start,
      stop,
      limit: parseInt(limit, 10)
    });
    res.json({ readings });
  } catch (err) {
    console.error('[sensors] error', err);
    res.status(500).json({ error: 'Could not fetch sensor data' });
  }
});

module.exports = router;
