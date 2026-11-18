const CatalogFilter = require('../public/js/catalogFilter');
const ProductModel = require('../models/Product');

let GoogleGenAI = null;
try {
  const genaiModule = require('@google/genai');
  GoogleGenAI = genaiModule.GoogleGenAI;
} catch (e) {
  GoogleGenAI = null;
}

function getClient(injectedClient) {
  if (injectedClient) return injectedClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !GoogleGenAI) return null;
  return new GoogleGenAI({ apiKey });
}

function normalizeEnrichArgs(nameOrObj, brandArg = '', rawTextArg = '', customClient = null) {
  if (nameOrObj && typeof nameOrObj === 'object') {
    return {
      name: String(nameOrObj.name || ''),
      brand: String(nameOrObj.brand || ''),
      rawText: String(nameOrObj.rawText || nameOrObj.specs || nameOrObj.description || ''),
      client: customClient || nameOrObj.client || null
    };
  }
  return {
    name: String(nameOrObj || ''),
    brand: String(brandArg || ''),
    rawText: String(rawTextArg || ''),
    client: customClient || null
  };
}

function fallbackEnrich(nameOrObj, brandArg = '', rawTextArg = '') {
  const { name, brand, rawText } = normalizeEnrichArgs(nameOrObj, brandArg, rawTextArg);
  const detailedSpecs = CatalogFilter.extractHardwareSpecs({ name, brand, rawText });

  return {
    detailedSpecs,
    aiReview: {
      summary: `${name} là mẫu điện thoại chính hãng chất lượng cao từ ${brand || 'thương hiệu uy tín'}, trang bị vi xử lý ${detailedSpecs.chip}.`,
      pros: [
        `Thiết kế hiện đại, hoàn thiện tỉ mỉ từ ${brand || 'nhà sản xuất'}`,
        `Hiệu năng mượt mà với ${detailedSpecs.chip} và bộ nhớ ${detailedSpecs.ram}/${detailedSpecs.storage}`
      ],
      cons: [
        'Cần bảo quản cẩn thận hoặc dùng thêm ốp lưng chống sốc'
      ],
      targetAudience: 'Người dùng tìm kiếm smartphone chính hãng, đáp ứng tốt công việc và giải trí hàng ngày'
    }
  };
}

/**
 * Làm giàu dữ liệu sản phẩm với Gemini Structured Output
 */
async function enrichProduct(productData = {}, customClient = null) {
  const { name, brand, rawText, client } = normalizeEnrichArgs(productData, '', '', customClient);
  const aiClient = getClient(client);

  if (!aiClient) {
    return geminiService.fallbackEnrich({ name, brand, rawText });
  }

  const prompt = `
Bạn là chuyên gia phân tích điện thoại thông minh hàng đầu.
Hãy bóc tách thông số và viết bài đánh giá chuyên sâu cho điện thoại sau:
Tên máy: ${name}
Thương hiệu: ${brand}
Thông tin bổ sung: ${rawText}

Hãy trả về DUY NHẤT một chuỗi JSON hợp lệ (không markdown block) theo cấu trúc chính xác sau:
{
  "detailedSpecs": {
    "screen": "thông số màn hình ngắn gọn (kích thước, tấm nền, tần số quét)",
    "chip": "tên vi xử lý / CPU",
    "ram": "dung lượng RAM",
    "storage": "dung lượng bộ nhớ trong",
    "battery": "dung lượng pin",
    "camera": "thông số camera chính và phụ",
    "charging": "công nghệ và công suất sạc",
    "os": "hệ điều hành"
  },
  "aiReview": {
    "summary": "1-2 câu tóm tắt giá trị cốt lõi của máy",
    "pros": ["ưu điểm nổi bật 1", "ưu điểm nổi bật 2", "ưu điểm 3"],
    "cons": ["nhược điểm hoặc điểm cần lưu ý 1", "nhược điểm 2"],
    "targetAudience": "Đối tượng người dùng phù hợp nhất"
  }
}
`;

  try {
    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text || (typeof response === 'string' ? response : '');
    const parsed = JSON.parse(text);
    if (parsed.detailedSpecs && parsed.aiReview) {
      return parsed;
    }
    return geminiService.fallbackEnrich({ name, brand, rawText });
  } catch (err) {
    console.error('Lỗi gọi Gemini enrichProduct, kích hoạt fallback:', err.message);
    return geminiService.fallbackEnrich({ name, brand, rawText });
  }
}

