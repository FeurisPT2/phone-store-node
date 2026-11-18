process.env.NODE_ENV = 'test';
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

describe('Seam 3: Design Tokens, Palette Contract & Anti-Pattern Bans', () => {
  const styleCssPath = path.join(__dirname, '../src/public/css/style.css');
  const aboutCssPath = path.join(__dirname, '../src/public/css/about.css');
  const styleCss = fs.readFileSync(styleCssPath, 'utf8');
  const aboutCss = fs.readFileSync(aboutCssPath, 'utf8');

  test('style.css defines core semantic tokens in :root and [data-theme="dark"]', () => {
    // Light mode palette contract
    assert.match(styleCss, /--accent:\s*#1d4ed8/i, ':root must declare primary blue accent #1d4ed8');
    assert.match(styleCss, /--ink:\s*#0f172a/i, ':root must declare high-contrast ink #0f172a');
    assert.match(styleCss, /--bg:\s*#f3f2ee/i, ':root must declare editorial bone-stone background #f3f2ee');

    // Dark mode palette contract
    assert.match(styleCss, /\[data-theme=["']?dark["']?\][\s\S]*?--accent:\s*#3b82f6/i, 'Dark mode must declare accent #3b82f6');
    assert.match(styleCss, /\[data-theme=["']?dark["']?\][\s\S]*?--ink:\s*#f8fafc/i, 'Dark mode must declare light ink #f8fafc');
    assert.match(styleCss, /\[data-theme=["']?dark["']?\][\s\S]*?--bg:\s*#0b0d10/i, 'Dark mode must declare dark background #0b0d10');
  });

  test('Enforces anti-slop guidelines: no gradient text with transparent fills or 4px top borders on cards', () => {
    // 1. No gradient text with transparent fill
    assert.doesNotMatch(
      styleCss,
      /-webkit-text-fill-color:\s*transparent/i,
      'style.css must not use -webkit-text-fill-color: transparent (causes low contrast & slop)'
    );
    assert.doesNotMatch(
      aboutCss,
      /-webkit-text-fill-color:\s*transparent/i,
      'about.css must not use -webkit-text-fill-color: transparent'
    );

    // 2. No border-top: 4px on cards
    assert.doesNotMatch(
      styleCss,
      /border-top:\s*4px/i,
      'style.css must not use border-top: 4px on cards (flagged anti-pattern)'
    );
    assert.doesNotMatch(
      aboutCss,
      /border-top:\s*4px/i,
      'about.css must not use border-top: 4px on cards'
    );
  });

  test('Enforces editorial typography: fluid clamps, headline balancing, and capped paragraph line-lengths', () => {
    // Fluid typography clamps
    assert.match(styleCss, /--fs-display:\s*clamp\(/i, 'Must define fluid --fs-display using clamp');
    assert.match(styleCss, /--fs-h2:\s*clamp\(/i, 'Must define fluid --fs-h2 using clamp');

    // Headline balance & paragraph max-width in about.css
    assert.match(aboutCss, /text-wrap:\s*balance/i, 'about.css must enforce text-wrap: balance on hero titles');
    assert.match(aboutCss, /max-width:\s*58ch/i, 'about.css must cap reading paragraphs to ~58ch');
  });

  test('All platform HTML surfaces link style.css and about.css', () => {
    const surfaces = ['index.html', 'shop.html', 'cart.html'];
    for (const surface of surfaces) {
      const htmlPath = path.join(__dirname, '../src/public', surface);
      const content = fs.readFileSync(htmlPath, 'utf8');
      assert.ok(content.includes('css/style.css'), `${surface} must link css/style.css`);
      assert.ok(content.includes('css/about.css'), `${surface} must link css/about.css`);
    }
  });
});
