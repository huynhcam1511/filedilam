# Rà soát module và discovery Quản lý tài sản — 19/10/2026

## Phạm vi và mức tin cậy

Đọc `AGENTS.md`, `PIPELINE_FILE_DI_LAM_FACTORY.md`, `system_filedilam.md`, Project Brain; đối chiếu mã storefront/admin/Cloud Functions/factory/Cost V10 và hồ sơ `outputs/fnb_cost_v10/verification.json`. Đây là **phân tích tĩnh + bằng chứng kiểm thử đã lưu**, chưa thử lại website hay Apps Script live, chưa sửa code, dữ liệu hoặc deployment. `backend/` là nhánh legacy, không mặc định đang phục vụ live. Các sản phẩm Shop Online Mini/Kho Mini/Công nợ là template riêng; không suy diễn tính năng của một sản phẩm sang sản phẩm khác.

Quy ước: **Có** = thấy trong mã/hồ sơ; **Cần xác minh** = chưa có bằng chứng vận hành đầy đủ; **Thiếu** = chưa thấy trong mã đã đọc hoặc hồ sơ. P0 là điều kiện tin cậy/phát hành, P1 cải thiện thao tác và vận hành, P2 chỉ làm khi có nhu cầu đo được.

## 1. Website bán hàng

| Module và chức năng con | Hiện trạng dữ liệu, CRUD, tìm/lọc, hàng loạt, tự động hóa, quy tắc, ngoại lệ, liên kết, lịch sử, báo cáo, UX | Đề xuất |
| --- | --- | --- |
| Danh mục/trang sản phẩm | Firestore là nguồn sản phẩm/giá; storefront có thư mục danh mục, tìm tên, lọc giá, trang chi tiết, đánh giá. Admin có tạo/sửa/xóa sản phẩm, ảnh, file, metadata và versions. Chưa thấy quy trình bản nháp → duyệt → phát hành hoặc kiểm tra link giao file trước khi mở bán. Không thấy thao tác hàng loạt. | **P0:** kiểm tra giá và file phát hành từ nguồn có thẩm quyền ở lúc tạo đơn, trạng thái khả dụng/link hợp lệ; xác minh bản live. **P1:** preview trước phát hành, nhãn phiên bản và checklist phát hành ngắn; tìm/lọc admin theo trạng thái/loại. **P2:** cập nhật hàng loạt metadata khi catalog lớn. |
| Tài khoản/hồ sơ | Email/mật khẩu, Google, hồ sơ, đăng xuất có trong storefront; checkout có form xác thực riêng. Cần kiểm tra thực tế tính đồng nhất tab, trường, nút mắt, phản hồi lỗi, trạng thái đã đăng nhập trên mobile. Lịch sử hồ sơ chỉ thấy dữ liệu hiện hành. | **P0:** nghiệm thu cùng một kiến trúc form theo `AGENTS.md`, phục hồi phiên đăng nhập khi quay lại thanh toán. **P1:** giải thích ngắn dữ liệu bắt buộc và lỗi cạnh trường; chỉnh hồ sơ ngay tại checkout mà không mất đơn. |
| Giỏ hàng/mua ngay | Thêm/bớt/đổi số lượng, localStorage, tổng tiền; mua ngay được tài liệu yêu cầu cô lập sản phẩm. Không có nhu cầu bulk edit ngoài giỏ. Giá hiển thị ở client cần đối chiếu giá backend khi đặt đơn. | **P0:** test mua ngay khi giỏ đã có hàng, giá thay đổi, sản phẩm ngừng bán, làm mới trang/chuyển app. **P1:** tóm tắt đơn gọn trên mobile, cảnh báo giá thay đổi rõ trước xác nhận. |
| Thanh toán/đối soát | Tạo đơn, tái dùng đơn PENDING, QR/chuyển khoản, sao chép thông tin, polling; webhook SePay xác nhận thanh toán rồi cấp quyền/link. Ngoại lệ cần thử: chuyển thiếu/thừa tiền, trùng nội dung, hai giao dịch cùng mã, webhook lặp/chậm, đơn hết hạn, khách quay lại. | **P0:** ma trận đối soát/idempotency, chỉ cấp file khi trạng thái PAID do server xác nhận, audit giao dịch và công cụ xử lý đơn bất thường. **P1:** trạng thái đơn bằng ngôn ngữ đời thường, thời gian kiểm tra và lối liên hệ hỗ trợ khi quá hạn. **P2:** tự động nhắc đơn treo nếu có kênh được đồng ý. |
| Đơn đã mua/giao file | `/my-orders` trả đơn PAID; drawer đơn đã mua mở URL file. Cần xác minh URL đúng từng phiên bản và quyền `/copy`; chưa thấy log giao thành công/thất bại hoặc khả năng cấp lại có kiểm soát. | **P0:** test từ thanh toán thật đến mở/copy đúng file, quyền và cô lập tài khoản; ghi dấu vết giao file. **P1:** nút mở lại file, hướng dẫn lần đầu ngay cạnh sản phẩm, trạng thái giao rõ. |
| Đánh giá/hỗ trợ | `/reviews` gắn với đơn đã mua; storefront có form sao. Không thấy quy trình ticket hỗ trợ/hoàn tiền hay phân loại phản ánh theo phiên bản. | **P1:** mẫu hỗ trợ lấy sẵn mã đơn, sản phẩm, phiên bản và lỗi; màn admin theo dõi trạng thái xử lý. **P2:** phân tích nguyên nhân lỗi/đánh giá theo sản phẩm. |
| Admin sản phẩm/đơn/thống kê | Có danh sách sản phẩm, versions, đơn, lọc mã/điện thoại/email/sản phẩm/trạng thái; thống kê đơn và doanh thu. Một số màn có fallback đọc Firestore khi API lỗi, dễ che lỗi nguồn dữ liệu; quyền admin hiện đối chiếu email cụ thể trong API. Chưa thấy bulk xử lý đơn hay nhật ký thay đổi admin có cấu trúc. | **P0:** thống nhất nguồn/định nghĩa số liệu và quyền admin, báo lỗi API minh bạch, xác minh rules/live. **P1:** timeline đơn (tạo → đối soát → giao → hỗ trợ), bộ lọc ngày/sản phẩm/trạng thái, export có giới hạn; nhật ký thay đổi giá/file. **P2:** vai trò nhân viên khi có đội vận hành. |

