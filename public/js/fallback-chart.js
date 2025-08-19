// Fallback Chart Implementation for Engesense Dashboard
// HTML5 Canvas-based chart when external libraries are not available

class FallbackChart {
  constructor(container) {
    this.container = container;
    this.datasets = [];
    this.colors = [
      '#1e88e5', '#e53935', '#43a047', '#fb8c00',
      '#8e24aa', '#00acc1', '#fdd835', '#f4511e',
      '#6d4c41', '#546e7a', '#f06292', '#26a69a'
    ];
    this.init();
  }

  init() {
    // Clear container
    this.container.innerHTML = '';
    
    // Create canvas element
    this.canvas = document.createElement('canvas');
    this.canvas.width = 800;
    this.canvas.height = 400;
    this.canvas.style.width = '100%';
    this.canvas.style.height = '400px';
    this.canvas.style.border = '1px solid #e0e0e0';
    this.canvas.style.borderRadius = '8px';
    this.canvas.style.backgroundColor = '#fafafa';
    
    this.container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    
    // Create legend container
    this.legendContainer = document.createElement('div');
    this.legendContainer.style.marginTop = '16px';
    this.legendContainer.style.display = 'flex';
    this.legendContainer.style.flexWrap = 'wrap';
    this.legendContainer.style.gap = '16px';
    this.legendContainer.style.justifyContent = 'center';
    this.container.appendChild(this.legendContainer);
    
    // Set up mouse events for interactivity
    this.setupMouseEvents();
    
    // Draw initial empty state
    this.drawEmptyState();
  }

  setupMouseEvents() {
    this.canvas.addEventListener('mousemove', (e) => {
      if (this.datasets.length === 0) return;
      
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
      
      this.handleMouseMove(x, y);
    });
    
    this.canvas.addEventListener('mouseleave', () => {
      this.hideTooltip();
    });
  }

  handleMouseMove(mouseX, mouseY) {
    if (!this.chartArea) return;
    
    const { left, top, width, height } = this.chartArea;
    
    if (mouseX >= left && mouseX <= left + width && 
        mouseY >= top && mouseY <= top + height) {
      
      // Find closest data point
      let closestPoint = null;
      let minDistance = Infinity;
      
      this.datasets.forEach((dataset, datasetIndex) => {
        dataset.points.forEach((point, pointIndex) => {
          const distance = Math.sqrt(
            Math.pow(mouseX - point.x, 2) + Math.pow(mouseY - point.y, 2)
          );
          
          if (distance < minDistance && distance < 20) {
            minDistance = distance;
            closestPoint = {
              ...point,
              datasetIndex,
              pointIndex,
              label: dataset.label,
              color: dataset.color
            };
          }
        });
      });
      
      if (closestPoint) {
        this.showTooltip(closestPoint, mouseX, mouseY);
      } else {
        this.hideTooltip();
      }
    }
  }

  showTooltip(point, x, y) {
    this.hideTooltip();
    
    this.tooltip = document.createElement('div');
    this.tooltip.style.position = 'absolute';
    this.tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    this.tooltip.style.color = 'white';
    this.tooltip.style.padding = '8px 12px';
    this.tooltip.style.borderRadius = '4px';
    this.tooltip.style.fontSize = '12px';
    this.tooltip.style.pointerEvents = 'none';
    this.tooltip.style.zIndex = '1000';
    this.tooltip.style.whiteSpace = 'nowrap';
    
    const rect = this.canvas.getBoundingClientRect();
    this.tooltip.style.left = (rect.left + x + 10) + 'px';
    this.tooltip.style.top = (rect.top + y - 10) + 'px';
    
    this.tooltip.innerHTML = `
      <div style="font-weight: bold; color: ${point.color};">${point.label}</div>
      <div>Point: ${point.pointIndex + 1}</div>
      <div>Value: ${point.value.toFixed(2)}</div>
    `;
    
    document.body.appendChild(this.tooltip);
  }

  hideTooltip() {
    if (this.tooltip) {
      document.body.removeChild(this.tooltip);
      this.tooltip = null;
    }
  }

  updateData(datasets) {
    this.datasets = datasets.map((dataset, index) => ({
      label: dataset.label,
      data: dataset.data,
      borderColor: dataset.borderColor || this.colors[index % this.colors.length],
      color: dataset.borderColor || this.colors[index % this.colors.length],
      points: []
    }));
    
    this.draw();
    this.updateLegend();
  }

  draw() {
    if (this.datasets.length === 0) {
      this.drawEmptyState();
      return;
    }

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Set up drawing area
    const padding = 60;
    const chartWidth = this.canvas.width - 2 * padding;
    const chartHeight = this.canvas.height - 2 * padding;
    
    this.chartArea = {
      left: padding,
      top: padding,
      width: chartWidth,
      height: chartHeight
    };
    
    // Get data ranges
    const allValues = this.datasets.flatMap(d => d.data);
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    const valueRange = maxValue - minValue || 1;
    
    const maxDataLength = Math.max(...this.datasets.map(d => d.data.length));
    
    // Draw background
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(padding, padding, chartWidth, chartHeight);
    
    // Draw grid
    this.drawGrid(padding, chartWidth, chartHeight, minValue, maxValue);
    
    // Draw axes
    this.drawAxes(padding, chartWidth, chartHeight, minValue, maxValue, maxDataLength);
    
    // Draw data lines
    this.datasets.forEach((dataset, datasetIndex) => {
      this.drawDataset(dataset, datasetIndex, padding, chartWidth, chartHeight, minValue, valueRange, maxDataLength);
    });
    
    // Draw title
    this.drawTitle();
  }

