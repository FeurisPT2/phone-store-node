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
    const secondList = await ProductModel.getAll('GearHub Service');
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

  test('Shared CatalogFilter module unifies capacity word boundaries, priceRange presets, sort aliases, and full-text detailedSpecs search', async () => {
    const fs = require('fs');
    const path = require('path');
    const CatalogFilter = require('../src/public/js/catalogFilter');

    // 1. Pass-through productController.js must be removed
    const controllerPath = path.join(__dirname, '..', 'src', 'controllers', 'productController.js');
    assert.equal(fs.existsSync(controllerPath), false, 'Pass-through productController.js should be deleted');

    // 2. Word-boundary capacity matching: 8GB never matches 128GB, 12GB never matches 512GB, 6GB never matches 16GB/256GB
    const sampleItems = [
      {
        id: 's1',
        name: 'Phone A 128GB',
        brand: 'Apple',
        price: 9500000,
        oldPrice: 11000000,
        specs: 'RAM 6 GB | ROM 128 GB',
        detailedSpecs: { ram: '6GB', storage: '128GB', chip: 'Apple A16', battery: '4500mAh', os: 'iOS 18' },
        createdAt: '2026-10-01T00:00:00.000Z'
      },
      {
        id: 's2',
        name: 'Phone B 256GB',
        brand: 'Samsung',
        price: 18000000,
        oldPrice: 24000000,
        specs: 'RAM 8 GB | ROM 256 GB',
        detailedSpecs: { ram: '8GB', storage: '256GB', chip: 'Exynos 2400', battery: '5000mAh', os: 'Android 15' },
        createdAt: '2026-10-05T00:00:00.000Z'
      },
      {
        id: 's3',
        name: 'Phone C 512GB',
        brand: 'ASUS',
        price: 29000000,
        oldPrice: 30000000,
        specs: 'RAM 16 GB | ROM 512 GB',
        detailedSpecs: { ram: '16GB', storage: '512GB', chip: 'Snapdragon 8 Elite', battery: '6000mAh', os: 'Android 15' },
        createdAt: '2026-10-10T00:00:00.000Z'
      }
    ];

    assert.deepEqual(
      CatalogFilter.filterProducts(sampleItems, { ram: '8GB' }).map((p) => p.id),
      ['s2'],
      'ram=8GB must not match 128GB ROM in s1'
    );
    assert.deepEqual(
      CatalogFilter.filterProducts(sampleItems, { ram: '12GB' }).map((p) => p.id),
      [],
      'ram=12GB must not match 512GB ROM in s3'
    );
    assert.deepEqual(
      CatalogFilter.filterProducts(sampleItems, { ram: '6GB' }).map((p) => p.id),
      ['s1'],
      'ram=6GB must not match 16GB RAM in s3 or 256GB ROM in s2'
    );

    // 3. Price presets (under10, 10to20, under15, 15to25, over25)
    assert.deepEqual(CatalogFilter.filterProducts(sampleItems, { priceRange: 'under10' }).map((p) => p.id), ['s1']);
    assert.deepEqual(CatalogFilter.filterProducts(sampleItems, { priceRange: '10to20' }).map((p) => p.id), ['s2']);
    assert.deepEqual(CatalogFilter.filterProducts(sampleItems, { priceRange: 'under15' }).map((p) => p.id), ['s1']);
    assert.deepEqual(CatalogFilter.filterProducts(sampleItems, { priceRange: '15to25' }).map((p) => p.id), ['s2']);
    assert.deepEqual(CatalogFilter.filterProducts(sampleItems, { priceRange: 'over25' }).map((p) => p.id), ['s3']);

    // 4. Unified sort aliases (price_asc / price-asc, price_desc / price-desc, discount_desc / discount, newest)
    assert.deepEqual(
      CatalogFilter.filterProducts(sampleItems, { sort: 'price-asc' }).map((p) => p.id),
      CatalogFilter.filterProducts(sampleItems, { sort: 'price_asc' }).map((p) => p.id)
    );
    assert.deepEqual(
      CatalogFilter.filterProducts(sampleItems, { sort: 'price-desc' }).map((p) => p.id),
      ['s3', 's2', 's1']
    );
    assert.deepEqual(
      CatalogFilter.filterProducts(sampleItems, { sort: 'discount' }).map((p) => p.id),
      CatalogFilter.filterProducts(sampleItems, { sort: 'discount_desc' }).map((p) => p.id)
    );
    assert.equal(CatalogFilter.filterProducts(sampleItems, { sort: 'discount' })[0].id, 's2');
    assert.deepEqual(
      CatalogFilter.filterProducts(sampleItems, { sort: 'newest' }).map((p) => p.id),
      ['s3', 's2', 's1']
    );

    // 5. Full-text search across detailedSpecs (battery, os, chip)
    assert.deepEqual(CatalogFilter.filterProducts(sampleItems, { search: '6000mAh' }).map((p) => p.id), ['s3']);
    assert.deepEqual(CatalogFilter.filterProducts(sampleItems, { q: 'ios 18' }).map((p) => p.id), ['s1']);

    // 6. Verify API supports priceRange and hyphenated sort aliases via inlined productRoutes
    const apiPresetRes = await fetch(`${baseUrl}/api/products?priceRange=over25&sort=price-desc`);
    assert.equal(apiPresetRes.status, 200);
    const apiPresetData = (await apiPresetRes.json()).data;
    assert.ok(apiPresetData.length > 0);
    assert.ok(apiPresetData.every((p) => p.price > 25000000));

    // 7. Verify ProductModel.getAll deep-clones cached items so caller mutation never corrupts catalogCache
    const cachedBatch1 = await ProductModel.getAll('all');
    const originalPrice = cachedBatch1[0].price;
    const originalRam = cachedBatch1[0].detailedSpecs?.ram;
    cachedBatch1[0].price = 123;
    if (cachedBatch1[0].detailedSpecs) {
      cachedBatch1[0].detailedSpecs.ram = '999GB_MUTATED';
    }
    const cachedBatch2 = await ProductModel.getAll('all');
    assert.equal(cachedBatch2[0].price, originalPrice, 'Mutating getAll result must not corrupt cached price');
    assert.equal(
      cachedBatch2[0].detailedSpecs?.ram,
      originalRam,
      'Mutating getAll nested detailedSpecs must not corrupt cache'
    );

    // 8. Verify UMD browser global attachment (window.CatalogFilter) in a browser-like VM context
    const vm = require('vm');
    const code = fs.readFileSync(path.join(__dirname, '..', 'src', 'public', 'js', 'catalogFilter.js'), 'utf8');
    const sandbox = { window: {} };
    vm.runInNewContext(code, sandbox);
    assert.ok(sandbox.window.CatalogFilter, 'UMD bundle must attach CatalogFilter to window when module is undefined');
    assert.deepEqual(
      Array.from(sandbox.window.CatalogFilter.filterProducts(sampleItems, { ram: '8GB' }).map((p) => p.id)),
      ['s2']
    );
  });

  test('GearHub category grouping, price presets (under30/30to80/over80), and semantic criteria filters work via CatalogFilter and GET /api/products', async () => {
    const CatalogFilter = require('../src/public/js/catalogFilter');
    const catalog = require('../src/data/products.json');

    // 1. Category grouping distributes all 8 items into service (4), rental (3), accessory (1)
    const groups = CatalogFilter.groupProductsByCategory(catalog);
    assert.deepEqual(
      groups.map((g) => ({ key: g.key, count: g.items.length })),
      [
        { key: 'service', count: 4 },
        { key: 'rental', count: 3 },
        { key: 'accessory', count: 1 }
      ]
    );

    // 2. Price presets for student budget tiers
    assert.equal(CatalogFilter.filterProducts(catalog, { priceRange: 'under30' }).length, 3);
    assert.equal(CatalogFilter.filterProducts(catalog, { priceRange: '30to80' }).length, 4);
    assert.deepEqual(
      CatalogFilter.filterProducts(catalog, { priceRange: 'over80' }).map((p) => p.id),
      ['gearhub_thermal_boost']
    );

    // 3. Target, policy & standard criteria return non-empty, accurate GearHub subsets
    assert.equal(CatalogFilter.filterProducts(catalog, { policy: 'student_id' }).length, 3);
    assert.equal(CatalogFilter.filterProducts(catalog, { policy: 'fast_service' }).length, 4);
    assert.equal(CatalogFilter.filterProducts(catalog, { policy: 'retail' }).length, 1);
    assert.ok(CatalogFilter.filterProducts(catalog, { target: 'laptop' }).length >= 4);
    assert.equal(CatalogFilter.filterProducts(catalog, { target: 'keyboard' }).length, 4);
    assert.equal(CatalogFilter.filterProducts(catalog, { target: 'mouse_slide' }).length, 2);
    assert.equal(CatalogFilter.filterProducts(catalog, { standard: 'typec' }).length, 3);
    assert.ok(CatalogFilter.filterProducts(catalog, { standard: 'arctic' }).length >= 2);
    assert.ok(CatalogFilter.filterProducts(catalog, { standard: 'silent' }).length >= 3);

    // 4. Category filtering over HTTP GET /api/products?category=...
    const svcRes = await fetch(`${baseUrl}/api/products?category=service`);
    assert.equal(svcRes.status, 200);
    const svcBody = await svcRes.json();
    assert.equal(svcBody.count, 4);
    assert.ok(svcBody.data.every((p) => p.category === 'service'));

    const rentalCheapRes = await fetch(`${baseUrl}/api/products?category=rental&priceRange=under30&sort=price-asc`);
    const rentalCheapBody = await rentalCheapRes.json();
    assert.equal(rentalCheapBody.count, 3);
    assert.deepEqual(
      rentalCheapBody.data.map((p) => p.id),
      ['gearhub_rent_mouse', 'gearhub_rent_hub_slide', 'gearhub_rent_ek75']
    );
  });
});
