process.env.NODE_ENV = 'test';
const { test, describe, after } = require('node:test');
const assert = require('node:assert/strict');
const CrawlerService = require('../src/services/crawlerService');
const ProductModel = require('../src/models/Product');

describe('Crawler Auto-Enrichment Seam', () => {
  const createdProductIds = [];

  after(async () => {
    for (const id of createdProductIds) {
      await ProductModel.delete(id);
    }
  });

  test('crawlFromTiki automatically enriches newly crawled products with detailedSpecs and aiReview', async () => {
    const origFetch = global.fetch;
    const testTikiName = 'Điện Thoại iPhone 15 Pro 128GB Titan Tự Nhiên AutoEnrichTest';

    global.fetch = async (url) => {
      if (url.includes('tiki.vn')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: [
              {
                id: 999888777,
                name: testTikiName,
                brand_name: 'Apple',
                price: 25990000,
                original_price: 28990000,
                thumbnail_url: 'https://vcdn.tikicdn.com/cache/280x280/test.jpg'
              }
            ]
          })
        };
      }
      return origFetch(url);
    };

    try {
      const result = await CrawlerService.crawlFromTiki({
        brand: 'Apple',
        limit: 1,
        skipExisting: false
      });

      assert.equal(result.success, true);
      assert.ok(result.savedCount >= 1, 'Should have saved at least 1 product');

      const saved = result.products[0];
      createdProductIds.push(saved.id);

      // Kiểm tra sản phẩm được lưu có đầy đủ trường AI theo yêu cầu Spec
      assert.ok(saved.detailedSpecs, 'Product must have detailedSpecs');
      assert.equal(saved.detailedSpecs.chip, 'Apple A17 Pro');
      assert.ok(saved.aiReview, 'Product must have aiReview');
      assert.ok(Array.isArray(saved.aiReview.pros), 'aiReview must contain pros');
      assert.ok(saved.aiEnrichedAt, 'Product must have aiEnrichedAt timestamp');
    } finally {
      global.fetch = origFetch;
    }
  });

  test('crawlFromDummyJson automatically enriches newly crawled products and shares spec extraction', async () => {
    const origFetch = global.fetch;
    const dummyTitle = 'Samsung Galaxy S24 Ultra 5G DummyEnrichTest';

    global.fetch = async (url) => {
      if (url.includes('dummyjson.com')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            products: [
              {
                id: 777111,
                title: dummyTitle,
                brand: 'Samsung',
                price: 1199,
                description: '6.8 inch Dynamic AMOLED 2X 120Hz | Snapdragon 8 Gen 3 | 12GB/512GB | Pin 5000mAh | Camera 200MP',
                thumbnail: 'https://cdn.dummyjson.com/s24ultra.jpg'
              }
            ]
          })
        };
      }
      return origFetch(url);
    };

    try {
      const result = await CrawlerService.crawlFromDummyJson({
        limit: 1,
        skipExisting: false
      });

      assert.equal(result.success, true);
      assert.equal(result.savedCount, 1);

      const saved = result.products[0];
      createdProductIds.push(saved.id);

      assert.ok(saved.detailedSpecs, 'DummyJSON product must have detailedSpecs');
      assert.equal(saved.detailedSpecs.chip, 'Snapdragon 8 Gen 3');
      assert.equal(saved.detailedSpecs.ram, '12GB');
      assert.equal(saved.detailedSpecs.storage, '512GB');
      assert.ok(saved.aiReview, 'DummyJSON product must have aiReview');
      assert.ok(saved.aiEnrichedAt, 'DummyJSON product must have aiEnrichedAt');

      const genSpecs = CrawlerService.generateSpecs('Vivo X100 Pro 5G 16GB/512GB', 'Dimensity 9300 | Pin 5400mAh', 'Vivo');
      assert.ok(genSpecs.includes('Dimensity 9300'));
      assert.ok(genSpecs.includes('16GB/512GB'));
    } finally {
      global.fetch = origFetch;
    }
  });
});

