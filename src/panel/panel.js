
const d3 = require("d3");
import * as Plot from "@observablehq/plot";


var width = 900;
var height = 600;

const min_obs = 0;
const max_obs = 27;

d3.select("#timestep-slider")
  .attr("max", max_obs)
  .attr("min", min_obs);

d3.select("#timestep-slider").on("change", e => 
  {
    var value = e.target.value; 
    d3.select("#obs-image")
      .attr("src", "../data/obs/" + value + ".png");
  }
);

const pca_data = require("../../static/data/pca.json");

document.getElementById("pca-subpanel")
  .appendChild(
    Plot.plot({
      marks: [
        Plot.dot(pca_data["all_pts"], {
          x: d => d[0],
          y: d => d[1],
          fill: "currentColor",
          r: 2,
        }),
        Plot.dot(pca_data["sample_pts"], {
          x: d => d[0],
          y: d => d[1],
          fill: "red",
          r: 5,
        }),
      ]
    })
);