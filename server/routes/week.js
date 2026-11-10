const express = require('express');
const { getCurrentWeekInfo } = require('../lib/isoWeek');
const { validateEntryBody } = require('../lib/validate');

function createWeekRouter({ store, teamStore }) {
  const router = express.Router();

  async function buildWeekPayload() {
    const { week, dates } = getCurrentWeekInfo();
    const members = await teamStore.readMembers();
    const entries = store.get().weeks[week] || {};
    return { week, dates, members, entries };
  }

  router.get('/week', async (req, res) => {
    try {
      res.json(await buildWeekPayload());
    } catch (err) {
      console.error('Fehler beim Laden der Woche:', err.message);
      res.status(500).json({ error: 'Wochendaten konnten nicht geladen werden' });
    }
  });

  router.put('/week/:memberId/:date', async (req, res) => {
    try {
      const { memberId, date } = req.params;
      const { week, dates } = getCurrentWeekInfo();

      if (!dates.includes(date)) {
        return res.status(400).json({ error: 'Datum liegt nicht in der aktuellen Woche' });
      }

      const members = await teamStore.readMembers();
      if (!members.some((m) => m.id === memberId)) {
        return res.status(404).json({ error: 'Unbekanntes Teammitglied' });
      }

      const validationError = validateEntryBody(req.body);
      if (validationError) {
        return res.status(400).json({ error: validationError });
      }

      const entry =
        req.body.mode === 'full'
          ? { mode: 'full', value: req.body.value }
          : { mode: 'half', am: req.body.am, pm: req.body.pm };

      await store.update((data) => {
        if (!data.weeks[week]) data.weeks[week] = {};
        if (!data.weeks[week][date]) data.weeks[week][date] = {};
        data.weeks[week][date][memberId] = entry;
      });

      res.json(await buildWeekPayload());
    } catch (err) {
      console.error('Fehler beim Speichern des Eintrags:', err.message);
      res.status(500).json({ error: 'Eintrag konnte nicht gespeichert werden' });
    }
  });

  router.delete('/week/:memberId/:date', async (req, res) => {
    try {
      const { memberId, date } = req.params;
      const { week, dates } = getCurrentWeekInfo();

      if (!dates.includes(date)) {
        return res.status(400).json({ error: 'Datum liegt nicht in der aktuellen Woche' });
      }

      await store.update((data) => {
        if (data.weeks[week] && data.weeks[week][date]) {
          delete data.weeks[week][date][memberId];
        }
      });

      res.json(await buildWeekPayload());
    } catch (err) {
      console.error('Fehler beim Löschen des Eintrags:', err.message);
      res.status(500).json({ error: 'Eintrag konnte nicht gelöscht werden' });
    }
  });

  return router;
}

module.exports = { createWeekRouter };
