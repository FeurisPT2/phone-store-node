// ============================================================================
// GEARHUB STOREFRONT - Hero Configurator, Catalog Filtering & Detail Modal
// ============================================================================

const FINISH_DATA = {
  clean: {
    label: 'Dịch vụ Vệ sinh Laptop Lấy liền',
    alt: 'Vệ sinh tản nhiệt laptop sinh viên GearHub',
    image: 'https://images.unsplash.com/photo-1721332154191-ba5f1534266e?w=1200&auto=format&fit=crop&q=80',
    headline: 'Combo Sinh Viên Cool & Clean',
    desc: 'Hút sạch bụi quạt tản nhiệt, tra keo gốm Arctic MX-4, hạ ngay 10–15°C khi compile code hoặc render đồ họa. Hoàn thành nhanh 30–45 phút tại sảnh trường.',
    price: '79.000 ₫',
    specs: [
      { k: 'Vật tư chuẩn', v: 'Keo gốm Arctic MX-4' },
      { k: 'Thời gian', v: 'Lấy liền 30–45 phút' },
      { k: 'Cam kết', v: 'Đo nhiệt trước & sau' },
      { k: 'Chi phí', v: 'Đồng giá 79.000 ₫ SV' }
    ]
  },
  keyboard: {
    label: 'Thuê Bàn Phím Cơ Custom Sinh Viên',
    alt: 'Thuê bàn phím cơ DAREU EK75 Pro sinh viên',
    image: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=1200&auto=format&fit=crop&q=80',
    headline: 'Thuê Phím Cơ DareU EK75 Gõ Êm KTX',
    desc: 'Dream Switch lube sẵn, đệm Gasket Mount êm ái 32dB không ồn phòng trọ. Kết nối 3 mode Bluetooth/2.4G/Type-C linh hoạt.',
    price: '25.000 ₫ / ngày',
    specs: [
      { k: 'Cảm giác gõ', v: 'Dream Switch êm 32dB' },
      { k: 'Kết nối', v: 'Type-C / 2.4G / BT5.0' },
      { k: 'Phụ kiện kèm', v: 'Dây Type-C & Keypuller' },
      { k: 'Thủ tục', v: 'Chỉ cần Thẻ Sinh Viên' }
    ]
  },
  mouse: {
    label: 'Thuê Chuột Silent Công Thái Học',
    alt: 'Thuê chuột không dây công thái học chống mỏi cổ tay',
    image: 'https://images.unsplash.com/photo-1656457538054-b5c0d11d895d?w=1200&auto=format&fit=crop&q=80',
    headline: 'Chuột Công Thái Học Silent Chống Mỏi',
    desc: 'Form ôm sát lòng bàn tay chống mỏi cổ tay khi gõ code dài hạn. Click bấm Silent êm ái hoàn toàn không gây ồn thư viện hay phòng KTX.',
    price: '15.000 ₫ / ngày',
    specs: [
      { k: 'Thiết kế', v: 'Công thái học chống mỏi' },
      { k: 'Nút bấm', v: 'Silent Click siêu êm' },
      { k: 'Kết nối', v: 'Không dây 2.4GHz pin trâu' },
      { k: 'Thủ tục', v: 'Thẻ SV không cọc' }
    ]
  },
  slide: {
    label: 'Combo Thiết Bị Thuyết Trình Điểm A',
    alt: 'Hub chuyển đổi máy chiếu Type-C HDMI VGA',
    image: 'https://images.unsplash.com/photo-1616578273461-3a99ce422de6?w=1200&auto=format&fit=crop&q=80',
    headline: 'Combo Hub Type-C & Bút Trình Chiếu',
    desc: 'Hub đa năng HDMI 4K + VGA tương thích 100% máy chiếu giảng đường ĐHKHTN, kèm bút laser đỏ lật slide nhạy bén.',
    price: '20.000 ₫ / buổi',
    specs: [
      { k: 'Tương thích', v: 'HDMI 4K + VGA máy chiếu' },
      { k: 'Phụ kiện', v: 'Bút laser lật slide từ xa' },
      { k: 'Ứng dụng', v: 'Báo cáo, Seminar & Hội thảo' },
      { k: 'Thủ tục', v: 'Thẻ SV lấy ngay tại sảnh' }
    ]
  },
  natural: {
    label: 'Dịch vụ Vệ sinh Laptop Lấy liền',
    alt: 'GearHub Spa Laptop',
    image: 'https://images.unsplash.com/photo-1721332154191-ba5f1534266e?w=1200&auto=format&fit=crop&q=80',
    headline: 'Combo Sinh Viên Cool & Clean',
    desc: 'Hút sạch bụi quạt, tra keo gốm Arctic MX-4, hạ ngay 10–15°C khi compile code.',
    price: '79.000 ₫',
    specs: [
      { k: 'Vật tư chuẩn', v: 'Keo gốm Arctic MX-4' },
      { k: 'Thời gian', v: 'Lấy liền 30–45 phút' },
      { k: 'Cam kết', v: 'Đo nhiệt trước & sau' },
      { k: 'Chi phí', v: 'Đồng giá 79.000 ₫ SV' }
    ]
  }
};

function selectFinishSwatch(finish) {
  if (typeof document === 'undefined') return;
  const data = FINISH_DATA[finish] || FINISH_DATA.clean || FINISH_DATA.natural;
  const imgEl = document.getElementById('stage-main-image');
  if (imgEl) {
    imgEl.src = data.image;
    imgEl.alt = data.alt;
  }
  const tagEl = document.getElementById('stage-finish-tag');
  if (tagEl) {
    tagEl.innerText = data.label;
  }
  const titleEl = document.getElementById('stage-main-title') || document.querySelector('.editorial-title');
  if (titleEl && data.headline) {
    titleEl.innerText = data.headline;
  }
  const descEl = document.getElementById('stage-main-desc') || document.querySelector('.editorial-desc');
  if (descEl && data.desc) {
    descEl.innerText = data.desc;
  }
  const priceEl = document.getElementById('stage-price-strong') || document.querySelector('.price-strong');
  if (priceEl && data.price) {
    priceEl.innerText = data.price;
  }

  if (Array.isArray(data.specs)) {
    const specItems = document.querySelectorAll('#stage-specs-block .spec-line');
    data.specs.forEach((s, idx) => {
      if (specItems[idx]) {
        const kEl = specItems[idx].querySelector('.spec-k');
        const vEl = specItems[idx].querySelector('.spec-v');
        if (kEl) kEl.innerText = s.k;
        if (vEl) vEl.innerText = s.v;
      }
    });
  }

  document.querySelectorAll('.swatch-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-swatch') === finish);
  });
}

