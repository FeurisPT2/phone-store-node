const { test } = require('node:test');
const assert = require('node:assert/strict');
const geminiService = require('../src/services/geminiService');

test('enrichProduct returns structured specs and aiReview using client', async () => {
  const mockClient = {
    models: {
      generateContent: async () => ({
        text: JSON.stringify({
          detailedSpecs: {
            screen: '6.9 inch Super Retina XDR OLED',
            chip: 'Apple A18 Pro',
            ram: '8GB',
            storage: '256GB',
            battery: '4685mAh',
            camera: '48MP + 48MP + 12MP',
            charging: '25W MagSafe',
            os: 'iOS 18'
          },
          aiReview: {
            summary: 'Flagship cao cấp nhất của Apple năm 2024.',
            pros: ['Khung titan siêu bền nhẹ', 'Nút Camera Control tiện lợi'],
            cons: ['Kích thước khá lớn', 'Giá thành cao'],
            targetAudience: 'Người dùng cao cấp, sáng tạo video'
          }
        })
      })
    }
  };

  const result = await geminiService.enrichProduct({
    name: 'iPhone 16 Pro Max 256GB',
    brand: 'Apple',
    rawText: 'iPhone 16 Pro Max 256GB titan sa mạc hàng chính hãng',
    client: mockClient
  });

  assert.equal(result.detailedSpecs.chip, 'Apple A18 Pro');
  assert.equal(result.detailedSpecs.screen, '6.9 inch Super Retina XDR OLED');
  assert.ok(Array.isArray(result.aiReview.pros));
  assert.equal(result.aiReview.pros.length, 2);
  assert.ok(result.aiReview.targetAudience.includes('Người dùng'));
});

test('enrichProduct gracefully falls back to basic structure when no API client or key', async () => {
  // Đảm bảo không có key trong test case này
  const origKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  try {
    const result = await geminiService.enrichProduct({
      name: 'Samsung Galaxy S24 Ultra 5G 256GB',
      brand: 'Samsung',
      rawText: 'Màn hình 6.8 inch 12GB/256GB pin 5000mAh camera 200MP'
    });

    assert.ok(result.detailedSpecs, 'Should return detailedSpecs');
    assert.ok(result.detailedSpecs.screen, 'Should have screen spec');
    assert.ok(result.aiReview, 'Should return aiReview');
    assert.ok(Array.isArray(result.aiReview.pros), 'Pros should be an array');
  } finally {
    if (origKey) process.env.GEMINI_API_KEY = origKey;
  }
});

