const fetch = require("node-fetch")
const argv = require('yargs').argv
const fs = require('fs')
const util = require('util')
const readFile = util.promisify(fs.readFile)
const writeFile = util.promisify(fs.writeFile)
const access = util.promisify(fs.access)

const championships = {
    'firstleague' : 'championnat-d-angleterre',
    'ligue1' : 'ligue-1'
}

async function generateTeams(seasonId) {

    let seasonDataFile = await readFile('./app/rankings/data/src/' + seasonId + '.json')
    let seasonData = JSON.parse(seasonDataFile)

    let seasonDest = {}
    seasonDest.ligue = seasonData.ligue
    seasonDest.year = seasonData.year
    seasonDest.teams = seasonData.teams

    await writeFile('./app/rankings/data/dest/' + seasonId +'-teams.json', JSON.stringify(seasonDest, null, 2))
}

async function generateScoresPerDay(seasonId, day) {

    let seasonDataFile = await readFile('./app/rankings/data/src/' + seasonId + '.json')
    let seasonData = JSON.parse(seasonDataFile)

    let championshipUrl = championships[seasonId.split('-')[0]]
    let seasonUrl = seasonId.split('-')[1].replace('_', '-')

    let dayUrl = (day === 1) ? day + 're' : day + 'e';

    let srcUrl = 'https://iphdata.lequipe.fr/iPhoneDatas/EFR/STD/ALL/V1/Football/CalendarList/CompetitionPhase/' +  championshipUrl + '/saison-' + seasonUrl + '/' + dayUrl + '-journee.json';

    let seasonSrc = await fetch(srcUrl)
    .then(async (response)=> {
        return await response.json()
    })
    .catch(function() {
        console.log("error");
    });

    let games = []
    for (const items of seasonSrc.items) {
        if(items.items) {
            for (const game of items.items) {
                let gameData = {}
                gameData.team_dom = seasonData.teams.find(t => t.short_name === game.event.specifics.domicile.equipe.nom).acr
                gameData.team_ext = seasonData.teams.find(t => t.short_name === game.event.specifics.exterieur.equipe.nom).acr
                if(game.event.specifics.score) {
                    gameData.goals_team_dom = game.event.specifics.score.domicile;
                    gameData.goals_team_ext = game.event.specifics.score.exterieur;
                }else{
                    gameData.goals_team_dom = -1;
                    gameData.goals_team_ext = -1;
                }

                games.push(gameData);
            }
        }
    }

    let dayData = {
        day: day,
        games: games
    }

    let isSeasonDestFile = await access('./app/rankings/data/dest/' + seasonId + '-days.json')
    .then(async (response)=> {
        return true;
    })
    .catch(function() {
        return false;
    });

    let seasonDest = {}

    if(isSeasonDestFile) {
        let seasonDestFile = await readFile('./app/rankings/data/dest/' + seasonId + '-days.json')
        let seasonDestFileRes = JSON.parse(JSON.stringify(seasonDestFile))
        if(seasonDestFileRes.data.length !== 0) {
            console.log('not empty', );
            seasonDest = JSON.parse(seasonDestFile)
        }
    }

    seasonDest.ligue = seasonData.ligue
    seasonDest.year = seasonData.year

    console.log('seasonDest', seasonDest);

    if(typeof seasonDest.days === 'undefined') {
        console.log('days undefined');
        seasonDest.days = []
        seasonDest.days.push(dayData)
    }else{
        console.log('days defined');
        let existingDay = seasonDest.days.find(d => d.day === day)
        console.log('existingDay', existingDay);
        if(existingDay) {
            existingDay.games = dayData.games
        }else{
            seasonDest.days.push(dayData)
        }
    }

    seasonDest.days.sort((a, b) => (a.day > b.day) ? 1 : -1)

    await writeFile('./app/rankings/data/dest/' + seasonId +'-days.json', JSON.stringify(seasonDest, null, 2))
}

async function generateScoresPerTeam(seasonId) {

    let seasonTeamsFile = await readFile('./app/rankings/data/dest/' + seasonId + '-teams.json')
    let seasonTeams = JSON.parse(seasonTeamsFile)

    let season = await readFile('./app/rankings/data/dest/' + seasonId + '-days.json')
    season = JSON.parse(season)

    let seasonDest = {}
    seasonDest.ligue = season.ligue
    seasonDest.year = season.year
    seasonDest.teams = []

    for (const team of seasonTeams.teams) {

        let teamDest = {}
        teamDest.id = team.acr
        teamDest.games = []

        let points = 0;

        for (const day of season.days) {
            let gameDest = {}
            gameDest.day = day.day
            gameDest.goals_scored = 0
            gameDest.goals_taken = 0

            for (const game of day.games) {

                let location = (game.team_dom === team.acr) ? ['dom', 'ext']: ['ext', 'dom'];

                if(game['team_' + location[0]] === team.acr) {

                    gameDest.goals_scored = game['goals_team_' + location[0]]
                    gameDest.goals_taken = game['goals_team_' + location[1]]
                    gameDest.opponent = game['team_' + location[1]]
                    gameDest.location = location[0]
                    let tempPoints = 0;
                    if(gameDest.goals_scored > gameDest.goals_taken) {
                        tempPoints = 3;
                    }
                    if(gameDest.goals_scored < gameDest.goals_taken) {
                        tempPoints = 0;
                    }
                    if(gameDest.goals_scored === gameDest.goals_taken) {
                        tempPoints = 1;
                    }
                    if(gameDest.goals_scored === -1) {
                        tempPoints = 0;
                    }

                    points += tempPoints;

                }

            }

            gameDest.points = points;

            teamDest.games.push(gameDest)

        }

        seasonDest.teams.push(teamDest)
    }

    await writeFile('./app/rankings/data/dest/' + seasonId +'-teams_score.json', JSON.stringify(seasonDest, null, 2))

}

async function generateSeason(type) {

    if(typeof type === 'undefined') {
        console.log('no type', );
        return;
    }

    let seasonId = 'ligue1-2019_2020';
    // let seasonId = 'firstleague-2019_2020';

    if(type === 'teams') {
        await generateTeams(seasonId);
        return;
    }

    if(type === 'days'){
        for (var i = 1; i < 30; i++)
            await generateScoresPerDay(seasonId, i);
        return;
    }

    if(type === 'teams_score'){
        await generateScoresPerTeam(seasonId);
        return;
    }
}

generateSeason(argv.type);

// node generate --type=teams
// node generate --type=teams_score
// node generate --type=days