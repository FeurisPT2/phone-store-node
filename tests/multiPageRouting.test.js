process.env.NODE_ENV = 'test';
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const app = require('../server');

describe('Seam 1: HTTP Streamlined Routing & Navigation Indicators', () => {
  let server;
  let baseUrl;

  before(async () => {
    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  test('GET / serves homepage with Station Signboard, Why & Motivation section, and active-nav on "Giới thiệu"', async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /text\/html/);

    const body = await res.text();
    assert.ok(body.includes('station-signboard'), 'Homepage must contain Station Signboard section');
    assert.ok(body.includes('story-section'), 'Homepage must contain Why & Motivation section');
    assert.ok(body.includes('GEARHUB STATION'), 'Homepage must contain Station Title');
    assert.match(body, /<a href="\/" class="top-nav-link active-nav">Giới thiệu<\/a>/);
    assert.match(body, /<a href="\/shop" class="top-nav-link">Cửa hàng<\/a>/);
  });

  test('GET /shop serves unified storefront catalog, search, and active-nav on "Cửa hàng"', async () => {
    const res = await fetch(`${baseUrl}/shop`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /text\/html/);

    const body = await res.text();
    assert.ok(body.includes('catalog-container') || body.includes('split-stage-wrap'));
    assert.match(body, /<a href="\/" class="top-nav-link">Giới thiệu<\/a>/);
    assert.match(body, /<a href="\/shop" class="top-nav-link active-nav">Cửa hàng<\/a>/);
  });

  test('GET /services seamlessly redirects to /shop?category=service (merging services into shop)', async () => {
    const res = await fetch(`${baseUrl}/services`, { redirect: 'manual' });
    assert.equal(res.status, 302, 'Should respond with 302 redirect');
    assert.equal(res.headers.get('location'), '/shop?category=service');
  });

  test('GET /rentals seamlessly redirects to /shop?category=rental (merging rentals into shop)', async () => {
    const res = await fetch(`${baseUrl}/rentals`, { redirect: 'manual' });
    assert.equal(res.status, 302, 'Should respond with 302 redirect');
    assert.equal(res.headers.get('location'), '/shop?category=rental');
  });

  test('GET /features redirects to /shop (features page retired and merged)', async () => {
    const res = await fetch(`${baseUrl}/features`, { redirect: 'manual' });
    assert.equal(res.status, 302, 'Should respond with 302 redirect');
    assert.equal(res.headers.get('location'), '/shop');
  });

  test('GET /cart serves dedicated Cart & Appointment schedule page', async () => {
    const res = await fetch(`${baseUrl}/cart`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /text\/html/);

    const body = await res.text();
    assert.ok(body.includes('cart-page-section'), 'Cart page must contain cart-page-section');
    assert.ok(body.includes('order-form'), 'Cart page must contain appointment booking order form');
  });

  test('GET /product serves dedicated Product Detail Page with breadcrumbs, specs, and actions', async () => {
    const res = await fetch(`${baseUrl}/product?id=gearhub_clean_cool`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /text\/html/);

    const body = await res.text();
    assert.ok(body.includes('pdp-container'), 'Product page must contain pdp-container');
    assert.ok(body.includes('pdp-hero-grid'), 'Product page must contain pdp-hero-grid');
    assert.ok(body.includes('pdp-tabs-section'), 'Product page must contain pdp-tabs-section');
    assert.match(body, /<a href="\/shop" class="top-nav-link active-nav">Cửa hàng<\/a>/);
  });
});
