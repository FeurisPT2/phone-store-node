const ProductModel = require('../src/models/Product');

const flagships = [
  {
    name: "iPhone 16 Pro 128GB",
    brand: "Apple",
    price: 28990000,
    oldPrice: 30990000,
    specs: "6.3 inch Super Retina XDR OLED 120Hz | Apple A18 Pro | Nút Camera Control | Khung Titan cao cấp",
    image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "iPhone 16 128GB",
    brand: "Apple",
    price: 22490000,
    oldPrice: 23990000,
    specs: "6.1 inch OLED Dynamic Island | Apple A18 mạnh mẽ | Camera 48MP Fusion 2x | Kính pha màu lưng",
    image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Samsung Galaxy S24 FE 5G 128GB",
    brand: "Samsung",
    price: 16990000,
    oldPrice: 18990000,
    specs: "6.7 inch Dynamic AMOLED 2X 120Hz | Exynos 2400e | Bộ công cụ thông minh Galaxy AI | Pin 4700mAh",
    image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Samsung Galaxy Z Flip5 5G 256GB",
    brand: "Samsung",
    price: 18990000,
    oldPrice: 25990000,
    specs: "Màn hình ngoài Flex Window 3.4 inch | Màn chính Dynamic AMOLED 2X 120Hz | Bản lề Flex không khe hở",
    image: "https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "OnePlus 12 5G 256GB",
    brand: "OnePlus",
    price: 19990000,
    oldPrice: 22490000,
    specs: "6.82 inch 2K LTPO 120Hz 4500 nits | Snapdragon 8 Gen 3 | Camera Hasselblad thế hệ 4 | Sạc 100W",
    image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Vivo X100 Pro 5G 256GB",
    brand: "Vivo",
    price: 21990000,
    oldPrice: 24990000,
    specs: "6.78 inch LTPO AMOLED 120Hz | Dimensity 9300 siêu mạnh | Cảm biến 1 inch ZEISS APO Telephoto | Sạc 100W",
    image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "ASUS ROG Phone 8 Pro 512GB",
    brand: "ASUS",
    price: 29990000,
    oldPrice: 32990000,
    specs: "6.78 inch Samsung E6 AMOLED 165Hz | Snapdragon 8 Gen 3 | AniMe Vision LED lưng | Hệ thống AirTrigger",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Sony Xperia 1 VI 5G 256GB",
    brand: "Sony",
    price: 31990000,
    oldPrice: 34990000,
    specs: "6.5 inch LTPO OLED 1-120Hz Powered by BRAVIA | Ống kính quang học ZEISS T* Zoom 85-170mm | Snap 8 Gen 3",
    image: "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Google Pixel 9 Pro 128GB",
    brand: "Google",
    price: 24990000,
    oldPrice: 26990000,
    specs: "6.3 inch Super Actua OLED 120Hz 3000 nits | Google Tensor G4 | Trợ lý Gemini AI trực tiếp | Camera 50MP",
    image: "https://images.unsplash.com/photo-1523206489230-c012c64b2b48?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "POCO F6 Pro 5G 512GB",
    brand: "Xiaomi",
    price: 13990000,
    oldPrice: 15990000,
    specs: "6.67 inch WQHD+ Flow AMOLED 120Hz 4000 nits | Snapdragon 8 Gen 2 | Sạc siêu tốc HyperCharge 120W",
    image: "https://images.unsplash.com/photo-1567581935884-3349723552ca?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Nothing Phone (2) 256GB",
    brand: "Khác",
    price: 14990000,
    oldPrice: 16990000,
    specs: "6.7 inch LTPO OLED 120Hz | Giao diện đèn Glyph Interface độc bản | Snapdragon 8+ Gen 1 | OS tối giản",
    image: "https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Honor Magic6 Pro 512GB",
    brand: "Khác",
    price: 23990000,
    oldPrice: 26990000,
    specs: "6.8 inch LTPO OLED cong 120Hz | Camera kính tiềm vọng 180MP Falcon | Snapdragon 8 Gen 3 | Pin 5600mAh",
    image: "https://images.unsplash.com/photo-1533228876829-65c94e7b5025?w=600&auto=format&fit=crop&q=80"
  }
];

async function addFlagships() {
  console.log('Bắt đầu bổ sung các siêu phẩm điện thoại...');
  const current = await ProductModel.getAll('all');
  const existingNames = new Set(current.map(p => p.name.toLowerCase().replace(/[^a-z0-9]/g, '')));

  let added = 0;
  for (const item of flagships) {
    const key = item.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!existingNames.has(key)) {
      await ProductModel.create(item);
      existingNames.add(key);
      added++;
      console.log(`+ Đã thêm: [${item.brand}] ${item.name}`);
    } else {
      console.log(`- Đã có: ${item.name}`);
    }
  }

  const all = await ProductModel.getAll('all');
  console.log(`\nHoàn thành! Đã thêm mới ${added} mẫu điện thoại. Tổng số hiện tại: ${all.length} sản phẩm.`);
}

addFlagships();
