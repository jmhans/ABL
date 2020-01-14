/*jshint esversion: 8 */

const request = require('request');
const axios = require('axios');
var express = require('express');
var router = express.Router();
const BASE_URL = "http://statsapi-default-elb-prod-876255662.us-east-1.elb.amazonaws.com/api/v1";
const mlbGame = require('./../models/mlbGame');
const Player = require('./../models/player').Player;
const Statline = require('./../models/statline');
const POSITION_MAP = { 'LF': 'OF', 
                  'RF': 'OF', 
                  'CF': 'OF',
                  'PR': '',
                  'PH': ''
                      
                 }
const POSSIBLE_POSITIONS = ['1B', '2B', '3B', 'SS', 'OF', 'C', 'DH'];
const QUALIFYING_GAMES_FOR_POSITION = 10;
  
  
  
function _isPositionPlayer(plyr) {
  
  if (plyr.allPositions) { 
    
    nonPitcherPosList = plyr.allPositions.filter((posRec) => {return posRec.abbreviation != 'P'});

    return (nonPitcherPosList.length > 0);
  }
  return false;
}


function appendPlayerRecord(player, team, gamePk, gameDt) {
    if (_isPositionPlayer(player)) {
   
      var query = {
        'mlbID': player.person.id
      }
      var shortPositions = player.allPositions.map((pos) => {return pos.abbreviation;})
      Player.findOne(query).exec((err, _playerRecord) => {
          
        if (_playerRecord) {
            // We have a player record.
//             var playerGame = _playerRecord.games.find((gm) => {return gm.gamePk == gamePk})
            
//             if (playerGame) {
//               // Game record already exists for player. Update it. 
//               playerGame.stats = player.stats;
//               playerGame.positions = shortPositions;
//             } else {
//               _playerRecord.games.push({gameDate: gameDt, gamePk: gamePk , stats: player.stats, positions:shortPositions})
 
//             }

          } else {
            // Create a new player record. 
              _playerRecord = new Player({
                mlbID: player.person.id,
                lastUpdate: '', 
                //games: [{gameDate: gameDt, gamePk: gamePk , stats: player.stats, positions: shortPositions}],
                //positionLog : []
              })
          }
          if (gameDt >= _playerRecord.lastUpdate) {
                _playerRecord.name = player.person.fullName;
                _playerRecord.team = team.abbreviation; 
                _playerRecord.status = player.status.description; 
                _playerRecord.stats = player.seasonStats; 
                _playerRecord.position = POSITION_MAP[player.position.abbreviation] || player.position.abbreviation;
                _playerRecord.lastUpdate = gameDt;
            
          }
          // Update positionLog based on gamecounts
          //_playerRecord.positionLog = calcAvailablePositions(_playerRecord)
          _playerRecord.save((err) => {
            if (err) {

            }
            //return res.send("successfully saved");
          });

      })
      
      

    }  
}

function updateStatlineRecord(player, team, gamePk, gameDt) {
  
    if (_isPositionPlayer(player)) {
    var shortPositions = player.allPositions.map((pos) => {return pos.abbreviation;})
      var query = {
        'mlbId': player.person.id, 
        'gameDate': gameDt, 
        'gamePk': gamePk, 
        
      }
      
       var _statline = {
                mlbId: player.person.id,
                gameDate: gameDt, 
                gamePk: gamePk, 
                stats: player.stats,
                positions: shortPositions
              };
      
      Statline.findOneAndUpdate(query, _statline, { upsert: true }, function (err, doc) {
        if (err) {
          return err;
        }
        return doc;
      })

    }  
}




function calcAvailablePositions(plyrRec) {

  return POSSIBLE_POSITIONS.filter((pp)=> {
    return  (pp == (POSITION_MAP[plyrRec.position] || plyrRec.position)) ||
            (pp == plyrRec.commish_position) ||
            (plyrRec.games.filter((gm)=> {
                translatedPosArr = gm.positions.map((gp) => {POSITION_MAP[gp] || gp})
                return (translatedPosArr.indexOf(pp) > -1);
              }).length >= QUALIFYING_GAMES_FOR_POSITION);
  })
  
  
}





