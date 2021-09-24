// Adapted from:
//  - https://elliotbentley.com/blog/a-better-way-to-structure-d3-code/

const d3 = require("d3");

module.exports = class BarChart {

  constructor(element, options) {
    this.element = element;

    this.width = $(element).width();
    this.height = this.width;
    this.margin = _.get(options, "margin", {top: 20, right: 15, bottom: 30, left: 25});

    this.numBars = _.get(options, "numBars", 28);
    this.useColor = _.get(options, "useColor", false);

    this.ylims = _.get(options, "ylims", [-6, 6])
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

  changeSalencyType(salencyType) {
    if (this.useColor) {
      this.colorData = this.fullSampleData[`grad_hx_${salencyType}_loadings`];
      this._createColorScale();
    }
  }

  changeStep(step) {
    var colors;
    if (this.useColor) {
      const curentColorData = this.colorData[step].slice(0, this.numBars);
      colors = d3.map(curentColorData, this.colorScale);
    } else {
      colors = Array(this.numBars).fill(["black"]);
    }
    const currentData = d3.zip(this.fullSampleData.hx_loadings[step], colors)

    this.svg.selectAll("rect")
      .data(currentData)
      .transition(10)
        .attr("y", (d) => (d[0]>0) ? this.y(d[0]) : this.y(0))
        .attr("height", d => Math.abs(this.y(0) - this.y(d[0])))
        .attr("fill", d => d[1])
  }

  changeSample(sampleData) {
    this.clear();

    this.fullSampleData = sampleData;
    this.data = this.fullSampleData.hx_loadings[0].slice(0, this.numBars)
    this.draw();
  }

  clear() {
    $(this.element).empty();
  }


  _2dTruncatedExtent(data_array) {
    const minVal = d3.min(data_array, d => d3.min(d.slice(0, this.numBars)));
    const maxVal = d3.max(data_array, d => d3.max(d.slice(0, this.numBars)));
    return [minVal, maxVal]
  }

  _createColorScale() {
    const extent = this._2dTruncatedExtent(this.colorData);
    maxExtent = Math.max(Math.abs(extent[0]), Math.abs(extent[1]))
    this.colorScale = d3.scaleDiverging([-maxExtent, 0, maxExtent], d3.interpolateRdBu);
  }

  _createScales() {
    m = this.margin

    this.x = d3.scaleBand()
      .domain(d3.range(this.numBars))
      .range([m.left, this.width - m.right])
      .padding(0.1);

    const yDomain = (this.ylims === null) ? 
      this._2dTruncatedExtent(this.fullSampleData.hx_loadings) :
      this.ylims

    this.y = d3.scaleLinear()
      .domain(yDomain).nice()
      .range([this.height - m.bottom, m.top]);
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
