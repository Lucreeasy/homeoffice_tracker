const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

class TeamValidationError extends Error {}

function slugify(name) {
  const slug = name
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'mitglied';
}

class TeamStore {
  constructor(teamFile, defaultTeamFile) {
    this.teamFile = teamFile;
    this.defaultTeamFile = defaultTeamFile;
    this.writeQueue = Promise.resolve();
  }

  // Reads the configured team list fresh from disk on every call (so editing
  // team.json never requires a rebuild/restart), falling back to the bundled
  // default list if no team.json exists yet.
  async readMembers() {
    try {
      const raw = await fsp.readFile(this.teamFile, 'utf8');
      return JSON.parse(raw).members || [];
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.error(`Fehler beim Lesen von ${this.teamFile}:`, err.message);
      }
      const raw = await fsp.readFile(this.defaultTeamFile, 'utf8');
      return JSON.parse(raw).members || [];
    }
  }

  // Serialized so two near-simultaneous "Neuer Name"-Anfragen never clobber
  // each other's read-modify-write of team.json.
  async addMember(name) {
    this.writeQueue = this.writeQueue.then(() => this._addMember(name));
    return this.writeQueue;
  }

  async _addMember(name) {
    const trimmed = (name || '').trim();
    if (!trimmed) {
      throw new TeamValidationError('Name darf nicht leer sein');
    }
    if (trimmed.length > 80) {
      throw new TeamValidationError('Name ist zu lang');
    }

    const members = await this.readMembers();
    const existing = members.find((m) => m.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      return { member: existing, created: false };
    }

    const existingIds = new Set(members.map((m) => m.id));
    const base = slugify(trimmed);
    let id = base;
    let suffix = 2;
    while (existingIds.has(id)) {
      id = `${base}-${suffix++}`;
    }

    const member = { id, name: trimmed };
    await this._persist([...members, member]);
    return { member, created: true };
  }

  async _persist(members) {
    const dir = path.dirname(this.teamFile);
    await fsp.mkdir(dir, { recursive: true });
    const tmpFile = `${this.teamFile}.tmp`;
    await fsp.writeFile(tmpFile, JSON.stringify({ members }, null, 2), 'utf8');
    await fsp.rename(tmpFile, this.teamFile);
  }
}

module.exports = { TeamStore, TeamValidationError };
