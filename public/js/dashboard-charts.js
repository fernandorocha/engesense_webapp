/**
 * Dashboard Charts module - handles chart rendering and visualization with ApexCharts
 */
class DashboardCharts {
  constructor() {
    this.chart = null;
    this.chartContainer = null;
    this.colors = [
      '#1e88e5', '#e53935', '#43a047', '#fb8c00',
      '#8e24aa', '#00acc1', '#fdd835', '#f4511e'
    ];
  }

  // Initialize chart
  initChart(containerId) {
    this.chartContainer = document.getElementById(containerId);
    
    if (!this.chartContainer) {
      console.error('Chart container not found:', containerId);
      return false;
    }

    // Initialize chart based on available library
    if (typeof ApexCharts !== 'undefined') {
      this.initializeApexChart();
      return true;
    } else if (typeof createFallbackChart !== 'undefined') {
      // Use fallback chart implementation
      this.chart = createFallbackChart(this.chartContainer);
      return true;
    } else {
      console.error('No chart library available');
      return false;
    }
  }

  // Convert hex color to rgba
  hexToRgba(hex, alpha = 0.2) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  // Create chart datasets from processed data for ApexCharts
  createApexChartSeries(datasetsByMeasurement, displayFormatter = null) {
    const series = Object.keys(datasetsByMeasurement).map((measurement, index) => {
      const color = this.colors[index % this.colors.length];
      const displayName = displayFormatter ? displayFormatter(measurement) : measurement;
      
      return {
        name: displayName,
        color: color,
        data: datasetsByMeasurement[measurement].timestamps.map((timestamp, i) => ({
          x: new Date(timestamp).getTime(),
          y: datasetsByMeasurement[measurement].values[i]
        }))
      };
    });

    return series;
  }

  // Create chart datasets from processed data (legacy format for fallback)
  createChartDatasets(datasetsByMeasurement, displayFormatter = null) {
    const datasets = Object.keys(datasetsByMeasurement).map((measurement, index) => {
      const color = this.colors[index % this.colors.length];
      const backgroundColor = this.hexToRgba(color, 0.2);
      
      const displayName = displayFormatter ? displayFormatter(measurement) : measurement;
      
      return {
        name: displayName,
        type: 'line',
        data: datasetsByMeasurement[measurement].timestamps.map((timestamp, i) => [
          new Date(timestamp),
          datasetsByMeasurement[measurement].values[i]
        ]),
        itemStyle: { color: color },
        lineStyle: { color: color },
        areaStyle: { color: backgroundColor },
        smooth: true,
        symbol: 'circle',
        symbolSize: 4
      };
    });

    return datasets;
  }

  // Render chart with ApexCharts
  renderApexChart(series) {
    if (!this.chart || typeof ApexCharts === 'undefined') {
      console.error('ApexCharts not available');
      return false;
    }

    const options = {
      series: series,
      chart: {
        type: 'line',
        height: 500,
        zoom: {
          type: 'x',
          enabled: true,
          autoScaleYaxis: true
        },
        toolbar: {
          autoSelected: 'zoom'
        }
      },
      dataLabels: {
        enabled: false
      },
      markers: {
        size: 0,
      },
      title: {
        text: 'Sensor Data Over Time',
        align: 'center',
        style: {
          fontSize: '18px',
          fontWeight: 'bold'
        }
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          inverseColors: false,
          opacityFrom: 0.5,
          opacityTo: 0,
          stops: [0, 90, 100]
        },
      },
      yaxis: {
        labels: {
          formatter: function (val) {
            return (val).toFixed(2);
          },
        },
        title: {
          text: 'Value'
        },
      },
      xaxis: {
        type: 'datetime',
        title: {
          text: 'Time'
        }
      },
      tooltip: {
        shared: false,
        y: {
          formatter: function (val) {
            return (val).toFixed(2)
          }
        }
      },
      legend: {
        position: 'top',
        horizontalAlign: 'center'
      },
      stroke: {
        width: 2,
        curve: 'smooth'
      }
    };

    // Update chart with new data
    this.chart.updateOptions(options, true);
    return true;
  }

  // Render chart with fallback implementation
  renderFallbackChart(datasets) {
    if (!this.chart || typeof createFallbackChart === 'undefined') {
      console.error('Fallback chart not available');
      return false;
    }

    // Convert datasets to fallback format
    const fallbackData = datasets.map(dataset => ({
      label: dataset.name,
      data: dataset.data,
      borderColor: dataset.itemStyle.color,
      backgroundColor: dataset.areaStyle.color
    }));

    this.chart.render(fallbackData);
    return true;
  }

  // Main render method
  renderChart(datasetsByMeasurement, displayFormatter = null) {
    if (!datasetsByMeasurement || Object.keys(datasetsByMeasurement).length === 0) {
      this.showNoDataMessage();
      return false;
    }

    this.hideNoDataMessage();
    
    // Ensure chart is properly initialized
    if (typeof ApexCharts !== 'undefined') {
      if (!this.chart) {
        this.initializeApexChart();
      }
      if (this.chart) {
        const series = this.createApexChartSeries(datasetsByMeasurement, displayFormatter);
        return this.renderApexChart(series);
      }
    } else if (typeof createFallbackChart !== 'undefined') {
      const datasets = this.createChartDatasets(datasetsByMeasurement, displayFormatter);
      return this.renderFallbackChart(datasets);
    } else {
      console.error('No chart rendering library available');
      return false;
    }
  }

  // Show no data message
  showNoDataMessage() {
    // Properly dispose of existing chart first
    this.dispose();
    
    if (this.chartContainer) {
      this.chartContainer.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 400px; flex-direction: column;">
          <div style="font-size: 18px; color: #666; margin-bottom: 10px;">No Data Available</div>
          <div style="font-size: 14px; color: #999;">
            Select buckets and measurements, then set a time range to view sensor data.
          </div>
        </div>
      `;
    }
  }

  // Hide no data message and prepare for chart
  hideNoDataMessage() {
    if (this.chartContainer && this.chartContainer.innerHTML.includes('No Data Available')) {
      this.chartContainer.innerHTML = '';
      // Reinitialize chart after clearing
      this.initializeApexChart();
    }
  }

  // Initialize ApexCharts instance
  initializeApexChart() {
    if (typeof ApexCharts !== 'undefined' && this.chartContainer) {
      // Dispose existing chart if any
      if (this.chart) {
        this.dispose();
      }
      
      // Create a basic chart with empty data that will be updated later
      const options = {
        series: [],
        chart: {
          type: 'line',
          height: 500
        },
        xaxis: {
          type: 'datetime'
        }
      };
      
      this.chart = new ApexCharts(this.chartContainer, options);
      this.chart.render();
    }
  }

  // Resize chart (useful for responsive design)
  resizeChart() {
    if (this.chart && typeof this.chart.updateOptions === 'function') {
      this.chart.updateOptions({
        chart: {
          height: this.chartContainer ? this.chartContainer.offsetHeight : 500
        }
      });
    }
  }

  // Dispose chart
  dispose() {
    if (this.chart) {
      try {
        if (typeof this.chart.destroy === 'function') {
          this.chart.destroy();
        }
      } catch (error) {
        console.warn('Error disposing chart:', error);
      }
      this.chart = null;
    }
  }
}

// Export for use in other modules
window.DashboardCharts = DashboardCharts;