// Interactive Hero Hardware Bench Models (Mapped to GearHub catalog services/rentals)
const BENCH_MODELS = [
  {
    id: 'gearhub_clean_cool',
    name: 'Vệ Sinh Laptop & Tra Keo MX-4',
    brand: 'GearHub Dịch Vụ',
    finish: 'Keo Gốm Arctic MX-4 · Lấy Liền 30-45P',
    specBase: 'Hút bụi quạt tản · Giảm 10-15°C · Test HWMonitor',
    image: 'https://images.unsplash.com/photo-1721332154191-ba5f1534266e?w=1200&auto=format&fit=crop&q=80',
    basePrice: 79000,
    saving: 40000,
    capacities: [
      { label: 'Gói Tiêu Chuẩn (MX-4)', delta: 0 },
      { label: 'Gói Nâng Cao (MX-6 + Lube Quạt)', delta: 60000 }
    ]
  },
  {
    id: 'gearhub_rent_ek75',
    name: 'Thuê Phím Cơ DareU EK75',
    brand: 'GearHub Cho Thuê',
    finish: 'Gasket Mount · Dream Switch Âm Trầm',
    specBase: 'Layout 75% · Cáp Type-C bọc dù · Không cọc tiền mặt',
    image: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=1200&auto=format&fit=crop&q=80',
    basePrice: 25000,
    saving: 10000,
    capacities: [
      { label: 'Thuê 1 Ngày (24H)', delta: 0 },
      { label: 'Combo 3 Ngày Chạy Deadline', delta: 40000 }
    ]
  },
  {
    id: 'gearhub_rent_mouse',
    name: 'Thuê Chuột Silent Ergonomic',
    brand: 'GearHub Cho Thuê',
    finish: 'Công Thái Học 57° · Silent Switch Siêu Êm',
    specBase: 'Pin sạc Type-C · Dùng phòng thư viện · Không cọc',
    image: 'https://images.unsplash.com/photo-1656457538054-b5c0d11d895d?w=1200&auto=format&fit=crop&q=80',
    basePrice: 15000,
    saving: 5000,
    capacities: [
      { label: 'Thuê 1 Ngày (24H)', delta: 0 },
      { label: 'Combo Tuần Học Tập', delta: 55000 }
    ]
  }
];

let allProducts = [];
let currentBrand = 'all';
let currentSearch = '';
let currentSpecsFilter = {
  target: 'all',
  policy: 'all',
  standard: 'all',
  priceRange: 'all',
  sort: 'default'
};

let activeBenchModelIdx = 0;
let activeBenchCapIdx = 0;
let showAllCatalog = false;
let revealObserver = null;
let searchScrollTimer = null;

// ==================== 0B. HERO HARDWARE CONFIGURATOR ====================

function selectBenchModel(idx) {
  activeBenchModelIdx = idx;
  if (typeof document !== 'undefined') {
    document.querySelectorAll('.bench-model-btn').forEach((btn, i) => {
      btn.classList.toggle('active', i === idx);
    });
  }
  updateBenchDisplay();
}

function selectBenchCapacity(idx) {
  activeBenchCapIdx = idx;
  if (typeof document !== 'undefined') {
    document.querySelectorAll('.bench-cap-btn').forEach((btn, i) => {
      btn.classList.toggle('active', i === idx);
    });
  }
  updateBenchDisplay();
}

function updateBenchDisplay() {
  if (typeof document === 'undefined') return;
  const model = BENCH_MODELS[activeBenchModelIdx] || BENCH_MODELS[0];
  const cap = model.capacities[activeBenchCapIdx] || model.capacities[0];
  const finalPrice = model.basePrice + cap.delta;
  const fmt = typeof formatMoney === 'function' ? formatMoney : (v) => v + ' ₫';

  const imgEl = document.getElementById('hero-stage-image');
  if (imgEl && imgEl.src !== model.image) {
    imgEl.src = model.image;
    imgEl.alt = model.name;
  }

  const visualLabelEl = document.getElementById('hero-visual-label');
  if (visualLabelEl) visualLabelEl.innerText = `${model.name} (${cap.label}) · Chính hãng VN/A`;

  const capModelEl = document.getElementById('hero-caption-model');
  if (capModelEl) capModelEl.innerText = `${model.name} · ${cap.label}`;

  const capFinishEl = document.getElementById('hero-caption-finish');
  if (capFinishEl) capFinishEl.innerText = model.finish;

  const specEl = document.getElementById('bench-spec-text');
  if (specEl) specEl.innerText = `${model.specBase} · ${cap.label}`;

  const priceEl = document.getElementById('bench-live-price');
  if (priceEl) priceEl.innerText = fmt(finalPrice);

  const saveEl = document.getElementById('bench-live-saving');
  if (saveEl) saveEl.innerText = `Tiết kiệm ${fmt(model.saving)} so với giá niêm yết · Giao nhanh 2H`;
}

async function triggerBenchBuy() {
  const model = BENCH_MODELS[activeBenchModelIdx] || BENCH_MODELS[0];
  const matched =
    allProducts.find((p) => String(p.id) === String(model.id)) ||
    allProducts.find((p) => p.name.toLowerCase().includes(model.name.toLowerCase())) ||
    allProducts.find((p) => (p.brand || '').toLowerCase() === model.brand.toLowerCase()) ||
    allProducts[0];
  const targetId = matched ? matched.id : model.id;
  if (typeof buyNow === 'function') {
    await buyNow(targetId);
  }
}

// ==================== 1. DANH MỤC, PHÂN LOẠI & BỘ LỌC ĐA CHIỀU ====================

const CATEGORY_BUTTON_LABELS = {
  all: 'Tất cả phân loại',
  service: 'Gói Dịch Vụ Vệ Sinh',
  rental: 'Thiết Bị Cho Thuê',
  accessory: 'Phụ Kiện IT Học Tập',
  other: 'Danh Mục Khác'
};

const CATEGORY_ICONS = {
  service:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>',
  rental:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"></rect><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8"></path></svg>',
  accessory:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>',
  other:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>'
};

function getProductCategory(product) {
  if (typeof window !== 'undefined' && window.CatalogFilter && typeof window.CatalogFilter.inferCategory === 'function') {
    return window.CatalogFilter.inferCategory(product);
  }
  return String(product?.category || 'other').toLowerCase().trim() || 'other';
}

function getCategoryMeta(catKey) {
  if (typeof window !== 'undefined' && window.CatalogFilter && typeof window.CatalogFilter.getCategoryMeta === 'function') {
    return window.CatalogFilter.getCategoryMeta(catKey);
  }
  return {
    key: catKey,
    label: CATEGORY_BUTTON_LABELS[catKey] || 'Danh mục khác',
    unitLabel: 'mục',
    subtitle: ''
  };
}

