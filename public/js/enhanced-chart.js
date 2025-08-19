// Enhanced chart implementation with advanced functionality
// Extends the fallback chart with additional features and chart types

class EnhancedChart {
  constructor(ctx, config) {
    this.ctx = ctx;
    this.canvas = ctx.canvas;
    this.config = config;
    this.data = config.data || { labels: [], datasets: [] };
    this.options = config.options || {};
    
    // Chart state
    this.chartType = config.type || 'line';
    this.theme = 'light';
    this.showDataPoints = true;
    this.fillArea = false;
    this.showGrid = true;
    this.showLegend = true;
    this.lineStyle = 'solid';
    this.colorPalette = 'default';
    this.yAxisType = 'linear'; // linear, logarithmic
    this.smoothing = false;
    this.showMovingAverage = false;
    this.movingAveragePeriod = 5;
    
    // Interaction state
    this.isZoomed = false;
    this.zoomLevel = 1;
    this.panOffset = { x: 0, y: 0 };
    this.hoveredPoint = null;
    this.selectedDatasets = [];
    this.crosshair = { x: null, y: null };
    
    // Animation state
    this.animationProgress = 1;
    this.animating = false;
    
    // Set canvas size
    this.canvas.width = this.canvas.offsetWidth || 800;
    this.canvas.height = this.canvas.offsetHeight || 400;
    
    // Setup event listeners
    this.setupEventListeners();
    
    this.draw();
  }
  
