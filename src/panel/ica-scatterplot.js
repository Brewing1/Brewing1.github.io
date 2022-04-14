// Adapted from:
//  - https://elliotbentley.com/blog/a-better-way-to-structure-d3-code/

const { minIndex } = require("d3");
const d3 = require("d3");
_ = require('lodash');

module.exports = class ICAScatterplot {

  constructor(element, baseData, options) {
    this.element = element

    this.width = $(element).width();
    this.height = this.width;
    this.margin = _.get(options, "margin", {top: 20, right: 15, bottom: 30, left: 30});

    this.numBasePoints = _.get(options, "numBasePoints", 1000);
    this.baseData = baseData.slice(0, this.numBasePoints);

    this.basePointSize = _.get(options, "basePointSize", 1);
    this.basePointOpacity = _.get(options, "basePointOpacity", .2);
    this.samplePointSize = _.get(options, "samplePointSize", 3);

    this.dimX = _.get(options, "dimX", 0);
    this.dimY = _.get(options, "dimY", 1);

    this.sampleData = [];

    this.draw();
  }


  draw() {    
    this.svg = d3.select(this.element)
      .append('svg')
      .attr("width", this.width)
      .attr("height", this.height);

    this._createScales();
    this._drawAxes();
    this._drawBase();
  }


  clear() {
    $(this.element).empty();
  }


  changeSample(sampleData) {
    this.sampleLoadings = sampleData.hx_loadings;
    this._drawSample();
  }


  changeDims(xDim, yDim) {
    this.dimX = xDim;
    this.dimY = yDim;
    this.clear();
    this.draw();
    this._drawSample();
  }


  changeStep(step) {
    // Move the highlighted circle over the correct datapoint. If the datapoint is out of the
    // axes, reduce its size and change its colour
    const clamped = this._sampleClamped(this.sampleLoadings[step])
    this.highlightPoint
      .attr("fill", clamped ? "#225555" : "#44BB99")
      .attr("r", clamped ? this.samplePointSize * 4 / 5 : this.samplePointSize)
      .attr("cx", this.x(this.sampleLoadings[step][this.dimX]))
      .attr("cy", this.y(this.sampleLoadings[step][this.dimY]));
  }


  _createScales() {

    this.dimExtents = dim => {
      // just on base, for now
      return d3.extent(this.baseData, d => d[dim])
    }

    this.x = d3.scaleLinear()
      .domain(this.dimExtents(this.dimX)).nice()
      .range([this.margin.left, this.width - this.margin.right])
      .clamp(true)
    
    this.y = d3.scaleLinear()
      .domain(this.dimExtents(this.dimY)).nice()
      .range([this.height - this.margin.bottom, this.margin.top])
      .clamp(true)
  }


  _drawAxes() {
    const xAxis = g => g
      .attr("transform", `translate(0,${this.height - this.margin.bottom})`)
      .call(d3.axisBottom(this.x).ticks(this.width / 80))
      .call(g => g.append("text")
        .attr("x", this.width)
        .attr("y", this.margin.bottom - 4)
        .attr("fill", "black")
        .attr("text-anchor", "end")
        .text(`dimension ${this.dimX}`))
    
    const yAxis = g => g
      .attr("transform", `translate(${this.margin.left},0)`)
      .call(d3.axisLeft(this.y))
      .call(g => g.append("text")
        .attr("x", - this.margin.left)
        .attr("y", 10)
        .attr("fill", "black")
        .attr("text-anchor", "start")
        .text(`dimension ${this.dimY}`))

    this.svg.append("g")
        .call(xAxis);

    this.svg.append("g")
        .call(yAxis);
  }


  _drawBase() {
    this.svg.append("g")
    .selectAll("circle")
    .data(this.baseData)
    .join("circle")
      .attr("cx", d => this.x(d[this.dimX]))
      .attr("cy", d => this.y(d[this.dimY]))
      .attr("fill", "black")
      .attr("fill-opacity", this.basePointOpacity)
      .attr("r", this.basePointSize);
  }


  _drawSample() {
    if (typeof this.sampleGroup !== 'undefined') {
      this.sampleGroup.remove();
    }

    this.sampleGroup = this.svg.append("g")
      .attr("class", "sample-group");

    const line = d3.line()
      .x(d => this.x(d[this.dimX]))
      .y(d => this.y(d[this.dimY]));


    this.sampleGroup
      .append("path")
      .datum(this.sampleLoadings)
      .attr("fill", "none")
      .attr("stroke", "#44BB99")
      .attr("stroke-width", 1.5)
      .attr("d", line);

    this.sampleGroup
      .selectAll("circle")
      .data(this.sampleLoadings)
      .join("circle")
        .attr("class", "sample-point")
        .attr("cx", d => this.x(d[this.dimX]))
        .attr("cy", d => this.y(d[this.dimY]))
        .attr("stroke", d => this._sampleClamped(d) ? null : "#44BB99")
        .attr("fill", d => this._sampleClamped(d) ? "grey" : "white")
        .attr("r", d => this._sampleClamped(d) ? this.samplePointSize * 4 / 5 : this.samplePointSize);

    // Position of this highlighted point is set in this.changeStep
    this.highlightPoint = this.sampleGroup
      .append("circle");
  }

  _sampleClamped(d) {
    const [minX, maxX] = this.x.domain();
    const [minY, maxY] = this.y.domain();
    return (
      d[this.dimX] < minX
      || d[this.dimX] > maxX
      || d[this.dimY] < minY
      || d[this.dimY] > maxY
    );
  }

}