function updateBrandCountBadges() {
  if (typeof document === 'undefined' || !Array.isArray(allProducts) || allProducts.length === 0) return;

  const counts = {
    all: allProducts.length,
    service: 0,
    rental: 0,
    accessory: 0
  };
  allProducts.forEach((p) => {
    const cat = getProductCategory(p);
    if (counts[cat] !== undefined) counts[cat] += 1;
  });

  document.querySelectorAll('.filter-bar .btn-filter').forEach((btn) => {
    const key = (btn.getAttribute('data-brand') || 'all').toLowerCase();
    const count = counts[key] !== undefined ? counts[key] : 0;
    const baseLabel = CATEGORY_BUTTON_LABELS[key] || btn.getAttribute('data-label') || key;
    btn.innerHTML = `${baseLabel} <span class="brand-count-badge">${count}</span>`;
  });

  const allPresetBtn = document.querySelector('.quick-presets-bar .preset-pill[data-preset="all"]');
  if (allPresetBtn) {
    allPresetBtn.innerText = `Tất cả (${counts.all} gói)`;
  }

  const ribbonLabels = {
    all: `Tất cả ${counts.all} dịch vụ & gear`,
    service: `Dịch vụ vệ sinh (${counts.service})`,
    rental: `Thiết bị cho thuê (${counts.rental})`,
    accessory: `Phụ kiện & Kit (${counts.accessory})`
  };
  document.querySelectorAll('[data-ribbon-brand]').forEach((btn) => {
    const key = (btn.getAttribute('data-ribbon-brand') || 'all').toLowerCase();
    if (ribbonLabels[key]) btn.innerText = ribbonLabels[key];
  });
}

function syncFilterButtonsActiveState() {
  if (typeof document === 'undefined') return;
  const brandNorm = String(currentBrand || 'all').toLowerCase();

  document.querySelectorAll('.filter-bar .btn-filter').forEach((btn) => {
    const b = (btn.getAttribute('data-brand') || 'all').toLowerCase();
    btn.classList.toggle('active', b === brandNorm);
  });

  document.querySelectorAll('[data-ribbon-brand]').forEach((btn) => {
    const b = (btn.getAttribute('data-ribbon-brand') || 'all').toLowerCase();
    btn.classList.toggle('active', b === brandNorm);
  });

  const { target, policy, standard, priceRange, sort } = currentSpecsFilter;
  const sortNorm = sort || 'default';
  const hasSecondaryFilters =
    target !== 'all' || policy !== 'all' || standard !== 'all' || priceRange !== 'all';
  let activePreset = '';

  if ((sortNorm === 'discount' || sortNorm === 'discount_desc') && !hasSecondaryFilters && brandNorm === 'all') {
    activePreset = 'discount';
  } else if (['service', 'rental', 'accessory'].includes(brandNorm) && !hasSecondaryFilters && sortNorm === 'default') {
    activePreset = brandNorm;
  } else if (brandNorm === 'all' && !hasSecondaryFilters && sortNorm === 'default') {
    activePreset = 'all';
  }

  document.querySelectorAll('.quick-presets-bar .preset-pill').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-preset') === activePreset);
  });
}

function applyQuickPreset(preset) {
  currentSpecsFilter = { target: 'all', policy: 'all', standard: 'all', priceRange: 'all', sort: 'default' };

  if (preset === 'discount') {
    currentBrand = 'all';
    currentSpecsFilter.sort = 'discount';
  } else if (['service', 'rental', 'accessory'].includes(preset)) {
    currentBrand = preset;
  } else {
    currentBrand = 'all';
  }

  if (typeof document !== 'undefined') {
    const setSelectVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val;
    };
    setSelectVal('filter-target', currentSpecsFilter.target);
    setSelectVal('filter-policy', currentSpecsFilter.policy);
    setSelectVal('filter-standard', currentSpecsFilter.standard);
    setSelectVal('filter-price', currentSpecsFilter.priceRange);
    setSelectVal('filter-sort', currentSpecsFilter.sort || 'default');
  }

  syncFiltersToUrl();
  renderProductList();
}

function hydrateFiltersFromUrl() {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  currentBrand = params.get('category') || params.get('brand') || 'all';
  currentSearch = (params.get('q') || '').toLowerCase().trim();
  currentSpecsFilter.target = params.get('target') || 'all';
  currentSpecsFilter.policy = params.get('policy') || 'all';
  currentSpecsFilter.standard = params.get('standard') || 'all';
  currentSpecsFilter.priceRange = params.get('priceRange') || 'all';
  currentSpecsFilter.sort = params.get('sort') || 'default';

  if (typeof document !== 'undefined') {
    const searchInput = document.getElementById('input-search');
    if (searchInput) searchInput.value = params.get('q') || '';
    const clearBtn = document.getElementById('btn-clear-search');
    if (clearBtn) clearBtn.style.display = currentSearch ? 'inline-flex' : 'none';

    const setSelectVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val;
    };
    setSelectVal('filter-target', currentSpecsFilter.target);
    setSelectVal('filter-policy', currentSpecsFilter.policy);
    setSelectVal('filter-standard', currentSpecsFilter.standard);
    setSelectVal('filter-price', currentSpecsFilter.priceRange);
    setSelectVal('filter-sort', currentSpecsFilter.sort || 'default');
  }

  syncFilterButtonsActiveState();
}

function syncFiltersToUrl() {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams();
  if (currentBrand && currentBrand !== 'all') params.set('category', currentBrand);
  if (currentSearch) params.set('q', currentSearch);
  if (currentSpecsFilter.target !== 'all') params.set('target', currentSpecsFilter.target);
  if (currentSpecsFilter.policy !== 'all') params.set('policy', currentSpecsFilter.policy);
  if (currentSpecsFilter.standard !== 'all') params.set('standard', currentSpecsFilter.standard);
  if (currentSpecsFilter.priceRange !== 'all') params.set('priceRange', currentSpecsFilter.priceRange);
  if (currentSpecsFilter.sort && currentSpecsFilter.sort !== 'default') {
    params.set('sort', currentSpecsFilter.sort);
  }

  const qs = params.toString();
  const nextUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  window.history.replaceState({}, '', nextUrl);
  syncFilterButtonsActiveState();
  updateBreadcrumbAndChips();
}

function getSelectedOptionText(selectId, fallbackVal) {
  if (typeof document === 'undefined') return fallbackVal;
  const sel = document.getElementById(selectId);
  return sel?.options[sel.selectedIndex]?.text || fallbackVal;
}

