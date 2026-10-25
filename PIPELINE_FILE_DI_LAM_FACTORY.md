# Pipeline File Đi Làm Factory

Cập nhật: **18/10/2026**. Đây là **tài liệu pipeline sản xuất chính** của File Đi Làm. Trước khi tạo hoặc nâng cấp sản phẩm, đọc file này cùng `AGENTS.md` và `system_filedilam.md`. `file_di_lam_factory/README.md` chỉ dẫn tới công cụ; Project Brain và `brain.json` lưu hiện trạng, quyết định và bằng chứng. Không duy trì một pipeline khác thay thế file này.

## Luồng bàn giao bắt buộc: Google Sheets Smart bán bằng /copy

### Giọng lời thoại giới thiệu sản phẩm — lồng tiếng Adam

Chốt theo chỉnh sửa của chủ sản phẩm ngày 18/10/2026:

- Người nói xưng **“chồng”**, gọi người nghe là **“con vợ”**. Không tự đổi sang “tui”, “mình”, “bạn” hoặc cách xưng hô khác trong lời thoại. Quy tắc này dành cho kịch bản giới thiệu/lồng tiếng, không đưa vào nhãn giao diện hay thông báo hệ thống.
- Viết để đọc thành tiếng bằng giọng Adam: câu ngắn, nhịp nói tự nhiên, gần gũi như đang chỉ cách dùng cho người quen. Không viết như brochure, không diễn quá, không nhồi khẩu hiệu hoặc lặp “con vợ” ở mọi câu.
- Hook mở bằng tình huống cụ thể mà người dùng gặp: chưa biết cost một ly, quên bao bì, giá nguyên liệu tăng phải tính lại. Tránh câu giật gân, khẳng định khách đang lỗ hoặc những lời hứa thiếu căn cứ.
- Nếu yêu cầu khoảng một phút: nhắm khoảng 150–180 từ, điều chỉnh theo tốc độ đọc thực tế. Bản chưa được đọc/đo thời gian thì chỉ ghi là thời lượng dự kiến. Khi người dùng cần lời thoại, trả đoạn đọc liền, không chèn tiêu đề, chỉ dẫn sân khấu hay ký hiệu không cần thiết vào nội dung đọc.
- Giới thiệu bằng thao tác và ích lợi có thật: nhập giá mua/lượng dùng được, bao bì riêng, tính mẻ theo thực thu, chọn định lượng món, đổi giá tính lại, xem tổng quan. Không kể dồn tất cả module như đọc danh sách tính năng.
- Giữ đúng nghiệp vụ: khoản còn lại sau chi phí trực tiếp chưa phải lợi nhuận ròng; không nói ứng dụng đã tính đủ tiền thuê, điện nước, nhân công hoặc khẳng định tương thích/chạy tức thì khi chưa kiểm chứng.

Mẫu giọng đã được chủ sản phẩm chốt để lưu:

> Con vợ bán một ly ba chục… mà chồng hỏi ly đó tốn bao nhiêu, con vợ có trả lời liền được không?
>
> Hay cũng phải lấy giấy ra cộng tiền trà, tiền sữa, rồi nhớ thêm cái ly, cái nắp?
>
> Chồng làm cái này để con vợ đỡ ngồi tính lại nè.
>
> Nguyên liệu mua về bao nhiêu tiền, dùng được bao nhiêu thì nhập vô. Ly, nắp, hộp, túi có phần bao bì riêng.
>
> Có ủ trà, nấu syrup hay làm sốt thì ghi công thức mẻ với lượng thực tế thu được.
>
> Tới lúc tính một món, con vợ chọn thành phần, điền lượng dùng. Tổng cost hiện ngay bên cạnh. Nhập thêm giá bán là biết cost chiếm bao nhiêu phần trăm, còn lại bao nhiêu sau những khoản đã tính.
>
> Mai mốt sữa tăng giá, con vợ sửa giá rồi lưu. Mấy món dùng sữa đó được tính lại, khỏi dò từng công thức.
>
> Muốn xem món nào cost cao, món nào còn thiếu dữ liệu thì mở tổng quan.
>
> Nhớ nha, còn lại bao nhiêu chưa phải lời bấy nhiêu. Tiền thuê, điện nước, nhân công vẫn phải tính thêm.
>
> Chồng chỉ muốn con vợ biết rõ mỗi món tốn bao nhiêu, rồi hãy quyết định bán giá nào.

