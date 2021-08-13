// Adapted from:
//  - https://elliotbentley.com/blog/a-better-way-to-structure-d3-code/

const d3 = require("d3");

module.exports = class BarPlot {

  constructor(element, data, options) {
    this.element = element

    this.width = 300;
    this.height = 300;
    this.margin = {top: 25, right: 20, bottom: 35, left: 40};

    this.num_bars = 10

    this.data = data.slice(0, this.num_bars)

    this.draw();
  }


  draw() {    
    this.svg = d3.select(this.element)
      .append('svg')
      .attr("width", this.width)
      .attr("height", this.height);

    this._createScales();
    this._drawAxes();
    this._drawBars();
  }


  update(data) {
    this.data = data.slice(0, this.num_bars)

    this.svg.selectAll("rect")
      .data(this.data)
      .transition(50)
        .attr("y", (d) => (d>0) ? this.y(d) : this.y(0))
        .attr("height", d => Math.abs(this.y(0) - this.y(d)))
  }


  _createScales() {
    m = this.margin

    this.x = d3.scaleBand()
      .domain(d3.range(this.num_bars))
      .range([m.left, this.width - m.right])
      .padding(0.1);

    this.y = d3.scaleLinear()
      .domain(d3.extent(this.data)).nice()
      .range([this.height - m.bottom, m.top]);
  }


  _drawAxes() {
    m = this.margin;

    const xAxis = g => g
      .attr("transform", `translate(0,${this.height - this.margin.bottom})`)
      .call(d3.axisBottom(this.x).ticks(this.width / 80))
      .call(g => g.append("text")
        .attr("x", this.width)
        .attr("y", this.margin.bottom - 4)
        .attr("fill", "black")
        .attr("text-anchor", "end"));
    
    const yAxis = g => g
      .attr("transform", `translate(${this.margin.left},0)`)
      .call(d3.axisLeft(this.y))
      .call(g => g.append("text")
        .attr("x", - this.margin.left)
        .attr("y", 10)
        .attr("fill", "black")
        .attr("text-anchor", "start"));

    this.svg.append("g")
        .call(xAxis);

    this.svg.append("g")
        .call(yAxis);
  }


  _drawBars() {
  this.svg.append("g")
    .attr("fill", "black")
    .selectAll("rect")
    .data(this.data)
    .join("rect")
      .attr("x", (d, i) => this.x(i))
      .attr("y", (d) => (d>0) ? this.y(d) : this.y(0))
      .attr("height", d => Math.abs(this.y(0) - this.y(d)) )
      .attr("width", this.x.bandwidth());
  }
}
