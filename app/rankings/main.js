// const season = 'ligue1-2019_2020';
const season = 'firstleague-2019_2020';

const seasons = [
    {
        id: 'ligue1-2019_2020',
        toAdd: true
    },
    {
        id: 'firstleague-2019_2020',
        toAdd: false
    }
]

let generateTeamsList = (teams, season) => {

    var DOM = '<ul class="teams" id="season-' + season.id + '">'
    DOM += '<li class="all">'
    DOM += '<label>'
    DOM += '<input class="select_team" type="checkbox" value="all" checked/>'
    DOM += '<span>'
    DOM += 'All'
    DOM += '</span>'
    DOM += '</label>'
    DOM += '</li>'
    for (const team of teams) {
        DOM += '<li>'
        DOM += '<label>'
        DOM += '<input class="select_team" type="checkbox" value="'+ team.acr +'" checked/>'
        DOM += '<span>'
        DOM += team.short_name
        DOM += '</span>'
        DOM += '</label>'
        DOM += '</li>'
    }
    DOM += '</ul>'

    const container = document.querySelector('#seasons-teams');
    container.insertAdjacentHTML( 'beforeend', DOM );

    const select_teamInputs = document.querySelectorAll('.select_team');

    const updateChartEls = (isChecked, els) => {
        for (const el of els) {
            let action = isChecked ? 'remove' : 'add'
            el.classList[action]('hidden')
        }
    }

    for (const select_teamInput of select_teamInputs) {
        select_teamInput.addEventListener('change', (event) => {

            if(event.srcElement.value === 'all') {
                let groupTeamInputs = event.srcElement.parentElement.parentElement.parentElement.querySelectorAll('.select_team');
                for (const groupTeamInput of groupTeamInputs) {
                    groupTeamInput.checked = (event.target.checked) ? true : false
                }

                var allChartEls = document.querySelectorAll('.line-group, .circles-group');
                updateChartEls(event.target.checked, allChartEls);
                return;
            }

            var teamChartEls = document.querySelectorAll('.team-' + event.srcElement.value);
            updateChartEls(event.target.checked, teamChartEls);
        })
    }
}

