// ============================================================================
// TECHSTORE ATELIER - Storefront, Hardware Configurator, VietQR & Self-Service
// ============================================================================

let allProducts = [];
let currentBrand = 'all';
let currentSearch = '';
let currentSpecsFilter = {
  ram: 'all',
  storage: 'all',
  chip: 'all',
  priceRange: 'all',
  sort: ''
};
let currentUser = null;
let userWishlist = [];
let chatHistory = [];

let activeQrSession = {
  orderId: null,
  paymentRef: null,
  expiresAt: null,
  pollTimer: null,
  countdownTimer: null,
  phone: ''
};

// Interactive Hero Hardware Bench Models (Mapped to real catalog IDs p1, p5, p9)
const BENCH_MODELS = [
  {
    id: 'p1',
    name: 'iPhone 16 Pro Max',
    brand: 'Apple',
    finish: 'Khung Titan Cấp 5 · Nguyên Seal VN/A',
    specBase: 'Apple A18 Pro · 8GB RAM · 6.9" OLED',
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=1200&auto=format&fit=crop&q=80',
    basePrice: 14800000,
    saving: 2000000,
    capacities: [
      { label: '256GB', delta: 0 },
      { label: '512GB', delta: 3000000 },
      { label: '1TB', delta: 6000000 }
    ]
  },
  {
    id: 'p5',
    name: 'Galaxy S24 Ultra',
    brand: 'Samsung',
    finish: 'Khung Titan Armor · S-Pen Tích Hợp',
    specBase: 'Snapdragon 8 Gen 3 · 12GB RAM · 200MP',
    image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=1200&auto=format&fit=crop&q=80',
    basePrice: 12800000,
    saving: 2500000,
    capacities: [
      { label: '256GB', delta: 0 },
      { label: '512GB', delta: 2500000 },
      { label: '1TB', delta: 5500000 }
    ]
  },
  {
    id: 'p9',
    name: 'Xiaomi 14 Ultra',
    brand: 'Xiaomi',
    finish: 'Thấu Kính Leica Summilux · Da Thuần Chay',
    specBase: 'Snapdragon 8 Gen 3 · 16GB RAM · Cảm biến 1"',
    image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=1200&auto=format&fit=crop&q=80',
    basePrice: 12000000,
    saving: 2000000,
    capacities: [
      { label: '256GB', delta: 0 },
      { label: '512GB', delta: 2000000 },
      { label: '1TB', delta: 4500000 }
    ]
  }
];

let activeBenchModelIdx = 0;
let activeBenchCapIdx = 0;
let showAllCatalog = false;
let revealObserver = null;

const formatMoney = (amount) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

const twoDigits = (n) => (n < 10 ? '0' + n : String(n));

// ==================== 0. KHỞI TẠO & MOTION REVEAL ====================

document.addEventListener('DOMContentLoaded', async () => {
  initScrollReveal();
  hydrateFiltersFromUrl();
  renderSkeletonCards();

  await Promise.all([loadProducts(), updateCart(), checkAuthState(), loadWishlistState()]);

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

  // Auto-open Customer Self-Service Portal when visiting /customer-portal or ?portal=1
  const urlParams = new URLSearchParams(window.location.search);
  if (window.location.pathname === '/customer-portal' || urlParams.get('portal') === '1') {
    const requestedTab = urlParams.get('tab') || 'track';
    openCustomerPortal(requestedTab);
  }

  document.getElementById('btn-open-cart')?.addEventListener('click', openCartModal);
  document.getElementById('order-form')?.addEventListener('submit', handlePlaceOrder);

  window.addEventListener('popstate', () => {
    hydrateFiltersFromUrl();
    renderProductList();
  });
});

function initScrollReveal() {
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
      { threshold: 0.05 }
    );
  }

  window.addEventListener(
    'scroll',
    () => {
      document.querySelectorAll('[data-reveal]:not(.in)').forEach((el) => el.classList.add('in'));
    },
    { passive: true }
  );

  observeReveals();
}

function observeReveals() {
  const revealEls = document.querySelectorAll('[data-reveal]:not(.in)');
  if (!revealObserver) {
    revealEls.forEach((el) => el.classList.add('in'));
    return;
  }
  revealEls.forEach((el) => revealObserver.observe(el));
}

function expandAllCatalog() {
  showAllCatalog = true;
  renderProductList();
}

// ==================== 0B. HERO HARDWARE CONFIGURATOR ====================

function selectBenchModel(idx) {
  activeBenchModelIdx = idx;
  document.querySelectorAll('.bench-model-btn').forEach((btn, i) => {
    btn.classList.toggle('active', i === idx);
  });
  updateBenchDisplay();
}

function selectBenchCapacity(idx) {
  activeBenchCapIdx = idx;
  document.querySelectorAll('.bench-cap-btn').forEach((btn, i) => {
    btn.classList.toggle('active', i === idx);
  });
  updateBenchDisplay();
}

function updateBenchDisplay() {
  const model = BENCH_MODELS[activeBenchModelIdx] || BENCH_MODELS[0];
  const cap = model.capacities[activeBenchCapIdx] || model.capacities[0];
  const finalPrice = model.basePrice + cap.delta;

  const imgEl = document.getElementById('hero-stage-image');
  if (imgEl && imgEl.src !== model.image) {
    imgEl.src = model.image;
    imgEl.alt = model.name;
  }

  const capModelEl = document.getElementById('hero-caption-model');
  if (capModelEl) capModelEl.innerText = `${model.name} · ${cap.label}`;

  const capFinishEl = document.getElementById('hero-caption-finish');
  if (capFinishEl) capFinishEl.innerText = model.finish;

  const specEl = document.getElementById('bench-spec-text');
  if (specEl) specEl.innerText = `${model.specBase} · ${cap.label}`;

  const priceEl = document.getElementById('bench-live-price');
  if (priceEl) priceEl.innerText = formatMoney(finalPrice);

  const saveEl = document.getElementById('bench-live-saving');
  if (saveEl) saveEl.innerText = `Giá ưu đãi kho chính ngạch · Sẵn hàng giao ngay`;
}

async function triggerBenchBuy() {
  const model = BENCH_MODELS[activeBenchModelIdx] || BENCH_MODELS[0];
  const matched =
    allProducts.find((p) => String(p.id) === String(model.id)) ||
    allProducts.find((p) => p.name.toLowerCase().includes(model.name.toLowerCase())) ||
    allProducts.find((p) => (p.brand || '').toLowerCase() === model.brand.toLowerCase()) ||
    allProducts[0];
  const targetId = matched ? matched.id : model.id;
  await buyNow(targetId);
}

// ==================== 1. DANH MỤC, BỘ LỌC ĐA CHIỀU & ĐỒNG BỘ URL ====================

function hydrateFiltersFromUrl() {
  const params = new URLSearchParams(window.location.search);
  currentBrand = params.get('brand') || 'all';
  currentSearch = (params.get('q') || '').toLowerCase().trim();
  currentSpecsFilter.ram = params.get('ram') || 'all';
  currentSpecsFilter.storage = params.get('storage') || 'all';
  currentSpecsFilter.chip = params.get('chip') || 'all';
  currentSpecsFilter.priceRange = params.get('priceRange') || 'all';
  currentSpecsFilter.sort = params.get('sort') || 'default';

  const searchInput = document.getElementById('input-search');
  if (searchInput) searchInput.value = params.get('q') || '';

  const setSelectVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val;
  };
  setSelectVal('filter-ram', currentSpecsFilter.ram);
  setSelectVal('filter-storage', currentSpecsFilter.storage);
  setSelectVal('filter-chip', currentSpecsFilter.chip);
  setSelectVal('filter-price', currentSpecsFilter.priceRange);
  setSelectVal('filter-sort', currentSpecsFilter.sort || 'default');

  document.querySelectorAll('.filter-bar .btn-filter').forEach((btn) => {
    const b = btn.getAttribute('data-brand') || 'all';
    btn.classList.toggle('active', b.toLowerCase() === currentBrand.toLowerCase());
  });
}

