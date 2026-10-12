const ProductModel = require('../models/Product');
exports.getProducts = (req, res) => res.json({ success: true, data: ProductModel.getAll(req.query.brand) });
