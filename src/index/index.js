// Hot reloading
// import * as _unused from "raw-loader!./index.ejs";
// TODO: disable before publishing


$ = require('jquery');
const Panel = require('../panel/Panel.js');


const fig1 = new Panel(
	$("#figure-1").get(0),
	"fig1",
	{
		sampleNames: ["sample_00000", "sample_00001"],
		displaySalency: false,

	}
);

const fig2 = new Panel(
	$("#figure-2").get(0),
	"fig2",
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