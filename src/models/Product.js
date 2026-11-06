const JsonDB = require('./database');
const db = require('../config/db');

let defaultProducts = [];
try {
  defaultProducts = require('../data/products.json');
} catch (e) {
  defaultProducts = [];
}
const productDB = new JsonDB('products', defaultProducts);

function parseJsonField(val) {
  if (!val) return null;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return null;
  }
}

function mapRowToProduct(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    price: parseInt(row.price) || 0,
    oldPrice: parseInt(row.old_price) || parseInt(row.price) || 0,
    specs: row.specs,
    detailedSpecs: parseJsonField(row.detailed_specs || row.detailedSpecs),
    aiReview: parseJsonField(row.ai_review || row.aiReview),
    aiEnrichedAt: row.ai_enriched_at || row.aiEnrichedAt || null,
    image: row.image,
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt
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
    const mapped = list.map(mapRowToProduct);
    return (brand && brand !== 'all') ? mapped.filter(p => p.brand.toLowerCase() === brand.toLowerCase()) : mapped;
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
    const found = productDB.findById(id);
    return mapRowToProduct(found);
  }

  static async getUnenriched(limit = 10) {
    if (db.isPostgres()) {
      try {
        const res = await db.query('SELECT * FROM products WHERE ai_enriched_at IS NULL ORDER BY created_at ASC LIMIT $1', [limit]);
        return (res.rows || []).map(mapRowToProduct);
      } catch (err) {
        console.error('Lỗi lấy sản phẩm chưa làm giàu Postgres:', err.message);
      }
    }
    const list = productDB.findAll();
    return list.filter(p => !p.aiEnrichedAt && !p.ai_enriched_at).slice(0, limit).map(mapRowToProduct);
  }

  static async create({ name, brand, price, oldPrice, specs, image, detailedSpecs, aiReview, aiEnrichedAt }) {
    const id = 'p_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const pPrice = parseInt(price) || 0;
    const pOldPrice = parseInt(oldPrice || price) || pPrice;

    if (db.isPostgres()) {
      try {
        const res = await db.query(`
          INSERT INTO products (id, name, brand, price, old_price, specs, image, detailed_specs, ai_review, ai_enriched_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *
        `, [
          id,
          name,
          brand || 'Khác',
          pPrice,
          pOldPrice,
          specs || '',
          image || '',
          detailedSpecs ? JSON.stringify(detailedSpecs) : null,
          aiReview ? JSON.stringify(aiReview) : null,
          aiEnrichedAt || null
        ]);
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
      detailedSpecs: detailedSpecs || null,
      aiReview: aiReview || null,
      aiEnrichedAt: aiEnrichedAt || null,
      createdAt: new Date().toISOString()
    };
    productDB.insert(newProd);
    return mapRowToProduct(newProd);
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
    const detailedSpecs = fields.detailedSpecs !== undefined ? fields.detailedSpecs : existing.detailedSpecs;
    const aiReview = fields.aiReview !== undefined ? fields.aiReview : existing.aiReview;
    const aiEnrichedAt = fields.aiEnrichedAt !== undefined ? fields.aiEnrichedAt : existing.aiEnrichedAt;

    if (db.isPostgres()) {
      try {
        const res = await db.query(`
          UPDATE products
          SET name = $1, brand = $2, price = $3, old_price = $4, specs = $5, image = $6,
              detailed_specs = $7, ai_review = $8, ai_enriched_at = $9, updated_at = NOW()
          WHERE id = $10
          RETURNING *
        `, [
          name,
          brand,
          price,
          oldPrice,
          specs,
          image,
          detailedSpecs ? JSON.stringify(detailedSpecs) : null,
          aiReview ? JSON.stringify(aiReview) : null,
          aiEnrichedAt || null,
          id
        ]);
        return mapRowToProduct(res.rows[0]);
      } catch (err) {
        console.error('Lỗi sửa sản phẩm Postgres:', err.message);
      }
    }

    const updated = productDB.update(id, {
      name,
      brand,
      price,
      oldPrice,
      specs,
      image,
      detailedSpecs,
      aiReview,
      aiEnrichedAt
    });
    return mapRowToProduct(updated);
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
