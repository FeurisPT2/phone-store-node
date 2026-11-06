process.env.NODE_ENV = 'test';
const { test, describe, after } = require('node:test');
const assert = require('node:assert/strict');
const CrawlerService = require('../src/services/crawlerService');
const ProductModel = require('../src/models/Product');

describe('Crawler Auto-Enrichment Seam', () => {
  let createdProductId;

  after(async () => {
    if (createdProductId) {
      await ProductModel.delete(createdProductId);
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
      createdProductId = saved.id;

      // Kiểm tra sản phẩm được lưu có đầy đủ trường AI theo yêu cầu Spec
      assert.ok(saved.detailedSpecs, 'Product must have detailedSpecs');
      assert.ok(saved.detailedSpecs.chip, 'detailedSpecs must contain chip');
      assert.ok(saved.aiReview, 'Product must have aiReview');
      assert.ok(Array.isArray(saved.aiReview.pros), 'aiReview must contain pros');
      assert.ok(saved.aiEnrichedAt, 'Product must have aiEnrichedAt timestamp');
    } finally {
      global.fetch = origFetch;
    }
  });
});