test('fallbackEnrich and CatalogFilter.extractHardwareSpecs extract real SoC/chip tokens and specs', () => {
  const cases = [
    {
      input: {
        name: 'Samsung Galaxy S24 Ultra 5G',
        brand: 'Samsung',
        rawText: 'Màn hình 6.8 inch Dynamic AMOLED 2X 120Hz | Snapdragon 8 Gen 3 | 12GB/512GB | Pin 5000mAh | Camera 200MP | Sạc nhanh 45W | Android 14'
      },
      expectedChip: 'Snapdragon 8 Gen 3',
      expectedRam: '12GB',
      expectedStorage: '512GB',
      expectedBattery: '5000mAh',
      expectedCamera: '200MP',
      expectedCharging: 'Sạc nhanh 45W',
      expectedOs: 'Android 14'
    },
    {
      input: {
        name: 'Vivo X100 Pro 5G',
        brand: 'Vivo',
        rawText: '6.78 inch LTPO AMOLED 120Hz | Dimensity 9300 | RAM 16GB | ROM 1TB | Pin 5400mAh | Camera 50MP | Sạc 100W'
      },
      expectedChip: 'Dimensity 9300',
      expectedRam: '16GB',
      expectedStorage: '1TB',
      expectedBattery: '5400mAh',
      expectedCamera: '50MP',
      expectedCharging: 'Sạc nhanh 100W',
      expectedOs: 'Android'
    },
    {
      input: {
        name: 'iPhone 16 Pro Max 256GB',
        brand: 'Apple',
        rawText: '6.9 inch Super Retina XDR OLED 120Hz | Apple A18 Pro | iOS 18'
      },
      expectedChip: 'Apple A18 Pro',
      expectedRam: '8GB',
      expectedStorage: '256GB',
      expectedOs: 'iOS 18'
    },
    {
      input: {
        name: 'iPhone 15 Pro 128GB',
        brand: 'Apple',
        rawText: 'Khung Titan tự nhiên'
      },
      expectedChip: 'Apple A17 Pro',
      expectedStorage: '128GB',
      expectedOs: 'iOS'
    },
    {
      input: {
        name: 'Samsung Galaxy S24 Plus 256GB',
        brand: 'Samsung',
        rawText: 'Exynos 2400 | 12GB/256GB'
      },
      expectedChip: 'Exynos 2400',
      expectedRam: '12GB',
      expectedStorage: '256GB'
    },
    {
      input: {
        name: 'Google Pixel 9 Pro XL 512GB',
        brand: 'Google',
        rawText: 'Chip Tensor G4 | RAM 16GB'
      },
      expectedChip: 'Tensor G4',
      expectedRam: '16GB',
      expectedStorage: '512GB'
    },
    {
      input: {
        name: 'Xiaomi 14T Pro 5G',
        brand: 'Xiaomi',
        rawText: 'Dimensity 9300+ | 12GB RAM | Bộ nhớ 512GB'
      },
      expectedChip: 'Dimensity 9300+',
      expectedRam: '12GB',
      expectedStorage: '512GB'
    },
    {
      input: {
        name: 'Samsung Galaxy S24 FE',
        brand: 'Samsung',
        rawText: 'Exynos 2400e | ROM 256GB | 8GB'
      },
      expectedChip: 'Exynos 2400e',
      expectedRam: '8GB',
      expectedStorage: '256GB'
    },
    {
      input: {
        name: 'iPhone 15 256GB/6GB',
        brand: 'Apple',
        rawText: 'Snapdragon 8+ Gen 1'
      },
      expectedChip: 'Snapdragon 8+ Gen 1',
      expectedRam: '6GB',
      expectedStorage: '256GB'
    },
    {
      input: {
        name: 'ASUS ROG Phone 16GB',
        brand: 'ASUS',
        rawText: 'Snapdragon 8s Gen 3'
      },
      expectedChip: 'Snapdragon 8s Gen 3',
      expectedRam: '16GB',
      expectedStorage: '128GB'
    }
  ];

  for (const c of cases) {
    const res = geminiService.fallbackEnrich(c.input);
    assert.equal(res.detailedSpecs.chip, c.expectedChip);
    if (c.expectedRam) assert.equal(res.detailedSpecs.ram, c.expectedRam);
    if (c.expectedStorage) assert.equal(res.detailedSpecs.storage, c.expectedStorage);
    if (c.expectedBattery) assert.equal(res.detailedSpecs.battery, c.expectedBattery);
    if (c.expectedCamera) assert.equal(res.detailedSpecs.camera, c.expectedCamera);
    if (c.expectedCharging) assert.equal(res.detailedSpecs.charging, c.expectedCharging);
    if (c.expectedOs) assert.equal(res.detailedSpecs.os, c.expectedOs);
  }

  // Also test positional signature fallbackEnrich(name, brand, rawText)
  const posRes = geminiService.fallbackEnrich(
    'Xiaomi 14 Ultra 5G',
    'Xiaomi',
    '6.73 inch 120Hz | Snapdragon 8 Gen 3 | 16GB/512GB'
  );
  assert.equal(posRes.detailedSpecs.chip, 'Snapdragon 8 Gen 3');
  assert.equal(posRes.detailedSpecs.ram, '16GB');
  assert.equal(posRes.detailedSpecs.storage, '512GB');
});

test('consultCustomer grounds unenriched products using p.specs before p.description', async () => {
  let capturedPrompt = '';
  const mockClient = {
    models: {
      generateContent: async ({ contents }) => {
        capturedPrompt = contents;
        return {
          text: JSON.stringify({
            reply: 'Gợi ý mẫu máy có chip Dimensity 9300 và pin 5400mAh.',
            suggestedProductIds: ['u1']
          })
        };
      }
    }
  };

  const unenrichedCatalog = [
    {
      id: 'u1',
      name: 'OPPO Find X7 5G',
      brand: 'OPPO',
      price: 16990000,
      specs: 'Màn hình 6.78 inch | Dimensity 9300 | 12GB/256GB | Pin 5000mAh',
      detailedSpecs: null
    }
  ];

  const result = await geminiService.consultCustomer({
    message: 'Tư vấn máy OPPO chạy Dimensity 9300',
    catalog: unenrichedCatalog,
    client: mockClient
  });

  assert.ok(capturedPrompt.includes('Dimensity 9300'), 'Grounding prompt must include p.specs for unenriched products');
  assert.deepEqual(result.suggestedProductIds, ['u1']);
});