function getPlayersInGame(gamePk, gameDt) {
    const APIUrl = BASE_URL + "/game/" + gamePk + "/boxscore";
    request(APIUrl, {
      json: true
    }, (err, resp, body) => {
      if (err) {
        return console.log(err);
      }
    
      function getTeamPlayers(teamType) {
        var PositionPlayers = []
        var players = body.teams[teamType].players

        var team = body.teams[teamType].team

        
        for (var playerKey in players) {
          let player = players[playerKey]
          appendPlayerRecord(player, team, gamePk, gameDt);
          updateStatlineRecord(player, team, gamePk, gameDt);
        }
      }
      
      getTeamPlayers("away");
      getTeamPlayers("home");
      


    })


  }




var MlbApiController = {

//   _get: function(req, res, next) {

//     var pad = function(num, size) {
//       var s = num + "";
//       while (s.length < size) s = "0" + s;
//       return s;
//     }

//     const gm_date = req.params.dt;
    
//     var inputDate = new Date(gm_date)
//     var day = pad(inputDate.getUTCDate(), 2); //getDate returns the date for the local timezone.  
//     var month = pad(inputDate.getUTCMonth() + 1, 2);
//     var year = inputDate.getUTCFullYear();
//     const APIUrl = BASE_URL + "/schedule/?sportId=1&date=" + month + "%2F" + day + "%2F" + year
//     request(APIUrl, {
//       json: true
//     }, (err, resp, body) => {
//       if (err) {
//         return console.log(err);
//       }
//       //console.log(body);

//       var gamesList = [];
//       var dateItem = body.dates.find(x => x.date == (year + "-" + month + "-" + day))

//       if (dateItem) {
//         gamesList = dateItem.games

//         gamesList.forEach((gm) => {

//           var query = {
//             'gamePk': gm.gamePk
//           };
//           mlbGame.findOneAndUpdate(query, gm, {
//             upsert: true
//           }, function(err, doc) {
//             if (err) return res.send(500, {
//               error: err
//             });

//             //return res.send("succesfully saved");
//           });
//         getPlayersInGame(gm.gamePk, gm.gameDate);

//         });
        
//       }

//       res.status(200).send(gamesList);
//     })

//   },
  
 _get: function (req, res, next) {
    var pad = function(num, size) {
      var s = num + "";
      while (s.length < size) s = "0" + s;
      return s;
    }

    const gm_date = req.params.dt;
    
    var inputDate = new Date(gm_date)
    var day = pad(inputDate.getUTCDate(), 2); //getDate returns the date for the local timezone.  
    var month = pad(inputDate.getUTCMonth() + 1, 2);
    var year = inputDate.getUTCFullYear();
    
      const MLBBoxscores = require('mlbboxscores');

      var options = {
        path: 'year_2019/month_07/day_23/'
      };

      var mlbboxscores = new MLBBoxscores(options);
      mlbboxscores.get((err, boxscores) => {

        res.status(200).send(boxscores)
      });
    

    
  },
  

  
  _getPlayers: function (req, res, next) {
    var pad = function(num, size) {
      var s = num + "";
      while (s.length < size) s = "0" + s;
      return s;
    }

    const gm_date = req.params.dt;
    
    var inputDate = new Date(gm_date)
    var day = pad(inputDate.getUTCDate(), 2); //getDate returns the date for the local timezone.  
    var month = pad(inputDate.getUTCMonth() + 1, 2);
    var year = inputDate.getUTCFullYear();
    const Mlbplayers = require('mlbplayers');

      var options = {
          path: 'year_2019/month_07/day_23/'
      };

      var mlbplayers = new Mlbplayers(options);

      mlbplayers.get(function (err, players) {
        res.status(200).send(players)

        //... do something
      });
    
  }
  
  

  
  

}


const MLBStatsAPI = require('mlb-stats-api');


class mlbAPI {
  
  constructor() {
    this.mlbStats = new MLBStatsAPI();
  }
  


