const JsonDB = require('../database');
const { findFieldDef } = require('./schemas');

class JsonStorageAdapter {
  constructor(name, schema, defaultData = []) {
    this.name = name;
    this.schema = schema;
    this.db = new JsonDB(name, defaultData);
  }

  _clone(data) {
    if (data === null || data === undefined) return data;
    try {
      return structuredClone(data);
    } catch {
      return JSON.parse(JSON.stringify(data));
    }
  }

  _matchesQuery(item, query) {
    if (!query || Object.keys(query).length === 0) return true;
    for (const [key, val] of Object.entries(query)) {
      if (val === undefined) continue;

      if (key === '$search') {
        const { term, fields } = val;
        if (term) {
          const q = String(term).toLowerCase().trim();
          const matched = (fields || []).some((f) => {
            const match = findFieldDef(this.schema, f);
            const col = match?.def?.column;
            const fVal = item[f] !== undefined ? item[f] : (col && item[col] !== undefined ? item[col] : '');
            return String(fVal || '').toLowerCase().includes(q);
          });
          if (!matched) return false;
        }
        continue;
      }

      const match = findFieldDef(this.schema, key);
      const col = match?.def?.column;
      const currentVal = item[key] !== undefined ? item[key] : (col && item[col] !== undefined ? item[col] : undefined);

      if (val === null) {
        if (currentVal != null) {
          return false;
        }
        continue;
      }

      if (val && typeof val === 'object' && val.$iexact !== undefined) {
        const target = String(val.$iexact).toLowerCase().trim();
        const current = String(currentVal || '').toLowerCase().trim();
        if (current !== target) return false;
        continue;
      }

      if (currentVal !== val) {
        return false;
      }
    }
    return true;
  }

  async findById(id) {
    if (id === null || id === undefined) return null;
    let item = this.db.findById(id);
    if (!item && typeof id === 'string') {
      const lower = id.toLowerCase();
      item = this.db.findOne((i) => i.id && String(i.id).toLowerCase() === lower);
    }
    return item ? this.schema.normalize(this._clone(item)) : null;
  }

  async findOne(query) {
    if (typeof query === 'function') {
      const item = this.db.findOne(query);
      return item ? this.schema.normalize(this._clone(item)) : null;
    }
    const all = this.db.findAll();
    const item = all.find((i) => this._matchesQuery(i, query));
    return item ? this.schema.normalize(this._clone(item)) : null;
  }

  async find(query = {}, options = {}) {
    let list = this.db.findAll();
    if (typeof query === 'function') {
      list = list.filter(query);
    } else if (query && Object.keys(query).length > 0) {
      list = list.filter((i) => this._matchesQuery(i, query));
    }

    if (options.sort) {
      const sortEntries = Object.entries(options.sort);
      list.sort((a, b) => {
        for (const [key, dir] of sortEntries) {
          const modifier = dir === 1 || dir === 'asc' || dir === 'ASC' ? 1 : -1;
          const valA = a[key];
          const valB = b[key];
          if (
            key === 'updatedAt' ||
            key === 'createdAt' ||
            key === 'updated_at' ||
            key === 'created_at' ||
            key === 'lastVisited' ||
            key === 'lastOrderAt'
          ) {
            const timeA = Date.parse(valA || (key === 'updatedAt' ? a.createdAt : 0)) || 0;
            const timeB = Date.parse(valB || (key === 'updatedAt' ? b.createdAt : 0)) || 0;
            if (timeA !== timeB) {
              return (timeA - timeB) * modifier;
            }
            continue;
          }
          if (valA !== valB) {
            if (valA == null) return -1 * modifier;
            if (valB == null) return 1 * modifier;
            if (valA < valB) return -1 * modifier;
            if (valA > valB) return 1 * modifier;
          }
        }
        return 0;
      });
    }

    if (options.offset || options.limit) {
      const start = options.offset || 0;
      const end = options.limit ? start + options.limit : undefined;
      list = list.slice(start, end);
    }

    return list.map((item) => this.schema.normalize(this._clone(item)));
  }

  async insert(doc) {
    const data = this._clone(doc) || {};
    const now = new Date().toISOString();
    if (this.schema.fields.createdAt && data.createdAt === undefined) {
      data.createdAt = now;
    }
    if (this.schema.fields.updatedAt && data.updatedAt === undefined) {
      data.updatedAt = now;
    }

    for (const [field, fieldDef] of Object.entries(this.schema.fields)) {
      if (data[field] === undefined && fieldDef.column && data[fieldDef.column] !== undefined) {
        data[field] = data[fieldDef.column];
      }
      if (data[field] === undefined && fieldDef.default !== undefined) {
        data[field] = typeof fieldDef.default === 'function' ? fieldDef.default(data) : fieldDef.default;
      }
    }

    const inserted = this.db.insert(data);
    return this.schema.normalize(this._clone(inserted));
  }

  async update(id, fields) {
    if (!fields || typeof fields !== 'object') return await this.findById(id);
    const cleaned = {};
    for (const [k, v] of Object.entries(fields)) {
      if (v !== undefined) {
        cleaned[k] = v;
      }
    }
    const updated = this.db.update(id, cleaned);
    return updated ? this.schema.normalize(this._clone(updated)) : null;
  }

  async delete(id) {
    return this.db.delete(id);
  }

  async count(query = {}) {
    const items = await this.find(query);
    return items.length;
  }
}

module.exports = JsonStorageAdapter;
