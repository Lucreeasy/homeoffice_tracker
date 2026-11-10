const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

class JsonFileStore {
  constructor(filePath, emptyValue) {
    this.filePath = filePath;
    this.emptyValue = emptyValue;
    this.data = null;
    this.writeQueue = Promise.resolve();
  }

  async load() {
    try {
      const raw = await fsp.readFile(this.filePath, 'utf8');
      this.data = JSON.parse(raw);
    } catch (err) {
      if (err.code === 'ENOENT') {
        this.data = JSON.parse(JSON.stringify(this.emptyValue));
        await this._persist();
      } else {
        console.error(`Konnte ${this.filePath} nicht lesen, starte mit leeren Daten:`, err.message);
        this.data = JSON.parse(JSON.stringify(this.emptyValue));
      }
    }
    return this.data;
  }

  get() {
    return this.data;
  }

  // Serializes all writes so concurrent requests never interleave their
  // read-modify-write cycles. `mutator(data)` mutates the in-memory object.
  async update(mutator) {
    this.writeQueue = this.writeQueue.then(async () => {
      mutator(this.data);
      await this._persist();
    });
    await this.writeQueue;
    return this.data;
  }

  async _persist() {
    const dir = path.dirname(this.filePath);
    await fsp.mkdir(dir, { recursive: true });
    const tmpFile = `${this.filePath}.tmp`;
    await fsp.writeFile(tmpFile, JSON.stringify(this.data, null, 2), 'utf8');
    await fsp.rename(tmpFile, this.filePath);
  }
}

module.exports = { JsonFileStore };