function syncFiltersToUrl() {
  const params = new URLSearchParams();
  if (currentBrand && currentBrand !== 'all') params.set('brand', currentBrand);
  if (currentSearch) params.set('q', currentSearch);
  if (currentSpecsFilter.ram !== 'all') params.set('ram', currentSpecsFilter.ram);
  if (currentSpecsFilter.storage !== 'all') params.set('storage', currentSpecsFilter.storage);
  if (currentSpecsFilter.chip !== 'all') params.set('chip', currentSpecsFilter.chip);
  if (currentSpecsFilter.priceRange !== 'all') params.set('priceRange', currentSpecsFilter.priceRange);
  if (currentSpecsFilter.sort && currentSpecsFilter.sort !== 'default') {
    params.set('sort', currentSpecsFilter.sort);
  }

  const qs = params.toString();
  const nextUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  window.history.replaceState({}, '', nextUrl);
  updateBreadcrumbAndChips();
}

function updateBreadcrumbAndChips() {
  const sep = document.getElementById('bc-active-sep');
  const label = document.getElementById('bc-active-label');
  const chipsBox = document.getElementById('active-filter-chips');

  const activeTags = [];
  if (currentBrand && currentBrand !== 'all') {
    activeTags.push({ label: `Hãng: ${currentBrand}`, clear: () => filterByBrand('all') });
  }
  if (currentSpecsFilter.ram && currentSpecsFilter.ram !== 'all') {
    activeTags.push({
      label: `RAM: ${currentSpecsFilter.ram}`,
      clear: () => {
        document.getElementById('filter-ram').value = 'all';
        handleSpecsFilterChange();
      }
    });
  }
  if (currentSpecsFilter.storage && currentSpecsFilter.storage !== 'all') {
    activeTags.push({
      label: `ROM: ${currentSpecsFilter.storage}`,
      clear: () => {
        document.getElementById('filter-storage').value = 'all';
        handleSpecsFilterChange();
      }
    });
  }
  if (currentSpecsFilter.chip && currentSpecsFilter.chip !== 'all') {
    activeTags.push({
      label: `Chip: ${currentSpecsFilter.chip}`,
      clear: () => {
        document.getElementById('filter-chip').value = 'all';
        handleSpecsFilterChange();
      }
    });
  }
  if (currentSpecsFilter.priceRange && currentSpecsFilter.priceRange !== 'all') {
    const priceSelect = document.getElementById('filter-price');
    const priceText = priceSelect?.options[priceSelect.selectedIndex]?.text || currentSpecsFilter.priceRange;
    activeTags.push({
      label: `Giá: ${priceText}`,
      clear: () => {
        document.getElementById('filter-price').value = 'all';
        handleSpecsFilterChange();
      }
    });
  }
  if (currentSearch) {
    activeTags.push({
      label: `Từ khóa: "${currentSearch}"`,
      clear: () => {
        document.getElementById('input-search').value = '';
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
      window._activeFilterClearFns = activeTags.map((t) => t.clear);
    }
  }
}

function clearSingleFilterChip(idx) {
  if (window._activeFilterClearFns && window._activeFilterClearFns[idx]) {
    window._activeFilterClearFns[idx]();
  }
}

function renderSkeletonCards() {
  const container = document.getElementById('product-list');
  if (!container) return;
  container.innerHTML = Array.from({ length: 6 })
    .map(
      () => `
      <div class="product-card" style="min-height: 420px; padding: 1.5rem;">
        <div style="height: 240px; background-color: var(--bg); margin-bottom: 1rem;"></div>
        <div style="height: 22px; width: 75%; background-color: var(--bg); margin-bottom: 0.75rem;"></div>
        <div style="height: 18px; width: 55%; background-color: var(--bg);"></div>
      </div>
    `
    )
    .join('');
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
    renderProductList();
  } catch (err) {
    console.error('Lỗi tải sản phẩm:', err);
  }
}

function handleSearch(val) {
  const inputVal = val !== undefined ? val : document.getElementById('input-search')?.value || '';
  currentSearch = String(inputVal).toLowerCase().trim();
  syncFiltersToUrl();
  renderProductList();
}

function filterByBrand(brand) {
  currentBrand = brand;
  document.querySelectorAll('.filter-bar .btn-filter').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-brand')?.toLowerCase() === brand.toLowerCase());
  });
  syncFiltersToUrl();
  renderProductList();
}

function handleSpecsFilterChange() {
  currentSpecsFilter.ram = document.getElementById('filter-ram')?.value || 'all';
  currentSpecsFilter.storage = document.getElementById('filter-storage')?.value || 'all';
  currentSpecsFilter.chip = document.getElementById('filter-chip')?.value || 'all';
  currentSpecsFilter.priceRange = document.getElementById('filter-price')?.value || 'all';
  currentSpecsFilter.sort = document.getElementById('filter-sort')?.value || 'default';
  syncFiltersToUrl();
  renderProductList();
}

function resetAllFilters() {
  currentBrand = 'all';
  currentSearch = '';
  currentSpecsFilter = { ram: 'all', storage: 'all', chip: 'all', priceRange: 'all', sort: 'default' };

  const searchInput = document.getElementById('input-search');
  if (searchInput) searchInput.value = '';
  document.querySelectorAll('.filter-bar .btn-filter').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-brand') === 'all');
  });

  ['filter-ram', 'filter-storage', 'filter-chip', 'filter-price'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = 'all';
  });
  const sortEl = document.getElementById('filter-sort');
  if (sortEl) sortEl.value = 'default';

  syncFiltersToUrl();
  renderProductList();
}

function normalizeClientCapacity(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/(\d+)\s+(gb|tb|mah)\b/gi, '$1$2');
}

function matchesProductField(p, field, val) {
  if (!val || val === 'all') return true;
  const targets = String(val)
    .toLowerCase()
    .split(',')
    .map((s) => normalizeClientCapacity(s.trim()))
    .filter(Boolean);
  if (targets.length === 0) return true;

  const detailed = normalizeClientCapacity(p.detailedSpecs?.[field] || '');
  const specs = normalizeClientCapacity(p.specs || '');
  const name = normalizeClientCapacity(p.name || '');

  if (field === 'ram' || field === 'storage') {
    const source = detailed || `${specs} ${name}`;
    return targets.some((t) => {
      const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`(?<![0-9a-z])${escaped}(?![0-9a-z])`, 'i').test(source);
    });
  }

  const combined = `${detailed} ${specs} ${name}`;
  return targets.some((t) => combined.includes(t));
}

function matchesPriceFilter(price, rangeKey) {
  if (!rangeKey || rangeKey === 'all') return true;
  if (rangeKey === 'under15') return price < 15000000;
  if (rangeKey === '15to25') return price >= 15000000 && price <= 25000000;
  if (rangeKey === 'over25') return price > 25000000;
  if (rangeKey.includes('-')) {
    const [minStr, maxStr] = rangeKey.split('-');
    const min = Number(minStr) || 0;
    const max = Number(maxStr) || Infinity;
    return price >= min && price <= max;
  }
  return true;
}

