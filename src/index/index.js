// Hot reloading
// import * as _unused from "raw-loader!./index.ejs";
// TODO: disable before publishing


$ = require('jquery');
const Panel = require('../panel/panel.js');
const MDP = require('../mdp.js');


const mdpAnimation = MDP.createMDP("#mdp-animation");

/**
 * TODO: Figure that depicts pca plot with option for which
 * PCs to choose. 3 panels. It's a video of the agent
 * observations (no saliency) and the hx as it moves through
 * pca space with bar chart (no saliency either).
**/
const basicPanel = new Panel(
	$("#basic-panel").get(0),
	"basic-panel",
	{
		sampleNames: ["sample_00000", "sample_00001"],
		displaySaliency: false,

	}
);

/**
 * Same 3 panel figure as above (has obs, pca, and barchart,
 * no saliency of obs or on barchart) but for samples that 
 * maximise each of the PCs (or NMFs if it happens to be what
 * you use for the bar chart)
 **/
const maximalActivationPanel = new Panel(
	$("#max-act-panel").get(0),
	"max-act-panel",
	{
		sampleNames: ["sample_00000", "sample_00001"],
		displaySaliency: false,

	}
);

/**
 * TODO: One of the main figures: Four panels.
 * Obs, obs-saliency, PCA, pca-barchart with saliency.
 * It should have a bunch of samples that tell the story of the
 * specific XYZ variables that we identified a few paragraphs above.
 * Some probably work out, but some probably don't.
 * E.g. we might have got the buzzsaw direction right but the box
 * direction wrong because it also assigns saliency to thin ledges
 * as well as boxes.
 * 
 **/
const saliencyPanel = new Panel(
	$("#saliency-panel").get(0),
	"saliency-panel",
	{
		sampleNames: ["sample_00000", "sample_00001"],
		displaySaliency: true,
		saliencyTypes: ["value", "action"],
		barChartOptions: {
			useColor: true,
		},
		panelLayout: "panel-grid-2-2"
	}
);

/**
 * TODO: Another one of the main figures: Four panels.
 * Obs, obs-saliency, PCA, pca-barchart with saliency.
 * It should have a bunch of samples that depict the action/behaviour
 * that we're trying to explain.
 **/
const behaviourPanel = new Panel(
	$("#behaviour-panel").get(0),
	"behaviour-panel",
	{
		sampleNames: ["sample_00000", "sample_00001"],
		displaySaliency: true,
		saliencyTypes: ["value", "action"],
		barChartOptions: {
			useColor: true,
		},
		panelLayout: "panel-grid-2-2"
	}
);

/**
 * TODO: Figure. 4 panels. Top 2 panels are agent
 * observations and bar chart, no saliency on either.
 * Bottom two panels are the same but for samples where
 * the directions have not been swapped.
 **/

// NOT DONE

const panelList = [basicPanel, maximalActivationPanel, saliencyPanel, behaviourPanel]

document.addEventListener('keydown', function(e) {
	onScreen = panelList.filter(function(p) {
		const midpoint = $(p.element).offset().top + $(p.element).outerHeight()/2;
    	const top_of_screen = $(window).scrollTop();
		const bottom_of_screen = top_of_screen + $(window).innerHeight();
		return ((midpoint > top_of_screen) && (midpoint < bottom_of_screen))
	})
	console.log(onScreen)

	if (onScreen.length>0) {
		onScreen[0].keydown(e);
	}
});
