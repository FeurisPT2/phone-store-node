function updateThemeLogos() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.querySelectorAll('[data-theme-logo-light][data-theme-logo-dark]').forEach((logo) => {
    const source = isDark ? logo.dataset.themeLogoDark : logo.dataset.themeLogoLight;
    if (source && logo.getAttribute('src') !== source) {
      logo.setAttribute('src', source);
    }
  });
}

updateThemeLogos();

new MutationObserver(updateThemeLogos).observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['data-theme']
});
