const ProductModel = require('../models/Product');
const { loadCart, saveCartCookie } = require('../services/cartPersistence');

exports.getCart = async (req, res) => {
  try {
    const cart = await loadCart(req);
    saveCartCookie(req, res, cart);
    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    res.json({ success: true, cart, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const product = await ProductModel.getById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });

    const cart = await loadCart(req);
    const item = cart.find((i) => String(i.id) === String(productId));
    const addQty = Math.max(1, parseInt(quantity) || 1);
    if (item) {
      item.quantity += addQty;
    } else {
      cart.push({ ...product, quantity: addQty });
    }

    saveCartCookie(req, res, cart);
    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    res.json({ success: true, cart, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const cart = await loadCart(req);
    const qty = parseInt(quantity);
    if (qty <= 0) {
      req.session.cart = cart.filter((i) => String(i.id) !== String(productId));
    } else {
      const item = cart.find((i) => String(i.id) === String(productId));
      if (item) item.quantity = qty;
    }

    saveCartCookie(req, res, req.session.cart);
    const total = req.session.cart.reduce((s, i) => s + i.price * i.quantity, 0);
    res.json({ success: true, cart: req.session.cart, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const cart = await loadCart(req);
    req.session.cart = cart.filter((i) => String(i.id) !== String(productId));
    saveCartCookie(req, res, req.session.cart);
    const total = req.session.cart.reduce((s, i) => s + i.price * i.quantity, 0);
    res.json({ success: true, cart: req.session.cart, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.clearCart = (req, res) => {
  req.session.cart = [];
  saveCartCookie(req, res, req.session.cart);
  res.json({ success: true, cart: [], total: 0 });
};