/**
 * Làm giàu sản phẩm và lưu trực tiếp vào ProductModel
 */
async function enrichAndPersistProduct(productOrId, customClient = null) {
  if (!productOrId) return null;

  let product = null;
  if (typeof productOrId === 'object') {
    if (productOrId.name) {
      product = productOrId;
    } else if (productOrId.id) {
      product = await ProductModel.getById(productOrId.id);
    }
  } else {
    product = await ProductModel.getById(productOrId);
  }

  if (!product) return null;

  const client = customClient || (typeof productOrId === 'object' ? productOrId.client : null) || null;
  const enrichment = await geminiService.enrichProduct(
    {
      name: product.name,
      brand: product.brand,
      rawText: product.specs || product.description || product.rawText || '',
      client
    },
    client
  );

  const aiEnrichedAt = new Date().toISOString();
  if (product.id) {
    const updated = await ProductModel.update(product.id, {
      detailedSpecs: enrichment.detailedSpecs,
      aiReview: enrichment.aiReview,
      aiEnrichedAt
    });
    return updated || null;
  }

  return {
    ...product,
    detailedSpecs: enrichment.detailedSpecs,
    aiReview: enrichment.aiReview,
    aiEnrichedAt
  };
}

/**
 * Tự vá và chuẩn hóa hàng loạt sản phẩm chưa có dữ liệu AI trong kho
 */
async function selfHealCatalog(limitOrOpts = 10, customClient = null) {
  let limit = 10;
  let client = customClient;
  if (limitOrOpts && typeof limitOrOpts === 'object') {
    limit = parseInt(limitOrOpts.limit, 10) || 10;
    client = customClient || limitOrOpts.client || null;
  } else {
    limit = parseInt(limitOrOpts, 10) || 10;
  }

  const unenriched = await ProductModel.getUnenriched(limit);
  const updatedProducts = [];

  for (const product of unenriched) {
    try {
      const updated = await geminiService.enrichAndPersistProduct(product, client);
      if (updated) {
        updatedProducts.push(updated);
      }
    } catch (e) {
      console.error('Lỗi enrich cho sản phẩm ' + product.id + ':', e.message);
    }
  }

  return {
    totalFound: unenriched.length,
    enrichedCount: updatedProducts.length,
    updatedProducts
  };
}

/**
 * Fallback tư vấn khi chưa cấu hình Gemini API hoặc có lỗi mạng
 */
