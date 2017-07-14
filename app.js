var express = require("express");
var app = express();
var exphbs = require("express-handlebars");
var request = require("request");
var async = require("async");
var bodyParser = require('body-parser')


var numberOfGames = 1; // Global variable for the amount of ranked games to analyze
var userID = "";

var API_KEY = 'RGAPI-ab5d75a0-66d8-4a8f-87a1-89a1596a6ac4';

app.set('view engine', 'pug');


app.use(bodyParser.urlencoded({ extended: false }))

app.get('/', function (req, res) {
  res.render('index');    
})

app.post('/', function(req, res) {
    userID = req.body.username;
    var data = {};
    var matchListURL = 'https://na.api.riotgames.com/api/lol/NA/v2.2/matchlist/by-summoner/' + userID + '?api_key=' + API_KEY;

  async.waterfall([
    function(callback) {
      request(matchListURL, function(err, response, body) {
        if(!err && response.statusCode == 200) {

          var json = JSON.parse(body);
          var matchIDAndChampionIDData = getRankedMatchData(json); 
          var individualMatchData = getIndividualMatchJSONObj(matchIDAndChampionIDData);
        
          console.log(individualMatchData);
          //console.log(getWinRate(getIndividualMatchJSONObj));
          //console.log(getAvgKDA(getIndividualMatchJSONObj));
          //console.log(getWardingStat(getIndividualMatchJSONObj));
          //console.log(getCreepScorePerMinDeltas(getIndividualMatchJSONObj));
          //console.log(tiltalyzer(getIndividualMatchJSONObj));

          data.id = json['matches'][0].matchId;
          res.render('index', {test : data.id} );
          callback(null, data);
        } else {
          console.log(err);
        }
      });
    }
  ],
  function(err, data) {
    if(err) {
      console.log(err);
      return;
    }
  });
})
           
function getRankedMatchData(json) {
    var matchData = {
        matchID: [numberOfGames],
        championID: [numberOfGames],
        lane: [numberOfGames]
    };
    for (var i = 0; i < 3; i++) {
        matchData.matchID[i] = json['matches'][i].matchId;
        matchData.championID[i] = json['matches'][i].champion;
        matchData.lane[i] = json['matches'][i].lane;
    }
    return matchData;
}

function getIndividualMatchJSONObj(matchData) {
    var matchParticipantData = {
        specificParticipantData: [numberOfGames]
    };
    
    for (var i = 0; i < numberOfGames; i++) {
       matchParticipantData.specificParticipantData[i] =  getIndividualMatchJSONObjHelper(matchData, matchParticipantData, i);
    }    
    return matchParticipantData;

}

function getIndividualMatchJSONObjHelper(matchData, matchParticipantData, indexIter) {
    var individualMatchURL = 'https://na1.api.riotgames.com/lol/match/v3/matches/' + matchData.matchID[indexIter] + '?api_key=' + API_KEY;
    async.waterfall([
            function(callback) {
              request(individualMatchURL, function(err, response, body) {
                if(!err && response.statusCode == 200) {
                    var json = JSON.parse(body);
                    for (var j = 0; j < 10; j++) {
                        if (matchData.championID[indexIter] == json['participants'][j].championId) {
                            return json['participants'][j];
                            }
                        }
                    } else {
                          console.log(err);
                    }
                });
            }
        ],
        function(err, data) {
            if(err) {
                console.log(err);
            return;
            }
        });
    
    return matchParticipantData;
}

function getWinRate(matchData) {
    console.log(matchData);
    winRate = 0;
    finalWinRate = 0;
    for (var i = 0; i < numberOfGames; i++) {
        gameStatus = matchData.specificParticipantData[i].stats.winner;
        if (gameStatus) {
            winRate++;
        }
    }
    finalWinRate = (winRate / numberOfGames) * 100;    
    return finalWinRate;
}

function getAvgKDA(matchData) {
    totalKills = totalDeaths = totalAssists = singleKDA =  averageKDA = 0;
    for (var i = 0; i < numberOfGames; i++) {
        totalKills = matchData.specificParticipantData[i].stats.kills;
        totalDeaths = matchData.specificParticipantData[i].stats.deaths;
        totalAssists = matchData.specificParticipantData[i].stats.assists;
        singleKDA = (totalKills + totalAssists) / totalDeaths;
        averageKDA += singleKDA
    }
    averageKDA = averageKDA / numberOfGames; 
    
    return Math.round(averageKDA * 100) / 100;
}


function getWardingStat(matchData) {
    wardingStat = wardsPerGame =  0; 
    for (var i = 0; i < numberOfGames; i++) {
        wardingStat = matchData.specificParticipantData[i].stats.wardsPlaced;
        wardsPerGame += wardingStat;
    }
    
    wardsPerGame = wardsPerGame / numberOfGames;
    return Math.round(wardsPerGame);
}

function getCreepScorePerMinDeltas(matchData) {
    zeroToTenMinutesCSD = zeroToTenMinutesCSDeltaAverage = 0;
    
     for (var i = 0; i < numberOfGames; i++) {
        zeroToTenMinutesCSD = matchData.specificParticipantData[i].timeline.creepsPerMinDeltas.zeroToTen;
        zeroToTenMinutesCSDeltaAverage += zeroToTenMinutesCSD;
    }
    zeroToTenMinutesCSDeltaAverage = zeroToTenMinutesCSDeltaAverage / numberOfGames;
    
    return Math.round(zeroToTenMinutesCSDeltaAverage);

}

function tiltalyzer(winRate, avgKDA, wardingPerGame, csPerGameFirstTenMinutes) {
    var tiltPercentage = 0;
    winRate <= 50 ? tiltPercentage += .25 : tiltPercentage += 0; 
    avgKDA <= 1.00 ? tiltPercentage += .25 : tiltPercentage += 0; 
    wardingPerGame <= 20 ? tiltPercentage += .25 : tiltPercentage += 0; 
    csPerGameFirstTenMinutes <= 5 ? tiltPercentage += .25 : tiltPercentage += 0; 
    
    return (tiltPercentage * 100);
}
var port = Number(process.env.PORT || 3000);
app.listen(port);
    
