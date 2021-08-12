
const d3 = require("d3");

$ = require('jquery')

//////////   Settings    /////////////

const sample_name = "sample_00003"

//////////   Data import    /////////////

const base_hx_loadings = require("../../static/data/base_hx_loadings.json");

const raw_sample_loadings = require("../../static/data/"+sample_name+"/hx_loadings.json");

var sample = raw_sample_loadings.map( (vals, i) =>
  ({
    hx_loadings: vals,
    is_selected: i == step,
  })
)

var max_step = sample.length - 1

//////////   Timestep controls    /////////////

var step = 0
var sal_type = "action"

change_step(0);

$('input[type=radio][name=salency_type]').change(function() {
  sal_type = this.value
  change_step(step)
});

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

  update_timesteps_points();
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


//////////   Graphing    /////////////


pca_plot(d3.select("#pca-points-graph"), base_hx_loadings, sample)

function pca_plot(svg, base_data, sample_data) {
  // adapted from https://observablehq.com/@d3/scatterplot

  const width = 300
  const height = 300
  const margin = {top: 25, right: 20, bottom: 35, left: 40};

  svg
    .attr("width", width)
    .attr("height", height)

  const dim_extents = dim => {
    const base_extents = d3.extent(base_data, d => d[dim]);
    const sample_extents = d3.extent(sample_data, d => d.hx_loadings[dim]);

    return [
      Math.min(base_extents[0], sample_extents[0]),
      Math.max(base_extents[1], sample_extents[1])
    ]
  } 

  const x = d3.scaleLinear()
    .domain(dim_extents(0)).nice()
    .range([margin.left, width - margin.right])
  
  const y = d3.scaleLinear()
    .domain(dim_extents(1)).nice()
    .range([height - margin.bottom, margin.top])

  const xAxis = g => g
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(width / 80))
    .call(g => g.append("text")
      .attr("x", width)
      .attr("y", margin.bottom - 4)
      .attr("fill", "currentColor")
      .attr("text-anchor", "end")
      .text("0th pca dimension"))
  
  const yAxis = g => g
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y))
    .call(g => g.append("text")
      .attr("x", -margin.left)
      .attr("y", 10)
      .attr("fill", "currentColor")
      .attr("text-anchor", "start")
      .text("1st pca dimension"))

  svg.append("g")
    .call(xAxis);

  svg.append("g")
    .call(yAxis);

  svg.append("g")
    .selectAll("circle")
    .data(base_data)
    .join("circle")
      .attr("cx", d => x(d[0]))
      .attr("cy", d => y(d[1]))
      .attr("fill", "black")
      .attr("fill-opacity", .2)
      .attr("r", 1);

  svg.append("g")
    .selectAll("circle")
    .data(sample_data)
    .join("circle")
      .attr("class", "timestep-point")
      .attr("cx", d => x(d.hx_loadings[0]))
      .attr("cy", d => y(d.hx_loadings[1]))
      .attr("fill", d => d["is_selected"] ? "red" : "blue")
      .attr("r", 3);
}

function update_timesteps_points() {
  d3.select("#pca-points-graph")
    .selectAll(".timestep-point")
    .attr("fill", d => d["is_selected"] ? "red" : "blue")
}
