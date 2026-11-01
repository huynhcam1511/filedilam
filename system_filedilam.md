# SYSTEM FILE ĐI LÀM — Kiến trúc business, website và workbook

Danh mục Cost V10 mở rộng 18/10/2026: nhóm nguyên vật liệu, nhóm bán thành phẩm, nhóm thành phẩm, đơn vị tính/mua/thực thu, đơn vị bán, size. Mẻ có category; món có category, sellingUnit, size tùy chọn. Nhóm/đơn vị/size chọn từ nguồn chung; tên công thức vẫn nhập khi tạo. Size không tự đổi lượng, các size khác định lượng dùng ID công thức riêng. Bộ lọc nhóm hỗ trợ cả dữ liệu cũ chưa phân loại; nâng cấp cột không reset dữ liệu.

Cost V10, quyết định 18/10/2026: webapp là nơi nhập liệu chính. Google Sheet hiện BẮT ĐẦU + TỔNG QUAN được thiết kế pastel; ẩn/bảo vệ bảng dữ liệu kỹ thuật. Báo cáo đọc bảng kết quả cùng cost engine, cập nhật khi lưu/tải dữ liệu ứng dụng; 4 KPI và 6 biểu đồ có nguồn công thức. Kiểm tra schema trước ghi; khôi phục giao diện có sao lưu trước và giữ dữ liệu nghiệp vụ. Chủ bản sao luôn có thể gỡ bảo vệ. Nguồn triển khai: outputs/fnb_cost_v10/Workbook*.gs; pipeline chính lưu đầy đủ quy trình và cổng nghiệm thu.

V10 Cost Web App (18/10/2026): mô hình bán bằng link Google Sheet /copy, script launcher gắn sẵn vào mẫu, host dùng chung chạy USER_ACCESSING. Khách tạo bản sao → menu tự xuất hiện → mở ứng dụng → cấp quyền Google lần đầu. Không yêu cầu khách dán code, nhập /exec hoặc deploy. Source/deployment: outputs/fnb_cost_v10. Đã xác minh copy mang script và menu thực tế; OAuth chưa xác minh đang chặn bước nghiệm thu tiếp, chưa xác nhận sẵn sàng bán. Luồng dữ liệu dùng ID bản sao theo từng RPC, không fallback master.

Cost Web App UI 8.1 (18/10/2026): source tại `outputs/fnb_cost_v8_webapp`; frontend HTML Service với sidebar, danh sách quản lý, drawer nguyên liệu, Recipe Builder, dashboard và Help Center. Adapter UiServices dùng lại bảng V8_* và thêm upsert, xóa có kiểm tra tham chiếu, settings, cost có trạng thái thiếu dữ liệu. Bộ cài hai file tại `install/`. Đã test Chrome/fixture cục bộ; chưa xác minh deployment Apps Script live của phiên bản này. Chi tiết tại `project-brain/10_CURRENT_STATE.md`.

Cập nhật: 14/10/2026. Vai trò: bản đồ tổng thể business và hệ thống để người làm dự án hiểu đang phục vụ ai, bán giá trị gì, sản xuất ra sao, giao hàng thế nào và chất lượng nào phải giữ.

Tài liệu tổng hợp từ hồ sơ dự án và yêu cầu người dùng, không phải chứng nhận hệ thống live đã được kiểm tra ngày này. Phân biệt quy tắc đã chốt, hiện trạng được ghi nhận, kế hoạch và phần chưa xác minh. Chỉ sửa tài liệu không đồng nghĩa đã triển khai sản phẩm.

## 1. Business là gì?

File Đi Làm đóng gói nghiệp vụ thành công cụ dễ dùng cho cửa hàng nhỏ, hộ kinh doanh, SME và người đi làm. Giá trị khách mua là giải quyết công việc, giảm nhập lặp/sai sót và nhìn rõ kết quả để quyết định.

Lời hứa thương hiệu: **Mở ra là hiểu, nhập ít, tự tính đúng, báo cáo rõ và có hướng dẫn.** File đẹp nhưng dropdown không chọn được, tính thiếu vốn hoặc biểu đồ không cập nhật là không đáp ứng lời hứa này.

Sản phẩm có thể là Excel, Google Sheets, công cụ Apps Script hoặc Web App tùy độ phức tạp. Không mặc định phải biến mọi workbook thành phần mềm.

