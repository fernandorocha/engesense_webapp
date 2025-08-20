/**
 * Dashboard Data module - handles API calls and data management
 */
class DashboardData {
  constructor() {
    this.baseUrl = '/api';
  }

  // Load available buckets from the API
  async loadBuckets() {
    try {
      const res = await fetch(`${this.baseUrl}/buckets`);
      
      if (!res.ok) {
        throw new Error(`Failed to load buckets: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      return data.buckets || [];
    } catch (err) {
      console.error('Failed to load buckets:', err);
      throw err;
    }
  }

  // Load measurements for selected buckets
  async loadMeasurements(selectedBuckets) {
    if (!selectedBuckets || selectedBuckets.length === 0) {
      return [];
    }
    
    try {
      const bucketsParam = selectedBuckets.join(',');
      const res = await fetch(`${this.baseUrl}/measurements?buckets=${encodeURIComponent(bucketsParam)}`);
      
      if (!res.ok) {
        throw new Error(`Failed to load measurements: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      return data.measurements || [];
    } catch (err) {
      console.error('Failed to load measurements:', err);
      throw err;
    }
  }

  // Load sensor data for charting
  async loadSensorData(options = {}) {
    const {
      buckets = [],
      measurements = [],
      range = '-1h',
      start,
      stop,
      limit = 5000
    } = options;

    if (!measurements || measurements.length === 0) {
      throw new Error('No measurements selected');
    }

    // Extract buckets from measurements if needed
    const bucketsSet = new Set();
    measurements.forEach(val => {
      if (val.includes(':')) {
        const [bucket] = val.split(':', 2);
        bucketsSet.add(bucket);
      }
    });
    const bucketsArr = buckets.length > 0 ? buckets : Array.from(bucketsSet);

    // Build URL parameters
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    
    if (bucketsArr.length > 0) {
      params.append('buckets', bucketsArr.join(','));
    }
    
    params.append('measurements', measurements.join(','));

    if (start && stop) {
      params.append('start', start.toISOString());
      params.append('stop', stop.toISOString());
    } else {
      params.append('range', range);
    }

    try {
      const res = await fetch(`${this.baseUrl}/sensors?${params.toString()}`);
      
      if (!res.ok) {
        throw new Error(`API returned ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      
      // Check if there's an error in the response
      if (data.error) {
        throw new Error(data.error);
      }
      
      return {
        readings: data.readings || [],
        metadata: {
          buckets: bucketsArr,
          measurements,
          range: start && stop ? null : range,
          start: start && stop ? start : null,
          stop: start && stop ? stop : null
        }
      };
    } catch (err) {
      console.error('Failed to load sensor data:', err);
      throw err;
    }
  }

  // Process readings for chart display
  processReadingsForChart(readings) {
    if (!readings || readings.length === 0) {
      return {};
    }

    // Group readings by bucket:measurement for charting
    const datasetsByMeasurement = {};
    readings.forEach(reading => {
      // Use bucket:measurement as key for uniqueness
      const key = (reading.bucket && reading.measurement) 
        ? `${reading.bucket}:${reading.measurement}` 
        : (reading.measurement || 'Unknown');
      
      if (!datasetsByMeasurement[key]) {
        datasetsByMeasurement[key] = {
          timestamps: [],
          values: []
        };
      }
      datasetsByMeasurement[key].timestamps.push(reading.timestamp);
      datasetsByMeasurement[key].values.push(reading.value);
    });

    return datasetsByMeasurement;
  }

  // Calculate statistics from readings
  calculateStatistics(readings) {
    if (!readings || readings.length === 0) {
      return {};
    }

    const stats = {};
    const dataByMeasurement = this.processReadingsForChart(readings);

    Object.keys(dataByMeasurement).forEach(measurement => {
      const values = dataByMeasurement[measurement].values;
      const numericValues = values.filter(v => typeof v === 'number' && !isNaN(v));
      
      if (numericValues.length === 0) {
        stats[measurement] = {
          count: 0,
          average: 0,
          min: 0,
          max: 0,
          latest: 0
        };
        return;
      }

      const sum = numericValues.reduce((acc, val) => acc + val, 0);
      const average = sum / numericValues.length;
      const min = Math.min(...numericValues);
      const max = Math.max(...numericValues);
      const latest = numericValues[numericValues.length - 1] || 0;

      stats[measurement] = {
        count: numericValues.length,
        average: average,
        min: min,
        max: max,
        latest: latest
      };
    });

    return stats;
  }
}

// Export for use in other modules
window.DashboardData = DashboardData;