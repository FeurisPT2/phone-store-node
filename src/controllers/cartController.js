const ProductModel = require('../models/Product');
exports.getCart = (req, res) => {
  const cart = req.session.cart || [];
  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  res.json({ success: true, cart, total });
};
exports.addToCart = (req, res) => {
  const { productId } = req.body;
  const product = ProductModel.getById(productId);
  if (!product) return res.status(404).json({ success: false });
  if (!req.session.cart) req.session.cart = [];
  const item = req.session.cart.find(i => i.id === productId);
  if (item) item.quantity += 1; else req.session.cart.push({ ...product, quantity: 1 });
  res.json({ success: true, cart: req.session.cart });
};
