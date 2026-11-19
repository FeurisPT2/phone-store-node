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
  const toggleBtn = document.getElementById('btn-mobile-drawer');
  if (!drawer || !backdrop) return;
  const shouldOpen = forceState !== undefined ? forceState : !drawer.classList.contains('open');
  drawer.classList.toggle('open', shouldOpen);
  backdrop.classList.toggle('open', shouldOpen);
  if (toggleBtn) {
    toggleBtn.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
  }
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

  let scrollRafPending = false;
  const syncScrollEffects = () => {
    scrollRafPending = false;
    const header = document.querySelector('.main-header');
    if (header) {
      header.classList.toggle('header-scrolled', window.scrollY > 12);
    }
    const progressBar = document.getElementById('scroll-progress-bar');
    if (progressBar && typeof document !== 'undefined' && document.documentElement) {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
      progressBar.style.transform = `scaleX(${ratio.toFixed(4)})`;
    }
  };

  window.addEventListener(
    'scroll',
    function() {
      if (typeof requestAnimationFrame === 'function') {
        if (!scrollRafPending) {
          scrollRafPending = true;
          requestAnimationFrame(syncScrollEffects);
        }
      } else {
        syncScrollEffects();
      }
    },
    { passive: true }
  );

  if (typeof document !== 'undefined') {
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        const drawer = document.getElementById('mobile-drawer');
        if (drawer && drawer.classList.contains('open')) {
          toggleMobileDrawer(false);
          const toggleBtn = document.getElementById('btn-mobile-drawer');
          if (toggleBtn) toggleBtn.focus();
        }
      }
    });
  }

  function initPointerSpotlightEffects() {
    if (typeof document === 'undefined' || typeof window.matchMedia !== 'function') return;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!finePointer || reducedMotion) return;

    const targets = document.querySelectorAll('.station-signboard, .pillar-card, .campus-location-banner');
    targets.forEach((el) => {
      if (el.dataset.spotlightBound === '1') return;
      el.dataset.spotlightBound = '1';
      let rafId = null;
      el.addEventListener('pointermove', (ev) => {
        if (rafId !== null) return;
        const clientX = ev.clientX;
        const clientY = ev.clientY;
        rafId = requestAnimationFrame(() => {
          rafId = null;
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            const x = ((clientX - rect.left) / rect.width) * 100;
            const y = ((clientY - rect.top) / rect.height) * 100;
            el.style.setProperty('--mx', `${x.toFixed(1)}%`);
            el.style.setProperty('--my', `${y.toFixed(1)}%`);
          }
        });
      }, { passive: true });
    });
  }

  function initWordmarkWriteAnimation() {
    if (typeof document === 'undefined') return;
    const stage = document.getElementById('station-signboard');
    if (!stage || !stage.classList.contains('gh-wordmark-stage')) return;

    const reducedMotion = typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      stage.classList.add('is-written');
      return;
    }

    let started = false;
    const startWrite = () => {
      if (started) return;
      started = true;
      stage.classList.remove('is-written');
      stage.classList.add('is-writing');
    };

    const fallbackTimer = setTimeout(startWrite, 600);
    if (document.fonts && typeof document.fonts.load === 'function') {
      document.fonts.load('400 106px "Kaushan Script"').then(
        () => {
          clearTimeout(fallbackTimer);
          if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(startWrite);
          } else {
            startWrite();
          }
        },
        () => {
          clearTimeout(fallbackTimer);
          startWrite();
        }
      );
    } else {
      clearTimeout(fallbackTimer);
      startWrite();
    }

    const canvas = document.getElementById('gh-script-canvas');
    if (canvas && canvas.dataset.replayBound !== '1') {
      canvas.dataset.replayBound = '1';
      const replay = () => {
        stage.classList.remove('is-writing', 'is-written');
        void stage.offsetWidth;
        stage.classList.add('is-writing');
      };
      canvas.addEventListener('click', replay);
      canvas.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          replay();
        }
      });
    }
  }

  function initCursorFollowerEffect() {
    if (typeof document === 'undefined' || !document.body || typeof window.matchMedia !== 'function') return;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!finePointer || reducedMotion) return;

    const root = document.documentElement;
    if (root.dataset.cursorFxBound === '1') return;
    root.dataset.cursorFxBound = '1';

    const glow = document.createElement('div');
    glow.className = 'gh-cursor-glow';
    glow.id = 'gh-cursor-glow';
    glow.setAttribute('aria-hidden', 'true');

    const ring = document.createElement('div');
    ring.className = 'gh-cursor-ring';
    ring.id = 'gh-cursor-ring';
    ring.setAttribute('aria-hidden', 'true');

    document.body.appendChild(glow);
    document.body.appendChild(ring);

    const interactiveSelector = 'a, button, summary, [role="button"], input, select, textarea, .pillar-card, .faq-item, .product-card, .gh-script-canvas';
    let tx = -240;
    let ty = -240;
    let cx = -240;
    let cy = -240;
    let initialized = false;
    let rafId = null;

    const renderFrame = () => {
      const dx = tx - cx;
      const dy = ty - cy;
      if (Math.hypot(dx, dy) < 0.35) {
        cx = tx;
        cy = ty;
        rafId = null;
      } else {
        cx += dx * 0.24;
        cy += dy * 0.24;
        rafId = requestAnimationFrame(renderFrame);
      }

      const px = `${cx.toFixed(1)}px`;
      const py = `${cy.toFixed(1)}px`;
      root.style.setProperty('--cx', px);
      root.style.setProperty('--cy', py);
      const transformVal = `translate3d(${px}, ${py}, 0) translate(-50%, -50%)`;
      ring.style.transform = transformVal;
      glow.style.transform = transformVal;
    };

    document.addEventListener('pointermove', (ev) => {
      if (ev.pointerType === 'touch') return;
      tx = ev.clientX;
      ty = ev.clientY;
      if (!initialized) {
        cx = tx;
        cy = ty;
        initialized = true;
      }
      root.classList.add('gh-cursor-active');
      const targetEl = ev.target && typeof ev.target.closest === 'function'
        ? ev.target.closest(interactiveSelector)
        : null;
      ring.classList.toggle('is-hovering', Boolean(targetEl));
      if (rafId === null && typeof requestAnimationFrame === 'function') {
        rafId = requestAnimationFrame(renderFrame);
      }
    }, { passive: true });

    document.addEventListener('pointerdown', (ev) => {
      if (ev.pointerType === 'touch') return;
      ring.classList.add('is-pressed');
      const ripple = document.createElement('span');
      ripple.className = 'gh-cursor-ripple';
      ripple.setAttribute('aria-hidden', 'true');
      ripple.style.left = `${ev.clientX}px`;
      ripple.style.top = `${ev.clientY}px`;
      document.body.appendChild(ripple);
      const cleanup = () => {
        if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
      };
      ripple.addEventListener('animationend', cleanup, { once: true });
      setTimeout(cleanup, 560);
    }, { passive: true });

    const releasePress = () => ring.classList.remove('is-pressed');
    document.addEventListener('pointerup', releasePress, { passive: true });
    document.addEventListener('pointercancel', releasePress, { passive: true });

    const hideCursorFx = () => {
      root.classList.remove('gh-cursor-active');
      ring.classList.remove('is-pressed', 'is-hovering');
    };
    document.addEventListener('mouseleave', hideCursorFx);
    window.addEventListener('blur', hideCursorFx);
  }

  document.addEventListener('DOMContentLoaded', function() {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.add('js');
    }
    const t = getStoredTheme();
    updateThemeUI(t);

    initSmoothMotionEngine();
    initWordmarkWriteAnimation();
    initPointerSpotlightEffects();
    initCursorFollowerEffect();
    syncScrollEffects();

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
