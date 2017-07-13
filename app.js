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
         // var individualMatchData = getIndividualMatchJSONObj(matchIDAndChampionIDData);
  
          console.log(matchIDAndChampionIDData);

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


var port = Number(process.env.PORT || 3000);
app.listen(port);
    
