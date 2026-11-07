const geminiService = require('../services/geminiService');

const chatController = {
  async handleChat(req, res) {
    const { message, history } = req.body || {};
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập tin nhắn.'
      });
    }

    const result = await geminiService.consultWithCatalog(message.trim(), history);
    return res.status(200).json({
      success: true,
      reply: result.reply,
      suggestedProducts: result.suggestedProducts
    });
  }
};

module.exports = chatController;

