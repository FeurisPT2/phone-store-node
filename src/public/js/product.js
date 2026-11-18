// ============================================================================
// GEARHUB PRODUCT DETAIL PAGE CONTROLLER (product.js)
// ============================================================================

let currentProduct = null;
let allCatalog = [];

const SPEC_DICTIONARY = {
  type: 'Hạng mục thực hiện',
  time: 'Thời gian thực hiện',
  tools: 'Dụng cụ / Vật tư chuyên dụng',
  thermalPaste: 'Keo tản nhiệt tiêu chuẩn',
  impact: 'Hiệu quả thực tế',
  warranty: 'Chính sách bảo hành',
  model: 'Model thiết bị',
  connection: 'Chuẩn kết nối',
  layout: 'Layout phím & núm xoay',
  switch: 'Loại Switch trang bị',
  rentalPolicy: 'Thủ tục thuê sinh viên',
  design: 'Thiết kế công thái học',
  click: 'Loại Switch chuột',
  battery: 'Thời lượng Pin / Sạc',
  included: 'Thiết bị & dây cáp kèm theo',
  compatibility: 'Độ tương thích thiết bị',
  support: 'Hỗ trợ kỹ thuật tại chỗ',
  components: 'Thành phần trong bộ',
  material: 'Chất liệu chế tạo',
  size: 'Kích thước & Trọng lượng',
  usage: 'Hướng dẫn sử dụng'
};

function formatVnd(val) {
  if (typeof val !== 'number') val = Number(val) || 0;
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
}

function getUrlProductId() {
  const params = new URLSearchParams(window.location.search);
  const qId = params.get('id');
  if (qId) return qId.trim();

  const pathParts = window.location.pathname.split('/');
  const pIndex = pathParts.indexOf('product');
  if (pIndex !== -1 && pathParts[pIndex + 1]) {
    return decodeURIComponent(pathParts[pIndex + 1].trim());
  }
  return null;
}

async function loadProductDetailPage() {
  const prodId = getUrlProductId() || 'gearhub_clean_cool';

  try {
    const [pRes, allRes] = await Promise.all([
      fetch(`/api/products/${encodeURIComponent(prodId)}`).then(r => r.json()),
      fetch('/api/products').then(r => r.json())
    ]);

    if (!pRes.success || !pRes.data) {
      showProductNotFound();
      return;
    }

    currentProduct = pRes.data;
    allCatalog = allRes.data || [];

    renderProductDetails(currentProduct);
    renderRelatedProducts(currentProduct, allCatalog);
    initProductTabs();
  } catch (err) {
    console.error('Failed to load product detail:', err);
    showProductNotFound();
  }
}