## 2. Khách hàng và công việc cần giải quyết

| Nhóm | Công việc tiêu biểu | Kết quả họ cần |
| --- | --- | --- |
| Chủ shop, người bán online | Đơn hàng, thu chi, COD, hàng hóa | Biết bán được bao nhiêu, tiền ở đâu, việc nào chưa xong |
| Quán ăn, pha chế, cơ sở nhỏ | Nguyên liệu, định mức, bao bì, giá cost | Biết vốn một món/thành phẩm và khoản nào chưa được tính |
| SME, đội vận hành | Kho, công nợ, quy trình, báo cáo | Theo dõi thống nhất, đối chiếu được, giảm sai sót |
| Người đi làm, freelancer | Công việc, khách hàng, nội dung, hành chính | Có công cụ dùng ngay cho một nghiệp vụ rõ ràng |

Danh mục ngành trong `FILE_DI_LAM_BRAND.json` là không gian phát triển, không phải tuyên bố tất cả sản phẩm đã tồn tại. Tệp ít rành máy tính cần nhãn đời thường, ít bước, ví dụ cụ thể, không cần sửa công thức.

## 3. Mô hình sản phẩm và doanh thu

| Cấp sản phẩm | Định dạng định hướng | Khi phù hợp |
| --- | --- | --- |
| Mini | Excel / Google Sheets | Một nghiệp vụ rõ, dễ bắt đầu |
| Smart | Google Sheets + Apps Script | Cần form, PDF, email hoặc tự động hóa |
| Web App | Giao diện web + dữ liệu + tự động hóa | Cần nhiều người, nhiều bước hoặc thao tác thuận tiện hơn |
| Chuyên ngành | Công nghệ theo bài toán | Có nghiệp vụ sâu đã khảo sát và kiểm chứng |

Mô hình bán hiện được mô tả trong dự án là bán sản phẩm số qua storefront, khách thanh toán và nhận quyền/link sử dụng. Combo, giảm giá và giá niêm yết thuộc quyền quản trị của chủ sản phẩm. Không tự suy ra mô hình thuê bao, dịch vụ tùy chỉnh hoặc chính sách cập nhật trọn đời khi chưa có quyết định.

Giá và danh mục đang bán phải đọc từ dữ liệu quản trị có thẩm quyền. Giá ghi trong kế hoạch cũ chỉ có giá trị lịch sử; không dùng để ghi đè giá hiện hành. Chưa xác minh doanh thu, số khách hoặc lợi nhuận hiện tại trong lần tổng hợp này.

## 4. Vòng vận hành business

Nghiên cứu nhu cầu → chọn bài toán → đặc tả sản phẩm → tạo file → kiểm thử → demo và hướng dẫn → chủ sản phẩm quyết định phát hành → khách mua và nhận file → hỗ trợ → sửa lỗi và cập nhật bài học.

| Bước | Đầu ra cần có | Điều kiện chuyển bước |
| --- | --- | --- |
| Nghiên cứu | Nhóm khách, vấn đề lặp lại, bằng chứng nguồn, giải pháp hiện có | Có lý do để thẩm định sản phẩm, không chỉ một video nhiều view |
| Đặc tả | Phạm vi, dữ liệu, công thức, sức chứa, ứng dụng đích, tiêu chí đạt | Có thể giải thích một luồng sử dụng hoàn chỉnh |
| Sản xuất | File chạy được, cấu hình/mã tạo, dữ liệu demo | Kết quả nối với dữ liệu thật bằng công thức |
| Kiểm thử | Đối chiếu nghiệp vụ, thao tác trực tiếp, kiểm tra hiển thị | Tính năng cốt lõi dùng được trên môi trường cam kết |
| Chuẩn bị bán | Bản giao, hướng dẫn, demo, mô tả đúng phạm vi, phiên bản | Không quảng cáo tính năng chưa làm hoặc chưa kiểm chứng |
| Bán và giao | Đơn hàng, đối soát thanh toán, quyền/link nhận file | Không cấp quyền từ thông báo thanh toán phía client đơn thuần |
| Hỗ trợ | Ghi nhận lỗi, tái hiện, bản sửa, phạm vi kiểm tra | Khách biết bản nào đã sửa gì và dùng thế nào |

## 5. Khung bắt buộc của một file