## 2. Cost V10 — sản phẩm Google Sheets Smart hiện hành

| Module và chức năng con | Hiện trạng và khoảng trống | Đề xuất |
| --- | --- | --- |
| BẮT ĐẦU/Help | Onboarding ba bước, Help theo mục, FAQ, anchor đã thử live. Progress hiện dựa số bản ghi, có thể coi dữ liệu chưa hợp lệ là hoàn thành. | **P1:** progress dựa bản ghi hợp lệ và CTA sửa lỗi tại chỗ; ví dụ có thể xem nhưng không tự ghi vào dữ liệu khách. |
| Danh mục | Sáu loại: nhóm vật tư, đơn vị, nhóm mẻ, nhóm món, đơn vị bán, size. CRUD có kiểm tra trùng/đổi tên; unit/size đang dùng bị chặn đổi. Dropdown chung theo bản sao. Tìm/lọc, bulk nhập, lịch sử chi tiết danh mục chưa rõ. | **P0:** nghiệm thu live thêm/chọn/đổi tên/chặn đổi đơn vị và bản sao cũ. **P1:** tìm trong danh mục dài, hiển thị số nơi đang dùng trước xóa/đổi tên; không cần bulk ở quy mô nhỏ. |
| Nguyên liệu/bao bì | Hai module UI, chung bảng vật tư với `materialType`; giá đơn vị = giá mua/lượng dùng được; tìm tên/mã, lọc nhóm, CRUD, chặn xóa nguồn đang dùng. Legacy nhóm Bao bì tương thích. Lịch sử giá chỉ thấy audit hành động, chưa thấy giá trị trước/sau. | **P0:** test live CRUD và đổi giá lan truyền đến mẻ/món/report; xử lý dữ liệu nguồn lỗi mà không trả cost giả. **P1:** lịch sử giá trước/sau và màn “món bị ảnh hưởng” trước lưu thay đổi lớn. **P2:** nhập giá hàng loạt qua bảng dán có preview nếu số vật tư đủ lớn. |
| Mẻ/bán thành phẩm | Recipe Builder nhiều thành phần, nhóm/đơn vị thực thu, preview cost, CRUD, nhân bản, tìm/lọc nhóm/trạng thái. Một tầng mẻ; vòng tham chiếu bị chặn. Multi-table write không transactional. | **P0:** test lỗi giữa chừng khi lưu công thức và cách khôi phục; test hai người sửa cùng mẻ. **P1:** so sánh bản cũ/mới và cảnh báo thành phần không còn hợp lệ. **P2:** phiên bản công thức nếu khách thực sự cần đối chiếu theo thời điểm. |
| Món/thành phẩm | Công thức, bao bì riêng, nhóm, đơn vị bán, size, giá bán, mục tiêu cost, nhân bản; tính cost/tỷ lệ/giá gợi ý, tìm/lọc, cảnh báo thiếu dữ liệu. Không có doanh số thực nên “còn lại” không phải lợi nhuận. | **P0:** test live lưu/tải/refresh, size trống, source sai loại, ngoại lệ thiếu giá/định lượng; giữ cost cũ đúng khi đổi phân loại. **P1:** xem trước tác động đổi nguồn/giá, cảnh báo mục tiêu gắn đường dẫn đến món. **P2:** mô phỏng giá bán nhưng không ghi thành doanh thu. |
| Dashboard web + Sheet | Web có 4 KPI + 6 phân tích theo nhóm, đã nhìn live với dữ liệu mẫu; Sheet 4 KPI + 6 chart công thức. Báo cáo refresh trong Settings đã chạy live trên bản sao chủ. Chưa có thử thay dữ liệu nghiệp vụ live rồi đối chiếu cả hai bề mặt. | **P0:** nghiệm thu cùng phạm vi số liệu sau mutation, thêm món đổi thứ hạng, trạng thái rỗng, bản sao độc lập. **P1:** chú giải phạm vi/lần cập nhật và CTA sửa trực tiếp từ cảnh báo. Không thêm chỉ số doanh thu khi thiếu giao dịch. |
| Cài đặt, repair, audit | Cài VND/mục tiêu/làm tròn/mật độ; kiểm tra/cập nhật report; repair có backup trước khi dựng lại layout. Audit ghi thời gian, actor dạng temporary key, action, entity ID; chưa thấy diff, restore nghiệp vụ hay giao diện lịch sử. | **P0:** test repair live trên test copy, lỗi schema, lock/concurrency, xác nhận backup giữ dữ liệu. **P1:** lịch sử thay đổi đủ đọc cho chủ file, ghi trước/sau với thông tin an toàn; thông báo báo cáo chậm đồng bộ. **P2:** undo có giới hạn cho thao tác vừa thực hiện. |
| Sao chép/tenancy/OAuth | Bound launcher và menu đã thấy trên bản sao thật, host USER_ACCESSING, RPC mang copy ID; báo cáo refresh live trên owner copy. Khách mới gặp cảnh báo OAuth chưa xác minh; business CRUD và test tài khoản độc lập chưa chạy. | **P0 phát hành:** giải quyết/công bố tình trạng OAuth, thử khách mới, hai bản sao/hai tab/tài khoản, CRUD và xác nhận master không đổi. Không gọi sẵn sàng bán trước cổng này. |

