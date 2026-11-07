/**
 * TECHSTORE PROTOTYPE SWITCHER (design-taste-frontend compliant)
 * Switch between 3 taste-driven, anti-slop UI variants via ?variant=A|B|C and Floating Bottom Switcher.
 * - Variant A: hero-object (The object, large — Retail Flagship)
 * - Variant B: split-stage (The split stage — Calm Editorial Studio)
 * - Variant C: specimen-catalogue (The specimen catalogue — Hardware Engineering Archive)
 */

(function () {
  const VARIANTS = [
    { key: 'A', name: 'Variant A · The Object, Large (Retail Flagship)' },
    { key: 'B', name: 'Variant B · The Split Stage (Calm Editorial Studio)' },
    { key: 'C', name: 'Variant C · The Specimen Catalogue (Hardware Archive)' }
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
      // VARIANT A: THE OBJECT, LARGE (Retail Flagship - High Contrast, Bright Studio)
      heroMount.innerHTML = `
        <div class="container">
          <div class="va-retail-hero">
            <div class="va-hero-slider-card">
              <div class="va-hero-copy">
                <span class="va-hero-badge-tag">TUẦN LỄ FLAGSHIP VN/A</span>
                <h1 class="va-hero-headline">iPhone 16 Pro Max</h1>
                <p class="va-hero-sub">Khung Titan cấp 5 siêu nhẹ, chip A18 Pro 3nm và camera Fusion 48MP. Phân phối chính hãng nguyên seal, bảo hành ủy quyền toàn quốc 12 tháng.</p>
                <div class="va-hero-price-line">
                  <span class="va-hero-price-label">Giá ưu đãi hôm nay:</span>
                  <div class="va-hero-price-group">
                    <span class="va-hero-price-num">29.490.000 ₫</span>
                    <span class="va-hero-old-num">34.990.000 ₫</span>
                  </div>
                </div>
                <div class="va-hero-actions-row">
                  <button type="button" class="va-hero-cta-btn" onclick="document.getElementById('catalog-section').scrollIntoView({behavior:'smooth'})">
                    <span>Xem kho máy sẵn hàng</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                  </button>
                  <button type="button" class="va-hero-secondary-btn" onclick="openCustomerPortal('track')">
                    <span>Tra cứu vận đơn (SĐT)</span>
                  </button>
                </div>
              </div>

              <div class="va-hero-object-crop">
                <img src="https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=1200&auto=format&fit=crop&q=80" alt="iPhone 16 Pro Max Titan Tự Nhiên" fetchpriority="high">
              </div>
            </div>

            <div class="va-hero-promo-stack">
              <div class="va-promo-card" onclick="filterByBrand('Apple'); document.getElementById('catalog-section').scrollIntoView({behavior:'smooth'});">
                <div class="va-promo-content">
                  <h4>Thu Cũ Đổi Mới Trợ Giá 2 Triệu</h4>
                  <p>Lên đời iPhone 16 &amp; Galaxy S24 Ultra với mức trợ giá trực tiếp vào hóa đơn VAT.</p>
                </div>
              </div>
              <div class="va-promo-card" onclick="document.getElementById('catalog-section').scrollIntoView({behavior:'smooth'});">
                <div class="va-promo-content">
                  <h4>Thanh Toán VietQR 3s - Giảm 500K</h4>
                  <p>Đối soát tự động qua cổng VietQR, gạch nợ tức thì 3 giây không chờ đợi.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Flash Sale Ticker (Taste-Skill compliant: Clean tabular numbers, solid tone step) -->
          <div class="va-flash-sale-box">
            <div class="va-flash-header">
              <div class="va-flash-title-wrap">
                <span class="va-flash-dot"></span>
                <span class="va-flash-title">GIỜ VÀNG SĂN DEAL - GIÁ XUẤT KHO HÔM NAY</span>
              </div>
              <div class="va-flash-timer">
                <span class="va-timer-label">KẾT THÚC TRONG:</span>
                <span class="va-timer-digit" id="va-h">02</span>
                <span class="va-timer-sep">:</span>
                <span class="va-timer-digit" id="va-m">45</span>
                <span class="va-timer-sep">:</span>
                <span class="va-timer-digit" id="va-s">18</span>
              </div>
            </div>
            <div class="va-flash-chips-row">
              <span class="va-deal-pill">iPhone 16 Pro Max (-15%)</span>
              <span class="va-deal-pill">Galaxy S24 Ultra (-18%)</span>
              <span class="va-deal-pill">Xiaomi 14 Ultra Leica (-22%)</span>
              <span class="va-deal-pill">ROG Phone 8 Pro (-12%)</span>
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
      // VARIANT B: THE SPLIT STAGE (Calm Editorial Studio - 50/50 Split)
      heroMount.innerHTML = `
        <div class="container">
          <div class="vb-split-stage-wrap">
            <div class="vb-split-left-sticky">
              <div class="vb-stage-image-frame">
                <img src="https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=1200&auto=format&fit=crop&q=80" alt="Titanium Flagship Smartphone" id="vb-stage-img">
              </div>
              <div class="vb-stage-finish-row">
                <span class="vb-finish-label">Hoàn thiện bề mặt:</span>
                <div class="vb-swatch-group">
                  <button type="button" class="vb-swatch active" title="Titan Tự Nhiên" style="background:#b8b2a8;" onclick="this.parentElement.querySelectorAll('.vb-swatch').forEach(b=>b.classList.remove('active')); this.classList.add('active');"></button>
                  <button type="button" class="vb-swatch" title="Titan Sa Mạc" style="background:#d4c3b3;" onclick="this.parentElement.querySelectorAll('.vb-swatch').forEach(b=>b.classList.remove('active')); this.classList.add('active');"></button>
                  <button type="button" class="vb-swatch" title="Titan Trắng" style="background:#e8e7e3;" onclick="this.parentElement.querySelectorAll('.vb-swatch').forEach(b=>b.classList.remove('active')); this.classList.add('active');"></button>
                  <button type="button" class="vb-swatch" title="Titan Đen" style="background:#2c2c2e;" onclick="this.parentElement.querySelectorAll('.vb-swatch').forEach(b=>b.classList.remove('active')); this.classList.add('active');"></button>
                </div>
              </div>
            </div>

            <div class="vb-split-right-column">
              <span class="vb-editorial-sub">PHIÊN BẢN TITANIUM TỰ NHIÊN</span>
              <h1 class="vb-editorial-title">iPhone 16 Pro Max</h1>
              <p class="vb-editorial-desc">Được chế tác từ hợp kim titan cấp 5 với lớp hoàn thiện tinh xảo bằng phương pháp phun vi hạt. Viền màn hình mỏng nhất từng có trên thiết bị Apple cùng thời lượng pin dẫn đầu phân khúc.</p>

              <div class="vb-spec-list-block">
                <div class="vb-spec-line">
                  <span class="vb-spec-k">Vi xử lý:</span>
                  <span class="vb-spec-v">Apple A18 Pro 3nm (6-core GPU, Neural Engine 16 lõi)</span>
                </div>
                <div class="vb-spec-line">
                  <span class="vb-spec-k">Màn hình:</span>
                  <span class="vb-spec-v">6.9 inch Super Retina XDR OLED, ProMotion 120Hz</span>
                </div>
                <div class="vb-spec-line">
                  <span class="vb-spec-k">Quang học:</span>
                  <span class="vb-spec-v">Camera Fusion 48MP, Telephoto 5x tetraprism 120mm</span>
                </div>
                <div class="vb-spec-line">
                  <span class="vb-spec-k">Thanh toán:</span>
                  <span class="vb-spec-v">Đối soát VietQR 3 giây · Giao máy nguyên seal trong 2H</span>
                </div>
              </div>

              <div class="vb-editorial-cta-bar">
                <div>
                  <span class="vb-price-caption">Giá niêm yết xuất kho:</span>
                  <span class="vb-price-strong">29.490.000 ₫</span>
                </div>
                <button type="button" class="vb-btn-editorial-buy" onclick="document.getElementById('catalog-section').scrollIntoView({behavior:'smooth'})">
                  Chọn dung lượng &amp; Đặt mua
                </button>
              </div>
            </div>
          </div>
        </div>
      `;

    } else if (variant === 'C') {
      // VARIANT C: THE SPECIMEN CATALOGUE (Hardware Engineering Archive)
      heroMount.innerHTML = `
        <div class="container">
          <div class="vc-catalogue-hero">
            <div class="vc-telemetry-header">
              <span class="vc-telemetry-tag">HARDWARE TELEMETRY</span>
              <span class="vc-telemetry-item">KHO SẴN HÀNG: 63 THIẾT BỊ</span>
              <span class="vc-telemetry-item">VIETQR GATEWAY: 3.0s LATENCY</span>
              <span class="vc-telemetry-item">IMEI: 100% VERIFIED VN/A</span>
            </div>

            <h1 class="vc-catalogue-title">BẢN KIỂM ĐỊNH PHẦN CỨNG DI ĐỘNG</h1>
            <p class="vc-catalogue-desc">Cơ sở dữ liệu đối chiếu thông số thực tế: vi xử lý 3nm, chuẩn RAM LPDDR5X, dung lượng pin và điểm benchmark AnTuTu v10 của 12 thương hiệu flagship.</p>

            <div class="vc-specimen-grid">
              <div class="vc-specimen-card">
                <span class="vc-specimen-label">CHIP XỬ LÝ (SoC)</span>
                <span class="vc-specimen-val">Apple A18 Pro / SD 8 Gen 3</span>
                <p class="vc-specimen-sub">Kiến trúc 3nm thế hệ 2, xung nhịp đỉnh 4.04 GHz</p>
              </div>
              <div class="vc-specimen-card">
                <span class="vc-specimen-label">HIỆU NĂNG ĐỒ HỌA</span>
                <span class="vc-specimen-val">2.145.890 pts AnTuTu</span>
                <p class="vc-specimen-sub">Ray tracing phần cứng tốc độ cao 60fps</p>
              </div>
              <div class="vc-specimen-card">
                <span class="vc-specimen-label">TẢN NHIỆT KHÍ ĐỘNG</span>
                <span class="vc-specimen-val">Dual Vapor Chamber VC</span>
                <p class="vc-specimen-sub">Buồng hơi đồng nguyên chất diện tích 9.126 mm²</p>
              </div>
              <div class="vc-specimen-card">
                <span class="vc-specimen-label">ĐỐI SOÁT TỰ ĐỘNG</span>
                <span class="vc-specimen-val">VietQR 3 Giây Tức Thì</span>
                <p class="vc-specimen-sub">Gạch nợ đơn hàng thời gian thực qua ngân hàng</p>
              </div>
            </div>

            <div class="vc-action-strip">
              <button type="button" class="vc-btn-terminal" onclick="document.getElementById('catalog-section').scrollIntoView({behavior:'smooth'})">
                Lọc danh mục phần cứng
              </button>
              <button type="button" class="vc-btn-secondary" onclick="openCustomerPortal('track')">
                Tra cứu hồ sơ vận đơn
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
      <button type="button" class="proto-arrow-btn" id="proto-prev-btn" title="Biến thể trước (Phím mũi tên trái)" aria-label="Biến thể trước">←</button>
      <div class="proto-info-block">
        <span class="proto-badge">TASTE PROTOTYPE</span>
        <span class="proto-label-text" id="proto-variant-name">Loading...</span>
        <span class="proto-key-hint">Phím [← / →]</span>
      </div>
      <button type="button" class="proto-arrow-btn" id="proto-next-btn" title="Biến thể sau (Phím mũi tên phải)" aria-label="Biến thể sau">→</button>
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
