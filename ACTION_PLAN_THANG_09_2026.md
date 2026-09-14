# Action plan tháng 9/2026 — ưu tiên file Tính Giá Cost đa ngành

Ngày lập: 14/09/2026. Cập nhật định hướng: tập trung hoàn thiện **một file Tính Giá Cost đa ngành** trước. Hai ý tưởng Tính Giá Bán và Điểm Hòa Vốn được giữ trong backlog, chỉ triển khai sau khi file Cost đã đúng, dễ dùng và được thử với khách. Hai file đang bán là Bán hàng online (30.000đ) và Quản lý kho mini (99.000đ).

## 1. Tính Giá Cost đa ngành — sản phẩm ưu tiên

**Câu hỏi khách hàng:** Một sản phẩm, món ăn, ly nước hoặc dịch vụ thực sự tốn bao nhiêu tiền để tạo ra?

**Bản nháp đang kiểm tra:** `outputs/tinh_cost_da_nganh_v1.xlsx` có ví dụ pha chế, món ăn, handmade, dịch vụ và bán lẻ. Bản này đã có quy đổi, hao hụt, định mức nhiều dòng, cost mỗi mẻ/đơn vị và kiểm tra dữ liệu. Chưa có size/topping linh hoạt, bán thành phẩm nhiều tầng hoặc phân bổ chi phí cố định; không niêm yết bản nháp trước khi hoàn thành kiểm thử trong kế hoạch.

- Lõi chung: danh mục đầu vào, đơn vị mua/sử dụng, quy đổi, công thức hoặc định mức theo sản phẩm, tỷ lệ hao hụt, bao bì, nhân công trực tiếp và chi phí khác có thể phân bổ.
- Kết quả: cost trực tiếp, cost bao bì, cost nhân công, chi phí chung phân bổ và cost tổng **mỗi đơn vị thành phẩm**; tách rõ khoản nào đã tính để tránh cộng trùng.
- Giá đầu vào thay đổi thì cost của mọi thành phẩm liên quan tự cập nhật.
- Có thể khai báo nhiều thành phẩm và nhiều biến thể/size. Với dịch vụ, cho phép định mức theo giờ công và vật tư sử dụng.
- Bộ dữ liệu mẫu và QC chuẩn lấy từ F&B: đồ uống nhiều size/topping, món ăn có sơ chế và hao hụt, nguyên liệu mua theo kg/lít nhưng dùng theo g/ml, bao bì và chi phí chung. Nếu các trường hợp này chạy đúng, kiểm tra thêm sản phẩm bán lẻ đóng gói, handmade và dịch vụ đơn giản.
- Giao diện nhập liệu không dùng thuật ngữ riêng của quán pha chế làm tên cột lõi. Ví dụ dùng `Đầu vào`, `Thành phẩm`, `Định mức`, `Đơn vị` thay vì chỉ `Nguyên liệu`, `Món`, `Ly`.
- Giữ giá bán tham khảo và tỷ lệ cost ở mức chỉ số phụ; logic **đề xuất giá bán** sẽ thuộc file riêng sau này.

### Ranh giới phiên bản đầu

- Bắt buộc: quy đổi đơn vị, định mức nhiều dòng, hao hụt, bao bì, nhân công trực tiếp, cost từng thành phẩm, dữ liệu mẫu dễ hiểu và hướng dẫn nhập.
- Có thể thêm sau: bán thành phẩm nhiều tầng, giá nguyên liệu theo lô, đa kho, phân bổ chi phí cố định phức tạp và đồng bộ tự động với file Quản lý kho.
- Không hứa “mọi ngành nghề”: ưu tiên F&B, hàng handmade/sản xuất nhỏ và dịch vụ có định mức rõ. Ngành có quy trình đặc thù cần kiểm chứng riêng.

## 2. Tính Giá Bán — backlog sau file Cost

