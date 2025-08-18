// Fallback chart implementation when Chart.js is not available
// This provides basic line chart functionality using Canvas API

class FallbackChart {
  constructor(ctx, config) {
    this.ctx = ctx;
    this.canvas = ctx.canvas;
    this.config = config;
    this.data = config.data || { labels: [], datasets: [] };
    
    // Set canvas size
    this.canvas.width = this.canvas.offsetWidth || 800;
    this.canvas.height = this.canvas.offsetHeight || 400;
    
    this.draw();
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
      // Show no data message
      ctx.fillStyle = '#666';
      ctx.font = '16px Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No data available', canvas.width / 2, canvas.height / 2);
      return;
    }
    
    // Chart dimensions and margins
    const margin = { top: 40, right: 150, bottom: 80, left: 80 };
    const chartWidth = canvas.width - margin.left - margin.right;
    const chartHeight = canvas.height - margin.top - margin.bottom;
    
    // Find data ranges
    let minValue = Infinity;
    let maxValue = -Infinity;
    
    datasets.forEach(dataset => {
      dataset.data.forEach(value => {
        minValue = Math.min(minValue, value);
        maxValue = Math.max(maxValue, value);
      });
    });
    
    // Add some padding to the range
    const range = maxValue - minValue;
    const padding = range * 0.1;
    minValue -= padding;
    maxValue += padding;
    
    if (minValue === maxValue) {
      minValue -= 1;
      maxValue += 1;
    }
    
    // Helper functions
    const getX = (index) => margin.left + (index / (labels.length - 1)) * chartWidth;
    const getY = (value) => margin.top + chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight;
    
    // Draw background grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    
    // Vertical grid lines
    for (let i = 0; i < labels.length; i += Math.max(1, Math.floor(labels.length / 10))) {
      const x = getX(i);
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, margin.top + chartHeight);
      ctx.stroke();
    }
    
    // Horizontal grid lines
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
      const value = minValue + (maxValue - minValue) * (i / ySteps);
      const y = getY(value);
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + chartWidth, y);
      ctx.stroke();
    }
    
    // Draw axes
    ctx.strokeStyle = '#333';
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
    
    // Draw Y-axis labels
    ctx.fillStyle = '#666';
    ctx.font = '12px Roboto, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i <= ySteps; i++) {
      const value = minValue + (maxValue - minValue) * (i / ySteps);
      const y = getY(value);
      ctx.fillText(value.toFixed(1), margin.left - 10, y);
    }
    
    // Draw X-axis labels (show every few labels to avoid overlap)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    const labelStep = Math.max(1, Math.floor(labels.length / 8));
    for (let i = 0; i < labels.length; i += labelStep) {
      const x = getX(i);
      const label = labels[i];
      // Simplify timestamp display
      const shortLabel = label.includes(',') ? label.split(',')[1].trim() : label;
      ctx.fillText(shortLabel, x, margin.top + chartHeight + 10);
    }
    
    // Draw datasets
    datasets.forEach((dataset, datasetIndex) => {
      const color = dataset.borderColor || '#1e88e5';
      
      // Draw line
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
      
      // Draw points
      ctx.fillStyle = color;
      dataset.data.forEach((value, index) => {
        const x = getX(index);
        const y = getY(value);
        
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
      });
    });
    
    // Draw legend
    const legendX = margin.left + chartWidth + 20;
    let legendY = margin.top;
    
    ctx.font = '14px Roboto, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    
    datasets.forEach((dataset, index) => {
      const color = dataset.borderColor || '#1e88e5';
      const label = dataset.label || `Dataset ${index + 1}`;
      
      // Draw color box
      ctx.fillStyle = color;
      ctx.fillRect(legendX, legendY - 6, 12, 12);
      
      // Draw label
      ctx.fillStyle = '#333';
      ctx.fillText(label, legendX + 20, legendY);
      
      legendY += 25;
    });
    
    // Draw title
    ctx.font = 'bold 16px Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#333';
    ctx.fillText('Sensor Data Chart', canvas.width / 2, 10);
  }
}

// Create a global Chart constructor if Chart.js is not available
if (typeof Chart === 'undefined') {
  window.Chart = FallbackChart;
  console.log('Using fallback chart implementation');
}