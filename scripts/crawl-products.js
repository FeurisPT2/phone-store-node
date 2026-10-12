const CrawlerService = require('../src/services/crawlerService');
const ProductModel = require('../src/models/Product');

async function run() {
  const args = process.argv.slice(2);
  const options = {
    keyword: '',
    brand: 'all',
    limit: 10,
    source: 'tiki'
  };

  args.forEach(arg => {
    if (arg.startsWith('--keyword=')) options.keyword = arg.split('=')[1];
    if (arg.startsWith('--brand=')) options.brand = arg.split('=')[1];
    if (arg.startsWith('--limit=')) options.limit = parseInt(arg.split('=')[1]) || 10;
    if (arg.startsWith('--source=')) options.source = arg.split('=')[1];
  });

  console.log('====================================================');
  console.log('🤖 BẮT ĐẦU CÀO SẢN PHẨM TỰ ĐỘNG CHO TECHSTORE');
  console.log(`📡 Nguồn: ${options.source.toUpperCase()}`);
  console.log(`🎯 Thương hiệu / Từ khóa: ${options.keyword || options.brand || 'Tất cả'}`);
  console.log(`🔢 Số lượng yêu cầu: ${options.limit}`);
  console.log('====================================================\n');

  try {
    let result;
    if (options.source === 'dummy') {
      result = await CrawlerService.crawlFromDummyJson({
        limit: options.limit,
        skipExisting: true
      });
    } else {
      result = await CrawlerService.crawlFromTiki({
        keyword: options.keyword,
        brand: options.brand,
        limit: options.limit,
        skipExisting: true
      });
    }

    console.log(`✅ Kết quả: Đã tìm thấy ${result.totalFetched} sản phẩm trên web nguồn.`);
    console.log(`✨ Đã thêm mới vào kho: ${result.savedCount} sản phẩm.`);
    if (result.skippedCount > 0) {
      console.log(`⏩ Bỏ qua (đã tồn tại trong kho): ${result.skippedCount} sản phẩm.`);
    }

    if (result.products.length > 0) {
      console.log('\n📱 Danh sách sản phẩm vừa thêm mới:');
      result.products.forEach((p, idx) => {
        const formattedPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.price);
        console.log(`  ${idx + 1}. [${p.brand}] ${p.name} - Giá: ${formattedPrice}`);
      });
    }

    const all = await ProductModel.getAll('all');
    console.log(`\n🎉 Tổng số điện thoại trong hệ thống hiện tại: ${all.length} sản phẩm.`);
    console.log('====================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi khi cào sản phẩm:', err.message);
    process.exit(1);
  }
}

run();
