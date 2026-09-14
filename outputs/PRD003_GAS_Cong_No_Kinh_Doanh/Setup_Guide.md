# HƯỚNG DẪN CÀI ĐẶT & SỬ DỤNG PHẦN MỀM QUẢN LÝ CÔNG NỢ KINH DOANH (GOOGLE SHEETS)

Bộ phần mềm này được thiết kế theo dạng **Google Sheets + Apps Script**, mang lại trải nghiệm như một ứng dụng (WebApp) tích hợp thẳng vào bảng tính Excel/Google Sheets của bạn.

## BƯỚC 1: TẠO CẤU TRÚC FILE GOOGLE SHEETS
Mở Google Sheets, tạo một file mới và đổi tên thành **"Phần mềm Quản lý Công nợ Kinh Doanh"**.
Tạo chính xác 2 Sheet (Trang tính) với tên như sau:

### Sheet 1: `Danh_Muc_Doi_Tac`
Tạo các cột ở dòng 1:
- A1: `Mã ĐT`
- B1: `Tên Khách hàng / Đại lý / Nhà cung cấp`
- C1: `Phân loại`
- D1: `Email kế toán`
- E1: `Số điện thoại`
- F1: `Dư nợ hiện tại` (Cột này sẽ tự động tính toán tổng từ Sheet phát sinh, tạm thời để trống hoặc nhập số cố định)

**DỮ LIỆU MẪU (SEED DATA KINH DOANH):**
Bạn copy dữ liệu dưới đây dán vào từ dòng số 2:
```text
Mã ĐT   | Tên Khách hàng / Nhà cung cấp | Phân loại | Email kế toán         | Số điện thoại | Dư nợ hiện tại
KH001   | Cửa hàng VLXD Phát Đạt       | KH        | ketoan@phatdat.vn     | 0901234567    | 150000000
KH002   | Đại lý Tạp hóa Cô Ba         | KH        | coba@gmail.com        | 0987654321    | 4550000
DL001   | Tổng kho Phân phối Miền Nam  | KH        | hotro@tongkho.vn      | 18006858      | 0
NCC01   | Cty TNHH Sản xuất ABC        | NCC       | sale@abc.com          | 0909123456    | 22000000
```

### Sheet 2: `Phat_Sinh_Cong_No`
Tạo các cột ở dòng 1 (Đây là nơi App sẽ tự động ghi dữ liệu vào, KHÔNG cần nhập tay):
- A1: `Mã Giao Dịch`
- B1: `Thời gian`
- C1: `Mã Đối Tác`
- D1: `Tên Đối Tác`
- E1: `Loại Giao Dịch`
- F1: `Số Tiền`
- G1: `Ghi Chú`

---

## BƯỚC 2: CÀI ĐẶT APPS SCRIPT (VIP PRO UI)
1. Trên thanh công cụ của Google Sheets, chọn **Tiện ích mở rộng (Extensions)** > **Apps Script**.
2. Một cửa sổ code mở ra. Xóa đoạn code mặc định có sẵn.
3. Mở file `Code.gs` trong thư mục này, copy toàn bộ nội dung và dán vào đó.
4. Bấm vào biểu tượng **Dấu cộng (+)** bên góc trái phần Tệp, chọn **HTML**. Đặt tên tệp chính xác là `Sidebar`.
5. Mở file `Sidebar.html` trong thư mục này, copy toàn bộ nội dung và dán đè lên nội dung của tệp Sidebar vừa tạo.
6. Bấm biểu tượng **Lưu (Save)**.

---

## BƯỚC 3: CẤP QUYỀN VÀ SỬ DỤNG
1. Tải lại (Refresh/F5) trang Google Sheets của bạn.
2. Bạn sẽ thấy một Menu mới xuất hiện trên thanh công cụ tên là: **"🏥 CÔNG NỢ VIP PRO"**.
3. Bấm vào đó, chọn **"📝 Mở Form Nhập Liệu"**.
4. Lần đầu tiên chạy, Google sẽ yêu cầu cấp quyền (Authorization Required). Bấm Continue -> Chọn tài khoản Google của bạn -> Advanced (Nâng cao) -> Go to project (Đi tới dự án) -> Allow (Cho phép).
5. Sau khi cấp quyền, bấm lại "Mở Form Nhập Liệu", một Sidebar cực kỳ chuyên nghiệp sẽ trượt ra bên phải màn hình.
6. Bạn chỉ cần chọn tên Khách hàng, nhập số tiền thanh toán hoặc bán hàng, bấm Lưu. Dữ liệu sẽ tự động nhảy vào Sheet `Phat_Sinh_Cong_No`!

---

## TÍNH NĂNG ĐẶC BIỆT: GỬI EMAIL NHẮC NỢ TỰ ĐỘNG
Chỉ cần bấm **"🏥 CÔNG NỢ VIP PRO"** > **"✉️ Gửi Email Nhắc Nợ Tự Động"**.
Hệ thống sẽ tự động quét danh sách, đối tác nào đang có Dư nợ > 0 và có điền Email, hệ thống sẽ tự động gửi một email nhắc nợ chuyên nghiệp từ chính Gmail của bạn!
