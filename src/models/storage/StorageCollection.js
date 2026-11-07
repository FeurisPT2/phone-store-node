const db = require('../../config/db');
const JsonStorageAdapter = require('./JsonStorageAdapter');
const PostgresStorageAdapter = require('./PostgresStorageAdapter');

class StorageCollection {
  constructor(name, schema, options = {}) {
    this.name = name;
    this.schema = schema;
    this.options = options;
    this.jsonAdapter = new JsonStorageAdapter(name, schema, options.defaultData);
    this.postgresAdapter = new PostgresStorageAdapter(name, schema);
  }

  get adapter() {
    return db.isPostgres() ? this.postgresAdapter : this.jsonAdapter;
  }

  async find(query, options) {
    return this.adapter.find(query, options);
  }

  async findById(id) {
    return this.adapter.findById(id);
  }

  async findOne(query) {
    return this.adapter.findOne(query);
  }

  async insert(doc) {
    return this.adapter.insert(doc);
  }

  async update(id, fields) {
    return this.adapter.update(id, fields);
  }

  async delete(id) {
    return this.adapter.delete(id);
  }

  async count(query) {
    return this.adapter.count(query);
  }
}

module.exports = StorageCollection;
