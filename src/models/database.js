const fs = require('fs');
const path = require('path');
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

class JsonDB {
  constructor(name, defaultData = []) {
    this.filePath = path.join(dataDir, `${name}.json`);
    if (!fs.existsSync(this.filePath)) this.write(defaultData);
  }
  read() {
    try { return JSON.parse(fs.readFileSync(this.filePath, 'utf8') || '[]'); } catch { return []; }
  }
  write(data) { fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf8'); }
  findAll() { return this.read(); }
  findById(id) { return this.read().find(i => i.id === id); }
  findOne(fn) { return this.read().find(fn); }
  insert(record) {
    const list = this.read(); list.push(record); this.write(list); return record;
  }
  update(id, fields) {
    const list = this.read();
    const idx = list.findIndex(i => i.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...fields, updatedAt: new Date().toISOString() };
      this.write(list);
      return list[idx];
    }
    return null;
  }
  delete(id) {
    const list = this.read();
    const filtered = list.filter(i => i.id !== id);
    if (filtered.length !== list.length) {
      this.write(filtered);
      return true;
    }
    return false;
  }
}
module.exports = JsonDB;
