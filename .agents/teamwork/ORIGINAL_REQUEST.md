# Original User Request

## Approved Task Prompt — 2026-11-16T13:15:12Z

Đồng bộ toàn diện website File Đi Làm thành một thể thống nhất giữa các trang (index.html, faq.html, custom.html) theo chuẩn giao diện thương hiệu Fintech cao cấp trong AGENTS.md, loại bỏ mục "Trang chủ" trên navigation bar ở tất cả các trang, thiết kế hoàn thiện chuyên sâu cho các trang con, kiểm tra tính toàn vẹn và deploy lên Firebase Hosting.

Working directory: c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\FILE_DI_LAM_MVP
Integrity mode: development

## Requirements

### R1. Bỏ chữ "Trang chủ" trên navigation bar ở tất cả các trang
Loại bỏ liên kết "Trang chủ" khỏi thanh điều hướng (Header Topbar và Mobile Drawer) trên tất cả các trang (`index.html`, `faq.html`, `custom.html`), vì logo File Đi Làm đã đảm nhiệm chức năng liên kết về trang chủ.

### R2. Đồng bộ nhận diện thương hiệu, hệ thống thiết kế và giao diện cốt lõi
Đồng bộ toàn bộ layout, Header/Topbar, Footer, Typography (Manrope / Plus Jakarta Sans), bảng màu Mint Fintech (`#059669`, `#10b981`, slate tones, border `#e2e8f0`), hệ thống icon Lucide Icons nét mảnh, phong cách thẻ (card styling), và quy chuẩn nút bấm (chiều cao 46px, bo góc `rounded-xl`) xuyên suốt giữa `index.html`, `faq.html`, và `custom.html` theo chuẩn AGENTS.md.

### R3. Chia sẻ cấu trúc Layout, Topbar Navigation và Footer chung
Cả 3 trang (`index.html`, `faq.html`, `custom.html`) chia sẻ cùng một cấu trúc layout, thanh điều hướng Topbar đồng nhất (Logo, "Mẫu File Đi Làm", "Hỏi đáp", "Thiết kế file riêng", icon giỏ hàng, nút menu drawer 3 gạch trên mobile) và chân trang Footer đồng nhất về nhận diện thương hiệu (thông tin liên hệ, mạng xã hội, liên kết dịch vụ, liên kết chính sách).

### R4. Thiết kế chỉn chu, có chiều sâu cho trang FAQ và Thiết kế file riêng
Nâng cấp trang `faq.html` và `custom.html` thành các trang nội dung hoàn chỉnh, có chiều sâu, trải nghiệm như một website SaaS / Fintech thương mại điện tử chuyên nghiệp thực thụ của thương hiệu FILE ĐI LÀM theo quy chuẩn AGENTS.md; tuyệt đối không làm hời hợt hoặc lệch pha về trải nghiệm so với trang chủ.

### R5. Kiểm thử và Triển khai lên Firebase Hosting
Kiểm tra tính toàn vẹn của các trang, đảm bảo không có lỗi JavaScript console, luồng giỏ hàng và thanh toán hoạt động bình thường, sau đó deploy bản hoàn thiện lên Firebase Hosting (`filedilam.web.app`).

## Verification Resources
- Script kiểm thử tự động do đội ngũ xây dựng để kiểm tra và xác thực: tính nhất quán của cấu trúc DOM và CSS giữa 3 trang (Header/Topbar, Footer, không có mục "Trang chủ", logo link về trang chủ), không phát sinh lỗi JavaScript console, hiển thị tốt trên responsive (Desktop & Mobile), và trạng thái triển khai thành công lên Firebase Hosting.
- Toàn bộ mã nguồn hiện tại của dự án trong `c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\FILE_DI_LAM_MVP` và quy chuẩn thương hiệu trong `AGENTS.md`.

## Acceptance Criteria

### Navigation & Brand Consistency
- [ ] Chữ "Trang chủ" được gỡ bỏ khỏi navbar (cả Header Topbar và Mobile Drawer) trên cả `index.html`, `faq.html`, và `custom.html`.
- [ ] Click vào logo File Đi Làm trên mọi trang đều chuyển hướng chính xác về trang chủ (`index.html`).
- [ ] Cả 3 trang (`index.html`, `faq.html`, `custom.html`) chia sẻ cùng cấu trúc Header/Topbar và Footer: các liên kết "Mẫu File Đi Làm", "Hỏi đáp", "Thiết kế file riêng", icon giỏ hàng, menu drawer mobile, thông tin liên hệ và chính sách hoạt động chính xác và đồng nhất.
- [ ] Toàn bộ 3 trang sử dụng đồng nhất Typography (Manrope / Plus Jakarta Sans), bảng màu Mint Fintech (`#059669`, `#10b981`, slate tones, border `#e2e8f0`), Lucide Icons nét mảnh, và quy chuẩn nút bấm (cao 46px, bo góc `rounded-xl`).

### Secondary Pages Quality (faq.html & custom.html)
- [ ] Trang `faq.html` được thiết kế có chiều sâu, nội dung câu hỏi thường gặp đầy đủ, phân loại rõ ràng, giao diện accordion đóng/mở mượt mà theo đúng chuẩn Fintech.
- [ ] Trang `custom.html` được thiết kế chuyên nghiệp, thể hiện chi tiết dịch vụ thiết kế theo yêu cầu, khối thông tin và bảng quy trình trực quan, nút liên hệ tư vấn rõ ràng.

### Verification & Deployment
- [ ] Script kiểm thử tự động do đội ngũ xây dựng thực thi thành công, xác nhận DOM và CSS đồng bộ giữa các trang, không có lỗi JavaScript console trên cả desktop và mobile.
- [ ] Toàn bộ website được deploy thành công lên Firebase Hosting (`filedilam.web.app`) và kiểm tra truy cập ổn định trên môi trường live.