function renderProductList() {
  const container = document.getElementById('product-list');
  if (!container) return;

  updateBreadcrumbAndChips();

  let list = [...allProducts];

  if (currentBrand && currentBrand !== 'all') {
    list = list.filter((p) => String(p.brand || '').toLowerCase() === currentBrand.toLowerCase());
  }

  if (currentSpecsFilter.ram && currentSpecsFilter.ram !== 'all') {
    list = list.filter((p) => matchesProductField(p, 'ram', currentSpecsFilter.ram));
  }

  if (currentSpecsFilter.storage && currentSpecsFilter.storage !== 'all') {
    list = list.filter((p) => matchesProductField(p, 'storage', currentSpecsFilter.storage));
  }

  if (currentSpecsFilter.chip && currentSpecsFilter.chip !== 'all') {
    list = list.filter((p) => matchesProductField(p, 'chip', currentSpecsFilter.chip));
  }

  if (currentSpecsFilter.priceRange && currentSpecsFilter.priceRange !== 'all') {
    list = list.filter((p) => matchesPriceFilter(p.price, currentSpecsFilter.priceRange));
  }

  if (currentSearch) {
    list = list.filter((p) => {
      const hay = [
        p.name,
        p.brand,
        p.specs,
        p.detailedSpecs?.chip,
        p.detailedSpecs?.ram,
        p.detailedSpecs?.storage
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(currentSearch);
    });
  }

  const sortMode = currentSpecsFilter.sort;
  if (sortMode === 'price_asc' || sortMode === 'price-asc') {
    list.sort((a, b) => a.price - b.price);
  } else if (sortMode === 'price_desc' || sortMode === 'price-desc') {
    list.sort((a, b) => b.price - a.price);
  } else if (sortMode === 'name_asc') {
    list.sort((a, b) => String(a.name).localeCompare(String(b.name), 'vi'));
  } else if (sortMode === 'discount_desc' || sortMode === 'discount') {
    const getDisc = (p) => (p.oldPrice && p.oldPrice > p.price ? 1 - p.price / p.oldPrice : 0);
    list.sort((a, b) => getDisc(b) - getDisc(a));
  }

  const countEl = document.getElementById('total-products-count');
  if (countEl) countEl.innerText = list.length;

  const moreWrap = document.getElementById('catalog-more-wrap');

  if (list.length === 0) {
    if (moreWrap) moreWrap.style.display = 'none';
    container.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 3rem; background-color: var(--surface); text-align: center;">
        <p style="font-size: var(--fs-h3); font-weight: 600; color: var(--ink); margin-bottom: 0.5rem;">Không tìm thấy thiết bị khớp bộ lọc</p>
        <p style="font-size: var(--fs-body); color: var(--muted); margin-bottom: 1.5rem;">Thử nới lỏng tiêu chí RAM, bộ nhớ trong, mức giá hoặc đặt lại toàn bộ bộ lọc.</p>
        <button type="button" class="btn-primary-sage" onclick="resetAllFilters()">Đặt lại bộ lọc</button>
      </div>
    `;
    return;
  }

  const isUnfiltered =
    (!currentBrand || currentBrand === 'all') &&
    !currentSearch &&
    currentSpecsFilter.ram === 'all' &&
    currentSpecsFilter.storage === 'all' &&
    currentSpecsFilter.chip === 'all' &&
    currentSpecsFilter.priceRange === 'all' &&
    (!currentSpecsFilter.sort || currentSpecsFilter.sort === 'default');

  const visibleList = isUnfiltered && !showAllCatalog ? list.slice(0, 6) : list;

  if (moreWrap) {
    if (isUnfiltered && !showAllCatalog && list.length > 6) {
      moreWrap.style.display = 'flex';
      moreWrap.innerHTML = `
        <button type="button" class="btn-secondary-tone" onclick="expandAllCatalog()">
          Hiển thị toàn bộ ${list.length} thiết bị trong kho
        </button>
      `;
    } else {
      moreWrap.style.display = 'none';
      moreWrap.innerHTML = '';
    }
  }

  container.innerHTML = visibleList
    .map((p, idx) => {
      const discount = p.oldPrice && p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
      const isLiked = userWishlist.includes(String(p.id));
      const ramBadge = p.detailedSpecs?.ram ? `<span class="spec-pill">${p.detailedSpecs.ram}</span>` : '';
      const romBadge = p.detailedSpecs?.storage ? `<span class="spec-pill">${p.detailedSpecs.storage}</span>` : '';
      const chipBadge = p.detailedSpecs?.chip ? `<span class="spec-pill">${p.detailedSpecs.chip}</span>` : '';

      return `
      <article class="product-card" data-reveal style="--i:${idx % 3}">
        <div class="product-img-wrapper" onclick="openProductDetailModal('${p.id}')">
          <img class="product-img" src="${p.image}" alt="${p.name}" loading="lazy" decoding="async">
        </div>

        <div class="product-body">
          <div class="product-meta-row">
            <span class="product-brand-tag">${p.brand}</span>
            <span class="product-stock-tag">${discount > 0 ? `Ưu đãi -${discount}%` : 'Sẵn hàng VN/A'}</span>
          </div>

          <div class="product-title" onclick="openProductDetailModal('${p.id}')">${p.name}</div>

          ${
            ramBadge || romBadge || chipBadge
              ? `<div class="product-specs-pills">${chipBadge}${ramBadge}${romBadge}</div>`
              : `<p style="font-size:var(--fs-sm); color:var(--muted);">${p.specs || 'Cấu hình tiêu chuẩn chính hãng'}</p>`
          }

          <div class="product-price-box">
            <span class="current-price">${formatMoney(p.price)}</span>
            ${p.oldPrice && p.oldPrice > p.price ? `<span class="old-price">${formatMoney(p.oldPrice)}</span>` : ''}
          </div>

          <div class="product-actions">
            <button type="button" class="btn-buy-now" onclick="buyNow('${p.id}')">Mua ngay</button>
            <button type="button" class="btn-add-cart" onclick="addToCart('${p.id}')" title="Thêm vào giỏ">+ Giỏ</button>
            <button type="button" class="btn-add-cart ${isLiked ? 'active' : ''}" onclick="toggleWishlistItem('${p.id}')" title="Lưu yêu thích">${isLiked ? 'Đã lưu' : 'Lưu'}</button>
          </div>
        </div>
      </article>
    `;
    })
    .join('');

  observeReveals();
}

// ==================== 2. QUẢN LÝ GIỎ HÀNG & THANH TOÁN (COD + VIETQR) ====================

async function addToCart(productId, openAfter = false) {
  try {
    const res = await fetch('/api/cart/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId })
    });
    const data = await res.json();
    if (data.success) {
      updateCart();
      showToast('Đã thêm sản phẩm vào giỏ hàng', 'success');
      if (openAfter) openCartModal();
    }
  } catch {
    showToast('Không thể thêm sản phẩm vào giỏ hàng', 'error');
  }
}

async function buyNow(productId) {
  await addToCart(productId, true);
}

async function updateCartQty(productId, newQty) {
  try {
    await fetch('/api/cart/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity: newQty })
    });
    await updateCart();
    await openCartModal();
  } catch {
    showToast('Không thể cập nhật số lượng', 'error');
  }
}

async function removeCartItem(productId) {
  try {
    await fetch('/api/cart/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId })
    });
    await updateCart();
    await openCartModal();
  } catch {
    showToast('Không thể xóa sản phẩm khỏi giỏ', 'error');
  }
}

async function updateCart() {
  try {
    const res = await fetch('/api/cart');
    const { cart } = await res.json();
    const count = (cart || []).reduce((s, i) => s + i.quantity, 0);
    const el = document.getElementById('cart-count');
    if (el) el.innerText = count;
  } catch {}
}

function selectPaymentMethodUI(method) {
  const norm = String(method || 'COD').toUpperCase();
  const isQr = norm === 'QR' || norm === 'BANK_QR';
  document.getElementById('pay-opt-cod')?.classList.toggle('active', !isQr);
  document.getElementById('pay-opt-qr')?.classList.toggle('active', isQr);

  const radios = document.querySelectorAll('input[name="paymentMethod"]');
  radios.forEach((r) => {
    const val = r.value.toUpperCase();
    r.checked = isQr ? val === 'BANK_QR' || val === 'QR' : val === 'COD';
  });

  const btn = document.getElementById('btn-order-submit');
  if (btn) {
    btn.innerText = isQr
      ? 'Đặt hàng & Hiển thị mã VietQR'
      : 'Xác nhận đặt hàng (COD)';
  }
}

async function openCartModal() {
  try {
    const res = await fetch('/api/cart');
    const { cart, total } = await res.json();
    const container = document.getElementById('cart-items');

    if (!cart || cart.length === 0) {
      container.innerHTML =
        '<div style="padding: 1.5rem; background-color: var(--bg); color: var(--muted); text-align: center;">Giỏ hàng của bạn đang trống.</div>';
      document.getElementById('cart-total').innerText = '0 ₫';
    } else {
      container.innerHTML = cart
        .map(
          (i) => `
        <div class="cart-item">
          <div class="cart-item-info">
            <img class="cart-item-img" src="${i.image || ''}" alt="${i.name}" loading="lazy">
            <div>
              <div class="cart-item-title">${i.name}</div>
              <div class="cart-item-price">${formatMoney(i.price)} &times; ${i.quantity} = ${formatMoney(i.price * i.quantity)}</div>
            </div>
          </div>
          <div class="cart-item-controls">
            <button type="button" class="qty-btn" onclick="updateCartQty('${i.id}', ${i.quantity - 1})">-</button>
            <span class="tabular" style="min-width: 1.5rem; text-align: center;">${i.quantity}</span>
            <button type="button" class="qty-btn" onclick="updateCartQty('${i.id}', ${i.quantity + 1})">+</button>
            <button type="button" class="btn-remove" onclick="removeCartItem('${i.id}')">Xóa</button>
          </div>
        </div>
      `
        )
        .join('');
      document.getElementById('cart-total').innerText = formatMoney(total || 0);
    }

    if (currentUser) {
      const cName = document.getElementById('c-name');
      const cPhone = document.getElementById('c-phone');
      const cAddr = document.getElementById('c-address');
      if (cName) cName.value = currentUser.fullName || '';
      if (cPhone) cPhone.value = currentUser.phone || '';
      if (cAddr) cAddr.value = currentUser.address || '';
      const hint = document.getElementById('remember-hint');
      if (hint) hint.style.display = 'inline';
    }

    openModal('cart-modal');
  } catch {
    showToast('Không thể tải giỏ hàng', 'error');
  }
}

function closeCartModal() {
  closeModal('cart-modal');
}

async function handlePlaceOrder(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-order-submit');
  if (btn) {
    btn.disabled = true;
    btn.innerText = 'Đang khởi tạo đơn hàng...';
  }

  const selectedRadio = document.querySelector('input[name="paymentMethod"]:checked');
  const rawMethod = selectedRadio ? selectedRadio.value : 'COD';
  const paymentMethod = rawMethod.toUpperCase() === 'BANK_QR' || rawMethod.toLowerCase() === 'qr' ? 'qr' : 'cod';

  const payload = {
    fullName: document.getElementById('c-name').value.trim(),
    phone: document.getElementById('c-phone').value.trim(),
    address: document.getElementById('c-address').value.trim(),
    note: document.getElementById('c-note').value.trim(),
    rememberMe: document.getElementById('c-remember').checked,
    paymentMethod
  };

  try {
    const res = await fetch('/api/orders/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.success) {
      closeModal('cart-modal');
      updateCart();
      await checkAuthState();

      if (data.paymentMethod === 'qr') {
        openQrPaymentModal(
          data.order || {
            id: data.orderId,
            paymentRef: data.paymentRef,
            paymentExpiresAt: data.paymentExpiresAt,
            totalAmount: data.order?.totalAmount || 0,
            customerInfo: { phone: payload.phone }
          }
        );
      } else {
        showToast('Đặt hàng COD thành công. Mã đơn: ' + data.orderId, 'success');
        openCustomerPortal('track', { orderId: data.orderId, phone: payload.phone });
      }
    } else {
      showToast(data.message || 'Lỗi đặt hàng', 'error');
    }
  } catch {
    showToast('Lỗi kết nối máy chủ khi đặt hàng', 'error');
  } finally {
    if (btn) btn.disabled = false;
    selectPaymentMethodUI(paymentMethod);
  }
}

// ==================== 2B. VIETQR PAYMENT SANDBOX & 3S POLLING ====================

function openQrPaymentModal(order) {
  stopQrPolling();
  activeQrSession.orderId = order.id;
  activeQrSession.paymentRef = order.paymentRef || `PAY_${order.id}`;
  activeQrSession.expiresAt = order.paymentExpiresAt;
  activeQrSession.phone = order.customerInfo?.phone || document.getElementById('c-phone')?.value || '';

  document.getElementById('qr-order-id-text').innerText = '#' + order.id;
  document.getElementById('qr-ref-text').innerText = activeQrSession.paymentRef;
  document.getElementById('qr-amount-display').innerText = formatMoney(order.totalAmount || 0);

  const qrData = encodeURIComponent(
    `TECHSTORE|${order.id}|${activeQrSession.paymentRef}|${order.totalAmount || 0}`
  );
  document.getElementById('qr-code-img').src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${qrData}`;

  const banner = document.getElementById('qr-status-banner');
  if (banner) {
    banner.className = 'qr-status-banner';
    banner.innerText = 'Đang chờ quét mã VietQR thanh toán (tự động kiểm tra mỗi 3 giây)...';
  }

  openModal('qr-payment-modal');

  updateQrCountdownDisplay();
  activeQrSession.countdownTimer = setInterval(updateQrCountdownDisplay, 1000);
  activeQrSession.pollTimer = setInterval(() => pollQrPaymentStatus(order.id), 3000);
}

function updateQrCountdownDisplay() {
  const timerEl = document.getElementById('qr-countdown-timer');
  if (!timerEl || !activeQrSession.expiresAt) return;
  const remainingMs = Date.parse(activeQrSession.expiresAt) - Date.now();
  if (remainingMs <= 0) {
    timerEl.innerText = '00:00 (Hết hạn)';
    pollQrPaymentStatus(activeQrSession.orderId);
    return;
  }
  const mins = Math.floor(remainingMs / 60000);
  const secs = Math.floor((remainingMs % 60000) / 1000);
  timerEl.innerText = `${twoDigits(mins)}:${twoDigits(secs)}`;
}

async function pollQrPaymentStatus(orderId) {
  if (!orderId) return;
  try {
    const res = await fetch(`/api/orders/${orderId}/payment-status`);
    const data = await res.json();
    if (!data.success) return;

    const banner = document.getElementById('qr-status-banner');
    if (data.paymentStatus === 'paid') {
      stopQrPolling();
      if (banner) {
        banner.className = 'qr-status-banner paid';
        banner.innerText = 'Thanh toán VietQR thành công. Đơn hàng đã được xác nhận.';
      }
      showToast('Thanh toán VietQR thành công cho đơn #' + orderId, 'success');
      setTimeout(() => {
        closeModal('qr-payment-modal');
        openCustomerPortal('track', { orderId, phone: activeQrSession.phone });
      }, 900);
    } else if (data.paymentStatus === 'expired' || data.status === 'cancelled') {
      stopQrPolling();
      if (banner) {
        banner.className = 'qr-status-banner';
        banner.innerText = 'Đơn hàng đã hết hạn thanh toán VietQR hoặc đã bị hủy.';
      }
      showToast('Đơn hàng QR đã hết hạn hoặc bị hủy', 'error');
    }
  } catch {}
}

async function simulateQrWebhook(action = 'confirm') {
  if (!activeQrSession.orderId) return;
  const btn = document.getElementById('btn-simulate-qr-confirm');
  if (btn) btn.disabled = true;

  try {
    const res = await fetch('/api/payments/sandbox-webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: activeQrSession.orderId,
        paymentRef: activeQrSession.paymentRef,
        action
      })
    });
    const data = await res.json();
    if (data.success) {
      await pollQrPaymentStatus(activeQrSession.orderId);
      if (action === 'cancel') {
        closeQrPaymentModal();
      }
    } else {
      showToast(data.message || 'Lỗi xử lý thanh toán VietQR', 'error');
    }
  } catch {
    showToast('Lỗi kết nối webhook sandbox', 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
}

function stopQrPolling() {
  if (activeQrSession.pollTimer) {
    clearInterval(activeQrSession.pollTimer);
    activeQrSession.pollTimer = null;
  }
  if (activeQrSession.countdownTimer) {
    clearInterval(activeQrSession.countdownTimer);
    activeQrSession.countdownTimer = null;
  }
}

function closeQrPaymentModal() {
  stopQrPolling();
  closeModal('qr-payment-modal');
}

// ==================== 3. XÁC THỰC KHÁCH HÀNG & WISHLIST ====================

async function checkAuthState() {
  try {
    const res = await fetch('/api/customers/profile');
    const { loggedIn, remembered, data } = await res.json();

    const authBtn = document.getElementById('btn-open-auth');
    const badge = document.getElementById('user-profile-badge');

    if (data && (loggedIn || remembered)) {
      currentUser = data;
      if (Array.isArray(data.wishlist)) {
        userWishlist = data.wishlist.map(String);
        updateWishlistBadge();
      }
      if (authBtn) authBtn.style.display = 'none';
      if (badge) badge.style.display = 'inline-flex';

      const name = data.fullName || 'Khách';
      const dispEl = document.getElementById('user-display-name');
      const initEl = document.getElementById('user-avatar-initial');
      if (dispEl) dispEl.innerText = name;
      if (initEl) initEl.innerText = name.charAt(0).toUpperCase();

      const cName = document.getElementById('c-name');
      const cPhone = document.getElementById('c-phone');
      const cAddress = document.getElementById('c-address');
      if (cName && !cName.value) cName.value = data.fullName || '';
      if (cPhone && !cPhone.value) cPhone.value = data.phone || '';
      if (cAddress && !cAddress.value) cAddress.value = data.address || '';
    } else {
      currentUser = null;
      if (authBtn) authBtn.style.display = 'inline-flex';
      if (badge) badge.style.display = 'none';
    }
  } catch {}
}

async function loadWishlistState() {
  try {
    const res = await fetch('/api/customers/wishlist');
    const data = await res.json();
    if (data.success && Array.isArray(data.wishlist)) {
      userWishlist = data.wishlist.map(String);
      updateWishlistBadge();
      renderProductList();
    }
  } catch {}
}

function updateWishlistBadge() {
  const badge = document.getElementById('wishlist-count-badge');
  if (!badge) return;
  badge.innerText = userWishlist.length;
  badge.style.display = userWishlist.length > 0 ? 'inline-flex' : 'none';
}

async function toggleWishlistItem(productId) {
  try {
    const res = await fetch('/api/customers/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId })
    });
    const data = await res.json();
    if (data.success) {
      userWishlist = (data.wishlist || []).map(String);
      updateWishlistBadge();
      renderProductList();
      showToast(data.message || 'Đã cập nhật danh sách yêu thích', 'info');
      const wishPanel = document.getElementById('portal-panel-wishlist');
      if (wishPanel && wishPanel.style.display !== 'none') {
        renderPortalWishlistTab();
      }
    }
  } catch {
    showToast('Không thể cập nhật danh sách yêu thích', 'error');
  }
}

