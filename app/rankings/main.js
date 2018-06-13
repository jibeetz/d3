const url = 'rankings.json';

d3.json(url, function (teams) {
    generateChart(teams);
});

let generateChart = (teams) => {

    let chartMargin = 50;
    let chartMarginTop = 200;
    let chartWidth = parseInt(d3.select("#evolution").style("width"));
    let chartHeight = parseInt(d3.select("#evolution").style("height"));
    let duration = 250;

    let lineOpacity = "0.25";
    let lineOpacityHover = "0.85";
    let otherLinesOpacityHover = "0.1";
    let lineStroke = "1.5px";
    let lineStrokeHover = "2.5px";

    let circleOpacity = '0.85';
    let circleOpacityOnLineHover = "0.25"
    let circleRadius = 3;
    let circleRadiusHover = 6;

    /* Add SVG */
    let svg = d3.select("#evolution").append("svg")
    .attr("width", chartWidth)
    .attr("height", chartHeight - chartMarginTop)
    .append('g')
    .attr("transform", `translate(${chartMargin}, ${chartMargin})`);

    let chartXScale = d3.scaleLinear()
    .range([0, chartWidth - (chartMargin * 2)])
    .domain([0, d3.max(teams, team => d3.max(team.games, d => d.number))])

    let chartYScale = d3.scaleLinear().domain([0, 1000]).range([chartHeight - chartMarginTop - (chartMargin * 2), 0]);

    /* Apply axis */
    let xAxis = d3.axisBottom(chartXScale).ticks(chartWidth / 25);
    let yAxis = d3.axisLeft(chartYScale).ticks(8);

    svg.append("g")
    .attr("class", "x axis")
    .attr("transform", `translate(0, ${chartHeight - chartMarginTop - (chartMargin * 2)})`)
    .call(xAxis)
    .append('text')
    .attr("class", "label")
    .attr("y", 35)
    .attr("x", chartWidth - (chartMargin * 2) - 15)
    .attr("fill", "#000")
    .text("Games");

    svg.append("g")
    .attr("class", "y axis")
    .call(yAxis)
    .append('text')
    .attr("y", -15)
    .attr("x", 0)
    .attr("fill", "#000")
    .text("‰");

    /* Apply lines */
    var line = d3.line()
    .x(d => chartXScale(d.number))
    .y(d => chartYScale(d.avg))
    .curve(d3.curveCardinal);

    let lines = svg.append('g')
    .attr('class', 'lines');

    lines.selectAll('.line-group')
    .data(teams).enter()
    .append('g')
    .attr('class', 'line-group')
    .on("mouseover", function(d, i) {
        svg.append("text")
        .attr("class", "title-text")
        .style("fill", d.meta.color)
        .text(d.meta.team_nice_name)
        .attr("text-anchor", "middle")
        .attr("x", (chartWidth - chartMargin) / 2)
        .attr("y", 5);
    })
    .on("mouseout", function(d) {
        svg.select(".title-text").remove();
    })
    .append('path')
    .attr('class', 'line')
    .attr('d', d => line(d.games))
    .style('stroke', (d) => d.meta.color)
    .style('opacity', lineOpacity)
    .on("mouseover", function(d) {
        d3.selectAll('.line')
        .style('opacity', otherLinesOpacityHover);
        d3.selectAll('.circle')
        .style('opacity', circleOpacityOnLineHover);
        d3.select(this)
        .style('opacity', lineOpacityHover)
        .style("stroke-width", lineStrokeHover)
        .style("cursor", "pointer");
    })
    .on("mouseout", function(d) {
        d3.selectAll(".line")
        .style('opacity', lineOpacity);
        d3.selectAll('.circle')
        .style('opacity', circleOpacity);
        d3.select(this)
        .style("stroke-width", lineStroke)
        .style("cursor", "none");
    });

    /* Add circles in the line */
    lines.selectAll("circle-group")
    .data(teams).enter()
    .append("g")
    .style("fill", (d, i) => d.meta.color)
    .selectAll("circle")
    .data(d => d.games).enter()
    .append("g")
    .on("mouseover", function(d) {

        svg.append("text")
        .attr("class", "title-text")
        .style("fill", d3.select(this.parentNode).datum().meta.color)
        .text(d3.select(this.parentNode).datum().meta.team_nice_name)
        .attr("text-anchor", "middle")
        .attr("x", (chartWidth - chartMargin) / 2)
        .attr("y", 5);

        d3.select(this)
        .style("cursor", "pointer")
        .append("text")
        .attr("class", "text")
        .text(Math.round(`${d.avg}` * 100) / 100)
        .attr("x", d => chartXScale(d.number) + 5)
        .attr("y", d => chartYScale(d.avg) - 10);
    })
    .on("mouseout", function(d) {
        svg.select(".title-text").remove();
        d3.select(this)
        .style("cursor", "none")
        .transition()
        .duration(duration)
        .selectAll(".text").remove();
    })
    .append("circle")
    .attr("class", "circle")
    .attr("cx", d => chartXScale(d.number))
    .attr("cy", d => chartYScale(d.avg))
    .attr("r", circleRadius)
    .style('opacity', circleOpacity)
    .on("mouseover", function(d) {
        d3.select(this)
        .transition()
        .duration(duration)
        .attr("r", circleRadiusHover);
    })
    .on("mouseout", function(d) {
        d3.select(this)
        .transition()
        .duration(duration)
        .attr("r", circleRadius);
    });

    function resize() {
        let chartWidth = parseInt(d3.select("#evolution").style("width"));
        let chartHeight = parseInt(d3.select("#evolution").style("height"));

        // Update the range of the scale with new width/height
        chartXScale.range([0, chartWidth - (chartMargin * 2)]);
        chartYScale.range([chartHeight - chartMarginTop - (chartMargin * 2), 0]);

        d3.select('#evolution svg').attr("width", chartWidth)
        d3.select('#evolution svg').attr("height", chartHeight - chartMarginTop)

        // Update the axis and text with the new scale
        svg.select('.x.axis')
        .attr("transform", `translate(0, ${chartHeight - chartMarginTop - (chartMargin * 2)})`)
        .call(xAxis);

        svg.select('.y.axis')
        .call(yAxis);

        // Force D3 to recalculate and update the line
        svg.selectAll('.line')
        .attr('d', d => line(d.games))

        svg.selectAll('.circle')
        .attr("cx", d => chartXScale(d.number))
        .attr("cy", d => chartYScale(d.avg))

        svg.selectAll('.x .label').attr("x", chartWidth - (chartMargin * 2)  - 15)

        // // Update the tick marks
        xAxis.ticks(Math.max(chartWidth / 25));

    };

    // Call the resize function whenever a resize event occurs
    d3.select(window).on('resize', resize);

}