**Câu hỏi khách hàng:** Bán giá nào để đạt biên lợi nhuận mong muốn?

- Nhận cost mỗi ly từ file Cost hoặc cho nhập thủ công để dùng độc lập.
- Nhập chi phí biến đổi khác, phí nền tảng/khuyến mãi và biên lợi nhuận mục tiêu.
- Đề xuất giá bán theo từng size/kênh bán; làm tròn giá dễ dùng trên menu.
- So sánh nhiều mức giá: lãi gộp mỗi ly, biên lợi nhuận, mức giảm giá tối đa và cảnh báo bán dưới cost.
- Phân biệt **markup trên cost** với **biên lợi nhuận trên doanh thu**; không dùng lẫn hai công thức.

## 3. Điểm Hòa Vốn — backlog sau file Cost

**Câu hỏi khách hàng:** Cần bán bao nhiêu ly và mất bao lâu để hòa vốn?

- Nhập vốn đầu tư ban đầu, chi phí cố định, số ngày mở bán, giá bán và chi phí biến đổi theo ly.
- Tính hòa vốn vận hành (bù chi phí cố định) và hoàn vốn đầu tư ban đầu thành hai chỉ tiêu riêng.
- Hiển thị số ly và doanh thu cần đạt cho toàn dự án, năm, tháng, tuần, ngày; các kỳ dùng cùng giả định về số ngày kinh doanh để đối chiếu được.
- Có kịch bản giá bán, lượng ly/ngày, tiền thuê hoặc cost nguyên liệu thay đổi.
- Cho nhập cơ cấu nhiều món hoặc dùng một giá bán/cost bình quân có ghi rõ giả định.

## Tiến độ còn lại của tháng 9

| Mốc | Việc cần hoàn thành | Điều kiện xong |
| --- | --- | --- |
| 14–17/09 | Chốt cấu trúc dữ liệu, định nghĩa cost và bộ ví dụ kiểm tra bằng tay | Có ví dụ đồ uống, món ăn, handmade và dịch vụ; các khoản cost không bị cộng trùng |
| 18–24/09 | Xây lõi file Cost đa ngành và kiểm tra F&B | Đổi giá đầu vào tự cập nhật cost; quy đổi, size/topping, hao hụt và bao bì tính đúng |
| 25–27/09 | Kiểm tra thêm ngành khác và sửa trải nghiệm nhập liệu | Người dùng không phải sửa công thức khi đổi từ F&B sang ngành khác |
| 28–30/09 | Hoàn thiện hướng dẫn, dữ liệu mẫu, QC, ảnh/demo và video thử nhu cầu | Có một file Cost phát hành được và ví dụ đối chiếu phép tính tay |

## Giá và kiểm chứng nhu cầu

- Chưa chốt giá file Cost. Giá hiện tại 30.000đ và 99.000đ là mốc tham chiếu nội bộ, không phải bằng chứng mức giá tối ưu.
- Trước khi niêm yết, so sánh tính năng với mẫu miễn phí và thử giá bằng đơn mua thực tế, không dựa riêng vào view/like vì video trước đã chạy Promote.
- Theo dõi video thử file Cost: người xem giữ lại ở giây đầu, lượt lưu, bình luận/tin nhắn xin file, lượt mở demo và đơn mua.
- Hook thử: “Ly 35k này thật ra tốn bao nhiêu tiền để làm?”; các con số demo phải khớp với file. Sau đó thử cùng cấu trúc với món ăn hoặc sản phẩm handmade để kiểm chứng thông điệp đa ngành.

## Thứ tự ưu tiên

Cost là dữ liệu gốc; Giá Bán dùng cost; Hòa Vốn dùng giá bán và cost. Tháng 9 chỉ cam kết sản phẩm Cost. Hai file còn lại giữ thiết kế độc lập trong backlog. Nếu trễ tiến độ, ưu tiên độ đúng của công thức và hướng dẫn trước dashboard trang trí.
