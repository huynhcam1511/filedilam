# Original User Request

## Initial Request — 2026-11-14T05:50:39Z

Thiết kế và triển khai luồng tự động hóa 100% cho hệ thống File Đi Làm trong môi trường production (`functions/main.py` và `admin.html`/`admin.js`): gửi email tức thì cho Admin khi thanh toán thành công qua SePay, tự động kiểm tra và gửi email nhắc thanh toán kèm thông báo Admin cho đơn hàng PENDING sau 10–15 phút, và tích hợp link Zalo 1 chạm chăm sóc khách hàng trong email và giao diện Admin.

Working directory: c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\FILE_DI_LAM_MVP
Integrity mode: development

References:
- Backend: `functions/main.py` (Firebase Cloud Functions Python 3.14, 2nd gen, endpoint `/webhooks/sepay`, `send_payment_reminder_email`, endpoint `/admin/send-payment-reminder`, SMTP qua `kiencam.work@gmail.com`)
- Database: Google Cloud Firestore (`orders`, `products`)
- Frontend: `admin.html`, `admin.js`
- Admin recipient: `huynhkiencam151102@gmail.com`

## Requirements

### R1. Email "Nổ tiền" tức thì cho Admin khi thanh toán thành công qua SePay
Khi nhận được webhook thanh toán thành công từ SePay (trong vòng 10–30s):
- Gửi ngay 1 email thông báo "Nổ tiền" đến Admin (`huynhkiencam151102@gmail.com`).
- Tiêu đề email chuẩn format: `[ĐÃ THANH TOÁN THÀNH CÔNG] +<Số_tiền>đ - Đơn #<Mã_đơn> - <Tên_khách_hàng>`.
- Nội dung chi tiết: Thông tin đơn, số tiền, phương thức, thời gian thanh toán, thông tin khách hàng, sản phẩm đã mua.
- Đính kèm nút/đường link 1 chạm mở Zalo khách hàng (`https://zalo.me/<SĐT_chuẩn_hóa>`).

### R2. Tự động kiểm tra và nhắc thanh toán đơn hàng PENDING sau 10–15 phút
Triển khai một Cloud Function theo lịch định kỳ (cron job qua Cloud Scheduler chạy mỗi 5–10 phút) để tự động quét các đơn hàng có trạng thái `PENDING` được tạo từ 10–15 phút trước:
1. Tự động gửi Email nhắc thanh toán cho Khách hàng:
   - Kèm mã VietQR và cú pháp chuyển khoản rõ ràng.
   - Lời nhắn hỗ trợ thân thiện: "Hệ thống thấy bạn đang gặp vướng mắc khi thanh toán đơn hàng #... Nếu bạn cần hỗ trợ, hãy liên hệ Zalo..."
   - Đánh dấu cờ `reminder_sent_at` trong Firestore để chỉ gửi đúng 1 lần, không spam.
2. Gửi email thông báo tổng kết cho Admin (`huynhkiencam151102@gmail.com`):
   - Nội dung thông báo: "Đơn #<Mã_đơn> - <Tên_khách> (SĐT: <SĐT>) sau 10 phút chưa thanh toán. Hệ thống đã tự động gửi email nhắc."
   - Kèm nút/đường link Zalo 1 chạm (`https://zalo.me/<SĐT_chuẩn_hóa>`) để Admin bấm vào mở ngay khung chat với khách.

### R3. Tích hợp link Zalo 1 chạm chăm sóc khách hàng
- Viết logic chuẩn hóa số điện thoại của khách hàng (loại bỏ khoảng trắng, dấu gạch nối, ký tự đặc biệt, định dạng hợp lệ cho Zalo).
- Tích hợp nút bấm/đường link 1 chạm `https://zalo.me/<SĐT_chuẩn_hóa>` vào:
  - Email thông báo thanh toán thành công gửi Admin.
  - Email thông báo nhắc thanh toán gửi Admin.
  - Email tạo đơn mới gửi Admin (nếu có).
  - Giao diện Admin (`admin.html` / `admin.js`): hiển thị tại bảng quản lý đơn hàng (Orders table) và trong popup/modal chi tiết đơn hàng (Order details view) ngay cạnh số điện thoại khách hàng.

### R4. Bộ kiểm thử tự động (Automated Verification Suite)
Viết script kiểm thử tự động độc lập kiểm chứng toàn bộ luồng logic mà không cần phụ thuộc vào giao dịch ngân hàng thật hay gửi email SMTP thật trong quá trình test:
- Mock payload SePay webhook gửi tới endpoint webhook và kiểm chứng email "Nổ tiền" cho Admin được tạo với đúng tiêu đề, nội dung và link Zalo.
- Mock dữ liệu đơn hàng `PENDING` quá 10–15 phút trong Firestore và kích hoạt hàm kiểm tra định kỳ; kiểm chứng email nhắc gửi cho khách (kèm VietQR, cú pháp, cờ `reminder_sent_at`), email thông báo cho Admin kèm link Zalo 1 chạm, và kiểm chứng không gửi lại ở lần chạy tiếp theo.
- Unit test logic chuẩn hóa số điện thoại cho nhiều định dạng đầu vào khác nhau (có khoảng trắng, dấu `+84`, số 0 đầu, ký tự lạ).

## Acceptance Criteria

### Thông báo thanh toán thành công cho Admin
- [ ] Khi webhook SePay gửi sự kiện thanh toán thành công, hệ thống gửi email đến `huynhkiencam151102@gmail.com`.
- [ ] Tiêu đề email khớp đúng định dạng: `[ĐÃ THANH TOÁN THÀNH CÔNG] +<Số_tiền>đ - Đơn #<Mã_đơn> - <Tên_khách_hàng>`.
- [ ] Nội dung email hiển thị đầy đủ thông tin đơn hàng, số tiền, phương thức, thời gian thanh toán, thông tin khách hàng, sản phẩm đã mua và nút/link Zalo 1 chạm.

### Tự động nhắc thanh toán đơn hàng PENDING
- [ ] Scheduled function định kỳ tự động tìm ra các đơn hàng `PENDING` được tạo từ 10–15 phút trước chưa có `reminder_sent_at`.
- [ ] Khách hàng nhận được email nhắc thanh toán chứa mã VietQR, cú pháp chuyển khoản và lời nhắn hỗ trợ.
- [ ] Đơn hàng trong Firestore được cập nhật trường `reminder_sent_at` và không bị gửi lặp lại trong các chu kỳ sau.
- [ ] Admin nhận được email thông báo nhắc thanh toán kèm thông tin đơn, SĐT và đường link Zalo 1 chạm.

### Tích hợp Zalo 1 chạm
- [ ] Logic chuẩn hóa SĐT loại bỏ hoàn toàn khoảng trắng, dấu gạch nối, ký tự đặc biệt và sinh link `https://zalo.me/<SĐT>`.
- [ ] Đường link Zalo 1 chạm xuất hiện và hoạt động trong tất cả các mẫu email gửi Admin.
- [ ] Trên giao diện `admin.html` / `admin.js`, link Zalo 1 chạm hiển thị tại cột khách hàng/SĐT trong bảng đơn hàng và bên trong modal xem chi tiết đơn hàng.

### Kiểm thử và xác thực độc lập
- [ ] Script kiểm thử tự động chạy thành công, mô phỏng đầy đủ webhook SePay và hàm quét định kỳ với kết quả đạt 100% assertions.
- [ ] Không có lỗi cú pháp hoặc runtime error trong `functions/main.py` và `admin.js`.