let generateChart = (championship, championshipTeams) => {

    function getTeamProp(team, prop) {
        return championshipTeams.find(t => t.acr === team.id)[prop]
    }

    function showCurrentScore(datum, d) {
        let teamsGame = [getTeamProp(datum, 'short_name'), getTeamProp(championship.teams.find(t => d.opponent === t.id), 'short_name')]
        let scoresGame = [d.goals_scored, d.goals_taken]
        let teamDom = (d.location === 'dom') ? teamsGame[0] : teamsGame[1];
        let teamExt = (d.location === 'dom') ? teamsGame[1] : teamsGame[0];
        let scoreDom = (d.location === 'dom') ? scoresGame[0] : scoresGame[1];
        let scoreExt = (d.location === 'dom') ? scoresGame[1] : scoresGame[0];
        return teamDom + ' ' + scoreDom + ' - ' + scoreExt + ' ' + teamExt
    }

    let chartMargin = 50;
    let chartWidth = parseInt(d3.select("#evolution").style("width"));

    let windowsHeight = window.innerHeight;
    let chartHeight = (chartWidth * 10 / 16 > windowsHeight) ? windowsHeight : chartWidth * 10 / 16;
    let duration = 250;

    let lineOpacity = "1";
    let lineOpacityHover = "1";
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
    .attr("height", chartHeight)
    .append('g')
    .attr("transform", `translate(${chartMargin}, ${chartMargin})`);

    let chartXScale = d3.scaleLinear()
    .range([0, chartWidth - (chartMargin * 2)])
    .domain([1, d3.max(championship.teams, team => d3.max(team.games, d => d.day))])

    let chartYScale = d3.scaleLinear()
    .domain([0, d3.max(championship.teams, team => d3.max(team.games, d => d.points))])
    .range([chartHeight - (chartMargin * 2), 0]);

    /* Apply axis */
    let xAxis = d3.axisBottom(chartXScale).ticks(d3.max(championship.teams, team => d3.max(team.games, d => d.day)) - 1);
    let yAxis = d3.axisLeft(chartYScale).ticks(8);

    svg.append("g")
    .attr("class", "x axis")
    .attr("transform", `translate(0, ${chartHeight - (chartMargin * 2)})`)
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
    .x(d => chartXScale(d.day))
    .y(d => chartYScale(d.points))
    .curve(d3.curveMonotoneX);

    let lines = svg.append('g')
    .attr('class', 'lines');

    lines.selectAll('.line-group')
    .data(championship.teams).enter()
    .append('g')
    .attr('class', function(d) {return 'line-group team-' + d.id})
    .on("mouseover", function(d, i) {
        svg.append("text")
        .attr("class", "title-text")
        .style("fill", getTeamProp(d, 'color'))
        .text(getTeamProp(d, 'nice_name'))
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
    .style('stroke', (d) => getTeamProp(d, 'color'))
    .style('opacity', lineOpacity)
    .style("stroke-width", lineStroke)
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
    .data(championship.teams).enter()
    .append("g")
    .style("fill", (d, i) => getTeamProp(d, 'color'))
    .attr("class", d =>  ('circles-group team-' + d.id))
    .selectAll("circle")
    .data(d => d.games).enter()
    .append("g")
    .on("mouseover", function(d) {

        svg.append("text")
        .attr("class", "day-text")
        .style("fill", getTeamProp(d3.select(this.parentNode).datum(), 'color'))
        .attr("text-anchor", "middle")
        .text(d.day + ' day')
        .attr("x", (chartWidth - chartMargin) / 2)
        .attr("y", 10);

        svg.append("text")
        .attr("class", "title-text")
        .style("fill", getTeamProp(d3.select(this.parentNode).datum(), 'color'))
        .attr("text-anchor", "middle")
        .text(showCurrentScore(d3.select(this.parentNode).datum(), d))
        .attr("x", (chartWidth - chartMargin) / 2)
        .attr("y", 30);

        d3.select(this)
        .style("cursor", "pointer")
        .append("text")
        .attr("class", "text")
        .text('Pts: ' + d.points)
        .attr("text-anchor", "middle")
        .attr("x", d => chartXScale(d.day))
        .attr("y", d => chartYScale(d.points) - 15);
    })
    .on("mouseout", function(d) {
        svg.select(".title-text").remove();
        svg.select(".day-text").remove();
        d3.select(this)
        .style("cursor", "none")
        .selectAll(".text").remove();
    })
    .append("circle")
    .attr("class", "circle")
    .attr("cx", d => chartXScale(d.day))
    .attr("cy", d => chartYScale(d.points))
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
        let windowsHeight = window.innerHeight;
        let chartHeight = (chartWidth * 10 / 16 > windowsHeight) ? windowsHeight : chartWidth * 10 / 16;

        // Update the range of the scale with new width/height
        chartXScale.range([0, chartWidth - (chartMargin * 2)]);
        chartYScale.range([chartHeight - (chartMargin * 2), 0]);

        d3.select('#evolution svg').attr("width", chartWidth)
        d3.select('#evolution svg').attr("height", chartHeight)

        // Update the axis and text with the new scale
        svg.select('.x.axis')
        .attr("transform", `translate(0, ${chartHeight - (chartMargin * 2)})`)
        .call(xAxis);

        svg.select('.y.axis')
        .call(yAxis);

        // Force D3 to recalculate and update the line
        svg.selectAll('.line')
        .attr('d', d => line(d.games))

        svg.selectAll('.circle')
        .attr("cx", d => chartXScale(d.day))
        .attr("cy", d => chartYScale(d.points))

        svg.selectAll('.x .label').attr("x", chartWidth - (chartMargin * 2)  - 15)


    };

    // Call the resize function whenever a resize event occurs
    d3.select(window).on('resize', resize);

}

async function generateApp() {

    for (const season of seasons) {

        let championshipTeamsRes = await fetch('data/dest/' + season.id + '-teams.json')
        .then(response => response.json());
        let championshipTeams = championshipTeamsRes.teams;

        if(season.toAdd) {
            let championship = await fetch('data/dest/' + season.id + '-teams_score.json')
            .then(response => response.json());

            generateChart(championship, championshipTeams);
        }

        generateTeamsList(championshipTeams, season)
    }
}

generateApp();