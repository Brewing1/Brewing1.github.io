const d3 = require("d3");
$ = require('jquery');
_ = require('lodash');

const panelTemplate = require("./panel_template.hbs");

const BarChart = require('./BarPlot.js');
const PCAScatterplot = require('./PCAScatterplot.js');

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

    console.log(options)
    // panels to use
    this.displayObs         = _.get(options, "displayObs",         true);
    this.displaySalency     = _.get(options, "displaySalency",     true);
    this.displayScatterPlot = _.get(options, "displayScatterPlot", true);
    this.displayBarChart    = _.get(options, "displayBarChart",    true);

    this.dataLocation = _.get(options, "dataLocation", "data")
    this.panelData = require(`../../static/${this.dataLocation}/panel_data.json`)
    console.log("data from " + this.dataLocation, this.panelData)
    this.sampleNames = _.get(options, "sampleNames", Object.keys(this.panelData.samples));

    this.defaultXDim = _.get(options, "defaultXDim", 0);
    this.defaultYDim = _.get(options, "defaultYDim", 1);

    this._initialize(options)
  }


  changeSample(sampleName) {
    console.assert(this.sampleNames.includes(sampleName));

    this.currentSample = sampleName;
    this.sampleData = this.panelData.samples[sampleName]
    this.maxStep = this.sampleData.hx_loadings.length - 1;

    if (this.displayBarChart) {
      this.barChart.changeSample(this.sampleData);
    }
    if (this.displayScatterPlot) {
      this.scatterPlot.changeSample(this.sampleData);
    }
  }

  _initialize(options) {
    this._initializeHtml(options);
    this._initializeGraphs(options);

    this.changeSample(this.sampleNames[0])
    this.step = 0;
    if (this.displaySalency) {
      this.changeSalencyType(this.salencyType)
    }
    this.changeStep(0);
    this._intializeControls();
  }

  changeSalencyType(salencyType) {
    console.assert(salencyType !== undefined)

    this.salencyType = salencyType;
    if (this.displayBarChart) {
      this.barChart.changeSalencyType(this.salencyType);
      this.barChart.changeStep(this.step); // recolour
    }
    this.select("sal-image")
      .attr("src", `../${this.dataLocation}/${this.currentSample}/sal_${this.salencyType}/${this.step}.png`);
  }

  changeStep(newStep) {
    this.step = newStep;
    console.log(`changing step to ${this.step}`)
    
    if(this.displayObs) {
      this.select("obs-image")
        .attr("src", `../${this.dataLocation}/${this.currentSample}/obs/${this.step}.png`);
    }
    if(this.displaySalency) {
      this.select("sal-image")
        .attr("src", `../${this.dataLocation}/${this.currentSample}/sal_${this.salencyType}/${this.step}.png`);
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

  _initializeHtml(options) {
    
    var panelLayoutData = []
    if (this.displayObs) {
      panelLayoutData.push({
        title: "Agent Observations:",
        panelId: "obs",
        hasImg: true
      })
    }
    if (this.displaySalency) {
      panelLayoutData.push({
        title: "Salency Map:",
        panelId: "sal",
        hasImg: true
      })
    }     
    if (this.displayScatterPlot) {
      panelLayoutData.push({
        title: "PCA Scatterplot:",
        panelId: "scatterPlot",
        hasImg: false
      })
    }     
    if (this.displayBarChart) {
      panelLayoutData.push({
        title: "PCA Bar Chart:",
        panelId: "barChart",
        hasImg: false
      })
    }

    const panelLayout = _.get(options, "panelLayout", `panel-grid-1-${panelLayoutData.length}`);
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

      panels: panelLayoutData,
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

  _initializeGraphs(options) {
    if (this.displayScatterPlot) {
      this.scatterPlot = new PCAScatterplot(
        this.select("scatterPlot-content").get(0),
        this.panelData.base_hx_loadings,
         _.get(options, "scatterPlotOptions", {}));
    }

    if (this.displayBarChart) {
      this.barChart = new BarChart(
        this.select("barChart-content").get(0),
        _.get(options, "barChartOptions", {}));
    }
  }

  _backOneStep() {
    this.changeStep(Math.max(0, this.step - 1));
  }

  _forwardOneStep() {
    this.changeStep(Math.min(this.maxStep, this.step + 1));
  }

  _playStep(restart = false) {
    const nextStep = (this.step + 1) % (this.maxStep + 1);
    this.changeStep(nextStep);
    // if at end of sample, pause for a second
    if (this.step === this.maxStep) {
      this._pause(changeSymbol=false);
      setTimeout(this._play.bind(this), 1000);
    }
  }

  _play() {
    if (!this.playing) {
      console.log("playing!");
      this.select("play_pause_btn").text("pause_circle");
      clearInterval(this.playingIntervalId);
      this.playingIntervalId = setInterval(this._playStep.bind(this), 250);
      this.playing = true;
    }
  }

  _pause(changeSymbol=true) {
    if (this.playing) {
      console.log("paused!");
      if (changeSymbol) {
        this.select("play_pause_btn").text("play_circle");
      }
      clearInterval(this.playingIntervalId);
      this.playing = false;
    }
  }

  _intializeControls(options) {
    const self = this;

    this.select("back_all_btn").click(function() {
      self.changeStep(0);
      this.blur();
    });

    this.select("back_one_btn").click(function() {
      self._backOneStep();
      this.blur();
    });

    this.select("forward_one_btn").click(function() {
      self._forwardOneStep();
      this.blur();
    });

    //todo 
    this.select("forward_all_btn").click(function() {
      self.changeStep(self.maxStep);
      this.blur();
    });

    this.playing = false;
    this.select("play_pause_btn").click(function() {
      if (!self.playing) {
        self._play();
      } else {
        self._pause();      
      }
      this.blur();
    });

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
        this._backOneStep();
        break;
      case 38:
        $("#sample-select > option:selected")
          .prop("selected", false)
          .next()
          .prop("selected", true);
        changeSample($("#sample-select").val());
        break;
      case 39:
        this._forwardOneStep();
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

