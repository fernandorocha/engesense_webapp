/**
 * Dashboard Charts module - handles chart rendering and visualization with ApexCharts
 */
class DashboardCharts {
  constructor() {
    this.chart = null;
    this.chartContainer = null;
    // Darker, more visible colors for better contrast
    this.colors = [
      '#0d47a1', '#b71c1c', '#1b5e20', '#e65100',
      '#4a148c', '#006064', '#f57f17', '#bf360c'
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
        shared: true,
        intersect: false,
        x: {
          formatter: function(val) {
            // Show complete date and time
            return new Date(val).toLocaleString('en-US', {
              year: 'numeric',
              month: '2-digit', 
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            });
          }
        },
        y: {
          formatter: function (val, opts) {
            if (val !== null && val !== undefined) {
              return `${opts.w.globals.seriesNames[opts.seriesIndex]}: ${val.toFixed(2)}`;
            }
            return '';
          }
        },
        custom: function({series, seriesIndex, dataPointIndex, w}) {
          // Get the timestamp for this data point
          const timestamp = w.globals.seriesX[seriesIndex][dataPointIndex];
          const formattedDate = new Date(timestamp).toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit', 
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          });
          
          // Build tooltip showing all measurements at this timestamp
          let tooltipContent = `<div class="apexcharts-tooltip-title">${formattedDate}</div>`;
          
          // Show all series values for this timestamp
          series.forEach((seriesData, index) => {
            const value = seriesData[dataPointIndex];
            if (value !== null && value !== undefined) {
              const color = w.globals.colors[index];
              tooltipContent += `
                <div class="apexcharts-tooltip-series-group" style="order: 1; display: flex;">
                  <span class="apexcharts-tooltip-marker" style="background-color: ${color};"></span>
                  <div class="apexcharts-tooltip-text" style="font-family: Helvetica, Arial, sans-serif; font-size: 12px;">
                    <div class="apexcharts-tooltip-y-group">
                      <span class="apexcharts-tooltip-text-y-label">${w.globals.seriesNames[index]}: </span>
                      <span class="apexcharts-tooltip-text-y-value">${value.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              `;
            }
          });
          
          return tooltipContent;
        }
      },
      legend: {
        position: 'top',
        horizontalAlign: 'center'
      },
      stroke: {
        width: 4,
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