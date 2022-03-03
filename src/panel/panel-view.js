
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
    displaySaliency: true,
    saliencyTypes: ["value", "action", "hx_direction_1", "hx_direction_2"],
    panelLayout: "panel-grid-2-2",
    barChartOptions: {
			useColor: true,
		},
    dataLocation: dataLocation,
  }
);

document.addEventListener('keydown', function(e) {
  p.keydown(e)
});