Chi tiết thực thi nằm trong `AGENTS.md`, mục “Khung chung để tạo một file bảng tính hoàn chỉnh”. Khi làm sản phẩm phải xét đủ:

1. Mục tiêu, người dùng, phạm vi và ứng dụng đích.
2. Hướng dẫn bắt đầu, thứ tự nhập và ví dụ hoàn chỉnh.
3. Thiết lập, danh mục, mã ổn định và đơn vị.
4. Vùng nhập dữ liệu đúng kiểu, dropdown và kiểm tra hợp lệ.
5. Công thức, quy tắc nghiệp vụ, liên kết và cảnh báo thiếu/sai dữ liệu.
6. Kết quả, báo cáo, KPI, biểu đồ và bộ lọc phù hợp.
7. Sức chứa, cách mở rộng và dữ liệu mẫu khác với sức chứa.
8. Thiết kế dễ đọc, phân biệt ô nhập/ô tính và bảo vệ thao tác.
9. Kiểm thử trên file cuối, đúng ứng dụng và chế độ mở.
10. Bàn giao, phiên bản, giới hạn hỗ trợ và ghi nhớ bài học.

Đây là các vai trò cần xét, không phải bắt tạo 10 sheet. Ngày hiển thị **dd/mm/yyyy**, lưu đúng kiểu ngày. Công thức/nguồn biểu đồ phải cập nhật; dropdown phải thử chọn thật ở đầu, giữa, cuối vùng hỗ trợ. Không che lỗi bằng số 0 hoặc ô trống rồi cho kết quả có vẻ hợp lệ.

Chuẩn dashboard hiện tại là 4 KPI và 6 biểu đồ theo mẫu Shop Online; không tự giảm biểu đồ khi tinh gọn trang nhập. Ngoại lệ phải được thống nhất. Không dùng số biểu đồ, số sheet hoặc số dòng mẫu làm bằng chứng file tốt.

## 6. Danh mục sản phẩm và trạng thái đã biết

| Sản phẩm/nhóm | Hồ sơ đã ghi nhận | Giới hạn của thông tin |
| --- | --- | --- |
| Shop Online Mini | Khung 7 sheet đã học trong `brain.json`; nguồn code đã sửa biểu đồ và dropdown qua các bản 1.4.x | Bản local, code và bản Google Sheets có thể khác phiên bản; kiểm tra ba dropdown không chứng nhận toàn bộ file |
| Quản lý kho Mini | Được kế hoạch tháng 9 ghi nhận là sản phẩm đang bán | Chưa kiểm tra lại bản đang giao, giá hoặc tình trạng live trong lượt này |
| Cost món v4 | Bản đơn giản 3 sheet, đã đọc cấu trúc/công thức | Còn lỗi giới hạn thành phần, che lỗi cost, nguồn biểu đồ; chưa đủ bằng chứng sẵn sàng phát hành |
| Cost đa ngành | Có prototype và kế hoạch nâng cấp | Không đồng nhất với cost v4 đơn giản; không tự gộp phạm vi hai bản |
| Bán hàng & Lãi lỗ Mini | Roadmap riêng có chi tiết đơn, giá vốn, phí và lợi nhuận | Cấu trúc dự kiến không phải bằng chứng đã triển khai |
| Tính giá bán, Điểm hòa vốn | Backlog trong kế hoạch tháng 9 | Không tự triển khai hoặc hứa tính năng trong bản cost hiện tại |
| Smart / Web App / chuyên ngành | Định hướng thương hiệu và kiến trúc | Mỗi sản phẩm cần hồ sơ và xác minh riêng |

Yêu cầu cost được hợp nhất trong phần nghiệp vụ ở cuối tài liệu này. Roadmap cũ có quy đổi, nhiều dashboard hoặc FIFO không tự áp dụng cho bản đơn giản. Cần đọc đúng hồ sơ sản phẩm trước khi sửa.

## 7. Website bán hàng và hệ thống giao file

Theo hồ sơ kỹ thuật `IT_BRAIN.json`, mã nguồn và các quy tắc đã hợp nhất:

