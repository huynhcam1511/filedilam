# FILE ĐI LÀM MVP — AGENT GUIDELINES & PROJECT CONSTITUTION

> **Văn bản quy định bắt buộc (Mandatory Constitution) dành cho tất cả các AI Agent, Pair Programmer và Nhà phát triển làm việc trong codebase FILE_DI_LAM_MVP.**

---

## 1. NGUYÊN TẮC DỮ LIỆU & QUYỀN HẠN CỦA ADMIN (TỐI THƯỢNG)

1. **Chủ quyền sản phẩm & giá thuộc về ADMIN**:
   - Toàn bộ danh mục sản phẩm, giá niêm yết (giá gốc), giá bán thực tế, phần trăm giảm giá, combo ưu đãi và link file trên hệ thống hoàn toàn do **ADMIN (Huỳnh Kiến Cẩm - huynhkiencam151102@gmail.com)** trực tiếp nhập và quản trị trên trang /admin.html.
   - **NGHIÊM CẤM** mọi hành vi tự ý ghi đè, xóa sản phẩm hoặc reset collection products trên Firestore.
   - Không được hardcode danh sách sản phẩm hay tự ý hạ/nâng giá trong code client nhằm thay thế Firestore. Cloud Firestore là **Nguồn sự thật duy nhất (Single Source of Truth)**.

2. **Bảo toàn sản phẩm khi khôi phục lỗi**:
   - Khi sửa lỗi giao diện hoặc logic mua hàng, không bao giờ được phép xóa dữ liệu Firestore của shop. Mọi sản phẩm Admin đã tạo (ví dụ: file 2.000đ Bán hàng online, 99.000đ Quản lý kho,...) phải luôn hiển thị đầy đủ, chính xác cả 2 dòng giá (giá gốc gạch ngang + giá bán thực tế + % giảm).

---

## 2. TIÊU CHUẨN THIẾT KẾ GIAO DIỆN (UI/UX DESIGN SYSTEM)