function updateBreadcrumbAndChips() {
  if (typeof document === 'undefined') return;
  const sep = document.getElementById('bc-active-sep');
  const label = document.getElementById('bc-active-label');
  const chipsBox = document.getElementById('active-filter-chips');

  const activeTags = [];
  if (currentBrand && currentBrand !== 'all') {
    const catLabel = CATEGORY_BUTTON_LABELS[currentBrand] || currentBrand;
    activeTags.push({ label: `Phân loại: ${catLabel}`, clear: () => filterByBrand('all') });
  }
  if (currentSpecsFilter.target && currentSpecsFilter.target !== 'all') {
    activeTags.push({
      label: `Thiết bị: ${getSelectedOptionText('filter-target', currentSpecsFilter.target)}`,
      clear: () => {
        const el = document.getElementById('filter-target');
        if (el) el.value = 'all';
        handleSpecsFilterChange();
      }
    });
  }
  if (currentSpecsFilter.policy && currentSpecsFilter.policy !== 'all') {
    activeTags.push({
      label: `Hình thức: ${getSelectedOptionText('filter-policy', currentSpecsFilter.policy)}`,
      clear: () => {
        const el = document.getElementById('filter-policy');
        if (el) el.value = 'all';
        handleSpecsFilterChange();
      }
    });
  }
  if (currentSpecsFilter.standard && currentSpecsFilter.standard !== 'all') {
    activeTags.push({
      label: `Tiêu chuẩn: ${getSelectedOptionText('filter-standard', currentSpecsFilter.standard)}`,
      clear: () => {
        const el = document.getElementById('filter-standard');
        if (el) el.value = 'all';
        handleSpecsFilterChange();
      }
    });
  }
  if (currentSpecsFilter.priceRange && currentSpecsFilter.priceRange !== 'all') {
    activeTags.push({
      label: `Giá: ${getSelectedOptionText('filter-price', currentSpecsFilter.priceRange)}`,
      clear: () => {
        const el = document.getElementById('filter-price');
        if (el) el.value = 'all';
        handleSpecsFilterChange();
      }
    });
  }
  if (currentSearch) {
    activeTags.push({
      label: `Từ khóa: "${currentSearch}"`,
      clear: () => {
        const el = document.getElementById('input-search');
        if (el) el.value = '';
        handleSearch('');
      }
    });
  }

  if (sep && label) {
    if (activeTags.length > 0) {
      sep.style.display = 'inline';
      label.style.display = 'inline';
      label.innerText = activeTags.map((t) => t.label).join(' · ');
    } else {
      sep.style.display = 'none';
      label.style.display = 'none';
    }
  }

  if (chipsBox) {
    if (activeTags.length === 0) {
      chipsBox.style.display = 'none';
      chipsBox.innerHTML = '';
    } else {
      chipsBox.style.display = 'flex';
      chipsBox.innerHTML = activeTags
        .map(
          (t, idx) => `
          <button type="button" class="filter-chip-tag" onclick="clearSingleFilterChip(${idx})">
            <span>${t.label}</span>
            <span>&times;</span>
          </button>
        `
        )
        .join('');
      if (typeof window !== 'undefined') {
        window._activeFilterClearFns = activeTags.map((t) => t.clear);
      }
    }
  }
}

function clearSingleFilterChip(idx) {
  if (typeof window !== 'undefined' && window._activeFilterClearFns && window._activeFilterClearFns[idx]) {
    window._activeFilterClearFns[idx]();
  }
}

function renderSkeletonCards() {
  if (typeof document === 'undefined') return;
  const container = document.getElementById('product-list');
  if (!container) return;
  container.innerHTML = `<div class="product-grid">${Array.from({ length: 6 })
    .map(
      () => `
      <div class="product-card" style="min-height: 420px; padding: 1.5rem;">
        <div style="height: 240px; background-color: var(--bg); margin-bottom: 1rem;"></div>
        <div style="height: 22px; width: 75%; background-color: var(--bg); margin-bottom: 0.75rem;"></div>
        <div style="height: 18px; width: 55%; background-color: var(--bg);"></div>
      </div>
    `
    )
    .join('')}</div>`;
}

async function loadProducts() {
  try {
    const res = await fetch('/api/products?brand=all');
    if (res.ok) {
      const { data } = await res.json();
      allProducts = data || [];
    } else {
      const fallbackRes = await fetch('../data/products.json');
      if (fallbackRes.ok) {
        allProducts = (await fallbackRes.json()) || [];
      }
    }
    updateBrandCountBadges();
    renderProductList();
  } catch (err) {
    console.error('Lỗi tải sản phẩm:', err);
  }
}

function scrollToCatalog() {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  const section = document.getElementById('catalog-section');
  if (!section) return;
  if (currentSearch) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  const rect = section.getBoundingClientRect();
  if (rect.top > 130 || rect.top < -40) {
    section.scrollIntoView({ behavior: 'smooth' });
  }
}

function handleSearch(val) {
  const inputVal = val !== undefined ? val : (typeof document !== 'undefined' ? document.getElementById('input-search')?.value : '') || '';
  currentSearch = String(inputVal).toLowerCase().trim();
  if (typeof document !== 'undefined') {
    const clearBtn = document.getElementById('btn-clear-search');
    if (clearBtn) clearBtn.style.display = currentSearch ? 'inline-flex' : 'none';
  }
  syncFiltersToUrl();
  renderProductList();

  if (currentSearch) {
    if (searchScrollTimer) clearTimeout(searchScrollTimer);
    searchScrollTimer = setTimeout(() => {
      scrollToCatalog();
    }, 120);
  }
}

function filterByBrand(brand) {
  currentBrand = brand;
  if (typeof document !== 'undefined') {
    document.querySelectorAll('.filter-bar .btn-filter').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-brand')?.toLowerCase() === brand.toLowerCase());
    });
  }
  syncFiltersToUrl();
  renderProductList();
}

function handleSpecsFilterChange() {
  if (typeof document !== 'undefined') {
    currentSpecsFilter.target = document.getElementById('filter-target')?.value || 'all';
    currentSpecsFilter.policy = document.getElementById('filter-policy')?.value || 'all';
    currentSpecsFilter.standard = document.getElementById('filter-standard')?.value || 'all';
    currentSpecsFilter.priceRange = document.getElementById('filter-price')?.value || 'all';
    currentSpecsFilter.sort = document.getElementById('filter-sort')?.value || 'default';
  }
  syncFiltersToUrl();
  renderProductList();
}

