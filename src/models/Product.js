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

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let catalogCache = {
  data: null,
  expiresAt: 0,
  hits: 0,
  misses: 0
};

function escapeRegExp(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeCapacityTokens(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/(\d+)\s+(gb|tb|mah)\b/gi, '$1$2');
}

function matchesSpecField(product, fieldName, filterValue) {
  if (!filterValue || filterValue === 'all') return true;
  const targets = String(filterValue)
    .toLowerCase()
    .split(',')
    .map((s) => normalizeCapacityTokens(s.trim()))
    .filter(Boolean);
  if (targets.length === 0) return true;

  const detailedVal = normalizeCapacityTokens(product.detailedSpecs?.[fieldName] || '');
  const rawSpecs = normalizeCapacityTokens(product.specs || '');
  const prodName = normalizeCapacityTokens(product.name || '');

  // For capacity fields (ram, storage), if detailedSpecs has the dedicated field, only match against it
  // to avoid cross-matching RAM against ROM (e.g. 12GB matching 512GB or 8GB matching 128GB).
  if (fieldName === 'ram' || fieldName === 'storage') {
    const source = detailedVal || `${rawSpecs} ${prodName}`;
    return targets.some((t) => {
      const pattern = new RegExp(`(?<![0-9a-z])${escapeRegExp(t)}(?![0-9a-z])`, 'i');
      return pattern.test(source);
    });
  }

  const combined = `${detailedVal} ${rawSpecs} ${prodName}`;
  return targets.some((t) => combined.includes(t));
}

class ProductModel {
  static invalidateCache() {
    catalogCache.data = null;
    catalogCache.expiresAt = 0;
  }

  static getCacheStats() {
    const isCached = Boolean(catalogCache.data && Date.now() < catalogCache.expiresAt);
    return {
      cached: isCached,
      expiresAt: catalogCache.expiresAt,
      hits: catalogCache.hits,
      misses: catalogCache.misses,
      itemCount: catalogCache.data ? catalogCache.data.length : 0,
      ttlMs: CACHE_TTL_MS
    };
  }

  static async _loadFullCatalog() {
    const now = Date.now();
    if (catalogCache.data && now < catalogCache.expiresAt) {
      catalogCache.hits += 1;
      return catalogCache.data;
    }

    catalogCache.misses += 1;
    let mapped = null;

    if (db.isPostgres()) {
      try {
        const res = await db.query('SELECT * FROM products ORDER BY created_at ASC');
        mapped = (res.rows || []).map(mapRowToProduct);
      } catch (err) {
        console.error('Lỗi lấy sản phẩm từ Postgres:', err.message);
      }
    }

    if (!mapped) {
      const list = productDB.findAll();
      mapped = list.map(mapRowToProduct);
    }

    catalogCache.data = mapped;
    catalogCache.expiresAt = Date.now() + CACHE_TTL_MS;
    return mapped;
  }

  static async getAll(filters = 'all') {
    const allItems = await this._loadFullCatalog();
    let result = [...allItems];

    const opts = typeof filters === 'string' || !filters ? { brand: filters || 'all' } : filters;
    const {
      brand = 'all',
      ram = '',
      storage = '',
      rom = '',
      chip = '',
      minPrice = '',
      maxPrice = '',
      search = '',
      q = '',
      sort = ''
    } = opts;

    if (brand && brand !== 'all') {
      const brandTargets = String(brand)
        .toLowerCase()
        .split(',')
        .map((b) => b.trim())
        .filter(Boolean);
      if (brandTargets.length > 0) {
        result = result.filter((p) => brandTargets.includes(String(p.brand || '').toLowerCase()));
      }
    }

    if (ram && ram !== 'all') {
      result = result.filter((p) => matchesSpecField(p, 'ram', ram));
    }

    const storageFilter = storage || rom;
    if (storageFilter && storageFilter !== 'all') {
      result = result.filter((p) => matchesSpecField(p, 'storage', storageFilter));
    }

    if (chip && chip !== 'all') {
      result = result.filter((p) => matchesSpecField(p, 'chip', chip));
    }

    if (minPrice !== '' && minPrice !== null && minPrice !== undefined && !Number.isNaN(Number(minPrice))) {
      const min = Number(minPrice);
      result = result.filter((p) => p.price >= min);
    }

    if (maxPrice !== '' && maxPrice !== null && maxPrice !== undefined && !Number.isNaN(Number(maxPrice))) {
      const max = Number(maxPrice);
      result = result.filter((p) => p.price <= max);
    }

    const queryStr = String(search || q || '').toLowerCase().trim();
    if (queryStr) {
      result = result.filter((p) => {
        const haystack = [
          p.name,
          p.brand,
          p.specs,
          p.detailedSpecs?.chip,
          p.detailedSpecs?.ram,
          p.detailedSpecs?.storage,
          p.detailedSpecs?.screen
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(queryStr);
      });
    }

    if (sort === 'price_asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sort === 'price_desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sort === 'name_asc') {
      result.sort((a, b) => String(a.name).localeCompare(String(b.name), 'vi'));
    } else if (sort === 'discount_desc') {
      const getDiscountPct = (p) => (p.oldPrice && p.oldPrice > p.price ? (1 - p.price / p.oldPrice) : 0);
      result.sort((a, b) => getDiscountPct(b) - getDiscountPct(a));
    }

    return result;
  }

  static async getById(id) {
    if (catalogCache.data && Date.now() < catalogCache.expiresAt) {
      const cachedItem = catalogCache.data.find((p) => String(p.id) === String(id));
      if (cachedItem) return { ...cachedItem };
    }

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
        this.invalidateCache();
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
    this.invalidateCache();
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
        this.invalidateCache();
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
    this.invalidateCache();
    return mapRowToProduct(updated);
  }

  static async delete(id) {
    if (db.isPostgres()) {
      try {
        const res = await db.query('DELETE FROM products WHERE id = $1', [id]);
        this.invalidateCache();
        return res.rowCount > 0;
      } catch (err) {
        console.error('Lỗi xóa sản phẩm Postgres:', err.message);
      }
    }
    const deleted = productDB.delete(id);
    this.invalidateCache();
    return deleted;
  }
}

module.exports = ProductModel;
