# Original User Request

## Initial Request — 2026-11-14T18:48:34Z

Tối ưu hóa UI/UX và logic luồng mã giảm giá (Coupon Flow) tại trang thanh toán (#thanh-toan) của File Đi Làm: tự động áp mã tốt nhất khi đủ điều kiện, thu gọn form nhập voucher khi chưa đủ điều kiện hoặc dùng mã riêng, và đảm bảo tương thích toàn diện với luồng thanh toán VietQR và Firestore.

Working directory: c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\FILE_DI_LAM_MVP
Integrity mode: development

## Requirements

### R1. Tự động áp dụng mã giảm giá tốt nhất khi đủ điều kiện (Auto-Apply Best Deal)
Khi giỏ hàng của khách đủ điều kiện của một mã giảm giá công khai (ví dụ đơn >= 20.000 đ đủ điều kiện mã FILEDILAM giảm 20%), hệ thống tự động áp mã giảm giá tốt nhất ngay khi vào trang thanh toán (#thanh-toan). Dòng giảm giá và tổng thanh toán tự động trừ tiền ngay, không bắt khách phải tự tay click 'Chọn mã'. Nút mã hiển thị trạng thái đã áp dụng kèm nút Bỏ chọn nếu khách muốn hủy; khi khách chủ động bấm Bỏ chọn, hệ thống ghi nhớ trạng thái này trong phiên hiện tại để không tự động áp lại ngay lập tức.

### R2. Thu gọn giao diện mã giảm giá khi chưa đủ điều kiện hoặc dùng mã riêng (Private / Secret Voucher)
Không bày sẵn cả khối danh sách mã khi đơn chưa đủ điều kiện hoặc khi không có mã công khai, tránh gây phân tâm hay tăng tỷ lệ bỏ giỏ hàng (Cart Abandonment). Thay vào đó, hiển thị một text link nhỏ gọn phẳng, tinh tế: "Bạn có mã ưu đãi?". Khi khách click vào text link "Bạn có mã ưu đãi?", bung nhẹ form/danh sách để nhập mã ưu đãi riêng (dành cho mã tặng qua Zalo, Livestream, Affiliate hoặc mã CSKH) hoặc chọn mã.

### R3. Kiểm thử toàn diện và tương thích luồng thanh toán VietQR và Firestore
Kiểm thử toàn diện và kiểm tra tính tương thích với toàn bộ luồng thanh toán VietQR (mã QR, số tiền chuyển khoản chính xác sau giảm giá, nội dung chuyển khoản) và ghi nhận đơn hàng lên Firestore. Đội ngũ tự viết script kiểm thử tự động / end-to-end để xác minh tính tương thích và vận hành chính xác của toàn bộ luồng.

## Verification Resources
- Script kiểm thử tự động / end-to-end do đội ngũ xây dựng để mô phỏng và xác minh các kịch bản giỏ hàng (đủ điều kiện auto-apply, chưa đủ điều kiện, nhập mã private, hủy mã) cùng luồng tạo mã VietQR và ghi đơn hàng Firestore.
- Mã nguồn hiện tại của trang thanh toán (`index.html`, `storefront.js`, `firebase-config.js`).

## Acceptance Criteria

### Auto-Apply Coupon Flow
- [ ] Khi giỏ hàng có tổng tiền đạt điều kiện áp dụng mã công khai, mã giảm giá tốt nhất được tự động áp dụng ngay khi chuyển sang trang thanh toán (#thanh-toan).
- [ ] Dòng giảm giá và tổng tiền thanh toán cuối cùng tự động hiển thị số tiền đã trừ ngay khi trang thanh toán được tải, không đòi hỏi người dùng phải bấm 'Chọn mã'.
- [ ] Nút/thẻ voucher hiển thị rõ trạng thái đã áp dụng cùng nút hoặc thao tác "Bỏ chọn" cho phép hủy mã.
- [ ] Khi người dùng bấm "Bỏ chọn" để hủy mã đã auto-apply, hệ thống ghi nhớ trạng thái này trong phiên làm việc hiện tại và không tự động áp lại mã đó trong cùng phiên.

### Private Voucher & Ineligible State UI/UX
- [ ] Khi giỏ hàng chưa đủ điều kiện của bất kỳ mã công khai nào hoặc không có mã công khai hợp lệ, khối danh sách mã không hiển thị mặc định mà chỉ hiển thị text link phẳng, nhỏ gọn: "Bạn có mã ưu đãi?".
- [ ] Khi người dùng click vào "Bạn có mã ưu đãi?", form nhập mã ưu đãi riêng và/hoặc danh sách voucher bung mở nhẹ nhàng, cho phép nhập mã chiến dịch riêng (Zalo, Livestream, Affiliate, CSKH) hoặc chọn mã.
- [ ] Khi người dùng nhập một mã ưu đãi riêng hợp lệ và xác nhận, hệ thống áp dụng giảm giá thành công và cập nhật lại dòng giảm giá cùng tổng thanh toán.

### VietQR & Firestore Compatibility
- [ ] Mã VietQR sinh ra trên giao diện thanh toán thể hiện chính xác số tiền cần chuyển khoản sau khi đã trừ giảm giá của mã voucher.
- [ ] Thông tin đơn hàng lưu vào Firestore ghi nhận đầy đủ và chính xác: mã voucher đã dùng, số tiền giảm giá và số tiền thanh toán thực tế.
- [ ] Script kiểm thử tự động / end-to-end thực thi thành công, bao phủ cả hai kịch bản (đủ điều kiện auto-apply và nhập mã private) với kết quả kiểm tra VietQR và Firestore đều đạt.