function resetAllFilters() {
  currentBrand = 'all';
  currentSearch = '';
  currentSpecsFilter = { target: 'all', policy: 'all', standard: 'all', priceRange: 'all', sort: 'default' };

  if (typeof document !== 'undefined') {
    const searchInput = document.getElementById('input-search');
    if (searchInput) searchInput.value = '';
    const clearBtn = document.getElementById('btn-clear-search');
    if (clearBtn) clearBtn.style.display = 'none';

    document.querySelectorAll('.filter-bar .btn-filter').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-brand') === 'all');
    });
    document.querySelectorAll('.quick-presets-bar .preset-pill').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-preset') === 'all');
    });

    ['filter-target', 'filter-policy', 'filter-standard', 'filter-price'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = 'all';
    });
    const sortEl = document.getElementById('filter-sort');
    if (sortEl) sortEl.value = 'default';
  }

  syncFiltersToUrl();
  renderProductList();
}

function renderProductCardHtml(p, idx) {
  const discount = p.oldPrice && p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  const isLiked = typeof userWishlist !== 'undefined' && Array.isArray(userWishlist) && userWishlist.includes(String(p.id));
  const badgeText = p.badge || (discount > 0 ? `Giảm -${discount}%` : 'Sinh viên');
  const originTag = p.unit ? `Đơn vị: ${p.unit}` : 'Lấy liền tại trường';
  const durationTag = p.duration || 'Lấy liền';
  const catMeta = getCategoryMeta(getProductCategory(p));
  const categoryBadge = p.categoryLabel || catMeta.badgeLabel || p.brand;
  const fmt = typeof formatMoney === 'function' ? formatMoney : (v) => v + ' ₫';

  let specPillsHtml = '';
  if (p.detailedSpecs) {
    const ds = p.detailedSpecs;
    const pills = [];
    if (ds.time) pills.push(`<span class="spec-pill spec-pill--highlight">${ds.time}</span>`);
    if (ds.type) pills.push(`<span class="spec-pill">${ds.type}</span>`);
    if (ds.impact) pills.push(`<span class="spec-pill">${ds.impact}</span>`);
    if (ds.model) pills.push(`<span class="spec-pill spec-pill--highlight">${ds.model}</span>`);
    if (ds.connection) pills.push(`<span class="spec-pill">${ds.connection}</span>`);
    if (ds.tools) pills.push(`<span class="spec-pill">${ds.tools.split(',')[0]}</span>`);
    if (ds.components) pills.push(`<span class="spec-pill spec-pill--highlight">${ds.components.split(',')[0]}</span>`);
    if (pills.length > 0) {
      specPillsHtml = `<div class="product-specs-pills">${pills.slice(0, 3).join('')}</div>`;
    }
  }
  if (!specPillsHtml) {
    specPillsHtml = `<p style="font-size:var(--fs-sm); color:var(--muted); line-height:1.4;">${p.description || p.specs || ''}</p>`;
  }

  return `
    <article class="product-card" data-category="${catMeta.key}" data-reveal style="--i:${idx % 3}">
      <div class="card-top-badges">
        <div class="card-badge-stack">
          <span class="card-discount-badge">${badgeText}</span>
          <span class="card-origin-badge">${originTag}</span>
        </div>
        <button type="button" class="card-wish-icon-btn ${isLiked ? 'active' : ''}" onclick="toggleWishlistItem('${p.id}')" title="${isLiked ? 'Bỏ lưu yêu thích' : 'Lưu vào danh sách yêu thích'}" aria-label="Yêu thích">
          ${isLiked ? '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg>' : '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg>'}
        </button>
      </div>

      <a href="/product?id=${p.id}" class="product-img-wrapper" style="text-decoration:none; display:block;">
        <img class="product-img" src="${p.image}" alt="${p.name}" loading="lazy" decoding="async">
        <span class="card-quickview-pill">Xem chi tiết &amp; AI tư vấn</span>
      </a>

      <div class="product-body">
        <div class="product-meta-row">
          <span class="product-brand-tag product-brand-tag--${catMeta.key}">${categoryBadge}</span>
          <span class="product-stock-tag"><span class="trust-dot" style="display:inline-block; vertical-align:middle; margin-right:4px;"></span>${durationTag}</span>
        </div>

        <a href="/product?id=${p.id}" class="product-title" title="${p.name}" style="text-decoration:none; color:inherit; display:block;">${p.name}</a>

        ${specPillsHtml}

        <div class="product-price-box">
          <div class="price-main-line">
            <span class="current-price">${fmt(p.price)}</span>
            ${p.oldPrice && p.oldPrice > p.price ? `<span class="old-price">${fmt(p.oldPrice)}</span>` : ''}
          </div>
          <div class="price-sub-line">
            <span>${p.duration ? `Thời gian: ${p.duration}` : 'Sảnh C ĐHKHTN'}</span>
            <span>${p.unit ? `Tính theo ${p.unit}` : 'Bảo hành 7 ngày'}</span>
          </div>
        </div>

        <div class="product-actions">
          <button type="button" class="btn-buy-now" onclick="buyNow('${p.id}')" title="${catMeta.key === 'rental' ? 'Thuê thiết bị ngay' : (catMeta.key === 'service' ? 'Đặt lịch vệ sinh lấy liền' : 'Mua ngay')}">${catMeta.key === 'rental' ? 'Thuê ngay' : (catMeta.key === 'service' ? 'Đặt lịch ngay' : 'Mua ngay')}</button>
          <button type="button" class="btn-add-cart" onclick="addToCart('${p.id}')" title="Thêm vào giỏ hàng">Thêm vào giỏ hàng</button>
          <a href="/product?id=${p.id}" class="btn-add-cart" title="Xem chi tiết &amp; thông số" style="text-decoration:none;">Chi tiết</a>
        </div>
      </div>
    </article>
  `;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderProductList() {
  if (typeof document === 'undefined') return;
  const container = document.getElementById('product-list');
  if (!container) return;

  const isSearching = Boolean(currentSearch && currentSearch.trim().length > 0);
  const heroSection = document.getElementById('hero-section');
  const uspSection = document.querySelector('.usp-recognition-section');
  const headlineEl = document.querySelector('#catalog-section .section-headline');

  if (document.body) {
    document.body.classList.toggle('is-searching', isSearching);
  }
  if (heroSection) {
    heroSection.style.display = isSearching ? 'none' : '';
  }
  if (uspSection) {
    uspSection.style.display = isSearching ? 'none' : '';
  }
  if (headlineEl) {
    if (isSearching) {
      if (!headlineEl.dataset.defaultTitle) {
        headlineEl.dataset.defaultTitle = headlineEl.innerText;
      }
      headlineEl.innerText = `Kết quả tìm kiếm cho "${currentSearch}"`;
    } else if (headlineEl.dataset.defaultTitle) {
      headlineEl.innerText = headlineEl.dataset.defaultTitle;
    }
  }

  updateBreadcrumbAndChips();

  const list = typeof window !== 'undefined' && window.CatalogFilter
    ? window.CatalogFilter.filterProducts(allProducts, {
        brand: currentBrand,
        target: currentSpecsFilter.target,
        policy: currentSpecsFilter.policy,
        standard: currentSpecsFilter.standard,
        priceRange: currentSpecsFilter.priceRange,
        search: currentSearch,
        sort: currentSpecsFilter.sort
      })
    : [...allProducts];

  const countEl = document.getElementById('total-products-count');
  if (countEl) countEl.innerText = list.length;

  const moreWrap = document.getElementById('catalog-more-wrap');

  if (list.length === 0) {
    if (moreWrap) moreWrap.style.display = 'none';
    const searchNotice = currentSearch
      ? `Không tìm thấy kết quả phù hợp với từ khóa "<strong>${escapeHtml(currentSearch)}</strong>".`
      : 'Không tìm thấy kết quả nào phù hợp với bộ lọc hiện tại.';
    container.innerHTML = `
      <div class="catalog-empty-state" data-reveal style="--i:0">
        <div class="catalog-empty-icon" aria-hidden="true" style="margin-bottom:0.75rem; color:var(--muted);">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            <line x1="8" y1="11" x2="14" y2="11"></line>
          </svg>
        </div>
        <h3 class="catalog-empty-title">Không tìm thấy kết quả</h3>
        <p class="catalog-empty-desc">${searchNotice} Bạn vui lòng thử tìm kiếm theo tên thiết bị khác, từ khóa mô tả ngắn gọn hoặc đặt lại bộ lọc.</p>
        <button type="button" class="btn-primary-sage" onclick="resetAllFilters()">Đặt lại toàn bộ bộ lọc</button>
      </div>
    `;
    if (typeof observeReveals === 'function') observeReveals();
    return;
  }

  const isUnfiltered =
    (!currentBrand || currentBrand === 'all') &&
    !currentSearch &&
    currentSpecsFilter.target === 'all' &&
    currentSpecsFilter.policy === 'all' &&
    currentSpecsFilter.standard === 'all' &&
    currentSpecsFilter.priceRange === 'all' &&
    (!currentSpecsFilter.sort || currentSpecsFilter.sort === 'default');

  const initialLimit = 12;
  const visibleList = isUnfiltered && !showAllCatalog ? list.slice(0, initialLimit) : list;

  if (moreWrap) {
    if (isUnfiltered && !showAllCatalog && list.length > initialLimit) {
      moreWrap.style.display = 'flex';
      moreWrap.innerHTML = `
        <button type="button" class="btn-secondary-tone" onclick="expandAllCatalog()">
          Xem đầy đủ toàn bộ ${list.length} dịch vụ &amp; thiết bị &darr;
        </button>
      `;
    } else {
      moreWrap.style.display = 'none';
      moreWrap.innerHTML = '';
    }
  }

  const isExplicitCrossSort =
    currentBrand === 'all' && currentSpecsFilter.sort && currentSpecsFilter.sort !== 'default';

  if (isExplicitCrossSort || !(typeof window !== 'undefined' && window.CatalogFilter && window.CatalogFilter.groupProductsByCategory)) {
    const sortText = getSelectedOptionText('filter-sort', currentSpecsFilter.sort);
    container.innerHTML = `
      <div class="catalog-category-group">
        <div class="catalog-category-head">
          <div class="catalog-category-title-wrap">
            <span class="catalog-cat-icon">${CATEGORY_ICONS.other}</span>
            <div>
              <h3 class="catalog-cat-title">Danh sách tổng hợp (${visibleList.length} kết quả)</h3>
              <p class="catalog-cat-sub">Đang sắp xếp toàn bộ phân loại theo: ${sortText}</p>
            </div>
          </div>
          <button type="button" class="catalog-cat-action" onclick="const fs=document.getElementById('filter-sort'); if(fs) fs.value='default'; currentSpecsFilter.sort='default'; handleSpecsFilterChange();">
            Hiển thị theo 3 nhóm phân loại &rarr;
          </button>
        </div>
        <div class="product-grid">
          ${visibleList.map((p, idx) => renderProductCardHtml(p, idx)).join('')}
        </div>
      </div>
    `;
  } else {
    const groups = window.CatalogFilter.groupProductsByCategory(visibleList);
    const isSingleGroupSelected = currentBrand && currentBrand !== 'all';

    container.innerHTML = groups
      .map((group) => {
        const iconSvg = CATEGORY_ICONS[group.key] || CATEGORY_ICONS.other;
        const actionBtn = isSingleGroupSelected
          ? `<button type="button" class="catalog-cat-action" onclick="filterByBrand('all')">&larr; Xem tất cả phân loại</button>`
          : groups.length > 1
            ? `<button type="button" class="catalog-cat-action" onclick="filterByBrand('${group.key}')">Xem riêng nhóm này &rarr;</button>`
            : '';

        return `
          <section class="catalog-category-group" data-category="${group.key}" aria-label="${group.label}">
            <header class="catalog-category-head">
              <div class="catalog-category-title-wrap">
                <span class="catalog-cat-icon catalog-cat-icon--${group.key}">${iconSvg}</span>
                <div>
                  <div class="catalog-cat-title-row">
                    <h3 class="catalog-cat-title">${group.label}</h3>
                    <span class="catalog-cat-count">${group.items.length} ${group.unitLabel || 'mục'}</span>
                  </div>
                  <p class="catalog-cat-sub">${group.subtitle || ''}</p>
                </div>
              </div>
              ${actionBtn}
            </header>
            <div class="product-grid">
              ${group.items.map((p, idx) => renderProductCardHtml(p, idx)).join('')}
            </div>
          </section>
        `;
      })
      .join('');
  }

  observeReveals();
}

function expandAllCatalog() {
  showAllCatalog = true;
  renderProductList();
}

function initScrollReveal() {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  const shutterEl = document.getElementById('hero-shutter-frame');
  if (shutterEl) {
    requestAnimationFrame(() => shutterEl.classList.add('in'));
  }

  if ('IntersectionObserver' in window) {
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
    );
  } else {
    const fallbackReveal = () => {
      const windowH = window.innerHeight || document.documentElement.clientHeight;
      document.querySelectorAll('[data-reveal]:not(.in)').forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top <= windowH * 0.95) {
          el.classList.add('in');
        }
      });
    };
    window.addEventListener('scroll', fallbackReveal, { passive: true });
    window.addEventListener('resize', fallbackReveal, { passive: true });
    fallbackReveal();
  }

  observeReveals();
}

