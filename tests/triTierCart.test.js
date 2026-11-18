process.env.NODE_ENV = 'test';
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const CartLogic = require('../src/public/js/cart');

describe('Seam 2: Tri-Tier Cart Partition, Subtotal & Zero-Deposit Policy', () => {
  test('CartLogic exports partitionCartTiers as a public callable seam', () => {
    assert.equal(typeof CartLogic.partitionCartTiers, 'function');
  });

  test('Empty cart returns empty partitions and 0 for all tier subtotals and grandTotal', () => {
    const res = CartLogic.partitionCartTiers([]);
    assert.deepEqual(res.serviceItems, []);
    assert.deepEqual(res.rentalItems, []);
    assert.deepEqual(res.retailItems, []);
    assert.equal(res.serviceSubtotal, 0);
    assert.equal(res.rentalSubtotal, 0);
    assert.equal(res.retailSubtotal, 0);
    assert.equal(res.depositTotal, 0);
    assert.equal(res.grandTotal, 0);
  });

  test('Partitions mixed cart items into 3 separate tiers with accurate subtotals and 0đ student deposit', () => {
    const sampleCart = [
      { id: 'gearhub_clean_cool', name: 'Spa Laptop Tiêu Chuẩn', price: 79000, quantity: 1, category: 'service' },
      { id: 'gearhub_thermal_boost', name: 'Đại Tu Tản Nhiệt Pro', price: 139000, quantity: 2, category: 'service' },
      { id: 'gearhub_rent_ek75', name: 'Thuê Phím Cơ EK75 Pro', price: 25000, quantity: 3, category: 'rental' },
      { id: 'gearhub_rent_mouse', name: 'Thuê Chuột Silent', price: 15000, quantity: 1, category: 'rental' },
      { id: 'gearhub_kit_clean', name: 'Kit Vệ Sinh 7-in-1', price: 55000, quantity: 2, category: 'accessory' }
    ];

    const result = CartLogic.partitionCartTiers(sampleCart);

    // 1. Tiers count check
    assert.equal(result.serviceItems.length, 2, 'Should have 2 service items');
    assert.equal(result.rentalItems.length, 2, 'Should have 2 rental items');
    assert.equal(result.retailItems.length, 1, 'Should have 1 retail accessory');

    // 2. Subtotals calculation
    assert.equal(result.serviceSubtotal, 79000 * 1 + 139000 * 2, 'Service subtotal matches');
    assert.equal(result.rentalSubtotal, 25000 * 3 + 15000 * 1, 'Rental subtotal matches');
    assert.equal(result.retailSubtotal, 55000 * 2, 'Retail accessory subtotal matches');

    // 3. Deposit policy & Grand total
    assert.equal(result.depositTotal, 0, 'Deposit must be 0đ per student ID policy');
    assert.equal(result.grandTotal, 357000 + 90000 + 110000, 'Grand total equals sum of all tier subtotals');
  });

  test('Heuristic fallback accurately classifies items when explicit category is omitted', () => {
    const itemsWithoutCategory = [
      { id: 'gearhub_keycare', name: 'Gói Mod KeyCare', price: 69000, quantity: 1 },
      { id: 'gearhub_speedup_os', name: 'SpeedUp OS', price: 49000, quantity: 1 },
      { id: 'gearhub_rent_hub_slide', name: 'Thuê Hub Type-C', price: 20000, quantity: 2 },
      { id: 'custom_usb_cable', name: 'Cáp Type-C Braided', price: 45000, quantity: 1 }
    ];

    const result = CartLogic.partitionCartTiers(itemsWithoutCategory);

    assert.equal(result.serviceItems.length, 2);
    assert.equal(result.rentalItems.length, 1);
    assert.equal(result.retailItems.length, 1);
    assert.equal(result.serviceSubtotal, 69000 + 49000);
    assert.equal(result.rentalSubtotal, 40000);
    assert.equal(result.retailSubtotal, 45000);
    assert.equal(result.grandTotal, 203000);
  });

  test('renderCartDropdownFlyout generates empty flyout when cart is empty', () => {
    const mockFlyout = { innerHTML: '' };
    global.document = {
      getElementById: (id) => (id === 'cart-dropdown-flyout' ? mockFlyout : null)
    };
    CartLogic.renderCartDropdownFlyout([], 0);
    assert.match(mockFlyout.innerHTML, /Chưa có dịch vụ hoặc thiết bị trong giỏ/);
    assert.match(mockFlyout.innerHTML, /Khám Phá Cửa Hàng/);
    delete global.document;
  });

  test('renderCartDropdownFlyout populates items, tier badges, and checkout link when cart has items', () => {
    const mockFlyout = { innerHTML: '' };
    global.document = {
      getElementById: (id) => (id === 'cart-dropdown-flyout' ? mockFlyout : null)
    };
    const sampleCart = [
      { id: 'gearhub_clean_cool', name: 'Spa Laptop Tiêu Chuẩn', price: 79000, quantity: 1, category: 'service' },
      { id: 'gearhub_rent_ek75', name: 'Thuê Phím Cơ EK75 Pro', price: 25000, quantity: 2, category: 'rental' }
    ];
    CartLogic.renderCartDropdownFlyout(sampleCart, 129000);
    assert.match(mockFlyout.innerHTML, /Spa Laptop Tiêu Chuẩn/);
    assert.match(mockFlyout.innerHTML, /Thuê Phím Cơ EK75 Pro/);
    assert.match(mockFlyout.innerHTML, /Dịch vụ/);
    assert.match(mockFlyout.innerHTML, /Thuê gear/);
    assert.match(mockFlyout.innerHTML, /href="\/cart"/);
    assert.match(mockFlyout.innerHTML, /Xem Giỏ Hàng &amp; Đặt Lịch/);
    delete global.document;
  });

  test('renderCartPage generates tri-tier breakdown and pre-fills totals', () => {
    const elements = {
      'cart-page-items': { innerHTML: '' },
      'cart-page-count': { innerText: '' },
      'btn-order-submit': { disabled: false, innerText: '', style: {} },
      'cart-bottom-actions': { style: {} },
      'summary-subtotal': { innerText: '' },
      'cart-grand-total': { innerText: '' },
      'qr-amount': { innerText: '' },
      'order-form': { addEventListener: () => {} }
    };
    global.document = {
      getElementById: (id) => elements[id] || null,
      querySelectorAll: () => []
    };
    const sampleCart = [
      { id: 'gearhub_clean_cool', name: 'Spa Laptop Tiêu Chuẩn', price: 79000, quantity: 1, category: 'service' },
      { id: 'gearhub_rent_ek75', name: 'Thuê Phím Cơ EK75 Pro', price: 25000, quantity: 1, category: 'rental' }
    ];
    CartLogic.renderCartPage(sampleCart, 104000);
    assert.match(elements['cart-page-items'].innerHTML, /Lịch Hẹn Dịch Vụ Vệ Sinh/);
    assert.match(elements['cart-page-items'].innerHTML, /Thiết Bị Cho Thuê/);
    assert.equal(elements['cart-page-count'].innerText, '2 mục');
    assert.equal(elements['cart-grand-total'].innerText, '104.000 ₫');
    delete global.document;
  });
});
