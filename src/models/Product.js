const JsonDB = require('./database');
const db = require('../config/db');

let defaultProducts = [];
try {
  defaultProducts = require('../data/products.json');
} catch (e) {
  defaultProducts = [];
}
const productDB = new JsonDB('products', defaultProducts);

function mapRowToProduct(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    price: parseInt(row.price) || 0,
    oldPrice: parseInt(row.old_price) || parseInt(row.price) || 0,
    specs: row.specs,
    image: row.image,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

class ProductModel {
  static async getAll(brand) {
    if (db.isPostgres()) {
      try {
        let sql = 'SELECT * FROM products';
        const params = [];
        if (brand && brand !== 'all') {
          params.push(brand.toLowerCase());
          sql += ' WHERE LOWER(brand) = $1';
        }
        sql += ' ORDER BY created_at ASC';
        const res = await db.query(sql, params);
        return (res.rows || []).map(mapRowToProduct);
      } catch (err) {
        console.error('Lỗi lấy sản phẩm từ Postgres:', err.message);
      }
    }

    const list = productDB.findAll();
    return (brand && brand !== 'all') ? list.filter(p => p.brand.toLowerCase() === brand.toLowerCase()) : list;
  }

  static async getById(id) {
    if (db.isPostgres()) {
      try {
        const res = await db.query('SELECT * FROM products WHERE id = $1 LIMIT 1', [id]);
        return res && res.rows[0] ? mapRowToProduct(res.rows[0]) : null;
      } catch (err) {
        console.error('Lỗi lấy chi tiết sản phẩm Postgres:', err.message);
      }
    }
    return productDB.findById(id);
  }

  static async create({ name, brand, price, oldPrice, specs, image }) {
    const id = 'p_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const pPrice = parseInt(price) || 0;
    const pOldPrice = parseInt(oldPrice || price) || pPrice;

    if (db.isPostgres()) {
      try {
        const res = await db.query(`
          INSERT INTO products (id, name, brand, price, old_price, specs, image)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `, [id, name, brand || 'Khác', pPrice, pOldPrice, specs || '', image || '']);
        return mapRowToProduct(res.rows[0]);
      } catch (err) {
        console.error('Lỗi tạo sản phẩm Postgres:', err.message);
      }
    }

    const newProd = {
      id,
      name,
      brand: brand || 'Khác',
      price: pPrice,
      oldPrice: pOldPrice,
      specs: specs || '',
      image: image || '',
      createdAt: new Date().toISOString()
    };
    return productDB.insert(newProd);
  }

  static async update(id, fields) {
    const existing = await this.getById(id);
    if (!existing) return null;

    const name = fields.name || existing.name;
    const brand = fields.brand || existing.brand;
    const price = parseInt(fields.price || existing.price) || 0;
    const oldPrice = parseInt(fields.oldPrice || existing.oldPrice || price) || price;
    const specs = fields.specs !== undefined ? fields.specs : existing.specs;
    const image = fields.image || existing.image;

    if (db.isPostgres()) {
      try {
        const res = await db.query(`
          UPDATE products
          SET name = $1, brand = $2, price = $3, old_price = $4, specs = $5, image = $6, updated_at = NOW()
          WHERE id = $7
          RETURNING *
        `, [name, brand, price, oldPrice, specs, image, id]);
        return mapRowToProduct(res.rows[0]);
      } catch (err) {
        console.error('Lỗi sửa sản phẩm Postgres:', err.message);
      }
    }

    return productDB.update(id, { name, brand, price, oldPrice, specs, image });
  }

  static async delete(id) {
    if (db.isPostgres()) {
      try {
        const res = await db.query('DELETE FROM products WHERE id = $1', [id]);
        return res.rowCount > 0;
      } catch (err) {
        console.error('Lỗi xóa sản phẩm Postgres:', err.message);
      }
    }
    return productDB.delete(id);
  }
}

module.exports = ProductModel;
