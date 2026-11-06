process.env.NODE_ENV = 'test';
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const geminiService = require('../src/services/geminiService');

describe('Consultant Multi-Turn Context Seam', () => {
  test('consultCustomer incorporates conversation history into prompt context', async () => {
    let capturedPrompt = '';

    const mockClient = {
      models: {
        generateContent: async ({ contents }) => {
          capturedPrompt = contents;
          return {
            text: JSON.stringify({
              reply: 'Dạ Sony Xperia 1 VI có giá 31.990.000đ và đang có sẵn hàng tại TechStore ạ.',
              suggestedProductIds: [6]
            })
          };
        }
      }
    };

    const mockCatalog = [
      { id: 6, name: 'Sony Xperia 1 VI 5G 256GB', brand: 'Sony', price: 31990000 }
    ];

    const history = [
      { role: 'user', content: 'Tôi thích thương hiệu Sony' },
      { role: 'model', content: 'Dạ Sony Xperia 1 VI là flagship hàng đầu của Sony năm nay.' }
    ];

    const result = await geminiService.consultCustomer({
      message: 'Máy đó giá bao nhiêu và có sẵn hàng không?',
      history,
      catalog: mockCatalog,
      client: mockClient
    });

    assert.ok(result.reply.includes('Sony Xperia 1 VI'));
    assert.ok(
      capturedPrompt.includes('Tôi thích thương hiệu Sony'),
      'Prompt must incorporate previous user turn from history'
    );
    assert.ok(
      capturedPrompt.includes('flagship hàng đầu'),
      'Prompt must incorporate previous assistant turn from history'
    );
  });
});
