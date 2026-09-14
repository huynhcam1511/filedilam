# Pipeline File Đi Làm Factory

## Mục tiêu

Tạo một factory làm file Excel/Google Sheets thương mại theo hướng:

- mở file là hiểu
- ít cột nhập
- màu đồng bộ
- dashboard rõ
- có dữ liệu mẫu để quay demo
- có QC tự động
- không ghi đè file cũ

## Kiến trúc hiện tại

```text
file_di_lam_factory/
  core/
    build.py
    design_system.py
    loader.py
    models.py
    versioning.py
    workbook.py
  design_systems/
    file_di_lam_default.json
    pastel_feminine_spring.json
    corporate_clean_blue.json
    neutral_beige_soft.json
  templates/
    registry.py
    shop_online_mini/
      config.json
      sample_data.json
      formulas.py
      validations.py
      dashboard.py
      qc.py
      builder.py
```

## Luồng build

1. Chọn template trong `registry.py`
2. Nạp:
   - `config.json`
   - `sample_data.json`
   - design preset
3. Dựng workbook bằng `builder.py`
4. Gắn:
   - công thức
   - dropdown
   - màu
   - protection
   - dashboard
5. Export ra `outputs/<template_id>/`
6. Chạy QC
7. Ghi:
   - `.xlsx`
   - `.qc.json`
   - `.manifest.json`
8. Nếu chạy với `--publish` và QC đạt:
   - đọc metadata bán hàng trong `config.json`
   - cập nhật `storefront-products.generated.js` theo `product id`
   - trỏ `fileUrl` tới đúng bản Excel vừa build
   - reload localhost để sản phẩm mới/cập nhật xuất hiện trên web

## Quy tắc UX đang chốt

- Sheet đầu `0_BẮT_ĐẦU` chỉ để đọc và setup
- Sheet danh mục `5_DANH_MỤC` là nơi sửa dữ liệu gốc nếu cần
- Sheet nhập vận hành:
  - cột nhập nằm bên trái
  - cột tự tính gom sang phải
- Mã đơn và mã giao dịch tự sinh
- Sheet nội bộ `6_HỆ_THỐNG` ẩn
- Dashboard là sheet chỉ xem

## Quy tắc dữ liệu mẫu để quay nội dung

- Không bắt buộc mọi file bán hàng đều chứa dữ liệu mẫu dày.
- Duy trì một file chuyên dùng để quay demo và tái sử dụng cho nhiều video.
- File quay demo chỉ cần 2–3 sheet dữ liệu lớn, ưu tiên các sheet có thể quét màn hình đẹp như Sản phẩm, Nhập kho và Xuất kho/Đơn hàng.
- Mỗi sheet quay chính có khoảng 20–30 cột nghiệp vụ hợp lý để quay lướt ngang; không thêm cột trang trí vô nghĩa.
- Tổng dữ liệu mẫu khoảng 100–200 giao dịch, đủ dài để quay lướt dọc, tìm kiếm, lọc và thể hiện quy mô.
- Danh mục sản phẩm và dữ liệu liên quan phải đủ đa dạng để 100–200 giao dịch không bị lặp đơn điệu.
- Phải tạo được nhiều trạng thái: đủ hàng, sắp hết, hết hàng, ngừng bán và giao dịch gần đây.
- Dashboard và báo cáo phải có số liệu đa dạng để biểu đồ không trống hoặc quá đơn điệu.
- Dữ liệu mẫu phục vụ quay phải trông giống hoạt động thật nhưng không chứa thông tin thật của khách hàng.
- Web App cần quay được nhiều góc: danh mục dài, tìm kiếm, nhập kho, xuất kho, tồn kho, cảnh báo và báo cáo theo khoảng ngày.
- Nút `Xóa dữ liệu mẫu` vẫn phải xóa sạch phần minh họa để khách bắt đầu dùng dữ liệu thật mà không làm hỏng cấu trúc.

## Quy tắc sản phẩm Google Sheets Smart

