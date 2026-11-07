const ProductModel = require('../models/Product');
const geminiService = require('./geminiService');

// Danh sách từ khóa phụ kiện cần loại trừ khi cào điện thoại
const ACCESSORY_KEYWORDS = [
  'ốp', 'op lung', 'cường lực', 'bao da', 'dây sạc', 'cáp sạc', 'củ sạc',
  'tai nghe', 'đế sạc', 'giá đỡ', 'sim', 'thẻ nhớ', 'máy tính bảng', 'ipad',
  'kindle', 'tab a', 'tab s', 'redmi pad', 'xelex', 'combo bao da'
];

/**
 * Chuẩn hóa tên thương hiệu
 */
function normalizeBrand(rawBrand, productName = '') {
  let brand = (rawBrand || '').trim();
  const lowerName = productName.toLowerCase();

  if (/iphone|apple/i.test(brand) || /iphone/i.test(lowerName)) return 'Apple';
  if (/samsung/i.test(brand) || /galaxy/i.test(lowerName)) return 'Samsung';
  if (/xiaomi|redmi|poco/i.test(brand) || /xiaomi|redmi|poco/i.test(lowerName)) return 'Xiaomi';
  if (/oppo/i.test(brand) || /\boppo\b/i.test(lowerName)) return 'OPPO';
  if (/realme/i.test(brand) || /\brealme\b/i.test(lowerName)) return 'Realme';
  if (/google|pixel/i.test(brand) || /pixel/i.test(lowerName)) return 'Google';
  if (/oneplus/i.test(brand) || /oneplus/i.test(lowerName)) return 'OnePlus';
  if (/vivo/i.test(brand) || /\bvivo\b/i.test(lowerName)) return 'Vivo';
  if (/nokia/i.test(brand) || /nokia/i.test(lowerName)) return 'Nokia';
  if (/asus|rog/i.test(brand) || /rog phone/i.test(lowerName)) return 'ASUS';
  if (/sony|xperia/i.test(brand) || /xperia/i.test(lowerName)) return 'Sony';

  return brand || 'Khác';
}

/**
 * Làm sạch tên điện thoại
 */
