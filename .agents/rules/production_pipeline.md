# KẾ HOẠCH SẢN XUẤT (PRODUCTION PIPELINE) CHO FILE ĐI LÀM MVP

Quy định này bắt buộc áp dụng khi khởi tạo và đưa một sản phẩm số mới lên hệ thống web (storefront).

## 1. Cấu trúc Thư mục Sản phẩm (Local)
Mọi sản phẩm phải được đặt trong thư mục `outputs/` theo cú pháp:
`outputs/[Mã_SP]_[Loại]_[Tên_Sản_Phẩm]`

- **[Mã SP]**: Bắt đầu bằng `PRD` + số thứ tự 3 chữ số (VD: PRD001, PRD002, PRD003).
- **[Loại]**: Các loại sản phẩm (VD: Kho_Excel, HR_Docs, GAS_Cong_No).
- **Ví dụ**: `outputs/PRD003_GAS_Cong_No_Y_Te/`

Bên trong thư mục phải chứa:
- File mã nguồn (Code.gs, Sidebar.html...) hoặc file tĩnh (.xlsx, .docx).
- `Setup_Guide.md` (nếu là dạng AppScript).

## 2. Tiêu chuẩn Dữ liệu Web (`storefront-data.js`)
Khi thêm sản phẩm mới vào mảng `products`, bắt buộc phải tuân thủ schema sau:

```javascript
{
  id: "PRD00X", // Mã sản phẩm
  categoryId: "...",
  name: "Tên sản phẩm",
  price: 99000,
  type: "google_sheets", // HOẶC "static_file"
  delivery_link: "https://docs.google.com/.../copy", // Nếu type là google_sheets, PHẢI có link /copy. Nếu type là static_file, trỏ đến file cục bộ ./outputs/...
  tag: "...",
  accent: "mint",
  previewImageUrl: "",
  description: "...",
  suitableFor: "...",
  delivery: "...",
  fileCount: 1,
  sheets: [],
  highlights: []
}
```

## 3. Cơ chế Giao hàng (Delivery Logic)
- **Nếu `type` là `google_sheets` (hoặc `delivery_link` có chứa `/copy`)**: Nút tải về ở trang "File của tôi" và trang Checkout sẽ hiển thị "Tạo Bản Sao (Google Drive)".
- **Nếu `type` là `static_file`**: Nút tải về sẽ hiển thị "Tải Xuống Ngay".
