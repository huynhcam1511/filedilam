# Kế hoạch nâng cấp — Tính Giá Cost đa ngành

Ngày lập: 14/09/2026. Trạng thái `outputs/tinh_cost_da_nganh_v1.xlsx`: **prototype kỹ thuật, không phải sản phẩm bán**. Bản hiện tại mới chứng minh quy đổi và cộng định mức, thiếu trải nghiệm nhập liệu, chiều sâu nghiệp vụ, dashboard và QC theo chuẩn File Đi Làm.

**Tiến độ 14/09:** đã xuất `outputs/tinh_cost_da_nganh_v2.xlsx` để xem xét. Bản v2 có trang Bắt đầu hướng dẫn, dashboard 4 KPI/6 biểu đồ, 1.000 đầu vào, 5.000 dòng định mức, 500 thành phẩm, dropdown và khóa ô tới dòng cuối, ví dụ size/topping, sơ chế một tầng, chi phí chung phân bổ. QC trong Microsoft Excel đạt với 0 lỗi công thức, thử đổi giá, sai đơn vị và nhập ở dòng cuối. V2 **chưa niêm yết**; cần thử người dùng mới và xác nhận giao diện dropdown/khả năng dùng trên nền tảng giao file cuối trước khi phát hành.

## Định vị và ranh giới

Một file tính **cost một đơn vị thành phẩm/dịch vụ** cho hộ kinh doanh nhỏ: pha chế, món ăn, handmade, hàng đóng gói/bán lẻ và dịch vụ có định mức. F&B là bộ kiểm thử khó nhất *trong phạm vi này*, không khẳng định bao quát mọi ngành. File Giá Bán và Điểm Hòa Vốn vẫn là hai sản phẩm riêng; file Cost chỉ có ô giá bán tham khảo để đọc tỷ lệ cost, không đề xuất giá hoặc tính hòa vốn.

## Chuẩn tối thiểu trước khi gọi là sản phẩm

1. **Bắt đầu để khách làm được:** trang `0_BẮT_ĐẦU` nêu 3 bước thiết lập/nhập/xem kết quả, có ví dụ một món hoàn chỉnh, chú giải màu, đường dẫn tới đúng sheet và chỉ dẫn khi thiếu dữ liệu. Cách xóa dữ liệu mẫu phải an toàn. Không bắt khách đọc công thức.
2. **Nhập ít, không sửa công thức:** danh mục nguồn chung; chọn mã bằng dropdown đẹp, nhãn dễ hiểu và ô đã chọn có màu/trạng thái rõ; khu nhập bên trái, khu tự tính bên phải. Tất cả dòng trong sức chứa công bố phải có sẵn dropdown, công thức, định dạng và bảo vệ; khách không kéo công thức. Tách bản sạch để khách dùng và bản demo đủ dữ liệu để quay video.
3. **Tính đúng, truy ngược được:** từ cost thành phẩm → dòng định mức → cost đầu vào → giá mua, hệ số quy đổi và hao hụt. Không giấu lỗi mã trùng, thiếu giá, sai đơn vị hoặc mẻ ra 0 thành phẩm bằng số 0 giả.
4. **Thiết kế thương mại:** dùng token thương hiệu, font, màu nhập/tự tính/cảnh báo, độ rộng cột và bố cục đồng nhất. Chỉ mở khóa ô khách nhập; khóa công thức, dashboard và vùng hệ thống. Kiểm tra bảo vệ bằng thử sửa một ô nhập và một ô công thức.
5. **Tổng quan là dashboard chỉ xem:** có **ít nhất 4 KPI và 6 biểu đồ khác chức năng**: cơ cấu cost theo nhóm chi phí; top thành phẩm cost cao; cost trực tiếp so với cost đầy đủ; cost theo ngành/nhóm; nhóm đầu vào ảnh hưởng lớn nhất; và độ nhạy cost khi giá đầu vào biến động (hoặc xu hướng giá nếu có dữ liệu theo kỳ). Có bộ lọc, cảnh báo và insight ngắn; không đặt hướng dẫn dài hoặc ô nhập nghiệp vụ tại đây. Mọi số phải truy ngược được.
6. **Chất lượng phát hành:** build bằng factory, version/timestamp, `.manifest.json`, `.qc.json`, kiểm tra công thức và dữ liệu mẫu, render/soát hình từng sheet; QC không đạt thì không publish.

Các tiêu chuẩn này lấy từ `FILE_DI_LAM_BRAND.json`, `PIPELINE_FILE_DI_LAM_FACTORY.md` và phần sản phẩm Cost trong `PRODUCT_ROADMAP_CUA_HANG_NHO.md`.

## Mô hình nghiệp vụ cần có

| Khối | Yêu cầu cụ thể | Kiểm thử F&B |
| --- | --- | --- |
| Đầu vào | Giá mua theo quy cách; quy đổi kg→g, lít→ml, thùng→cái; hao hụt khi sơ chế; lịch sử giá hoặc ngày hiệu lực đơn giản | 1 kg gà sau sơ chế còn 850 g dùng được |
| Bán thành phẩm | Pha/sơ chế một mẻ rồi dùng làm đầu vào món khác; tối thiểu một tầng, chặn vòng lặp | 1 mẻ trà nền ra 2 lít, dùng 150 ml/ly |
| Định mức | Nhiều nguyên liệu/dòng công việc; định mức theo một mẻ; size/biến thể dùng mã thành phẩm riêng và có thể sao chép định mức | Trà sữa size M/L, topping thêm hoặc bỏ |
| Bao bì & lao động | Ly/nắp/ống hút, hộp/túi; công trực tiếp theo phút/giờ; tránh nhập cùng khoản ở hai nơi | 1 ly mang đi và 1 suất cơm hộp |
| Chi phí chung | Chọn cơ sở phân bổ rõ ràng (theo mẻ, số đơn vị hoặc giờ công); hiển thị riêng cost trực tiếp và cost đầy đủ | Điện/nước phân bổ theo mẻ, không cộng trùng giá điện ở đầu vào |
| Kết quả | Cost mỗi mẻ, mỗi đơn vị, theo nhóm chi phí; tỷ lệ cost nếu nhập giá bán tham khảo; trạng thái đủ/thiếu dữ liệu | Đổi giá sữa, cost mọi size liên quan đổi đúng |