function cleanProductName(name) {
  let clean = name
    .replace(/^Điện thoại\s+/i, '')
    .replace(/^Điện Thoại\s+/i, '')
    .replace(/\s*-\s*Hàng chính hãng/gi, '')
    .replace(/\s*-\s*Hàng Chính Hãng/gi, '')
    .replace(/\s*\(Hàng chính hãng\)/gi, '')
    .replace(/\s*\(Chính hãng\)/gi, '')
    .replace(/\s*\|\s*Hàng chính hãng/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  return clean;
}

/**
 * Tạo mô tả cấu hình tự động dựa trên bộ phân tích thông số hợp nhất (fallbackEnrich)
 */
function generateSpecs(productName, rawSpecs = '', brand = '') {
  const resolvedBrand = brand || normalizeBrand('', productName);
  const { detailedSpecs } = geminiService.fallbackEnrich({
    name: productName,
    brand: resolvedBrand,
    rawText: rawSpecs
  });

  const parts = [
    detailedSpecs.screen,
    detailedSpecs.chip,
    `Bộ nhớ ${detailedSpecs.ram}/${detailedSpecs.storage}`,
    `Camera ${detailedSpecs.camera}`,
    `Pin ${detailedSpecs.battery}`
  ];

  if (/\b5G\b/i.test(`${productName} ${rawSpecs}`)) {
    parts.push('Hỗ trợ kết nối mạng 5G siêu tốc');
  }

  return parts.join(' | ');
}

class CrawlerService {
  static generateSpecs(productName, rawSpecs = '', brand = '') {
    return generateSpecs(productName, rawSpecs, brand);
  }

  /**
   * Cào sản phẩm điện thoại từ Tiki Smartphone Catalog
   * @param {Object} options
   * @param {string} options.keyword - Từ khóa tìm kiếm hoặc hãng (vd: 'iPhone', 'Galaxy', 'Xiaomi')
   * @param {string} options.brand - Thương hiệu chỉ định
   * @param {number} options.limit - Số lượng tối đa cần lấy (mặc định 10)
   * @param {boolean} options.skipExisting - Bỏ qua sản phẩm đã có trong kho
   */
  static async crawlFromTiki({ keyword = '', brand = '', limit = 10, skipExisting = true } = {}) {
    let queryUrl = `https://tiki.vn/api/v2/products?category=1795&limit=${Math.min(limit * 2, 50)}`;

    // Nếu có từ khóa hoặc brand cụ thể
    const searchTerm = (keyword || brand || '').trim();
    if (searchTerm && searchTerm.toLowerCase() !== 'all') {
      queryUrl += `&q=${encodeURIComponent(searchTerm)}`;
    }

    const res = await fetch(queryUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/json, text/plain, */*'
      }
    });

    if (!res.ok) {
      throw new Error(`Không thể kết nối đến nguồn dữ liệu Tiki (Mã lỗi: ${res.status})`);
    }

    const data = await res.json();
    const rawItems = data.data || [];

    // Lấy danh sách sản phẩm hiện tại để so sánh trùng lặp
    const currentProducts = await ProductModel.getAll('all');
    const existingNames = new Set(currentProducts.map((p) => p.name.toLowerCase().replace(/[^a-z0-9]/g, '')));

    const savedProducts = [];
    let skippedCount = 0;

    for (const item of rawItems) {
      if (savedProducts.length >= limit) break;

      const rawName = item.name || '';
      const lowerName = rawName.toLowerCase();
      const price = parseInt(item.price, 10) || 0;

      // 1. Loại trừ phụ kiện và đồ giá rẻ < 1.5 triệu (không phải smartphone)
      if (price < 1500000) continue;
      const isAccessory = ACCESSORY_KEYWORDS.some((kw) => lowerName.includes(kw));
      if (isAccessory) continue;

      // 2. Làm sạch tên & nhận diện thương hiệu
      const cleanName = cleanProductName(rawName);
      const cleanBrand = normalizeBrand(item.brand_name, cleanName);

      // Nếu người dùng yêu cầu lọc cụ thể một thương hiệu mà không khớp thì bỏ qua
      if (brand && brand.toLowerCase() !== 'all' && cleanBrand.toLowerCase() !== brand.toLowerCase()) {
        continue;
      }

      // 3. Kiểm tra trùng lặp
      const nameKey = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (skipExisting && existingNames.has(nameKey)) {
        skippedCount++;
        continue;
      }

      // 4. Giá cũ
      const originalPrice = parseInt(item.original_price, 10) || 0;
      const oldPrice =
        originalPrice > price ? originalPrice : Math.round((price * 1.15) / 100000) * 100000;

      // 5. Hình ảnh độ phân giải cao
      let image = item.thumbnail_url || '';
      if (image.includes('/cache/280x280/')) {
        image = image.replace('/cache/280x280/', '/cache/750x750/');
      }

      // 6. Mô tả cấu hình chuẩn hóa
      const specs = generateSpecs(cleanName, '', cleanBrand);

      // 7. Lưu vào cơ sở dữ liệu và tự động làm giàu thông số + đánh giá AI
      const newProduct = await ProductModel.create({
        name: cleanName,
        brand: cleanBrand,
        price,
        oldPrice,
        specs,
        image
      });

      if (newProduct) {
        let finalProduct = newProduct;
        try {
          const enriched = await geminiService.enrichAndPersistProduct(newProduct);
          if (enriched) finalProduct = enriched;
        } catch (err) {
          console.warn('Lỗi làm giàu AI khi cào sản phẩm Tiki:', err.message);
        }
        existingNames.add(nameKey);
        savedProducts.push(finalProduct);
      }
    }

    return {
      success: true,
      source: 'Tiki Vietnam Smartphone Catalog',
      totalFetched: rawItems.length,
      savedCount: savedProducts.length,
      skippedCount,
      products: savedProducts
    };
  }

  /**
   * Cào sản phẩm quốc tế từ DummyJSON (kèm tự động làm giàu AI)
   */
  static async crawlFromDummyJson({ limit = 10, skipExisting = true } = {}) {
    const res = await fetch('https://dummyjson.com/products/category/smartphones');
    if (!res.ok) throw new Error('Không thể kết nối đến DummyJSON');

    const data = await res.json();
    const rawItems = data.products || [];

    const currentProducts = await ProductModel.getAll('all');
    const existingNames = new Set(currentProducts.map((p) => p.name.toLowerCase().replace(/[^a-z0-9]/g, '')));

    const savedProducts = [];
    let skippedCount = 0;
    const USD_TO_VND = 25400;

    for (const item of rawItems) {
      if (savedProducts.length >= limit) break;

      const cleanName = cleanProductName(item.title || '');
      const nameKey = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '');

      if (skipExisting && existingNames.has(nameKey)) {
        skippedCount++;
        continue;
      }

      const priceUSD = item.price || 500;
      const price = Math.round((priceUSD * USD_TO_VND) / 10000) * 10000;
      const oldPrice = Math.round((price * 1.15) / 10000) * 10000;

      const brand = normalizeBrand(item.brand, cleanName);
      const specs = item.description || generateSpecs(cleanName, '', brand);
      const image = item.thumbnail || (item.images && item.images[0]) || '';

      const newProduct = await ProductModel.create({
        name: cleanName,
        brand,
        price,
        oldPrice,
        specs,
        image
      });

      if (newProduct) {
        let finalProduct = newProduct;
        try {
          const enriched = await geminiService.enrichAndPersistProduct(newProduct);
          if (enriched) finalProduct = enriched;
        } catch (err) {
          console.warn('Lỗi làm giàu AI khi cào sản phẩm DummyJSON:', err.message);
        }
        existingNames.add(nameKey);
        savedProducts.push(finalProduct);
      }
    }

    return {
      success: true,
      source: 'DummyJSON Smartphones',
      totalFetched: rawItems.length,
      savedCount: savedProducts.length,
      skippedCount,
      products: savedProducts
    };
  }
}

module.exports = CrawlerService;

