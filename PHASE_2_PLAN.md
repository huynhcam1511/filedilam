# Kế hoạch nâng cấp (Phase 2): Đăng nhập & Tối giản biểu mẫu

Mục tiêu: Giúp khách hàng có trải nghiệm thanh toán siêu tốc và dễ dàng tải lại các file đã mua trong tương lai.

## User Review Required

> [!IMPORTANT]
> Dưới đây là kế hoạch chi tiết cho bản cập nhật tiếp theo. Bạn có muốn thực hiện ngay bây giờ không, hay chỉ tạm lưu lại để làm sau?

## Proposed Changes

### 1. Tối giản form thanh toán (Checkout Form)
Hiện tại form yêu cầu: Họ tên, Số điện thoại, Email/Zalo, Ghi chú. Hơi rườm rà.
**Thay đổi:**
- Chỉ yêu cầu 2 trường: **Họ và tên** (bắt buộc) và **Email / SĐT Zalo** (bắt buộc - dùng làm ID nếu khách không đăng nhập).
- Lược bỏ trường "Số điện thoại" (gộp chung vào Email/Zalo) và bỏ "Ghi chú".

### 2. Tích hợp Đăng nhập (Authentication)
- Sử dụng **Firebase Authentication**.
- Cung cấp nút **Đăng nhập bằng Google** (chỉ 1 chạm là xong) hoặc **Đăng nhập bằng Email**.
- Nút đăng nhập sẽ nằm ở góc trên bên phải trang chủ.

### 3. Trang "Kho ứng dụng của tôi" (My Purchases)
- Khi khách hàng đã đăng nhập, họ sẽ có một nút "Tài khoản" hoặc "File của tôi".
- Giao diện này sẽ liệt kê tất cả các đơn hàng có trạng thái `PAID` thuộc về Email/UID của họ.
- Khách hàng có thể bấm "Tải lại" bất cứ lúc nào mà không cần giữ link hay email cũ.

## Verification Plan

### Manual Verification
- Sửa lại file HTML/CSS/JS frontend để thêm nút Đăng nhập và thu gọn form.
- Cấu hình Firebase Auth trong Console của Firebase (bật Google Sign-In).
- Thử nghiệm đăng nhập tài khoản thật.
- Đặt đơn hàng mới, kiểm tra xem đơn hàng có tự động liên kết với tài khoản đang đăng nhập hay không.
- Kiểm tra tính năng lấy danh sách đơn hàng cũ từ Firestore.