function observeReveals() {
  if (typeof document === 'undefined') return;
  const revealEls = document.querySelectorAll('[data-reveal]:not(.in)');
  if (!revealObserver) {
    revealEls.forEach((el) => el.classList.add('in'));
    return;
  }
  revealEls.forEach((el) => revealObserver.observe(el));
}

// ==================== 6. MODAL CHI TIẾT SẢN PHẨM & ĐÁNH GIÁ AI ====================

function switchDetailTab(tabName) {
  if (typeof document === 'undefined') return;
  const isSpecs = tabName === 'specs';
  const tabSpecs = document.getElementById('detail-tab-specs');
  const tabAi = document.getElementById('detail-tab-ai');
  const paneSpecs = document.getElementById('detail-pane-specs');
  const paneAi = document.getElementById('detail-pane-ai');

  if (tabSpecs) tabSpecs.classList.toggle('active', isSpecs);
  if (tabAi) tabAi.classList.toggle('active', !isSpecs);
  if (paneSpecs) paneSpecs.classList.toggle('active', isSpecs);
  if (paneAi) paneAi.classList.toggle('active', !isSpecs);
}
if (typeof window !== 'undefined') {
  window.switchDetailTab = switchDetailTab;
}

async function openProductDetailModal(productId) {
  let p = allProducts.find((item) => String(item.id) === String(productId));
  if (!p) {
    try {
      const res = await fetch(`/api/products/${productId}`);
      const json = await res.json();
      if (json.data) p = json.data;
    } catch (e) {
      console.error('Lỗi tải chi tiết sản phẩm:', e);
    }
  }

  if (!p) {
    if (typeof showToast === 'function') {
      showToast('Không tìm thấy thông tin sản phẩm', 'error');
    }
    return;
  }

  if (typeof document === 'undefined') return;
  switchDetailTab('specs');
  const fmt = typeof formatMoney === 'function' ? formatMoney : (v) => v + ' ₫';

  document.getElementById('detail-modal-title').innerText = p.name;
  document.getElementById('detail-img').src = p.image || '';
  document.getElementById('detail-img').alt = p.name;
  const detailCatMeta = getCategoryMeta(getProductCategory(p));
  document.getElementById('detail-brand-badge').innerText = p.categoryLabel || detailCatMeta.badgeLabel || p.brand || 'GearHub';
  document.getElementById('detail-price').innerText = fmt(p.price);

  const oldPriceEl = document.getElementById('detail-old-price');
  if (p.oldPrice && p.oldPrice > p.price) {
    oldPriceEl.innerText = fmt(p.oldPrice);
    oldPriceEl.style.display = 'inline';
  } else {
    oldPriceEl.style.display = 'none';
  }

  const detailBuyBtn = document.getElementById('detail-btn-buy');
  const detailCartBtn = document.getElementById('detail-btn-cart');
  if (detailBuyBtn) {
    if (detailCatMeta.key === 'rental') {
      detailBuyBtn.innerHTML = 'Thuê Thiết Bị Ngay &rarr;';
    } else if (detailCatMeta.key === 'service') {
      detailBuyBtn.innerHTML = 'Đặt Lịch Hẹn Ngay &rarr;';
    } else {
      detailBuyBtn.innerHTML = 'Mua Sản Phẩm Ngay &rarr;';
    }
    detailBuyBtn.onclick = () => {
      closeProductDetailModal();
      if (typeof buyNow === 'function') buyNow(p.id);
    };
  }
  if (detailCartBtn) {
    detailCartBtn.innerHTML = '+ Thêm Vào Giỏ Hàng';
    detailCartBtn.onclick = () => {
      if (typeof addToCart === 'function') addToCart(p.id);
    };
  }
  const detailFullPageBtn = document.getElementById('detail-btn-fullpage');
  if (detailFullPageBtn) {
    detailFullPageBtn.href = `/product?id=${encodeURIComponent(p.id)}`;
  }

  const GEARHUB_SPEC_LABELS = {
    type: 'Hạng mục',
    time: 'Thời gian thực hiện',
    tools: 'Dụng cụ / Vật tư',
    thermalPaste: 'Keo tản nhiệt',
    impact: 'Hiệu quả thực tế',
    warranty: 'Bảo hành / Hỗ trợ',
    scope: 'Hệ điều hành hỗ trợ',
    safety: 'Cam kết an toàn dữ liệu',
    method: 'Quy trình thực hiện',
    lube: 'Dầu / Mỡ lube switch',
    effect: 'Cảm giác & Âm gõ',
    model: 'Model thiết bị',
    connection: 'Chuẩn kết nối',
    layout: 'Layout bàn phím',
    switch: 'Loại Switch',
    weight: 'Trọng lượng',
    dpi: 'Độ nhạy DPI',
    rentalPolicy: 'Thủ tục thuê SV',
    hubPorts: 'Cổng kết nối Hub',
    pointer: 'Bút trình chiếu',
    compatibility: 'Thiết bị tương thích',
    components: 'Thành phần bộ Kit',
    material: 'Chất liệu',
    size: 'Kích thước',
    usage: 'Công dụng'
  };

  const ds = p.detailedSpecs && typeof p.detailedSpecs === 'object' ? p.detailedSpecs : null;
  const hasGearHubSpecKeys =
    ds && Object.keys(ds).some((k) => Object.prototype.hasOwnProperty.call(GEARHUB_SPEC_LABELS, k));

  let specsList = [];
  if (hasGearHubSpecKeys) {
    specsList.push({ label: 'Phân loại', val: p.categoryLabel || detailCatMeta.badgeLabel });
    if (p.duration || p.unit) {
      specsList.push({
        label: 'Thời lượng / Đơn vị',
        val: [p.duration, p.unit ? `Tính theo ${p.unit}` : ''].filter(Boolean).join(' · ')
      });
    }
    Object.entries(ds).forEach(([k, val]) => {
      if (val) {
        specsList.push({ label: GEARHUB_SPEC_LABELS[k] || k, val });
      }
    });
  } else {
    const specs =
      ds ||
      (typeof window !== 'undefined' && window.CatalogFilter && typeof window.CatalogFilter.extractHardwareSpecs === 'function'
        ? window.CatalogFilter.extractHardwareSpecs({
            name: p.name,
            brand: p.brand,
            rawText: p.specs || p.description || ''
          })
        : {
            screen: 'Đạt chuẩn trạm kỹ thuật',
            chip: p.brand || 'GearHub',
            ram: '8GB',
            storage: '128GB',
            battery: 'Tiêu chuẩn',
            camera: 'Tiêu chuẩn',
            charging: 'Type-C PD',
            os: 'Windows / macOS'
          });

    specsList = [
      { label: 'Màn hình', val: specs.screen },
      { label: 'Vi xử lý (SoC)', val: specs.chip },
      { label: 'Bộ nhớ RAM', val: specs.ram },
      { label: 'Bộ nhớ trong', val: specs.storage },
      { label: 'Dung lượng Pin', val: specs.battery },
      { label: 'Hệ thống Camera', val: specs.camera },
      { label: 'Công nghệ Sạc', val: specs.charging },
      { label: 'Hệ điều hành', val: specs.os }
    ];
  }

  document.getElementById('detail-specs-sheet').innerHTML = specsList
    .map(
      (item) => `
      <div class="spec-sheet-item">
        <span class="spec-sheet-label">${item.label}</span>
        <span class="spec-sheet-val">${item.val || 'Đang cập nhật'}</span>
      </div>
    `
    )
    .join('');

  const review = p.aiReview || {
    summary: p.description || `${p.name} là gói dịch vụ & thiết bị chuẩn sinh viên tại trạm GearHub Sảnh C ĐHKHTN.`,
    pros: [
      `Mức giá sinh viên minh bạch ${fmt(p.price)}`,
      'Thực hiện trực tiếp / nhận gear nhanh với Thẻ Sinh Viên'
    ],
    cons: ['Nên đặt lịch trước giờ cao điểm giữa tiết hoặc tuần thi cuối kỳ'],
    targetAudience: 'Sinh viên CNTT cần chăm sóc laptop hoặc thuê gear học tập, thuyết trình'
  };

  document.getElementById('detail-ai-summary').innerText = review.summary;
  document.getElementById('detail-ai-pros').innerHTML = (review.pros || []).map((pro) => `<li>${pro}</li>`).join('');
  document.getElementById('detail-ai-cons').innerHTML = (review.cons || []).map((con) => `<li>${con}</li>`).join('');
  document.getElementById('detail-ai-audience').innerText = review.targetAudience || 'Sinh viên, giảng viên và lập trình viên';

  if (typeof openModal === 'function') {
    openModal('product-detail-modal');
  }
}