Phiên bản Smart không dùng sidebar nhỏ làm giao diện vận hành chính. Kiến trúc đã chốt:

- Google Sheets là lớp dữ liệu: lưu sản phẩm, giao dịch nhập/xuất, công thức, tồn kho, cấu hình và báo cáo.
- Google Apps Script là lớp chức năng: xử lý form, kiểm tra dữ liệu, ghi lịch sử, tạo PDF, gửi email và tự động hóa.
- Web App Apps Script toàn màn hình là giao diện chính cho khách hàng sử dụng hằng ngày.
- Trong Google Sheets chỉ cần một nút/menu nổi bật: `Mở ứng dụng quản lý kho`.
- Web App chia chức năng thành các mục rõ ràng: Tổng quan, Sản phẩm, Nhập kho, Xuất kho, Tồn kho, Cảnh báo, Báo cáo và Cài đặt.
- Khách nhập liệu hằng ngày trên Web App; dữ liệu được Apps Script ghi về Google Sheets và dashboard tự cập nhật.
- Các sheet công thức, tồn kho và báo cáo được bảo vệ; chỉ các vùng cấu hình/danh mục cần thiết mới cho phép nhập trực tiếp.
- Sidebar nếu giữ lại chỉ dùng để xem nhanh, không phải luồng thao tác chính.

### Quy tắc tích lũy phiên bản và link ổn định

- Mỗi sản phẩm chỉ có một Google Sheets master chính.
- Mỗi sản phẩm chỉ có một project Apps Script chính.
- Mỗi sản phẩm chỉ có một deployment Web App chính thức và một URL bán cho khách.
- Khi nâng cấp, cập nhật source trong project hiện tại rồi tạo version mới trên đúng deployment đang hoạt động.
- Không tạo thêm file, project hoặc URL mới cho mỗi lần sửa nhỏ.
- Lịch sử thay đổi được quản lý bằng số phiên bản và mô tả deployment, ví dụ `3.0.0`, `3.1.0`, `3.1.1`.
- Chỉ tạo file hoặc URL mới khi phát triển một sản phẩm độc lập, một ngành độc lập, hoặc khi deployment cũ hỏng và không thể phục hồi.
- Nếu buộc phải thay URL, cập nhật đồng thời nút mở ứng dụng trong Google Sheets, metadata storefront và tài liệu hướng dẫn; URL cũ phải được đánh dấu ngừng sử dụng.
- Mục tiêu là khách luôn mở lại cùng một link và nhận phiên bản mới nhất, còn đội vận hành chỉ quản lý một nguồn chính.

Luồng sử dụng mục tiêu:

```text
Tạo bản sao Google Sheets
  -> kích hoạt/cấp quyền một lần
  -> bấm Mở ứng dụng quản lý kho
  -> thao tác trên Web App
  -> Apps Script ghi dữ liệu vào Sheets
  -> công thức, tồn kho và dashboard tự cập nhật
```

Định vị bán hàng: đây vẫn là bộ Google Sheets quản lý kho, nhưng đi kèm giao diện nhập liệu thông minh giống phần mềm; vì vậy là sản phẩm riêng và có giá cao hơn bản Excel cơ bản.

## Theme system

Preset hiện có:

- `pastel_feminine_spring`
- `corporate_clean_blue`
- `neutral_beige_soft`

Nguyên tắc:

- không chọn màu ngẫu nhiên
- dùng palette có quan hệ màu
- mỗi màu có vai trò rõ
- màu nền tảng chỉ nên xuất hiện ở chỗ người dùng cần nhìn nhanh, không để trang trí vô ích

## Template đang hoàn thiện: Shop Online Mini

Đã có:

- `0_BẮT_ĐẦU`
- `1_ĐƠN_HÀNG`
- `2_THU_CHI`
- `3_THEO_DÕI_COD`
- `4_TỔNG_QUAN`
- `5_DANH_MỤC`
- `6_HỆ_THỐNG` hidden

Đã có logic:

