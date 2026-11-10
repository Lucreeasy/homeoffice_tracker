const Api = {
  async getTeam() {
    const res = await fetch('/api/team');
    if (!res.ok) throw new Error('Team konnte nicht geladen werden');
    return res.json();
  },

  async addMember(name) {
    const res = await fetch('/api/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Name konnte nicht hinzugefügt werden');
    }
    return res.json();
  },

  async getWeek() {
    const res = await fetch('/api/week');
    if (!res.ok) throw new Error('Woche konnte nicht geladen werden');
    return res.json();
  },

  async setEntry(memberId, date, body) {
    const res = await fetch(`/api/week/${encodeURIComponent(memberId)}/${encodeURIComponent(date)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Eintrag konnte nicht gespeichert werden');
    }
    return res.json();
  },

  async clearEntry(memberId, date) {
    const res = await fetch(`/api/week/${encodeURIComponent(memberId)}/${encodeURIComponent(date)}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Eintrag konnte nicht gelöscht werden');
    return res.json();
  },
};