function closeProductDetailModal() {
  if (typeof closeModal === 'function') {
    closeModal('product-detail-modal');
  }
}

// ==================== VIETQR TIMERS HELPER FOR TESTS ====================

function clearQrSessionTimers() {
  if (typeof activeQrSession !== 'undefined' && activeQrSession) {
    if (activeQrSession.pollTimer) {
      clearInterval(activeQrSession.pollTimer);
      activeQrSession.pollTimer = null;
    }
    if (activeQrSession.countdownTimer) {
      clearInterval(activeQrSession.countdownTimer);
      activeQrSession.countdownTimer = null;
    }
  }
}

// ==================== 0. KHỞI TẠO & SỰ KIỆN TOÀN CỤC ====================

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', async () => {
    initScrollReveal();
    hydrateFiltersFromUrl();
    renderSkeletonCards();

    await Promise.all([
      loadProducts(),
      typeof updateCart === 'function' ? updateCart() : Promise.resolve(),
      typeof checkAuthState === 'function' ? checkAuthState() : Promise.resolve(),
      typeof loadWishlistState === 'function' ? loadWishlistState() : Promise.resolve()
    ]);

    // Sync bench basePrice with loaded catalog if present
    BENCH_MODELS.forEach((m) => {
      const found =
        allProducts.find((p) => String(p.id) === String(m.id)) ||
        allProducts.find((p) => p.name.toLowerCase().includes(m.name.toLowerCase()));
      if (found && Number(found.price) > 0) {
        m.id = found.id;
        m.basePrice = Number(found.price);
      }
    });
    updateBenchDisplay();
    updateBrandCountBadges();

    // Auto-open Customer Self-Service Portal when visiting /customer-portal or ?portal=1
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (window.location.pathname === '/customer-portal' || urlParams.get('portal') === '1') {
        const requestedTab = urlParams.get('tab') || 'track';
        if (typeof openCustomerPortal === 'function') {
          openCustomerPortal(requestedTab);
        }
      }
    }

    const btnOpenCart = document.getElementById('btn-open-cart');
    if (btnOpenCart && btnOpenCart.tagName !== 'A') {
      btnOpenCart.addEventListener('click', () => {
        window.location.href = '/cart';
      });
    }
    if (typeof handlePlaceOrder === 'function') {
      document.getElementById('order-form')?.addEventListener('submit', handlePlaceOrder);
    }

    // Search input expansion and keyboard shortcut '/'
    const searchInput = document.getElementById('input-search');
    const searchBox = document.querySelector('.search-box');
    const headerCenter = document.querySelector('.header-center');
    const headerInner = document.querySelector('.header-inner');
    const searchKbd = document.getElementById('btn-search-kbd') || document.querySelector('.search-kbd');

    const expandSearch = () => {
      headerInner?.classList.add('search-active');
      headerCenter?.classList.add('is-expanded');
      searchBox?.classList.add('is-expanded');
    };

    const collapseSearch = () => {
      headerInner?.classList.remove('search-active');
      headerCenter?.classList.remove('is-expanded');
      searchBox?.classList.remove('is-expanded');
    };

    const focusSearchInput = () => {
      if (!searchInput) return;
      expandSearch();
      searchInput.focus();
      searchInput.select?.();
    };

    if (searchInput) {
      searchInput.addEventListener('focus', expandSearch);
      searchInput.addEventListener('blur', collapseSearch);

      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          scrollToCatalog();
        }
        if (e.key === 'Escape') {
          searchInput.blur();
        }
      });
    }

    if (searchBox) {
      searchBox.addEventListener('click', (e) => {
        if (!e.target.closest('#btn-clear-search')) {
          focusSearchInput();
        }
      });
    }

    if (searchKbd) {
      searchKbd.addEventListener('click', (e) => {
        e.stopPropagation();
        focusSearchInput();
      });
      searchKbd.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          focusSearchInput();
        }
      });
    }

    document.addEventListener('keydown', (e) => {
      const activeEl = document.activeElement;
      const tagName = activeEl?.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tagName) || activeEl?.isContentEditable) {
        return;
      }
      if (e.key === '/' || e.code === 'Slash') {
        e.preventDefault();
        focusSearchInput();
      }
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', () => {
        hydrateFiltersFromUrl();
        renderProductList();
      });
    }
  });
}
