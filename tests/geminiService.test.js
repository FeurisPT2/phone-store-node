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