Mẫu này lưu để tham chiếu giọng và cách xưng hô; chưa đo thời lượng bằng bản thu Adam, không mặc định là đúng một phút.

### Quy trình mặc định: chủ sản phẩm đưa prompt, agent tự hoàn thành phần kỹ thuật

Kiểm tra trải nghiệm vận hành trước bàn giao (bài học 18/10/2026):
- Bootstrap chỉ đọc dữ liệu/calculate cần thiết; không dựng lại bố cục, chart, protection và flush Sheet mỗi lần mở webapp. Báo cáo cập nhật sau thay đổi nghiệp vụ hoặc bằng nút cập nhật riêng. Migration chỉ ghi khi thiếu cấu trúc mới đã biết.
- Gom mỗi bảng thành một lần getDataRange/getValues trong một request. Cache chỉ sống theo request/bản sao, phải invalidation sau write và xóa ở finally; không cache chung dữ liệu khách giữa request. Lưu bằng chứng số lần gọi, đo thời gian live riêng, không lấy timing fixture để quảng cáo tốc độ.
- Không gọi Session.getEffectiveUser/getEmail chỉ để bảo vệ sheet khi manifest không có userinfo.email. Không mở thêm scope nhận diện chỉ để chữa lỗi trình bày. Thử chức năng cập nhật báo cáo thật với đúng scope.
- Liên kết mục lục Help trong iframe có base target=_top phải preventDefault và scroll/focus nội bộ. Thử bấm từng mục, xác minh không đổi URL hoặc mở tab mới.
- Dashboard webapp giữ 4 KPI + 6 câu hỏi phân tích đồng bộ bộ lọc, nguồn tính thật, xếp hạng toàn bộ món; hình cột/vòng tròn và chú giải rõ. Tránh card biểu đồ quá cao khi chỉ có một món. Không tự thêm doanh thu/lịch sử không có dữ liệu.

Chốt lại theo yêu cầu chủ sản phẩm ngày 18/10/2026: **đưa yêu cầu nghiệp vụ → agent tự làm trọn Sheet + Apps Script gắn sẵn + webapp + cấu hình + triển khai + kiểm tra → bàn giao một link sản phẩm.** Đây là cách làm mặc định cho sản phẩm Google Sheets Smart tiếp theo.

- Agent tự tạo/chuẩn bị file mẫu, script bound và host cần thiết bằng công cụ đã kết nối; tự điền ID, URL và cập nhật deployment. Chủ sản phẩm không phải tự tạo nhiều file, mở nhiều project, chép 2–3 file code hoặc nối link thủ công. Các project kỹ thuật có thể tồn tại phía sau nhưng không trở thành công việc bàn giao cho người dùng.
- Với nâng cấp cùng sản phẩm: tái dùng file mẫu và URL host ổn định; giữ dữ liệu/bản sao đang dùng, có migration phù hợp. Chỉ tạo sản phẩm riêng khi yêu cầu sản phẩm mới; không sinh thêm link/project chỉ vì sửa giao diện hay thêm danh mục.
- Khách chỉ tạo bản sao Google Sheet, chờ menu File Đi Làm xuất hiện và bấm Mở ứng dụng. Nếu khách gọi menu này là extension, hiểu đúng ý thao tác đó; không bắt khách cài extension Marketplace hay mở Apps Script editor.
- Apps Script đã gắn sẵn trước khi giao và được sao chép theo Sheet; không phải đến khi khách bấm menu mới yêu cầu dán code để tạo script. Google vẫn có thể yêu cầu cấp quyền lần đầu.
- Nếu công cụ/quyền truy cập thật sự chặn tự động hóa, nêu đúng bước bị chặn và chỉ yêu cầu thao tác tối thiểu tại đó. Không quay lại hướng dẫn cài đặt thủ công toàn bộ, không hứa vượt qua OAuth và không tuyên bố đã hoàn tất phần chưa kiểm chứng.
- Đây là quy trình agent điều phối bằng connector/API và mã sản xuất hiện có. Không mô tả thành factory CLI một lệnh hoặc tự động hoàn toàn từ repo trống khi chưa có triển khai tương ứng.

Prompt tái sử dụng: **“Tạo/nâng cấp [tên sản phẩm] theo PIPELINE_FILE_DI_LAM_FACTORY.md. Bạn tự làm toàn bộ Google Sheet, Apps Script gắn sẵn, webapp, cấu hình, deploy và kiểm thử. Giao một link để tôi/khách tạo bản sao rồi mở ứng dụng từ menu, không yêu cầu chép code hay tự nối link.”**