test('enrichAndPersistProduct, selfHealCatalog, and consultWithCatalog orchestrate persistence and Mini Product Cards', async () => {
  const ProductModel = require('../src/models/Product');
  const createdIds = [];

  try {
    const p1 = await ProductModel.create({
      name: 'Google Pixel 9 Pro Test Enrich',
      brand: 'Google',
      price: 24990000,
      oldPrice: 27990000,
      specs: '6.3 inch OLED 120Hz | Tensor G4 | 16GB/256GB | Pin 4700mAh | Camera 50MP',
      image: '/img/pixel9.jpg'
    });
    createdIds.push(p1.id);

    const p2 = await ProductModel.create({
      name: 'Samsung Galaxy S24 Plus Test SelfHeal',
      brand: 'Samsung',
      price: 21990000,
      oldPrice: 24990000,
      specs: '6.7 inch Dynamic AMOLED 2X 120Hz | Exynos 2400 | 12GB/256GB | Pin 4900mAh',
      image: '/img/s24plus.jpg'
    });
    createdIds.push(p2.id);

    // 1. enrichAndPersistProduct by ID
    const enrichedP1 = await geminiService.enrichAndPersistProduct(p1.id);
    assert.ok(enrichedP1);
    assert.equal(enrichedP1.detailedSpecs.chip, 'Tensor G4');
    assert.equal(enrichedP1.detailedSpecs.ram, '16GB');
    assert.ok(enrichedP1.aiEnrichedAt);

    const persistedP1 = await ProductModel.getById(p1.id);
    assert.equal(persistedP1.detailedSpecs.chip, 'Tensor G4');
    assert.ok(persistedP1.aiEnrichedAt);

    // Non-existent ID or unpersisted object with non-existent ID returns null
    const missing = await geminiService.enrichAndPersistProduct('non_existent_id_99999');
    assert.equal(missing, null);
    const missingObj = await geminiService.enrichAndPersistProduct({
      id: 'non_existent_id_99999',
      name: 'Ghost Phone',
      brand: 'Apple'
    });
    assert.equal(missingObj, null);

    // 2. selfHealCatalog enriches remaining unenriched products (including p2) and skips failed mid-batch updates
    const p3 = await ProductModel.create({
      name: 'Xiaomi 14 Test MidBatchFail',
      brand: 'Xiaomi',
      price: 19990000,
      oldPrice: 22990000,
      specs: 'Snapdragon 8 Gen 3 | 12GB/256GB',
      image: '/img/x14.jpg'
    });
    createdIds.push(p3.id);

    const origUpdate = ProductModel.update;
    ProductModel.update = async (id, data) => {
      if (String(id) === String(p3.id)) return null;
      return origUpdate.call(ProductModel, id, data);
    };

    let healResult;
    try {
      healResult = await geminiService.selfHealCatalog(50);
    } finally {
      ProductModel.update = origUpdate;
    }

    assert.ok(healResult.totalFound >= 2);
    assert.ok(healResult.enrichedCount >= 1);
    assert.ok(healResult.enrichedCount < healResult.totalFound, 'Failed mid-batch update must not increment enrichedCount');
    assert.ok(Array.isArray(healResult.updatedProducts));
    const healedP2 = healResult.updatedProducts.find((item) => item.id === p2.id);
    assert.ok(healedP2, 'p2 should be enriched by selfHealCatalog');
    assert.equal(healedP2.detailedSpecs.chip, 'Exynos 2400');
    const failedP3 = healResult.updatedProducts.find((item) => item.id === p3.id);
    assert.equal(failedP3, undefined, 'p3 whose update returned null must not be in updatedProducts');

    // 3. consultWithCatalog hydrates Mini Product Cards and never throws
    const mockClient = {
      models: {
        generateContent: async () => ({
          text: JSON.stringify({
            reply: 'Gợi ý chiếc Google Pixel 9 Pro Test Enrich cho bạn.',
            suggestedProductIds: [p1.id]
          })
        })
      }
    };

    const consultRes = await geminiService.consultWithCatalog('Tư vấn máy Google Pixel', [], mockClient);
    assert.ok(consultRes.reply.includes('Pixel 9 Pro'));
    assert.equal(consultRes.suggestedProducts.length, 1);
    assert.deepEqual(Object.keys(consultRes.suggestedProducts[0]).sort(), [
      'brand',
      'id',
      'image',
      'name',
      'oldPrice',
      'price',
      'specs'
    ]);
    assert.equal(consultRes.suggestedProducts[0].id, p1.id);
  } finally {
    for (const id of createdIds) {
      await ProductModel.delete(id);
    }
  }
});

