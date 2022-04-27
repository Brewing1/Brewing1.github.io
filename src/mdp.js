const d3 = require("d3");

export function createMDP(tagId) {
  const width = 1000;
  const height = 250;
  const numTimesteps = 3;
  // If only two timesteps, shift svg position to the right
  const xShift = numTimesteps == 2 ? 40 : 0;
  // x,y position of the bottom left node, params dx, dy control the distance between nodes.
  const nodePos = {"x": 200 + xShift, "y": 200, "dx": 200, "dy": 80}
  const radius = 20;
  const arrowSpeed = 1200;
  const loopSpeed = 15000;
  // Uses "light" color palette 0.2.7 light from
  // https://cran.r-project.org/web/packages/khroma/vignettes/tol.html
  const colour = {env: "#44BB99", obs: "#EEDD88", act: "#EE8866", mem: "#77AADD"};

  // Define the arrowhead marker variables
  const markerBoxWidth = 20;
  const markerBoxHeight = 20;
  // Let the arrowheads overlap with the line
  const refX = markerBoxWidth;
  const refY = markerBoxHeight / 2;
  const markerWidth = markerBoxWidth / 2;
  const markerHeight = markerBoxHeight / 2;
  const arrowPoints = [[0, 0], [0, 20], [20, 10]];

  // Position of legend
  const legBox = {x: 20, y: 60};
  const legSpacing = 30

  // Create the svg
  const svg = d3.select(tagId).append("svg:svg")
      .attr("width", width)
      .attr("height", height);

  // The coordinates for each node
  const data = [
    {
      row: "top",
      coords: d3.range(numTimesteps - 1).map(
        x => [nodePos.x + (nodePos.dx/2) + x*nodePos.dx, nodePos.y - 2*nodePos.dy]
      )
    },
    {
      row: "middle",
      coords: d3.range((numTimesteps - 1) * 2).map(
        x => [nodePos.x + (nodePos.dx/4) + x*(nodePos.dx/2), nodePos.y - nodePos.dy]
      )
    },
    {
      row: "bottom",
      coords: d3.range(numTimesteps).map(
        x => [nodePos.x + x*(nodePos.dx), nodePos.y]
      )
    }
  ];

  const getFill = function(i, j) {
    const rowIdx = parseInt(i);
    const colIdx = parseInt(j);
    // Get the colour of each node
    if (rowIdx == 0) {
      return colour.env;
    } else if (rowIdx == 1) {
      return colIdx % 2 == 0 ? colour.act : colour.obs;
    } else {
      return colour.mem;
    }
  };

  const getNodeType = function(rowIdx, colIdx) {
    // The name of each node (S, O, A, M)
    if (rowIdx == 0) {
      return "w";
    } else if (rowIdx == 1) {
      return colIdx % 2 == 0 ? "a" : "o";
    } else {
      return "h";
    }
  };

  const getTimeStepText = function(rowIdx, colIdx) {
    // The subscript of each node indicating the timestep
    if (rowIdx == 0 || rowIdx == 2) {
      return colIdx == 0 ? "t" : "t+" + colIdx;
    } else {
      // Middle row has both Observations and actions
      return colIdx < 2 ? "t" : "t+" + Math.floor(colIdx / 2);
    }
  };

  const getNodeLabel = function(i, j) {
    const rowIdx = parseInt(i);
    const colIdx = parseInt(j);
    const subscript = `<tspan dy='5' font-size='.7em'>${getTimeStepText(rowIdx, colIdx)}</tspan>`;
    return getNodeType(rowIdx, colIdx) + subscript;
  };

  const getCircDelay = function(i, j) {
    const rowIdx = parseInt(i);
    const colIdx = parseInt(j);
    // Get the time delay for each node to appear
    if (rowIdx == 2) {
      return 4 * colIdx * arrowSpeed;
    } else if (rowIdx == 1) {
      return 2 * colIdx * arrowSpeed + arrowSpeed;
    } else {
      return 4 * colIdx * arrowSpeed + 2 * arrowSpeed;
    }
  };

  const getArrowDelay = function(i) {
    // At every 2nd delay (of time arrowSpeed), two arrows should fire at the same time.
    // Must handle env-1->env and hx-1->hx transitions to fire the same time as
    // act->env and obs->hx, respectively.
    const idx = parseInt(i);
    return arrowSpeed + (idx - Math.floor((idx + 1) / 3)) * arrowSpeed;
  };

  const nodes = svg
    .selectAll("node-row")
    .data(data)
    .enter()
    .append("g")
      // the row number available from DOM
      .attr("node-row", (_, i) => i)
    .selectAll("g")
    .data(d => d.coords)
    .enter()
    .append("g")
      // the col number available from DOM
      .attr("node-col", (_, j) => j)
      // Set opacity to 0, this will change when we run the animation
      .style("opacity", 0);

  // Create circles
  nodes
    .append("circle")
      .attr("cx", d => d[0])
      .attr("cy", d => d[1])
      .attr("r", d => radius)
      // Get the fill colour based on row and column number
      .style("fill", function(_,j) {
        return getFill(this.parentNode.parentNode.getAttribute("node-row"), j);
      });

  // Manually places text in nodes based on x and y coords.
  nodes
    .append("text")
      .html(function(_,j) {
        return getNodeLabel(this.parentNode.parentNode.getAttribute("node-row"), j);
      })
      .attr("id", "nodeText")
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .attr("x", d => d[0])
      // Manually add 2 pixels to drop slightly below the "alignment-baseline"
      .attr("y", d => d[1] + 2)
      .style("font-size", d => radius * (3/4))
      .style("font-weight", "bold");

  // Make nodes appear and disappear on cue
  nodes
    .transition()
    .delay(function(_,j) {return getCircDelay(this.parentNode.getAttribute("node-row"), j);})
    .on("start", function repeat() {
      d3.active(this)
          .duration(arrowSpeed)
          .style("opacity", 1)
        .transition()
          .delay(function() {
            return loopSpeed
              - getCircDelay(this.parentNode.getAttribute("node-row"), this.getAttribute("node-col"));
          })
          .style("opacity", 0)
        .transition()
          .delay(function() {
            return getCircDelay(this.parentNode.getAttribute("node-row"), this.getAttribute("node-col"));
          })
          .on("start", repeat);
    });


  let circlePairs = function() {
    // An array of coordinate pairs indicating the centre of circles to be joined with an arrow
    // Add an empty env node on the top so we can draw arrows from an assumed previous timestep
    const topRow = [[nodePos.x - radius*2, nodePos.y - 2*nodePos.dy], ...data[0].coords];
    const middleRow = [...data[1].coords];
    const bottomRow = [...data[2].coords];
    let arr = [];
    for (let i = 0; i < numTimesteps-1; i++) {
      // Connect mem with action
      arr.push(shortenedPath([bottomRow[0], middleRow[0]]));
      // Connect action with env
      arr.push(shortenedPath([middleRow.shift(), topRow[1]]));
      // Connect env-1 with env
      arr.push(shortenedPath([topRow.shift(), topRow[0]]));
      // Connect env with obs
      arr.push(shortenedPath([topRow[0], middleRow[0]]));
      // Connect obs with mem
      arr.push(shortenedPath([middleRow.shift(), bottomRow[1]]));
      // Connect mem-1 with mem
      arr.push(shortenedPath([bottomRow.shift(), bottomRow[0]]));
    }
    return arr;
  };

  let shortenedPath = function([a, b]) {
    // Takes the vectors representing the centre of two circles, and moves them closer together by
    // length=rad. Need this so that our arrowheads don't appear in the middle of the circles
    const dist = Math.sqrt((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2);
    const distRatio = (dist - radius) / dist;
    // Extra x and y values to add/subtract to original vectors
    const dx = ((b[0] - a[0]) - (b[0] - a[0]) * distRatio);
    const dy = ((b[1] - a[1]) - (b[1] - a[1]) * distRatio);
    // Make sure we move the coordinates in the right direction.
    const aNew = [a[0] + dx, a[1] + dy];
    const bNew = [b[0] - dx, b[1] - dy];
    return [aNew, bNew];
  };

  // Place arrowhead in a defs element for use later
  svg.append("svg:defs").append("svg:marker")
    .attr("id", "arrow")
    .attr('viewBox', [0, 0, markerBoxWidth, markerBoxHeight])
    .attr("refX", refX)
    .attr("refY", refY)
    .attr("markerWidth", markerWidth)
    .attr("markerHeight", markerHeight)
    .attr("orient", "auto")
    .append("path")
      .attr('d', d3.line()(arrowPoints))
      .style("fill", "black");

  // Draw line and render arrows
  svg
    .append("g")
    .selectAll("line")
    .data(circlePairs())
    .join("line")
      .attr("arrow-idx", (_, i) => i)
      .attr("x1", d => d[0][0])
      .attr("y1", d => d[0][1])
      .attr("x2", d => d[0][0])
      .attr("y2", d => d[0][1])
      .transition()
      .delay((_,i) => getArrowDelay(i))
      .on("start", function repeat() {
        d3.active(this)
            .duration(arrowSpeed)
            .attr("x2", d => d[1][0])
            .attr("y2", d => d[1][1])
            .attr("stroke-width", 1)
            .attr("marker-end", "url(#arrow)")
            .attr("stroke", "black")
          .transition()
            .delay(function(){return loopSpeed - getArrowDelay(this.getAttribute("arrow-idx"));})
            .attr("x2", d => d[0][0])
            .attr("y2", d => d[0][1])
            .attr("marker-end", "none")
            .attr("stroke-width", 0)
          .transition()
            .delay(function(){return getArrowDelay(this.getAttribute("arrow-idx"));})
            .on("start", repeat);
      });

  // Legend (h/t https://www.d3-graph-gallery.com/graph/custom_legend.html)
  const legOrder = ["env", "obs", "act", "mem"];
  const legText = {env: "Environment", obs: "Observation", act: "Action", mem: "Agent hidden state"};
  const legEl = svg
                  .append("g")
                  .selectAll("g")
                  .data(legOrder)
                  .enter().append("g");

  legEl
    .append("circle")
      .attr("cx", legBox.x)
      .attr("cy", (_,i) => legBox.y + legSpacing * i)
      .attr("r", 6)
      .style("fill", d => colour[d]);

  legEl
    .append("text")
      .text(d => legText[d])
      .attr("x", legBox.x + 15)
      .attr("y", (_,i) => legBox.y + 5 + legSpacing * i)
      .style("font-size", "15px");

  return svg.node();
};