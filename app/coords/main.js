
// Set the dimensions of the canvas / graph
var margin = {top: 30, right: 20, bottom: 30, left: 50},
    width = 600 - margin.left - margin.right,
    height = 270 - margin.top - margin.bottom;

// Parse the date / time
var parseDate = d3.time.format("%d-%b-%y").parse,
    formatDate = d3.time.format("%d-%b"),
    bisectDate = d3.bisector(function(d) { return d.date; }).left;

// Set the ranges
var x = d3.time.scale().range([0, width]);
var y = d3.scale.linear().range([height, 0]);

// Define the axes
var xAxis = d3.svg.axis().scale(x)
    .orient("bottom").ticks(5);

var yAxis = d3.svg.axis().scale(y)
    .orient("left").ticks(5);

// Adds the svg canvas
var svg = d3.select("body")
    .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr("transform",
              "translate(" + margin.left + "," + margin.top + ")");

var lineSvg = svg.append("g");

var focus = svg.append("g")
    .style("display", "block");

// Get the data
d3.csv("atad.csv", function(error, data) {
    data.forEach(function(d) {
        d.date = parseDate(d.date);
        d.close = +d.close;
    });

    // Scale the range of the data
    x.domain(d3.extent(data, function(d) { return d.date; }));
    y.domain([0, d3.max(data, function(d) { return d.close; })]);

    // Add the X Axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    // Add the Y Axis
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

   // append the x line
    focus.append("line")
        .attr("class", "x")
        .style("stroke", "blue")
        .style("stroke-dasharray", "3,3")
        .style("opacity", 0.5)
        .attr("y1", 0)
        .attr("y2", height);

    // append the y line
    focus.append("line")
        .attr("class", "y")
        .style("stroke", "blue")
        .style("stroke-dasharray", "3,3")
        .style("opacity", 0.5)
        .attr("x1", 0)
        .attr("x2", width);

    // append the circle at the intersection
    focus.append("circle")
        .attr("class", "y")
        .style("fill", "none")
        .style("stroke", "blue")
        .attr("r", 4);

    // place the value at the intersection
    // focus.append("text")
    //     .attr("class", "y1")
    //     .style("stroke", "white")
    //     .style("stroke-width", "3.5px")
    //     .style("opacity", 0.8)
    //     .attr("dx", 8)
    //     .attr("dy", "-.3em");

    focus.append("text")
        .attr("class", "y2")
        .attr("dx", 8)
        .attr("dy", "-.3em");

    // place the date at the intersection
    // focus.append("text")
    //     .attr("class", "y3")
    //     .style("stroke", "white")
    //     .style("stroke-width", "3.5px")
    //     .style("opacity", 0.8)
    //     .attr("dx", 8)
    //     .attr("dy", "1em");

    focus.append("text")
        .attr("class", "y4")
        .attr("dx", 8)
        .attr("dy", "1em");

    // append the rectangle to capture mouse
    svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .style("fill", "none")
        .style("pointer-events", "all")
        .on("mouseover", function() { focus.style("display", null); })
        // .on("mouseout", function() { focus.style("display", "none"); })
        .on("mousemove", mousemove);

    function mousemove() {
		var x0 = x.invert(d3.mouse(this)[0]),
		    i = bisectDate(data, x0, 1),
		    d0 = data[i - 1],
		    d1 = data[i],
            d = x0 - d0.date > d1.date - x0 ? d1 : d0;

		focus.select("circle.y")
		    .attr("transform", "translate(" + d3.mouse(this)[0] + "," + d3.mouse(this)[1] + ")");

		// focus.select("text.y1")
		//     .attr("transform",
		//           "translate(" + x(d.date) + "," +
		//                          y(d.close) + ")")
		//     .text(d.close);

		focus.select("text.y2")
		    .attr("transform", "translate(" + d3.mouse(this)[0] + "," + d3.mouse(this)[1] + ")")
		    .text(y.invert(d3.mouse(this)[1]));

		// focus.select("text.y3")
		//     .attr("transform",
		//           "translate(" + x(d.date) + "," +
		//                          y(d.close) + ")")
		//     .text(formatDate(d.date));

		focus.select("text.y4")
		    .attr("transform", "translate(" + d3.mouse(this)[0] + "," + d3.mouse(this)[1] + ")")
		    .text(formatDate(d.date));

		focus.select(".x")
		    .attr("transform", "translate(" + d3.mouse(this)[0] + ", " + d3.mouse(this)[1] + ")")
		    .attr("y2", height - d3.mouse(this)[1]);

		focus.select(".y")
            .attr("transform", "translate(0, " + d3.mouse(this)[1] + ")")
            .attr("x2", width - (width - d3.mouse(this)[0]));
	}

});
