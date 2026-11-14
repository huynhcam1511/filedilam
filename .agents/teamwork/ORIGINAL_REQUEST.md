# Original User Request

## Initial Request — 2026-11-14T13:35:49Z

Khắc phục các vi phạm chuẩn STANDARDS_TEMPLATE/AGENTS_MASTER.md trong giải pháp Quản Lý Công Việc Team tại các file PROJECTS_WEBAPPS/QuanLyCongViecTeam_Code.gs và PROJECTS_WEBAPPS/QuanLyCongViecTeam_Index.html.

Working directory: c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\FILE_DI_LAM_MVP
Integrity mode: development

## Requirements

### R1. Chuẩn hóa ô nhập ngày tháng sang định dạng Việt Nam (dd/mm/yyyy)
Sửa toàn bộ các ô nhập ngày tháng vi phạm định dạng Mỹ mm/dd/yyyy sang chuẩn Việt Nam dd/mm/yyyy trên toàn bộ giao diện Web App (sử dụng input date có mặt nạ định dạng tự động hoặc Flatpickr format dd/mm/yyyy do đội ngũ kỹ thuật quyết định giải pháp tối ưu).

### R2. Xây dựng Module Danh Mục Hệ Thống (Master Catalogs)
Xây dựng Module Danh Mục Hệ Thống ở Tầng 3 (tab-catalogs) kết nối với tab DB_DanhMuc của Google Sheets để quản trị động Phòng Ban, Mức Độ Ưu Tiên, Trạng Thái, Cấp Bậc (hỗ trợ xem, thêm mới, chỉnh sửa, cập nhật danh mục).

### R3. Động hóa dropdown trong các Form
Động hóa toàn bộ các dropdown chọn Phòng ban, Trạng thái, Ưu tiên trong Form Dự Án, Form Task, Form Nhân Sự lấy dữ liệu từ AppState.data.taxonomy thay vì hardcode.

### R4. Đóng dấu phiên bản v3.5, kiểm thử cú pháp và đồng bộ GitHub
Đóng dấu hiển thị Phiên bản 3.5 (Active) tại Header Topbar và Sidebar footer, kiểm thử cú pháp đảm bảo 0 lỗi syntax/runtime trên Code.gs và Index.html, sau đó commit thay đổi và git push trực tiếp lên nhánh hiện tại của remote repository.

## Verification Resources
- Quy chuẩn AGENTS.md tại thư mục gốc repository.
- Kiểm tra cú pháp tự động (Node.js syntax check với `node -c`) cho backend Apps Script (`PROJECTS_WEBAPPS/QuanLyCongViecTeam_Code.gs`) và các khối script trong frontend (`PROJECTS_WEBAPPS/QuanLyCongViecTeam_Index.html`).

## Acceptance Criteria

### Date Input Formatting
- [ ] 100% các ô nhập liệu ngày tháng trong tất cả các form (Task, Dự Án, v.v.) hiển thị và nhận giá trị theo định dạng `dd/mm/yyyy`.
- [ ] Không còn ô nhập ngày tháng nào hiển thị định dạng mặc định `mm/dd/yyyy` của trình duyệt.

### Master Catalogs Module (tab-catalogs)
- [ ] Tab Danh mục Hệ thống xuất hiện tại Tầng 3 trên menu điều hướng của Web App.
- [ ] Giao diện tab-catalogs cho phép quản trị 4 nhóm danh mục: Phòng Ban, Mức Độ Ưu Tiên, Trạng Thái, Cấp Bậc.
- [ ] Các thao tác thêm, sửa, cập nhật danh mục gửi yêu cầu đồng bộ chính xác về tab `DB_DanhMuc` trên Google Sheets thông qua Google Apps Script backend.

### Dynamic Dropdowns
- [ ] Toàn bộ dropdown Phòng ban, Trạng thái, Ưu tiên trong Form Dự Án, Form Task và Form Nhân Sự lấy danh sách tùy chọn động từ `AppState.data.taxonomy`.
- [ ] Khi thay đổi hoặc bổ sung danh mục mới trong `tab-catalogs`, các dropdown tương ứng cập nhật danh sách tùy chọn mà không cần sửa code.

### Version Stamping & Quality Assurance
- [ ] Huy hiệu phiên bản trên thanh Header Topbar và chân Sidebar hiển thị chính xác `Bản 3.5 (Active)`.
- [ ] Kiểm tra cú pháp tự động bằng Node.js (`node -c`) đối với `PROJECTS_WEBAPPS/QuanLyCongViecTeam_Code.gs` và mã JavaScript trong `PROJECTS_WEBAPPS/QuanLyCongViecTeam_Index.html` trả về 0 lỗi.
- [ ] Tất cả các thay đổi được tạo git commit và push thành công lên nhánh hiện tại của GitHub remote repository.
