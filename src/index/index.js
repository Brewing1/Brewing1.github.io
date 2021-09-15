// Hot reloading
// import * as _unused from "raw-loader!./index.ejs";
// TODO: disable before publishing


$ = require('jquery');
const Panel = require('../panel/Panel.js');


const basicPanel = new Panel(
	$("#basic-panel").get(0),
	"basic-panel",
	{
		sampleNames: ["sample_00000", "sample_00001"],
		displaySalency: false,

	}
);

const maximalActivationPanel = new Panel(
	$("#max-act-panel").get(0),
	"max-act-panel",
	{
		sampleNames: ["sample_00000", "sample_00001"],
		displaySalency: false,

	}
);


const salencyPanel = new Panel(
	$("#salency-panel").get(0),
	"salency-panel",
	{
		sampleNames: ["sample_00000", "sample_00001"],
		displaySalency: true,
		salencyTypes: ["value", "action"],
		barChartOptions: {
			useColor: true,
		},
		panelLayout: "panel-grid-2-2"
	}
);


const behaviourPanel = new Panel(
	$("#behaviour-panel").get(0),
	"behaviour-panel",
	{
		sampleNames: ["sample_00000", "sample_00001"],
		displaySalency: true,
		salencyTypes: ["value", "action"],
		barChartOptions: {
			useColor: true,
		},
		panelLayout: "panel-grid-2-2"
	}
);




document.addEventListener('keydown', function(e) {
	// Todo: should direct keydown event to the appropriate panel based on page position.
	fig1.keydown(e)
});