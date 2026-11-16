# Original User Request

## Approved Task Prompt — 2026-11-16T08:39:05Z

Tối giản landing page (index.html) thành giao diện tập trung mua hàng ngay: lược bỏ các section rườm rà (Hero, Stats, Steps, Compare, Coupons ngoài trang chủ, FAQ, Custom), đưa Danh mục sản phẩm (Catalog - id="catalog") và Giỏ hàng lên vị trí chính ngay dưới Topbar; tách nội dung FAQ và Dịch vụ thiết kế riêng thành 2 trang con độc lập (faq.html, custom.html); nâng cấp trải nghiệm giỏ hàng với Mobile FAB và bộ hiệu ứng chuyển động Fly-to-Cart, Pop-Shrink, Wiggle, Bounce sinh động.

Working directory: c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\FILE_DI_LAM_MVP
Integrity mode: development

## Requirements

### R1. Tối giản cấu trúc Landing Page (index.html) và đưa Catalog lên vị trí trọng tâm
Lược bỏ hoàn toàn các section gây phân tâm khỏi index.html: Hero section, Stats-section, Steps-section (Quy trình mua), Compare-compact-section (So sánh kinh tế), landingCouponSection (Khối voucher ở ngoài trang chủ), Faq-section, Custom-clean-section (Thiết kế riêng). Đưa trực tiếp Danh mục sản phẩm (Catalog - id="catalog") và Giỏ hàng lên vị trí chính ngay dưới Topbar để khách hàng vào là có thể chọn sản phẩm và thực hiện mua ngay. Mã ưu đãi (Coupons) được chọn hoặc nhập trực tiếp bên trong Cart Drawer / Checkout Modal; đảm bảo mã nguồn JavaScript (storefront.js) không phát sinh lỗi khi landingCouponSection bị gỡ bỏ (hàm syncLandingCouponTicket có safe null-check).

### R2. Tách trang con độc lập cho FAQ (faq.html) và Dịch vụ thiết kế riêng (custom.html)
Chuyển toàn bộ nội dung FAQ (Câu hỏi thường gặp) thành trang con độc lập faq.html với header, footer đồng bộ và nội dung đầy đủ, chuẩn SEO. Chuyển khối "Thiết kế file riêng" thành trang con độc lập custom.html giới thiệu dịch vụ thiết kế theo yêu cầu cùng nút liên hệ tư vấn qua Zalo. Đồng bộ toàn bộ liên kết điều hướng trên Header Topbar, Mobile Nav Drawer và Footer của index.html trỏ chính xác sang faq.html và custom.html.

### R3. Nâng cấp trải nghiệm Giỏ hàng và bộ hiệu ứng chuyển động (Animation)
Giữ luồng mở Cart Drawer / Checkout Modal chỉ khi người dùng click vào icon giỏ hàng. Bổ sung nút Floating Action Button (FAB) Giỏ hàng hình tròn màu Mint ở góc dưới bên phải màn hình Mobile, chỉ hiện khi giỏ hàng có từ 1 sản phẩm trở lên. Khi người dùng bấm "Thêm vào giỏ", kích hoạt đồng bộ các hiệu ứng chuyển động: hiệu ứng bay sản phẩm (Fly-to-Cart) từ thẻ sản phẩm bay cong vào icon giỏ hàng, icon giỏ hàng trên Topbar và nút FAB thực hiện hiệu ứng Pop-Shrink (scale 1.25 -> 0.95 -> 1.0) kết hợp Wiggle nhẹ, cùng badge số lượng nảy sinh động (Bounce).

### R4. Bảo toàn tính toàn vẹn hệ thống và quy chuẩn kỹ thuật
Tuân thủ nghiêm ngặt các quy chuẩn của dự án trong AGENTS.md. Tuyệt đối không làm gián đoạn hoặc sai lệch luồng thanh toán tự động VietQR, tích hợp SePay và đồng bộ dữ liệu đơn hàng với Firebase Firestore.

## Verification Resources
- Script kiểm thử tự động / end-to-end do đội ngũ tự xây dựng để kiểm tra và xác thực: cấu trúc DOM trang index.html (đã lược bỏ các section không cần thiết, catalog nằm ngay dưới topbar), tính độc lập và điều hướng của faq.html và custom.html, kích hoạt animation và hiển thị FAB Mobile, an toàn không phát sinh lỗi JS trong storefront.js, và luồng tạo mã VietQR / Firestore.
- Mã nguồn và tài nguyên hiện có của hệ thống (index.html, storefront.js, firebase-config.js, AGENTS.md).

## Acceptance Criteria

### Landing Page Streamlining & Navigation
- [ ] Các section Hero, Stats, Steps, Compare-compact, landingCouponSection, FAQ và Custom-clean được gỡ bỏ hoàn toàn khỏi index.html.
- [ ] Danh mục sản phẩm (id="catalog") hiển thị ngay dưới Topbar trên index.html khi tải trang.
- [ ] storefront.js và hàm syncLandingCouponTicket hoạt động trơn tru không gây lỗi JavaScript console khi landingCouponSection không tồn tại trên index.html.
- [ ] Mã ưu đãi (coupons) vẫn hiển thị và áp dụng chính xác bên trong Cart Drawer / Checkout Modal.
- [ ] Tất cả liên kết FAQ và Thiết kế riêng trên Header Topbar, Mobile Nav Drawer và Footer của index.html trỏ chính xác đến faq.html và custom.html.

### Subpages Creation
- [ ] File faq.html tồn tại độc lập, có cấu trúc Header và Footer đồng bộ với index.html, nội dung FAQ đầy đủ, accordion đóng/mở mượt mà.
- [ ] File custom.html tồn tại độc lập, có cấu trúc Header và Footer đồng bộ với index.html, hiển thị dịch vụ thiết kế theo yêu cầu và nút liên kết Zalo hoạt động đúng.

### Cart Experience & Animation
- [ ] Cart Drawer / Checkout chỉ trượt mở khi người dùng click vào icon giỏ hàng (hoặc nút FAB).
- [ ] Nút FAB giỏ hàng màu Mint xuất hiện ở góc dưới bên phải màn hình Mobile khi giỏ hàng có >= 1 sản phẩm, và tự động ẩn khi giỏ hàng rỗng.
- [ ] Khi click "Thêm vào giỏ", hiệu ứng Fly-to-Cart bay hình ảnh/thẻ sản phẩm cong vào icon giỏ hàng diễn ra mượt mà.
- [ ] Icon giỏ hàng trên Topbar và FAB thực hiện hiệu ứng Pop-Shrink và Wiggle khi nhận sản phẩm mới.
- [ ] Badge hiển thị số lượng giỏ hàng thực hiện hiệu ứng Bounce khi cập nhật số lượng.

### System Integrity & Payments
- [ ] Luồng tạo mã VietQR thanh toán tự động hoạt động chính xác sau khi thêm/sửa/xóa sản phẩm và áp voucher.
- [ ] Trạng thái đơn hàng và đồng bộ dữ liệu Firestore không bị ảnh hưởng hay phát sinh lỗi.
- [ ] Script kiểm thử tự động / end-to-end do đội ngũ xây dựng thực thi và xác minh thành công toàn bộ các tiêu chí trên.
