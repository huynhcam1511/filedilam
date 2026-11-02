# File Đi Làm Factory — bản đồ sản xuất

Đọc `../system_filedilam.md`, `../AGENTS.md` trước khi làm sản phẩm. Tài liệu này chỉ chỉ ra thành phần và lệnh hiện có; không tạo bộ quy tắc thay thế.

**Pipeline sản xuất chính: `../PIPELINE_FILE_DI_LAM_FACTORY.md`.** Đọc file đó trước khi build/deploy. Các bước dưới đây là bản đồ công cụ tham chiếu, không phải một pipeline chuẩn khác.

## Hai loại đầu ra

| Sản phẩm | Pipeline hiện có | Trạng thái |
| --- | --- | --- |
| Workbook | cli.py → core/build.py → template assets → QC → manifest | Đã có factory workbook; chỉ các template trong registry được CLI hỗ trợ |
| Google Sheets + Apps Script /copy | File mẫu → shared host → bound launcher → deploy → kiểm thử bản sao | V10 là triển khai tham chiếu riêng; chưa tích hợp thành lệnh CLI factory chung |

## Luồng sản xuất Apps Script để tái sử dụng

Nguồn tham chiếu: `../outputs/fnb_cost_v10/`.

1. Xác định nghiệp vụ, schema và UI; tái dùng shell/component tốt đã có. Giữ schema, engine, services và giao diện tách biệt.
2. Tạo Google Sheet mẫu sản phẩm mới với dữ liệu demo, trang bắt đầu và bảng dữ liệu phụ trợ. Giữ bản cũ.
3. Build host từ `Host.gs`, `UiServices.gs`, `WebApp.html`; host manifest dùng USER_ACCESSING.
4. Deploy host bằng tài khoản nhà sản xuất. Ghi URL /exec thực tế, project ID và version vào hồ sơ phiên bản; không ghi token vào repo.
5. Gắn `BoundLauncher.gs` vào chính file mẫu. Nhà sản xuất điền URL host và ID mẫu trước khi giao khách; khách không cấu hình gì.
6. Cung cấp link /copy của file mẫu. Google sao chép script bound cùng file; menu lấy ID bản sao đang mở rồi truyền vào URL và từng RPC.
7. Chạy các cổng nghiệm thu bên dưới. Chỉ chuẩn bị phát hành sau khi có bằng chứng live.

## Công cụ V10 hiện tại

- `build.cjs`: tạo UI/manifest, kiểm tra cú pháp.
- `test-tenancy.cjs`: định tuyến hai bản sao, chặn thiếu ID/quyền/RPC không hợp lệ, không fallback master.
- `deploy.py`: upload/deploy host và gắn launcher; đọc thông tin OAuth từ profile clasp ngoài repo. Lệnh dành cho nhà sản xuất.
- `verify_remote.py`: đọc lại source/manifest từ API và ghi bằng chứng. Có các quan sát browser được ghi riêng, không coi API readback là đã thao tác UI.
- `deployment.json`, `verification.json`: hồ sơ phiên bản và giới hạn đã kiểm tra.

Lưu ý tái tạo: V10 tạo Sheet qua Google Drive connector do Sheets API trong OAuth project hiện tắt. deploy.py không phải bootstrap hoàn toàn từ repo trống; cần file mẫu đã khởi tạo và deployment.json đúng sản phẩm. Không copy nguyên deployment.json của V10 để tạo sản phẩm khác vì sẽ trỏ vào sản phẩm đã có.

## Cổng chất lượng trước khi giao link /copy

- [ ] Source không chứa token, URL tạm hoặc placeholder chưa thay.
- [ ] Bound launcher thực sự gắn trong file mẫu, không chỉ tồn tại local.
- [ ] Host đúng quyền người dùng và mọi request xác định đúng bản sao.
- [ ] Browser tạo bản sao thật; menu tự xuất hiện.
- [ ] Cấp quyền và mở Web App từ menu thành công.
- [ ] CRUD, tính toán, refresh persistence được xác minh trên bản sao.
- [ ] Hai bản sao không ghi chéo; template/master không bị sửa.
- [ ] Quyền xem file mẫu và cổng OAuth phù hợp phạm vi bán đã được chủ sản phẩm quyết định.
- [ ] Project Brain ghi đúng đã làm / đã test / chưa test.

Không biến checklist dự kiến thành PASS. Trạng thái V10 hiện tại: đã tạo/deploy, xác minh script đi theo bản sao và menu tự có; bước OAuth, ghi dữ liệu live và tài khoản khách khác chưa hoàn tất.
