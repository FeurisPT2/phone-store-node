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

function formatVnd(amount) {
  return Number(amount || 0).toLocaleString('vi-VN') + '₫';
}

function summarizeProductLine(p) {
  const unitText = p.unit ? `/${p.unit}` : '';
  const summary = p.aiReview?.summary || p.description || p.specs || 'Sẵn sàng phục vụ tại Sảnh I ĐHKHTN.';
  return `- **${p.name}** (${formatVnd(p.price)}${unitText}): ${summary}`;
}

function findDirectProductMatch(msg, catalog) {
  if (!msg || !Array.isArray(catalog) || catalog.length === 0) return null;

  // Khớp tên trong ngoặc kép (VD nút "Hỏi Trợ lý AI" từ trang PDP)
  const quoted = msg.match(/"([^"]+)"/);
  const target = (quoted ? quoted[1] : msg).toLowerCase();

  let best = null;
  let bestScore = 0;
  for (const p of catalog) {
    const name = String(p.name || '').toLowerCase();
    const id = String(p.id || '').toLowerCase();
    if (!name) continue;
    if (target && (name === target || name.includes(target) || msg.includes(name))) {
      return p;
    }
    const tokens = name.split(/[\s()/-]+/).filter((t) => t.length >= 3);
    const hits = tokens.filter((t) => msg.includes(t) || id.includes(t)).length;
    const score = hits + (msg.includes('79k') && p.price === 79000 ? 4 : 0) + (msg.includes('139k') && p.price === 139000 ? 4 : 0);
    if (score >= 2 && score > bestScore) {
      bestScore = score;
      best = p;
    }
  }
  return best;
}

function buildDirectProductReply(p) {
  const pros = Array.isArray(p.aiReview?.pros) ? p.aiReview.pros.slice(0, 3) : [];
  const specsList = !pros.length && p.specs ? String(p.specs).split('|').map((s) => s.trim()).filter(Boolean).slice(0, 3) : [];
  const highlights = pros.length ? pros : specsList;
  const unitText = p.unit ? `/${p.unit}` : '';

  let reply = `Thông tin chi tiết về **${p.name}** (${formatVnd(p.price)}${unitText}):\n`;
  if (p.aiReview?.summary || p.description) {
    reply += `${p.aiReview?.summary || p.description}\n`;
  }
  if (highlights.length) {
    reply += highlights.map((h) => `- ${h}`).join('\n') + '\n';
  }
  if (p.category === 'rental') {
    reply += '\nThủ tục thuê **0đ tiền cọc** (chỉ cần Thẻ SV/MSSV tại Sảnh I). Bạn có thể bấm **Xem** hoặc **Mua** ở thẻ bên dưới để chọn ngày thuê (có gói 1 Tuần -28%).';
  } else if (p.category === 'service') {
    reply += `\nThực hiện **${p.duration || '30–45 phút'}** lấy liền trước mặt bạn tại Sảnh I ĐHKHTN, thanh toán **COD** sau khi test máy êm mượt.`;
  } else {
    reply += '\nCó sẵn tại quầy GearHub Sảnh I ĐHKHTN — kiểm tra trực tiếp và thanh toán COD khi nhận hàng.';
  }
  return { reply, suggestedProductIds: [p.id] };
}

function normalizePresetKey(text) {
  return String(text || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[?!.]+$/g, '')
    .trim();
}