function fallbackConsult(arg1 = {}, catalogArg = []) {
  let message = '';
  let catalog = [];
  if (arg1 && typeof arg1 === 'object' && !Array.isArray(arg1)) {
    message = String(arg1.message || arg1.userQuery || '');
    catalog = Array.isArray(arg1.catalog) ? arg1.catalog : [];
  } else {
    message = String(arg1 || '');
    catalog = Array.isArray(catalogArg) ? catalogArg : [];
  }

  const msg = message.toLowerCase();
  let matches = [...catalog];

  // Lọc thương hiệu nếu có nhắc đến
  let detectedBrand = 'all';
  if (msg.includes('apple') || msg.includes('iphone')) {
    detectedBrand = 'Apple';
  } else if (msg.includes('samsung') || msg.includes('galaxy')) {
    detectedBrand = 'Samsung';
  } else if (msg.includes('xiaomi') || msg.includes('redmi')) {
    detectedBrand = 'Xiaomi';
  } else if (msg.includes('oppo')) {
    detectedBrand = 'OPPO';
  } else if (msg.includes('sony') || msg.includes('xperia')) {
    detectedBrand = 'Sony';
  } else if (msg.includes('asus') || msg.includes('rog')) {
    detectedBrand = 'ASUS';
  } else if (msg.includes('google') || msg.includes('pixel')) {
    detectedBrand = 'Google';
  }

  if (detectedBrand !== 'all') {
    const brandFiltered = CatalogFilter.filterProducts(matches, { brand: detectedBrand });
    if (brandFiltered.length > 0) {
      matches = brandFiltered;
    } else {
      matches = matches.filter((p) => String(p.name || '').toLowerCase().includes(detectedBrand.toLowerCase()));
    }
  }

  // Lọc RAM nếu có nhắc đến (ví dụ: "ram 16gb", "ram 12gb", "ram 8gb")
  const mRam = msg.match(/ram\s*(\d+\s*gb)/i);
  if (mRam) {
    const ramFiltered = CatalogFilter.filterProducts(matches, { ram: mRam[1] });
    if (ramFiltered.length > 0) {
      matches = ramFiltered;
    }
  }

  // Lọc ngân sách nếu có (ví dụ: "dưới 10 triệu", "dưới 15tr")
  const mBudget = msg.match(/dưới\s*(\d+)\s*(triệu|tr|m)?/i);
  if (mBudget) {
    const maxMil = parseInt(mBudget[1], 10);
    if (!isNaN(maxMil)) {
      const budgetMax = maxMil * 1000000;
      const budgetMatches = CatalogFilter.filterProducts(matches, { maxPrice: budgetMax });
      if (budgetMatches.length > 0) {
        matches = budgetMatches;
      }
    }
  }

  // Nếu lọc bị rỗng thì lấy lại danh sách catalog ban đầu
  if (matches.length === 0) {
    matches = [...catalog];
  }

  // Chọn tối đa 3 sản phẩm tiêu biểu
  const selected = matches.slice(0, 3);
  const suggestedProductIds = selected.map((p) => p.id);

  let reply = 'Dạ chào bạn! Hệ thống TechStore xin gợi ý các dòng máy nổi bật phù hợp với nhu cầu của bạn:\n';
  selected.forEach((p) => {
    const formattedPrice = Number(p.price).toLocaleString('vi-VN');
    reply += `- **${p.name}** (${formattedPrice}đ): Cấu hình mạnh mẽ, thiết kế cao cấp chính hãng.\n`;
  });
  reply += '\nBạn có thể nhấn vào sản phẩm bên dưới để xem chi tiết hoặc thêm vào giỏ hàng ngay nhé!';

  return {
    reply,
    suggestedProductIds
  };
}

/**
 * AI Shopping Consultant với Dynamic Catalog Grounding
 */
async function consultCustomer(arg1 = {}, catalogArg = [], historyArg = [], customClient = null) {
  let message = '';
  let history = [];
  let catalog = [];
  let client = customClient;

  if (arg1 && typeof arg1 === 'object' && !Array.isArray(arg1)) {
    message = String(arg1.message || arg1.userQuery || '');
    history = Array.isArray(arg1.history) ? arg1.history : [];
    catalog = Array.isArray(arg1.catalog) ? arg1.catalog : [];
    client = customClient || arg1.client || null;
  } else {
    message = String(arg1 || '');
    catalog = Array.isArray(catalogArg) ? catalogArg : [];
    history = Array.isArray(historyArg) ? historyArg : [];
    client = customClient;
  }

  const aiClient = getClient(client);

  if (!aiClient) {
    return geminiService.fallbackConsult({ message, catalog });
  }

  // Định dạng Catalog Grounding súc tích (ưu tiên detailedSpecs -> p.specs -> p.description)
  const catalogContext = catalog
    .slice(0, 40)
    .map((p) => {
      const priceStr = Number(p.price).toLocaleString('vi-VN');
      const specStr = p.detailedSpecs
        ? `Chip: ${p.detailedSpecs.chip || ''}, RAM: ${p.detailedSpecs.ram || ''}, Bộ nhớ: ${p.detailedSpecs.storage || ''}, Pin: ${p.detailedSpecs.battery || ''}`
        : p.specs || p.description || '';
      return `[ID: ${p.id}] Tên: ${p.name} | Hãng: ${p.brand || 'Khác'} | Giá: ${priceStr}đ | Thông số: ${specStr}`;
    })
    .join('\n');

  let historyContext = '';
  if (Array.isArray(history) && history.length > 0) {
    historyContext =
      `\nLỊCH SỬ TRÒ CHUYỆN TRƯỚC ĐÓ:\n` +
      history
        .map((h) => {
          const roleName = h.role === 'user' ? 'Khách hàng' : 'Trợ lý TechStore';
          return `- ${roleName}: ${h.content}`;
        })
        .join('\n') +
      '\n';
  }

  const prompt = `
Bạn là Trợ lý Tư vấn Mua sắm AI thông minh, nhiệt tình của hệ thống bán lẻ điện thoại TechStore.
Khách hàng đang tìm kiếm điện thoại và đặt câu hỏi cho bạn.

DANH SÁCH SẢN PHẨM HIỆN CÓ TẠI CỬA HÀNG (CATALOG GROUNDING):
${catalogContext}
${historyContext}
YÊU CẦU QUAN TRỌNG:
1. Trả lời bằng tiếng Việt lịch sự, thân thiện, súc tích và có chuyên môn cao.
2. CHỈ gợi ý các sản phẩm CÓ TRONG DANH SÁCH TRÊN phù hợp nhất với tầm giá và nhu cầu khách hàng (chụp ảnh, chơi game, pin trâu, thương hiệu, v.v.).
3. Điền các ID sản phẩm được gợi ý vào mảng 'suggestedProductIds' (tối đa 3 sản phẩm phù hợp nhất).
4. Định dạng phản hồi: DUY NHẤT một chuỗi JSON hợp lệ (không markdown block):
{
  "reply": "Nội dung phản hồi tư vấn thân thiện gửi khách hàng",
  "suggestedProductIds": [id1, id2]
}

Câu hỏi của khách hàng: "${message}"
`;

  try {
    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text || (typeof response === 'string' ? response : '');
    const parsed = JSON.parse(text);
    if (parsed.reply) {
      return {
        reply: parsed.reply,
        suggestedProductIds: Array.isArray(parsed.suggestedProductIds) ? parsed.suggestedProductIds : []
      };
    }
    return geminiService.fallbackConsult({ message, catalog });
  } catch (err) {
    console.error('Lỗi gọi Gemini consultCustomer, kích hoạt fallback:', err.message);
    return geminiService.fallbackConsult({ message, catalog });
  }
}

