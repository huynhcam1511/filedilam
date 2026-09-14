# Quản Lý Kho Mini – Google Sheets Smart 2.0

## Cách khách hàng sử dụng

1. Tạo bản sao file vào Google Drive.
2. Mở menu `📦 Kho Mini Smart` và chọn `Kích hoạt tự động hóa` để cấp quyền một lần.
3. Chọn `🚀 Mở ứng dụng quản lý kho`.
4. Vận hành trên Web App toàn màn hình: Tổng quan, Sản phẩm, Nhập kho, Xuất kho, Tồn kho, Cảnh báo, Báo cáo và Cài đặt.
5. Google Sheets lưu dữ liệu và tính báo cáo ở phía sau; không nhập trực tiếp vào các sheet công thức.

## Triển khai Web App cho file master

Trong Apps Script chọn `Triển khai` → `Bản triển khai mới` → `Ứng dụng web`:

- Thực thi dưới quyền: người truy cập ứng dụng web.
- Ai có quyền truy cập: người dùng có quyền mở file.

Mỗi lần cập nhật code, tạo phiên bản triển khai mới để khách nhận giao diện mới.

## Trải nghiệm khách hàng

1. Bấm link `/copy` để tạo bản sao trong Google Drive.
2. Mở file và chọn menu `📦 Quản lý kho`.
3. Chọn `Kích hoạt tự động hóa` và cấp quyền Google một lần.
4. Chọn `Mở giao diện thông minh` để nhập/xuất kho từ sidebar.

## Thành phần Apps Script

- `Code.gs`: logic nghiệp vụ, menu, nhập/xuất, kiểm tra tồn, email, PDF, trigger và nhật ký.
- `Sidebar.html`: giao diện thông minh responsive.
- `appsscript.json`: múi giờ và quyền tối thiểu cần dùng.

## Chức năng

- Form nhập kho và xuất kho
- Dropdown sản phẩm kèm tồn hiện tại
- Chặn xuất vượt tồn
- Tự sinh mã phiếu
- Dashboard nhanh trong sidebar
- Cảnh báo tồn kho
- Gửi PDF qua email
- Trigger cảnh báo mỗi ngày lúc 08:00
- Nhật ký thao tác tự động
