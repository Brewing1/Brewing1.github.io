const d3 = require("d3");
$ = require('jquery');
_ = require('lodash');

const panelTemplate = require("./panel-template.hbs");

const BarChart = require('./bar-plot.js');
const ICAScatterplot = require('./ica-scatterplot.js');

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
     * displaySaliency: boolean, also determines if color is added to the
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
     * useSaliency: boolean, on if to plot saliencyData. This determines the
     *  precence of the saliency-coded observation image, and saliency colors
     *  on the bar chart
     * saliencySelect: boolean, if a selector for saliency is given
     * defaultSaliency: string, must be provided if useSaliency is true but
     *  not saliencySelect. Can also be provided as the initial setting for
     *  the saliencySelector.
     * 
     * 
     * scatterPlotOptions: dictionary to parameterize the scatterplot
     * 
     * 
     */

    this.element = element;
    this.id = id;

    console.log(options);
    // panels to use
    this.displayObs         = _.get(options, "displayObs",         true);
    this.displaySaliency     = _.get(options, "displaySaliency",     true);
    this.displayScatterPlot = _.get(options, "displayScatterPlot", true);
    this.displayBarChart    = _.get(options, "displayBarChart",    true);

    this.dataLocation = _.get(options, "dataLocation", "data");
    this.panelData = require(`../../static/${this.dataLocation}/panel_data.json`);
    console.log("data from " + this.dataLocation, this.panelData);
    this.sampleNames = _.get(options, "sampleNames", Object.keys(this.panelData.samples));

    this.defaultXDim = _.get(options, "defaultXDim", 0);
    this.defaultYDim = _.get(options, "defaultYDim", 1);

    this.defaultStep = _.get(options, "defaultStep", 4);

    // Maps action numbers to thick arrows https://www.htmlsymbols.xyz/arrow-symbols
    this.arrowMap = {
      0: "\u2B0B", 1: "\u2B05", 2: "\u2B09",
      3: "\u2B07", 4: "\u2205", 5: "\u2B06",
      6: "\u2B0A", 7: "\u27A1", 8: "\u2B08",
      9: "\u2205", 10: "\u2205", 11: "\u2205",
      12: "\u2205", 13: "\u2205", 14: "\u2205"
    };

    this._initialize(options);
  }


  changeSample(sampleName) {
    console.assert(this.sampleNames.includes(sampleName));

    this.currentSample = sampleName;
    this.sampleData = this.panelData.samples[sampleName];
    this.maxStep = this.sampleData.hx_loadings.length - 1;

    if (this.displayObs) {
      this.select("obs-image")
        .attr("src", `../${this.dataLocation}/${this.currentSample}/obs.png`);
    }
    if (this.displaySaliency) {
      this.select("sal-image")
        .attr("src", `../${this.dataLocation}/${this.currentSample}/sal_${this.saliencyType}.png`);
    }
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

    this.changeSample(this.sampleNames[0]);
    // Initialise the starting step for all panels
    this.changeStep(this.defaultStep);

    if (this.displaySaliency) {
      this.changeSaliencyType(this.saliencyType);
    }
    this._intializeControls();
  }

  changeSaliencyType(saliencyType) {
    console.assert(saliencyType !== undefined);

    this.saliencyType = saliencyType;
    if (this.displayBarChart) {
      this.barChart.changeSaliencyType(this.saliencyType);
      this.barChart.changeStep(this.step); // recolour
    }
    this.select("sal-image")
      .attr("src", `../${this.dataLocation}/${this.currentSample}/sal_${this.saliencyType}.png`);
  }

  changeStep(newStep) {
    this.step = newStep;
    console.log(`changing step to ${this.step}`)

    // Shift the images left/right according to this.step
    $(`.subpanel-image img`).css("left", `${this.step*-100}%`)

    this.select("step-counter")
      .text("Step " + this.step + " of " + this.maxStep);

    this.select("action-direction")
      .text("Agent action: " + this.arrowMap[this.sampleData.actions[this.step]]);

    this.select("saliency-step")
      .text("Saliency step: " + this.sampleData.saliency_step);

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
    if (this.displaySaliency) {
      panelLayoutData.push({
        title: "Saliency Map:",
        panelId: "sal",
        hasImg: true
      })
    }     
    if (this.displayScatterPlot) {
      panelLayoutData.push({
        title: "ICA Scatterplot:",
        panelId: "scatterPlot",
        hasImg: false
      })
    }     
    if (this.displayBarChart) {
      panelLayoutData.push({
        title: "ICA Bar Chart:",
        panelId: "barChart",
        hasImg: false
      })
    }

    const panelLayout = _.get(options, "panelLayout", `panel-grid-1-${panelLayoutData.length}`);
    console.log(`using layout ${panelLayout}`);

    var saliencySelect = null;
    var saliencyTypes = null;
    // Whether to use a dropdown or radio buttons
    this.saliencyDropdown = false;

    if ( this.displaySaliency ) {
      console.assert("saliencyTypes" in options);
      saliencyTypes = options.saliencyTypes
      if ( _.isArray(saliencyTypes)) {
        saliencySelect = true;
        this.saliencyType = saliencyTypes[0];
        this.saliencyDropdown = saliencyTypes.length > 2
      } else {
        console.assert(_.isString(saliencyTypes))
        saliencySelect = false;
        this.saliencyType = saliencyTypes;
      }
    }

    panelHtml = panelTemplate({
      id: this.id,
      
      sampleSelect: (this.sampleNames.length > 1),
      sampleNames: this.sampleNames,

      panels: panelLayoutData,
      panelLayout: panelLayout,

      saliencySelect: saliencySelect,
      saliencyTypes: saliencyTypes,
      saliencyDropdown: this.saliencyDropdown,

      dimSelect: true,
      icaDims: _.range(16),
      defaultXDim: this.defaultXDim,
      defaultYDim: this.defaultXDim,
    });

    $(this.element).html(panelHtml);
  }

  _initializeGraphs(options) {
    if (this.displayScatterPlot) {
      this.scatterPlot = new ICAScatterplot(
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
      self.changeStep(self.defaultStep);
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

    // Select element based on whether it is a dropdown or radio input
    var saliencyElement = this.saliencyDropdown
                         ? this.select("saliency-select")
                         : this.select("saliency-controls").find('input[type=radio]')
    // Set the default saliencyType in the radio button or checkbox
    saliencyElement.val([this.saliencyType]);
    saliencyElement.on('change', function() {
      self.changeSaliencyType(this.value);
      this.blur();
    });
  }

  keydown(e) {
    switch (e.keyCode) {
      case 37:
        this._backOneStep();
        break;
      case 38:
        this.select("sample-select > option:selected")
          .prop("selected", false)
          .next()
          .prop("selected", true);
        this.changeSample(this.select("sample-select").val());
        this.changeStep(this.defaultStep);
        break;
      case 39:
        this._forwardOneStep();
        break;
      case 40:
        this.select("sample-select > option:selected")
          .prop("selected", false)
          .prev()
          .prop("selected", true);
        this.changeSample(this.select("sample-select").val());
        this.changeStep(this.defaultStep);
        break;
    }
  }
}