  drawEmptyState() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#666';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('No sensor data available', this.canvas.width / 2, this.canvas.height / 2);
    
    this.ctx.font = '12px Arial';
    this.ctx.fillText('Select data sources and measurements to view charts', this.canvas.width / 2, this.canvas.height / 2 + 25);
  }

  drawGrid(padding, chartWidth, chartHeight, minValue, maxValue) {
    this.ctx.strokeStyle = '#e0e0e0';
    this.ctx.lineWidth = 1;
    
    // Vertical grid lines
    for (let i = 0; i <= 10; i++) {
      const x = padding + (chartWidth * i / 10);
      this.ctx.beginPath();
      this.ctx.moveTo(x, padding);
      this.ctx.lineTo(x, padding + chartHeight);
      this.ctx.stroke();
    }
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight * i / 5);
      this.ctx.beginPath();
      this.ctx.moveTo(padding, y);
      this.ctx.lineTo(padding + chartWidth, y);
      this.ctx.stroke();
    }
  }

  drawAxes(padding, chartWidth, chartHeight, minValue, maxValue, maxDataLength) {
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 2;
    this.ctx.font = '11px Arial';
    this.ctx.fillStyle = '#666';
    this.ctx.textAlign = 'center';
    
    // X-axis
    this.ctx.beginPath();
    this.ctx.moveTo(padding, padding + chartHeight);
    this.ctx.lineTo(padding + chartWidth, padding + chartHeight);
    this.ctx.stroke();
    
    // Y-axis
    this.ctx.beginPath();
    this.ctx.moveTo(padding, padding);
    this.ctx.lineTo(padding, padding + chartHeight);
    this.ctx.stroke();
    
    // Y-axis labels
    this.ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const value = maxValue - ((maxValue - minValue) * i / 5);
      const y = padding + (chartHeight * i / 5);
      this.ctx.fillText(value.toFixed(1), padding - 10, y + 4);
    }
    
    // X-axis labels (time points)
    this.ctx.textAlign = 'center';
    for (let i = 0; i <= 5; i++) {
      const x = padding + (chartWidth * i / 5);
      const pointNumber = Math.floor((maxDataLength - 1) * i / 5) + 1;
      this.ctx.fillText(`Point ${pointNumber}`, x, padding + chartHeight + 20);
    }
    
    // Axis titles
    this.ctx.fillStyle = '#333';
    this.ctx.font = 'bold 12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Data Points', padding + chartWidth / 2, this.canvas.height - 10);
    
    this.ctx.save();
    this.ctx.translate(15, padding + chartHeight / 2);
    this.ctx.rotate(-Math.PI / 2);
    this.ctx.fillText('Value', 0, 0);
    this.ctx.restore();
  }

  drawDataset(dataset, datasetIndex, padding, chartWidth, chartHeight, minValue, valueRange, maxDataLength) {
    if (dataset.data.length === 0) return;
    
    this.ctx.strokeStyle = dataset.color;
    this.ctx.fillStyle = dataset.color;
    this.ctx.lineWidth = 2;
    
    // Calculate points
    dataset.points = [];
    
    this.ctx.beginPath();
    let firstPoint = true;
    
    dataset.data.forEach((value, index) => {
      const x = padding + (chartWidth * index / (maxDataLength - 1 || 1));
      const y = padding + chartHeight - ((value - minValue) / valueRange * chartHeight);
      
      dataset.points.push({
        x,
        y,
        value,
        pointIndex: index
      });
      
      if (firstPoint) {
        this.ctx.moveTo(x, y);
        firstPoint = false;
      } else {
        this.ctx.lineTo(x, y);
      }
    });
    
    this.ctx.stroke();
    
    // Draw data points
    dataset.points.forEach(point => {
      this.ctx.beginPath();
      this.ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  drawTitle() {
    this.ctx.fillStyle = '#333';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Sensor Data Visualization', this.canvas.width / 2, 25);
  }

  updateLegend() {
    this.legendContainer.innerHTML = '';
    
    this.datasets.forEach((dataset, index) => {
      const legendItem = document.createElement('div');
      legendItem.style.display = 'flex';
      legendItem.style.alignItems = 'center';
      legendItem.style.gap = '8px';
      legendItem.style.fontSize = '12px';
      
      const colorBox = document.createElement('div');
      colorBox.style.width = '12px';
      colorBox.style.height = '12px';
      colorBox.style.backgroundColor = dataset.color;
      colorBox.style.borderRadius = '2px';
      
      const label = document.createElement('span');
      label.textContent = dataset.label;
      label.style.color = '#333';
      
      legendItem.appendChild(colorBox);
      legendItem.appendChild(label);
      this.legendContainer.appendChild(legendItem);
    });
  }

  // Method to handle responsive resizing
  resize() {
    const containerRect = this.container.getBoundingClientRect();
    this.canvas.width = Math.max(containerRect.width || 800, 400);
    this.canvas.height = 400;
    this.draw();
  }

  // Cleanup method
  destroy() {
    this.hideTooltip();
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

// Handle window resize
window.addEventListener('resize', () => {
  if (window.chart && typeof window.chart.resize === 'function') {
    window.chart.resize();
  }
});