| Thành phần | Vai trò được mô tả | Nguồn cần kiểm tra khi làm việc |
| --- | --- | --- |
| Storefront | Xem sản phẩm, tài khoản, giỏ hàng, thanh toán, đơn đã mua | `index.html`, `storefront.js`, `storefront.css` |
| Admin | Quản lý sản phẩm, giá, ảnh, file và metadata | `admin.html`, `admin.js` |
| Firestore | Dữ liệu sản phẩm và dữ liệu nghiệp vụ website | Rules, mã truy cập và dữ liệu thực tế có quyền đọc |
| Storage | Lưu tài nguyên/file sản phẩm theo thiết kế hiện hành | Mã upload, quyền truy cập và đường dẫn được cấp |
| Cloud Functions | API đơn hàng, hồ sơ, đơn đã mua, webhook thanh toán | `functions/main.py` |
| VietQR / SePay | Hướng dẫn chuyển khoản và tiếp nhận sự kiện thanh toán | Backend và cấu hình tích hợp hiện hành |
| Factory | Sinh workbook, thiết kế, công thức, validation, QC và manifest | `file_di_lam_factory/` |

Luồng được tài liệu mô tả: chọn sản phẩm → tạo đơn → thanh toán theo thông tin đơn → backend đối soát → đơn được xác nhận thanh toán → khách nhận quyền/link file. Phải đọc mã và kiểm tra thực tế trước khi kết luận luồng live hoạt động đúng.

Firestore là nguồn chính của sản phẩm và giá do admin quản lý. Không reset collection, ghi đè giá hoặc dùng danh mục hardcode thay dữ liệu admin. `backend/` được hồ sơ đánh dấu legacy; không mặc định nó là backend live.

Các nhận xét bảo mật trong hồ sơ cũ là đầu mối kiểm tra, không mặc định vẫn đúng hiện tại. Không đưa token, khóa bí mật, thông tin khách hàng hoặc dữ liệu thanh toán nhạy cảm vào blueprint.

## 8. Marketing, bán hàng và hỗ trợ

- TikTok là kênh nghiên cứu chính theo hồ sơ thương hiệu; website tiếp nhận nhu cầu mua. Kênh khác chỉ được xem là đang vận hành khi có bằng chứng.
- Demo phải cho thấy vấn đề, thao tác nhập và kết quả thật. Số trong nội dung/video phải khớp file; không dùng số giả làm kết quả khách hàng.
- Phân biệt lượt xem với nhu cầu và mua thực. Nội dung đã chạy Promote không được coi toàn bộ là tăng trưởng tự nhiên.
- Các chỉ số nên theo dõi: yêu cầu demo, lượt vào trang, bắt đầu thanh toán, đơn thanh toán, giao file thành công, lỗi/hỗ trợ và khách dùng được. Đây là bộ đo đề xuất, chưa khẳng định đã có tracking.
- Mỗi phản ánh lỗi cần ghi sản phẩm/phiên bản, ứng dụng, thao tác, kỳ vọng, thực tế, cách tái hiện, bản sửa và bằng chứng thử lại. Lỗi cản nhập liệu hoặc tính sai cần ưu tiên hơn trang trí.
- Hoàn tiền, giấy phép sử dụng, thời hạn hỗ trợ, cập nhật và quyền chia sẻ file phải theo chính sách chủ sản phẩm đã quyết định. Chưa thấy chính sách đầy đủ thì ghi chưa xác định, không tự hứa với khách.

## 9. Ranh giới quyền và trách nhiệm

- Chủ sản phẩm quyết định định vị, ưu tiên, phạm vi, giá, ưu đãi và phát hành.
- Agent chịu trách nhiệm đọc bối cảnh, thực hiện phần được giao, bảo toàn dữ liệu, kiểm tra và báo đúng phạm vi. Không đẩy lỗi dropdown/công thức cho người dùng khi chưa tái hiện.
- Có thể chủ động sửa trong phạm vi đã được giao. Việc xây xong file không tự cho phép đăng bán, đổi dữ liệu live hoặc gửi thông điệp cho khách.
- Thiết kế website theo quy chuẩn website; workbook theo thiết kế sản phẩm đã chọn. Không áp màu mint của storefront lên mọi file pastel.


## 10. Kiến trúc sử dụng workbook — quyết định ngày 14/10/2026

Khách có thể chưa quen dùng máy tính. Một file đầy đủ có các vai trò sau; chỉ 1–2 trang là nơi nhập nghiệp vụ thường xuyên:

| Trang | Tần suất | Vai trò |
| --- | --- | --- |
| BẮT ĐẦU | Lần đầu / khi cần trợ giúp | Thông tin đơn vị, hướng dẫn 3–4 bước, chú giải, ví dụ trọn luồng, liên kết điều hướng |
| DANH MỤC | Thiết lập và khi thay đổi | Nguồn chọn chung: nguyên liệu/sản phẩm, đơn vị, nhóm, kênh, loại thu chi theo nghiệp vụ; có chỗ thêm |
| NHẬP LIỆU 1 | Thường xuyên | Công việc chính, nhập/chọn ít trường và thấy kết quả tự tính cạnh đó |
| NHẬP LIỆU 2 | Khi nghiệp vụ cần | Công việc thứ hai riêng biệt; không nhập lại dữ liệu trang 1 |
| TỔNG QUAN | Xem kết quả | 4 KPI, 6 biểu đồ, báo cáo/cảnh báo có ích; không nhập số tổng hợp |
| HỆ THỐNG | Ẩn / không cần thao tác | Nguồn phụ, metadata và kiểm tra; lỗi ảnh hưởng kết quả vẫn hiện cạnh dữ liệu |

Một trang theo dõi chỉ xem, như COD, có thể thêm nếu giúp thao tác rõ hơn. Không ép mỗi vai trò kỹ thuật thành sheet, không bỏ DANH MỤC/TỔNG QUAN để đạt hai tab.
Luồng: thiết lập danh mục → nhập một hoặc hai trang → kết quả ngay tại nơi nhập → tổng quan tự cập nhật. Khách không phải mở trang tính trung gian.

### Áp dụng cho cost — thiết kế đã chốt, chưa triển khai lại

- BẮT ĐẦU: chỉ cách sửa giá nguyên liệu, nhập một món/mẻ và xem kết quả bằng ví dụ hoàn chỉnh.
- DANH MỤC: nguyên liệu và bao bì, giá mua, lượng dùng được, đơn vị, giá một đơn vị tự tính; đây là nguồn dropdown dùng chung.
- TÍNH COST MÓN: tên/size, thành phần, định lượng và giá bán; đơn vị/thành tiền cạnh định lượng; cost nguyên liệu, bao bì, chi phí bổ sung và tổng hiển thị ngay. Không tách MÓN và CÔNG THỨC thành hai nơi bắt khách đi lại.
- TÍNH MẺ: trang nhập thứ hai khi dùng bán thành phẩm; nhập thành phần và lượng thực thu, thấy cost mẻ/đơn vị ngay. Không dùng mẻ thì bỏ qua trang này; không cần cấu hình bắt buộc.
- TỔNG QUAN: 4 KPI và 6 biểu đồ; gợi ý KPI là số món đủ dữ liệu, số món cần sửa, cost trung bình/món hợp lệ, tỷ lệ cost bình quân theo món có giá bán. Phải ghi rõ đây không phải tỷ lệ theo doanh số.
- Sáu câu hỏi biểu đồ dự kiến: món nào cost cao; món nào tỷ lệ cost cao; cơ cấu nguyên liệu/bao bì/chi phí bổ sung; giá bán so với cost theo món; khoản còn lại sau các chi phí đã tính theo món; bao nhiêu món đủ/thiếu dữ liệu. Phạm vi top N, điều kiện hợp lệ và đơn vị phải rõ. Không gọi phần còn lại là lợi nhuận ròng, không suy doanh thu từ menu.
- Giao diện kế thừa Shop Online 1.4.0 theo AGENTS; không tái dùng bảng text thô của v5. v5 có sáu sheet là bản đã có, không phải cấu trúc đã được nghiệm thu về UX.

## 11. Website thương mại điện tử: bố cục và chức năng

Đọc mã ngày 14/10/2026; đây là bản đồ mã nguồn, không phải xác nhận luồng live đã đạt kiểm thử.

