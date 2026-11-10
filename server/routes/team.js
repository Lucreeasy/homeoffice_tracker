const express = require('express');
const { TeamValidationError } = require('../lib/team');

function createTeamRouter({ teamStore }) {
  const router = express.Router();

  router.get('/team', async (req, res) => {
    try {
      const members = await teamStore.readMembers();
      res.json({ members });
    } catch (err) {
      console.error('Teamliste konnte nicht geladen werden:', err.message);
      res.status(500).json({ error: 'Teamliste konnte nicht geladen werden' });
    }
  });

  router.post('/team', async (req, res) => {
    try {
      const { member, created } = await teamStore.addMember(req.body?.name);
      const members = await teamStore.readMembers();
      res.status(created ? 201 : 200).json({ member, members });
    } catch (err) {
      if (err instanceof TeamValidationError) {
        return res.status(400).json({ error: err.message });
      }
      console.error('Teammitglied konnte nicht hinzugefügt werden:', err.message);
      res.status(500).json({ error: 'Teammitglied konnte nicht hinzugefügt werden' });
    }
  });

  return router;
}

module.exports = { createTeamRouter };
