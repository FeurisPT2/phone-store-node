const ProductModel = require('../models/Product');
const geminiService = require('../services/geminiService');

const chatController = {
  async handleChat(req, res) {
    try {
      const { message, history } = req.body;
      if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập tin nhắn.'
        });
      }

      // Lấy danh mục sản phẩm hiện có để Grounding
      const products = await ProductModel.getAll();

      // Gọi service tư vấn
      const result = await geminiService.consultCustomer({
        message: message.trim(),
        history,
        catalog: products
      });

      // Map suggestedProductIds sang đối tượng sản phẩm đầy đủ
      const suggestedProducts = (result.suggestedProductIds || [])
        .map(id => products.find(p => p.id === id || String(p.id) === String(id)))
        .filter(Boolean);

      return res.json({
        success: true,
        reply: result.reply,
        suggestedProducts
      });
    } catch (err) {
      console.error('Lỗi xử lý chat tư vấn, kích hoạt fallback an toàn:', err.message);
      try {
        const fallbackProducts = await ProductModel.getAll();
        const fallbackResult = geminiService.fallbackConsult({
          message: req.body?.message || '',
          catalog: fallbackProducts
        });
        const suggestedProducts = (fallbackResult.suggestedProductIds || [])
          .map(id => fallbackProducts.find(p => p.id === id || String(p.id) === String(id)))
          .filter(Boolean);

        return res.status(200).json({
          success: true,
          reply: fallbackResult.reply,
          suggestedProducts
        });
      } catch (innerErr) {
        return res.status(200).json({
          success: true,
          reply: 'Dạ hiện tại hệ thống tư vấn AI đang bận một chút, TechStore xin mời bạn tham khảo danh mục điện thoại trên website hoặc gửi lại tin nhắn nhé!',
          suggestedProducts: []
        });
      }
    }
  }
};

module.exports = chatController;