## Cấu trúc workbook dự kiến

`0_BẮT_ĐẦU` → `1_DASHBOARD_COST` → `2_THÀNH_PHẨM` → `3_ĐỊNH_MỨC` → `4_BÁN_THÀNH_PHẨM` → `5_ĐẦU_VÀO` → `6_CHI_PHÍ_CHUNG` → `7_PHÂN_TÍCH_COST` → `8_KIỂM_TRA` → `9_DANH_MỤC` → `10_HỆ_THỐNG` (ẩn). Nếu một tab không có vai trò rõ khi triển khai thì gộp, không tạo tab cho đủ số lượng.

**Vai trò giao diện:** `0_BẮT_ĐẦU` là hành trình hướng dẫn để người mới làm đúng; `1_DASHBOARD_COST` là trang Tổng quan chỉ để theo dõi và ra quyết định. Dropdown có màu/chip cho ô đã chọn, lựa chọn ngắn và rõ, thông báo khi chọn sai. Phần popup của dropdown do Excel/Google Sheets hiển thị nên phải kiểm thử trên nền tảng đích; không hứa tùy biến giao diện popup vượt khả năng ứng dụng.

**Sức chứa bản bán dự kiến:** `THÀNH_PHẨM` 500 dòng, `ĐẦU_VÀO` 1.000 dòng, `ĐỊNH_MỨC` 5.000 dòng, `BÁN_THÀNH_PHẨM` 1.000 dòng, `CHI_PHÍ_CHUNG` 500 dòng. Đây là vùng làm việc được chuẩn bị sẵn, không phải chỉ có 5–10 dòng ví dụ. Sức chứa cuối cùng phải được thử hiệu năng trong Excel/Google Sheets đích; nếu gây chậm, điều chỉnh theo đo đạc và công bố rõ trên trang bắt đầu, không âm thầm cắt dòng.

## Thứ tự triển khai và cổng kiểm tra

1. **Đặc tả và mẫu đối chiếu:** chốt định nghĩa cost trực tiếp/cost đầy đủ; tính tay ít nhất 2 món F&B, 1 handmade, 1 dịch vụ và 1 hàng nhập. Chốt quy tắc hao hụt để không tính hai lần.
2. **Lõi tính:** đưa vào `file_di_lam_factory/templates/tinh_cost_da_nganh/` theo cấu trúc config, sample data, formulas, validations, dashboard, QC, builder. Kiểm tra thay đổi giá, số lượng mẻ, hao hụt và đơn vị.
3. **UX và dashboard:** làm luồng nhập trong 3 bước; phủ dropdown, công thức và màu cho toàn bộ sức chứa, kể cả dòng cuối và dòng mới chưa có dữ liệu. Dashboard có ít nhất 4 KPI và 6 biểu đồ có ý nghĩa, dễ đọc trên laptop. Render từng sheet và sửa chỗ tràn chữ, số khó đọc, ô nhập khó phân biệt.
4. **QC & phát hành:** kiểm thử giá bằng 0 hợp lệ, ô trống, mã trùng, mã không tồn tại, sai đơn vị, mẻ bằng 0, bán thành phẩm vòng lặp, đổi giá đầu vào, dòng đầu/giữa/cuối sức chứa, dropdown ở dòng cuối, khóa ô công thức và làm sạch dữ liệu mẫu. Xuất workbook, manifest và QC; mở bằng Excel/Google Sheets đích để kiểm tra công thức, dropdown, biểu đồ và bảo vệ trước khi niêm yết.

## Điều kiện hoàn thành

- Người mới có thể nhập một món/size mới mà không sửa công thức.
- 5 ví dụ đối chiếu phép tính tay khớp đến đơn vị tiền được chọn; đổi giá đầu vào cập nhật đúng toàn bộ sản phẩm liên quan.
- Không có lỗi công thức; mọi trường hợp thiếu/sai dữ liệu hiện cảnh báo rõ và không hiện cost 0 giả.
- Dashboard có ít nhất 4 KPI và 6 biểu đồ khác chức năng, có insight và truy ngược được; bản demo đẹp đủ quay video, bản sạch sẵn cho khách dùng.
- Mọi sheet nhập/khai báo có dropdown dễ đọc, ô chọn đẹp, công thức, màu và khóa/mở khóa đúng đến dòng cuối sức chứa đã công bố; không cần thao tác kéo công thức.
- Người mới hoàn thành một món theo `0_BẮT_ĐẦU` mà không cần hỗ trợ; `1_DASHBOARD_COST` chỉ hiển thị kết quả, cảnh báo và góc nhìn quản trị.
- QC pass, có phiên bản/manifest và hướng dẫn; chỉ sau đó mới bàn giá bán và đưa lên storefront.
