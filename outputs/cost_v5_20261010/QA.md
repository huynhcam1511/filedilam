# Cost món v5 — phạm vi kiểm tra

Ngày: 10/10/2026. Bản kiểm tra, chưa xác nhận sẵn sàng bán hoặc tương thích đầy đủ Google Sheets.

## Đã thực hiện

- Tạo bằng artifact-tool, tính lại công thức, xuất XLSX và xem preview cả 6 sheet (hai khu vực riêng của MẺ).
- Excel desktop qua COM: 30 phép kiểm tra trong `native_qc.json` đạt. Có đối chiếu độc lập món trực tiếp và món dùng hai mẻ, đổi giá, thiếu giá, thiếu định lượng, lượng 0, trùng mã, đổi tên, xóa mã đang dùng, mẻ sai lượng thu, chặn mẻ nhiều tầng, giá 0 hợp lệ, nhập dòng cuối, cập nhật top biểu đồ, sắp xếp toàn bảng và lưu/mở lại.
- Sức chứa: 200 nguyên liệu/bao bì, 20 mẻ, 200 dòng thành phần mẻ, 60 món và 600 dòng thành phần món. Mẫu: 50 nguyên liệu/bao bì, 2 mẻ, 13 món.
- Cột hệ thống ẩn, công thức khóa và vùng nhập mở khóa. Bảo vệ sheet không đặt mật khẩu. Khi cần sắp xếp bảng chứa công thức, bỏ bảo vệ sheet, sắp cả bảng rồi bảo vệ lại; dùng bộ lọc nếu chỉ cần tìm món.
- Các bổ sung qua Excel COM giới hạn ở tính năng native chưa có trong bề mặt API artifact được tra cứu: bảo vệ/mở khóa ô, ẩn cột hỗ trợ, AutoFilter, cấu hình thông báo validation và biểu đồ đọc nguồn ẩn. Công thức và nội dung được tạo trong builder artifact.

## Chưa xác minh

- Đã thử mở Excel qua công cụ giao diện. Công cụ báo phần tử không có trong cached app state; thao tác nhập đường dẫn vào hộp Open không cho kết quả xác nhận. Dừng thử giao diện, không đánh dấu dropdown đã chọn được.
- `Validation.Type` và `Validation.Value` qua COM kiểm tra rule và giá trị hợp lệ, không thay thế mở popup và chọn thật. Còn phải thử từng loại dropdown ở đầu/giữa/cuối vùng, mục đầu/cuối và mục mới.
- Chưa kiểm tra Google Sheets (cả chế độ XLSX và native); chưa đưa file lên Drive hay phát hành.
- Preview đã xem không thay thế đầy đủ việc dùng file xuất cuối trên giao diện ứng dụng. Cần kiểm tra thao tác và hiển thị native trước khi gọi đây là bản bán.

## Giới hạn sản phẩm

- Mẻ một tầng, không có kho, FIFO hoặc lịch sử giá theo lô. Giá thay đổi cập nhật cost hiện tại, không giữ cost lịch sử.
- Bao bì tách trong kết quả, dùng chung bảng thành phần theo nhóm; không còn giới hạn 5 nguyên liệu mỗi món.
- Giá bán là tham khảo nhập tay; tiền còn lại chưa phải lợi nhuận ròng. Chưa có module giá bán mục tiêu hoặc phí theo phần trăm.
- Hai biểu đồ thể hiện top 8 cost và thành phần cost của nhóm đó; bảng bên dưới bao phủ mọi món trong sức chứa. Không hứa có 6 biểu đồ.
