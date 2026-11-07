const crypto = require('crypto');
const StorageCollection = require('./StorageCollection');
const JsonStorageAdapter = require('./JsonStorageAdapter');
const PostgresStorageAdapter = require('./PostgresStorageAdapter');
const schemas = require('./schemas');

let defaultProducts = [];
try {
  defaultProducts = require('../../data/products.json');
} catch {
  defaultProducts = [];
}

const defaultAdmins = [
  {
    id: 'admin_1',
    username: 'admin',
    passwordHash: crypto.createHash('sha256').update('admin123').digest('hex'),
    fullName: 'Quản Trị Viên',
    email: 'admin@techstore.vn',
    role: 'Super Admin',
    createdAt: new Date().toISOString()
  }
];

const productStorage = new StorageCollection('products', schemas.productSchema, {
  defaultData: defaultProducts
});

const orderStorage = new StorageCollection('orders', schemas.orderSchema, {
  defaultData: []
});

const customerStorage = new StorageCollection('customers', schemas.customerSchema, {
  defaultData: []
});

const adminStorage = new StorageCollection('admins', schemas.adminSchema, {
  defaultData: defaultAdmins
});

module.exports = {
  StorageCollection,
  JsonStorageAdapter,
  PostgresStorageAdapter,
  schemas,
  productStorage,
  orderStorage,
  customerStorage,
  adminStorage
};