  setupEventListeners() {
    // Mouse move for tooltips and crosshair
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      this.crosshair = { x, y };
      this.findHoveredPoint(x, y);
      this.draw();
    });
    
    // Mouse leave to clear crosshair
    this.canvas.addEventListener('mouseleave', () => {
      this.crosshair = { x: null, y: null };
      this.hoveredPoint = null;
      this.draw();
    });
    
    // Click for dataset selection
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      this.handleClick(x, y);
    });
    
    // Wheel for zoom
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      this.zoom(delta, e.offsetX, e.offsetY);
    });
  }
  
  findHoveredPoint(mouseX, mouseY) {
    if (!this.data.datasets || this.data.datasets.length === 0) return;
    
    const margin = this.getMargin();
    const chartWidth = this.canvas.width - margin.left - margin.right;
    const chartHeight = this.canvas.height - margin.top - margin.bottom;
    
    // Check if mouse is within chart area
    if (mouseX < margin.left || mouseX > margin.left + chartWidth ||
        mouseY < margin.top || mouseY > margin.top + chartHeight) {
      this.hoveredPoint = null;
      return;
    }
    
    const { minValue, maxValue } = this.getDataRange();
    const getX = (index) => margin.left + (index / (this.data.labels.length - 1)) * chartWidth;
    const getY = (value) => margin.top + chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight;
    
    let closestPoint = null;
    let minDistance = Infinity;
    
    this.data.datasets.forEach((dataset, datasetIndex) => {
      if (this.selectedDatasets.length > 0 && !this.selectedDatasets.includes(datasetIndex)) {
        return; // Skip unselected datasets
      }
      
      dataset.data.forEach((value, pointIndex) => {
        const pointX = getX(pointIndex);
        const pointY = getY(value);
        const distance = Math.sqrt(Math.pow(mouseX - pointX, 2) + Math.pow(mouseY - pointY, 2));
        
        if (distance < 15 && distance < minDistance) { // 15px hover tolerance
          minDistance = distance;
          closestPoint = {
            datasetIndex,
            pointIndex,
            value,
            x: pointX,
            y: pointY,
            label: this.data.labels[pointIndex],
            datasetLabel: dataset.label
          };
        }
      });
    });
    
    this.hoveredPoint = closestPoint;
  }
  
  handleClick(x, y) {
    // Check if clicking on legend
    const legendClick = this.checkLegendClick(x, y);
    if (legendClick !== null) {
      this.toggleDataset(legendClick);
      return;
    }
    
    // Check if clicking on data point
    if (this.hoveredPoint) {
      const datasetIndex = this.hoveredPoint.datasetIndex;
      if (this.selectedDatasets.includes(datasetIndex)) {
        this.selectedDatasets = this.selectedDatasets.filter(i => i !== datasetIndex);
      } else {
        this.selectedDatasets.push(datasetIndex);
      }
      this.draw();
    }
  }
  
  checkLegendClick(x, y) {
    const margin = this.getMargin();
    const legendX = margin.left + (this.canvas.width - margin.left - margin.right) + 20;
    let legendY = margin.top;
    
    for (let i = 0; i < this.data.datasets.length; i++) {
      if (x >= legendX && x <= legendX + 200 && 
          y >= legendY - 12 && y <= legendY + 12) {
        return i;
      }
      legendY += 25;
    }
    return null;
  }
  
  toggleDataset(index) {
    if (this.selectedDatasets.includes(index)) {
      this.selectedDatasets = this.selectedDatasets.filter(i => i !== index);
    } else {
      this.selectedDatasets.push(index);
    }
    this.draw();
  }
  
  zoom(factor, centerX, centerY) {
    this.zoomLevel *= factor;
    this.zoomLevel = Math.max(0.5, Math.min(10, this.zoomLevel)); // Limit zoom range
    this.isZoomed = this.zoomLevel !== 1;
    this.draw();
  }
  
  resetZoom() {
    this.zoomLevel = 1;
    this.panOffset = { x: 0, y: 0 };
    this.isZoomed = false;
    this.draw();
  }
  
  setChartType(type) {
    this.chartType = type;
    this.animate();
  }
  
  setColorPalette(palette) {
    this.colorPalette = palette;
    this.draw();
  }
  
  setFillArea(fill) {
    this.fillArea = fill;
    this.draw();
  }
  
  setShowDataPoints(show) {
    this.showDataPoints = show;
    this.draw();
  }
  
  setLineStyle(style) {
    this.lineStyle = style;
    this.draw();
  }
  
  setYAxisType(type) {
    this.yAxisType = type;
    this.draw();
  }
  
  setSmoothing(smooth) {
    this.smoothing = smooth;
    this.draw();
  }
  
  setMovingAverage(show, period = 5) {
    this.showMovingAverage = show;
    this.movingAveragePeriod = period;
    this.draw();
  }
  
  getColorPalettes() {
    return {
      default: ['#1e88e5', '#e53935', '#43a047', '#fb8c00', '#8e24aa', '#00acc1', '#fdd835', '#f4511e'],
      vibrant: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#a55eea', '#26de81', '#fd79a8'],
      pastel: ['#74b9ff', '#fd79a8', '#fdcb6e', '#6c5ce7', '#00b894', '#e17055', '#a29bfe', '#ffeaa7'],
      monochrome: ['#2d3436', '#636e72', '#b2bec3', '#ddd', '#74b9ff', '#0984e3', '#00b894', '#fd79a8']
    };
  }
  
  getColors() {
    const palettes = this.getColorPalettes();
    return palettes[this.colorPalette] || palettes.default;
  }
  
  getMargin() {
    return { top: 60, right: 200, bottom: 100, left: 80 };
  }
  
  getDataRange() {
    let minValue = Infinity;
    let maxValue = -Infinity;
    
    this.data.datasets.forEach(dataset => {
      dataset.data.forEach(value => {
        minValue = Math.min(minValue, value);
        maxValue = Math.max(maxValue, value);
      });
    });
    
    // Add padding
    const range = maxValue - minValue;
    const padding = range * 0.1;
    minValue -= padding;
    maxValue += padding;
    
    if (minValue === maxValue) {
      minValue -= 1;
      maxValue += 1;
    }
    
    return { minValue, maxValue };
  }
  
  calculateMovingAverage(data, period) {
    const result = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        result.push(data[i]);
      } else {
        const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        result.push(sum / period);
      }
    }
    return result;
  }
  
  animate() {
    this.animating = true;
    this.animationProgress = 0;
    
    const animate = () => {
      this.animationProgress += 0.05;
      if (this.animationProgress >= 1) {
        this.animationProgress = 1;
        this.animating = false;
      }
      this.draw();
      if (this.animating) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }
  
  update() {
    this.draw();
  }
  
  draw() {
    const ctx = this.ctx;
    const canvas = this.canvas;
    const { labels, datasets } = this.data;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (!datasets || datasets.length === 0 || !labels || labels.length === 0) {
      this.drawNoDataMessage();
      return;
    }
    
    const margin = this.getMargin();
    const chartWidth = canvas.width - margin.left - margin.right;
    const chartHeight = canvas.height - margin.top - margin.bottom;
    const { minValue, maxValue } = this.getDataRange();
    
    // Helper functions
    const getX = (index) => margin.left + (index / (labels.length - 1)) * chartWidth;
    const getY = (value) => {
      if (this.yAxisType === 'logarithmic') {
        const logMin = Math.log10(Math.max(minValue, 0.001));
        const logMax = Math.log10(Math.max(maxValue, 0.001));
        const logValue = Math.log10(Math.max(value, 0.001));
        return margin.top + chartHeight - ((logValue - logMin) / (logMax - logMin)) * chartHeight;
      }
      return margin.top + chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight;
    };
    
    // Draw background and grid
    if (this.showGrid) {
      this.drawGrid(margin, chartWidth, chartHeight, getX, getY, minValue, maxValue);
    }
    
    // Draw axes
    this.drawAxes(margin, chartWidth, chartHeight);
    
    // Draw data based on chart type
    switch (this.chartType) {
      case 'line':
        this.drawLineChart(datasets, getX, getY);
        break;
      case 'bar':
        this.drawBarChart(datasets, getX, getY, chartWidth);
        break;
      case 'area':
        this.drawAreaChart(datasets, getX, getY, chartHeight, margin);
        break;
      case 'scatter':
        this.drawScatterChart(datasets, getX, getY);
        break;
    }
    
    // Draw moving averages if enabled
    if (this.showMovingAverage) {
      this.drawMovingAverages(datasets, getX, getY);
    }
    
    // Draw axis labels
    this.drawAxisLabels(margin, chartWidth, chartHeight, getY, minValue, maxValue, labels);
    
    // Draw legend
    if (this.showLegend) {
      this.drawLegend(margin, chartWidth);
    }
    
    // Draw crosshair
    if (this.crosshair.x !== null && this.crosshair.y !== null) {
      this.drawCrosshair();
    }
    
    // Draw tooltip
    if (this.hoveredPoint) {
      this.drawTooltip();
    }
    
    // Draw title
    this.drawTitle();
    
    // Draw chart controls indicator
    this.drawControlsIndicator();
  }
  
  drawNoDataMessage() {
    const ctx = this.ctx;
    ctx.fillStyle = '#666';
    ctx.font = '16px Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No data to display', this.canvas.width / 2, this.canvas.height / 2);
  }
  
  drawGrid(margin, chartWidth, chartHeight, getX, getY, minValue, maxValue) {
    const ctx = this.ctx;
    ctx.strokeStyle = this.theme === 'dark' ? '#444' : '#e0e0e0';
    ctx.lineWidth = 1;
    
    // Vertical grid lines
    const verticalStep = Math.max(1, Math.floor(this.data.labels.length / 10));
    for (let i = 0; i < this.data.labels.length; i += verticalStep) {
      const x = getX(i);
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, margin.top + chartHeight);
      ctx.stroke();
    }
    
    // Horizontal grid lines
    const ySteps = 8;
    for (let i = 0; i <= ySteps; i++) {
      const value = minValue + (maxValue - minValue) * (i / ySteps);
      const y = getY(value);
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + chartWidth, y);
      ctx.stroke();
    }
  }
  
  drawAxes(margin, chartWidth, chartHeight) {
    const ctx = this.ctx;
    ctx.strokeStyle = this.theme === 'dark' ? '#ccc' : '#333';
    ctx.lineWidth = 2;
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + chartHeight);
    ctx.stroke();
    
    // X-axis
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top + chartHeight);
    ctx.lineTo(margin.left + chartWidth, margin.top + chartHeight);
    ctx.stroke();
  }
  
  drawLineChart(datasets, getX, getY) {
    const ctx = this.ctx;
    const colors = this.getColors();
    
    datasets.forEach((dataset, datasetIndex) => {
      if (this.selectedDatasets.length > 0 && !this.selectedDatasets.includes(datasetIndex)) {
        return; // Skip unselected datasets
      }
      
      const color = colors[datasetIndex % colors.length];
      const alpha = this.selectedDatasets.length > 0 && !this.selectedDatasets.includes(datasetIndex) ? 0.3 : 1;
      
      // Set line style
      ctx.strokeStyle = color;
      ctx.globalAlpha = alpha * this.animationProgress;
      ctx.lineWidth = 2;
      
      // Apply line style
      if (this.lineStyle === 'dashed') {
        ctx.setLineDash([5, 5]);
      } else if (this.lineStyle === 'dotted') {
        ctx.setLineDash([2, 2]);
      } else {
        ctx.setLineDash([]);
      }
      
      // Draw line
      ctx.beginPath();
      dataset.data.forEach((value, index) => {
        const x = getX(index);
        const y = getY(value);
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          if (this.smoothing) {
            // Simple curve smoothing
            const prevX = getX(index - 1);
            const prevY = getY(dataset.data[index - 1]);
            const cpX = (prevX + x) / 2;
            ctx.quadraticCurveTo(cpX, prevY, x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
      });
      ctx.stroke();
      
      // Fill area if enabled
      if (this.fillArea) {
        const gradient = ctx.createLinearGradient(0, getY(Math.max(...dataset.data)), 0, getY(Math.min(...dataset.data)));
        const rgbaColor = this.hexToRgba(color, 0.3);
        gradient.addColorStop(0, rgbaColor);
        gradient.addColorStop(1, this.hexToRgba(color, 0.1));
        
        ctx.fillStyle = gradient;
        ctx.lineTo(getX(dataset.data.length - 1), getY(0));
        ctx.lineTo(getX(0), getY(0));
        ctx.closePath();
        ctx.fill();
      }
      
      // Draw data points
      if (this.showDataPoints) {
        ctx.fillStyle = color;
        ctx.globalAlpha = alpha;
        dataset.data.forEach((value, index) => {
          const x = getX(index);
          const y = getY(value);
          
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, 2 * Math.PI);
          ctx.fill();
          
          // Highlight hovered point
          if (this.hoveredPoint && 
              this.hoveredPoint.datasetIndex === datasetIndex && 
              this.hoveredPoint.pointIndex === index) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, 2 * Math.PI);
            ctx.stroke();
          }
        });
      }
      
      ctx.globalAlpha = 1;
      ctx.setLineDash([]);
    });
  }
  
  drawBarChart(datasets, getX, getY, chartWidth) {
    const ctx = this.ctx;
    const colors = this.getColors();
    const barWidth = chartWidth / (this.data.labels.length * datasets.length + datasets.length);
    
    datasets.forEach((dataset, datasetIndex) => {
      if (this.selectedDatasets.length > 0 && !this.selectedDatasets.includes(datasetIndex)) {
        return;
      }
      
      const color = colors[datasetIndex % colors.length];
      ctx.fillStyle = color;
      ctx.globalAlpha = this.animationProgress;
      
      dataset.data.forEach((value, index) => {
        const x = getX(index) - (barWidth * datasets.length) / 2 + (datasetIndex * barWidth);
        const y = getY(value);
        const height = getY(0) - y;
        
        ctx.fillRect(x, y, barWidth * 0.8, height);
      });
      
      ctx.globalAlpha = 1;
    });
  }
  
  drawAreaChart(datasets, getX, getY, chartHeight, margin) {
    const ctx = this.ctx;
    const colors = this.getColors();
    
    datasets.forEach((dataset, datasetIndex) => {
      if (this.selectedDatasets.length > 0 && !this.selectedDatasets.includes(datasetIndex)) {
        return;
      }
      
      const color = colors[datasetIndex % colors.length];
      const gradient = ctx.createLinearGradient(0, margin.top, 0, margin.top + chartHeight);
      gradient.addColorStop(0, this.hexToRgba(color, 0.6));
      gradient.addColorStop(1, this.hexToRgba(color, 0.1));
      
      ctx.fillStyle = gradient;
      ctx.globalAlpha = this.animationProgress;
      
      ctx.beginPath();
      dataset.data.forEach((value, index) => {
        const x = getX(index);
        const y = getY(value);
        
        if (index === 0) {
          ctx.moveTo(x, getY(0));
          ctx.lineTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.lineTo(getX(dataset.data.length - 1), getY(0));
      ctx.closePath();
      ctx.fill();
      
      // Draw border line
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      dataset.data.forEach((value, index) => {
        const x = getX(index);
        const y = getY(value);
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
      
      ctx.globalAlpha = 1;
    });
  }
  
  drawScatterChart(datasets, getX, getY) {
    const ctx = this.ctx;
    const colors = this.getColors();
    
    datasets.forEach((dataset, datasetIndex) => {
      if (this.selectedDatasets.length > 0 && !this.selectedDatasets.includes(datasetIndex)) {
        return;
      }
      
      const color = colors[datasetIndex % colors.length];
      ctx.fillStyle = color;
      ctx.globalAlpha = this.animationProgress;
      
      dataset.data.forEach((value, index) => {
        const x = getX(index);
        const y = getY(value);
        
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fill();
        
        // Highlight hovered point
        if (this.hoveredPoint && 
            this.hoveredPoint.datasetIndex === datasetIndex && 
            this.hoveredPoint.pointIndex === index) {
          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(x, y, 8, 0, 2 * Math.PI);
          ctx.stroke();
        }
      });
      
      ctx.globalAlpha = 1;
    });
  }
  
  drawMovingAverages(datasets, getX, getY) {
    const ctx = this.ctx;
    const colors = this.getColors();
    
    datasets.forEach((dataset, datasetIndex) => {
      if (this.selectedDatasets.length > 0 && !this.selectedDatasets.includes(datasetIndex)) {
        return;
      }
      
      const movingAvg = this.calculateMovingAverage(dataset.data, this.movingAveragePeriod);
      const color = colors[datasetIndex % colors.length];
      
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.7;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      
      ctx.beginPath();
      movingAvg.forEach((value, index) => {
        const x = getX(index);
        const y = getY(value);
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
      
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    });
  }
  
  drawAxisLabels(margin, chartWidth, chartHeight, getY, minValue, maxValue, labels) {
    const ctx = this.ctx;
    ctx.fillStyle = this.theme === 'dark' ? '#ccc' : '#666';
    ctx.font = '12px Roboto, sans-serif';
    
    // Y-axis labels
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    
    const ySteps = 8;
    for (let i = 0; i <= ySteps; i++) {
      const value = minValue + (maxValue - minValue) * (i / ySteps);
      const y = getY(value);
      const labelValue = this.yAxisType === 'logarithmic' ? 
        Math.pow(10, value).toExponential(1) : 
        value.toFixed(1);
      ctx.fillText(labelValue, margin.left - 10, y);
    }
    
    // X-axis labels
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    const labelStep = Math.max(1, Math.floor(labels.length / 8));
    for (let i = 0; i < labels.length; i += labelStep) {
      const x = margin.left + (i / (labels.length - 1)) * chartWidth;
      const label = labels[i];
      const shortLabel = label.includes(',') ? label.split(',')[1].trim() : label;
      ctx.fillText(shortLabel, x, margin.top + chartHeight + 10);
    }
    
    // Axis titles
    ctx.font = 'bold 14px Roboto, sans-serif';
    ctx.fillStyle = this.theme === 'dark' ? '#fff' : '#333';
    
    // Y-axis title
    ctx.save();
    ctx.translate(20, margin.top + chartHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Value', 0, 0);
    ctx.restore();
    
    // X-axis title
    ctx.textAlign = 'center';
    ctx.fillText('Time', margin.left + chartWidth / 2, margin.top + chartHeight + 60);
  }
  
  drawLegend(margin, chartWidth) {
    const ctx = this.ctx;
    const colors = this.getColors();
    const legendX = margin.left + chartWidth + 20;
    let legendY = margin.top;
    
    ctx.font = '14px Roboto, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    
    this.data.datasets.forEach((dataset, index) => {
      const color = colors[index % colors.length];
      const label = dataset.label || `Dataset ${index + 1}`;
      const isSelected = this.selectedDatasets.length === 0 || this.selectedDatasets.includes(index);
      
      // Draw color box
      ctx.fillStyle = color;
      ctx.globalAlpha = isSelected ? 1 : 0.3;
      ctx.fillRect(legendX, legendY - 6, 12, 12);
      
      // Draw label
      ctx.fillStyle = this.theme === 'dark' ? '#ccc' : '#333';
      ctx.globalAlpha = isSelected ? 1 : 0.5;
      ctx.fillText(label, legendX + 20, legendY);
      
      // Add selection indicator
      if (this.selectedDatasets.includes(index)) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(legendX - 2, legendY - 8, 16, 16);
      }
      
      legendY += 25;
      ctx.globalAlpha = 1;
    });
  }
  
  drawCrosshair() {
    const ctx = this.ctx;
    const margin = this.getMargin();
    const chartWidth = this.canvas.width - margin.left - margin.right;
    const chartHeight = this.canvas.height - margin.top - margin.bottom;
    
    ctx.strokeStyle = this.theme === 'dark' ? '#666' : '#999';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    
    // Vertical line
    if (this.crosshair.x >= margin.left && this.crosshair.x <= margin.left + chartWidth) {
      ctx.beginPath();
      ctx.moveTo(this.crosshair.x, margin.top);
      ctx.lineTo(this.crosshair.x, margin.top + chartHeight);
      ctx.stroke();
    }
    
    // Horizontal line
    if (this.crosshair.y >= margin.top && this.crosshair.y <= margin.top + chartHeight) {
      ctx.beginPath();
      ctx.moveTo(margin.left, this.crosshair.y);
      ctx.lineTo(margin.left + chartWidth, this.crosshair.y);
      ctx.stroke();
    }
    
    ctx.setLineDash([]);
  }
  
  drawTooltip() {
    if (!this.hoveredPoint) return;
    
    const ctx = this.ctx;
    const point = this.hoveredPoint;
    const colors = this.getColors();
    const color = colors[point.datasetIndex % colors.length];
    
    // Tooltip content
    const lines = [
      `${point.datasetLabel}`,
      `Time: ${point.label}`,
      `Value: ${point.value.toFixed(2)}`
    ];
    
    // Calculate tooltip dimensions
    ctx.font = '12px Roboto, sans-serif';
    const padding = 8;
    const lineHeight = 16;
    const maxWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
    const tooltipWidth = maxWidth + padding * 2;
    const tooltipHeight = lines.length * lineHeight + padding * 2;
    
    // Position tooltip
    let tooltipX = point.x + 15;
    let tooltipY = point.y - tooltipHeight - 15;
    
    // Adjust if tooltip goes off screen
    if (tooltipX + tooltipWidth > this.canvas.width) {
      tooltipX = point.x - tooltipWidth - 15;
    }
    if (tooltipY < 0) {
      tooltipY = point.y + 15;
    }
    
    // Draw tooltip background
    ctx.fillStyle = this.theme === 'dark' ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.95)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.fillRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);
    ctx.strokeRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);
    
    // Draw tooltip text
    ctx.fillStyle = this.theme === 'dark' ? '#fff' : '#333';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    lines.forEach((line, index) => {
      if (index === 0) {
        ctx.font = 'bold 12px Roboto, sans-serif';
        ctx.fillStyle = color;
      } else {
        ctx.font = '12px Roboto, sans-serif';
        ctx.fillStyle = this.theme === 'dark' ? '#ccc' : '#666';
      }
      ctx.fillText(line, tooltipX + padding, tooltipY + padding + index * lineHeight);
    });
  }
  
  drawTitle() {
    const ctx = this.ctx;
    ctx.font = 'bold 18px Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = this.theme === 'dark' ? '#fff' : '#333';
    
    let title = 'Enhanced Sensor Data Chart';
    if (this.chartType !== 'line') {
      title += ` (${this.chartType.charAt(0).toUpperCase() + this.chartType.slice(1)})`;
    }
    
    ctx.fillText(title, this.canvas.width / 2, 10);
  }
  
  drawControlsIndicator() {
    const ctx = this.ctx;
    ctx.font = '10px Roboto, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = this.theme === 'dark' ? '#666' : '#999';
    
    const indicators = [];
    if (this.isZoomed) indicators.push('Zoomed');
    if (this.selectedDatasets.length > 0) indicators.push('Filtered');
    if (this.showMovingAverage) indicators.push('MA');
    if (this.fillArea) indicators.push('Fill');
    
    if (indicators.length > 0) {
      ctx.fillText(indicators.join(' | '), this.canvas.width - 10, this.canvas.height - 10);
    }
  }
  
  hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  
  exportChart(format = 'png') {
    const link = document.createElement('a');
    link.download = `chart.${format}`;
    link.href = this.canvas.toDataURL(`image/${format}`);
    link.click();
  }
  
  enterFullscreen() {
    const container = this.canvas.parentElement;
    if (container.requestFullscreen) {
      container.requestFullscreen();
    }
  }
}

// Export for global use
if (typeof window !== 'undefined') {
  window.EnhancedChart = EnhancedChart;
}