# NGUYÊN TẮC NGỮ CẢNH DỰ ÁN (PROJECT IT BRAIN)

Mọi thao tác phát triển, sửa đổi mã nguồn, cơ sở dữ liệu, API, cấu hình deployment và quy trình sản xuất file thương mại trong dự án **FILE ĐI LÀM MVP** bắt buộc phải tuân thủ:

1. **Nguồn chuẩn sự thật (Single Source of Truth)**:
   - Trước khi phân tích, tư vấn hoặc chỉnh sửa code, **BẮT BUỘC** đọc file `IT_BRAIN.json` ở thư mục gốc để nắm đầy đủ ngữ cảnh kiến trúc, database schema, routing, flow nghiệp vụ và các tiêu chuẩn chất lượng.
   - Không tự ý phán đoán kiến trúc hoặc triển khai các giải pháp trái ngược với thiết kế trong `IT_BRAIN.json`.

2. **Duy trì cập nhật IT Brain**:
   - Khi có bất kỳ thay đổi nào liên quan đến:
     + Thêm, sửa, xoá sản phẩm/danh mục trên Storefront hoặc Firestore
     + Schema của `products`, `orders`, `customer_profiles`
     + Endpoint Cloud Functions (`functions/main.py`) hoặc SePay Webhook
     + Firestore rules hoặc Storage rules
     + CLI / Engine của Template Factory (`file_di_lam_factory`)
     + Thông tin tài khoản ngân hàng hoặc phương thức giao hàng
   - **Bắt buộc** phải cập nhật lại `IT_BRAIN.json` trong cùng lượt thay đổi.

3. **Thứ bậc ưu tiên quyền hạn**:
   - Yêu cầu trực tiếp của chủ dự án (Huỳnh Kiến Cẩm)
   - Security rules (Firestore/Storage) và Server-side validation
   - `IT_BRAIN.json`
   - Tiêu chuẩn thương hiệu `FILE_DI_LAM_BRAND.json` & chất lượng `brain.json`
   - Mã nguồn production đang chạy (`filedilam`)
   - Tài liệu tác nghiệp (.md)