### Mô hình đã chốt cho Cost: ứng dụng nhập liệu, Sheet trình bày và báo cáo

- Webapp là nơi thêm/sửa/xóa danh mục, nguyên liệu, mẻ và món. Không mở thêm một luồng nhập trực tiếp trên bảng dữ liệu thô.
- Google Sheet vẫn là một sản phẩm hoàn chỉnh về trình bày: BẮT ĐẦU đẹp, nút mở ứng dụng đúng bản sao; TỔNG QUAN pastel theo Shop Online với 4 KPI + 6 biểu đồ. Chỉ hai trang này hiện; bảng lưu dữ liệu, nguồn công thức và nhật ký được ẩn/bảo vệ.
- Biểu đồ và KPI dùng công thức đọc toàn bộ bảng kết quả từ cùng cost engine. Khi lưu/tải dữ liệu trên ứng dụng, cập nhật bảng kết quả và ghi thời điểm bằng kiểu ngày thật, định dạng dd/mm/yyyy. Không tạo hai nguồn nghiệp vụ độc lập; báo cáo không tự theo dõi sửa tay vào bảng kỹ thuật.
- Kiểm tra schema trước khi ghi: thiếu bảng, thiếu/trùng tên cột, trùng ID phải chặn kèm thông báo. Tra cứu theo header, không phụ thuộc vị trí cột hoặc màu. Không tự tạo lại bảng bị xóa thành bảng rỗng rồi báo thành công.
- Bảo vệ chỉ chống sửa nhầm; chủ bản sao vẫn có thể gỡ. Không hứa khóa tuyệt đối. Cấu hình hiện tại hướng tới chủ bản sao; cộng tác viên cần nghiệm thu quyền riêng.
- Cài đặt trong ứng dụng có Kiểm tra/cập nhật báo cáo và Khôi phục giao diện. Khôi phục sao lưu các bảng dữ liệu và hai trang hiển thị vào tab ẩn trước khi dựng lại bố cục; không reset nghiệp vụ. Schema đã hỏng phải khôi phục từ lịch sử phiên bản, không đoán cấu trúc để ghi tiếp.
- Cập nhật công thức theo locale thực tế. vi_VN dùng dấu chấm phẩy cho tham số và dấu gạch chéo ngược cho cột trong array literal; giữ nguyên dấu phẩy bên trong chuỗi QUERY. Đọc effectiveValue để bắt lỗi parse, không chỉ kiểm tra chuỗi công thức.
- Nút mở ứng dụng trong mẫu phải dẫn /copy; onOpen của bound launcher cập nhật link trong bản sao bằng ID file đang mở. Link tĩnh sao chép từ master không đủ.
- Kiểm thử schema, bảo toàn dữ liệu khi repair, cập nhật report, dropdown được mở khóa, 6 chart series, ảnh Google-rendered và /copy. Tách rõ kiểm thử fixture, connector và thực thi Apps Script live.

### Danh mục dùng chung trong ứng dụng

- Bao bì có module quản lý riêng và dropdown nguồn riêng, dùng chung bảng giá vật tư phía sau. `materialType` phân biệt INGREDIENT/PACKAGING độc lập tên nhóm; dữ liệu cũ nhóm Bao bì được nhận diện tương thích. Đổi tên nhóm không được làm mất loại bao bì.
- Thêm thành phần chỉ chọn nguyên liệu/mẻ; Thêm bao bì chỉ chọn vật tư PACKAGING, không chọn mẻ. Kiểm tra loại cả phía máy chủ. Giữ nguyên liên kết/chi phí các dòng lịch sử đã lưu; dòng cũ khác loại phải hiển thị để kiểm tra, không tự bỏ làm thấp cost. Chặn chuyển loại vật tư đang dùng trong công thức.

