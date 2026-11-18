// ============================================================================
// GEARHUB UTILITIES & THEME ENGINE (UI/UX Pro Max)
// ============================================================================

const formatMoney = (amount) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

const twoDigits = (n) => (n < 10 ? '0' + n : String(n));

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

// ==================== THEME MANAGEMENT & REAL-TIME SYNC ====================

function getStoredTheme() {
  if (typeof localStorage === 'undefined') return 'light';
  const saved = localStorage.getItem('techstore_theme');
  if (saved === 'dark' || saved === 'light') return saved;
  return (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
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

if (typeof window !== 'undefined') {
  window.addEventListener('storage', function(e) {
    if (e.key === 'techstore_theme' && e.newValue) {
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', e.newValue);
      }
      updateThemeUI(e.newValue);
    }
  });

  document.addEventListener('DOMContentLoaded', function() {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.add('js');
    }
    const t = getStoredTheme();
    updateThemeUI(t);

    // Initialize silky-smooth data-reveal scroll animations across all pages
    const revealEls = document.querySelectorAll('[data-reveal]:not(.in)');
    if (typeof IntersectionObserver !== 'undefined' && revealEls.length > 0) {
      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
      revealEls.forEach(el => observer.observe(el));
    } else {
      revealEls.forEach(el => el.classList.add('in'));
    }
  });
}