function openAuthModal(tab = 'login') {
  switchAuthTab(tab);
  openModal('auth-modal');
}

function closeAuthModal() {
  closeModal('auth-modal');
}

function switchAuthTab(tab) {
  const isLogin = tab === 'login';
  document.getElementById('tab-login-btn')?.classList.toggle('active', isLogin);
  document.getElementById('tab-register-btn')?.classList.toggle('active', !isLogin);
  const fLogin = document.getElementById('form-customer-login');
  const fReg = document.getElementById('form-customer-register');
  if (fLogin) fLogin.style.display = isLogin ? 'block' : 'none';
  if (fReg) fReg.style.display = isLogin ? 'none' : 'block';
  const titleEl = document.getElementById('auth-modal-title');
  if (titleEl) {
    titleEl.innerText = isLogin ? 'Đăng nhập tài khoản' : 'Đăng ký thành viên mới';
  }
}

async function handleCustomerLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-login-submit');
  if (btn) {
    btn.disabled = true;
    btn.innerText = 'Đang đăng nhập...';
  }

  const payload = {
    phone: document.getElementById('login-phone').value.trim(),
    password: document.getElementById('login-password').value,
    rememberMe: document.getElementById('login-remember').checked
  };

  try {
    const res = await fetch('/api/customers/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.success) {
      showToast('Xin chào, ' + (data.customer?.fullName || 'khách hàng'), 'success');
      closeModal('auth-modal');
      document.getElementById('form-customer-login')?.reset();
      await checkAuthState();
      await loadWishlistState();
    } else {
      showToast(data.message || 'Sai số điện thoại hoặc mật khẩu', 'error');
    }
  } catch {
    showToast('Lỗi kết nối máy chủ', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerText = 'Đăng nhập ngay';
    }
  }
}

