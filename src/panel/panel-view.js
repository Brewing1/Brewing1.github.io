
$ = require('jquery');
const Panel = require('./panel.js');


var dataLocation = "data"
try {
  const data = require(`../../static/localData/panel_data.json`);
  dataLocation = "localData";
  console.log("using localData folder!")
} catch {}


const p = new Panel(
  $("#panel").get(0),
  "panel",
  {
    displayClusters: true,
    displayFilters: true,
    displaySaliency: true,
    saliencyTypes: ["value", "action", "hx_direction_0", "hx_direction_1", "hx_direction_2", "hx_direction_3", "hx_direction_4", "hx_direction_5", "hx_direction_6", "hx_direction_7", "hx_direction_8", "hx_direction_9", "hx_direction_10", "hx_direction_11", "hx_direction_12", "hx_direction_13", "hx_direction_14", "hx_direction_15"],
    panelLayout: "panel-grid-2-2",
    barChartOptions: {
			useColor: true,
		},
    dataLocation: dataLocation,
    defaultStep: 4,
  }
);

document.addEventListener('keydown', function(e) {
  p.keydown(e)
});