| Khu vực | Bố cục / chức năng | Nguồn |
| --- | --- | --- |
| Đầu trang | Thương hiệu, tìm kiếm, tài khoản, đơn đã mua, giỏ hàng | index.html |
| Danh sách sản phẩm | Bộ lọc danh mục/giá, sidebar desktop, lưới sản phẩm; thiết kế mobile gọn | index.html, storefront.css, storefront.js |
| Tài khoản | Modal đăng nhập/đăng ký, Google, hồ sơ người dùng | authModal, storefront.js |
| Giỏ và đơn đã mua | Drawer riêng, danh sách hàng/tổng tiền, truy cập sản phẩm đã mua | cartDrawer, purchasesDrawer |
| Thanh toán | Thông tin khách → đơn hàng → VietQR/chuyển khoản → trạng thái và link nhận file | storefront.js, functions/main.py |
| Admin | Quản lý sản phẩm/giá/file/ảnh; API thống kê và danh sách đơn có trong backend | admin.html, admin.js, functions/main.py |
| Backend | /profile, /orders, /my-orders, /reviews, /admin/stats, /admin/orders, /webhooks/sepay | functions/main.py |

### Hợp đồng nghiệp vụ website giữ lại

- Firestore là nguồn sản phẩm và giá do admin quản lý. Không hardcode thay dữ liệu admin, không reset sản phẩm, không tự sửa giá/ưu đãi/link phát hành.
- Mua ngay cô lập đơn về đúng sản phẩm được bấm; không cộng giỏ cũ vào mua nhanh.
- Màn chuyển khoản có ngân hàng, chủ tài khoản, số tài khoản, số tiền, nội dung theo mã đơn; nút sao chép cho các trường cần dùng. Lấy cấu hình có thẩm quyền, không lấy số tài khoản cũ trong tài liệu làm cấu hình mới.
- Backend đối soát webhook SePay trước khi cấp quyền/link. UI phản hồi khi trạng thái đã xác nhận; thông báo phía client không tự chứng minh đã thanh toán.
- Dữ liệu/giá live, trạng thái quyền nhận file và tính đúng của đối soát phải kiểm tra riêng trước khi tuyên bố vận hành tốt.

## 12. Factory và các kiến trúc dự kiến

- `file_di_lam_factory/core`: engine, models, loader, versioning; từng template chứa config, dữ liệu mẫu, công thức, validation, dashboard và QC.
- Build vào `outputs/` theo phiên bản, giữ bản gốc. QC tự động bổ trợ kiểm thử sử dụng, không thay thế thao tác thực tế.
- CLI tham khảo: `python -m file_di_lam_factory.cli list`; `python -m file_di_lam_factory.cli build <template>`; kiểm tra CLI hiện tại trước khi chạy. Build không tự đồng nghĩa publish.
- Smart với Apps Script/Web App là hướng phát triển khi nghiệp vụ cần. Không áp mô hình “Sheets chỉ là database” cho mọi bản Mini hoặc yêu cầu người mới cấp quyền script không cần thiết.
- Demo cần đủ tình huống, không bắt đủ 100–200 giao dịch cho file cost. Có hướng dẫn xóa mẫu an toàn; chỉ mô tả nút xóa nếu thực sự đã làm và kiểm tra.

## 13. Hai tài liệu chính và bằng chứng

- `AGENTS.md`: người thiết kế và thực thi — chuẩn UI web/workbook, cách thao tác, cách kiểm tra và bàn giao.
- `system_filedilam.md`: kiến trúc sư — business, sơ đồ hệ thống, bố cục/chức năng, dữ liệu, quy tắc nghiệp vụ và trạng thái sản phẩm.
- `brain.json`, `IT_BRAIN.json`, QA và roadmap là hồ sơ hỗ trợ/lịch sử, không tạo thêm hiến pháp cạnh tranh. Yêu cầu mới nhất quyết định phạm vi; mã/file quyết định đã triển khai; kiểm thử quyết định đã xác minh.
- Đã hợp nhất bốn tài liệu thành hai ngày 14/10/2026; bản gốc lưu tại `scratch/docs_consolidation_20261014/original_documents.zip`. Các định hướng cũ “checkout thủ công”, “bắt buộc Web App”, “ít nhất bốn dashboard” không còn là kết luận hiện trạng hoặc yêu cầu chung.

## Yêu cầu riêng: tính cost món và pha chế

Cập nhật ngày 2026-10-07. Đây là khung yêu cầu cho bản nâng cấp, không phải xác nhận các tính năng đã được triển khai. Bản được rà soát là `outputs/cost_simple_v4/file_di_lam_tinh_cost_mon_v4.xlsx`.

### Mục tiêu và phạm vi

