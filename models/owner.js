let mongoose = require('mongoose')

const Schema = mongoose.Schema;

var teamSchema = new Schema({
  name: {type: String, required: false}
})

var ownerSchema = new Schema({
  name: {type: String, required: true}, 
  email: {type: String, required: false},
  teams: {type: [teamSchema], required: false}
})

var rosterRecordSchema = new Schema({
  player: {type: Schema.Types.ObjectId, ref:'Player', required: true}, 
  rosterPosition: {type: String, required: true}, 
  rosterOrder: {type: Number, required: true}, 
  ablTeam: {type: Schema.Types.ObjectId, ref:'AblTeam', required: false},
  startDatetime: {type: Date, required: true}, 
  active: {type: Boolean, required: false}
})

var ablTeamSchema = new Schema({
  nickname: {type: String, required: true}, 
  location: {type: String, required: true},
  owner: {type: Schema.Types.ObjectId, ref: 'Owner' , required: true},
  stadium: {type: String, required: false}, 
})

const Team = mongoose.model('Team', teamSchema);
const Owner = mongoose.model('Owner', ownerSchema);
const AblTeam = mongoose.model('AblTeam', ablTeamSchema);
const AblRosterRecord = mongoose.model('AblRosterRecord', rosterRecordSchema);

module.exports = {Owner: Owner, 
                  Team: Team, 
                  AblTeam: AblTeam, 
                  AblRosterRecord: AblRosterRecord
                 };

