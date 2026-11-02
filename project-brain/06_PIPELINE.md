# Pipeline

Nguồn pipeline sản xuất chính: `../PIPELINE_FILE_DI_LAM_FACTORY.md`. File Project Brain này chỉ ghi phần áp dụng cho Cost Web App, không thay thế tài liệu chính.

## V10: bắt buộc với sản phẩm bán bằng Google Sheet /copy

Nhà sản xuất tạo file mẫu riêng → tạo host USER_ACCESSING → deploy host một lần → nhúng URL host vào bound launcher → gắn launcher sẵn vào file mẫu → thử /copy trên trình duyệt → xác nhận menu tự có → cấp quyền lần đầu → đối chiếu dữ liệu được ghi vào bản sao, master không đổi. Chỉ sau đó chuẩn bị quyền xem/link giao cho khách.

Khách không đi qua pipeline phát triển: không Apps Script editor, không dán code, không deploy, không điền /exec. “Có Apps Script gắn file” không đồng nghĩa tiện ích Marketplace. OAuth verification/cảnh báo Google là một cổng nghiệm thu riêng.

Source → inspect existing Smart GAS shell → define product boundary and new Spreadsheet ID → build normalized schema → implement pure cost engine → reuse proven sidebar/layout components → wire repository services → static validation → calculation/CRUD tests → deploy a versioned Apps Script Web App → browser verification → update Project Brain.

## Fast production rules

1. Never start with a disposable dashboard. First copy the proven Smart GAS shell and navigation.
2. Never write production IDs into temporary code until the new product Spreadsheet ID exists.
3. Build a minimal vertical slice first: material → batch → finished product → dashboard propagation.
4. Keep UI, service, engine and repository separate so a visual change cannot silently change costing.
5. Every button in the sidebar must map to a real function before visual polish is called complete.
6. Deploy only after the `/exec` URL exists; guard launcher code against `/null`.
7. Test in a separate spreadsheet, then verify persistence after refresh and real browser interaction.
8. Record actual evidence and current gaps; never call a placeholder screen a finished product.
