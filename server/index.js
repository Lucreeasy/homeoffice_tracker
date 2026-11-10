const express = require('express');
const path = require('path');
const config = require('./config');
const { JsonFileStore } = require('./lib/dataStore');
const { TeamStore } = require('./lib/team');
const { createTeamRouter } = require('./routes/team');
const { createWeekRouter } = require('./routes/week');

async function main() {
  const store = new JsonFileStore(config.dataFile, { weeks: {} });
  await store.load();
  const teamStore = new TeamStore(config.teamFile, config.defaultTeamFile);

  const app = express();
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api', createTeamRouter({ teamStore }));
  app.use('/api', createWeekRouter({ store, teamStore }));

  app.listen(config.port, () => {
    console.log(`Homeoffice-Tracker läuft auf Port ${config.port}`);
  });
}

main().catch((err) => {
  console.error('Server konnte nicht gestartet werden:', err);
  process.exit(1);
});
