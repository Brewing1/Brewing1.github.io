
const d3 = require("d3");
$ = require('jquery');
const { readdirSync } = require('fs');

const BarPlot = require('./BarPlot.js');
const PCAScatterplot = require('./PCAScatterplot.js');


//////////   Settings    /////////////


const getDirectories = source =>
  readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

const sample_name = "sample_00006";


//////////   Data import    /////////////


const base_hx_loadings = require("../../static/data/base_hx_loadings.json");

const raw_sample_loadings = require("../../static/data/"+sample_name+"/hx_loadings.json");

var sample = raw_sample_loadings.map( (vals, i) =>
  ({
    hx_loadings: vals,
    is_selected: i == step,
  })
);

var max_step = sample.length - 1;


//////////   Setup    /////////////


var step = 0;
var sal_type = "action";


barPlot = new BarPlot($("#bar-graph-subpanel").get(0), sample[step].hx_loadings)
pcaScatterplot = new PCAScatterplot(
  $("#pca-points-subpanel").get(0),
  base_hx_loadings,
  sample
);

change_step(0);

$('input[type=radio][name=salency_type]').change(function() {
  sal_type = this.value
  change_step(step)
});


//////////   Timestep controls    /////////////


function change_step(new_step) {
  sample[step].is_selected = false;
  sample[new_step].is_selected = true;
  
  d3.select("#obs-image")
    .attr("src", `../data/${sample_name}/obs/${step}.png`)

  d3.select("#sal-image")
    .attr("src", `../data/${sample_name}/sal_${sal_type}/${step}.png`)

  d3.select("#step-counter")
    .text("Step " + new_step + " of " + max_step)

  step = new_step

  barPlot.update(sample[step].hx_loadings)
  pcaScatterplot.update(sample)
}

d3.select("#back_all_btn").on("click", _ =>
  change_step(0)
);

d3.select("#back_one_btn").on("click", _ =>
  change_step(Math.max(0, step - 1))
);

d3.select("#forward_one_btn").on("click", _ =>
  change_step(Math.min(max_step, step + 1))
);

d3.select("#forward_all_btn").on("click", _ =>
  change_step(max_step)
);

document.addEventListener('keydown', function(e) {
    switch (e.keyCode) {
        case 37:
            change_step(Math.max(0, step - 1));
            break;
        case 39:
            change_step(Math.min(max_step, step + 1));
            break;
    }
});
