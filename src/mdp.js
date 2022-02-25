const d3 = require("d3");

export function createMDP(tagId) {
  const numTimesteps = 3
  const spaceBetween = 200
  const radius = 20
  const arrowSpeed = 1200
  const loopSpeed = 15000
  // Uses color palette 0.2.7 light from
  // https://cran.r-project.org/web/packages/khroma/vignettes/tol.html
  const colour = {env: "#44BB99", obs: "#EEDD88", act: "#EE8866", mem: "#77AADD"}
  // Position of legend
  const legBox = {x: 50, y: 80}
  const width = 1000
  const height = 250

  // Create the svg
  const svg = d3.select(tagId).append("svg:svg")
      .attr("width", width)
      .attr("height", height)

  // The coordinates for the circles in each row
  const data = [
    {row: "top", coords: d3.range(numTimesteps).map(x => [250 + x*spaceBetween, 40])},
    {row: "middle", coords: d3.range(numTimesteps+1).map(x => [300 + x*(spaceBetween/2), 120])},
    {row: "bottom", coords: d3.range(numTimesteps-1).map(x => [350 + x*(spaceBetween), 200])}
  ]

  const getFill = function(rowIdx, colIdx) {
    // Get the colour of each node
    if (rowIdx == 0) {
      return colour.env
    } else if (rowIdx == 1) {
      return colIdx % 2 == 0 ? colour.obs : colour.act
    } else {
      return colour.mem
    }
  }
  const getCircDelay = function(rowIdx, colIdx) {
    // Get the time delay for each node to appear
    if (rowIdx == 0) {
      return 4 * colIdx * arrowSpeed
    } else if (rowIdx == 1) {
      return 2 * colIdx * arrowSpeed + arrowSpeed
    } else {
      return 4 * colIdx * arrowSpeed + 2 * arrowSpeed
    }
  }
  const getArrowDelay = function(idx) {
    // Add delay so arrows don't all start at once.
    // Must manually handle env->env and hx->hx transitions to fire the same time as act->env and obs->hx, respectively.
    // Starting from the 4th node, every 3rd arrow should occur at the same time as the previous arrow.
    return arrowSpeed + (idx - Math.floor(Math.max(0, idx-1)/3)) * arrowSpeed
  }
  const getNodeType = function(rowIdx, colIdx) {
    // The name of each node (S, O, A, M)
    if (rowIdx == 0) {
      return "w"
    } else if (rowIdx == 1) {
      return colIdx % 2 == 0 ? "o" : "a"
    } else {
      return "h"
    }
  }
  const getTimeStep = function(rowIdx, colIdx) {
    // The subscript of each node indicating the timestep
    if (rowIdx == 0 || rowIdx == 2) {
      return colIdx == 0 ? "t" : "t+" + colIdx
    } else {
      // Middle row has both Observations and actions
      return colIdx < 2 ? "t" : "t+" + Math.floor(colIdx / 2)
    }
  }
  // The text is writting in html with <sub> tags for the timestep subscript. Using multiple "text" tags and styling them differently
  // turned out to be much messier
  const getText = (rowIdx, colIdx) => getNodeType(rowIdx, colIdx) + "<sub>" + getTimeStep(rowIdx, colIdx) + "</sub>"
  const getTextPosition = function(rowIdx, colIdx, d) {
    if (colIdx == 0 || (rowIdx == 1 && colIdx == 1)) {
      return d[0] - radius * (2/5)
    } else {
      return d[0] - radius * (3/4)
    }
  }

  const circles = svg
    .selectAll("circle")
    .data(data)
    .enter()
    .append("g")
      // h/t Zim https://stackoverflow.com/questions/38233003/d3-js-v4-how-to-access-parent-groups-datum-index
      .attr("circle-row", (_, i) => i) // the row number available from DOM
    .selectAll("circle")
    .data(function(d){
      return d.coords;
    })
    .enter()
    .append("circle")
      .attr("cx", d => d[0])
      .attr("cy", d => d[1])
      .attr("r", d => radius)
      .attr("circle-col", function (_, j){return j}) // the col number available from DOM
      // Need the index of the parent
      .attr("fill", function (_,i){return getFill(this.parentNode.getAttribute("circle-row"), i)})
      .style("opacity", 0)
      .transition()
      .delay(function(_,i){return getCircDelay(this.parentNode.getAttribute("circle-row"), i)})
      .on("start", function repeat() {
        d3.active(this)
            .duration(arrowSpeed)
            .style("opacity", 1)
          .transition()
            .delay(function(){return loopSpeed - getCircDelay(this.parentNode.getAttribute("circle-row"), this.getAttribute("circle-col"))})
            .style("opacity", 0)
          .transition()
            .delay(function(){return 500 + getCircDelay(this.parentNode.getAttribute("circle-row"), this.getAttribute("circle-col"))})
            .on("start", repeat);
      });
    
  // // Manually places text based on x and y coords.
  // // TODO: Place according to the circle
  let text = svg.append("g")
    .selectAll("foreignObject")
    .data(data)
    .enter()
    .append("g")
      // h/t Zim https://stackoverflow.com/questions/38233003/d3-js-v4-how-to-access-parent-groups-datum-index
      .attr("circle-row", function(_, i) {return i}) // make parent index (row number) available from DOM
    .selectAll("foreignObject")
    .data(function(d){
      return d.coords;
    })
    .enter()
    .append("foreignObject")
      .attr("circle-col", function(_, j){return j}) // the col number available from DOM
      .attr("width", width)
      .attr("height", height)
      .attr("x", function(d,i){return getTextPosition(this.parentNode.getAttribute("circle-row"), i, d)})
      .attr("y", d => d[1] - radius * (3/4))
      .attr("font-size", d => radius * (3/4)) //font size
      .attr("font-weight", "bold")
      .attr("id", "nodeText")
      .style("opacity", 1)
    // Insert html as opposed to text as we wish to write e.g. S_t with a subscript
    .append("xhtml:body")
      .html(function (_,i){return getText(this.parentNode.parentNode.getAttribute("circle-row"), i)})
      .attr("id", "nodeText")
      .style("opacity", 0)
      .transition()
      .delay(function(_,i){return getCircDelay(this.parentNode.parentNode.getAttribute("circle-row"), i)})
      .on("start", function repeat() {
        d3.active(this)
            .duration(arrowSpeed)
            .style("opacity", 1)
          .transition()
            .delay(function(){return loopSpeed - getCircDelay(this.parentNode.parentNode.getAttribute("circle-row"), this.parentNode.getAttribute("circle-col"))})
            // .duration(1000)
            .style("opacity", 0)
          .transition()
            .delay(function(){return 500 + getCircDelay(this.parentNode.parentNode.getAttribute("circle-row"), this.parentNode.getAttribute("circle-col"))})
            .on("start", repeat);
      });

  // Takes the vectors representing the centre of two circles, and moves them closer together by length=rad.
  // Need this so that our arrowheads don't appear in the middle of the circles
  let shortenedPath = function([a, b]) {
    const dist = Math.sqrt((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2);
    const distRatio = (dist - radius) / dist
    // Extra x and y values to add/subtract to original vectors
    const dx = ((b[0] - a[0]) - (b[0] - a[0]) * distRatio)
    const dy = ((b[1] - a[1]) - (b[1] - a[1]) * distRatio)
    // Make sure we move the coordinates in the right direction.
    const aNew = [a[0] + dx, a[1] + dy]
    const bNew = [b[0] - dx, b[1] - dy]
    return [aNew, bNew]
  };
  // An array of coordinate pairs indicating the centre of circles to be joined with an arrow
  let circlePairs = function() {
    const topRow = [...data[0].coords]
    const middleRow = [...data[1].coords]
    const bottomRow = [...data[2].coords]
    let arr = []
    for (let i = 0; i < numTimesteps-1; i++) {
      // Connect env with obs
      arr.push(shortenedPath([topRow[0], middleRow[0]]));
      if (i > 0) {
        // Connect obs with mem
        arr.push(shortenedPath([middleRow.shift(), bottomRow[1]]));
        // Connect previous mem with current mem (not done at the first timestep)
        arr.push(shortenedPath([bottomRow.shift(), bottomRow[0]]));
      } else {
        // Connect obs with mem
        arr.push(shortenedPath([middleRow.shift(), bottomRow[0]]));
      }
      // Connect mem with act
      arr.push(shortenedPath([bottomRow[0], middleRow[0]]));
      // Connect act with env
      arr.push(shortenedPath([middleRow.shift(), topRow[1]]));
      // Connect previous env with current env (not done at the first timestep)
      arr.push(shortenedPath([topRow.shift(), topRow[0]]));
    }
    return arr
  }();

  // Define the arrowhead marker variables
  const markerBoxWidth = 20;
  const markerBoxHeight = 20;
  // Let the arrowheads overlap with the line
  const refX = markerBoxWidth;
  const refY = markerBoxHeight / 2;
  const markerWidth = markerBoxWidth / 2;
  const markerHeight = markerBoxHeight / 2;
  const arrowPoints = [[0, 0], [0, 20], [20, 10]];

  // Draw arrowhead
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
    // .attr("d", "M 0 0 12 6 0 12 3 6")
    .style("fill", "black")

  // Draw line
  svg
    .selectAll("line")
    .data(circlePairs)
    .join("line")
      .attr("arrow-idx", function(_, i) { return i; })
      .attr("x1", d=>d[0][0])
      .attr("y1", d=>d[0][1])
      .attr("x2", d=>d[0][0])
      .attr("y2", d=>d[0][1])
      .transition()
      .delay((_,i) => getArrowDelay(i))
      .on("start", function repeat() {
        d3.active(this)
            .duration(arrowSpeed)
            .attr("x2", d=>d[1][0])
            .attr("y2", d=>d[1][1])
            .attr("stroke-width", 1)
            .attr("marker-end", "url(#arrow)")
            .attr("stroke", "black")
          .transition()
            .delay(function(){return loopSpeed - getArrowDelay(this.getAttribute("arrow-idx"))})
            .attr("x2", d=>d[0][0])
            .attr("y2", d=>d[0][1])
            .attr("marker-end", "none")
            .attr("stroke-width", 0)
          .transition()
            .delay(function(){return 500 + getArrowDelay(this.getAttribute("arrow-idx"))})
            .on("start", repeat);
      })

  // Legend (h/t https://www.d3-graph-gallery.com/graph/custom_legend.html)
  const legSpacing = 30
  svg.append("circle").attr("cx",legBox.x).attr("cy",legBox.y).attr("r", 6).style("fill", colour.env)
  svg.append("circle").attr("cx",legBox.x).attr("cy",legBox.y + legSpacing).attr("r", 6).style("fill", colour.obs)
  svg.append("circle").attr("cx",legBox.x).attr("cy",legBox.y + legSpacing*2).attr("r", 6).style("fill", colour.act)
  svg.append("circle").attr("cx",legBox.x).attr("cy",legBox.y + legSpacing*3).attr("r", 6).style("fill", colour.mem)
  svg.append("text").attr("x", legBox.x + 15).attr("y", legBox.y + 5).text("Environment").style("font-size", "15px").attr("alignment-baseline","middle")
  svg.append("text").attr("x", legBox.x + 15).attr("y", legBox.y + 5 + legSpacing).text("Observation").style("font-size", "15px").attr("alignment-baseline","middle")
  svg.append("text").attr("x", legBox.x + 15).attr("y", legBox.y + 5 + legSpacing*2).text("Action").style("font-size", "15px").attr("alignment-baseline","middle")
  svg.append("text").attr("x", legBox.x + 15).attr("y", legBox.y + 5 + legSpacing*3).text("Agent hidden state").style("font-size", "15px").attr("alignment-baseline","middle")

  return svg.node()
}