- mã đơn tự tạo
- mã giao dịch tự tạo
- danh mục thu chi mã `T01`, `T02`, `C01`, `C02`...
- dropdown
- conditional formatting
- 6 biểu đồ dashboard
- QC pass

## Lệnh dùng nhanh

List template:

```bash
python3 -m file_di_lam_factory.cli list
```

Build template:

```bash
python3 -m file_di_lam_factory.cli build shop_online_mini
```

Build, QC và đăng ngay lên web localhost:

```bash
python -m file_di_lam_factory.cli build shop_online_mini --publish --storefront-root .
```

Mỗi template muốn đăng bán cần có khối `storefront` trong `config.json`, gồm tối thiểu:

- `id`, `categoryId`, `name`, `price`
- `description`, `suitableFor`, `delivery`, `usageGuide`
- nên có thêm `sheets`, `highlights`, `tag`, `previewImageUrl`

Run test:

```bash
python3 -m unittest discover -s tests
```

## Việc nên làm tiếp

1. Xây sản phẩm `Bán Hàng & Lãi Lỗ Mini` cho cửa hàng nhỏ theo đặc tả trong `PRODUCT_ROADMAP_CUA_HANG_NHO.md`; bắt buộc có ít nhất bốn dashboard đẹp và riêng biệt
2. Sau khi sản phẩm trên ổn định, xây file độc lập `Tính Giá Cost & Định Mức Nguyên Vật Liệu`
3. Hoàn thiện Google Sheets Smart v3 theo kế hoạch chi tiết bên dưới
4. Thêm hàng nhãn lớn `KHU NHẬP LIỆU` và `KHU TỰ TÍNH` trên sheet nhập
5. Cho phép preset theme qua CLI
6. Hoàn thiện thêm các template mới từ cùng pipeline (Quản Lý Kho Mini đã có bản 1.0.0)

## Kế hoạch triển khai Google Sheets Smart v3

### Trải nghiệm mục tiêu

Sau bước tạo bản sao và cấp quyền một lần, khách hàng sử dụng Web App làm giao diện chính. Google Sheets chỉ đóng vai trò lớp dữ liệu phía sau và không phải nơi thao tác hằng ngày.

```text
Tạo bản sao
  -> cấp quyền một lần
  -> mở Web App
  -> xóa dữ liệu mẫu an toàn
  -> thêm sản phẩm thật
  -> nhập/xuất/xem báo cáo hoàn toàn trên Web App
```

Việc phải xử lý trước khi bán đại trà:

- mỗi bản sao phải đọc và ghi đúng dữ liệu của chính khách hàng
- không dùng URL Web App cố định trỏ về file master
- không để nhiều khách dùng chung dữ liệu hoặc quyền của chủ file master
- bản khách phải chạy dưới quyền tài khoản Google của khách
- Gmail cá nhân của chủ sản phẩm không được dùng làm người gửi báo cáo cho mọi khách

### Thứ tự menu theo UX

Nhóm thao tác đặt trước:

1. Nhập kho
2. Xuất kho
3. Quản lý sản phẩm

Nhóm tra cứu đặt sau:

4. Tổng quan
5. Tồn kho
6. Cảnh báo
7. Báo cáo

Nhóm trợ giúp và hệ thống đặt cuối:

8. Hướng dẫn sử dụng
9. Cài đặt

Trang mở đầu có hai nút thao tác lớn `Nhập kho` và `Xuất kho`, kèm số liệu tóm tắt và cảnh báo ưu tiên. Màn thao tác phải dễ thấy hơn màn chỉ xem.

### Quản lý sản phẩm trên Web App

- thêm sản phẩm
- sửa sản phẩm
- tìm kiếm sản phẩm
- kiểm tra SKU trùng
- khai báo nhóm hàng, đơn vị, giá vốn, giá bán, tồn tối thiểu và tồn đầu
- chuyển sản phẩm sang `Ngừng bán`
- không xóa cứng sản phẩm đã phát sinh giao dịch
- có nút `Xóa dữ liệu mẫu` với xác nhận rõ ràng
- nút xóa dữ liệu mẫu chỉ xóa sản phẩm và giao dịch minh họa, giữ nguyên tiêu đề, công thức và cấu trúc

