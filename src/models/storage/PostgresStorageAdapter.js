const db = require('../../config/db');
const { findFieldDef } = require('./schemas');

class PostgresStorageAdapter {
  constructor(name, schema) {
    this.name = name;
    this.tableName = schema.tableName || name;
    this.schema = schema;
  }

  _serializeField(val, fieldDef) {
    if (val === null || val === undefined) return null;
    if (fieldDef.type === 'json') {
      if (typeof val === 'object') {
        return JSON.stringify(val);
      }
      return val;
    }
    if (fieldDef.type === 'integer') {
      return parseInt(val, 10) || 0;
    }
    if (fieldDef.type === 'boolean') {
      return Boolean(val);
    }
    return val;
  }

  buildWhere(query) {
    if (!query || typeof query !== 'object' || Object.keys(query).length === 0) {
      return { clause: '', params: [] };
    }

    const conditions = [];
    const params = [];

    for (const [key, val] of Object.entries(query)) {
      if (val === undefined) continue;

      if (key === '$search') {
        const { term, fields } = val;
        if (term) {
          params.push(`%${String(term).toLowerCase().trim()}%`);
          const pIdx = params.length;
          const orClauses = (fields || []).map((f) => {
            const match = findFieldDef(this.schema, f);
            const col = match?.def?.column || f;
            return `(LOWER(${col}) LIKE $${pIdx} OR ${col} LIKE $${pIdx})`;
          });
          if (orClauses.length > 0) {
            conditions.push(`(${orClauses.join(' OR ')})`);
          }
        }
        continue;
      }

      const match = findFieldDef(this.schema, key);
      const fieldDef = match?.def;
      const col = fieldDef?.column || key;

      if (val === null) {
        conditions.push(`${col} IS NULL`);
        continue;
      }

      if (val && typeof val === 'object' && val.$iexact !== undefined) {
        params.push(String(val.$iexact).trim());
        conditions.push(`LOWER(${col}) = LOWER($${params.length})`);
        continue;
      }

      const serialized = fieldDef ? this._serializeField(val, fieldDef) : val;
      params.push(serialized);
      conditions.push(`${col} = $${params.length}`);
    }

    const clause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return { clause, params };
  }

  async findById(id) {
    if (id === null || id === undefined) return null;
    try {
      const pkCol = this.schema.primaryKeyCol || 'id';
      let res = await db.query(`SELECT * FROM ${this.tableName} WHERE ${pkCol} = $1 LIMIT 1`, [id]);
      if (!res) {
        throw new Error(`Database query returned null for ${this.tableName}`);
      }
      if (res.rows.length === 0 && typeof id === 'string') {
        res = await db.query(`SELECT * FROM ${this.tableName} WHERE LOWER(${pkCol}) = LOWER($1) LIMIT 1`, [id]);
        if (!res) {
          throw new Error(`Database query returned null for ${this.tableName}`);
        }
      }
      return res.rows[0] ? this.schema.normalize(res.rows[0]) : null;
    } catch (err) {
      console.error(`❌ [PostgresStorageAdapter:${this.tableName}] findById error:`, err.message);
      throw err;
    }
  }

  async findOne(query) {
    try {
      if (typeof query === 'function') {
        const all = await this.find({}, {});
        return all.find(query) || null;
      }
      const results = await this.find(query, { limit: 1 });
      return results[0] || null;
    } catch (err) {
      console.error(`❌ [PostgresStorageAdapter:${this.tableName}] findOne error:`, err.message);
      throw err;
    }
  }

  async find(query = {}, options = {}) {
    try {
      if (typeof query === 'function') {
        const all = await this.find({}, options);
        return all.filter(query);
      }

      const { clause, params } = this.buildWhere(query);

      let orderClause = '';
      if (options.sort) {
        const parts = [];
        for (const [key, dir] of Object.entries(options.sort)) {
          const match = findFieldDef(this.schema, key);
          const col = match?.def?.column || key;
          const direction = dir === 1 || dir === 'asc' || dir === 'ASC' ? 'ASC' : 'DESC';
          parts.push(`${col} ${direction}`);
        }
        if (parts.length > 0) {
          orderClause = `ORDER BY ${parts.join(', ')}`;
        }
      }

      let limitClause = '';
      if (typeof options.limit === 'number' && options.limit > 0) {
        params.push(options.limit);
        limitClause = `LIMIT $${params.length}`;
      }

      let offsetClause = '';
      if (typeof options.offset === 'number' && options.offset > 0) {
        params.push(options.offset);
        offsetClause = `OFFSET $${params.length}`;
      }

      const sql = `SELECT * FROM ${this.tableName} ${clause} ${orderClause} ${limitClause} ${offsetClause}`.trim();
      const res = await db.query(sql, params);
      if (!res) {
        throw new Error(`Database query returned null for ${this.tableName}`);
      }
      return (res.rows || []).map((row) => this.schema.normalize(row));
    } catch (err) {
      console.error(`❌ [PostgresStorageAdapter:${this.tableName}] find error:`, err.message);
      throw err;
    }
  }