async function handleCustomerRegister(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-reg-submit');
  if (btn) {
    btn.disabled = true;
    btn.innerText = 'Đang tạo tài khoản...';
  }

  const payload = {
    fullName: document.getElementById('reg-name').value.trim(),
    phone: document.getElementById('reg-phone').value.trim(),
    password: document.getElementById('reg-password').value,
    email: document.getElementById('reg-email').value.trim(),
    address: document.getElementById('reg-address').value.trim()
  };

  try {
    const res = await fetch('/api/customers/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.success) {
      showToast('Đăng ký tài khoản thành công', 'success');
      closeModal('auth-modal');
      document.getElementById('form-customer-register')?.reset();
      await checkAuthState();
      await loadWishlistState();
    } else {
      showToast(data.message || 'Lỗi đăng ký tài khoản', 'error');
    }
  } catch {
    showToast('Lỗi kết nối máy chủ', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerText = 'Tạo tài khoản';
    }
  }
}

async function logoutCustomer() {
  if (confirm('Bạn có chắc chắn muốn đăng xuất tài khoản?')) {
    await fetch('/api/customers/logout', { method: 'POST' });
    currentUser = null;
    const badge = document.getElementById('user-profile-badge');
    const authBtn = document.getElementById('btn-open-auth');
    if (badge) badge.style.display = 'none';
    if (authBtn) authBtn.style.display = 'inline-flex';
    document.getElementById('order-form')?.reset();
    showToast('Đã đăng xuất tài khoản', 'info');
  }
}

// ==================== 4. CỔNG KHÁCH HÀNG TỰ PHỤC VỤ & TIMELINE ====================

