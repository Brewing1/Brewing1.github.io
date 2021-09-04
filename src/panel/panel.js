const d3 = require("d3");
$ = require('jquery');
_ = require('lodash');

const panelTemplate = require("./panel_template.hbs");

const BarChart = require('./BarPlot.js');
const PCAScatterplot = require('./PCAScatterplot.js');

const panelData = require("../../static/data/panel_data.json");

module.exports = class Panel {

  constructor(element, id, options={}) {
    /**
     * element: the html element
     * 
     * ----
     * 
     * Options is is a dictionary that parameterizes the Panel, with the
     * following arguments (more to be implimented)
     * 
     * // Panels
     * 
     * displayObs: boolean
     * displaySalency: boolean, also determines if color is added to the
     *  bar chart
     * displayScatterPlot: boolean
     * displayBarChart: boolean
     * 
     * 
     * sampleNames: an array of strings, corresponding to the names of the
     *  samples to be used in panel-data.js
     * 
     * 
     * 
     * useSalency: boolean, on if to plot salencyData. This determines the
     *  precence of the salency-coded observation image, and salency colors
     *  on the bar chart
     * salencySelect: boolean, if a selector for salency is given
     * defaultSalency: string, must be provided if useSalency is true but
     *  not salencySelect. Can also be provided as the initial setting for
     *  the salencySelector.
     * 
     * 
     * scatterPlotOptions: dictionary to parameterize the scatterplot
     * 
     * 
     */

    this.element = element;
    this.id = id;

    // panels to use
    this.displayObs         = _.get(options, "displayObs",         true);
    this.displaySalency     = _.get(options, "displaySalency",     true);
    this.displayScatterPlot = _.get(options, "displayScatterPlot", true);
    this.displayBarChart    = _.get(options, "displayBarChart",    true);

    this.sampleNames = _.get(options, "sampleNames", Object.keys(panelData.samples));

    this.defaultXDim = _.get(options, "defaultXDim", 0);
    this.defaultYDim = _.get(options, "defaultYDim", 1);

    this._initialize(options)
  }


  changeSample(sampleName) {
    console.assert(this.sampleNames.includes(sampleName));

    this.currentSample = sampleName;
    this.sampleData = panelData.samples[sampleName]
    this.maxStep = this.sampleData.hx_loadings.length - 1;

    if (this.displayBarChart) {
      this.barChart.changeSample(this.sampleData);
    }
    if (this.displayScatterPlot) {
      this.scatterPlot.changeSample(this.sampleData);
    }
  }

  _initialize(options) {
    this._initialize_html(options);
    this._initialize_graphs(options);

    this.changeSample(this.sampleNames[0])
    this.step = 0;
    if (this.displaySalency) {
      this.changeSalencyType(this.salencyType)
    }
    this.changeStep(0);
    this._intialize_controls();
  }

  changeSalencyType(salencyType) {
    console.assert(salencyType !== undefined)

    this.salencyType = salencyType;
    if (this.displayBarChart) {
      this.barChart.changeSalencyType(this.salencyType);
      this.barChart.changeStep(this.step); // recolour
    }
    this.select("sal-image")
      .attr("src", `../data/${this.currentSample}/sal_${this.salencyType}/${this.step}.png`);
  }

  changeStep(newStep) {
    this.step = newStep;
    console.log(`changing step to ${this.step}`)
    
    if(this.displayObs) {
      this.select("obs-image")
        .attr("src", `../data/${this.currentSample}/obs/${this.step}.png`);
    }
    if(this.displaySalency) {
      this.select("sal-image")
        .attr("src", `../data/${this.currentSample}/sal_${this.salencyType}/${this.step}.png`);
    }

    this.select("step-counter")
      .text("Step " + this.step + " of " + this.maxStep);

    this.barChart.changeStep(this.step);
    this.scatterPlot.changeStep(this.step);
  }
 
  changeDims() {
    const xDim = this.select("x-dim-select").val();
    const yDim = this.select("y-dim-select").val();
    this.scatterPlot.changeDims(xDim, yDim);
  }

  select(id) {
    return $(`#${this.id}-${id}`)
  }

  _initialize_html(options) {
    
    var panelData = []
    if (this.displayObs) {
      panelData.push({
        title: "Agent Observations:",
        panelId: "obs",
        hasImg: true
      })
    }
    if (this.displaySalency) {
      panelData.push({
        title: "Salency Map:",
        panelId: "sal",
        hasImg: true
      })
    }     
    if (this.displayScatterPlot) {
      panelData.push({
        title: "PCA Scatterplot:",
        panelId: "scatterPlot",
        hasImg: false
      })
    }     
    if (this.displayBarChart) {
      panelData.push({
        title: "PCA Bar Chart:",
        panelId: "barChart",
        hasImg: false
      })
    }

    const panelLayout = _.get(options, "panelLayout", `panel-grid-1-${panelData.length}`);
    console.log(`using layout ${panelLayout}`);

    var salencySelect = null;
    var salencyTypes = null;
    if ( this.displaySalency ) {
      console.assert("salencyTypes" in options);
      salencyTypes = options.salencyTypes
      if ( _.isArray(salencyTypes)) {
        salencySelect = true;
        this.salencyType = salencyTypes[0];
      } else {
        console.assert(_.isString(salencyTypes))
        salencySelect = false;
        this.salencyType = salencyTypes;
      }
    }

    panelHtml = panelTemplate({
      id: this.id,
      
      sampleSelect: (this.sampleNames.length > 1),
      sampleNames: this.sampleNames,

      panels: panelData,
      panelLayout: panelLayout,

      salencySelect: salencySelect,
      salencyTypes: salencyTypes,

      dimSelect: true,
      pcaDims: _.range(28),
      defaultXDim: 0,
      defaultYDim: 1,
    });

    $(this.element).html(panelHtml);
  }

  _initialize_graphs(options) {
    if (this.displayScatterPlot) {
      this.scatterPlot = new PCAScatterplot(
        this.select("scatterPlot-content").get(0),
        panelData.base_hx_loadings,
         _.get(options, "scatterPlotOptions", {}));
    }

    if (this.displayBarChart) {
      this.barChart = new BarChart(
        this.select("barChart-content").get(0),
        _.get(options, "barChartOptions", {}));
    }
  }

  _back_one_step() {
    this.changeStep(Math.max(0, this.step - 1));
  }

  _forward_one_step() {
    this.changeStep(Math.min(this.maxStep, this.step + 1));
  }

  _forward_all_steps() {
    this.changeStep(this.maxStep);
  }

  _intialize_controls(options) {
    const self = this;

    this.select("back_all_btn").click(function() {
      self.changeStep(0);
      this.blur();
    });

    this.select("back_one_btn").click(function() {
      self._back_one_step();
      this.blur();
    });

    this.select("forward_one_btn").click(function() {
      self._forward_one_step();
      this.blur();
    });

    //todo 
    this.select("forward_all_btn").click(this._forward_all_steps.bind(this));

    this.select("sample-select").on('change', function() {
      self.changeSample(this.value);
      self.changeStep(0);
      this.blur();
    });

    const changeDimsFn = this.changeDims.bind(this);
    this.select("x-dim-select").on('change', function() {
      self.changeDims();
      this.blur();
    });
    this.select("y-dim-select").on('change', function() {
      self.changeDims();
      this.blur();
    });
    this.select("x-dim-select").val(this.defaultXDim);
    this.select("y-dim-select").val(this.defaultYDim);

    this.select("salency-controls")
        .find('input[type=radio][name=salency_type]')
        .val([this.salencyType])
        .change(function() {
          self.changeSalencyType(this.value);
          this.blur();
        });
  }

  keydown(e) {
    switch (e.keyCode) {
      case 37:
        this._back_one_step();
        break;
      case 38:
        $("#sample-select > option:selected")
          .prop("selected", false)
          .next()
          .prop("selected", true);
        changeSample($("#sample-select").val());
        break;
      case 39:
        this._forward_one_step();
        break;
      case 40:
        $("#sample-select > option:selected")
          .prop("selected", false)
          .prev()
          .prop("selected", true);
        changeSample($("#sample-select").val());
        break;
    }
  }
}

