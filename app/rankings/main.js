// const season = 'ligue1-2019_2020';
// const season = 'firstleague-2019_2020';

let generateTeamsList = (infoTeams, season) => {

    let isChecked = (season.addToChart) ? 'checked' : '';

    var DOM = '<ul class="teams" id="season-' + season.id + '">'
    DOM += '<li class="all">'
    DOM += '<label>'
    DOM += '<input class="select_team" type="checkbox" value="all" ' + isChecked + '/>'
    DOM += '<span>'
    DOM += 'All'
    DOM += '</span>'
    DOM += '</label>'
    DOM += '</li>'
    for (const team of infoTeams) {
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

    const updateChartEls = async (event, els) => {

        if(els.length === 0 && event.target.checked) {

            let seasonStr = event.target.parentElement.parentElement.parentElement.getAttribute('id').replace('season-', '')

            let championshipToAdd = await fetch('data/dest/' + seasonStr + '-teams_score.json')
            .then(response => response.json());

            championshipToAdd.teams = championshipToAdd.teams.map(t => {
                t.season = season.id
                return t
            })

            let teamToAdd = championshipToAdd.teams.find(t => t.id === event.target.value)

            infoTeams = infoTeams.map(t => {
                t.ligue = season.id.split('-')[0]
                return t
            })

            let infoTeamToAdd = infoTeams.find(t => t.acr === event.target.value)

            console.log('infoTeamToAdd', infoTeamToAdd);
            console.log('teamToAdd', teamToAdd);

            return;
        }

        for (const el of els) {
            let action = event.target.checked ? 'remove' : 'add'
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

                chartEls = document.querySelectorAll('.line.season-' + season.id + ', .circles-group.season-' + season.id);
            } else {
                chartEls = document.querySelectorAll('.team-' + event.srcElement.value);
            }

            updateChartEls(event, chartEls);
        })
    }
}

