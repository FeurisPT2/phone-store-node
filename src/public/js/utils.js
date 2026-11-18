// ============================================================================
// GEARHUB UTILITIES & THEME ENGINE (UI/UX Pro Max)
// ============================================================================

const formatMoney = (amount) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

const twoDigits = (n) => (n < 10 ? '0' + n : String(n));

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function copyTextToClipboard(text, label = 'Nội dung') {
  if (!text) return;
  const clean = String(text).trim();
  const fallbackCopy = () => {
    try {
      const ta = document.createElement('textarea');
      ta.value = clean;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast(`Đã sao chép ${label}: ${clean}`, 'info');
    } catch {
      showToast(`Mã ${label}: ${clean}`, 'info');
    }
  };

  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(clean)
      .then(() => {
        showToast(`Đã sao chép ${label}: ${clean}`, 'info');
      })
      .catch(fallbackCopy);
  } else {
    fallbackCopy();
  }
}

function openModal(id) {
  if (typeof document === 'undefined') return;
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('hidden');
  el.style.display = 'flex';
  const content = el.querySelector('.modal-content');
  if (content) {
    content.classList.remove('modal-animate-in');
    void content.offsetWidth;
    content.classList.add('modal-animate-in');
  }
}

function triggerPopAnimation(elOrId, className = 'gh-anim-pop') {
  if (typeof document === 'undefined' || !elOrId) return;
  const el = typeof elOrId === 'string' ? document.getElementById(elOrId) : elOrId;
  if (!el || !el.classList) return;
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
}

function closeModal(id) {
  if (id === 'qr-payment-modal' && typeof clearQrSessionTimers === 'function') {
    clearQrSessionTimers();
  }
  if (typeof document === 'undefined') return;
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('hidden');
  el.style.display = 'none';
}

function toggleMobileDrawer(forceState) {
  if (typeof document === 'undefined') return;
  const drawer = document.getElementById('mobile-drawer');
  const backdrop = document.getElementById('mobile-drawer-backdrop');
  if (!drawer || !backdrop) return;
  const shouldOpen = forceState !== undefined ? forceState : !drawer.classList.contains('open');
  drawer.classList.toggle('open', shouldOpen);
  backdrop.classList.toggle('open', shouldOpen);
}

function showToast(message, type = 'success') {
  if (typeof document === 'undefined') return;
  let container = document.getElementById('toast-container');
  if (!container) {
    if (typeof document.createElement !== 'function' || !document.body) return;
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

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

// ==================== THEME MANAGEMENT & REAL-TIME SYNC ====================

function getStoredTheme() {
  if (typeof localStorage === 'undefined') return 'light';
  const saved = localStorage.getItem('techstore_theme');
  return (saved === 'dark' || saved === 'light') ? saved : 'light';
}

function setTheme(theme) {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('techstore_theme', theme);
  }
  updateThemeUI(theme);
}

function toggleTheme() {
  const current = (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme')) || getStoredTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  setTheme(next);
}

function updateThemeUI(theme) {
  if (typeof document === 'undefined') return;
  const labels = document.querySelectorAll('.theme-name-text, .theme-label-text');
  labels.forEach(el => {
    el.textContent = theme === 'dark' ? 'Tối' : 'Sáng';
  });
  const mobileLabel = document.getElementById('theme-status-mobile');
  if (mobileLabel) {
    mobileLabel.textContent = theme === 'dark' ? 'Tối' : 'Sáng';
  }
}

let ghSharedRevealObserver = null;

function initSmoothMotionEngine() {
  if (typeof document === 'undefined') return;

  const autoSelectors = [
    '.station-signboard',
    '.about-metric-card',
    '.story-card',
    '.ps-card',
    '.portal-entrance-card',
    '.campus-location-banner',
    '.pdp-gallery-wrap',
    '.pdp-info-col',
    '.pdp-trust-pill',
    '.pdp-spec-card',
    '.pdp-process-step'
  ];

  const candidates = document.querySelectorAll(autoSelectors.join(', '));
  candidates.forEach((el, idx) => {
    if (!el.hasAttribute('data-reveal')) {
      el.setAttribute('data-reveal', '');
      el.style.setProperty('--i', String(idx % 5));
    }
  });

  const revealEls = document.querySelectorAll('[data-reveal]:not(.in)');
  const vh = typeof window !== 'undefined' ? window.innerHeight || 800 : 800;

  if (typeof IntersectionObserver !== 'undefined' && revealEls.length > 0) {
    if (!ghSharedRevealObserver) {
      ghSharedRevealObserver = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('in');
              obs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.06, rootMargin: '0px 0px -30px 0px' }
      );
    }

    revealEls.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < vh * 0.96 && rect.bottom > 0) {
        if (typeof requestAnimationFrame === 'function') {
          requestAnimationFrame(() => el.classList.add('in'));
        } else {
          el.classList.add('in');
        }
      } else {
        ghSharedRevealObserver.observe(el);
      }
    });
  } else {
    revealEls.forEach((el) => el.classList.add('in'));
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', function(e) {
    if (e.key === 'techstore_theme' && e.newValue) {
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', e.newValue);
      }
      updateThemeUI(e.newValue);
    }
  });

  window.addEventListener(
    'scroll',
    function() {
      const header = document.querySelector('.main-header');
      if (header) {
        header.classList.toggle('header-scrolled', window.scrollY > 12);
      }
    },
    { passive: true }
  );

  document.addEventListener('DOMContentLoaded', function() {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.add('js');
    }
    const t = getStoredTheme();
    updateThemeUI(t);

    initSmoothMotionEngine();

    if (typeof MutationObserver !== 'undefined') {
      const dynamicIds = ['pdp-specs-grid', 'pdp-process-timeline', 'pdp-related-grid'];
      const mo = new MutationObserver(() => initSmoothMotionEngine());
      dynamicIds.forEach((id) => {
        const node = document.getElementById(id);
        if (node) mo.observe(node, { childList: true });
      });
    }
  });
}