function toMiniProductCard(p) {
  if (!p) return null;
  return {
    id: p.id,
    name: p.name,
    brand: p.brand,
    price: p.price,
    oldPrice: p.oldPrice,
    image: p.image,
    specs: p.specs
  };
}

/**
 * Tư vấn trực tiếp trên toàn bộ kho hàng kèm cơ chế Graceful Fallback và ánh xạ Mini Product Card
 */
async function consultWithCatalog(messageOrOpts, history = [], customClient = null) {
  let message = '';
  let convHistory = Array.isArray(history) ? history : [];
  let client = customClient;

  if (messageOrOpts && typeof messageOrOpts === 'object' && !Array.isArray(messageOrOpts)) {
    message = String(messageOrOpts.message || messageOrOpts.userQuery || '').trim();
    convHistory = Array.isArray(messageOrOpts.history) ? messageOrOpts.history : [];
    client = customClient || messageOrOpts.client || null;
  } else {
    message = String(messageOrOpts || '').trim();
  }

  let products = [];
  try {
    products = await ProductModel.getAll('all');
  } catch (err) {
    console.error('Lỗi tải danh mục cho consultWithCatalog:', err.message);
    products = [];
  }

  const hydrateSuggested = (ids) =>
    (Array.isArray(ids) ? ids : [])
      .map((id) => products.find((p) => p.id === id || String(p.id) === String(id)))
      .filter(Boolean)
      .map(toMiniProductCard);

  try {
    const result = await geminiService.consultCustomer(
      {
        message,
        history: convHistory,
        catalog: products,
        client
      },
      products,
      convHistory,
      client
    );
    return {
      reply: result.reply,
      suggestedProducts: hydrateSuggested(result.suggestedProductIds)
    };
  } catch (err) {
    console.error('Lỗi xử lý chat tư vấn, kích hoạt fallback an toàn:', err.message);
    try {
      const fallbackResult = geminiService.fallbackConsult({
        message,
        catalog: products
      });
      return {
        reply: fallbackResult.reply,
        suggestedProducts: hydrateSuggested(fallbackResult.suggestedProductIds)
      };
    } catch (innerErr) {
      return {
        reply:
          'Dạ hiện tại hệ thống tư vấn AI đang bận một chút, TechStore xin mời bạn tham khảo danh mục điện thoại trên website hoặc gửi lại tin nhắn nhé!',
        suggestedProducts: []
      };
    }
  }
}

const geminiService = {
  enrichProduct,
  fallbackEnrich,
  enrichAndPersistProduct,
  selfHealCatalog,
  consultCustomer,
  fallbackConsult,
  consultWithCatalog
};

module.exports = geminiService;