  async _getGame(gmPk) {
    
    try {
      const response = await this.mlbStats.getGameBoxscore({ pathParams: { gamePk: gmPk }});
      return response.data;
      } catch (err) {
        console.error(`Error in _getGame: ${err}`);
      }
    }

  async _getBoxHttp(req, res, next) {
    
      try {
          const gm = await this.mlbStats.getGameBoxscore({ pathParams: { gamePk: req.params.id }}); //await this._getGame(529572);
          return res.send(gm);
       } catch (err) {
        console.error(`Error in getGameHttp(): ${err}`);
        return res.status(500).send({message: err.message});

      }

  }
  async _getSchedule(dt) {
    try {
          const sched = await this.mlbStats.getSchedule({ params: { date: dt, sportId: 1 }}); //await this._getGame(529572);
          return sched.data;
       } catch (err) {
        console.error(`Error in getSchedule(): ${err}`);
      }
  }
  
  async _getResourceHttp(req, res, next) {
    try {
      var fn;
      switch (req.params.resource) {
        case "game": 
          fn = this.mlbStats.getGameBoxscore
          break;
        case "schedule": 
          fn = this.mlbStats.getSchedule
          break;
        default: 

      }


      const results = await fn({params: req.query});
      return res.send(results.data)  
    } catch (err) {
      console.error(`Error in getResourceHttp(): ${err}`);
      return res.status(500).send({message: err.message});
    }
  
    
  }
  
  async _getSimpleBox(gmPk) {
    
    try {
      const response = await this.mlbStats.getGameBoxscore({ pathParams: { gamePk: gmPk }});
      return {gamePk: gmPk, boxscore: this.simplifyBox(response.data)};
      } catch (err) {
        console.error(`Error in _getSimpleBox: ${err}`);
      }
    }
  
  simplifyBox(bx) {
    return {
      "teams": {
        "away": {
          "team": bx.teams.away.team, 
          "teamCode": bx.teams.away.teamCode, 
          "abbreviation": bx.teams.away.abbreviation,
          "players": bx.teams.away.batters.reduce((allBatters, thisBatter)=> {
            allBatters.push(bx.teams.away.players["ID" + thisBatter]);
            return allBatters;
          }, [])
        },
        "home": {
          "team": bx.teams.home.team, 
          "teamCode": bx.teams.home.teamCode, 
          "abbreviation": bx.teams.home.abbreviation,
          "players": bx.teams.home.batters.reduce((allBatters, thisBatter)=> {
            allBatters.push(this.simplifyBatter(bx.teams.home.players["ID" + thisBatter]));
            return allBatters;
          }, [])
        }, 
        
      }
           
    }
  }
  
  simplifyBatter(batter) {
    return {
      "person": batter.person, 
      "position": batter.position, 
      "stats": {
        "batting": batter.stats.batting, 
        "fielding": batter.stats.fielding
      }, 
      "allPositions": batter.allPositions
    }
  }
  
  
  
  
  async _getBoxesForDate(dt) {
    try {
      const sched = await this._getSchedule(dt);
      if (sched) {
        console.log(sched.dates);
        return sched.dates[0].games.reduce(async (prevProm, gmRec)=> {
          const collection = await prevProm;
          const gmBox = await this._getSimpleBox(gmRec.gamePk);
            collection.push(gmBox);
          return collection;
                 
        }, Promise.resolve([]));    
      }
      
    } catch (err) {
      console.error(`Error in _getBoxesForDate: ${err}`);
    }
  }
  
  async _getBoxesHttp(req, res, next) {
    
      try {
          const boxes = await this._getBoxesForDate( req.query.date ); //await this._getGame(529572);
          return res.send(boxes);
       } catch (err) {
        console.error(`Error in getGameHttp(): ${err}`);
        return res.status(500).send({message: err.message});

      }

  }
  
  
  route() {
    router.get('/mlb/game/:id', (...args) => this._getBoxHttp(...args));
    router.get('/mlb2/:resource', (...args) => this._getResourceHttp(...args));
    router.get('/mlb/boxes', (...args) => this._getBoxesHttp(...args));
    return router;
  }
}


module.exports = mlbAPI
