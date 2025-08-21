/**
 * Dashboard Charts module - handles chart rendering and visualization
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
    if (typeof echarts !== 'undefined') {
      this.initializeEChart();
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

  // Create chart datasets from processed data
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

  // Render chart with ECharts
  renderEChart(datasets) {
    if (!this.chart || typeof echarts === 'undefined') {
      console.error('ECharts not available');
      return false;
    }

    const option = {
      title: {
        text: 'Sensor Data Over Time',
        left: 'center',
        textStyle: {
          fontSize: 18,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985'
          }
        },
        formatter: function(params) {
          let result = `<strong>${new Date(params[0].value[0]).toLocaleString()}</strong><br/>`;
          params.forEach(param => {
            result += `${param.marker} ${param.seriesName}: ${param.value[1]?.toFixed(2) || 'N/A'}<br/>`;
          });
          return result;
        }
      },
      legend: {
        data: datasets.map(d => d.name),
        top: '10%',
        left: 'center'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        top: '20%',
        containLabel: true
      },
      toolbox: {
        feature: {
          saveAsImage: {
            title: 'Save as Image'
          },
          dataZoom: {
            title: {
              zoom: 'Zoom',
              back: 'Reset Zoom'
            }
          }
        }
      },
      xAxis: {
        type: 'time',
        boundaryGap: false,
        axisLabel: {
          formatter: function(value) {
            return new Date(value).toLocaleTimeString();
          }
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: '{value}'
        }
      },
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100
        },
        {
          start: 0,
          end: 100,
          handleIcon: 'M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z',
          handleSize: '80%',
          handleStyle: {
            color: '#fff',
            shadowBlur: 3,
            shadowColor: 'rgba(0, 0, 0, 0.6)',
            shadowOffsetX: 2,
            shadowOffsetY: 2
          }
        }
      ],
      series: datasets
    };

    // Use setOption without force replacement to avoid disposal issues
    this.chart.setOption(option, false);
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
    
    const datasets = this.createChartDatasets(datasetsByMeasurement, displayFormatter);
    
    // Ensure chart is properly initialized
    if (typeof echarts !== 'undefined') {
      if (!this.chart) {
        this.initializeEChart();
      }
      if (this.chart) {
        return this.renderEChart(datasets);
      }
    } else if (typeof createFallbackChart !== 'undefined') {
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
      this.initializeEChart();
    }
  }

  // Initialize ECharts instance
  initializeEChart() {
    if (typeof echarts !== 'undefined' && this.chartContainer) {
      // Dispose existing chart if any
      if (this.chart) {
        this.dispose();
      }
      this.chart = echarts.init(this.chartContainer);
    }
  }

  // Resize chart (useful for responsive design)
  resizeChart() {
    if (this.chart && typeof this.chart.resize === 'function') {
      this.chart.resize();
    }
  }

  // Dispose chart
  dispose() {
    if (this.chart) {
      try {
        if (typeof this.chart.dispose === 'function') {
          this.chart.dispose();
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