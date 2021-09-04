
$ = require('jquery');
const Panel = require('./Panel.js');

const p = new Panel(
  $("#panel").get(0),
  "panel",
  {
    sampleNames: ["sample_00000", "sample_00001"],
    displaySalency: true,
    salencyTypes: ["value", "action"],
    panelLayout: "panel-grid-2-2",
  }
);


document.addEventListener('keydown', function(e) {
  // Todo: should direct keydown event to the appropriate panel based on page position.
  p.keydown(e)
});