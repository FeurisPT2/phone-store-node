const ProductModel = require('../models/Product');

exports.getCart = (req, res) => {
  const cart = req.session.cart || [];
  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  res.json({ success: true, cart, total });
};

exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const product = await ProductModel.getById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });

    if (!req.session.cart) req.session.cart = [];
    const item = req.session.cart.find((i) => String(i.id) === String(productId));
    const addQty = Math.max(1, parseInt(quantity) || 1);
    if (item) {
      item.quantity += addQty;
    } else {
      req.session.cart.push({ ...product, quantity: addQty });
    }

    const total = req.session.cart.reduce((s, i) => s + i.price * i.quantity, 0);
    res.json({ success: true, cart: req.session.cart, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateCartItem = (req, res) => {
  const { productId, quantity } = req.body;
  if (!req.session.cart) req.session.cart = [];
  const qty = parseInt(quantity);
  if (qty <= 0) {
    req.session.cart = req.session.cart.filter((i) => String(i.id) !== String(productId));
  } else {
    const item = req.session.cart.find((i) => String(i.id) === String(productId));
    if (item) item.quantity = qty;
  }
  const total = req.session.cart.reduce((s, i) => s + i.price * i.quantity, 0);
  res.json({ success: true, cart: req.session.cart, total });
};

exports.removeFromCart = (req, res) => {
  const { productId } = req.body;
  if (!req.session.cart) req.session.cart = [];
  req.session.cart = req.session.cart.filter((i) => String(i.id) !== String(productId));
  const total = req.session.cart.reduce((s, i) => s + i.price * i.quantity, 0);
  res.json({ success: true, cart: req.session.cart, total });
};

exports.clearCart = (req, res) => {
  req.session.cart = [];
  res.json({ success: true, cart: [], total: 0 });
};