- Cost có đủ sáu loại danh mục: nhóm nguyên vật liệu (GROUP), đơn vị mua/tính/thực thu (UNIT), nhóm bán thành phẩm (BATCH_GROUP), nhóm thành phẩm (PRODUCT_GROUP), đơn vị bán (SALE_UNIT), size (SIZE). Nhóm mẻ và nhóm món không lấy nhầm danh mục nhóm nguyên liệu.
- Form mẻ chọn nhóm + đơn vị thực thu. Form món chọn nhóm + đơn vị bán + size tùy chọn; Không phân size là lựa chọn hợp lệ. Không buộc khách nhét size vào tên món. Đơn vị bán không dùng để tự đổi định lượng nguyên liệu.
- Mỗi size có định lượng riêng nếu cần: nhân bản công thức, chọn size và sửa định lượng rồi lưu thành ID mới. Thay nhãn size không tự nhân lượng hoặc tạo món mới. Danh sách, bộ lọc nhóm và báo cáo phải phân biệt được các size.
- Nâng cấp bản sao cũ bằng cách bổ sung cột cuối bảng có kiểm tra, giữ ID, công thức và giá đã nhập; không tự đoán nhóm/size cho dữ liệu cũ. Món chưa có nhóm có bộ lọc riêng để bổ sung dần.
- Đổi tên nhóm cập nhật đúng bảng liên quan, giữ nguyên ID và cost. Đơn vị tính, đơn vị bán và size đang được dùng không được đổi tên âm thầm; thêm lựa chọn mới để giữ ý nghĩa dữ liệu cũ. Chặn trùng tên trong cùng loại danh mục.
- Nghiệm thu bắt buộc: lưu/tải lại nhóm mẻ, nhóm món, đơn vị bán và size; size trống; lựa chọn mới; đổi tên nhóm; chặn đơn vị/size đang dùng; lọc nhóm; nhân bản; xác nhận cost không đổi chỉ vì đổi phân loại. Ghi riêng kết quả fixture và Apps Script live.

- Khai báo nhóm và đơn vị tập trung tại module Danh mục; các form nguyên liệu/mẻ chọn dropdown từ cùng nguồn của bản sao. Không để nhập tự do các nhãn cần đồng bộ.
- Nguyên liệu và công thức mới được đặt tên tại module tương ứng. Thành phần công thức chọn nguyên liệu/mẻ bằng ID ổn định.
- Khi nâng cấp, giữ lựa chọn cũ đang được sử dụng. Đổi tên nhóm cập nhật bản ghi liên quan; chặn đổi tên đơn vị đang dùng để tránh đổi ý nghĩa định lượng. Không tự suy diễn quy đổi khối lượng/thể tích.
- Kiểm tra thêm lựa chọn rồi chọn thật trên các form. Bằng chứng trình duyệt fixture phải phân biệt với kiểm tra Apps Script live.

**Khách bấm link /copy → tạo bản sao → Sheet tải xong và menu tự xuất hiện → mở ứng dụng → cấp quyền Google lần đầu nếu được yêu cầu → thao tác trên dữ liệu bản sao của khách.**

- Đây là Apps Script gắn với file (container-bound), không phải extension Marketplace. Script phải được gắn sẵn vào file mẫu trước khi giao; code nằm local chưa chứng minh bản sao có menu.
- Khách không mở Apps Script editor, không dán code, không triển khai, không nhập Spreadsheet ID và không dán URL /exec. Hướng dẫn phát triển dành cho nhà sản xuất tuyệt đối không trở thành hướng dẫn sử dụng của khách.
- Nhà sản xuất triển khai Web App chung và nhúng URL thật vào launcher trong file mẫu. Launcher đọc `getActiveSpreadsheet().getId()` để mở đúng bản sao.
- URL host có thể dùng chung và ổn định; **database của khách phải riêng**. Mỗi RPC phải mang ID bản sao tương ứng và kiểm tra quyền người gọi. Không trỏ mọi khách về file master; không fallback master khi thiếu ID.
- Không dùng UserProperties để lưu “bản sao vừa mở” làm nguồn định tuyến vì cùng người mở hai tab có thể ghi nhầm. Dùng ngữ cảnh theo từng request.
- Host chạy bằng quyền người truy cập (`USER_ACCESSING`). Không đổi sang quyền chủ sản phẩm để né yêu cầu cấp quyền.
- OAuth lần đầu và cảnh báo ứng dụng chưa xác minh là cổng nghiệm thu riêng; không hứa không cần cấp quyền hoặc sản phẩm đã sẵn sàng bán khi chưa kiểm tra.

### Thứ tự sản xuất để làm nhanh và đúng