function openMyOrdersModal() {
  openCustomerPortal('orders');
}

function closeMyOrdersModal() {
  closeModal('my-orders-modal');
}

function openCustomerPortal(tab = 'track', prefill = null) {
  openModal('customer-portal-modal');
  switchPortalTab(tab);

  if (prefill && prefill.orderId) {
    const idInput = document.getElementById('track-order-id');
    const phoneInput = document.getElementById('track-order-phone');
    if (idInput) idInput.value = prefill.orderId;
    if (phoneInput) phoneInput.value = prefill.phone || currentUser?.phone || '';
    if (idInput?.value && phoneInput?.value) {
      executeTrackOrder(idInput.value, phoneInput.value);
    }
  } else if (tab === 'track' && currentUser?.phone) {
    const phoneInput = document.getElementById('track-order-phone');
    if (phoneInput && !phoneInput.value) phoneInput.value = currentUser.phone;
  }
}

function closeCustomerPortal() {
  closeModal('customer-portal-modal');
}

function switchPortalTab(tab) {
  document.querySelectorAll('.portal-tabs .portal-tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-ptab') === tab);
  });

  ['track', 'orders', 'profile', 'wishlist'].forEach((t) => {
    const panel = document.getElementById(`portal-panel-${t}`);
    if (panel) panel.style.display = t === tab ? 'block' : 'none';
  });

  if (tab === 'orders') renderPortalOrdersTab();
  if (tab === 'profile') renderPortalProfileTab();
  if (tab === 'wishlist') renderPortalWishlistTab();
}

function renderOrderTimelineTracker(order) {
  const status = order.status || 'pending';
  const isCancelled = status === 'cancelled';

  const steps = [
    { key: 'pending', label: order.paymentMethod === 'qr' ? 'Chờ TT QR / Xác nhận' : 'Chờ xác nhận' },
    { key: 'confirmed', label: 'Đã xác nhận' },
    { key: 'shipping', label: 'Đang giao hàng' },
    { key: 'completed', label: 'Hoàn thành' }
  ];

  const rankMap = {
    awaiting_payment: 0,
    pending: 0,
    confirmed: 1,
    shipping: 2,
    completed: 3
  };
  const currentRank = rankMap[status] !== undefined ? rankMap[status] : 0;

  const stepsHtml = steps
    .map((s, idx) => {
      let stateClass = '';
      if (!isCancelled && (idx < currentRank || status === 'completed')) {
        stateClass = 'done';
      } else if (!isCancelled && idx === currentRank) {
        stateClass = 'current';
      }
      return `<div class="step-node ${stateClass}">${s.label}</div>`;
    })
    .join('');

  const cancelBanner = isCancelled
    ? `<div style="background-color: var(--danger-bg); color: var(--danger-ink); padding: 0.75rem 1rem; margin-top: 0.75rem; font-size: 0.875rem;">
        Đơn hàng này đã bị hủy (${order.paymentStatus === 'expired' ? 'Quá hạn thanh toán QR 15 phút' : 'Đã hủy'}).
      </div>`
    : '';

  const canCancel = ['pending', 'awaiting_payment'].includes(status);
  const canPayQr = status === 'awaiting_payment' && order.paymentStatus === 'awaiting_payment';

  return `
    <div class="cust-order-card" data-ui>
      <div class="cust-order-head">
        <div>
          <span class="cust-order-id">#${order.id}</span>
          <span style="font-size: 0.8125rem; color: var(--muted); margin-left: 0.5rem;">
            ${new Date(order.createdAt).toLocaleString('vi-VN')}
          </span>
        </div>
        <span style="font-size: 0.8125rem; padding: 0.25rem 0.6rem; background-color: var(--surface); color: var(--accent-text);">
          ${order.paymentMethod === 'qr' ? 'VietQR' : 'COD'} · ${
            order.paymentStatus === 'paid'
              ? 'Đã thanh toán'
              : order.paymentStatus === 'awaiting_payment'
                ? 'Chờ quét QR'
                : order.paymentStatus === 'expired'
                  ? 'Hết hạn QR'
                  : 'Chưa thanh toán'
          }
        </span>
      </div>

      <div class="order-stepper">${stepsHtml}</div>
      ${cancelBanner}
      ${
        Array.isArray(order.statusHistory) && order.statusHistory.length > 0
          ? `<div style="margin-top: 0.65rem; padding: 0.65rem 0.85rem; background-color: var(--surface); font-size: 0.8125rem; color: var(--muted);">
              ${order.statusHistory
                .slice()
                .reverse()
                .map(
                  (h) =>
                    `<div style="display:flex; justify-content:space-between; gap:0.5rem; padding:0.15rem 0;">
                      <span><strong style="color:var(--ink);">${h.note || h.status}</strong></span>
                      <span class="tabular">${h.timestamp ? new Date(h.timestamp).toLocaleString('vi-VN') : ''}</span>
                    </div>`
                )
                .join('')}
            </div>`
          : ''
      }

      <div style="margin-top: 0.75rem; padding: 0.85rem; background-color: var(--surface); font-size: 0.875rem;">
        <div style="margin-bottom: 0.5rem;">
          ${(order.items || [])
            .map((i) => `<div>${i.name} (x${i.quantity}) · <strong class="tabular">${formatMoney(i.price * i.quantity)}</strong></div>`)
            .join('')}
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; padding-top: 0.5rem; color: var(--muted);">
          <span>Người nhận: ${order.customerInfo?.fullName || ''} (${order.customerInfo?.phone || ''}) · ${order.customerInfo?.address || ''}</span>
          <strong class="tabular" style="font-size: 1rem; color: var(--accent-text);">Tổng: ${formatMoney(order.totalAmount)}</strong>
        </div>
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 0.65rem; margin-top: 0.85rem;">
        ${
          canPayQr
            ? `<button type="button" class="btn-primary-sage" onclick="openQrModalByOrderMeta('${String(order.id).replace(/'/g, "\\'")}', '${String(order.paymentRef || '').replace(/'/g, "\\'")}', '${String(order.paymentExpiresAt || '').replace(/'/g, "\\'")}', ${Number(order.totalAmount) || 0}, '${String(order.customerInfo?.phone || '').replace(/'/g, "\\'")}')">Mở mã VietQR</button>`
            : ''
        }
        ${
          canCancel
            ? `<button type="button" class="btn-remove" onclick="cancelCustomerOrderUI('${String(order.id).replace(/'/g, "\\'")}', '${String(order.customerInfo?.phone || '').replace(/'/g, "\\'")}')">Hủy đơn hàng</button>`
            : ''
        }
      </div>
    </div>
  `;
}

function openQrModalByOrderMeta(id, paymentRef, paymentExpiresAt, totalAmount, phone) {
  openQrPaymentModal({
    id,
    paymentRef,
    paymentExpiresAt,
    totalAmount,
    customerInfo: { phone }
  });
}

async function handleTrackOrderSubmit(e) {
  e.preventDefault();
  const orderId = document.getElementById('track-order-id').value.trim();
  const phone = document.getElementById('track-order-phone').value.trim();
  await executeTrackOrder(orderId, phone);
}

async function executeTrackOrder(orderId, phone) {
  const box = document.getElementById('track-order-result');
  if (!box) return;
  box.innerHTML = '<p style="padding: 1rem; color: var(--muted);">Đang tra cứu tiến độ đơn hàng...</p>';

  try {
    const res = await fetch(
      `/api/orders/track?orderId=${encodeURIComponent(orderId)}&phone=${encodeURIComponent(phone)}`
    );
    const data = await res.json();
    if (!res.ok || !data.success || !data.order) {
      box.innerHTML = `
        <div style="padding: 1.25rem; background-color: var(--danger-bg); color: var(--danger-ink);">
          <strong>${data.message || 'Không tìm thấy đơn hàng'}</strong>
          <p style="font-size: 0.875rem; margin-top: 0.25rem;">Vui lòng kiểm tra lại chính xác Mã đơn và Số điện thoại đặt hàng.</p>
        </div>
      `;
      return;
    }
    box.innerHTML = renderOrderTimelineTracker(data.order);
  } catch {
    box.innerHTML = '<p style="color: var(--danger-ink); padding: 1rem;">Lỗi kết nối máy chủ khi tra cứu đơn hàng.</p>';
  }
}

async function cancelCustomerOrderUI(orderId, phone) {
  const reason = prompt('Vui lòng nhập lý do hủy đơn hàng:', 'Thay đổi nhu cầu mua sắm');
  if (reason === null) return;

  try {
    const res = await fetch(`/api/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, reason })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Đã hủy đơn hàng #' + orderId, 'info');
      const trackPanel = document.getElementById('portal-panel-track');
      if (trackPanel && trackPanel.style.display !== 'none') {
        executeTrackOrder(orderId, phone);
      } else {
        renderPortalOrdersTab();
      }
    } else {
      showToast(data.message || 'Không thể hủy đơn hàng', 'error');
    }
  } catch {
    showToast('Lỗi kết nối khi hủy đơn hàng', 'error');
  }
}