## 3. Factory và các workbook khác

Factory tạo XLSX theo config, có design tokens, formulas, validation, dashboard, QC, version/manifest. CLI hiện là factory workbook; pipeline Google Sheets Smart V10 là quy trình riêng có script/deployment, chưa thành một lệnh CLI chung. Với Shop Online Mini, Kho Mini, Công nợ, cần audit **theo đúng bản cuối đang giao**: dữ liệu và sức chứa; thêm/sửa/xóa, dropdown đầu/giữa/cuối, lọc, công thức khi thêm dòng, ngoại lệ, cảnh báo, report, bảo vệ, mở lại, so với mẫu. Không tự gán CRUD webapp hoặc tự động hóa Cost cho workbook khác.

**P0:** lập sổ sản phẩm/phiên bản/link đang bán, mapping source → artifact → bằng chứng, test file thật theo `AGENTS.md`. **P1:** một mẫu hồ sơ kiểm thử chuẩn và màn bàn giao một link, chặn QC pass nếu bản phát hành khác bản đã kiểm. **P2:** tự động hóa khâu lặp lại sau khi luồng thủ công đã ổn định; không dựng framework chung cho nghiệp vụ khác nhau.

## Thứ tự thực hiện đề xuất

1. **P0 — khóa rủi ro hiện hữu:** bản đồ phiên bản/live và ma trận test; Cost V10 OAuth + CRUD + hai bản sao + report; storefront giá/đơn/webhook/giao file; kiểm tra quyền admin/rules. Chỉ test trên bản sao/sandbox, không sửa giá hoặc đơn live.
2. **P1 — làm dễ dùng và dễ vận hành:** timeline đơn, lịch sử giá/công thức, tìm/lọc admin, cảnh báo có CTA, trạng thái rỗng/lỗi/đang chờ nhất quán, hướng dẫn đúng ngay tại bước.
3. **P2 — mở rộng khi dữ liệu chứng minh:** bulk import, phân quyền nhiều nhân viên, phân tích sâu, tự động nhắc. Mỗi đề xuất cần owner, chỉ số sử dụng và điều kiện bỏ.

