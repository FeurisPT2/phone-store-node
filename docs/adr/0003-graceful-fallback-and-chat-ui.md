# 0003. Giao Diện Tương Tác Storefront Và Cơ Chế Graceful Fallback Khi Mất Kết Nối AI

Chúng tôi quyết định xây dựng giao diện tương tác Storefront gồm Floating Action Chat Widget với Quick Prompts và Modal chi tiết sản phẩm trực quan hóa các dữ liệu AI, đồng thời thiết lập cơ chế Graceful Fallback nghiêm ngặt khi thiếu API Key hoặc lỗi mạng/quota.

## Bối cảnh & Lý do lựa chọn
- Dữ liệu do AI sinh ra (bài đánh giá, ưu nhược điểm, bảng cấu hình 8 thông số) cần một không gian hiển thị chuyên biệt trên Storefront thay vì chỉ nhét vào các thẻ sản phẩm nhỏ trên trang chủ.
- Để đảm bảo tính bền vững của một hệ thống thương mại điện tử, toàn bộ chức năng cào sản phẩm và duyệt web cốt lõi không được phép phụ thuộc tuyệt đối vào dịch vụ bên thứ ba (Google Gemini API).
- Khi `GEMINI_API_KEY` chưa được cấp hoặc gặp sự cố gián đoạn API, hệ thống sẽ tự động hạ cấp an toàn (Graceful Fallback) về bộ sinh thông số Regex hiện tại, đảm bảo không phát sinh lỗi 500 hoặc làm treo luồng vận hành của cửa hàng.