function renderProductDetails(p) {
  // 1. Meta & Title
  document.title = `${p.name} · GearHub Trạm Kỹ Thuật Sinh Viên`;

  const catMeta = (typeof getProductCategory === 'function')
    ? getProductCategory(p)
    : { key: p.category || 'service', label: p.categoryLabel || 'Dịch vụ' };

  // 2. Breadcrumbs
  const bcCat = document.getElementById('pdp-bc-cat');
  const bcCurrent = document.getElementById('pdp-bc-current');
  if (bcCat) {
    bcCat.textContent = catMeta.label;
    bcCat.href = `/shop?category=${catMeta.key}`;
  }
  if (bcCurrent) bcCurrent.textContent = p.name;

  // 3. Image & Badges
  const mainImg = document.getElementById('pdp-main-img');
  if (mainImg) {
    mainImg.src = p.image;
    mainImg.alt = p.name;
  }
  const ribbon = document.getElementById('pdp-ribbon');
  if (ribbon) {
    ribbon.textContent = p.badge || (catMeta.key === 'rental' ? 'Thuê chỉ cần thẻ SV' : 'Bán chạy nhất');
  }
  const catTag = document.getElementById('pdp-cat-tag');
  if (catTag) {
    catTag.textContent = catMeta.label;
  }

  // 4. Header Titles
  const brandBadge = document.getElementById('pdp-brand-badge');
  if (brandBadge) brandBadge.textContent = p.brand || 'GearHub Station';

  const titleEl = document.getElementById('pdp-title');
  if (titleEl) titleEl.textContent = p.name;

  const descEl = document.getElementById('pdp-desc');
  if (descEl) descEl.textContent = p.description || p.specs || '';

  // 5. Pricing
  const priceEl = document.getElementById('pdp-price');
  if (priceEl) priceEl.textContent = formatVnd(p.price);

  const oldPriceEl = document.getElementById('pdp-old-price');
  const discountPill = document.getElementById('pdp-discount-pill');
  if (p.oldPrice && p.oldPrice > p.price) {
    if (oldPriceEl) {
      oldPriceEl.textContent = formatVnd(p.oldPrice);
      oldPriceEl.style.display = 'inline-block';
    }
    if (discountPill) {
      const discount = Math.round((1 - p.price / p.oldPrice) * 100);
      discountPill.textContent = `Tiết kiệm ${formatVnd(p.oldPrice - p.price)} (-${discount}%)`;
      discountPill.style.display = 'inline-block';
    }
  } else {
    if (oldPriceEl) oldPriceEl.style.display = 'none';
    if (discountPill) discountPill.style.display = 'none';
  }

  const durationEl = document.getElementById('pdp-duration');
  if (durationEl) {
    durationEl.textContent = p.duration ? `Thời gian: ${p.duration}` : 'Lấy liền 30–45 phút';
  }
  const unitEl = document.getElementById('pdp-unit');
  if (unitEl) {
    unitEl.textContent = p.unit ? `Đơn vị tính: Theo ${p.unit}` : 'Bảo hành 7 ngày';
  }

  // 6. Action Button Wiring
  const btnBuy = document.getElementById('pdp-btn-buy');
  const btnCart = document.getElementById('pdp-btn-cart');
  if (btnBuy) {
    if (catMeta.key === 'rental') {
      btnBuy.className = 'pdp-btn-main pdp-btn-rental-theme';
      btnBuy.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" width="18" height="18"><rect x="3" y="4" width="18" height="16" rx="2"></rect><line x1="7" y1="8" x2="17" y2="8"></line><line x1="7" y1="12" x2="17" y2="12"></line><line x1="7" y1="16" x2="13" y2="16"></line></svg>
        <span>Thuê Thiết Bị Ngay &rarr;</span>
      `;
    } else if (catMeta.key === 'service') {
      btnBuy.className = 'pdp-btn-main';
      btnBuy.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" width="18" height="18"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
        <span>Đặt Lịch Hẹn Ngay &rarr;</span>
      `;
    } else {
      btnBuy.className = 'pdp-btn-main';
      btnBuy.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" width="18" height="18"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
        <span>Mua Sản Phẩm Ngay &rarr;</span>
      `;
    }
    btnBuy.onclick = () => {
      if (typeof buyNow === 'function') {
        buyNow(p.id);
      } else {
        window.location.href = `/cart?buyNow=${p.id}`;
      }
    };
  }

  if (btnCart) {
    btnCart.onclick = () => {
      if (typeof addToCart === 'function') {
        addToCart(p.id);
      }
    };
  }

  // 7. Render Specs
  renderSpecsGrid(p.detailedSpecs || {});

  // 8. Render AI Review
  renderAiReview(p.aiReview, p.name);

  // 9. Sync Wishlist Button State
  syncWishlistBtn(p.id);
}

function renderSpecsGrid(specs) {
  const grid = document.getElementById('pdp-specs-grid');
  if (!grid) return;

  const entries = Object.entries(specs);
  if (!entries.length) {
    grid.innerHTML = '<p style="color:var(--muted); padding:1rem;">Đang cập nhật thông số chi tiết từ Trạm Kỹ thuật.</p>';
    return;
  }

  grid.innerHTML = entries.map(([key, val]) => {
    const label = SPEC_DICTIONARY[key] || key;
    return `
      <div class="pdp-spec-cell">
        <span class="pdp-spec-label">${label}</span>
        <span class="pdp-spec-val">${val}</span>
      </div>
    `;
  }).join('');
}

function renderAiReview(review, productName) {
  const aiCard = document.getElementById('pdp-ai-card');
  if (!aiCard) return;

  if (!review) {
    aiCard.innerHTML = '<p style="color:var(--muted); padding:1rem;">Đang kết nối mô hình Gemini AI để phân tích dữ liệu...</p>';
    return;
  }

  aiCard.innerHTML = `
    <div class="pdp-ai-header">
      <div class="pdp-ai-title-wrap">
        <span class="pdp-ai-badge">GEMINI AI VERIFIED</span>
        <strong style="font-size:1.05rem; color:var(--ink);">Góc Nhìn Chuyên Môn &amp; Lời Khuyên Sinh Viên</strong>
      </div>
      <button type="button" class="btn-tool" onclick="consultAiAbout('${encodeURIComponent(productName)}')" style="font-size:0.8rem; padding:0.4rem 0.8rem; background:var(--surface); border:1px solid var(--border); border-radius:6px; cursor:pointer;">
        💬 Hỏi AI về mục này
      </button>
    </div>

    <div class="pdp-ai-summary">
      "${review.summary || 'Dịch vụ chuẩn hóa dành cho sinh viên IT.'}"
    </div>

    <div class="pdp-pros-cons-grid">
      <div class="pdp-pros-box">
        <h4>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><polyline points="20 6 9 17 4 12"></polyline></svg>
          Ưu Điểm Nổi Bật
        </h4>
        <ul>
          ${(review.pros || []).map(item => `<li>${item}</li>`).join('')}
        </ul>
      </div>

      <div class="pdp-cons-box">
        <h4>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          Điểm Cần Lưu Ý
        </h4>
        <ul>
          ${(review.cons || []).map(item => `<li>${item}</li>`).join('')}
        </ul>
      </div>
    </div>

    ${review.targetAudience ? `
      <div class="pdp-target-box">
        <strong>🎯 Phù hợp nhất cho:</strong> ${review.targetAudience}
      </div>
    ` : ''}
  `;
}

function renderRelatedProducts(currentP, catalog) {
  const container = document.getElementById('pdp-related-grid');
  if (!container) return;

  const others = catalog.filter(x => x.id !== currentP.id);
  // Pick related by same category or first 3
  const sameCat = others.filter(x => x.category === currentP.category);
  const diffCat = others.filter(x => x.category !== currentP.category);
  const pool = [...sameCat, ...diffCat].slice(0, 3);

  if (!pool.length) {
    container.parentElement.style.display = 'none';
    return;
  }

  container.innerHTML = pool.map(p => {
    const cMeta = (typeof getProductCategory === 'function')
      ? getProductCategory(p)
      : { key: p.category, label: p.categoryLabel || 'Sản phẩm' };

    return `
      <article class="product-card" data-category="${cMeta.key}" style="background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-lg); overflow:hidden; display:flex; flex-direction:column; box-shadow:var(--shadow-sm); transition:transform 200ms ease, box-shadow 200ms ease;">
        <a href="/product?id=${p.id}" class="product-img-wrap" style="aspect-ratio:16/10; overflow:hidden; display:block; position:relative; background:var(--surface-raised);">
          <img src="${p.image}" alt="${p.name}" style="width:100%; height:100%; object-fit:cover; transition:transform 300ms ease;" loading="lazy">
          <span style="position:absolute; top:8px; left:8px; background:var(--ink); color:var(--surface); font-size:11px; font-weight:700; padding:2px 8px; border-radius:999px;">${p.badge || cMeta.label}</span>
        </a>
        <div style="padding:1rem; display:flex; flex-direction:column; flex:1; gap:0.5rem;">
          <a href="/product?id=${p.id}" style="text-decoration:none; color:var(--ink); font-weight:700; font-size:0.95rem; line-height:1.35; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${p.name}</a>
          <div style="margin-top:auto; display:flex; align-items:baseline; justify-content:space-between; padding-top:0.5rem; border-top:1px solid var(--border);">
            <strong style="font-size:1.05rem; color:var(--ink); font-variant-numeric:tabular-nums;">${formatVnd(p.price)}</strong>
            <a href="/product?id=${p.id}" style="font-size:0.8rem; font-weight:600; color:#2563eb; text-decoration:none;">Xem trang &rarr;</a>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function initProductTabs() {
  const triggers = document.querySelectorAll('.pdp-tab-trigger');
  triggers.forEach(trig => {
    trig.addEventListener('click', () => {
      const targetId = trig.getAttribute('data-tab');
      triggers.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.pdp-tab-panel').forEach(p => p.classList.remove('active'));

      trig.classList.add('active');
      const panel = document.getElementById(targetId);
      if (panel) panel.classList.add('active');
    });
  });
}

function syncWishlistBtn(productId) {
  const btn = document.getElementById('pdp-btn-wishlist');
  if (!btn) return;

  const wishlist = getWishlistIds();
  const isWished = wishlist.includes(productId);
  if (isWished) {
    btn.classList.add('active-wishlist');
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" width="16" height="16"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
      <span>Đã lưu vào Yêu thích</span>
    `;
  } else {
    btn.classList.remove('active-wishlist');
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
      <span>Lưu vào Yêu thích</span>
    `;
  }
}

function getWishlistIds() {
  try {
    return JSON.parse(localStorage.getItem('techstore_wishlist') || '[]');
  } catch (e) {
    return [];
  }
}

function handlePdpWishlistToggle() {
  if (!currentProduct) return;
  if (typeof toggleWishlistItem === 'function') {
    toggleWishlistItem(currentProduct.id);
  } else {
    let list = getWishlistIds();
    if (list.includes(currentProduct.id)) {
      list = list.filter(id => id !== currentProduct.id);
      if (typeof showToast === 'function') showToast('Đã xóa khỏi danh sách yêu thích', 'info');
    } else {
      list.push(currentProduct.id);
      if (typeof showToast === 'function') showToast('Đã lưu vào danh sách yêu thích!', 'success');
    }
    localStorage.setItem('techstore_wishlist', JSON.stringify(list));
  }
  syncWishlistBtn(currentProduct.id);
}

function handlePdpShare() {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(window.location.href).then(() => {
      if (typeof showToast === 'function') showToast('Đã sao chép liên kết sản phẩm vào bộ nhớ tạm!', 'success');
    }).catch(() => {
      prompt('Sao chép liên kết sản phẩm:', window.location.href);
    });
  } else {
    prompt('Sao chép liên kết sản phẩm:', window.location.href);
  }
}

function consultAiAbout(encodedName) {
  const name = decodeURIComponent(encodedName);
  if (typeof toggleAiChat === 'function') {
    toggleAiChat(true);
  }
  const prompt = `Tư vấn cho mình về "${name}": gói này có phù hợp với máy của mình không và quy trình thực hiện ra sao?`;
  if (typeof sendQuickPrompt === 'function') {
    sendQuickPrompt(prompt);
  } else {
    const input = document.getElementById('ai-chat-input');
    if (input) {
      input.value = prompt;
      input.focus();
    }
  }
}

function showProductNotFound() {
  const container = document.querySelector('.pdp-container');
  if (container) {
    container.innerHTML = `
      <div style="text-align:center; padding:5rem 1rem;">
        <h2 style="font-size:1.75rem; color:var(--ink); margin-bottom:1rem;">Không tìm thấy dịch vụ hoặc thiết bị</h2>
        <p style="color:var(--muted); max-width:480px; margin:0 auto 2rem;">Mục bạn đang tìm kiếm có thể đã tạm ngưng hoặc đổi đường dẫn. Hãy khám phá toàn bộ danh mục tại Cửa hàng GearHub.</p>
        <a href="/shop" class="pdp-btn-main" style="display:inline-flex;">Quay lại Cửa Hàng &rarr;</a>
      </div>
    `;
  }
}

// Global initialization on DOM ready
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    loadProductDetailPage();

    const btnWish = document.getElementById('pdp-btn-wishlist');
    if (btnWish) btnWish.addEventListener('click', handlePdpWishlistToggle);

    const btnShare = document.getElementById('pdp-btn-share');
    if (btnShare) btnShare.addEventListener('click', handlePdpShare);

    const btnAi = document.getElementById('pdp-btn-ai');
    if (btnAi) {
      btnAi.addEventListener('click', () => {
        if (currentProduct) consultAiAbout(encodeURIComponent(currentProduct.name));
      });
    }
  });
}