let generateChart = {

    teams: [],
    infoAllTeams: [],

    duration: 250,
    circleRadius: 3,
    circleRadiusHover: 6,

    chartWidth: '',
    chartHeight: '',

    svg: null,
    chartXScale: null,
    chartHeight: null,
    lines: null,
    xAxis: null,
    yAxis: null,
    line: null,

    init: function(teams, infoAllTeams) {
        this.teams = teams
        this.infoAllTeams = infoAllTeams

        this.chartWidth = this.getCurrentChartWidth();
        this.chartHeight = this.setChartHeight(this.chartWidth);

        this.svg = d3.select("#evolution").append("svg")
        .attr("width", this.chartWidth)
        .attr("height", this.chartHeight);

        this.chartXScale = d3.scaleLinear()
        .range([0, this.chartWidth - 70])

        this.chartYScale = d3.scaleLinear()
        .range([this.chartHeight - 70, 0])

        this.lines = this.svg.append('g')
        .attr('class', 'lines')
        .attr("transform", `translate(30, 30)`)

        this.update();

        d3.select(window).on('resize', () => this.resize());
    },

    update: function() {

        let s = this;

        this.chartXScale.domain([1, d3.max(this.teams, team => d3.max(team.games, d => d.day))])
        this.chartYScale.domain([0, d3.max(this.teams, team => d3.max(team.games, d => d.points))])

        this.xAxis = d3.axisBottom(this.chartXScale).ticks(d3.max(this.teams, team => d3.max(team.games, d => d.day)) - 1);
        this.yAxis = d3.axisLeft(this.chartYScale).ticks(8);

        this.svg.append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(30, ${this.chartHeight - 40})`)
        .call(this.xAxis)
        .append('text')
        .attr("class", "label")
        .attr("fill", "#000")
        .attr("y", 35)
        .attr("x", this.chartWidth - 80)
        .text("Days");

        this.svg.append("g")
        .attr("class", "y axis")
        .attr("transform", `translate(30, 30)`)
        .call(this.yAxis)
        .append('text')
        .attr("y", -5)
        .attr("x", 0)
        .attr("fill", "#000")
        .text("Points");

        this.line = d3.line()
        .x(d => this.chartXScale(d.day))
        .y(d => this.chartYScale(d.points))
        .curve(d3.curveMonotoneX);

        this.lines.selectAll('.lines')
        .data(this.teams).enter()
        .append('path')
        .attr('class', function(d) {
            return 'line season-' + d.season + ' team-' + d.id})
        .attr('d', d => this.line(d.games))
        .style('stroke', (d) => this.getTeamProp(d, 'color'))
        .on("mouseover", function(d) {

            d3.selectAll('.line')
            .classed('line-hidden', true);

            d3.selectAll('.circles-group')
            .classed('circle-hidden', true);

            d3.select(this)
            .classed('active', true);

            d3.select('.circles-group.team-' + d.id)
            .classed('active', true);

            s.svg.append("text")
            .attr("class", "title-text")
            .style("fill", s.getTeamProp(d, 'color'))
            .text(s.getTeamProp(d, 'nice_name'))
            .attr("x", s.chartWidth / 2)
            .attr("y", 42);
        })
        .on("mouseout", function(d) {

            d3.selectAll(".line")
            .classed('line-hidden', false);

            d3.selectAll('.circles-group')
            .classed('circle-hidden', false);

            d3.select(this)
            .classed('active', false);

            d3.select('.circles-group.team-' + d.id)
            .classed('active', false);

            s.svg.select(".title-text").remove();
        });

        this.lines.selectAll("circle-group")
        .data(this.teams).enter()
        .append("g")
        .style("fill", (d, i) => s.getTeamProp(d, 'color'))
        .attr("class", d =>  ('circles-group season-' + d.season + ' team-' + d.id))
        .selectAll("circle")
        .data(d => d.games).enter()
        .append("circle")
        .attr("class", "circle")
        .attr("cx", d => this.chartXScale(d.day))
        .attr("cy", d => this.chartYScale(d.points))
        .attr("r", this.circleRadius)
        .on("mouseover", function(d) {

            d3.select(this)
            .transition()
            .duration(s.duration)
            .attr("r", s.circleRadiusHover);

            s.svg.append("text")
            .attr("class", "day-text")
            .style("fill", s.getTeamProp(d3.select(this.parentNode).datum(), 'color'))
            .text('Day ' + d.day)
            .attr("x", s.chartWidth / 2)
            .attr("y", 42);

            s.svg.append("text")
            .attr("class", "title-text")
            .style("fill", s.getTeamProp(d3.select(this.parentNode).datum(), 'color'))
            .text(s.showCurrentScore(d3.select(this.parentNode).datum(), d))
            .attr("x", s.chartWidth / 2)
            .attr("y", 62);

            d3.select(this.parentNode)
            .append("text")
            .attr("class", "text")
            .text('Pts: ' + d.points)
            .attr("x", d3.select(this).attr('cx'))
            .attr("y", d3.select(this).attr('cy') - 15);
        })
        .on("mouseout", function(d) {
            d3.select(this)
            .transition()
            .duration(s.duration)
            .attr("r", s.circleRadius);

            s.svg.select(".title-text").remove();
            s.svg.select(".day-text").remove();

            d3.select(this.parentNode)
            .selectAll(".text").remove();
        });
    },

    resize: function() {
        this.chartWidth = this.getCurrentChartWidth();
        this.chartHeight = this.setChartHeight(this.chartWidth);

        // Update the range of the scale with new width/height
        this.chartXScale.range([0, this.chartWidth - 70]);
        this.chartYScale.range([this.chartHeight - 70, 0]);

        d3.select('#evolution svg').attr("width", this.chartWidth)
        d3.select('#evolution svg').attr("height", this.chartHeight)

        // Update the axis and text with the new scale
        this.svg.select('.x.axis')
        .attr("transform", `translate(30, ${this.chartHeight - 40})`)
        .call(this.xAxis);

        this.svg.select('.y.axis')
        .call(this.yAxis);

        // Force D3 to recalculate and update the line
        this.svg.selectAll('.line')
        .attr('d', d => this.line(d.games))

        this.svg.selectAll('.circle')
        .attr("cx", d => this.chartXScale(d.day))
        .attr("cy", d => this.chartYScale(d.points))

        this.svg.selectAll('.x .label').attr("x", this.chartWidth - 80)

    },

    getCurrentChartWidth: function() {
        return parseInt(d3.select("#evolution").style("width"));
    },

    setChartHeight: function(chartWidth) {
        let windowsHeight = window.innerHeight;
        return (chartWidth * 10 / 16 > windowsHeight) ? windowsHeight : chartWidth * 10 / 16;
    },

    getTeamProp: function(team, prop) {
        return this.infoAllTeams.find(t => t.acr === team.id)[prop]
    },

    showCurrentScore: function(datum, d) {
        let teamsGame = [this.getTeamProp(datum, 'short_name'), this.getTeamProp(this.teams.find(t => d.opponent === t.id), 'short_name')]
        let scoresGame = [d.goals_scored, d.goals_taken]
        let teamDom = (d.location === 'dom') ? teamsGame[0] : teamsGame[1];
        let teamExt = (d.location === 'dom') ? teamsGame[1] : teamsGame[0];
        let scoreDom = (d.location === 'dom') ? scoresGame[0] : scoresGame[1];
        let scoreExt = (d.location === 'dom') ? scoresGame[1] : scoresGame[0];
        return teamDom + ' ' + scoreDom + ' - ' + scoreExt + ' ' + teamExt
    }
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

        if(season.addToChart) {
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

    generateChart.init(teams, infoAllTeams);
}

const seasons = [
    {
        id: 'ligue1-2019_2020',
        addToChart: true
    },
    {
        id: 'firstleague-2019_2020',
        addToChart: false
    }
]

generateApp(seasons);