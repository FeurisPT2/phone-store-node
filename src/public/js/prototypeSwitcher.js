/**
 * TECHSTORE PROTOTYPE SWITCHER (prototype/UI.md)
 * Switch between 3 radically different UI variants via ?variant=A|B|C and Floating Bottom Switcher.
 */

(function () {
  const VARIANTS = [
    { key: 'A', name: 'Variant A · Retail Powerhouse (CellphoneS & TopZone)' },
    { key: 'B', name: 'Variant B · Studio Minimalist (Apple Store & Luxury)' },
    { key: 'C', name: 'Variant C · Cyber Neo-Tech (Nothing & ROG Hardware)' }
  ];

  let currentVariantKey = 'A';
  let flashTimerInterval = null;

  function getQueryVariant() {
    const params = new URLSearchParams(window.location.search);
    const v = (params.get('variant') || '').toUpperCase();
    return VARIANTS.some((item) => item.key === v) ? v : 'A';
  }

  function setVariant(key, updateUrl = true) {
    currentVariantKey = key;
    document.body.classList.remove('variant-a', 'variant-b', 'variant-c');
    document.body.classList.add(`variant-${key.toLowerCase()}`);

    const labelEl = document.getElementById('proto-variant-name');
    const matched = VARIANTS.find((v) => v.key === key);
    if (labelEl && matched) {
      labelEl.innerText = matched.name;
    }

    if (updateUrl) {
      const url = new URL(window.location.href);
      url.searchParams.set('variant', key);
      window.history.replaceState({}, '', url.toString());
    }

    renderVariantHeroSection(key);
  }

  function switchNext() {
    const idx = VARIANTS.findIndex((v) => v.key === currentVariantKey);
    const nextIdx = (idx + 1) % VARIANTS.length;
    setVariant(VARIANTS[nextIdx].key);
  }

  function switchPrev() {
    const idx = VARIANTS.findIndex((v) => v.key === currentVariantKey);
    const prevIdx = (idx - 1 + VARIANTS.length) % VARIANTS.length;
    setVariant(VARIANTS[prevIdx].key);
  }

  function renderVariantHeroSection(variant) {
    const heroMount = document.getElementById('prototype-hero-mount');
    if (!heroMount) return;

    if (flashTimerInterval) {
      clearInterval(flashTimerInterval);
      flashTimerInterval = null;
    }

    if (variant === 'A') {
      // VARIANT A: RETAIL POWERHOUSE
      heroMount.innerHTML = `
        <div class="container">
          <!-- Retail 2-column Hero -->
          <div class="va-retail-hero">
            <div class="va-hero-slider-card">
              <div>
                <span class="va-hero-badge-tag">🔥 TUẦN LỄ SIÊU SALE FLAGSHIP VN/A</span>
                <h1 class="va-hero-headline">iPhone 16 Pro Max 256GB</h1>
                <p class="va-hero-sub">Khung Titan cấp 5 siêu nhẹ, chip A18 Pro 3nm, quay ProRes 4K 120fps. Giảm ngay 3.500.000₫ & trả góp 0% lãi suất.</p>
              </div>
              <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px;">
                <div>
                  <span style="font-size:13px; color:#94a3b8; display:block;">Giá thanh toán đặc quyền:</span>
                  <span style="font-size:1.8rem; font-weight:800; color:#ffffff;">29.490.000 ₫</span>
                  <span style="font-size:13px; color:#f87171; text-decoration:line-through; margin-left:8px;">34.990.000 ₫</span>
                </div>
                <button type="button" class="va-hero-cta-btn" onclick="document.getElementById('catalog-section').scrollIntoView({behavior:'smooth'})">
                  <span>⚡ SĂN DEAL NGAY</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </button>
              </div>
            </div>

            <div class="va-hero-promo-stack">
              <div class="va-promo-card" onclick="document.getElementById('catalog-section').scrollIntoView({behavior:'smooth'})">
                <div class="va-promo-icon">🎁</div>
                <div class="va-promo-content">
                  <h4>Thu Cũ Đổi Mới Trợ Giá 2 Triệu</h4>
                  <p>Lên đời iPhone 16 & S24 Ultra trợ giá tối đa 2.000.000₫</p>
                </div>
              </div>
              <div class="va-promo-card" onclick="document.getElementById('catalog-section').scrollIntoView({behavior:'smooth'})">
                <div class="va-promo-icon">⚡</div>
                <div class="va-promo-content">
                  <h4>Thanh Toán VietQR 3s - Giảm 500K</h4>
                  <p>Đối soát tự động qua cổng VietQR, gạch nợ tức thì 3 giây</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Flash Sale Deal Sốc Ticker -->
          <div class="va-flash-sale-box">
            <div class="va-flash-header">
              <div class="va-flash-title-wrap">
                <span style="font-size:28px;">⚡</span>
                <span class="va-flash-title">GIỜ VÀNG SĂN DEAL - GIÁ SỐC HÔM NAY</span>
              </div>
              <div class="va-flash-timer">
                <span>KẾT THÚC TRONG:</span>
                <span class="va-timer-digit" id="va-h">02</span> :
                <span class="va-timer-digit" id="va-m">45</span> :
                <span class="va-timer-digit" id="va-s">18</span>
              </div>
            </div>
            <div style="display:flex; gap:12px; overflow-x:auto; padding-bottom:8px;">
              <span class="ribbon-chip active">🍎 iPhone 16 Pro Max (-15%)</span>
              <span class="ribbon-chip active">🌌 Galaxy S24 Ultra (-18%)</span>
              <span class="ribbon-chip active">📷 Xiaomi 14 Ultra Leica (-22%)</span>
              <span class="ribbon-chip active">🎮 ROG Phone 8 Pro (-12%)</span>
            </div>
          </div>
        </div>
      `;

      // Start Flash countdown timer
      let totalSeconds = 2 * 3600 + 45 * 60 + 18;
      flashTimerInterval = setInterval(() => {
        if (totalSeconds <= 0) {
          totalSeconds = 3 * 3600;
        }
        totalSeconds--;
        const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
        const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
        const s = String(totalSeconds % 60).padStart(2, '0');
        const hEl = document.getElementById('va-h');
        const mEl = document.getElementById('va-m');
        const sEl = document.getElementById('va-s');
        if (hEl) hEl.innerText = h;
        if (mEl) mEl.innerText = m;
        if (sEl) sEl.innerText = s;
      }, 1000);

    } else if (variant === 'B') {
      // VARIANT B: STUDIO MINIMALIST (Apple Store & TopZone)
      heroMount.innerHTML = `
        <div class="container">
          <!-- Apple Style Category Discs -->
          <div class="vb-apple-categories">
            <div class="vb-cat-disc" onclick="filterByBrand('Apple'); document.getElementById('catalog-section').scrollIntoView({behavior:'smooth'});">
              <div class="vb-disc-circle">🍎</div>
              <span class="vb-disc-title">iPhone</span>
            </div>
            <div class="vb-cat-disc" onclick="filterByBrand('Samsung'); document.getElementById('catalog-section').scrollIntoView({behavior:'smooth'});">
              <div class="vb-disc-circle">🌌</div>
              <span class="vb-disc-title">Galaxy</span>
            </div>
            <div class="vb-cat-disc" onclick="filterByBrand('Xiaomi'); document.getElementById('catalog-section').scrollIntoView({behavior:'smooth'});">
              <div class="vb-disc-circle">📷</div>
              <span class="vb-disc-title">Xiaomi</span>
            </div>
            <div class="vb-cat-disc" onclick="filterByBrand('Google'); document.getElementById('catalog-section').scrollIntoView({behavior:'smooth'});">
              <div class="vb-disc-circle">🤖</div>
              <span class="vb-disc-title">Pixel</span>
            </div>
            <div class="vb-cat-disc" onclick="filterByBrand('ASUS'); document.getElementById('catalog-section').scrollIntoView({behavior:'smooth'});">
              <div class="vb-disc-circle">🎮</div>
              <span class="vb-disc-title">ROG Phone</span>
            </div>
          </div>

          <!-- Apple Cinematic Studio Hero -->
          <div class="vb-cinematic-hero">
            <span class="vb-hero-eyebrow">SIÊU PHẨM MỚI NHẤT</span>
            <h1 class="vb-hero-title">iPhone 16 Pro Max.<br>Đỉnh cao Titanium.</h1>
            <p class="vb-hero-sub">Thiết kế viền mỏng nhất lịch sử. Khung titan tự nhiên. Nút Điều Khiển Camera hoàn toàn mới và chip A18 Pro bứt phá.</p>
            <div class="vb-hero-actions">
              <button type="button" class="vb-btn-apple-buy" onclick="document.getElementById('catalog-section').scrollIntoView({behavior:'smooth'})">Mua ngay từ 29.490.000 ₫</button>
              <a href="#catalog-section" class="vb-btn-apple-link">Tìm hiểu thêm &gt;</a>
            </div>
            <div class="vb-hero-img-wrap">
              <img src="https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=1200&auto=format&fit=crop&q=80" alt="iPhone 16 Pro Max Titanium Studio" loading="lazy">
            </div>
          </div>
        </div>
      `;

    } else if (variant === 'C') {
      // VARIANT C: CYBER NEO-TECH (Nothing & ROG Hardware Lab)
      heroMount.innerHTML = `
        <div class="container">
          <div class="vc-cyber-hero">
            <div class="vc-diag-strip">
              <span>// SYSTEM_STATUS: ONLINE</span>
              <span>HARDWARE_LAB: LEVEL_9</span>
              <span>CORE_INDEX: 63_UNITS</span>
            </div>
            <h1 class="vc-hero-title">EXTREME <span>HARDWARE</span> BENCHMARK</h1>
            <p style="color:#94a3b8; font-size:1rem; max-width:600px;">Hệ thống phân phối điện thoại hiệu năng cực hạn. Kiểm chuẩn Geekbench, tản nhiệt buồng hơi VC và đối soát thanh toán mã hóa VietQR 3s.</p>

            <div class="vc-hero-metrics-grid">
              <div class="vc-metric-card">
                <strong>2,145,890</strong>
                <span>AnTuTu v10 Benchmark Max</span>
              </div>
              <div class="vc-metric-card">
                <strong>165 Hz</strong>
                <span>AMOLED LTPO 1-165Hz Touch</span>
              </div>
              <div class="vc-metric-card">
                <strong>120W</strong>
                <span>HyperCharge Dual-Cell GaN</span>
              </div>
              <div class="vc-metric-card">
                <strong>3 SECS</strong>
                <span>VietQR Fast Settlement</span>
              </div>
            </div>

            <div style="display:flex; gap:16px;">
              <button type="button" class="btn-buy-now" style="background:#06b6d4; color:#000; font-weight:800; padding:12px 28px; border-radius:6px;" onclick="document.getElementById('catalog-section').scrollIntoView({behavior:'smooth'})">
                // EXECUTE_ORDER
              </button>
              <button type="button" class="btn-add-cart" style="border:1px solid #06b6d4; color:#06b6d4; border-radius:6px; padding:12px 20px;" onclick="openCustomerPortal('track')">
                // TRACE_TELEMETRY
              </button>
            </div>
          </div>
        </div>
      `;
    }
  }

  function mountFloatingSwitcher() {
    if (document.getElementById('proto-switcher-bar')) return;

    const switcher = document.createElement('div');
    switcher.id = 'proto-switcher-bar';
    switcher.className = 'prototype-floating-switcher';
    switcher.innerHTML = `
      <button type="button" class="proto-arrow-btn" id="proto-prev-btn" title="Biến thể trước (Phím ←)" aria-label="Biến thể trước">←</button>
      <div class="proto-info-block">
        <span class="proto-badge">PROTOTYPE</span>
        <span class="proto-label-text" id="proto-variant-name">Loading...</span>
        <span class="proto-key-hint">Phím [← / →]</span>
      </div>
      <button type="button" class="proto-arrow-btn" id="proto-next-btn" title="Biến thể sau (Phím →)" aria-label="Biến thể sau">→</button>
    `;

    document.body.appendChild(switcher);

    document.getElementById('proto-prev-btn').addEventListener('click', switchPrev);
    document.getElementById('proto-next-btn').addEventListener('click', switchNext);

    // Keyboard navigation
    window.addEventListener('keydown', (e) => {
      const activeTag = (document.activeElement && document.activeElement.tagName) || '';
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag)) return;
      if (document.activeElement && document.activeElement.isContentEditable) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        switchPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        switchNext();
      }
    });
  }

  // Init prototype on DOMContentLoaded or immediate
  function init() {
    mountFloatingSwitcher();
    const initialKey = getQueryVariant();
    setVariant(initialKey, false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.PrototypeSwitcher = {
    setVariant,
    switchNext,
    switchPrev,
    getCurrentVariant: () => currentVariantKey
  };
})();