const PRESET_QUICK_ANSWERS = [
  {
    id: 'preset_overheating',
    fallbackCategory: 'service',
    keys: [
      'laptop bị nóng và quạt kêu to khi gõ code',
      'laptop nóng quạt kêu to'
    ],
    productIds: ['gearhub_clean_cool', 'gearhub_thermal_boost'],
    reply:
      'Khi gõ code, chạy Docker/VS Code hoặc compile nặng mà máy nóng nhanh và quạt hú to, nguyên nhân thường là bụi bít khe tản gió hoặc lớp keo tản nhiệt đã khô.\n\n' +
      'GearHub Sảnh I gợi ý **2 gói xử lý lấy liền** phù hợp tình trạng máy:\n' +
      '- **Gói Spa Laptop Tiêu Chuẩn (Clean & Cool) — 79.000₫** (30 phút): thổi bụi buồng quạt, khe gió, vệ sinh phím/màn hình, giảm ngay **5–8°C**.\n' +
      '- **Gói Đại Tu Tản Nhiệt Pro (Thermal Boost) — 139.000₫** (45 phút): tháo vệ sinh toàn diện bên trong và tra lại keo gốm **Arctic MX-4 / MX-6**, hạ **10–15°C**, hết tụt xung.\n\n' +
      'Thực hiện trực tiếp trước mặt bạn trong **30–45 phút** tại **Sảnh I ĐHKHTN (07:30–17:30, T2–T7)**, test máy mát êm rồi mới **thanh toán COD** (bảo hành kiểm tra lại 7 ngày, keo 6 tháng).'
  },
  {
    id: 'preset_quiet_keyboard',
    fallbackCategory: 'rental',
    keys: [
      'tư vấn thuê bàn phím cơ gõ êm không ồn',
      'thuê phím cơ gõ êm ktx'
    ],
    productIds: ['gearhub_rent_ek75', 'gearhub_rent_mouse'],
    reply:
      'Để cày đồ án ban đêm trong phòng KTX hoặc thư viện mà không làm phiền mọi người, bạn nên chọn:\n' +
      '- **Thuê Bàn Phím Cơ 3 Mode (DAREU EK75 Pro / Flex 75) — 25.000₫/ngày** (hoặc **120.000₫/tuần** theo ưu đãi **Gói 1 Tuần -28%**): sử dụng switch linear đã pre-lube gõ cực êm (~**32dB**), kết nối 3 mode Bluetooth 5.1 / 2.4GHz / Type-C, layout 75% gọn có núm xoay, pin 3750mAh.\n' +
      '- Gợi ý ghép cặp: **Thuê Chuột Không Dây Công Thái Học (15.000₫/ngày)** để chống mỏi cổ tay khi làm việc liên tục.\n\n' +
      'Thủ tục **0đ tiền cọc** (chỉ cần xuất trình Thẻ Sinh Viên/VNeID tại Sảnh I), test phím êm tay tại chỗ rồi thanh toán **COD** nhé!'
  },
  {
    id: 'preset_clean_79k_steps',
    fallbackCategory: 'service',
    keys: [
      'combo vệ sinh 79k gồm những bước nào',
      'quy trình vệ sinh 79k'
    ],
    productIds: ['gearhub_clean_cool', 'gearhub_thermal_boost'],
    reply:
      '**Gói Spa Laptop Tiêu Chuẩn (Clean & Cool) — 79.000₫** hoàn thành lấy liền trong **30 phút** gồm **4 bước minh bạch** (bạn quan sát trực tiếp 100%):\n' +
      '1. **Kiểm tra đầu vào & đo nhiệt độ (5 phút):** Ghi nhận tình trạng quạt, pin, màn hình — tuyệt đối không can thiệp ổ cứng hay dữ liệu.\n' +
      '2. **Hút bụi & thổi sạch quạt tản nhiệt, khe gió (10 phút):** Dùng máy hút bụi mini, cọ quét mềm và khí nén làm sạch bụi kẹt.\n' +
      '3. **Vệ sinh kẽ bàn phím, chiếu nghỉ & lau màn hình (10 phút):** Lau bằng dung dịch chuyên dụng và khăn microfiber chống xước.\n' +
      '4. **Test lại độ ồn quạt & nhiệt độ (5 phút):** Kiểm tra máy hạ **5–8°C**, quạt êm hơn hẳn rồi mới **thanh toán COD** (hỗ trợ kiểm tra miễn phí trong **7 ngày**).\n\n' +
      '**Mẹo nhỏ:** Nếu máy đã hơn 1 năm chưa tra lại keo hoặc là laptop gaming/đồ họa chạy nặng, bạn nên chọn **Gói Đại Tu Tản Nhiệt Pro (139.000₫)** có tra keo **Arctic MX-4 / MX-6** nhé!'
  },
  {
    id: 'preset_student_rental_policy',
    fallbackCategory: 'rental',
    keys: [
      'thủ tục thuê gear bằng thẻ sinh viên như thế nào',
      'thủ tục thuê bằng thẻ sv'
    ],
    productIds: ['gearhub_rent_ek75', 'gearhub_rent_mouse', 'gearhub_rent_hub_slide'],
    reply:
      'Thủ tục thuê thiết bị tại GearHub áp dụng chính sách **0đ tiền cọc** cho sinh viên (chỉ cần **Thẻ Sinh Viên / MSSV** hoặc **VNeID** hợp lệ, đối chiếu nhanh trong 1 phút):\n' +
      '1. **Chọn thiết bị & gói thuê:** Thuê theo ngày hoặc chọn **Gói 1 Tuần (-28%: tính phí 5 ngày, miễn phí trọn 2 ngày cuối tuần)**.\n' +
      '2. **Đặt lịch online:** Chọn ca nhận máy để hệ thống cấp **Phiếu Hẹn Điện Tử (Mã QR Check-in)**.\n' +
      '3. **Nhận & test trực tiếp tại Sảnh I ĐHKHTN** (227 Nguyễn Văn Cừ, Q.5 · 07:30–17:30, T2–T7).\n' +
      '4. **Thanh toán COD linh hoạt** (tiền mặt, VietQR, MoMo hoặc ZaloPay) khi nhận gear; lỗi phần cứng được **đổi 1-đổi-1** ngay lập tức.'
  }
];