### Hướng dẫn năm phút trong Web App

Mục `Hướng dẫn sử dụng` phải giải thích:

1. Thiết lập lần đầu
2. Xóa dữ liệu mẫu
3. Thêm sản phẩm đầu tiên
4. Nhập kho
5. Xuất kho
6. Đọc tồn kho và cảnh báo
7. Tạo, tải và gửi báo cáo
8. Cài email nhận báo cáo
9. Các lỗi thường gặp và cách xử lý
10. Dữ liệu được lưu trong Google Drive của khách

### Trình tạo báo cáo mới

Không xuất toàn bộ workbook thành một PDF. Khách được chọn loại báo cáo và chỉ xuất dữ liệu cần thiết.

Các loại báo cáo:

- Tổng quan kho
- Danh mục sản phẩm
- Nhập kho
- Xuất kho
- Tồn kho
- Hàng cần nhập/cảnh báo
- Báo cáo tùy chọn ghép nhiều phần

Form báo cáo gồm:

- loại báo cáo
- từ ngày, đến ngày với báo cáo giao dịch
- nội dung: chỉ số tổng hợp, bảng chi tiết, biểu đồ, ghi chú
- email người nhận
- `Xem trước`
- `Tải PDF`
- `Gửi email`

Quy tắc thời gian:

- nhập kho và xuất kho lọc theo khoảng ngày
- danh mục sản phẩm không cần khoảng ngày
- tồn kho hiện tại là ảnh chụp tại thời điểm tạo báo cáo
- tồn kho tại một ngày trong quá khứ phải được tính từ tồn đầu cộng nhập trừ xuất đến ngày đó

PDF dùng mẫu riêng, gồm logo, tên shop, tên báo cáo, khoảng thời gian, chỉ số tổng hợp, bảng dữ liệu, màu cảnh báo, ngày tạo và người lập. Không dùng bản xuất thô của Google Sheets.

### Email báo cáo

- tài khoản riêng của File Đi Làm dùng để sở hữu file master, phát triển, thử nghiệm và hỗ trợ
- báo cáo của khách được gửi bằng tài khoản Google của chính khách
- tên hiển thị có thể là `File Đi Làm – Báo cáo kho`
- có thể đặt email hỗ trợ làm `Reply-To`
- email người nhận do khách nhập trong Cài đặt hoặc tại form báo cáo
- kiểm tra định dạng email và hạn mức gửi trước khi gửi
- ghi lịch sử tạo, tải và gửi báo cáo

### Nhật ký hoạt động

Ghi lại:

- thêm/sửa/ngừng bán sản phẩm
- xóa dữ liệu mẫu
- nhập kho
- xuất kho
- thay đổi cài đặt
- tạo, tải và gửi báo cáo
- người thao tác, thời gian, nội dung và kết quả

## Kiến trúc dòng sản phẩm quản lý kho

Không nhồi toàn bộ nghiệp vụ ngành vào `Quản Lý Kho Mini`. Giữ lõi chung đơn giản và mở rộng bằng module để tạo nhiều sản phẩm khác nhau.

```text
Lõi chung
  Sản phẩm
  Nhập kho
  Xuất kho
  Tồn kho
  Cảnh báo
  Báo cáo

Module mở rộng
  Nhà cung cấp
  Đơn mua hàng
  Lô và hạn sử dụng
  Serial và bảo hành
  Đa kho và chuyển kho
  Kiểm kê
  Thầu và hợp đồng
```

### Dữ liệu lõi của Kho Mini

Danh mục sản phẩm chỉ gồm:

- SKU nội bộ
- tên sản phẩm
- nhóm hàng
- đơn vị tính
- giá vốn
- giá bán
- tồn đầu
- tồn tối thiểu
- trạng thái

