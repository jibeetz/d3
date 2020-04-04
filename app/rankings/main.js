// const season = 'ligue1-2019_2020';
// const season = 'firstleague-2019_2020';



let generateTeamsList = (teams, season) => {

    let isChecked = (season.toAdd) ? 'checked' : '';

    var DOM = '<ul class="teams" id="season-' + season.id + '">'
    DOM += '<li class="all">'
    DOM += '<label>'
    DOM += '<input class="select_team" type="checkbox" value="all" ' + isChecked + '/>'
    DOM += '<span>'
    DOM += 'All'
    DOM += '</span>'
    DOM += '</label>'
    DOM += '</li>'
    for (const team of teams) {
        DOM += '<li>'
        DOM += '<label>'
        DOM += '<input class="select_team" type="checkbox" value="'+ team.acr +'" ' + isChecked + '/>'
        DOM += '<span>'
        DOM += team.short_name
        DOM += '</span>'
        DOM += '</label>'
        DOM += '</li>'
    }
    DOM += '</ul>'

    const container = document.querySelector('#seasons-teams');
    container.insertAdjacentHTML( 'beforeend', DOM );

    const seasonContainer = document.querySelector('.teams#season-' + season.id)
    const select_teamInputs = seasonContainer.querySelectorAll('.select_team');

    const updateChartEls = (isChecked, els) => {

        if(els.length === 0) {



            return;
        }

        for (const el of els) {
            let action = isChecked ? 'remove' : 'add'
            el.classList[action]('hidden')
        }
    }

    for (const select_teamInput of select_teamInputs) {
        select_teamInput.addEventListener('change', (event) => {

            let chartEls = [];

            if(event.srcElement.value === 'all') {
                let groupTeamInputs = event.srcElement.parentElement.parentElement.parentElement.querySelectorAll('.select_team');
                for (const groupTeamInput of groupTeamInputs) {
                    groupTeamInput.checked = (event.target.checked) ? true : false
                }

                chartEls = document.querySelectorAll('.line-group.season-' + season.id + ', .circles-group.season-' + season.id);
            } else {
                chartEls = document.querySelectorAll('.team-' + event.srcElement.value);
            }

            updateChartEls(event.target.checked, chartEls);
        })
    }
}

