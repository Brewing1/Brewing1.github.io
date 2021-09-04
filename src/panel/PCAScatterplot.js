// Adapted from:
//  - https://elliotbentley.com/blog/a-better-way-to-structure-d3-code/

const d3 = require("d3");
_ = require('lodash');

module.exports = class PCAScatterplot {

  constructor(element, baseData, options) {
    this.element = element

    this.width = $(element).width();
    this.height = this.width;
    this.margin = _.get(options, "margin", {top: 20, right: 15, bottom: 30, left: 25});

    this.numBasePoints = _.get(options, "numBasePoints", 1000);
    this.baseData = baseData.slice(0, this.numBasePoints);

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
    console.log("scatterplot changing sample to ", sampleData)
    this._drawSample();
    this.changeStep(0);
  }


  changeDims(xDim, yDim) {
    this.dimX = xDim;
    this.dimY = yDim;
    this.clear();
    this.draw();
    this._drawSample();
    console.log(`pca plot re-drawn for new axes ${xDim} and ${yDim}`)
  }


  changeStep(step) {
    this.svg.selectAll(".sample-point")
      .attr("fill", (d, i) => (i == step) ? "red" : "blue");
  }


  _createScales() {

    var dimExtents = dim => {
      // just on base, for now
      return d3.extent(this.baseData, d => d[dim])

      const baseExtents = d3.extent(this.baseData, d => d[dim]);
      const sampleExtents = d3.extent(this.sampleData, d => d[dim]);

      return [
        Math.min(baseExtents[0], sampleExtents[0]),
        Math.max(baseExtents[1], sampleExtents[1])
      ]
    }

    m = this.margin

    this.x = d3.scaleLinear()
      .domain(dimExtents(this.dimX)).nice()
      .range([m.left, this.width - m.right])
    
    this.y = d3.scaleLinear()
      .domain(dimExtents(this.dimY)).nice()
      .range([this.height - m.bottom, m.top])
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
      .attr("fill-opacity", .2)
      .attr("r", 1);
  }


  _drawSample() {
    this.svg.selectAll(".sample-group").remove();
    this.svg.append("g")
      .attr("class", "sample-group")
      .selectAll("circle")
      .data(this.sampleLoadings)
      .join("circle")
        .attr("class", "sample-point")
        .attr("cx", d => this.x(d[this.dimX]))
        .attr("cy", d => this.y(d[this.dimY]))
        .attr("fill", "blue")
        .attr("r", 3);
  }

}
