const $ = require('jquery');
const get = require('lodash/get');
const tippy = require('tippy.js').default;

const panelTemplate = require("./panel-template.hbs");

const BarChart = require('./bar-plot.js');
const ICAScatterplot = require('./ica-scatterplot.js');

const tooltipInfo = {
  "obs": `Observation explanation. ASFDASFSFSDF sssss sss ssssss sssssssssssddd dssds
  fsdfsdf sdf sdfdfds sdf sdf;sdkf asdfkl32r089234 232 3233rewe 2 3 r r23r oir23ori3riojr23.`,
  "sal": `Saliency explanation. ASFDASFSFSDF sssss sss ssssss sssssssssssddd dssds
  fsdfsdf sdf sdfdfds sdf sdf;sdkf asdfkl32r089234 232 3233rewe 2 3 r r23r oir23ori3riojr23.`,
  "scatterPlot": `scatterPlot explanation. ASFDASFSFSDF sssss sss ssssss sssssssssssddd dssds
  fsdfsdf sdf sdfdfds sdf sdf;sdkf asdfkl32r089234 232 3233rewe 2 3 r r23r oir23ori3riojr23
  23r 23r r32l23r  3r r3 32 r23r 3r2 32r r  r 23r 23 r2r23rr 3r2 3r2 r3r 32r 23 r 23r 23r.
  2r32r r  rdesfkamfa df  sadf809sdafu098u23  09ur 0 ur0 e0rr0werwe ew.`,
  "barChart": `barChart explanation. ASFDASFSFSDF sssss sss ssssss sssssssssssddd dssds
  fsdfsdf sdf sdfdfds sdf sdf;sdkf asdfkl32r089234 232 3233rewe 2 3 r r23r oir23ori3riojr23
  23r 23r r32l23r  3r r3 32 r23r 3r2 32r r  r 23r 23 r2r23rr 3r2 3r2 r3r 32r 23 r 23r 23r.
  2r32r r  rdesfkamfa df  sadf809sdafu098u23  09ur 0 ur0 e0rr0werwe ew.`,
}


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

    // panels to use
    this.displayObs         = get(options, "displayObs",         true);
    this.displaySaliency    = get(options, "displaySaliency",    true);
    this.displayClusters    = get(options, "displayClusters",    false);
    this.displayFilters     = get(options, "displayFilters",     false);
    this.displayScatterPlot = get(options, "displayScatterPlot", true);
    this.displayBarChart    = get(options, "displayBarChart",    true);

    this.dataLocation = get(options, "dataLocation", "data");
    this.panelData = require(`../../static/${this.dataLocation}/panel_data.json`);
    this.defaultSampleNames = get(options, "sampleNames", Object.keys(this.panelData.samples));
    // sampleNames may change due to filtering
    this.sampleNames = this.defaultSampleNames
    this.timesteps = [...this.panelData.samples[this.defaultSampleNames[0]].actions.keys()];

    this.defaultXDim = get(options, "defaultXDim", 0);
    this.defaultYDim = get(options, "defaultYDim", 1);

    this.defaultStep = get(options, "defaultStep", 4);

    this.cluster = "None";
    this.filters = {"raw": {}, "grad": {}};
    this.filterDim = {"raw": this.defaultXDim, "grad": this.defaultXDim};
    this.filterGt = {"raw": null, "grad": null};
    this.filterLt = {"raw": null, "grad": null};
    this.filterSteps = this.timesteps;

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

  _initialize(options) {
    this._initializeHtml(options);
    this._writeTooltips(options)
    this._initializeGraphs(options);
    this.changeSample(this.sampleNames[0]);

    // Initialise filtering
    this.changeFilterDim("raw", this.defaultXDim);

    if (this.displaySaliency) {
      this.changeFilterDim("grad", this.defaultXDim);
      this.changeSaliencyType(this.saliencyType);
    }
    this._intializeControls();
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

      clusterNames: this.panelData.hasOwnProperty("clusters")
                    ? Object.keys(this.panelData.clusters)
                    : null,

      displayClusters: this.displayClusters,
      displayFilters: this.displayFilters,
      timesteps: this.timesteps,
    });

    $(this.element).html(panelHtml);
  }

  _writeTooltips(options) {
    if (this.displayObs) {
      tippy(this.select("obs-tooltip")[0], {
        content: tooltipInfo["obs"],
      });
    }
    if (this.displaySaliency) {
      tippy(this.select("sal-tooltip")[0], {
        content: tooltipInfo["sal"],
      });
    }
    if (this.displayScatterPlot) {
      tippy(this.select("scatterPlot-tooltip")[0], {
        content: tooltipInfo["scatterPlot"],
      });
    }
    if (this.displayBarChart) {
      tippy(this.select("barChart-tooltip")[0], {
        content: tooltipInfo["barChart"],
      });
    }
  }

  _intializeControls(options) {
    const self = this;

    this.select("back_all_btn").on('click', function() {
      self.changeStep(0);
      this.blur();
    });

    this.select("back_one_btn").on('click', function() {
      self._backOneStep();
      this.blur();
    });

    this.select("forward_one_btn").on('click', function() {
      self._forwardOneStep();
      this.blur();
    });

    this.select("forward_all_btn").on('click', function() {
      self.changeStep(self.maxStep);
      this.blur();
    });

    this.playing = false;
    this.select("play_pause_btn").on('click', function() {
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

    this.select("cluster-select").on('change', function() {
      self.changeCluster(this.value);
      this.blur();
    });
    this.select("filter-raw-dim-select").on('change', function() {
      self.changeFilterDim("raw", this.value);
      this.blur();
    });
    this.select("filter-raw-gt").on('change', function() {
      self.changeFilterGtLt("raw");
      this.blur();
    });
    this.select("filter-raw-lt").on('change', function() {
      self.changeFilterGtLt("raw");
      this.blur();
    });
    this.select("filter-raw-dim-reset-button").on('click', function() {
      self.resetDimFilter("raw");
      this.blur();
    });
    this.select("filter-grad-dim-select").on('change', function() {
      self.changeFilterDim("grad", this.value);
      this.blur();
    });
    this.select("filter-grad-gt").on('change', function() {
      self.changeFilterGtLt("grad");
      this.blur();
    });
    this.select("filter-grad-lt").on('change', function() {
      self.changeFilterGtLt("grad");
      this.blur();
    });
    this.select("filter-grad-dim-reset-button").on('click', function() {
      self.resetDimFilter("grad");
      this.blur();
    });
    this.select("filter-reset-button").on('click', function() {
      self.resetAllFilters();
      this.blur();
    });
    this.select("filter-step-select").on('change', function() {
      self.changeFilterStep(this.value);
      this.blur();
    });
  }

  writeSampleSelect(el){
    el.empty();
    $.each(this.sampleNames, function(i, p) {
      el.append($('<option></option>').val(p).html(p));
    });
  }

  writeFilterGtLt(filterType, gt, lt) {
    const decimals = filterType == "grad" ? 3 : 2
    this.select(`filter-${filterType}-gt`).val(gt.toFixed(decimals));
    this.select(`filter-${filterType}-lt`).val(lt.toFixed(decimals));
  }

  writeSampleCount() {
    this.select("filter-sample-count").html(
      `<b>${this.sampleNames.length}/${this.defaultSampleNames.length}</b> \
      samples adhere to all filters`
    );
  }

  writeFilterDimButton(filterType, dim) {
    this.select(`filter-${filterType}-dim-reset-button`).text(`Reset ${filterType} IC:${dim} filter`);
  }


  writeFilterDimFont(filterType, dim, large) {
    // Increase or decrease the fontsize and boldness of the current filtered dimension
    const style = large
                ? {"font-size": "150%", "font-weight": "bold"}
                : {"font-size": "100%", "font-weight": "normal"}
    this.select(`filter-${filterType}-dim-select`)
        .children("option")
        .eq(dim)
        .css(style);
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

  changeSaliencyType(saliencyType) {
    console.assert(saliencyType !== undefined);

    this.saliencyType = saliencyType;
    if (this.displayBarChart) {
      this.barChart.changeSaliencyType(this.saliencyType);
      this.barChart.changeStep(this.step); // recolour
    }
    this.select("sal-image")
      .attr("src", `../${this.dataLocation}/${this.currentSample}/sal_${this.saliencyType}.png`);

    this.resetGradFilters();
  }

  changeStep(newStep) {
    this.step = newStep;

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

  changeSampleSelect() {
    const selected = this.select("sample-select").val();
    const el = this.select("sample-select");
    this.writeSampleSelect(el);
    const newSelected = this.select("sample-select").val();
    // Load the selected sample (if indeed it is a new sample)
    if (newSelected != selected && newSelected !== null) {
      this.changeSample(newSelected);
      this.changeStep(this.defaultStep);
    }
  }

  changeDims() {
    const xDim = this.select("x-dim-select").val();
    const yDim = this.select("y-dim-select").val();
    this.scatterPlot.changeDims(xDim, yDim);
    this.scatterPlot.changeStep(this.step);
  }

  hxMinMax(filterType, dim) {
    // Get the minimum or maximum of the hx for this IC. Can handle raw loadings or gradients.
    const loadings = filterType == "raw" ? "hx_loadings" : `grad_hx_${this.saliencyType}_loadings`
    let min = Infinity;
    let max = -Infinity;
    for (let s=0; s < this.sampleNames.length; s++) {
      for (const t of this.filterSteps) {
        const hx = this.panelData.samples[this.sampleNames[s]][loadings][t][dim];
        min = Math.min(min, hx);
        max = Math.max(max, hx);
      }
    }
    return [min, max];
  }

  clusterSamples() {
    return this.cluster == "None"
      ? this.defaultSampleNames
      : this.panelData.clusters[this.cluster].filter(x => this.defaultSampleNames.includes(x));
  }

  changeFilterDim(filterType, dim) {
    if (this.filters[filterType].hasOwnProperty(dim)) {
      this.filterGt[filterType] = this.filters[filterType][dim]["gt"];
      this.filterLt[filterType] = this.filters[filterType][dim]["lt"];
    } else {
      [this.filterGt[filterType], this.filterLt[filterType]] = this.hxMinMax(filterType, dim);
    }
    this.filterDim[filterType] = dim;
    this.writeFilterGtLt(filterType, this.filterGt[filterType], this.filterLt[filterType]);
    this.writeFilterDimButton(filterType, this.filterDim[filterType]);
  }

  changeCluster(cluster) {
    this.cluster = cluster;
    this.resetAllFilters();
    this.writeSampleCount();
    if (this.sampleNames.length > 0) {
      this.changeSampleSelect();
    }
  }

  changeFilterStep(step) {
    this.filterSteps = step == "All" ? this.timesteps : [step];
    this.resetAllFilters();
    this.writeSampleCount();
    if (this.sampleNames.length > 0) {
      this.changeSampleSelect();
    }
  }

  applyFilter() {
    // Apply hx filter for each IC in this.filters[filterType] (these contain the manually
    // entered filters).
    // A sample passes if filters for each dim apply AT THE SAME TIMESTEP. I.e. a sample will not
    // pass the filter if IC6 fit the filter range for timesteps 3 and 4 but IC7 only fit the
    // filter range for timestep 5
    const numFilters = Object.keys(this.filters["raw"]).length
                     + Object.keys(this.filters["grad"]).length;
    const validSamples = [];
    // First filter by the select cluster
    const samples = this.clusterSamples();
    for (const sample of samples) {
      // Assumes all samples have the same number of steps
      for (const t of this.filterSteps) {
        let dimsValid = 0;
        for (const filterType of ["raw", "grad"]) {
          const loadings = filterType == "raw" ? "hx_loadings" : `grad_hx_${this.saliencyType}_loadings`
          for (const [dim, range] of Object.entries(this.filters[filterType])) {
            const hx = this.panelData.samples[sample][loadings][t][dim];
            if (hx >= range["gt"] && hx <= range["lt"]) {
              dimsValid++
            }
          }
        }
        if (dimsValid == numFilters) {
          validSamples.push(sample);
          break;
        }
      }
    }
    return validSamples
  }

  changeFilterGtLt(filterType) {
    this.filterGt[filterType] = parseFloat(this.select(`filter-${filterType}-gt`).val());
    this.filterLt[filterType] = parseFloat(this.select(`filter-${filterType}-lt`).val());
    this.filters[filterType][this.filterDim[filterType]] = {
      "gt": this.filterGt[filterType], "lt": this.filterLt[filterType]
    };

    this.sampleNames = this.applyFilter();
    this.writeSampleCount();
    if (this.sampleNames.length > 0) {
      this.changeSampleSelect();
      this.writeFilterDimFont(filterType, this.filterDim[filterType], true);
    }
  }

  resetGradFilters() {
    Object.keys(this.filters["grad"]).forEach(dim => this.writeFilterDimFont("grad", dim, false));
    this.filters["grad"] = {};
    this.sampleNames = this.applyFilter();
    // This will trigger changeFilterDim.
    this.select("filter-grad-dim-select").val(this.defaultXDim).trigger('change');
    this.changeSampleSelect();
    this.writeSampleCount();
  }

  resetAllFilters() {
    Object.keys(this.filters["raw"]).forEach(dim => this.writeFilterDimFont("raw", dim, false));
    Object.keys(this.filters["grad"]).forEach(dim => this.writeFilterDimFont("grad", dim, false));
    this.filters = {"raw": {}, "grad": {}};
    this.sampleNames = this.clusterSamples();
    // This will trigger changeFilterDim.
    this.select("filter-raw-dim-select").val(this.defaultXDim).trigger('change');
    this.select("filter-grad-dim-select").val(this.defaultXDim).trigger('change');
    this.changeSampleSelect();
    this.writeSampleCount();
  }

  resetDimFilter(filterType) {
    if (this.filters[filterType].hasOwnProperty(this.filterDim[filterType])) {
      this.writeFilterDimFont(filterType, this.filterDim[filterType], false);
      delete this.filters[filterType][this.filterDim[filterType]];
      this.sampleNames = this.applyFilter();
      // This will trigger changeFilterDim.
      this.select(`filter-${filterType}-dim-select`).val(this.filterDim[filterType]).trigger('change');
      this.changeSampleSelect();
      this.writeSampleCount();
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
      this.select("play_pause_btn").text("pause_circle");
      clearInterval(this.playingIntervalId);
      this.playingIntervalId = setInterval(this._playStep.bind(this), 250);
      this.playing = true;
    }
  }

  _pause(changeSymbol=true) {
    if (this.playing) {
      if (changeSymbol) {
        this.select("play_pause_btn").text("play_circle");
      }
      clearInterval(this.playingIntervalId);
      this.playing = false;
    }
  }

  select(id) {
    return $(`#${this.id}-${id}`)
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