## Ví dụ discovery: Quản lý tài sản

**Giả định để grill, chưa chốt phạm vi:** cửa hàng/đội nhỏ quản lý tài sản hữu hình như máy móc, laptop, thiết bị; một chủ file và vài người nhận bàn giao. Sản phẩm mới có template/host riêng theo pipeline, không sao chép cost engine. Luồng lõi: **khai báo tài sản → giao người/bộ phận → kiểm kê/bảo trì → thu hồi/điều chuyển/thanh lý → báo cáo**. Một tài sản có ID bất biến; sự kiện làm thay đổi trạng thái và người giữ phải có lịch sử. Không yêu cầu khách nhập hai lần cùng một giao dịch.

| Module | P0 tối thiểu | P1 khi có nhu cầu | P2 có điều kiện |
| --- | --- | --- | --- |
| Danh mục/cấu hình | Loại tài sản, đơn vị/bộ phận, vị trí, trạng thái, người giữ; mã ổn định, không trùng, không xóa mục đang dùng | Mẫu tên/mã gợi ý, tìm và lọc mục đang dùng | Cấu trúc nhiều cơ sở |
| Sổ tài sản | Tên, mã, serial nếu có, ngày mua, nguyên giá nếu theo dõi, tình trạng, ảnh/tài liệu tùy chọn; CRUD, tìm mã/tên/serial, lọc loại/vị trí/trạng thái | Dán nhiều dòng có preview lỗi, nhãn QR | Import từ hệ thống khác |
| Bàn giao/điều chuyển/thu hồi | Mỗi thao tác tạo sự kiện ngày, từ ai/đâu đến ai/đâu, người thực hiện, ghi chú; không ghi đè lịch sử; chặn bàn giao tài sản đã thanh lý | Xác nhận người nhận, in biên bản | Chữ ký điện tử/tích hợp nhân sự |
| Kiểm kê | Kỳ kiểm kê, danh sách kỳ vọng, đánh dấu tìm thấy/thiếu/hỏng, xử lý chênh lệch; không âm thầm đổi người giữ | Kiểm kê bằng QR trên điện thoại, thao tác hàng loạt có xác nhận | Offline sync nếu thực địa cần |
| Bảo trì/bảo hành | Ngày đến hạn, tình trạng, chi phí và lịch sử; nhắc quá hạn trong app; không biến “đang bảo trì” thành thất lạc | Lịch nhắc theo chu kỳ/email khi có quyền và nhu cầu | Ticket nhà cung cấp, tích hợp lịch |
| Thanh lý/mất/hỏng | Quy tắc đóng tài sản, ngày/lý do, người duyệt; không cho giao tiếp sau khi đóng; báo cáo giữ được lịch sử | Quy trình đề xuất/phê duyệt | Đấu giá/bán thanh lý |
| Tổng quan | 4 KPI + 6 biểu đồ **chỉ nếu đây là bản thương mại theo chuẩn hiện hành**, chọn câu hỏi thực: đang dùng, chưa giao, đến hạn, chênh kiểm kê, theo nhóm/vị trí, biến động kỳ | Bộ lọc kỳ/cơ sở thống nhất, drill down | Phân tích vòng đời/chi phí sở hữu |

