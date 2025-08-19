// D3.js Chart Implementation for Engesense Dashboard
// Professional time-series visualization using D3.js

class D3Chart {
  constructor(container, config) {
    this.container = container;
    this.config = config;
    this.data = config.data || { labels: [], datasets: [] };
    this.svg = null;
    this.margin = { top: 20, right: 120, bottom: 40, left: 80 };
    this.colors = [
      '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
      '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
    ];
    
    this.init();
  }

  init() {
    // Clear container
    d3.select(this.container).selectAll("*").remove();
    
    // Get container dimensions
    const containerRect = this.container.getBoundingClientRect();
    this.width = Math.max(containerRect.width || 800, 400) - this.margin.left - this.margin.right;
    this.height = Math.max(containerRect.height || 400, 200) - this.margin.top - this.margin.bottom;
    
    // Create SVG
    this.svg = d3.select(this.container)
      .append('svg')
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr('height', this.height + this.margin.top + this.margin.bottom)
      .style('background-color', '#fafafa');
    
    // Create main group
    this.g = this.svg.append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);
    
    // Initialize scales
    this.xScale = d3.scaleTime().range([0, this.width]);
    this.yScale = d3.scaleLinear().range([this.height, 0]);
    
    // Create axes
    this.xAxis = d3.axisBottom(this.xScale).tickFormat(d3.timeFormat('%H:%M'));
    this.yAxis = d3.axisLeft(this.yScale);
    
    // Add axis groups
    this.g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${this.height})`);
    
    this.g.append('g')
      .attr('class', 'y-axis');
    
    // Add axis labels
    this.g.append('text')
      .attr('class', 'x-label')
      .attr('text-anchor', 'middle')
      .attr('x', this.width / 2)
      .attr('y', this.height + 35)
      .style('font-size', '12px')
      .style('fill', '#666')
      .text('Time');
    
    this.g.append('text')
      .attr('class', 'y-label')
      .attr('text-anchor', 'middle')
      .attr('transform', 'rotate(-90)')
      .attr('x', -this.height / 2)
      .attr('y', -50)
      .style('font-size', '12px')
      .style('fill', '#666')
      .text('Value');
    
    // Add title
    this.svg.append('text')
      .attr('class', 'chart-title')
      .attr('text-anchor', 'middle')
      .attr('x', (this.width + this.margin.left + this.margin.right) / 2)
      .attr('y', 20)
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .style('fill', '#333')
      .text('Sensor Data');
    
    // Create tooltip
    this.tooltip = d3.select('body').append('div')
      .attr('class', 'd3-tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background-color', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('padding', '8px')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('z-index', '1000');
    
    this.draw();
  }

  updateData(labels, datasets) {
    this.data = { labels, datasets };
    this.draw();
  }

  draw() {
    const { labels, datasets } = this.data;
    
    if (!datasets || datasets.length === 0 || !labels || labels.length === 0) {
      // Show no data message
      this.g.selectAll('.no-data').remove();
      this.g.append('text')
        .attr('class', 'no-data')
        .attr('text-anchor', 'middle')
        .attr('x', this.width / 2)
        .attr('y', this.height / 2)
        .style('font-size', '16px')
        .style('fill', '#666')
        .text('No data to display');
      return;
    }

    // Remove no data message
    this.g.selectAll('.no-data').remove();
    
    // Parse time labels
    const timeParser = d3.timeParse('%Y-%m-%dT%H:%M:%S.%LZ');
    const parsedLabels = labels.map(label => {
      // Try different time formats
      let date = timeParser(label);
      if (!date) {
        date = new Date(label);
      }
      return date;
    });
    
    // Prepare data for D3
    const chartData = datasets.map((dataset, i) => ({
      name: dataset.label || `Dataset ${i + 1}`,
      color: this.colors[i % this.colors.length],
      values: dataset.data.map((value, j) => ({
        time: parsedLabels[j],
        value: value
      })).filter(d => d.time && !isNaN(d.value))
    }));
    
    // Update scales
    const allValues = chartData.flatMap(d => d.values.map(v => v.value));
    const allTimes = chartData.flatMap(d => d.values.map(v => v.time));
    
    this.xScale.domain(d3.extent(allTimes));
    this.yScale.domain(d3.extent(allValues));
    
    // Update axes
    this.g.select('.x-axis').call(this.xAxis);
    this.g.select('.y-axis').call(this.yAxis);
    
    // Line generator
    const line = d3.line()
      .x(d => this.xScale(d.time))
      .y(d => this.yScale(d.value))
      .curve(d3.curveMonotoneX);
    
    // Bind data
    const lines = this.g.selectAll('.data-line')
      .data(chartData, d => d.name);
    
    // Remove old lines
    lines.exit().remove();
    
    // Add new lines
    const newLines = lines.enter().append('g')
      .attr('class', 'data-line');
    
    newLines.append('path')
      .attr('class', 'line-path')
      .style('fill', 'none')
      .style('stroke-width', 2);
    
    // Update all lines
    const allLines = newLines.merge(lines);
    
    allLines.select('.line-path')
      .style('stroke', d => d.color)
      .attr('d', d => line(d.values));
    
    // Add data points
    const points = allLines.selectAll('.data-point')
      .data(d => d.values.map(v => ({ ...v, color: d.color, name: d.name })));
    
    points.exit().remove();
    
    const newPoints = points.enter().append('circle')
      .attr('class', 'data-point')
      .attr('r', 3)
      .style('cursor', 'pointer');
    
    newPoints.merge(points)
      .attr('cx', d => this.xScale(d.time))
      .attr('cy', d => this.yScale(d.value))
      .style('fill', d => d.color)
      .style('stroke', '#fff')
      .style('stroke-width', 1)
      .on('mouseover', (event, d) => {
        this.tooltip.transition().duration(200).style('opacity', .9);
        this.tooltip.html(`
          <strong>${d.name}</strong><br/>
          Time: ${d3.timeFormat('%Y-%m-%d %H:%M:%S')(d.time)}<br/>
          Value: ${d.value.toFixed(2)}
        `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', () => {
        this.tooltip.transition().duration(500).style('opacity', 0);
      });
    
    // Create legend
    this.createLegend(chartData);
  }

  createLegend(chartData) {
    // Remove existing legend
    this.svg.selectAll('.legend').remove();
    
    const legend = this.svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${this.width + this.margin.left + 10}, ${this.margin.top})`);
    
    const legendItems = legend.selectAll('.legend-item')
      .data(chartData)
      .enter().append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 20})`);
    
    legendItems.append('rect')
      .attr('width', 12)
      .attr('height', 12)
      .style('fill', d => d.color);
    
    legendItems.append('text')
      .attr('x', 18)
      .attr('y', 6)
      .attr('dy', '0.35em')
      .style('font-size', '12px')
      .style('fill', '#333')
      .text(d => d.name);
  }

  // Method to handle responsive resizing
  resize() {
    const containerRect = this.container.getBoundingClientRect();
    const newWidth = Math.max(containerRect.width || 800, 400) - this.margin.left - this.margin.right;
    const newHeight = Math.max(containerRect.height || 400, 200) - this.margin.top - this.margin.bottom;
    
    if (newWidth !== this.width || newHeight !== this.height) {
      this.width = newWidth;
      this.height = newHeight;
      this.init();
    }
  }

  // Cleanup method
  destroy() {
    if (this.tooltip) {
      this.tooltip.remove();
    }
    d3.select(this.container).selectAll("*").remove();
  }
}

// Handle window resize
window.addEventListener('resize', () => {
  if (window.chart && typeof window.chart.resize === 'function') {
    window.chart.resize();
  }
});