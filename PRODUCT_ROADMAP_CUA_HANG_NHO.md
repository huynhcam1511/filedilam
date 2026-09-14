# Lộ trình sản phẩm cho cửa hàng nhỏ

Tài liệu này ghi lại hai sản phẩm độc lập dành cho cửa hàng nhỏ, hộ kinh doanh và người bán hàng online. Không gộp nghiệp vụ vận hành cửa hàng với nghiệp vụ tính định mức nguyên vật liệu trong cùng một file.

## Sản phẩm 1 — Bán Hàng & Lãi Lỗ Mini

### Mục tiêu

Một workbook vận hành đầy đủ cho cửa hàng nhỏ như quán đồ ăn, chân gà nướng, shop thời trang, mỹ phẩm, phụ kiện và người bán qua Facebook, TikTok, Zalo hoặc các đơn vị vận chuyển.

Chủ cửa hàng phải xem được:

- doanh thu theo ngày, tuần, tháng
- số đơn và giá trị đơn trung bình
- tiền mặt, chuyển khoản và COD
- trạng thái giao hàng và hoàn hàng
- phí ship khách trả, shop hỗ trợ và phí hoàn
- giá vốn hàng bán
- chi phí vận hành
- lợi nhuận gộp và lợi nhuận thực
- sản phẩm bán chạy và sản phẩm bán chậm
- công nợ COD chưa đối soát

### Cấu trúc workbook dự kiến

1. `0_BẮT_ĐẦU`
2. `1_ĐƠN_HÀNG`
3. `2_CHI_TIẾT_ĐƠN`
4. `3_CHI_PHÍ`
5. `4_SHIP_COD`
6. `5_SẢN_PHẨM_GIÁ_VỐN`
7. `6_KHÁCH_HÀNG`
8. `7_LÃI_LỖ`
9. `8_DASHBOARD_BÁN_HÀNG`
10. `9_DASHBOARD_LỢI_NHUẬN`
11. `10_DASHBOARD_SHIP_COD`
12. `11_DASHBOARD_SẢN_PHẨM`
13. `12_DANH_MỤC`
14. `13_HỆ_THỐNG` — ẩn và bảo vệ

### Yêu cầu bắt buộc về dashboard

Workbook phải có ít nhất bốn trang dashboard riêng, được thiết kế đẹp, đồng bộ và dễ đọc trên màn hình laptop:

#### Dashboard 1 — Bán hàng

- doanh thu
- số đơn
- giá trị đơn trung bình
- tỷ lệ hoàn thành đơn
- xu hướng doanh thu theo thời gian
- doanh thu theo kênh bán

#### Dashboard 2 — Lợi nhuận

- doanh thu thuần
- giá vốn
- lợi nhuận gộp
- tổng chi phí
- lợi nhuận thực
- biên lợi nhuận
- xu hướng lợi nhuận theo thời gian

#### Dashboard 3 — Ship và COD

- đơn đang giao
- đơn giao thành công
- đơn hoàn
- tỷ lệ hoàn
- COD chờ đối soát
- COD đã nhận
- tổng phí ship shop chịu
- hiệu quả theo đơn vị vận chuyển

#### Dashboard 4 — Sản phẩm

- sản phẩm bán chạy
- sản phẩm mang lại lợi nhuận cao
- sản phẩm bán chậm
- doanh thu theo nhóm hàng
- số lượng bán theo sản phẩm
- tỷ trọng doanh thu và lợi nhuận

Các dashboard phải có bộ lọc thời gian hoặc vùng chọn kỳ báo cáo phù hợp. Mỗi dashboard cần KPI cards, biểu đồ và bảng xếp hạng; không làm bốn trang giống nhau chỉ thay tiêu đề.

### Nguyên tắc tính toán

- Người dùng chỉ nhập dữ liệu gốc; các kết quả phải được tính bằng công thức.
- Tách rõ `KHU NHẬP LIỆU` và `KHU TỰ TÍNH`.
- Không hard-code giá, tỷ lệ hoặc phí trong công thức; các giả định phải nằm trong bảng cấu hình.
- Lợi nhuận thực của đơn phải trừ giá vốn, giảm giá, phí nền tảng, phí đóng gói, phần phí ship shop chịu và phí hoàn nếu có.
- COD chỉ được coi là đã thu khi đã đối soát hoặc xác nhận nhận tiền.
- Đơn hủy không được tính vào doanh thu thực.
- Đơn hoàn phải đảo doanh thu và xử lý đúng phần phí không được hoàn lại.
- Mọi dashboard phải truy ngược được về dữ liệu chi tiết.

## Sản phẩm 2 — Tính Giá Cost & Định Mức Nguyên Vật Liệu

Đây là một sản phẩm riêng, triển khai sau khi hoàn thiện sản phẩm Bán Hàng & Lãi Lỗ Mini.

### Đối tượng

- quán ăn và đồ ăn vặt
- cà phê, trà sữa và nước uống
- tiệm bánh
- bếp online
- cơ sở sản xuất nhỏ
- sản phẩm handmade hoặc sản phẩm có công thức nguyên liệu

### Mục tiêu

Tính đúng giá cost của một món hoặc một đơn vị thành phẩm từ định mức nguyên vật liệu.

Ví dụ với một ly nước:

- lượng trà, sữa, đường và topping sử dụng
- giá mua theo kg, lít, hộp hoặc gói
- quy đổi về gram, ml hoặc phần dùng thực tế
- hao hụt nguyên liệu
- chi phí ly, nắp, ống hút, túi và tem
- chi phí nhân công phân bổ
- điện, nước và chi phí chung phân bổ
- tổng giá cost một ly
- giá bán đề xuất
- lợi nhuận và biên lợi nhuận dự kiến

### Cấu trúc workbook dự kiến

1. `0_BẮT_ĐẦU`
2. `1_NGUYÊN_VẬT_LIỆU`
3. `2_ĐƠN_VỊ_QUY_ĐỔI`
4. `3_ĐỊNH_MỨC_MÓN`
5. `4_BAO_BÌ_PHỤ_PHÍ`
6. `5_CHI_PHÍ_CHUNG`
7. `6_GIÁ_COST`
8. `7_GIÁ_BÁN_ĐỀ_XUẤT`
9. `8_DASHBOARD_COST`
10. `9_DANH_MỤC`
11. `10_HỆ_THỐNG` — ẩn và bảo vệ

### Nguyên tắc sản phẩm

- Một nguyên vật liệu có thể được mua theo đơn vị lớn nhưng sử dụng theo đơn vị nhỏ.
- Quy đổi đơn vị phải minh bạch và có thể kiểm tra.
- Giá nguyên liệu thay đổi phải tự cập nhật giá cost của mọi món liên quan.
- Có tỷ lệ hao hụt riêng theo nguyên liệu hoặc công đoạn.
- Tách giá cost trực tiếp, chi phí bao bì và chi phí chung phân bổ.
- Cho phép nhập biên lợi nhuận mục tiêu để đề xuất giá bán.
- Có cảnh báo món bán dưới giá cost hoặc biên lợi nhuận quá thấp.

## Thứ tự triển khai đã chốt

1. Hoàn thiện đặc tả và xây `Bán Hàng & Lãi Lỗ Mini`.
2. Kiểm tra công thức, dữ liệu mẫu và đủ bốn dashboard đẹp.
3. Chạy QC và tạo bản demo bán hàng.
4. Sau khi sản phẩm 1 ổn định, xây `Tính Giá Cost & Định Mức Nguyên Vật Liệu` thành file độc lập.