### Câu hỏi grill cần chủ sản phẩm trả lời trước khi chốt PRD

1. “Tài sản” gồm những gì: tài sản cố định, công cụ dụng cụ, hàng tồn để bán, hay cả vật tư tiêu hao? Một chiếc ghế và 100 cây bút được quản lý cùng cách không?
2. Khách mục tiêu có bao nhiêu tài sản, bao nhiêu cơ sở/người giữ, và ai là người cập nhật? Một tài sản theo chiếc hay theo lô số lượng?
3. Có cần quản lý nguyên giá, khấu hao, giá trị còn lại theo kế toán không? Nếu có, chuẩn phương pháp/kỳ/thuế nào, ai chịu trách nhiệm xác nhận? Không tự gọi giá trị tính thử là số kế toán.
4. Tài sản có serial/QR bắt buộc không? Khi trùng serial nhưng khác cơ sở, đó là lỗi hay hợp lệ?
5. Người nhận bàn giao có cần đăng nhập và xác nhận, hay chủ file ghi nhận một phía là đủ? Cộng tác viên có quyền sửa tài sản của người khác không?
6. Khi mất, hỏng, đang sửa, cho mượn, chuyển cơ sở, thanh lý: trạng thái nào loại khỏi “đang sử dụng”, trạng thái nào vẫn tính trong tổng tài sản?
7. Kiểm kê diễn ra theo kỳ hay bất chợt? Chênh lệch có cần duyệt trước khi sửa sổ? Cần chụp ảnh/biên bản không?
8. Bảo trì cần nhắc trong app, email hay không nhắc? Ai nhận thông báo, trước hạn bao lâu, nếu quá hạn thì ai xử lý?
9. Khách đang có danh sách Excel/Sheets cũ không? Cột nào và độ sạch ra sao? Cần nhập hàng loạt ở lần đầu hay chỉ vài chục dòng?
10. Sáu câu hỏi báo cáo nào giúp khách ra quyết định hàng tuần? Nếu không có câu hỏi thực, không tạo biểu đồ chỉ để đủ số.
11. Cần phục vụ trên điện thoại lúc đi kiểm kê không? Mạng yếu/offline có phải tình huống thường gặp?
12. Chủ sản phẩm muốn bán một file cho một đơn vị theo `/copy`, hay có nhiều cơ sở cùng làm trên một bản sao? Điều này quyết định quyền, lịch sử và xung đột ghi.

### Slice MVP đề nghị để kiểm chứng

Một đơn vị, tài sản theo chiếc, VND, không khấu hao kế toán ở vòng đầu: **thêm 3 tài sản → bàn giao 1 → điều chuyển 1 → đánh dấu bảo trì 1 → kiểm kê → xem 4 KPI/6 câu hỏi phù hợp**. Thử đổi tên người/bộ phận, trùng mã/serial, thiếu ngày, hai tab sửa cùng tài sản, bản sao A/B, refresh và master không đổi. Chỉ sau khi chốt 12 câu hỏi trên mới khóa schema/UX và kế hoạch triển khai.