let generateChart = (teams, infoAllTeams) => {

    function getCurrentChartWidth() {
        return parseInt(d3.select("#evolution").style("width"));
    }

    function setChartHeight(chartWidth) {
        let windowsHeight = window.innerHeight;
        return (chartWidth * 10 / 16 > windowsHeight) ? windowsHeight : chartWidth * 10 / 16;
    }

    function getTeamProp(team, prop) {
        return infoAllTeams.find(t => t.acr === team.id)[prop]
    }

    function showCurrentScore(datum, d) {
        let teamsGame = [getTeamProp(datum, 'short_name'), getTeamProp(teams.find(t => d.opponent === t.id), 'short_name')]
        let scoresGame = [d.goals_scored, d.goals_taken]
        let teamDom = (d.location === 'dom') ? teamsGame[0] : teamsGame[1];
        let teamExt = (d.location === 'dom') ? teamsGame[1] : teamsGame[0];
        let scoreDom = (d.location === 'dom') ? scoresGame[0] : scoresGame[1];
        let scoreExt = (d.location === 'dom') ? scoresGame[1] : scoresGame[0];
        return teamDom + ' ' + scoreDom + ' - ' + scoreExt + ' ' + teamExt
    }

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

    let chartWidth = getCurrentChartWidth();
    let chartHeight = setChartHeight(chartWidth);

    /* Add SVG */
    let svg = d3.select("#evolution").append("svg")
    .attr("width", chartWidth)
    .attr("height", chartHeight);

    let chartXScale = d3.scaleLinear()
    .range([0, chartWidth - 70])

    let chartYScale = d3.scaleLinear()
    .range([chartHeight - 70, 0])

    let lines = svg.append('g')
    .attr('class', 'lines')
    .attr("transform", `translate(30, 30)`)

    chartXScale.domain([1, d3.max(teams, team => d3.max(team.games, d => d.day))])
    chartYScale.domain([0, d3.max(teams, team => d3.max(team.games, d => d.points))])

    /* Apply axis */
    let xAxis = d3.axisBottom(chartXScale).ticks(d3.max(teams, team => d3.max(team.games, d => d.day)) - 1);
    let yAxis = d3.axisLeft(chartYScale).ticks(8);

    /* Apply lines */
    var line = d3.line()
    .x(d => chartXScale(d.day))
    .y(d => chartYScale(d.points))
    .curve(d3.curveMonotoneX);

    svg.append("g")
    .attr("class", "x axis")
    .attr("transform", `translate(30, ${chartHeight - 40})`)
    .call(xAxis)
    .append('text')
    .attr("class", "label")
    .attr("fill", "#000")
    .attr("y", 35)
    .attr("x", chartWidth - 80)
    .text("Days");

    svg.append("g")
    .attr("class", "y axis")
    .attr("transform", `translate(30, 30)`)
    .call(yAxis)
    .append('text')
    .attr("y", -5)
    .attr("x", 0)
    .attr("fill", "#000")
    .text("Points");

    lines.selectAll('.line-group')
    .data(teams).enter()
    .append('g')
    .attr('class', function(d) {
        return 'line-group season-' + d.season + ' team-' + d.id})
    .on("mouseover", function(d, i) {
        svg.append("text")
        .attr("class", "title-text")
        .style("fill", getTeamProp(d, 'color'))
        .text(getTeamProp(d, 'nice_name'))
        .attr("text-anchor", "middle")
        .attr("x", getCurrentChartWidth() / 2)
        .attr("y", 42);
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
    .data(teams).enter()
    .append("g")
    .style("fill", (d, i) => getTeamProp(d, 'color'))
    .attr("class", d =>  ('circles-group season-' + d.season + ' team-' + d.id))
    .selectAll("circle")
    .data(d => d.games).enter()
    .append("g")
    .on("mouseover", function(d) {

        svg.append("text")
        .attr("class", "day-text")
        .style("fill", getTeamProp(d3.select(this.parentNode).datum(), 'color'))
        .attr("text-anchor", "middle")
        .text('Day ' + d.day)
        .attr("x", getCurrentChartWidth() / 2)
        .attr("y", 42);

        svg.append("text")
        .attr("class", "title-text")
        .style("fill", getTeamProp(d3.select(this.parentNode).datum(), 'color'))
        .attr("text-anchor", "middle")
        .text(showCurrentScore(d3.select(this.parentNode).datum(), d))
        .attr("x", getCurrentChartWidth() / 2)
        .attr("y", 62);

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
        let chartWidth = getCurrentChartWidth();
        let chartHeight = setChartHeight(chartWidth);

        // Update the range of the scale with new width/height
        chartXScale.range([0, chartWidth - 70]);
        chartYScale.range([chartHeight - 70, 0]);

        d3.select('#evolution svg').attr("width", chartWidth)
        d3.select('#evolution svg').attr("height", chartHeight)

        // Update the axis and text with the new scale
        svg.select('.x.axis')
        .attr("transform", `translate(30, ${chartHeight - 40})`)
        .call(xAxis);

        svg.select('.y.axis')
        .call(yAxis);

        // Force D3 to recalculate and update the line
        svg.selectAll('.line')
        .attr('d', d => line(d.games))

        svg.selectAll('.circle')
        .attr("cx", d => chartXScale(d.day))
        .attr("cy", d => chartYScale(d.points))

        svg.selectAll('.x .label').attr("x", chartWidth - 80)

    };

    // Call the resize function whenever a resize event occurs
    d3.select(window).on('resize', resize);

}

async function generateApp(seasons) {

    let infoAllTeams = [];
    let teams = [];

    for (const season of seasons) {

        let championshipInfoTeamsRes = await fetch('data/dest/' + season.id + '-teams.json')
        .then(response => response.json());
        let infoTeams = championshipInfoTeamsRes.teams;

        infoTeams = infoTeams.map(t => {
            t.ligue = season.id.split('-')[0]
            return t
        })

        infoAllTeams = [...infoAllTeams, ...infoTeams]

        if(season.toAdd) {
            let championship = await fetch('data/dest/' + season.id + '-teams_score.json')
            .then(response => response.json());

            championship.teams = championship.teams.map(t => {
                t.season = season.id
                return t
            })

            teams = [...teams, ...championship.teams]
        }

        generateTeamsList(infoTeams, season)
    }

    console.log('teams', teams);
    console.log('infoAllTeams', infoAllTeams);

    generateChart(teams, infoAllTeams);
}

const seasons = [
    {
        id: 'ligue1-2019_2020',
        toAdd: true
    },
    {
        id: 'firstleague-2019_2020',
        toAdd: true
    }
]

generateApp(seasons);