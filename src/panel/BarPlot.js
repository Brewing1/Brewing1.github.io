// Adapted from:
//  - https://elliotbentley.com/blog/a-better-way-to-structure-d3-code/

const d3 = require("d3");

module.exports = class BarPlot {

  constructor(element, sampleData, options) {
    this.element = element

    this.width = 300;
    this.height = 300;
    this.margin = {top: 25, right: 20, bottom: 35, left: 40};

    this.numBars = 10
    this.fullSampleData = sampleData;
    this.data = this.fullSampleData[0].slice(0, this.numBars)

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


  update(step) {
    this.data = this.fullSampleData[step].slice(0, this.numBars)

    this.svg.selectAll("rect")
      .data(this.data)
      .transition(50)
        .attr("y", (d) => (d>0) ? this.y(d) : this.y(0))
        .attr("height", d => Math.abs(this.y(0) - this.y(d)))
  }


  _createScales() {
    m = this.margin

    this.x = d3.scaleBand()
      .domain(d3.range(this.numBars))
      .range([m.left, this.width - m.right])
      .padding(0.1);

    const minY = d3.min(this.fullSampleData, d => d3.min(d.slice(0, this.numBars)));
    const maxY = d3.max(this.fullSampleData, d => d3.max(d.slice(0, this.numBars)));

    this.y = d3.scaleLinear()
      .domain([minY, maxY]).nice()
      .range([this.height - m.bottom, m.top]);

    console.log(this.y(5))
  }


  _drawAxes() {
    m = this.margin;

    xAxis = g => g
      .attr("transform", `translate(0,${this.height - this.margin.bottom})`)
      .attr("class", "x axis")
      .call(d3.axisBottom(this.x).ticks(this.width / 80))
      .call(g => g.append("text")
        .attr("x", this.width)
        .attr("y", this.margin.bottom - 4)
        .attr("fill", "black")
        .attr("text-anchor", "end"));
    
    yAxis = g => g
      .attr("transform", `translate(${this.margin.left},0)`)
      .attr("class", "y axis")
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