- Phục vụ chủ quán ít dùng bảng tính: nhập giá nguyên liệu, khai báo định lượng, xem vốn mỗi món và hỗ trợ đặt giá bán.
- Ưu tiên tính đúng, dễ nhập và phát hiện thiếu dữ liệu. Số sheet, số biểu đồ hay số dòng mẫu không chứng minh chất lượng.
- Không tự thêm quản lý kho, FIFO, nhật ký mua hoặc kế toán vào bản cost đơn giản.
- Theo cấu trúc vận hành chốt ngày 14/10/2026 ở trên: BẮT ĐẦU, DANH MỤC, 1–2 sheet thao tác và TỔNG QUAN. Giới hạn 1–2 là số nơi nhập nghiệp vụ thường xuyên, không phải tổng số sheet.

### Luồng dữ liệu bắt buộc

Nguyên liệu và bao bì → giá một đơn vị sử dụng → công thức mẻ/bán thành phẩm nếu có → định lượng từng món → tổng cost và kiểm tra đủ dữ liệu → kết quả định giá → tổng quan.

| Thành phần | Dữ liệu nhập | Kết quả và quy tắc |
| --- | --- | --- |
| Hướng dẫn | Không bắt người dùng cấu hình kỹ thuật | Chỉ rõ ô nhập, ô tự tính, đơn vị, cách thêm món và xử lý cảnh báo |
| Danh mục nguyên liệu | Mã ổn định, tên, số tiền, lượng dùng được, đơn vị g/ml/cái/miếng | Giá một đơn vị = số tiền / lượng dùng được; phát hiện thiếu giá, lượng không hợp lệ và mã trùng |
| Bao bì | Ly, nắp, ống hút, túi, tem và số lượng dùng | Tính riêng, cộng đúng một lần vào cost món; không chiếm chỗ nguyên liệu pha chế |
| Mẻ/bán thành phẩm | Thành phần, định lượng đầu vào, lượng thành phẩm thực thu, đơn vị đầu ra | Tổng cost mẻ / lượng thực thu; có thể chọn bán thành phẩm trong công thức món; không cho tham chiếu vòng |
| Công thức món | Mã món, tên/size, nguyên liệu hoặc bán thành phẩm, định lượng | Hỗ trợ thêm nhiều dòng thành phần; hiện đơn vị ngay cạnh định lượng; không giới hạn cứng 5 thành phần mỗi món |
| Kết quả món | Giá bán; tỷ lệ cost mục tiêu và chi phí bổ sung khi có nhu cầu | Tách cost nguyên liệu, bao bì, khoản bổ sung và tổng; ghi rõ phạm vi của từng kết quả |
| Tổng quan | Đọc kết quả đã tính | Bao phủ toàn bộ món hợp lệ trong vùng hỗ trợ; chỉ số và biểu đồ cùng phạm vi, tự cập nhật |

### Quy tắc tính và dữ liệu

- Với bản đơn giản, người dùng nhập lượng đã quy về g/ml/cái/miếng. Không ép thêm hệ số quy đổi phức tạp. Hiển thị hướng dẫn đơn vị rõ ràng và không tự coi 1 g bằng 1 ml.
- Lượng dùng được hoặc lượng thành phẩm thực thu phải phản ánh hao hụt theo cách đã khai báo. Không vừa giảm lượng sử dụng được vừa cộng lại cùng khoản hao hụt.
- Phân biệt dòng thành phần chưa dùng với dòng đã chọn nguyên liệu nhưng thiếu định lượng hoặc giá. Dòng lỗi phải làm món báo chưa đủ dữ liệu; không được âm thầm loại khỏi tổng.
- Không dùng `IFERROR(...,0)` hoặc `IFERROR(...,"")` để che lỗi rồi vẫn trả tổng cost có vẻ hợp lệ. Phân biệt số 0 hợp lệ với dữ liệu thiếu.
- Dùng mã ổn định để liên kết; nhãn chọn phải dễ hiểu. Đổi tên hoặc sắp xếp danh mục không được làm công thức món trỏ nhầm nguyên liệu. Không âm thầm lấy bản ghi đầu khi mã bị trùng.
- Tỷ lệ cost = cost thuộc phạm vi đã ghi / giá bán hợp lệ. Nếu có giá gợi ý theo tỷ lệ cost mục tiêu, tính cost / tỷ lệ mục tiêu và ghi rõ quy tắc làm tròn. Phí theo phần trăm giá bán cần công thức riêng, không cộng như khoản tiền cố định.
- Không gọi giá bán trừ nguyên liệu là lợi nhuận ròng. Phải ghi rõ các khoản đã trừ và còn chưa tính.
- Phải công bố sức chứa hỗ trợ và cách mở rộng. Danh mục, lookup, dropdown, công thức, cảnh báo và biểu đồ phải mở rộng đồng bộ; số dòng mẫu không phải sức chứa.

