
$ = require('jquery');
const Panel = require('./Panel.js');


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
    displaySalency: true,
    salencyTypes: ["value", "action"],
    panelLayout: "panel-grid-2-2",
    dataLocation: dataLocation,
  }
);

document.addEventListener('keydown', function(e) {
  p.keydown(e)
});