  async insert(doc) {
    try {
      const cols = [];
      const placeholders = [];
      const params = [];

      const now = new Date().toISOString();
      const data = { ...doc };

      if (this.schema.fields.createdAt && data.createdAt === undefined) {
        data.createdAt = now;
      }
      if (this.schema.fields.updatedAt && data.updatedAt === undefined) {
        data.updatedAt = now;
      }

      for (const [field, fieldDef] of Object.entries(this.schema.fields)) {
        if (fieldDef.inMemoryOnly) continue;
        let val = data[field];
        if (val === undefined && fieldDef.column && data[fieldDef.column] !== undefined) {
          val = data[fieldDef.column];
        }

        if (val === undefined && fieldDef.default !== undefined) {
          val = typeof fieldDef.default === 'function' ? fieldDef.default(data) : fieldDef.default;
        }

        if (val === undefined) continue;

        cols.push(fieldDef.column);
        params.push(this._serializeField(val, fieldDef));
        placeholders.push(`$${params.length}`);
      }

      const sql = `
        INSERT INTO ${this.tableName} (${cols.join(', ')})
        VALUES (${placeholders.join(', ')})
        RETURNING *
      `;
      const res = await db.query(sql, params);
      if (!res || !res.rows || !res.rows[0]) {
        throw new Error(`Insert failed into ${this.tableName}`);
      }
      return this.schema.normalize(res.rows[0]);
    } catch (err) {
      console.error(`❌ [PostgresStorageAdapter:${this.tableName}] insert error:`, err.message);
      throw err;
    }
  }

  async update(id, fields) {
    try {
      const pkCol = this.schema.primaryKeyCol || 'id';
      const setClauses = [];
      const params = [];

      const data = { ...fields };

      for (const [field, val] of Object.entries(data)) {
        if (val === undefined) continue;

        const match = findFieldDef(this.schema, field);
        if (!match) continue;
        const { name, def: fieldDef } = match;
        if (fieldDef.inMemoryOnly || name === this.schema.primaryKey || fieldDef.column === pkCol) {
          continue;
        }

        params.push(this._serializeField(val, fieldDef));
        setClauses.push(`${fieldDef.column} = $${params.length}`);
      }

      if (this.schema.fields.updatedAt && data.updatedAt === undefined && data.updated_at === undefined) {
        const updateCol = this.schema.fields.updatedAt.column || 'updated_at';
        setClauses.push(`${updateCol} = NOW()`);
      }

      if (setClauses.length === 0) {
        return await this.findById(id);
      }

      params.push(id);
      const sql = `
        UPDATE ${this.tableName}
        SET ${setClauses.join(', ')}
        WHERE ${pkCol} = $${params.length}
        RETURNING *
      `;
      const res = await db.query(sql, params);
      if (!res) {
        throw new Error(`Database query returned null for ${this.tableName}`);
      }
      if (!res.rows || !res.rows[0]) {
        return null;
      }
      return this.schema.normalize(res.rows[0]);
    } catch (err) {
      console.error(`❌ [PostgresStorageAdapter:${this.tableName}] update error:`, err.message);
      throw err;
    }
  }

  async delete(id) {
    try {
      const pkCol = this.schema.primaryKeyCol || 'id';
      const res = await db.query(`DELETE FROM ${this.tableName} WHERE ${pkCol} = $1`, [id]);
      if (!res) {
        throw new Error(`Database query returned null for ${this.tableName}`);
      }
      return Boolean(res.rowCount > 0);
    } catch (err) {
      console.error(`❌ [PostgresStorageAdapter:${this.tableName}] delete error:`, err.message);
      throw err;
    }
  }

  async count(query = {}) {
    try {
      if (typeof query === 'function') {
        const items = await this.find(query);
        return items.length;
      }
      const { clause, params } = this.buildWhere(query);
      const sql = `SELECT COUNT(*) FROM ${this.tableName} ${clause}`.trim();
      const res = await db.query(sql, params);
      if (!res) {
        throw new Error(`Database query returned null for ${this.tableName}`);
      }
      return res.rows && res.rows[0] ? parseInt(res.rows[0].count, 10) || 0 : 0;
    } catch (err) {
      console.error(`❌ [PostgresStorageAdapter:${this.tableName}] count error:`, err.message);
      throw err;
    }
  }
}

module.exports = PostgresStorageAdapter;