test('Storefront main.js and Admin admin.js have valid syntax, 0 dead pass-through aliases, and encapsulate clearQrSessionTimers', () => {
  const fs = require('fs');
  const path = require('path');
  const vm = require('vm');

  const mainJsPath = path.join(__dirname, '..', 'src', 'public', 'js', 'main.js');
  const adminJsPath = path.join(__dirname, '..', 'src', 'public', 'js', 'admin.js');

  const mainCode = fs.readFileSync(mainJsPath, 'utf8');
  const adminCode = fs.readFileSync(adminJsPath, 'utf8');
  const adminHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'public', 'admin.html'), 'utf8');
  const loginHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'public', 'login.html'), 'utf8');

  const htmlFiles = ['index.html', 'shop.html', 'cart.html', 'admin.html', 'login.html'];
  const htmlContents = htmlFiles.map((f) => ({
    name: f,
    code: fs.readFileSync(path.join(__dirname, '..', 'src', 'public', f), 'utf8')
  }));

  // Verify clean JS syntax across all modular client scripts
  const jsDir = path.join(__dirname, '..', 'src', 'public', 'js');
  ['utils.js', 'qrPayment.js', 'cart.js', 'customerPortal.js', 'aiChat.js', 'main.js', 'admin.js', 'catalogFilter.js'].forEach((f) => {
    const code = fs.readFileSync(path.join(jsDir, f), 'utf8');
    assert.doesNotThrow(() => new vm.Script(code, { filename: f }), `Syntax error in ${f}`);
  });

  // Verify 4 dead aliases deleted from main.js
  const deletedMainAliases = [
    'openMyOrdersModal',
    'closeMyOrdersModal',
    'toggleChatWindow',
    'handleChatSubmit'
  ];
  for (const fnName of deletedMainAliases) {
    assert.equal(
      new RegExp(`\\bfunction\\s+${fnName}\\b`).test(mainCode),
      false,
      `Dead alias ${fnName} must be deleted from main.js`
    );
    htmlContents.forEach(({ name, code }) => {
      assert.equal(code.includes(fnName), false, `${name} must not reference deleted alias ${fnName}`);
    });
  }

  // Verify 14 dead aliases deleted from admin.js
  const deletedAdminAliases = [
    'handleCustomerSearch',
    'openAddCustomerModal',
    'exportCustomersCsv',
    'handleOrderSearch',
    'handleOrderDateFilter',
    'exportOrdersCsv',
    'printCurrentOrder',
    'handleProductSearch',
    'handleCrawlSubmit',
    'openAddProductModal',
    'handleChangePassword',
    'openModal',
    'closeModal',
    'selfHealAllProducts'
  ];
  for (const fnName of deletedAdminAliases) {
    assert.equal(
      new RegExp(`\\bfunction\\s+${fnName}\\b`).test(adminCode),
      false,
      `Dead alias ${fnName} must be deleted from admin.js`
    );
    assert.equal(adminHtml.includes(fnName), false, `admin.html must not reference deleted alias ${fnName}`);
    assert.equal(loginHtml.includes(fnName), false, `login.html must not reference deleted alias ${fnName}`);
  }

  // Verify QR session timer encapsulation via clearQrSessionTimers()
  assert.ok(
    mainCode.includes('function clearQrSessionTimers()'),
    'main.js must define clearQrSessionTimers() helper'
  );
  assert.ok(
    mainCode.includes('CatalogFilter.extractHardwareSpecs'),
    'main.js openProductDetailModal should reuse CatalogFilter.extractHardwareSpecs'
  );
});

