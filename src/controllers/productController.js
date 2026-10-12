const ProductModel = require('../models/Product');

exports.getProducts = async (req, res) => {
  try {
    const list = await ProductModel.getAll(req.query.brand);
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
