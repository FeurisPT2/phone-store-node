const { productStorage } = require('./storage');
const CatalogFilter = require('../public/js/catalogFilter');

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let catalogCache = {
  data: null,
  expiresAt: 0,
  hits: 0,
  misses: 0
};

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
    const mapped = await productStorage.find({}, { sort: { createdAt: 1 } });
    catalogCache.data = mapped;
    catalogCache.expiresAt = Date.now() + CACHE_TTL_MS;
    return mapped;
  }

  static _cloneItem(item) {
    if (!item) return null;
    try {
      return structuredClone(item);
    } catch {
      return JSON.parse(JSON.stringify(item));
    }
  }

  static async getAll(filters = 'all') {
    const allItems = await this._loadFullCatalog();
    const filtered = CatalogFilter.filterProducts(allItems, filters);
    return filtered.map((item) => this._cloneItem(item));
  }

  static async getById(id) {
    if (!id) return null;
    if (catalogCache.data && Date.now() < catalogCache.expiresAt) {
      const cachedItem = catalogCache.data.find((p) => String(p.id) === String(id));
      if (cachedItem) {
        return this._cloneItem(cachedItem);
      }
    }

    return await productStorage.findById(id);
  }

  static async getUnenriched(limit = 10) {
    return await productStorage.find({ aiEnrichedAt: null }, { limit, sort: { createdAt: 1 } });
  }

  static async create({
    name,
    brand,
    category,
    categoryLabel,
    unit,
    duration,
    badge,
    description,
    price,
    oldPrice,
    specs,
    image,
    detailedSpecs,
    aiReview,
    aiEnrichedAt
  }) {
    const id = 'p_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const pPrice = parseInt(price, 10) || 0;
    const pOldPrice = parseInt(oldPrice || price, 10) || pPrice;

    const newProd = {
      id,
      name,
      brand: brand || 'Khác',
      category: category || '',
      categoryLabel: categoryLabel || '',
      unit: unit || '',
      duration: duration || '',
      badge: badge || '',
      description: description || '',
      price: pPrice,
      oldPrice: pOldPrice,
      specs: specs || '',
      image: image || '',
      detailedSpecs: detailedSpecs || null,
      aiReview: aiReview || null,
      aiEnrichedAt: aiEnrichedAt || null
    };

    const created = await productStorage.insert(newProd);
    this.invalidateCache();
    return created;
  }

  static async update(id, fields) {
    const existing = await this.getById(id);
    if (!existing) return null;

    const name = fields.name || existing.name;
    const brand = fields.brand || existing.brand;
    const category = fields.category !== undefined ? fields.category : (existing.category || '');
    const categoryLabel = fields.categoryLabel !== undefined ? fields.categoryLabel : (existing.categoryLabel || '');
    const unit = fields.unit !== undefined ? fields.unit : (existing.unit || '');
    const duration = fields.duration !== undefined ? fields.duration : (existing.duration || '');
    const badge = fields.badge !== undefined ? fields.badge : (existing.badge || '');
    const description = fields.description !== undefined ? fields.description : (existing.description || '');
    const price = parseInt(fields.price || existing.price, 10) || 0;
    const oldPrice = parseInt(fields.oldPrice || existing.oldPrice || fields.price || existing.price, 10) || (parseInt(fields.price || existing.price, 10) || 0);
    const specs = fields.specs !== undefined ? fields.specs : existing.specs;
    const image = fields.image || existing.image;
    const detailedSpecs = fields.detailedSpecs !== undefined ? fields.detailedSpecs : existing.detailedSpecs;
    const aiReview = fields.aiReview !== undefined ? fields.aiReview : existing.aiReview;
    const aiEnrichedAt = fields.aiEnrichedAt !== undefined ? fields.aiEnrichedAt : existing.aiEnrichedAt;

    const updated = await productStorage.update(id, {
      name,
      brand,
      category,
      categoryLabel,
      unit,
      duration,
      badge,
      description,
      price,
      oldPrice,
      specs,
      image,
      detailedSpecs,
      aiReview,
      aiEnrichedAt
    });
    this.invalidateCache();
    return updated;
  }

  static async delete(id) {
    const deleted = await productStorage.delete(id);
    this.invalidateCache();
    return deleted;
  }
}

module.exports = ProductModel;
