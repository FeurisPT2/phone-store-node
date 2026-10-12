const fs = require('fs');
const path = require('path');

const isVercel = !!process.env.VERCEL;
const baseDataDir = path.join(__dirname, '..', 'data');
const runtimeDataDir = isVercel ? '/tmp' : baseDataDir;

if (!fs.existsSync(runtimeDataDir)) {
  try {
    fs.mkdirSync(runtimeDataDir, { recursive: true });
  } catch (err) {
    console.error('Cannot create data dir:', err);
  }
}

class JsonDB {
  constructor(name, defaultData = []) {
    this.name = name;
    this.sourcePath = path.join(baseDataDir, `${name}.json`);
    this.filePath = path.join(runtimeDataDir, `${name}.json`);

    // Khởi tạo file dữ liệu
    if (!fs.existsSync(this.filePath)) {
      if (fs.existsSync(this.sourcePath)) {
        try {
          const content = fs.readFileSync(this.sourcePath, 'utf8');
          const parsed = JSON.parse(content || '[]');
          this.write(parsed.length > 0 ? parsed : defaultData);
        } catch {
          this.write(defaultData);
        }
      } else {
        this.write(defaultData);
      }
    }
  }

  read() {
    try {
      if (!fs.existsSync(this.filePath)) {
        if (fs.existsSync(this.sourcePath)) {
          return JSON.parse(fs.readFileSync(this.sourcePath, 'utf8') || '[]');
        }
        return [];
      }
      return JSON.parse(fs.readFileSync(this.filePath, 'utf8') || '[]');
    } catch {
      return [];
    }
  }

  write(data) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
      console.error(`Error writing to ${this.filePath}:`, err);
    }
  }

  findAll() {
    return this.read();
  }

  findById(id) {
    return this.read().find(i => i.id === id);
  }

  findOne(fn) {
    return this.read().find(fn);
  }

  insert(record) {
    const list = this.read();
    list.push(record);
    this.write(list);
    return record;
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
