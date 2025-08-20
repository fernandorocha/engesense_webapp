/**
 * Main Dashboard Controller - orchestrates all dashboard modules
 */
class Dashboard {
  constructor() {
    this.ui = new DashboardUI();
    this.data = new DashboardData();
    this.charts = new DashboardCharts();
    this.stats = new DashboardStats();
    
    this.currentRange = '-1h';
    this.flatpickrInstance = null;
    
    // Initialize components
    this.init();
  }

  async init() {
    try {
      // Initialize UI components
      this.initializeDropdowns();
      this.initializeTimeControls();
      this.initializeCharts();
      this.initializeStats();
      this.initializeExportControls();
      
      // Load initial data
      await this.loadInitialData();
      
      console.log('Dashboard initialized successfully');
    } catch (error) {
      console.error('Failed to initialize dashboard:', error);
    }
  }

  initializeDropdowns() {
    const bucketsDropdown = document.getElementById('bucketsDropdown');
    const measurementsDropdown = document.getElementById('measurementsDropdown');

    if (bucketsDropdown) {
      this.ui.initializeDropdown(bucketsDropdown, () => this.handleBucketsChange());
    }

    if (measurementsDropdown) {
      this.ui.initializeDropdown(measurementsDropdown, () => this.handleMeasurementsChange());
    }
  }

  initializeTimeControls() {
    const controls = this.ui.initializeTimeControls();
    
    // Override the updateTimeMode method to handle our specific logic
    this.ui.updateTimeMode = (mode) => {
      if (mode === 'relative') {
        this.currentMode = 'relative';
        this.updateRangeFromPicker();
      } else if (mode === 'absolute') {
        this.currentMode = 'absolute';
        this.initializeFlatpickr();
      }
    };

    // Set up range picker change handler
    const rangeInput = document.getElementById('rangePicker');
    if (rangeInput) {
      rangeInput.addEventListener('change', () => this.updateRangeFromPicker());
    }

    // Set up refresh button
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
      refreshBtn.onclick = () => this.refreshData();
    }