async function renderPortalOrdersTab() {
  const container = document.getElementById('my-orders-list-body');
  if (!container) return;
  container.innerHTML = '<p style="padding: 1rem; color: var(--muted);">Đang tải lịch sử đơn hàng...</p>';

  try {
    const res = await fetch('/api/customers/my-orders');
    const { success, orders } = await res.json();

    if (!success || !orders) {
      container.innerHTML = `
        <div style="padding: 2rem; background-color: var(--bg); text-align: center;">
          <p style="margin-bottom: 1rem;">Vui lòng đăng nhập tài khoản hoặc dùng tab Tra cứu vận đơn với Số điện thoại + Mã đơn.</p>
          <button type="button" class="btn-primary-sage" onclick="closeCustomerPortal(); openAuthModal('login');">Đăng nhập ngay</button>
        </div>
      `;
      return;
    }

    if (orders.length === 0) {
      container.innerHTML = '<p style="padding: 1.5rem; background-color: var(--bg); color: var(--muted); text-align: center;">Bạn chưa có đơn đặt hàng nào tại TechStore.</p>';
      return;
    }

    container.innerHTML = orders.map((o) => renderOrderTimelineTracker(o)).join('');
  } catch {
    container.innerHTML = '<p style="color: var(--danger-ink);">Lỗi tải danh sách đơn hàng.</p>';
  }
}

async function renderPortalProfileTab() {
  const box = document.getElementById('portal-profile-content');
  if (!box) return;

  if (!currentUser) {
    box.innerHTML = `
      <div style="padding: 2rem; background-color: var(--bg); text-align: center;">
        <p style="margin-bottom: 1rem;">Đăng nhập để quản lý Sổ địa chỉ nhận hàng mặc định và theo dõi hạng thành viên.</p>
        <button type="button" class="btn-primary-sage" onclick="closeCustomerPortal(); openAuthModal('login');">Đăng nhập / Đăng ký</button>
      </div>
    `;
    return;
  }

  const spent = Number(currentUser.totalSpent) || 0;
  const tag = currentUser.tag || 'Mới';

  box.innerHTML = `
    <div style="padding: 1.25rem; background-color: var(--bg); margin-bottom: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
        <div>
          <span style="font-size: 0.8125rem; color: var(--muted);">Hạng thành viên hiện tại</span>
          <div style="font-size: 1.35rem; font-weight: 600; color: var(--accent-text);">${tag}</div>
        </div>
        <div class="tabular" style="font-size: 0.9375rem;">
          Đã hoàn tất <strong>${currentUser.orderCount || 0} đơn</strong> · Chi tiêu tích lũy: <strong style="color: var(--accent-text);">${formatMoney(spent)}</strong>
        </div>
      </div>
    </div>

    <form id="form-portal-profile" onsubmit="handleUpdateCustomerProfile(event)">
      <div class="form-row">
        <div class="form-group">
          <label for="prof-fullname">Họ và tên người nhận</label>
          <input type="text" id="prof-fullname" required value="${currentUser.fullName || ''}">
        </div>
        <div class="form-group">
          <label>Số điện thoại định danh</label>
          <input type="tel" value="${currentUser.phone || ''}" disabled style="opacity: 0.65;">
        </div>
      </div>
      <div class="form-group">
        <label for="prof-email">Email nhận hóa đơn</label>
        <input type="email" id="prof-email" value="${currentUser.email || ''}" placeholder="example@email.com">
      </div>
      <div class="form-group">
        <label for="prof-address">Địa chỉ giao hàng mặc định</label>
        <textarea id="prof-address" rows="2" required>${currentUser.address || ''}</textarea>
      </div>
      <div class="form-group">
        <label for="prof-note">Ghi chú giao hàng mặc định</label>
        <input type="text" id="prof-note" value="${currentUser.note || ''}" placeholder="Giao giờ hành chính">
      </div>
      <button type="submit" class="btn-submit" id="btn-save-profile">Lưu hồ sơ &amp; địa chỉ mặc định</button>
    </form>
  `;
}