function matchPresetQuickResponse(message, catalog = []) {
  if (!message || !Array.isArray(catalog) || catalog.length === 0) return null;
  const hasGearHubCatalog = catalog.some((p) => ['service', 'rental', 'accessory'].includes(p.category));
  if (!hasGearHubCatalog) return null;

  const key = normalizePresetKey(message);
  if (!key) return null;

  const preset = PRESET_QUICK_ANSWERS.find((item) => item.keys.includes(key));
  if (!preset) return null;

  const presentIds = preset.productIds.filter((id) =>
    catalog.some((p) => p.id === id || String(p.id) === String(id))
  );
  const suggestedProductIds = presentIds.length
    ? presentIds
    : catalog
        .filter((p) => p.category === preset.fallbackCategory)
        .slice(0, 2)
        .map((p) => p.id);

  return {
    reply: preset.reply,
    suggestedProductIds
  };
}

function buildGearHubIntentResponse(msg, catalog) {
  const hasGearHubCatalog = catalog.some((p) => ['service', 'rental', 'accessory'].includes(p.category));
  if (!hasGearHubCatalog) return null;

  const presetMatch = matchPresetQuickResponse(msg, catalog);
  if (presetMatch) {
    return presetMatch;
  }

  const byCat = (cat) => catalog.filter((p) => p.category === cat);
  const direct = findDirectProductMatch(msg, catalog);
  const isPureProductQuestion = msg.includes('tư vấn cho mình về') || Boolean(msg.match(/"[^"]+"/));
  if (direct && isPureProductQuestion) {
    return buildDirectProductReply(direct);
  }

  // 1. Nóng máy, quạt kêu to, vệ sinh / tra keo tản nhiệt
  if (/(nóng|nhiệt|quạt|vệ sinh|spa|keo|mx-4|mx-6|bụi|thermal|throttle|79k)/i.test(msg)) {
    const picked = direct && direct.category === 'service'
      ? [direct, ...byCat('service').filter((p) => p.id !== direct.id)].slice(0, 2)
      : byCat('service').slice(0, 2);
    if (picked.length > 0) {
      let reply = 'Với tình trạng máy nóng hoặc quạt kêu to khi code/chạy tác vụ nặng, GearHub Sảnh I gợi ý hai gói xử lý lấy liền:\n';
      reply += picked.map(summarizeProductLine).join('\n') + '\n';
      reply += '\nQuy trình làm **30–45 phút** trực tiếp trước mặt sinh viên, giảm nhiệt rõ rệt 5–15°C và **thanh toán COD** sau khi test máy đạt yêu cầu.';
      return { reply, suggestedProductIds: picked.map((p) => p.id) };
    }
  }

  // 2. Thủ tục thuê 0đ / Thẻ Sinh Viên / Gear thuê (phím cơ, chuột, thuyết trình)
  if (/(thuê|cọc|thẻ sv|thẻ sinh viên|mssv|phím cơ|bàn phím|chuột|thuyết trình|hub|slide|vga|hdmi|ktx|đồ án)/i.test(msg)) {
    const isPresentation = /(thuyết trình|hub|slide|máy chiếu|vga|hdmi|báo cáo)/i.test(msg);
    const isPolicyOnly = /(thủ tục|cọc|thẻ sv|thẻ sinh viên|mssv|giữ gìn|mất)/i.test(msg) && !/(phím|chuột|hub|slide)/.test(msg);
    let rentals = byCat('rental');
    if (isPresentation) {
      rentals = [...rentals.filter((p) => /hub|slide|thuyết/i.test(p.name)), ...rentals.filter((p) => !/hub|slide|thuyết/i.test(p.name))];
    } else if (/chuột|cổ tay/i.test(msg)) {
      rentals = [...rentals.filter((p) => /chuột/i.test(p.name)), ...rentals.filter((p) => !/chuột/i.test(p.name))];
    }
    const picked = rentals.slice(0, 3);
    let reply = '';
    if (isPolicyOnly) {
      reply += 'Chính sách **thuê gear 0đ tiền cọc** tại GearHub Sảnh I rất gọn cho sinh viên:\n';
      reply += '- **Không cần cọc tiền mặt**: Chỉ cần xuất trình Thẻ Sinh Viên (hoặc VNeID) hợp lệ khi nhận tại quầy.\n';
      reply += '- **Ưu đãi Gói 1 Tuần (-28%)**: Tính phí 5 ngày, miễn phí trọn 2 ngày cuối tuần.\n';
      reply += '- **Thanh toán COD** trực tiếp sau khi test phím/chuột ổn định tại chỗ.\n';
    } else if (isPresentation) {
      reply += 'Chuẩn bị thuyết trình hoặc bảo vệ đồ án tại giảng đường ĐHKHTN, bạn nên mang theo:\n';
    } else {
      reply += 'Các thiết bị cho thuê **0đ tiền cọc** phù hợp cày đồ án & gõ êm trong KTX:\n';
    }
    reply += picked.map(summarizeProductLine).join('\n');
    reply += '\n\nBạn có thể nhấn **Xem** hoặc **Mua** (chọn số ngày thuê) ngay bên dưới để giữ máy tại Sảnh I nhé!';
    return { reply, suggestedProductIds: picked.map((p) => p.id) };
  }

  // 3. Máy chậm, tối ưu phần mềm / phím cơ / kit tự vệ sinh
  if (/(chậm|lag|đơ|win|windows|ram|docker|vs code|mod phím|lube|keycare|kit|tự vệ sinh|7-in-1)/i.test(msg)) {
    const matched = catalog.filter((p) =>
      /(speedup|keycare|kit)/i.test(`${p.id} ${p.name} ${p.specs || ''}`)
    ).slice(0, 3);
    const picked = matched.length ? matched : catalog.slice(0, 3);
    let reply = 'Bạn có thể tham khảo các giải pháp tối ưu & tự chăm sóc thiết bị chuẩn dân IT:\n';
    reply += picked.map(summarizeProductLine).join('\n');
    reply += '\n\nNhấn **Xem** bên dưới để xem chi tiết từng bước thực hiện và đặt lịch nhanh tại Sảnh I.';
    return { reply, suggestedProductIds: picked.map((p) => p.id) };
  }

  // 4. Đặt lịch, giờ mở cửa, địa điểm Sảnh I, thanh toán COD & bảo hành
  if (/(thanh toán|cod|vietqr|chuyển khoản|tiền mặt|sảnh i|địa chỉ|ở đâu|mở cửa|giờ|bảo hành|lấy liền)/i.test(msg)) {
    const topPicks = [byCat('service')[0], byCat('rental')[0], byCat('accessory')[0]].filter(Boolean);
    const reply =
      'Thông tin Trạm Kỹ Thuật **GearHub Sảnh I ĐHKHTN**:\n' +
      '- **Địa điểm:** Bàn kỹ thuật Sảnh I, 227 Nguyễn Văn Cừ, Q.5, TP.HCM.\n' +
      '- **Giờ trực:** 07:30 – 17:30 (Thứ 2 – Thứ 7), vệ sinh lấy liền **30–45 phút**.\n' +
      '- **Thanh toán & Đặt lịch:** Đặt hẹn online để nhận **Phiếu Hẹn Điện Tử (Mã QR)**, đến sảnh test máy/gear hài lòng mới **thanh toán COD**.\n' +
      '- **Bảo hành:** Hỗ trợ kiểm tra lại trong **7 ngày** (lớp keo tản nhiệt MX-4/MX-6 bảo hành **6 tháng**).';
    return { reply, suggestedProductIds: topPicks.map((p) => p.id) };
  }

  if (direct) {
    return buildDirectProductReply(direct);
  }

  return null;
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
  const gearHubReply = buildGearHubIntentResponse(msg, catalog);
  if (gearHubReply) {
    return gearHubReply;
  }

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

  const byCat = (cat) => matches.filter((p) => p.category === cat);
  const hasGearHub = matches.some((p) => ['service', 'rental', 'accessory'].includes(p.category));
  const selected = hasGearHub
    ? [byCat('service')[0], byCat('rental')[0], byCat('accessory')[0]].filter(Boolean).slice(0, 3)
    : matches.slice(0, 3);
  if (selected.length === 0 && matches.length > 0) {
    selected.push(...matches.slice(0, 3));
  }
  const suggestedProductIds = selected.map((p) => p.id);

  let reply = hasGearHub
    ? 'Chào bạn! Trạm **GearHub Sảnh I ĐHKHTN** gợi ý nhanh các dịch vụ và thiết bị đang được sinh viên đặt nhiều nhất:\n'
    : 'Chào bạn! Hệ thống gợi ý các sản phẩm nổi bật phù hợp với yêu cầu của bạn:\n';
  selected.forEach((p) => {
    reply += summarizeProductLine(p) + '\n';
  });
  reply += '\nBạn có thể nhấn **Xem** để xem chi tiết hoặc **Mua** để thêm nhanh vào giỏ & đặt lịch Sảnh I (thanh toán COD) nhé!';

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

  if (!client) {
    const presetReply = matchPresetQuickResponse(message, catalog);
    if (presetReply) {
      return presetReply;
    }
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
          const roleName = h.role === 'user' ? 'Sinh viên' : 'Trợ lý GearHub AI';
          return `- ${roleName}: ${h.content}`;
        })
        .join('\n') +
      '\n';
  }

  const prompt = `
Bạn là Trợ lý Kỹ Thuật AI thân thiện tại GearHub — Trạm Chăm Sóc Thiết Bị & Cho Thuê Gear Sinh Viên (Sảnh I, ĐHKHTN, 227 Nguyễn Văn Cừ, Q.5).
Sinh viên đang hỏi tư vấn về dịch vụ vệ sinh laptop, thuê bàn phím cơ/chuột/thiết bị thuyết trình 0đ cọc bằng Thẻ Sinh Viên, hoặc phụ kiện chăm sóc máy.

DANH SÁCH DỊCH VỤ & THIẾT BỊ HIỆN CÓ (CATALOG GROUNDING):
${catalogContext}
${historyContext}
CHÍNH SÁCH TRẠM CẦN NHỚ:
- Vệ sinh laptop lấy liền 30–45 phút tại Sảnh I (07:30–17:30, T2–T7), xem trực tiếp toàn bộ quy trình.
- Thuê thiết bị **0đ tiền cọc** (chỉ cần Thẻ Sinh Viên hoặc VNeID), có Gói 1 Tuần (-28%: tính 5 ngày, miễn phí 2 ngày cuối tuần).
- Thanh toán duy nhất **COD trực tiếp tại sảnh** sau khi kiểm tra/test máy êm mượt; đặt hẹn xong nhận **Phiếu Hẹn Điện Tử (Mã QR Check-in)**.

YÊU CẦU QUAN TRỌNG:
1. Trả lời bằng tiếng Việt súc tích, thân thiện, đúng trọng tâm kỹ thuật và nhu cầu sinh viên.
2. CHỈ gợi ý các sản phẩm/dịch vụ CÓ TRONG DANH SÁCH TRÊN phù hợp nhất với câu hỏi.
3. Điền đúng ID sản phẩm vào mảng 'suggestedProductIds' (tối đa 3 mục).
4. Định dạng phản hồi: DUY NHẤT một chuỗi JSON hợp lệ (không markdown block):
{
  "reply": "Nội dung phản hồi tư vấn gửi sinh viên",
  "suggestedProductIds": ["id1", "id2"]
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
          'Hiện tại trợ lý GearHub AI đang bận một chút, bạn vui lòng xem danh mục dịch vụ vệ sinh & thuê gear trên Cửa hàng hoặc thử gửi lại câu hỏi nhé!',
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
  consultWithCatalog,
  matchPresetQuickResponse,
  PRESET_QUICK_ANSWERS
};

module.exports = geminiService;

