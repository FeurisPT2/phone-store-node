(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.CatalogFilter = api;
  }
  if (typeof window !== 'undefined' && window) {
    window.CatalogFilter = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  const CATEGORY_ORDER = ['service', 'rental', 'accessory', 'other'];

  const CATEGORY_META = {
    service: {
      key: 'service',
      label: 'Dịch vụ vệ sinh & Tối ưu máy',
      shortLabel: 'Gói Dịch Vụ Vệ Sinh',
      badgeLabel: 'Dịch vụ vệ sinh',
      unitLabel: 'gói',
      subtitle: 'Thực hiện trực tiếp tại Sảnh C ĐHKHTN · Lấy liền 25–45 phút'
    },
    rental: {
      key: 'rental',
      label: 'Thiết bị cho thuê sinh viên',
      shortLabel: 'Thiết Bị Cho Thuê',
      badgeLabel: 'Thuê thiết bị',
      unitLabel: 'thiết bị',
      subtitle: 'Chỉ cần Thẻ Sinh Viên (MSSV) · Không cọc tiền mặt · Thuê theo buổi/ngày'
    },
    accessory: {
      key: 'accessory',
      label: 'Phụ kiện & Bộ tự vệ sinh IT',
      shortLabel: 'Phụ Kiện IT Học Tập',
      badgeLabel: 'Phụ kiện & Kit',
      unitLabel: 'sản phẩm',
      subtitle: 'Sản phẩm bán đứt tiện lợi · Nhỏ gọn bỏ túi balo sinh viên'
    },
    other: {
      key: 'other',
      label: 'Danh mục khác',
      shortLabel: 'Danh Mục Khác',
      badgeLabel: 'Khác',
      unitLabel: 'mục',
      subtitle: 'Các dịch vụ & thiết bị bổ sung tại trạm GearHub'
    }
  };

  function inferCategory(product) {
    const rawCat = String(product?.category || '').toLowerCase().trim();
    if (rawCat === 'service' || rawCat === 'rental' || rawCat === 'accessory') {
      return rawCat;
    }

    const hint = [product?.categoryLabel, product?.brand, product?.name]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    if (/dịch vụ|vệ sinh|tản nhiệt|spa|tối ưu|speedup|keycare|service/.test(hint)) {
      return 'service';
    }
    if (/thuê|cho thuê|rental/.test(hint)) {
      return 'rental';
    }
    if (/phụ kiện|kit|accessory|bán đứt/.test(hint)) {
      return 'accessory';
    }
    return 'other';
  }

  function getCategoryMeta(categoryKey) {
    const norm = String(categoryKey || '').toLowerCase().trim();
    return CATEGORY_META[norm] || CATEGORY_META.other;
  }

  function groupProductsByCategory(products) {
    const buckets = new Map(CATEGORY_ORDER.map((key) => [key, []]));
    for (const item of Array.isArray(products) ? products : []) {
      const cat = inferCategory(item);
      if (!buckets.has(cat)) buckets.set(cat, []);
      buckets.get(cat).push(item);
    }

    const groups = [];
    for (const key of CATEGORY_ORDER) {
      const items = buckets.get(key) || [];
      if (items.length > 0) {
        groups.push({ ...getCategoryMeta(key), items });
      }
    }
    return groups;
  }

  function buildProductTextHaystack(product) {
    const ds = product?.detailedSpecs && typeof product.detailedSpecs === 'object' ? product.detailedSpecs : {};
    return [
      product?.name,
      product?.brand,
      product?.category,
      product?.categoryLabel,
      product?.unit,
      product?.duration,
      product?.badge,
      product?.specs,
      product?.description,
      ...Object.values(ds)
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
  }

  function matchesGearHubTarget(product, target) {
    const key = String(target || '').toLowerCase().trim();
    if (!key || key === 'all') return true;
    const text = buildProductTextHaystack(product);
    if (key === 'laptop') {
      return /laptop|tản nhiệt|máy tính|windows|macos|macbook|máy cũ|máy trạm/.test(text);
    }
    if (key === 'keyboard') {
      return /bàn phím|phím cơ|keycap|switch/.test(text);
    }
    if (key === 'mouse_slide') {
      return /chuột|thuyết trình|slide|máy chiếu|laser|hub\s*type-c/.test(text);
    }
    return text.includes(key);
  }

  function matchesGearHubPolicy(product, policy) {
    const key = String(policy || '').toLowerCase().trim();
    if (!key || key === 'all') return true;
    const cat = inferCategory(product);
    const text = buildProductTextHaystack(product);
    if (key === 'fast_service') {
      return cat === 'service' || /lấy liền|25 phút|30 phút|40 phút|45 phút/.test(text);
    }
    if (key === 'student_id') {
      return cat === 'rental' || /thẻ sv|thẻ sinh viên|mssv|không cọc/.test(text);
    }
    if (key === 'retail') {
      return cat === 'accessory' || /bán đứt|bỏ túi/.test(text);
    }
    return text.includes(key);
  }

  function matchesGearHubStandard(product, standard) {
    const key = String(standard || '').toLowerCase().trim();
    if (!key || key === 'all') return true;
    const text = buildProductTextHaystack(product);
    if (key === 'arctic') {
      return /arctic|mx-4|mx-6|keo tản nhiệt|tản nhiệt|hạ\s*\d|giảm.*\d.*°c/.test(text);
    }
    if (key === 'silent') {
      return /silent|êm|thocky|chống ồn|không ồn/.test(text);
    }
    if (key === 'typec') {
      return /type-c|typec|usb|hdmi|vga|wireless|bluetooth\s*5\.|2\.4g/.test(text);
    }
    return text.includes(key);
  }

  function escapeRegExp(str) {
    return String(str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

    const canonicalField = fieldName === 'rom' ? 'storage' : fieldName;
    const detailedVal = normalizeCapacityTokens(product?.detailedSpecs?.[canonicalField] || '');
    const rawSpecs = normalizeCapacityTokens(product?.specs || '');
    const prodName = normalizeCapacityTokens(product?.name || '');

    // For capacity fields (ram, storage/rom), if detailedSpecs has the dedicated field, only match against it
    // with word-boundary checks so 8GB never matches 128GB, 12GB never matches 512GB, 6GB never matches 16GB/256GB.
    if (canonicalField === 'ram' || canonicalField === 'storage') {
      const source = detailedVal || `${rawSpecs} ${prodName}`;
      return targets.some((t) => {
        const pattern = new RegExp(`(?<![0-9a-z])${escapeRegExp(t)}(?![0-9a-z])`, 'i');
        return pattern.test(source);
      });
    }

    const combined = `${detailedVal} ${rawSpecs} ${prodName}`;
    return targets.some((t) => combined.includes(t));
  }

  function matchesPricePreset(price, rangeKey) {
    if (!rangeKey || rangeKey === 'all') return true;
    const p = Number(price) || 0;
    const key = String(rangeKey).toLowerCase().trim();
    if (key === 'under30') return p < 30000;
    if (key === '30to80') return p >= 30000 && p <= 80000;
    if (key === 'over80') return p > 80000;
    if (key === 'under10') return p < 10000000;
    if (key === '10to20') return p >= 10000000 && p <= 20000000;
    if (key === 'under15') return p < 15000000;
    if (key === '15to25') return p >= 15000000 && p <= 25000000;
    if (key === 'over25' || key === 'above25') return p > 25000000;
    if (key.includes('-')) {
      const [minStr, maxStr] = key.split('-');
      const min = Number(minStr) || 0;
      const max = maxStr ? Number(maxStr) : Infinity;
      return p >= min && (Number.isNaN(max) ? true : p <= max);
    }
    return true;
  }

  function matchesPriceFilter(price, rangeOrOpts) {
    const p = Number(price) || 0;
    if (!rangeOrOpts || rangeOrOpts === 'all') return true;
    if (typeof rangeOrOpts === 'string') {
      return matchesPricePreset(p, rangeOrOpts);
    }
    if (typeof rangeOrOpts === 'object') {
      const { minPrice = '', maxPrice = '', priceRange = '' } = rangeOrOpts;
      if (priceRange && priceRange !== 'all') {
        if (!matchesPricePreset(p, priceRange)) return false;
      }
      if (minPrice !== '' && minPrice !== null && minPrice !== undefined && !Number.isNaN(Number(minPrice))) {
        if (p < Number(minPrice)) return false;
      }
      if (maxPrice !== '' && maxPrice !== null && maxPrice !== undefined && !Number.isNaN(Number(maxPrice))) {
        if (p > Number(maxPrice)) return false;
      }
    }
    return true;
  }

  function removeVietnameseTones(str) {
    return String(str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  }

  function matchesSearchQuery(product, query) {
    const rawQuery = String(query || '').toLowerCase().trim();
    if (!rawQuery) return true;
    const normQuery = normalizeCapacityTokens(rawQuery);
    const unaccentQuery = removeVietnameseTones(rawQuery).toLowerCase().trim();

    const name = String(product?.name || '').toLowerCase();
    const desc = String(product?.description || product?.shortDescription || '').toLowerCase();
    const specs = String(product?.specs || '').toLowerCase();

    // 1. Direct and unaccented matches on device name or short description
    if (name.includes(rawQuery) || desc.includes(rawQuery)) return true;
    const unaccentName = removeVietnameseTones(name).toLowerCase();
    const unaccentDesc = removeVietnameseTones(desc).toLowerCase();
    if (unaccentName.includes(unaccentQuery) || unaccentDesc.includes(unaccentQuery)) return true;

    // 2. Comprehensive specs and details haystack
    const ds = product?.detailedSpecs && typeof product.detailedSpecs === 'object' ? product.detailedSpecs : {};
    const rawHaystack = [
      product?.name,
      product?.brand,
      product?.category,
      product?.categoryLabel,
      product?.unit,
      product?.duration,
      product?.badge,
      product?.specs,
      product?.description,
      product?.shortDescription,
      ...Object.values(ds)
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    if (rawHaystack.includes(rawQuery)) return true;
    const normHaystack = normalizeCapacityTokens(rawHaystack);
    if (normHaystack.includes(normQuery)) return true;

    const unaccentHaystack = removeVietnameseTones(rawHaystack).toLowerCase();
    if (unaccentHaystack.includes(unaccentQuery)) return true;

    // 3. Multi-word keyword search: all keywords must match across name or description/specs
    const words = rawQuery.split(/\s+/).filter(Boolean);
    if (words.length > 1) {
      const allWordsMatch = words.every((w) => {
        const normW = normalizeCapacityTokens(w);
        const unaccentW = removeVietnameseTones(w).toLowerCase();
        return rawHaystack.includes(w) || normHaystack.includes(normW) || unaccentHaystack.includes(unaccentW);
      });
      if (allWordsMatch) return true;
    }

    return false;
  }

  function sortProducts(products, sortMode) {
    const list = Array.isArray(products) ? [...products] : [];
    const mode = String(sortMode || '')
      .toLowerCase()
      .trim();
    if (!mode || mode === 'default') return list;

    if (mode === 'price_asc' || mode === 'price-asc') {
      list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (mode === 'price_desc' || mode === 'price-desc') {
      list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    } else if (mode === 'name_asc' || mode === 'name-asc') {
      list.sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'vi'));
    } else if (mode === 'discount_desc' || mode === 'discount') {
      const getDiscountPct = (p) => {
        const price = Number(p.price) || 0;
        const oldPrice = Number(p.oldPrice) || 0;
        return oldPrice > price && oldPrice > 0 ? 1 - price / oldPrice : 0;
      };
      list.sort((a, b) => getDiscountPct(b) - getDiscountPct(a));
    } else if (mode === 'newest') {
      list.sort((a, b) => {
        const tsA = Date.parse(a.createdAt || '') || 0;
        const tsB = Date.parse(b.createdAt || '') || 0;
        return tsB - tsA;
      });
    }

    return list;
  }

  function filterProducts(products, filters = 'all') {
    let result = Array.isArray(products) ? [...products] : [];
    const opts = typeof filters === 'string' || !filters ? { brand: filters || 'all' } : filters;

    const {
      category = 'all',
      brand = 'all',
      target = '',
      policy = '',
      standard = '',
      ram = '',
      storage = '',
      rom = '',
      chip = '',
      screen = '',
      battery = '',
      os = '',
      minPrice = '',
      maxPrice = '',
      priceRange = '',
      search = '',
      q = '',
      sort = ''
    } = opts;

    if (category && category !== 'all') {
      const catTargets = String(category)
        .toLowerCase()
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);
      if (catTargets.length > 0) {
        result = result.filter((p) => catTargets.includes(inferCategory(p)));
      }
    }

    if (brand && brand !== 'all') {
      const brandTargets = String(brand)
        .toLowerCase()
        .split(',')
        .map((b) => b.trim())
        .filter(Boolean);
      if (brandTargets.length > 0) {
        result = result.filter((p) => {
          const pb = String(p.brand || '').toLowerCase();
          const pc = inferCategory(p);
          return brandTargets.some((b) => pb === b || pb.includes(b) || pc === b || pc.includes(b));
        });
      }
    }

    if (target && target !== 'all') {
      result = result.filter((p) => matchesGearHubTarget(p, target));
    }

    if (policy && policy !== 'all') {
      result = result.filter((p) => matchesGearHubPolicy(p, policy));
    }

    if (standard && standard !== 'all') {
      result = result.filter((p) => matchesGearHubStandard(p, standard));
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

    if (screen && screen !== 'all') {
      result = result.filter((p) => matchesSpecField(p, 'screen', screen));
    }

    if (battery && battery !== 'all') {
      result = result.filter((p) => matchesSpecField(p, 'battery', battery));
    }

    if (os && os !== 'all') {
      result = result.filter((p) => matchesSpecField(p, 'os', os));
    }

    if (
      (priceRange && priceRange !== 'all') ||
      (minPrice !== '' && minPrice !== null && minPrice !== undefined) ||
      (maxPrice !== '' && maxPrice !== null && maxPrice !== undefined)
    ) {
      result = result.filter((p) => matchesPriceFilter(p.price, { minPrice, maxPrice, priceRange }));
    }

    const queryStr = String(search || q || '').trim();
    if (queryStr) {
      result = result.filter((p) => matchesSearchQuery(p, queryStr));
    }

    if (sort && sort !== 'default') {
      result = sortProducts(result, sort);
    }

    return result;
  }

  function extractHardwareSpecs(nameOrObj, brandArg = '', rawTextArg = '') {
    let name = '';
    let brand = '';
    let rawText = '';

    if (nameOrObj && typeof nameOrObj === 'object') {
      name = String(nameOrObj.name || '');
      brand = String(nameOrObj.brand || '');
      rawText = String(nameOrObj.rawText || nameOrObj.specs || nameOrObj.description || '');
    } else {
      name = String(nameOrObj || '');
      brand = String(brandArg || '');
      rawText = String(rawTextArg || '');
    }

    const combined = `${name} ${rawText}`.trim();
    const brandNorm = brand.toLowerCase().trim();

    // 1. Screen
    let screen = 'Màn hình sắc nét 120Hz';
    const mScreen = combined.match(/(\d+(?:\.\d+)?)\s*(?:inch|\")/i);
    if (mScreen) {
      let panel = 'Super AMOLED';
      if (/Super Retina XDR OLED/i.test(combined)) panel = 'Super Retina XDR OLED';
      else if (/Dynamic AMOLED 2X/i.test(combined)) panel = 'Dynamic AMOLED 2X';
      else if (/LTPO\s*(?:AMOLED|OLED)/i.test(combined)) panel = 'LTPO AMOLED';
      const mHz = combined.match(/(\d{2,3})\s*Hz/i);
      const hz = mHz ? `${mHz[1]}Hz` : '120Hz';
      screen = `${mScreen[1]} inch ${panel} ${hz}`;
    }

    // 2. RAM & Storage
    let ram = '8GB';
    let storage = '128GB';
    const mRamRom = combined.match(/(\d+\s*(?:GB|TB))\s*(?:\/|\+)\s*(\d+\s*(?:GB|TB))/i);
    if (mRamRom) {
      const cap1 = mRamRom[1].replace(/\s+/g, '').toUpperCase();
      const cap2 = mRamRom[2].replace(/\s+/g, '').toUpperCase();
      const isStorage1 = cap1.endsWith('TB') || parseInt(cap1, 10) >= 64;
      const isStorage2 = cap2.endsWith('TB') || parseInt(cap2, 10) >= 64;
      if (isStorage1 && !isStorage2) {
        storage = cap1;
        ram = cap2;
      } else {
        ram = cap1;
        storage = cap2;
      }
    } else {
      const mExplicitRam =
        combined.match(/RAM\s*[:\-]?\s*(\d+\s*GB)/i) ||
        combined.match(/(\d+\s*GB)\s*RAM\b/i);
      if (mExplicitRam) {
        ram = mExplicitRam[1].replace(/\s+/g, '').toUpperCase();
      }
      const mExplicitRom =
        combined.match(/(?:ROM|Bộ nhớ(?:\s*trong)?|Storage|Dung lượng)\s*[:\-]?\s*(\d+\s*GB|\d+\s*TB)/i) ||
        combined.match(/(\d+\s*GB|\d+\s*TB)\s*(?:ROM|Bộ nhớ|Storage)\b/i);
      if (mExplicitRom) {
        storage = mExplicitRom[1].replace(/\s+/g, '').toUpperCase();
      }
      if (!mExplicitRam || !mExplicitRom) {
        const capMatches = combined.match(/(\d+\s*GB|\d+\s*TB)/gi) || [];
        for (const rawCap of capMatches) {
          const cleanCap = rawCap.replace(/\s+/g, '').toUpperCase();
          if (cleanCap.endsWith('TB')) {
            if (!mExplicitRom) storage = cleanCap;
          } else {
            const num = parseInt(cleanCap, 10);
            if (num >= 64) {
              if (!mExplicitRom) storage = cleanCap;
            } else if (num > 0 && !mExplicitRam) {
              ram = cleanCap;
            }
          }
        }
      }
    }

    // 3. Chip / SoC
    let chip = '';
    const chipPatterns = [
      { re: /\b(Apple\s+A\d+\s*(?:Pro|Bionic|Max)?)\b/i, fmt: (m) => m[1].replace(/\s+/g, ' ').trim() },
      { re: /\bChip\s+(A\d+\s*(?:Pro|Bionic|Max)?)\b/i, fmt: (m) => `Apple ${m[1].replace(/\s+/g, ' ').trim()}` },
      { re: /\b(A\d+\s+(?:Pro|Bionic|Max))\b/i, fmt: (m) => `Apple ${m[1].replace(/\s+/g, ' ').trim()}` },
      {
        re: /\b(Snapdragon\s+\d+(?:\+|s)?(?:\s+(?:Elite(?:\s+Extreme)?|Gen\s*\d+))?)(?!\w)/i,
        fmt: (m) => m[1].replace(/\s+/g, ' ').trim()
      },
      {
        re: /\b(Dimensity\s+\d{3,4}\+?(?:\s+(?:Ultra|Pro|Max|Energy))?)(?!\w)/i,
        fmt: (m) => m[1].replace(/\s+/g, ' ').trim()
      },
      { re: /\b(Exynos\s+\d{3,4}[A-Za-z]*)\b/i, fmt: (m) => m[1].replace(/\s+/g, ' ').trim() },
      { re: /\b((?:Google\s+)?Tensor\s+G\d+(?:\s*Pro)?)\b/i, fmt: (m) => m[1].replace(/\s+/g, ' ').trim() },
      { re: /\b(Kirin\s+\d{3,4}[A-Za-z]*)\b/i, fmt: (m) => m[1].replace(/\s+/g, ' ').trim() },
      { re: /\b(Helio\s+[A-Za-z]?\d{2,3})\b/i, fmt: (m) => m[1].replace(/\s+/g, ' ').trim() }
    ];

    for (const pat of chipPatterns) {
      const m = combined.match(pat.re);
      if (m) {
        chip = pat.fmt(m);
        break;
      }
    }

    if (!chip) {
      if (/iphone\s*16\s*pro/i.test(combined)) chip = 'Apple A18 Pro';
      else if (/iphone\s*16/i.test(combined)) chip = 'Apple A18';
      else if (/iphone\s*15\s*pro/i.test(combined)) chip = 'Apple A17 Pro';
      else if (/iphone\s*(?:15|14\s*pro)/i.test(combined)) chip = 'Apple A16 Bionic';
      else if (/iphone\s*(?:14|13)/i.test(combined)) chip = 'Apple A15 Bionic';
      else if (/s24\s*ultra|z\s*fold\s*6|z\s*flip\s*6|xiaomi\s*14|rog\s*phone\s*8|xperia\s*1\s*vi|find\s*x7\s*ultra/i.test(combined)) {
        chip = 'Snapdragon 8 Gen 3';
      } else if (/s23|z\s*fold\s*5|z\s*flip\s*5|xiaomi\s*13/i.test(combined)) {
        chip = 'Snapdragon 8 Gen 2';
      } else if (/s24\b/i.test(combined)) {
        chip = 'Exynos 2400';
      } else if (/pixel\s*9/i.test(combined)) {
        chip = 'Tensor G4';
      } else if (/pixel\s*8/i.test(combined)) {
        chip = 'Tensor G3';
      } else if (/find\s*x7\b|vivo\s*x100/i.test(combined)) {
        chip = 'Dimensity 9300';
      } else if (brandNorm === 'apple' || /iphone|ipad/i.test(combined)) {
        chip = 'Apple A-Series Bionic';
      } else if (brandNorm === 'google' || /pixel/i.test(combined)) {
        chip = 'Tensor G4';
      } else {
        chip = 'Snapdragon / Dimensity';
      }
    }

    // 4. Battery
    let battery = '5000mAh';
    const mPin = combined.match(/(?:pin\s*)?(\d{4,5}\s*mAh)/i);
    if (mPin) {
      battery = mPin[1].replace(/\s+/g, '');
    }

    // 5. Camera
    let camera = '50MP AI';
    const mCam =
      combined.match(/camera[^|,\n]*?(\d+\s*MP(?:\s*\+\s*\d+\s*MP)*)/i) ||
      combined.match(/\b(\d{2,3}\s*MP(?:\s*\+\s*\d+\s*MP)*)\b/i);
    if (mCam) {
      camera = mCam[1].replace(/\s+/g, '');
    }

    // 6. Charging
    let charging = 'Sạc nhanh công suất cao';
    const mCharge =
      combined.match(/sạc\s*(?:nhanh\s*)?(\d+\s*W)/i) ||
      combined.match(/\b(\d{2,3}\s*W)\b/i);
    if (mCharge) {
      charging = `Sạc nhanh ${mCharge[1].replace(/\s+/g, '').toUpperCase()}`;
    }

    // 7. OS
    let os = brandNorm === 'apple' || /iphone|ipad/i.test(combined) ? 'iOS' : 'Android';
    const mOs = combined.match(/\b(iOS\s*\d+|Android\s*\d+|HarmonyOS\s*\d*)\b/i);
    if (mOs) {
      os = mOs[1].replace(/\s+/g, ' ').trim();
    }

    return {
      screen,
      chip,
      ram,
      storage,
      battery,
      camera,
      charging,
      os
    };
  }

  return {
    CATEGORY_ORDER,
    CATEGORY_META,
    inferCategory,
    getCategoryMeta,
    groupProductsByCategory,
    escapeRegExp,
    normalizeCapacityTokens,
    matchesSpecField,
    matchesGearHubTarget,
    matchesGearHubPolicy,
    matchesGearHubStandard,
    matchesPricePreset,
    matchesPriceFilter,
    matchesSearchQuery,
    sortProducts,
    filterProducts,
    extractHardwareSpecs
  };
});

