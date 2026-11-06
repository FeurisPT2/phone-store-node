const { test } = require('node:test');
const assert = require('node:assert/strict');
const ProductModel = require('../src/models/Product');

test('ProductModel supports detailedSpecs and aiReview', async () => {
  const newProd = await ProductModel.create({
    name: 'Test Phone AI Edition',
    brand: 'TestBrand',
    price: 15000000,
    specs: 'Màn hình 6.7 inch',
    detailedSpecs: {
      screen: '6.7 inch AMOLED',
      chip: 'Snapdragon 8 Gen 3',
      battery: '5000mAh'
    },
    aiReview: {
      summary: 'Máy test AI',
      pros: ['Pin trâu', 'Màn đẹp'],
      cons: ['Hơi nặng'],
      targetAudience: 'Người thử nghiệm'
    },
    aiEnrichedAt: new Date().toISOString()
  });

  assert.ok(newProd.id);
  const fetched = await ProductModel.getById(newProd.id);
  assert.equal(fetched.name, 'Test Phone AI Edition');
  assert.ok(fetched.detailedSpecs);
  assert.equal(fetched.detailedSpecs.chip, 'Snapdragon 8 Gen 3');
  assert.ok(fetched.aiReview);
  assert.equal(fetched.aiReview.pros.length, 2);
  assert.ok(fetched.aiEnrichedAt);

  // Dọn dẹp
  await ProductModel.delete(newProd.id);
});

test('ProductModel.getUnenriched finds products without aiEnrichedAt', async () => {
  const prod = await ProductModel.create({
    name: 'Old Unenriched Phone',
    brand: 'OldBrand',
    price: 9000000
  });

  const unenriched = await ProductModel.getUnenriched(200);
  assert.ok(Array.isArray(unenriched));
  const found = unenriched.find(p => p.id === prod.id);
  assert.ok(found, 'Should find the newly created unenriched phone');

  await ProductModel.delete(prod.id);
});
