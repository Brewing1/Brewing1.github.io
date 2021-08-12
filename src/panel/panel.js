
// import 'bootstrap/dist/css/bootstrap.min.css';

const d3 = require("d3");
import * as Plot from "@observablehq/plot";

var width = 900;
var height = 600;

// d3.select("#timestep-slider")
//   .attr("max", max_obs)
//   .attr("min", min_obs);


// d3.select("#timestep-slider").on("change", e => 
//   {
//     value = e.target.value;
//     change_value(e.target.value)
//   }
// );


// Data import

const pca_data = require("../../static/data/pca.json");
var timesteps = pca_data.sample_pts.map( (vals, i) =>
  ({
    pca_loadings: vals,
    is_selected: i == step,
  })
)

var max_step = timesteps.length -1

// Timestep management

var step = 0
change_step(0);

function change_step(new_step) {
  console.log(step, new_step, timesteps)
  timesteps[step].is_selected = false;
  timesteps[new_step].is_selected = true;
  
  d3.select("#obs-image")
    .attr("src", "../data/obs/" + step + ".png")

  d3.select("#step-counter")
    .text("Step " + new_step + " of " + max_step)

  step = new_step
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



// Graphing

pca_plot(d3.select("#pca-points-graph"), pca_data["all_pts"], timesteps)


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
    const sample_extents = d3.extent(sample_data, d => d.pca_loadings[dim]);

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
      .attr("r", 1);

  svg.append("g")
    .selectAll("circle")
    .data(timesteps)
    .join("circle")
      .attr("cx", d => x(d.pca_loadings[0]))
      .attr("cy", d => y(d.pca_loadings[1]))
      .attr("fill", d => "is_selected" ? "red" : "blue")
      .attr("r", 3);

}




// document.getElementById("pca-points-subpanel")
//   .appendChild(
//     Plot.plot({
//       width: 200,
//       height: 200,
//       marks: [
//         Plot.dot(pca_data["all_pts"], {
//           x: d => d[0],
//           y: d => d[1],
//           fill: "currentColor",
//           r: 2,
//         }),
//         Plot.dot(timesteps, {
//           x: d => d.pca_loadings[0],
//           y: d => d.pca_loadings[1],
//           fill: d => "is_selected" ? "red" : "blue",
//           attr: "current_mark",
//           r: 5,
//         }),
//       ]
//     })
// );