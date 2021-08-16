
const d3 = require("d3");
$ = require('jquery');

const BarPlot = require('./BarPlot.js');
const PCAScatterplot = require('./PCAScatterplot.js');

const panelData = require("../../static/data/panel_data.json");


//////////   Setup    /////////////

// Sample selector

const sampleNames = Object.keys(panelData.samples)
for (const s_name of sampleNames) {
  $("#sample-select")
    .append(`<option value="${s_name}">${s_name}</option>`);
}

var sampleName;
var sampleData; 
var maxStep;

var salType = "action";
var step = 0;

changeSample(sampleNames[0], doChangeStep=false);

pcaScatterplot = new PCAScatterplot(
  $("#pca-points-subpanel").get(0),
  panelData.base_hx_loadings,
  sampleData.hx_loadings,
);

changeStep(0);


//////////   Updater functions    /////////////


$('input[type=radio][name=salency_type]').change(function() {
  salType = this.value
  changeStep(step)
});

function changeStep(newStep) {
  step = newStep
  
  d3.select("#obs-image")
    .attr("src", `../data/${sampleName}/obs/${step}.png`)

  d3.select("#sal-image")
    .attr("src", `../data/${sampleName}/sal_${salType}/${step}.png`)

  d3.select("#step-counter")
    .text("Step " + step + " of " + maxStep)

  barPlot.update(step, salType)
  pcaScatterplot.update(sampleData, step)
}

$("#sample-select").on('change', function() {
  changeSample(this.value)
});

function changeSample(newSample, doChangeStep=true) {
  console.log(newSample)
  sampleName = newSample
  sampleData = panelData.samples[sampleName]
  maxStep = sampleData.hx_loadings.length - 1;

  $("#bar-graph-subpanel").empty();
  barPlot = new BarPlot($("#bar-graph-subpanel").get(0), sampleData);

  if (doChangeStep) {
    changeStep(0);
  }
}


//////////   Timestep controls    /////////////

d3.select("#back_all_btn").on("click", _ =>
  changeStep(0)
);

d3.select("#back_one_btn").on("click", _ =>
  changeStep(Math.max(0, step - 1))
);

d3.select("#forward_one_btn").on("click", _ =>
  changeStep(Math.min(maxStep, step + 1))
);

d3.select("#forward_all_btn").on("click", _ =>
  changeStep(maxStep)
);

document.addEventListener('keydown', function(e) {
    switch (e.keyCode) {
        case 37:
            changeStep(Math.max(0, step - 1));
            break;
        case 39:
            changeStep(Math.min(maxStep, step + 1));
            break;
    }
});