async function handleUpdateCustomerProfile(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-save-profile');
  if (btn) btn.disabled = true;

  const payload = {
    fullName: document.getElementById('prof-fullname').value.trim(),
    email: document.getElementById('prof-email').value.trim(),
    address: document.getElementById('prof-address').value.trim(),
    note: document.getElementById('prof-note').value.trim()
  };

  try {
    const res = await fetch('/api/customers/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      currentUser = data.customer;
      showToast(data.message || 'Đã cập nhật hồ sơ mặc định', 'success');
      await checkAuthState();
      renderPortalProfileTab();
    } else {
      showToast(data.message || 'Lỗi cập nhật hồ sơ', 'error');
    }
  } catch {
    showToast('Lỗi kết nối máy chủ', 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function renderPortalWishlistTab() {
  const box = document.getElementById('portal-wishlist-content');
  if (!box) return;
  box.innerHTML = '<p style="padding: 1rem; color: var(--muted);">Đang tải danh sách yêu thích...</p>';

  try {
    const res = await fetch('/api/customers/wishlist');
    const data = await res.json();
    const items = data.products || [];
    if (items.length === 0) {
      box.innerHTML = '<p style="padding: 1.5rem; background-color: var(--bg); color: var(--muted); text-align: center;">Danh sách yêu thích đang trống.</p>';
      return;
    }

    box.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem;">
        ${items
          .map(
            (p) => `
          <div style="background-color: var(--bg); padding: 1rem; display: flex; flex-direction: column; gap: 0.5rem;">
            <img src="${p.image}" alt="${p.name}" loading="lazy" style="width: 100%; height: 140px; object-fit: contain;">
            <strong style="font-size: 0.9375rem;">${p.name}</strong>
            <span class="tabular" style="color: var(--accent-text); font-weight: 600;">${formatMoney(p.price)}</span>
            <div style="display: flex; gap: 0.5rem; margin-top: auto;">
              <button type="button" class="btn-buy-now" style="flex: 1; padding: 0.5rem;" onclick="closeCustomerPortal(); buyNow('${p.id}')">Mua ngay</button>
              <button type="button" class="btn-remove" onclick="toggleWishlistItem('${p.id}')">Xóa</button>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    `;
  } catch {
    box.innerHTML = '<p style="color: var(--danger-ink);">Lỗi tải danh sách yêu thích.</p>';
  }
}

// ==================== 5. TIỆN ÍCH MODAL, DRAWER & TOAST ====================

function openModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('hidden');
  el.style.display = 'flex';
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('hidden');
  el.style.display = 'none';
}

function toggleMobileDrawer(forceState) {
  const drawer = document.getElementById('mobile-drawer');
  const backdrop = document.getElementById('mobile-drawer-backdrop');
  if (!drawer || !backdrop) return;
  const shouldOpen = forceState !== undefined ? forceState : !drawer.classList.contains('open');
  drawer.classList.toggle('open', shouldOpen);
  backdrop.classList.toggle('open', shouldOpen);
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerText = message;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(40px)';
    setTimeout(() => toast.remove(), 260);
  }, 3200);
}

// ==================== 6. MODAL CHI TIẾT SẢN PHẨM & ĐÁNH GIÁ AI ====================

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
    showToast('Không tìm thấy thông tin sản phẩm', 'error');
    return;
  }

  document.getElementById('detail-modal-title').innerText = p.name;
  document.getElementById('detail-img').src = p.image || '';
  document.getElementById('detail-img').alt = p.name;
  document.getElementById('detail-brand-badge').innerText = p.brand || 'Flagship';
  document.getElementById('detail-price').innerText = formatMoney(p.price);

  const oldPriceEl = document.getElementById('detail-old-price');
  if (p.oldPrice && p.oldPrice > p.price) {
    oldPriceEl.innerText = formatMoney(p.oldPrice);
    oldPriceEl.style.display = 'inline';
  } else {
    oldPriceEl.style.display = 'none';
  }

  document.getElementById('detail-btn-buy').onclick = () => {
    closeProductDetailModal();
    buyNow(p.id);
  };
  document.getElementById('detail-btn-cart').onclick = () => {
    addToCart(p.id);
  };

  const specs = p.detailedSpecs || {
    screen: '6.7 inch Super AMOLED 120Hz',
    chip: p.brand === 'Apple' ? 'Apple A-Series Bionic' : 'Snapdragon / Dimensity',
    ram: '8GB / 12GB',
    storage: '128GB / 256GB',
    battery: '5000mAh',
    camera: '50MP OIS',
    charging: 'Sạc nhanh công suất cao',
    os: p.brand === 'Apple' ? 'iOS' : 'Android'
  };

  const specsList = [
    { label: 'Màn hình', val: specs.screen },
    { label: 'Vi xử lý (SoC)', val: specs.chip },
    { label: 'Bộ nhớ RAM', val: specs.ram },
    { label: 'Bộ nhớ trong', val: specs.storage },
    { label: 'Dung lượng Pin', val: specs.battery },
    { label: 'Hệ thống Camera', val: specs.camera },
    { label: 'Công nghệ Sạc', val: specs.charging },
    { label: 'Hệ điều hành', val: specs.os }
  ];

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
    summary: `${p.name} là thiết bị chính hãng từ ${p.brand || 'nhà sản xuất'}, nổi bật với hiệu năng ổn định và hoàn thiện cao cấp.`,
    pros: [
      `Màn hình sắc nét cùng cấu hình mạnh trong tầm giá ${formatMoney(p.price)}`,
      'Bảo hành chính hãng 12 tháng, hỗ trợ thanh toán VietQR'
    ],
    cons: ['Nên dùng kèm ốp bảo vệ khung viền trong quá trình sử dụng'],
    targetAudience: 'Người dùng tìm kiếm smartphone chính hãng bền bỉ, hiệu năng cao'
  };

  document.getElementById('detail-ai-summary').innerText = review.summary;
  document.getElementById('detail-ai-pros').innerHTML = (review.pros || []).map((pro) => `<li>${pro}</li>`).join('');
  document.getElementById('detail-ai-cons').innerHTML = (review.cons || []).map((con) => `<li>${con}</li>`).join('');
  document.getElementById('detail-ai-audience').innerText = review.targetAudience || 'Người dùng flagship';

  openModal('product-detail-modal');
}

function closeProductDetailModal() {
  closeModal('product-detail-modal');
}

// ==================== 7. FLOATING AI SHOPPING CONSULTANT ====================

function toggleAiChat() {
  const win = document.getElementById('ai-chat-window');
  if (!win) return;
  const isOpen = win.classList.toggle('open');
  if (isOpen) {
    document.getElementById('ai-chat-input')?.focus();
  }
}

function toggleChatWindow() {
  toggleAiChat();
}

function sendQuickPrompt(promptText) {
  const input = document.getElementById('ai-chat-input');
  if (input) {
    input.value = promptText;
    handleAiChatSubmit();
  }
}

async function handleAiChatSubmit(event) {
  if (event) event.preventDefault();
  const input = document.getElementById('ai-chat-input');
  if (!input) return;
  const message = input.value.trim();
  if (!message) return;

  input.value = '';
  appendChatBubble('user', message);

  const typing = document.getElementById('chat-typing-indicator');
  if (typing) typing.style.display = 'block';
  scrollChatToBottom();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history: chatHistory })
    });
    const data = await res.json();
    if (typing) typing.style.display = 'none';

    if (data.success) {
      chatHistory.push({ role: 'user', content: message });
      chatHistory.push({ role: 'model', content: data.reply });
      appendChatBubble('bot', data.reply, data.suggestedProducts);
    } else {
      appendChatBubble('bot', 'Hiện tại kết nối tư vấn đang gián đoạn, bạn vui lòng thử lại sau giây lát.');
    }
  } catch (err) {
    if (typing) typing.style.display = 'none';
    console.error('Lỗi gọi chat AI:', err);
    appendChatBubble('bot', 'Hệ thống tư vấn đang bận, bạn vui lòng gửi lại câu hỏi.');
  }

  scrollChatToBottom();
}

function handleChatSubmit(event) {
  return handleAiChatSubmit(event);
}

function appendChatBubble(role, text, suggestedProducts = []) {
  const container = document.getElementById('ai-chat-messages');
  if (!container) return;

  const msgDiv = document.createElement('div');
  msgDiv.className = `chat-msg ${role === 'user' ? 'user' : 'bot'}`;

  const formattedText = (text || '')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');

  let miniCardsHtml = '';
  if (Array.isArray(suggestedProducts) && suggestedProducts.length > 0) {
    miniCardsHtml = `
      <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.75rem;">
        ${suggestedProducts
          .map(
            (p) => `
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; padding: 0.5rem; background-color: var(--surface);">
            <div>
              <div style="font-weight: 600; font-size: 0.8125rem;">${p.name}</div>
              <div class="tabular" style="color: var(--accent-text); font-size: 0.8125rem;">${formatMoney(p.price)}</div>
            </div>
            <div style="display: flex; gap: 0.35rem;">
              <button type="button" style="padding: 0.3rem 0.55rem; background-color: var(--bg); font-size: 0.8125rem;" onclick="openProductDetailModal('${p.id}')">Xem</button>
              <button type="button" style="padding: 0.3rem 0.55rem; background-color: var(--accent); color: var(--accent-ink); font-weight: 600; font-size: 0.8125rem;" onclick="addToCart('${p.id}')">Mua</button>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    `;
  }

  msgDiv.innerHTML = `<div class="msg-bubble">${formattedText}${miniCardsHtml}</div>`;
  container.appendChild(msgDiv);
  scrollChatToBottom();
}

function scrollChatToBottom() {
  const container = document.getElementById('ai-chat-messages');
  if (container) {
    container.scrollTop = container.scrollHeight;
  }
}
