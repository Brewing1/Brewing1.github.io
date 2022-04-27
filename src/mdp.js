const d3 = require("d3");
get = require('lodash/get');


module.exports = class MDP {

  constructor(id, options={}) {

    this.id = id

    // https://cran.r-project.org/web/packages/khroma/vignettes/tol.html
    const defaultColours = {env: "#44BB99", obs: "#EEDD88", act: "#EE8866", mem: "#77AADD"};
    // Default position of legend
    const defaultLegBox = {x: 20, y: 60, dy: 30};
    // Default legend order
    const defaultLegOrder = ["env", "obs", "act", "mem"];
    // Default legend text
    const defaultLegText = {
      env: "Environment", obs: "Observation", act: "Action", mem: "Agent hidden state"
    };

    this.width             = get(options, "width",         1000);
    this.height            = get(options, "height",        250);
    this.numTimesteps      = get(options, "numTimesteps",  3);
    this.radius            = get(options, "radius",        20);
    this.arrowSpeed        = get(options, "arrowSpeed",    1200);
    this.loopSpeed         = get(options, "loopSpeed",     15000);
    this.colours           = get(options, "colours",       defaultColours);
    this.markerSize        = get(options, "markerSize",    25);
    this.legBox            = get(options, "legBox",        defaultLegBox);
    this.legOrder          = get(options, "legOrder",      defaultLegOrder);
    this.legText           = get(options, "legText",       defaultLegText);

    // x,y position of the bottom left node, params dx, dy control the distance between nodes.
    // If only two timesteps, shift svg position to the right
    this.nodePos = {"x": 200 + (this.numTimesteps == 2 ? 40 : 0), "y": 200, "dx": 200, "dy": 80}

    // Make a triangle for the arrow
    this.arrowPoints = [[0, 0], [0, this.markerSize], [this.markerSize, this.markerSize / 2]];

    // The coordinates for each node
    this.data = [
      {
        row: "top",
        coords: d3.range(this.numTimesteps - 1).map(
          x => [this.nodePos.x + (this.nodePos.dx/2) + x*this.nodePos.dx, this.nodePos.y - 2*this.nodePos.dy]
        )
      },
      {
        row: "middle",
        coords: d3.range((this.numTimesteps - 1) * 2).map(
          x => [this.nodePos.x + (this.nodePos.dx/4) + x*(this.nodePos.dx/2), this.nodePos.y - this.nodePos.dy]
        )
      },
      {
        row: "bottom",
        coords: d3.range(this.numTimesteps).map(
          x => [this.nodePos.x + x*(this.nodePos.dx), this.nodePos.y]
        )
      }
    ];

    this.draw();

  }

  draw() {
    // "this" will change when we are drawing elements
    const _this = this

    // Create the svg
    const svg = d3.select(_this.id).append("svg:svg")
        .attr("width", _this.width)
        .attr("height", _this.height);

    // Create the nodes (which will contain circles and text)
    const nodes = svg
      .selectAll("node-row")
      .data(_this.data)
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
        .attr("r", d => _this.radius)
        // Get the fill colour based on row and column number
        .style("fill", function(_,j) {
          return _this.getFill(this.parentNode.parentNode.getAttribute("node-row"), j);
        });

    // Manually places text in nodes based on x and y coords.
    nodes
      .append("text")
        .html(function(_,j) {
          return _this.getNodeLabel(this.parentNode.parentNode.getAttribute("node-row"), j);
        })
        .attr("id", "nodeText")
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "middle")
        .attr("x", d => d[0])
        // Manually add 2 pixels to drop slightly below the "alignment-baseline"
        .attr("y", d => d[1] + 2)
        .style("font-size", d => _this.radius * (3/4))
        .style("font-weight", "bold");

    // Make nodes appear and disappear on cue
    nodes
      .transition()
      .delay(function(_,j) {return _this.getCircDelay(this.parentNode.getAttribute("node-row"), j);})
      .on("start", function repeat() {
        d3.active(this)
            .duration(_this.arrowSpeed)
            .style("opacity", 1)
          .transition()
            .delay(function() {
              return _this.loopSpeed
                - _this.getCircDelay(this.parentNode.getAttribute("node-row"), this.getAttribute("node-col"));
            })
            .style("opacity", 0)
          .transition()
            .delay(function() {
              return _this.getCircDelay(this.parentNode.getAttribute("node-row"), this.getAttribute("node-col"));
            })
            .on("start", repeat);
      });

    // Place arrowhead in a defs element for later use
    svg.append("svg:defs").append("svg:marker")
      .attr("id", "arrow")
      .attr('viewBox', [0, 0, _this.markerSize, _this.markerSize])
      .attr("refX", _this.markerSize)
      .attr("refY", _this.markerSize / 2)
      .attr("markerWidth", _this.markerSize / 2)
      .attr("markerHeight", _this.markerSize / 2)
      .attr("orient", "auto")
      .append("path")
        .attr('d', d3.line()(_this.arrowPoints))
        .style("fill", "black");

    // Draw line and render arrows
    svg
      .append("g")
      .selectAll("line")
      .data(_this.circlePairs())
      .join("line")
        .attr("arrow-idx", (_, i) => i)
        .attr("x1", d => d[0][0])
        .attr("y1", d => d[0][1])
        .attr("x2", d => d[0][0])
        .attr("y2", d => d[0][1])
        .transition()
        .delay((_,i) => _this.getArrowDelay(i))
        .on("start", function repeat() {
          d3.active(this)
              .duration(_this.arrowSpeed)
              .attr("x2", d => d[1][0])
              .attr("y2", d => d[1][1])
              .attr("stroke-width", 1)
              .attr("marker-end", "url(#arrow)")
              .attr("stroke", "black")
            .transition()
              .delay(function(){return _this.loopSpeed - _this.getArrowDelay(this.getAttribute("arrow-idx"));})
              .attr("x2", d => d[0][0])
              .attr("y2", d => d[0][1])
              .attr("marker-end", "none")
              .attr("stroke-width", 0)
              .transition()
              .delay(function(){return _this.getArrowDelay(this.getAttribute("arrow-idx"));})
              .on("start", repeat);
        });

    const legEl = svg
      .append("g")
      .selectAll("g")
      .data(_this.legOrder)
      .enter().append("g");

    legEl
      .append("circle")
      .attr("cx", _this.legBox.x)
      .attr("cy", (_,i) => _this.legBox.y + _this.legBox.dy * i)
      .attr("r", 6)
      .style("fill", d => _this.colours[d]);

    legEl
      .append("text")
      .text(d => _this.legText[d])
      .attr("x", _this.legBox.x + 15)
      .attr("y", (_,i) => _this.legBox.y + 5 + _this.legBox.dy * i)
      .style("font-size", "15px");
  }


  getFill = function(i, j) {
    const rowIdx = parseInt(i);
    const colIdx = parseInt(j);
    // Get the colour of each node
    if (rowIdx == 0) {
      return this.colours.env;
    } else if (rowIdx == 1) {
      return colIdx % 2 == 0 ? this.colours.act : this.colours.obs;
    } else {
      return this.colours.mem;
    }
  };

  getNodeType = function(rowIdx, colIdx) {
    // The name of each node (S, O, A, M)
    if (rowIdx == 0) {
      return "w";
    } else if (rowIdx == 1) {
      return colIdx % 2 == 0 ? "a" : "o";
    } else {
      return "h";
    }
  };

  getTimeStepText = function(rowIdx, colIdx) {
    // The subscript of each node indicating the timestep
    if (rowIdx == 0 || rowIdx == 2) {
      return colIdx == 0 ? "t" : "t+" + colIdx;
    } else {
      // Middle row has both Observations and actions
      return colIdx < 2 ? "t" : "t+" + Math.floor(colIdx / 2);
    }
  };

  getNodeLabel = function(i, j) {
    const rowIdx = parseInt(i);
    const colIdx = parseInt(j);
    const subscript = `<tspan dy='5' font-size='.7em'>${this.getTimeStepText(rowIdx, colIdx)}</tspan>`;
    return this.getNodeType(rowIdx, colIdx) + subscript;
  };

  getCircDelay = function(i, j) {
    const rowIdx = parseInt(i);
    const colIdx = parseInt(j);
    // Get the time delay for each node to appear
    if (rowIdx == 2) {
      return 4 * colIdx * this.arrowSpeed;
    } else if (rowIdx == 1) {
      return 2 * colIdx * this.arrowSpeed + this.arrowSpeed;
    } else {
      return 4 * colIdx * this.arrowSpeed + 2 * this.arrowSpeed;
    }
  };

  getArrowDelay = function(i) {
    // At every 2nd delay (of time arrowSpeed), two arrows should fire at the same time.
    // Must handle env-1->env and hx-1->hx transitions to fire the same time as
    // act->env and obs->hx, respectively.
    const idx = parseInt(i);
    return this.arrowSpeed + (idx - Math.floor((idx + 1) / 3)) * this.arrowSpeed;
  };

  circlePairs = function() {
    // An array of coordinate pairs indicating the centre of circles to be joined with an arrow
    // Add an empty env node on the top so we can draw arrows from an assumed previous timestep
    const topRow = [
      [this.nodePos.x - this.radius*2, this.nodePos.y - 2*this.nodePos.dy],
      ...this.data[0].coords
    ];
    const middleRow = [...this.data[1].coords];
    const bottomRow = [...this.data[2].coords];
    let arr = [];
    for (let i = 0; i < this.numTimesteps-1; i++) {
      // Connect mem with action
      arr.push(this.shortenedPath([bottomRow[0], middleRow[0]]));
      // Connect action with env
      arr.push(this.shortenedPath([middleRow.shift(), topRow[1]]));
      // Connect env-1 with env
      arr.push(this.shortenedPath([topRow.shift(), topRow[0]]));
      // Connect env with obs
      arr.push(this.shortenedPath([topRow[0], middleRow[0]]));
      // Connect obs with mem
      arr.push(this.shortenedPath([middleRow.shift(), bottomRow[1]]));
      // Connect mem-1 with mem
      arr.push(this.shortenedPath([bottomRow.shift(), bottomRow[0]]));
    }
    return arr;
  };

  shortenedPath = function([a, b]) {
    // Takes the vectors representing the centre of two circles, and moves them closer together by
    // length=rad. Need this so that our arrowheads don't appear in the middle of the circles
    const dist = Math.sqrt((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2);
    const distRatio = (dist - this.radius) / dist;
    // Extra x and y values to add/subtract to original vectors
    const dx = ((b[0] - a[0]) - (b[0] - a[0]) * distRatio);
    const dy = ((b[1] - a[1]) - (b[1] - a[1]) * distRatio);
    // Make sure we move the coordinates in the right direction.
    const aNew = [a[0] + dx, a[1] + dy];
    const bNew = [b[0] - dx, b[1] - dy];
    return [aNew, bNew];
  };
};