1. **Thẩm mỹ chuẩn Fintech cao cấp (Minimalist & Classy)**:
   - Tone màu chủ đạo: Xanh ngọc Mint (#10b981 / #059669), nền trắng/xám slate thanh lịch, trung tính.
   - Bố cục thoáng đãng, sang trọng, tập trung vào trải nghiệm mua sắm nhanh trên di động (TikTok/Facebook bio-link).

2. **CẤM TUYỆT ĐỐI emoji & icon vô duyên, trẻ con**:
   - Không bao giờ đặt các emoji như ⚡, ✨, 🔑, 🟢, ⏳, ⚠️, ➔ vào nút bấm, tab chuyển đổi, tiêu đề popup hay khung cảnh báo.
   - Thông báo hệ thống phải sử dụng văn phong tinh tế, trung tính, nền màu nhã nhặn (#f8fafc, border #e2e8f0).

3. **Chống lạm dụng thẻ container ("LẬM CARD")**:
   - Không bọc các thông tin hiển nhiên vào các khối card to màu mè chiếm diện tích (ví dụ: không đặt card xanh lè nhắc lại giá ở đầu modal thanh toán).

4. **TÍNH ĐỒNG NHẤT 100% GIỮA CÁC FORM**:
   - Tất cả các form xác thực trong hệ thống (bao gồm Modal Đăng nhập/Đăng ký trên thanh điều hướng #authModal và Bước 1 trong Modal Thanh toán #checkoutAuthStep) **BẮT BUỘC PHẢI DÙNG CHUNG MỘT KIẾN TRÚC THIẾT KẾ**:
     - **Segmented Control Tabs**: Nằm trên cùng để chuyển đổi mượt mà giữa *"Đăng nhập"* và *"Đăng ký"* (hoặc *"Người mua lần đầu"* và *"Đã có tài khoản"*).
     - **Cấu trúc trường nhập chuẩn**: Sử dụng class đồng bộ .checkout-field, nhãn .checkout-label kèm dấu hoa thị đỏ <span class="req">*</span>, ô nhập .checkout-input.
     - **Nút mắt ẩn/hiện mật khẩu**: Bắt buộc có nút toggle con mắt (.password-input-wrap, .btn-toggle-eye) tại mọi ô nhập mật khẩu.
     - **Nút bấm chính**: Cao 46px, bo góc chuẩn, nền Mint, chữ rõ ràng.
     - **Đường kẻ phân cách**: Text *"hoặc tiếp tục nhanh với"*.
     - **Nút Google phẳng**: Nằm ở dưới cùng sau nút chính (.btn-google-flat).

---

## 3. QUY TẮC LUỒNG ĐẶT HÀNG & THANH TOÁN (CHECKOUT & PAYMENT)

1. **Cơ chế 1-Click Buy độc lập**:
   - Khi người dùng bấm nút *"Mua ngay"* trên bất kỳ sản phẩm nào, hàm uyNow(productId) phải cô lập giỏ hàng: chỉ đặt đúng duy nhất sản phẩm đó (state.cart = [{ productId, quantity: 1 }]).
   - Tuyệt đối không được để tình trạng cộng dồn sản phẩm cũ hoặc hiển thị chữ (+1 file khác) khi khách bấm mua nhanh.

2. **Bảng thông tin chuyển khoản ngân hàng chuẩn**:
   - Bước 2 quét mã VietQR phải hiển thị bảng thông tin rõ ràng với đủ 5 trường:
     1. **Ngân hàng**: TPBank
     2. **Chủ TK**: HUYNH KIEN CAM
     3. **Số TK**: 59215112002 (kèm nút Sao chép)
     4. **Số tiền**: Hiển thị rõ số tiền VND (kèm nút Sao chép)
     5. **Nội dung CK**: Mã đơn hàng DHxxxxxx (kèm nút Sao chép)

3. **Kích hoạt đơn tự động qua SePay Webhook**:
   - Backend unctions/main.py tiếp nhận webhook từ SePay khi có biến động số dư.
   - Khớp mã đơn hàng DHxxxxxx trong nội dung chuyển khoản -> chuyển trạng thái đơn sang PAID -> Storefront tự động kích hoạt pháo hoa và hiển thị nút nhận link file.

---

## 4. BẢN ĐỒ TÀI NGUYÊN & MÃ NGUỒN

| File / Thư mục | Vai trò chính |
| :--- | :--- |
| index.html | Trang Storefront chính (Giao diện mua hàng, giỏ hàng, modal auth, modal VietQR) |
| storefront.js | Logic phía khách: realtime Firestore, giỏ hàng, VietQR, polling đơn hàng |
| storefront.css | Toàn bộ style hệ thống: biến design tokens, layout mobile 2 cột, modal, tabs |
| dmin.html / dmin.js | Trang quản trị đăng bán, sửa giá, tải file và thumbnail lên Firebase Storage |
| unctions/main.py | Cloud Functions 2nd gen: API /orders, /profile, /my-orders & webhook SePay |
| IT_BRAIN.json | Nguồn sự thật toàn diện về toàn bộ kiến trúc IT và quy tắc nghiệp vụ |
| gent.md | Bản hiến pháp hướng dẫn hành vi và tiêu chuẩn phát triển cho AI Agent |

---

## 5. QUY TRÌNH KIỂM THỬ & TRIỂN KHAI (DEPLOYMENT CHECKLIST)

Mỗi lần chỉnh sửa code, Agent bắt buộc thực hiện theo đúng các bước:
1. **Kiểm tra cú pháp & tính toàn vẹn**: Đảm bảo không làm gãy các hàm listener và không xóa nhầm logic của các modal khác.
2. **Cập nhật Cache Buster**: Khi sửa file storefront.css hoặc storefront.js, phải tăng tham số phiên bản trong index.html (ví dụ: storefront.css?v=39, storefront.js?v=55) để người dùng không bị kẹt cache cũ trên trình duyệt.
3. **Commit vào Git cục bộ**: Sử dụng lệnh Git chuẩn trên nhánh main với commit message rõ ràng.
4. **Deploy Firebase Hosting**: Chạy lệnh 
px -y firebase-tools@latest deploy --only hosting và xác nhận deploy thành công Deploy complete!.
5. **Đồng bộ IT_BRAIN.json**: Luôn cập nhật các thay đổi kiến trúc vào IT_BRAIN.json.
