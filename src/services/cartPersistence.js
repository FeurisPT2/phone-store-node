const ProductModel = require('../models/Product');

const CART_COOKIE_NAME = 'gearhub_cart';
const CART_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

function readCartCookie(req) {
  const value = req.signedCookies?.[CART_COOKIE_NAME];
  if (typeof value !== 'string') return null;

  try {
    const entries = JSON.parse(value);
    if (!Array.isArray(entries)) return null;

    return entries
      .filter((entry) => (
        Array.isArray(entry) &&
        typeof entry[0] === 'string' &&
        entry[0].length > 0 &&
        Number.isSafeInteger(entry[1]) &&
        entry[1] > 0
      ))
      .map(([productId, quantity]) => ({ productId, quantity }));
  } catch {
    return null;
  }
}

async function loadCart(req) {
  if (!req.session) throw new Error('Phiên giỏ hàng không khả dụng');

  const cookieItems = readCartCookie(req);
  if (cookieItems !== null) {
    const items = await Promise.all(cookieItems.map(async ({ productId, quantity }) => {
      const product = await ProductModel.getById(productId);
      return product ? { ...product, quantity } : null;
    }));
    req.session.cart = items.filter(Boolean);
  }

  if (!Array.isArray(req.session.cart)) req.session.cart = [];
  return req.session.cart;
}

function saveCartCookie(req, res, cart) {
  const entries = (Array.isArray(cart) ? cart : [])
    .filter((item) => item && item.id)
    .map((item) => [String(item.id), Math.max(1, Number.parseInt(item.quantity, 10) || 1)]);

  res.cookie(CART_COOKIE_NAME, JSON.stringify(entries), {
    signed: true,
    httpOnly: true,
    sameSite: 'lax',
    secure: Boolean(req.secure),
    path: '/',
    maxAge: CART_COOKIE_MAX_AGE
  });
}

module.exports = {
  loadCart,
  saveCartCookie
};