1. Đọc pipeline này, đặc tả sản phẩm, nguồn code và bằng chứng hiện có. Xác định đang nâng cấp sản phẩm cũ hay tạo sản phẩm độc lập.
2. Tái dùng shell, sidebar, form, bảng, trạng thái và responsive đã đạt chất lượng. Thay nghiệp vụ theo sản phẩm; không chép logic kho vào cost, không dựng dashboard tạm rồi gọi là phần mềm hoàn chỉnh.
3. Thiết kế schema, ID ổn định, repository, services, cost engine và UI; tách phần tính khỏi vị trí ô và phần trình bày.
4. Làm trọn một luồng nhỏ trước: với cost là **nguyên liệu → mẻ → món → dashboard → đổi giá → cập nhật kết quả**.
5. Build, kiểm tra cú pháp, tính toán, CRUD và quan hệ dữ liệu trên fixture/test copy. Không dùng dữ liệu khách thật để thử xóa/reset.
6. Tạo/chuẩn bị file mẫu, host và bound launcher. Nhà sản xuất điền cấu hình; ghi project ID, deployment ID, version và URL vào hồ sơ. Không ghi token/OAuth credentials vào repo.
7. Deploy hoặc cập nhật version trên deployment ổn định. Đọc lại source/manifest/URL thực tế; không suy đoán link hoặc mở /null.
8. Tạo bản sao bằng chính link /copy trên trình duyệt; kiểm tra menu, quyền Google, mở app và thao tác thật.
9. Ghi kết quả kiểm thử, ảnh và giới hạn; cập nhật Project Brain, brain.json và hồ sơ phiên bản. Chỉ sau nghiệm thu mới chuẩn bị quyền xem/link bán theo quyết định của chủ sản phẩm.

### Cổng nghiệm thu bắt buộc trước bàn giao thương mại

- [ ] File mẫu có script bound; /copy sao chép script và menu tự xuất hiện sau khi tải xong.
- [ ] Menu mở đúng deployment và truyền đúng ID bản sao, không yêu cầu khách cấu hình.
- [ ] Cấp quyền lần đầu và mở Web App thành công; ghi rõ tình trạng OAuth verification.
- [ ] Tạo/sửa/xóa có kiểm soát; tính toán đúng; tải lại trình duyệt vẫn giữ dữ liệu.
- [ ] Đổi đầu vào cập nhật kết quả phụ thuộc, dashboard và cảnh báo.
- [ ] Thử hai bản sao, hai tab và tài khoản khách độc lập; không ghi chéo hoặc thay master.
- [ ] Mỗi nút/trang có chức năng thật; không lộ form không liên quan ở Help/Settings/Dashboard.
- [ ] Đã xem ảnh desktop/tablet/mobile và thử chọn dropdown, lưu, hủy, xác nhận xóa thực tế.
- [ ] Quyền xem file mẫu, link /copy và nội dung hướng dẫn đã khớp cách bán.

Không đánh dấu đạt bằng test cấu trúc thay cho thao tác trên môi trường đích. Nếu bị chặn ở OAuth, ghi rõ điểm dừng; không báo đã kiểm thử ghi dữ liệu live.

### Triển khai tham chiếu và mức tự động hóa thực tế

- Kho Mini Smart: `outputs/quan_ly_kho_mini_smart_gas/` — nguồn shell và quy trình cũ, phải kiểm tra trước khi tái dùng.
- Cost V10: `outputs/fnb_cost_v10/` — host riêng + bound launcher, build/deploy/readback và test định tuyến bản sao.
- V10 đã tạo/deploy; browser thật xác nhận script được sao chép và menu tự xuất hiện. Bước cấp quyền gặp cảnh báo ứng dụng chưa xác minh; chưa xác nhận live writes hoặc tài khoản khách khác. Bằng chứng: `verification.json`, `tenancy-tests.json`, `copied-sheet-menu.png`.
- Factory CLI hiện vẫn là factory workbook. V10 chưa được đăng ký thành một lệnh CLI sản xuất chung. `deploy.py` hiện cần file mẫu đã khởi tạo và hồ sơ đúng sản phẩm; không copy deployment.json cũ rồi chạy để tạo sản phẩm khác.
- Các phần kho/Smart v3 bên dưới là mô tả chuyên biệt hoặc roadmap; không tự áp mọi module, số sheet và dữ liệu demo kho vào sản phẩm cost. Yêu cầu mới nhất của người dùng quyết định phạm vi.

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
- Mỗi sản phẩm có một host Apps Script chính cho Web App chung; file master có bound launcher riêng được sao chép theo file khách. Không hiểu “một project” thành bỏ script bound hoặc bắt khách tự deploy bản sao.
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
- URL Web App có thể cố định dùng chung, nhưng phải nhận ID bản sao và đọc/ghi bằng quyền khách; không dùng database cố định trỏ về file master
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
