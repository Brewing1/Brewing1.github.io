// Hot reloading
// import * as _unused from "raw-loader!./index.ejs";
// TODO: disable before publishing


import $ from 'jquery';
import { MDP, MDPGrad } from '../mdp.js';
import Panel from '../panel/panel.js';


const mdpAnimation = new MDP(
	"#mdp-animation",
	{
		numTimesteps: 3,
		arrowColour: "black"
	}
);
mdpAnimation.draw()

const mdpAnimationGrad = new MDPGrad(
	"#mdp-animation-grad",
	{
		numTimesteps: 2,
		arrowColour: "red"
	}
);
mdpAnimationGrad.draw()

const panel = new Panel(
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
    // dataLocation: dataLocation,
    defaultStep: 4,
  }
);

const panelList = [panel]

document.addEventListener('keydown', function(e) {
	const onScreen = panelList.filter(function(p) {
		const midpoint = $(p.element).offset().top + $(p.element).outerHeight()/2;
    	const top_of_screen = $(window).scrollTop();
		const bottom_of_screen = top_of_screen + $(window).innerHeight();
		return ((midpoint > top_of_screen) && (midpoint < bottom_of_screen))
	})

	if (onScreen.length>0) {
		if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
			// Prevent the default (scrolling) behaviour so users can click through samples
			e.preventDefault();
		}
		onScreen[0].keydown(e);
	}
});
