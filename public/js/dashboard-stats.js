/**
 * Dashboard Statistics module - handles statistics table rendering and calculations
 */
class DashboardStats {
  constructor() {
    this.statsContainer = null;
  }

  // Initialize stats container
  initStats(containerId) {
    this.statsContainer = document.getElementById(containerId);
    
    if (!this.statsContainer) {
      console.error('Stats container not found:', containerId);
      return false;
    }
    
    return true;
  }

  // Format number for display
  formatNumber(value, decimals = 2) {
    if (typeof value !== 'number' || isNaN(value)) {
      return 'N/A';
    }
    return value.toFixed(decimals);
  }

  // Format measurement name for display
  formatMeasurementName(measurement, displayFormatter = null) {
    if (displayFormatter) {
      return displayFormatter(measurement);
    }
    return measurement;
  }

  // Render statistics table
  renderStats(statistics, displayFormatter = null) {
    if (!this.statsContainer) {
      console.error('Stats container not initialized');
      return false;
    }

    if (!statistics || Object.keys(statistics).length === 0) {
      this.showNoStatsMessage();
      return false;
    }

    // Create table HTML
    let tableHTML = `
      <div class="stats-header">
        <h3>Statistics Summary</h3>
      </div>
      <div class="stats-table-container">
        <table class="stats-table">
          <thead>
            <tr>
              <th>Measurement</th>
              <th>Count</th>
              <th>Average</th>
              <th>Minimum</th>
              <th>Maximum</th>
              <th>Latest</th>
            </tr>
          </thead>
          <tbody>
    `;

    // Add rows for each measurement
    Object.keys(statistics).forEach(measurement => {
      const stats = statistics[measurement];
      const displayName = this.formatMeasurementName(measurement, displayFormatter);
      
      tableHTML += `
        <tr>
          <td class="measurement-name">${displayName}</td>
          <td class="stats-count">${stats.count}</td>
          <td class="stats-average">${this.formatNumber(stats.average)}</td>
          <td class="stats-min">${this.formatNumber(stats.min)}</td>
          <td class="stats-max">${this.formatNumber(stats.max)}</td>
          <td class="stats-latest">${this.formatNumber(stats.latest)}</td>
        </tr>
      `;
    });

    tableHTML += `
          </tbody>
        </table>
      </div>
    `;

    this.statsContainer.innerHTML = tableHTML;
    return true;
  }

  // Show no statistics message
  showNoStatsMessage() {
    if (this.statsContainer) {
      this.statsContainer.innerHTML = `
        <div class="no-stats-message">
          <div style="text-align: center; padding: 40px; color: #666;">
            <div style="font-size: 18px; margin-bottom: 10px;">No Statistics Available</div>
            <div style="font-size: 14px;">
              Load sensor data to view statistics summary.
            </div>
          </div>
        </div>
      `;
    }
  }

  // Create summary cards for key metrics
  renderSummaryCards(statistics) {
    if (!statistics || Object.keys(statistics).length === 0) {
      return '';
    }

    const measurements = Object.keys(statistics);
    const totalReadings = measurements.reduce((sum, m) => sum + statistics[m].count, 0);
    const activeMeasurements = measurements.length;
    
    // Calculate average of all latest values
    const latestValues = measurements.map(m => statistics[m].latest).filter(v => !isNaN(v));
    const avgLatest = latestValues.length > 0 
      ? latestValues.reduce((sum, v) => sum + v, 0) / latestValues.length 
      : 0;

    return `
      <div class="summary-cards">
        <div class="summary-card">
          <div class="card-value">${activeMeasurements}</div>
          <div class="card-label">Active Measurements</div>
        </div>
        <div class="summary-card">
          <div class="card-value">${totalReadings}</div>
          <div class="card-label">Total Readings</div>
        </div>
        <div class="summary-card">
          <div class="card-value">${this.formatNumber(avgLatest)}</div>
          <div class="card-label">Avg Latest Value</div>
        </div>
      </div>
    `;
  }

  // Render both summary cards and detailed stats
  renderFullStats(statistics, displayFormatter = null) {
    if (!this.statsContainer) {
      console.error('Stats container not initialized');
      return false;
    }

    if (!statistics || Object.keys(statistics).length === 0) {
      this.showNoStatsMessage();
      return false;
    }

    const summaryHTML = this.renderSummaryCards(statistics);
    
    let detailsHTML = `
      <div class="stats-details">
        <h3>Detailed Statistics</h3>
        <div class="stats-table-container">
          <table class="stats-table">
            <thead>
              <tr>
                <th>Measurement</th>
                <th>Count</th>
                <th>Average</th>
                <th>Minimum</th>
                <th>Maximum</th>
                <th>Latest</th>
              </tr>
            </thead>
            <tbody>
    `;

    Object.keys(statistics).forEach(measurement => {
      const stats = statistics[measurement];
      const displayName = this.formatMeasurementName(measurement, displayFormatter);
      
      detailsHTML += `
        <tr>
          <td class="measurement-name">${displayName}</td>
          <td class="stats-count">${stats.count}</td>
          <td class="stats-average">${this.formatNumber(stats.average)}</td>
          <td class="stats-min">${this.formatNumber(stats.min)}</td>
          <td class="stats-max">${this.formatNumber(stats.max)}</td>
          <td class="stats-latest">${this.formatNumber(stats.latest)}</td>
        </tr>
      `;
    });

    detailsHTML += `
            </tbody>
          </table>
        </div>
      </div>
    `;

    this.statsContainer.innerHTML = summaryHTML + detailsHTML;
    return true;
  }

  // Clear stats display
  clearStats() {
    if (this.statsContainer) {
      this.statsContainer.innerHTML = '';
    }
  }
}

// Export for use in other modules
window.DashboardStats = DashboardStats;