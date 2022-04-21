const d3 = require("d3");
$ = require('jquery');
get = require('lodash/get');

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
    this.displayObs         = get(options, "displayObs",         true);
    this.displaySaliency    = get(options, "displaySaliency",    true);
    this.displayFilters     = get(options, "displayFilters",     false);
    this.displayScatterPlot = get(options, "displayScatterPlot", true);
    this.displayBarChart    = get(options, "displayBarChart",    true);

    this.dataLocation = get(options, "dataLocation", "data");
    this.panelData = require(`../../static/${this.dataLocation}/panel_data.json`);
    console.log("data from " + this.dataLocation, this.panelData);
    this.defaultSampleNames = get(options, "sampleNames", Object.keys(this.panelData.samples));
    // sampleNames may change due to filtering
    this.sampleNames = this.defaultSampleNames

    this.defaultXDim = get(options, "defaultXDim", 0);
    this.defaultYDim = get(options, "defaultYDim", 1);

    this.defaultStep = get(options, "defaultStep", 4);

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
    // When changing sample, start at the default timestep
    this.changeStep(this.defaultStep);
  }

  _initialize(options) {
    this._initializeHtml(options);
    this._initializeGraphs(options);

    this.changeSample(this.sampleNames[0]);

    // Initialise filtering
    this.changeFilterDim(this.defaultXDim);

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
    this.scatterPlot.changeStep(this.step);
  }

  hxMinMax(dim) {
    let min = Infinity;
    let max = -Infinity;
    for (let i=0; i < this.defaultSampleNames.length; i++) {
      // Assumes all samples have the same number of steps
      for (let t=0; t <= this.maxStep; t++) {
        const hx = this.panelData.samples[this.defaultSampleNames[i]].hx_loadings[t][dim];
        min = Math.min(min, hx);
        max = Math.max(max, hx);
      }
    }
    return [min, max];
  }

  fillSampleSelect() {
    const selected = this.select("sample-select").val();
    const el = this.select("sample-select");
    el.empty();
    $.each(this.sampleNames, function(i, p) {
      el.append($('<option></option>').val(p).html(p));
    });
    const newSelected = this.select("sample-select").val();
    // Load the selected sample (if indeed it is a new sample)
    if (newSelected != selected) {
      this.changeSample(newSelected);
      this.changeStep(this.defaultStep);
    }
  }

  fillFilterGtLt() {
    this.select("filter-gt").val(this.filterGt.toFixed(1));
    this.select("filter-lt").val(this.filterLt.toFixed(1));
  }

  fillSampleCountText() {
    this.select("filter-sample-count").html(
      `<b>${this.sampleNames.length}/${this.defaultSampleNames.length}</b> samples adhere to this filter`
    );
  }

  changeFilterDim(dim) {
    [this.filterGt, this.filterLt] = this.hxMinMax(dim);
    this.filterDim = dim;
    this.fillFilterGtLt();
    this.sampleNames = this.defaultSampleNames;
    this.fillSampleSelect();
    this.fillSampleCountText();
  }

  changeFilterGtLt() {
    const gt = this.select("filter-gt").val();
    const lt = this.select("filter-lt").val();
    const validSamples = [];
    for (let i=0; i < this.defaultSampleNames.length; i++) {
      // Assumes all samples have the same number of steps
      for (let t=0; t <= this.maxStep; t++) {
        const hx = this.panelData.samples[this.defaultSampleNames[i]].hx_loadings[t][this.filterDim];
        if (hx >= gt && hx <= lt) {
          validSamples.push(this.defaultSampleNames[i]);
          break;
        }
      }
    }
    this.sampleNames = validSamples;
    this.fillSampleSelect();
    this.fillSampleCountText();
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

    const panelLayout = get(options, "panelLayout", `panel-grid-1-${panelLayoutData.length}`);
    console.log(`using layout ${panelLayout}`);

    var saliencySelect = null;
    var saliencyTypes = null;
    // Whether to use a dropdown or radio buttons
    this.saliencyDropdown = false;

    if ( this.displaySaliency ) {
      console.assert("saliencyTypes" in options);
      saliencyTypes = options.saliencyTypes
      if ( Array.isArray(saliencyTypes)) {
        saliencySelect = true;
        this.saliencyType = saliencyTypes[0];
        this.saliencyDropdown = saliencyTypes.length > 2
      } else {
        console.assert(typeof saliencyTypes === 'string' || saliencyTypes instanceof String)
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
      icaDims: [...Array(16).keys()],
      defaultXDim: this.defaultXDim,
      defaultYDim: this.defaultXDim,

      displayFilters: this.displayFilters,
    });

    $(this.element).html(panelHtml);
  }

  _initializeGraphs(options) {
    if (this.displayScatterPlot) {
      this.scatterPlot = new ICAScatterplot(
        this.select("scatterPlot-content").get(0),
        this.panelData.base_hx_loadings,
         get(options, "scatterPlotOptions", {}));
    }

    if (this.displayBarChart) {
      this.barChart = new BarChart(
        this.select("barChart-content").get(0),
        get(options, "barChartOptions", {}));
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

    this.select("filter-dim-select").on('change', function() {
      self.changeFilterDim(this.value);
      this.blur();
    });
    this.select("filter-gt").on('change', function() {
      self.changeFilterGtLt();
      this.blur();
    });
    this.select("filter-lt").on('change', function() {
      self.changeFilterGtLt();
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
        break;
    }
  }
}