    // Set up quick range buttons
    this.initializeQuickRangeButtons();
  }

  initializeQuickRangeButtons() {
    const quickButtons = [
      { id: 'btn-1h', range: '-1h' },
      { id: 'btn-6h', range: '-6h' },
      { id: 'btn-1d', range: '-1d' },
      { id: 'btn-7d', range: '-7d' },
      { id: 'btn-30d', range: '-30d' }
    ];

    quickButtons.forEach(({ id, range }) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.onclick = () => this.setQuickRange(range);
      }
    });
  }

  initializeFlatpickr() {
    if (typeof flatpickr === 'undefined') {
      console.warn('Flatpickr not available for date range selection');
      return;
    }

    const rangePicker = document.getElementById('rangePicker');
    if (!rangePicker) return;

    if (this.flatpickrInstance) {
      this.flatpickrInstance.destroy();
    }

    this.flatpickrInstance = flatpickr(rangePicker, {
      mode: 'range',
      enableTime: true,
      dateFormat: 'Y-m-d H:i',
      defaultDate: [
        new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        new Date() // now
      ],
      onChange: (selectedDates) => {
        if (selectedDates.length === 2) {
          this.loadAndRender({ start: selectedDates[0], stop: selectedDates[1] });
        }
      }
    });

    rangePicker.style.display = 'block';
  }

  initializeCharts() {
    this.charts.initChart('sensorChart');
  }

  initializeStats() {
    this.stats.initStats('statsContainer');
  }

  initializeExportControls() {
    // Export controls are handled by forms, no additional initialization needed
    console.log('Export controls initialized');
  }

  async loadInitialData() {
    try {
      await this.loadBuckets();
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  }

  async loadBuckets() {
    try {
      const buckets = await this.data.loadBuckets();
      this.ui.allBuckets = buckets;
      
      const bucketsDropdown = document.getElementById('bucketsDropdown');
      if (bucketsDropdown) {
        this.ui.populateDropdown(bucketsDropdown, buckets, this.ui.selectedBuckets);
        this.ui.updateDropdownText(bucketsDropdown, buckets, this.ui.selectedBuckets);
        
        // Auto-select first bucket if available and none selected
        if (buckets.length > 0 && this.ui.selectedBuckets.length === 0) {
          this.ui.selectedBuckets = [buckets[0]];
          this.ui.populateDropdown(bucketsDropdown, buckets, this.ui.selectedBuckets);
          this.ui.updateDropdownText(bucketsDropdown, buckets, this.ui.selectedBuckets);
          this.ui.updateCsvFields();
          await this.loadMeasurements();
        }
      }
    } catch (error) {
      console.error('Failed to load buckets:', error);
      this.ui.allBuckets = [];
      this.ui.selectedBuckets = [];
      this.clearMeasurements();
    }
  }

  async loadMeasurements() {
    if (this.ui.selectedBuckets.length === 0) {
      this.clearMeasurements();
      return;
    }
    
    try {
      const measurements = await this.data.loadMeasurements(this.ui.selectedBuckets);
      this.ui.allMeasurements = measurements;
      
      // Filter selectedMeasurements to only include measurements that still exist
      this.ui.selectedMeasurements = this.ui.selectedMeasurements.filter(m => 
        this.ui.allMeasurements.includes(m)
      );

      const measurementsDropdown = document.getElementById('measurementsDropdown');
      if (measurementsDropdown) {
        if (measurements.length === 0) {
          this.ui.selectedMeasurements = [];
          this.ui.populateDropdown(measurementsDropdown, [], []);
          this.ui.updateDropdownText(measurementsDropdown, [], [], this.ui.measurementDisplayFormatter);
          return;
        }

        // Auto-select first measurement only if no valid selections remain
        if (this.ui.selectedMeasurements.length === 0 && measurements.length > 0) {
          this.ui.selectedMeasurements = [measurements[0]];
        }

        this.ui.populateDropdown(measurementsDropdown, measurements, this.ui.selectedMeasurements, this.ui.measurementDisplayFormatter);
        this.ui.updateDropdownText(measurementsDropdown, measurements, this.ui.selectedMeasurements, this.ui.measurementDisplayFormatter);
        this.ui.updateCsvFields();
        
        // Load data if measurements are selected
        if (this.ui.selectedMeasurements.length > 0) {
          await this.loadAndRender();
        }
      }
    } catch (error) {
      console.error('Failed to load measurements:', error);
      this.clearMeasurements();
    }
  }

  clearMeasurements() {
    this.ui.allMeasurements = [];
    this.ui.selectedMeasurements = [];
    
    const measurementsDropdown = document.getElementById('measurementsDropdown');
    if (measurementsDropdown) {
      this.ui.populateDropdown(measurementsDropdown, [], []);
      this.ui.updateDropdownText(measurementsDropdown, [], [], this.ui.measurementDisplayFormatter);
    }
  }

  async handleBucketsChange() {
    const bucketsDropdown = document.getElementById('bucketsDropdown');
    if (bucketsDropdown) {
      this.ui.selectedBuckets = this.ui.getSelectedItems(bucketsDropdown);
      this.ui.updateDropdownText(bucketsDropdown, this.ui.allBuckets, this.ui.selectedBuckets);
      this.ui.updateCsvFields();
      await this.loadMeasurements();
    }
  }

  async handleMeasurementsChange() {
    const measurementsDropdown = document.getElementById('measurementsDropdown');
    if (measurementsDropdown) {
      this.ui.selectedMeasurements = this.ui.getSelectedItems(measurementsDropdown);
      this.ui.updateDropdownText(measurementsDropdown, this.ui.allMeasurements, this.ui.selectedMeasurements, this.ui.measurementDisplayFormatter);
      this.ui.updateCsvFields();
      
      if (this.ui.selectedMeasurements.length > 0) {
        await this.loadAndRender();
      } else {
        this.charts.showNoDataMessage();
        this.stats.showNoStatsMessage();
      }
    }
  }

  async loadAndRender(timeOptions = {}) {
    if (this.ui.selectedMeasurements.length === 0) {
      this.charts.showNoDataMessage();
      this.stats.showNoStatsMessage();
      return;
    }

    try {
      const { start, stop } = timeOptions;
      
      const options = {
        buckets: this.ui.selectedBuckets,
        measurements: this.ui.selectedMeasurements,
        range: start && stop ? undefined : this.currentRange,
        start: start,
        stop: stop,
        limit: 5000
      };

      const result = await this.data.loadSensorData(options);
      
      if (!result.readings || result.readings.length === 0) {
        this.ui.showNoDataNotification();
        this.charts.showNoDataMessage();
        this.stats.showNoStatsMessage();
        return;
      }

      this.ui.hideNoDataNotification();

      // Update export fields
      if (start && stop) {
        this.ui.updateExportFields('', start.toISOString(), stop.toISOString());
      } else {
        this.ui.updateExportFields(this.currentRange, '', '');
      }

      // Process data for visualization
      const processedData = this.data.processReadingsForChart(result.readings, this.ui.selectedMeasurements);
      const statistics = this.data.calculateStatistics(result.readings, this.ui.selectedMeasurements);

      // Render chart and stats
      this.charts.renderChart(processedData, this.ui.measurementDisplayFormatter);
      this.stats.renderFullStats(statistics, this.ui.measurementDisplayFormatter);

    } catch (error) {
      console.error('Failed to load and render data:', error);
      this.ui.showNoDataNotification();
      this.charts.showNoDataMessage();
      this.stats.showNoStatsMessage();
    }
  }

  updateRangeFromPicker() {
    const rangeInput = document.getElementById('rangePicker');
    if (rangeInput) {
      this.currentRange = rangeInput.value;
      if (this.ui.selectedMeasurements.length > 0) {
        this.loadAndRender();
      }
    }
  }

  setQuickRange(range) {
    this.currentRange = range;
    const rangeInput = document.getElementById('rangePicker');
    if (rangeInput) {
      rangeInput.value = range;
    }
    
    if (this.ui.selectedMeasurements.length > 0) {
      this.loadAndRender();
    }
  }

  refreshData() {
    if (this.ui.selectedMeasurements.length > 0) {
      this.loadAndRender();
    }
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.dashboard = new Dashboard();
});

// Export for global access
window.Dashboard = Dashboard;