### Giao diện và dropdown

- Dùng pastel hồng theo yêu cầu đã lưu, font hỗ trợ tiếng Việt, nhãn dễ đọc và định dạng tiền/số/phần trăm nhất quán.
- Phân biệt ô nhập và ô công thức. Bảo vệ ô công thức nếu ứng dụng đích hỗ trợ nhưng phải giữ ô nhập và dropdown thao tác được.
- Tránh trải công thức món quá nhiều cột ngang. Người dùng phải thấy nguyên liệu, đơn vị, định lượng và thành tiền cạnh nhau.
- Dropdown phải lấy từ danh mục thật, không chứa tiêu đề và phủ hết vùng nhập hỗ trợ. Không mặc định named range hoặc OFFSET của Excel sẽ hoạt động trên Google Sheets.
- Mọi số liệu tính toán cấp cho biểu đồ phải là công thức hoặc liên kết kết quả; không thay bằng số nhập sẵn. Theo quyết định 14/10/2026, giữ 6 biểu đồ hữu ích như phần kiến trúc ở trên; ngoại lệ phải được thống nhất, không tự cắt biểu đồ.

### Lỗi đã thấy ở v4 cần xử lý trước phát hành

1. Mỗi món chỉ có 5 vị trí thành phần, bao bì dùng chung các vị trí này.
2. Lỗi tra cứu thành phần trả ô trống, trong khi tổng vẫn cộng các thành phần còn lại.
3. Chưa có luồng tính mẻ/bán thành phẩm và sản lượng thực thu.
4. Định lượng không hiện đơn vị ngay cạnh nguyên liệu chọn.
5. Nguồn nguyên liệu chỉ A6:A55, lookup A6:E55; vùng món G6:Y35. Chưa hỗ trợ mở rộng tự động ngoài các vùng này.
6. Nguồn biểu đồ chỉ nối 10 món đầu, trong khi KPI đọc vùng 30 món.
7. Lần rà soát này chỉ đọc cấu trúc và công thức file. Chưa xác minh thao tác dropdown v4 trên Google Sheets.

### Điều kiện nghiệm thu

- Đối chiếu độc lập ít nhất một món trực tiếp và một món dùng bán thành phẩm, gồm bao bì và hao hụt theo mô hình đã chọn.
- Thử đổi giá nguyên liệu: cost mẻ, cost món, chỉ số và biểu đồ liên quan phải cập nhật đúng.
- Thử món có hơn 5 thành phần; thêm nguyên liệu và món tới cuối vùng hỗ trợ; kiểm tra món thứ 11 xuất hiện đúng trong tổng quan.
- Thử thiếu giá, thiếu định lượng, lượng bằng 0, mã trùng, đổi tên, sắp xếp và xóa nguyên liệu đang dùng. Không trường hợp lỗi nào được tạo ra tổng cost thấp giả tạo.
- Trên đúng ứng dụng đích, mở dropdown và chọn thực tế ở đầu, giữa, cuối vùng; xác minh giá trị được ghi vào ô. Thử cả bản XLSX và Google Sheets nếu cam kết hỗ trợ cả hai.
- Xem trực tiếp mọi sheet ở mức zoom thường dùng: chữ không cắt, đơn vị rõ, bảng dễ thao tác, biểu đồ và nhãn đọc được. Lưu/mở lại để kiểm tra khi cần.
- Ghi rõ file/URL, ứng dụng, vùng thử, thao tác, kết quả và phần chưa kiểm tra. Kiểm tra mã nguồn hoặc đọc XML không thay thế kiểm tra sử dụng thực tế.
- Chỉ tuyên bố sẵn sàng phát hành sau khi các điều kiện liên quan đã đạt. Không tự niêm yết, thay giá hoặc phát hành sản phẩm khi người dùng chỉ yêu cầu sửa workbook.