Ngày nhập thuộc phiếu nhập kho, không thuộc sản phẩm. Ngày sản xuất và hạn sử dụng thuộc từng lô hàng, không thuộc sản phẩm chung. Serial/IMEI thuộc từng đơn vị thiết bị.

### Module nhà cung cấp

Danh mục nhà cung cấp:

- mã nhà cung cấp
- tên nhà cung cấp
- điện thoại, email, địa chỉ
- thời gian giao hàng dự kiến
- ghi chú

Quan hệ sản phẩm – nhà cung cấp:

- SKU nội bộ
- mã sản phẩm của nhà cung cấp
- giá nhập
- thời gian giao
- điều kiện mua

Một sản phẩm có thể có nhiều nhà cung cấp.

### Module lô và hạn sử dụng

- mã lô
- SKU
- nhà cung cấp
- ngày nhập
- ngày sản xuất
- hạn sử dụng
- số lượng nhập
- số lượng còn
- vị trí lưu kho
- trạng thái
- cảnh báo cận hạn
- xuất theo FEFO
- truy vết lô đã bán

### Module serial và bảo hành

- SKU
- model
- serial/IMEI
- barcode
- nhà cung cấp
- ngày nhập
- ngày bán
- khách hàng nhận thiết bị
- thời hạn bảo hành
- lịch sử sửa chữa
- trạng thái thiết bị

### Module phòng thí nghiệm

- tên hóa chất/sinh phẩm
- nhà sản xuất và nhà cung cấp
- số lô
- ngày nhận
- ngày mở nắp
- ngày đưa vào sử dụng
- hạn sử dụng
- điều kiện bảo quản
- vị trí tủ/kệ/tủ lạnh
- người tiếp nhận
- kiểm tra đạt/không đạt
- cảnh báo hạn và tồn

### Module y tế và thầu

- danh mục thầu
- số quyết định/gói thầu
- hợp đồng
- nhà cung cấp trúng thầu
- giá và số lượng trúng thầu
- số lượng đã giao
- lô, hạn dùng, serial/UDI
- khoa/phòng nhận
- biên bản giao nhận
- truy xuất và thu hồi

Đây là dòng chuyên ngành, chỉ triển khai sau khi nghiệp vụ đã được khảo sát và kiểm chứng; không định vị như một template giá rẻ.

## Lộ trình sản phẩm đề xuất

1. Hoàn thiện `Quản Lý Kho Mini – Google Sheets Smart v3`
2. Phát triển `Quản lý kho theo lô và hạn sử dụng – Google Sheets Smart`
3. Phát triển `Kho Pro – Nhà cung cấp và đơn mua hàng`
4. Phát triển `Kho thiết bị – Serial và bảo hành`
5. Phát triển `Kho phòng thí nghiệm`
6. Phát triển `Kho y tế và quản lý thầu` theo hướng cao cấp/tùy chỉnh

Phiên bản theo lô và hạn sử dụng được ưu tiên sau bản Mini vì có thể phục vụ mỹ phẩm, thực phẩm, thực phẩm chức năng, nguyên liệu, hóa chất và hàng tiêu dùng có hạn mà chưa quá nặng về quy định chuyên ngành.

## Phân loại sản phẩm trên storefront khi danh mục đủ lớn

Chỉ bổ sung bộ lọc nhiều chiều khi có khoảng 6–10 sản phẩm.

Theo nhu cầu:

- Bán hàng online
- Quản lý kho
- Công nợ
- Nhà cung cấp
- Theo lô – hạn sử dụng
- Thiết bị – bảo hành

Theo ngành:

- Shop bán lẻ
- Mỹ phẩm
- Thực phẩm
- Điện tử
- Phòng thí nghiệm
- Y tế

Theo cấp độ:

- Mini
- Smart
- Pro
- Chuyên ngành

Một sản phẩm có thể mang nhiều nhãn ngành và nhu cầu. Không tạo quá nhiều filter khi storefront mới chỉ có vài sản phẩm.
