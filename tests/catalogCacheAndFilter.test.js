process.env.NODE_ENV = 'test';
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const zlib = require('zlib');
const app = require('../server');
const ProductModel = require('../src/models/Product');

describe('Catalog TTL Cache, Multi-Attribute Specs Filtering & HTTP Gzip Compression', () => {
  let server;
  let baseUrl;
  let testProductId;

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
    if (testProductId) {
      await ProductModel.delete(testProductId);
    }
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  test('ProductModel 5-minute TTL cache records hits and invalidates on create/update/delete', async () => {
    assert.equal(typeof ProductModel.invalidateCache, 'function');
    assert.equal(typeof ProductModel.getCacheStats, 'function');

    ProductModel.invalidateCache();
    assert.equal(ProductModel.getCacheStats().cached, false);

    // First call -> cache miss, populates cache
    const firstList = await ProductModel.getAll('all');
    assert.ok(firstList.length > 0);
    const statsAfterFirst = ProductModel.getCacheStats();
    assert.equal(statsAfterFirst.cached, true);
    assert.equal(statsAfterFirst.misses, 1);

    // Second call -> cache hit
    const secondList = await ProductModel.getAll('Apple');
    assert.ok(secondList.length > 0);
    const statsAfterSecond = ProductModel.getCacheStats();
    assert.equal(statsAfterSecond.hits, 1);

    // Write-through invalidation on create
    const created = await ProductModel.create({
      name: 'ROG Phone 9 Pro Ultimate Test',
      brand: 'ASUS',
      price: 34990000,
      oldPrice: 39990000,
      specs: '6.78 inch 185Hz | Snapdragon 8 Elite | RAM 16GB | ROM 512GB',
      detailedSpecs: {
        screen: '6.78 inch LTPO AMOLED 185Hz',
        chip: 'Snapdragon 8 Elite',
        ram: '16GB',
        storage: '512GB',
        battery: '5800mAh',
        camera: '50MP Sony Lytia',
        charging: '65W HyperCharge',
        os: 'Android 15'
      }
    });
    testProductId = created.id;
    assert.equal(ProductModel.getCacheStats().cached, false, 'Cache must be invalidated after create');

    // Repopulate and test update invalidation
    await ProductModel.getAll('all');
    assert.equal(ProductModel.getCacheStats().cached, true);

    await ProductModel.update(testProductId, { price: 33990000 });
    assert.equal(ProductModel.getCacheStats().cached, false, 'Cache must be invalidated after update');
  });

  test('GET /api/products filters by multi-attribute specs (brand, ram, storage, chip, minPrice, maxPrice, sort)', async () => {
    const res = await fetch(
      `${baseUrl}/api/products?brand=ASUS&ram=16GB&storage=512GB&chip=Snapdragon&minPrice=30000000&maxPrice=36000000`
    );
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.some((p) => p.id === testProductId), 'Should find the matching ROG Phone 9 Pro');
    assert.ok(body.data.every((p) => p.brand.toLowerCase() === 'asus'));
    assert.ok(body.data.every((p) => p.price >= 30000000 && p.price <= 36000000));

    // Regression: ram=12GB or ram=6GB must NOT false-match a 16GB RAM / 512GB ROM product via substring ("512gb" includes "12gb", "16gb" includes "6gb")
    const falseRam12Res = await fetch(`${baseUrl}/api/products?brand=ASUS&ram=12GB`);
    const falseRam12Data = (await falseRam12Res.json()).data;
    assert.ok(
      !falseRam12Data.some((p) => p.id === testProductId),
      '16GB RAM / 512GB ROM product must NOT match ram=12GB'
    );

    const falseRam6Res = await fetch(`${baseUrl}/api/products?brand=ASUS&ram=6GB`);
    const falseRam6Data = (await falseRam6Res.json()).data;
    assert.ok(
      !falseRam6Data.some((p) => p.id === testProductId),
      '16GB RAM / 512GB ROM product must NOT match ram=6GB'
    );

    // Test sorting price_asc and price_desc
    const ascRes = await fetch(`${baseUrl}/api/products?sort=price_asc`);
    const ascData = (await ascRes.json()).data;
    assert.ok(ascData.length >= 2);
    assert.ok(ascData[0].price <= ascData[1].price, 'price_asc should sort ascending');

    const descRes = await fetch(`${baseUrl}/api/products?sort=price_desc`);
    const descData = (await descRes.json()).data;
    assert.ok(descData[0].price >= descData[1].price, 'price_desc should sort descending');
  });

  test('GET /api/products supports HTTP Gzip compression for large JSON payloads', async () => {
    const rawResult = await new Promise((resolve, reject) => {
      const req = http.request(
        `${baseUrl}/api/products`,
        {
          method: 'GET',
          headers: { 'Accept-Encoding': 'gzip' }
        },
        (res) => {
          const chunks = [];
          res.on('data', (c) => chunks.push(c));
          res.on('end', () => {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              buffer: Buffer.concat(chunks)
            });
          });
        }
      );
      req.on('error', reject);
      req.end();
    });

    assert.equal(rawResult.statusCode, 200);
    assert.equal(rawResult.headers['content-encoding'], 'gzip');
    const decompressed = zlib.gunzipSync(rawResult.buffer).toString('utf8');
    const parsed = JSON.parse(decompressed);
    assert.equal(parsed.success, true);
    assert.ok(Array.isArray(parsed.data));
  });
});
