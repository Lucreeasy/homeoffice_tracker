const path = require('path');

module.exports = {
  port: process.env.PORT || 3000,
  dataFile: process.env.DATA_FILE || path.join(__dirname, '..', 'data', 'homeoffice-data.json'),
  teamFile: process.env.TEAM_FILE || path.join(__dirname, '..', 'data', 'team.json'),
  defaultTeamFile: path.join(__dirname, 'team.default.json'),
};
