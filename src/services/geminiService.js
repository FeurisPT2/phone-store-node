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

function fallbackEnrich({ name, brand, rawText = '' }) {
  const combined = `${name} ${rawText}`;
  
  // Màn hình
  let screen = 'Màn hình sắc nét 120Hz';
  const mScreen = combined.match(/(\d+(\.\d+)?)\s*(inch|\")/i);
  if (mScreen) screen = `${mScreen[1]} inch Super AMOLED 120Hz`;

  // RAM & ROM
  let ram = '8GB';
  let storage = '128GB';
  const mRamRom = combined.match(/(\d+GB)\s*(\/|\+)\s*(\d+GB|\d+TB)/i);
  if (mRamRom) {
    ram = mRamRom[1];
    storage = mRamRom[3];
  } else {
    const mRom = combined.match(/(\d+GB|\d+TB)/i);
    if (mRom) storage = mRom[1];
  }

  // Pin & Camera
  let battery = '5000mAh';
  const mPin = combined.match(/pin\s*(\d+mAh)/i);
  if (mPin) battery = mPin[1];

  let camera = '50MP AI';
  const mCam = combined.match(/camera\s*(\d+MP)/i);
  if (mCam) camera = mCam[1];

  let chip = brand === 'Apple' ? 'Apple A-Series Bionic' : 'Snapdragon / Dimensity';
  let os = brand === 'Apple' ? 'iOS' : 'Android';

  return {
    detailedSpecs: {
      screen,
      chip,
      ram,
      storage,
      battery,
      camera,
      charging: 'Sạc nhanh công suất cao',
      os
    },
    aiReview: {
      summary: `${name} là mẫu điện thoại chính hãng chất lượng cao từ ${brand || 'thương hiệu uy tín'}.`,
      pros: [
        `Thiết kế hiện đại, hoàn thiện tỉ mỉ từ ${brand}`,
        `Cấu hình ổn định với dung lượng ${storage}`
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
async function enrichProduct({ name, brand, rawText = '', client = null }) {
  const aiClient = getClient(client);

  if (!aiClient) {
    return fallbackEnrich({ name, brand, rawText });
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
    return fallbackEnrich({ name, brand, rawText });
  } catch (err) {
    console.error('Lỗi gọi Gemini enrichProduct, kích hoạt fallback:', err.message);
    return fallbackEnrich({ name, brand, rawText });
  }
}

/**
 * Fallback tư vấn khi chưa cấu hình Gemini API hoặc có lỗi mạng
 */
function fallbackConsult({ message = '', catalog = [] }) {
  const msg = message.toLowerCase();
  let matches = [...catalog];

  // Lọc thương hiệu nếu có nhắc đến
  if (msg.includes('apple') || msg.includes('iphone')) {
    matches = matches.filter(p => (p.brand && p.brand.toLowerCase() === 'apple') || p.name.toLowerCase().includes('iphone'));
  } else if (msg.includes('samsung') || msg.includes('galaxy')) {
    matches = matches.filter(p => (p.brand && p.brand.toLowerCase() === 'samsung') || p.name.toLowerCase().includes('samsung'));
  } else if (msg.includes('xiaomi') || msg.includes('redmi')) {
    matches = matches.filter(p => (p.brand && p.brand.toLowerCase() === 'xiaomi') || p.name.toLowerCase().includes('xiaomi'));
  } else if (msg.includes('oppo')) {
    matches = matches.filter(p => (p.brand && p.brand.toLowerCase() === 'oppo') || p.name.toLowerCase().includes('oppo'));
  }

  // Lọc ngân sách nếu có (ví dụ: "dưới 10 triệu", "dưới 15tr")
  const mBudget = msg.match(/dưới\s*(\d+)\s*(triệu|tr|m)?/i);
  if (mBudget) {
    const maxMil = parseInt(mBudget[1], 10);
    if (!isNaN(maxMil)) {
      const budgetMax = maxMil * 1000000;
      const budgetMatches = matches.filter(p => Number(p.price) <= budgetMax);
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
  const suggestedProductIds = selected.map(p => p.id);

  let reply = 'Dạ chào bạn! Hệ thống TechStore xin gợi ý các dòng máy nổi bật phù hợp với nhu cầu của bạn:\n';
  selected.forEach(p => {
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
async function consultCustomer({ message, history = [], catalog = [], client = null }) {
  const aiClient = getClient(client);

  if (!aiClient) {
    return fallbackConsult({ message, catalog });
  }

  // Định dạng Catalog Grounding súc tích
  const catalogContext = catalog.slice(0, 40).map(p => {
    const priceStr = Number(p.price).toLocaleString('vi-VN');
    const specStr = p.detailedSpecs 
      ? `Chip: ${p.detailedSpecs.chip || ''}, RAM: ${p.detailedSpecs.ram || ''}, Bộ nhớ: ${p.detailedSpecs.storage || ''}, Pin: ${p.detailedSpecs.battery || ''}`
      : (p.description || '');
    return `[ID: ${p.id}] Tên: ${p.name} | Hãng: ${p.brand || 'Khác'} | Giá: ${priceStr}đ | Thông số: ${specStr}`;
  }).join('\n');

    let historyContext = '';
  if (Array.isArray(history) && history.length > 0) {
    historyContext = `\nLỊCH SỬ TRÒ CHUYỆN TRƯỚC ĐÓ:\n` + history.map(h => {
      const roleName = h.role === 'user' ? 'Khách hàng' : 'Trợ lý TechStore';
      return `- ${roleName}: ${h.content}`;
    }).join('\n') + '\n';
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
    return fallbackConsult({ message, catalog });
  } catch (err) {
    console.error('Lỗi gọi Gemini consultCustomer, kích hoạt fallback:', err.message);
    return fallbackConsult({ message, catalog });
  }
}

module.exports = {
  enrichProduct,
  fallbackEnrich,
  consultCustomer,
  fallbackConsult
};
