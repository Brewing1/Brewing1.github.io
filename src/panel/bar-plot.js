// Adapted from:
//  - https://elliotbentley.com/blog/a-better-way-to-structure-d3-code/

const d3 = require("d3");

module.exports = class BarChart {

  constructor(element, options) {
    this.element = element;

    this.width = $(element).width();
    this.height = this.width;
    this.margin = _.get(options, "margin", {top: 20, right: 15, bottom: 30, left: 25});

    this.numBars = _.get(options, "numBars", 16);
    this.useColor = _.get(options, "useColor", false);

    this.ylims = _.get(options, "ylims", [-6, 6])

    this.draw();
  }


  draw() {
    this.svg = d3.select(this.element)
      .append('svg')
      .attr("width", this.width)
      .attr("height", this.height);

    this._createScales();
    this._drawAxes();
  }

  changeSaliencyType(saliencyType) {
    this.saliencyType = saliencyType
    this._updateColorData();
  }

  changeStep(step) {
    var colors;
    if (this.useColor && this.hasOwnProperty('colorData')) {
      const curentColorData = this.colorData[step].slice(0, this.numBars);
      colors = d3.map(curentColorData, this.colorScale);
    } else {
      colors = Array(this.numBars).fill(["black"]);
    }
    const currentData = d3.zip(this.fullSampleData.hx_loadings[step], colors)

    // Top and bottom pixel locations for y-axis
    const [bottomY, topY] = this.y.range();

    this.svg.selectAll(".bar")
      .data(currentData)
      .transition(10)
        .attr("y", d => d[0] > 0 ? Math.max(this.y(d[0]), topY) : this.y(0))
        .attr("height", d => {
          return Math.min(
            Math.abs(this.y(0) - this.y(d[0])),
            Math.abs(this.y(0) - topY)
          );
        })
        .attr("fill", d => d[1])

    this.svg.selectAll(".bar-text")
      .data(currentData)
      .transition(10)
      .text(d => {
        return d[0] < this.y.domain()[0] || d[0] > this.y.domain()[1]
        ? Math.round(d[0] * 10) / 10
        : ""
      })
      .attr("y", d => {
        return d[0] > 0
        ? Math.max(this.y(d[0]), topY) + 15
        : Math.min(this.y(d[0]), bottomY) - 15
      });
  }

  changeSample(sampleData) {
    this.clearBars();

    this.fullSampleData = sampleData;
    this.data = this.fullSampleData.hx_loadings[0].slice(0, this.numBars)

    this._updateColorData();
    this._drawBarTemplates();
  }

  clearBars() {
    // Find and remove all g elements that contain rect elements (these are the bars)
    $(this.element).find("g").filter(function() {
      return $(this).children("rect").length > 0;
    }).remove();
  }

  _updateColorData() {
    // this can be called before the saliency type has been set
    // if so it will be called again, so we do nothing.
    if (this.useColor && this.hasOwnProperty('saliencyType')) {
      this.colorData = this.fullSampleData[`grad_hx_${this.saliencyType}_loadings`];
      this._createColorScale();
    }
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
    this.x = d3.scaleBand()
      .domain(d3.range(this.numBars))
      .range([this.margin.left, this.width - this.margin.right])
      .padding(0.1);

    const yDomain = (this.ylims === null) ? 
      this._2dTruncatedExtent(this.fullSampleData.hx_loadings) :
      this.ylims

    this.y = d3.scaleLinear()
      .domain(yDomain).nice()
      .range([this.height - this.margin.bottom, this.margin.top])
      .clamp(true);
  }

  _drawAxes() {
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

  _drawBarTemplates() {
    // Create templates for the bars in the barplot. The actual bars are created in the changeStep
    // method (which we assume will always get called after the changeSample method) by setting
    // the "y" and "height" attributes of the rects
    let bars = this.svg.selectAll(".bar")
        .data(this.data)
        .enter()
        .append("g");

    bars.append("rect")
      .attr("class", "bar")
      .attr("x", (d, i) => this.x(i))
      .attr("y", this.y(0)) // default position for nice transitions
      .attr("width", this.x.bandwidth());

    // We wish to label a bar with its value if it is larger than our specified axes. We setup the
    // template for this text and then set the text and y attribute are set in changeStep
    bars.append("text")
      .attr("class", "bar-text")
      .attr("x", (d, i) => this.x(i) + this.x.bandwidth() / 2)
      .attr("y", this.y(0)) // default position for nice transitions
      .attr("font-family" , "sans-serif")
      .attr("font-size" , "10px")
      .attr("fill" , "black")
      .attr("text-anchor", "middle");
  }
}
