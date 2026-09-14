import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const root = process.cwd();
const outputDir = path.join(root, "outputs", "quan_ly_kho_mini");
const outputPath = path.join(outputDir, "file_di_lam_quan_ly_kho_mini__v1_0_0__20260818_040000.xlsx");
const previewDir = path.join(root, "scratch", "quan_ly_kho_mini", "previews");

const wb = Workbook.create();
const guide = wb.worksheets.add("0_BẮT_ĐẦU");
const products = wb.worksheets.add("1_SẢN_PHẨM");
const inbound = wb.worksheets.add("2_NHẬP_KHO");
const outbound = wb.worksheets.add("3_XUẤT_KHO");
const inventory = wb.worksheets.add("4_TỒN_KHO");
const alerts = wb.worksheets.add("5_CẢNH_BÁO");
const dashboard = wb.worksheets.add("6_TỔNG_QUAN");
const lists = wb.worksheets.add("7_DANH_MỤC");
const system = wb.worksheets.add("8_HỆ_THỐNG");

const C = {
  green: "#047857",
  green2: "#10B981",
  mint: "#D1FAE5",
  mint2: "#ECFDF5",
  cream: "#FFFBEB",
  rose: "#FCE7F3",
  amber: "#FEF3C7",
  red: "#FEE2E2",
  blue: "#DBEAFE",
  text: "#1F2937",
  muted: "#6B7280",
  line: "#D1D5DB",
  white: "#FFFFFF",
};

const titleFmt = { fill: C.green, font: { bold: true, color: C.white, size: 18 }, verticalAlignment: "center" };
const subtitleFmt = { fill: C.mint, font: { color: C.text, italic: true }, verticalAlignment: "center" };
const sectionFmt = { fill: C.mint, font: { bold: true, color: C.green, size: 12 }, verticalAlignment: "center" };
const headerFmt = { fill: C.green, font: { bold: true, color: C.white }, horizontalAlignment: "center", verticalAlignment: "center", wrapText: true, borders: { preset: "all", style: "thin", color: C.green } };
const inputFmt = { fill: C.cream, font: { color: C.text }, borders: { preset: "inside", style: "thin", color: "#E5E7EB" } };
const formulaFmt = { fill: C.mint2, font: { color: C.text }, borders: { preset: "inside", style: "thin", color: "#E5E7EB" } };
const noteFmt = { font: { color: C.muted }, wrapText: true, verticalAlignment: "top" };
const currencyFmt = '#,##0" đ"';

function setTitle(sheet, title, subtitle, endCol) {
  sheet.getRange(`A1:${endCol}1`).merge();
  sheet.getRange("A1").values = [[title]];
  sheet.getRange(`A1:${endCol}1`).format = titleFmt;
  sheet.getRange(`A2:${endCol}2`).merge();
  sheet.getRange("A2").values = [[subtitle]];
  sheet.getRange(`A2:${endCol}2`).format = subtitleFmt;
  sheet.getRange("A1:A2").format.rowHeight = 28;
  sheet.showGridLines = false;
}

function setHeaders(sheet, range, headers) {
  sheet.getRange(range).values = [headers];
  sheet.getRange(range).format = headerFmt;
  sheet.getRange(range).format.rowHeight = 32;
}

const productRows = [
  ["SP001", "Son tint Rose", "Mỹ phẩm", "Cây", 85000, 149000, 10, 2, "Đang bán"],
  ["SP002", "Kem chống nắng Daily", "Mỹ phẩm", "Tuýp", 120000, 219000, 8, 5, "Đang bán"],
  ["SP003", "Áo thun Basic", "Thời trang", "Cái", 95000, 189000, 12, 7, "Đang bán"],
  ["SP004", "Túi tote canvas", "Phụ kiện", "Cái", 55000, 109000, 7, 0, "Đang bán"],
  ["SP005", "Kẹp tóc nơ", "Phụ kiện", "Cái", 12000, 35000, 20, 5, "Đang bán"],
  ["SP006", "Serum phục hồi", "Mỹ phẩm", "Chai", 145000, 269000, 6, 1, "Đang bán"],
  ["SP007", "Quần short linen", "Thời trang", "Cái", 110000, 229000, 8, 3, "Đang bán"],
  ["SP008", "Vớ cổ ngắn", "Thời trang", "Đôi", 18000, 49000, 15, 6, "Đang bán"],
  ["SP009", "Gương mini", "Phụ kiện", "Cái", 22000, 59000, 10, 0, "Đang bán"],
  ["SP010", "Sữa rửa mặt dịu nhẹ", "Mỹ phẩm", "Chai", 78000, 159000, 8, 1, "Đang bán"],
];

const inboundRows = [
  [new Date("2026-08-01"), "NK001", "SP001", 25, 85000, "NCC Hoa Hồng", "Nhập đầu tháng"],
  [new Date("2026-08-01"), "NK002", "SP002", 20, 120000, "NCC Hoa Hồng", "Nhập đầu tháng"],
  [new Date("2026-08-02"), "NK003", "SP003", 30, 95000, "Xưởng May Mộc", "Lô áo basic"],
  [new Date("2026-08-03"), "NK004", "SP004", 18, 55000, "Xưởng Canvas", ""],
  [new Date("2026-08-03"), "NK005", "SP005", 50, 12000, "Kho Phụ Kiện", ""],
  [new Date("2026-08-05"), "NK006", "SP006", 12, 145000, "NCC Hoa Hồng", ""],
  [new Date("2026-08-06"), "NK007", "SP007", 16, 110000, "Xưởng May Mộc", ""],
  [new Date("2026-08-08"), "NK008", "SP008", 40, 18000, "Kho Phụ Kiện", ""],
  [new Date("2026-08-09"), "NK009", "SP009", 24, 22000, "Kho Phụ Kiện", ""],
  [new Date("2026-08-10"), "NK010", "SP010", 14, 78000, "NCC Hoa Hồng", ""],
];

const outboundRows = [
  [new Date("2026-08-05"), "XK001", "SP001", 18, "Bán hàng", "DH080501", "TikTok Shop"],
  [new Date("2026-08-06"), "XK002", "SP002", 8, "Bán hàng", "DH080602", "Shopee"],
  [new Date("2026-08-07"), "XK003", "SP003", 22, "Bán hàng", "DH080703", "Facebook"],
  [new Date("2026-08-08"), "XK004", "SP004", 13, "Bán hàng", "DH080804", "TikTok Shop"],
  [new Date("2026-08-09"), "XK005", "SP005", 31, "Bán hàng", "DH080905", "Shopee"],
  [new Date("2026-08-10"), "XK006", "SP006", 9, "Bán hàng", "DH081006", "Zalo"],
  [new Date("2026-08-11"), "XK007", "SP007", 10, "Bán hàng", "DH081107", "Facebook"],
  [new Date("2026-08-12"), "XK008", "SP008", 28, "Bán hàng", "DH081208", "TikTok Shop"],
  [new Date("2026-08-13"), "XK009", "SP009", 9, "Bán hàng", "DH081309", "Shopee"],
  [new Date("2026-08-14"), "XK010", "SP010", 11, "Bán hàng", "DH081410", "TikTok Shop"],
];

// 0_BẮT_ĐẦU
setTitle(guide, "QUẢN LÝ KHO MINI", "Theo dõi nhập – xuất – tồn cho shop nhỏ, không cần rành Excel", "H");
guide.getRange("A4:B4").merge(); guide.getRange("A4").values = [["THÔNG TIN SHOP"]]; guide.getRange("A4:B4").format = sectionFmt;
guide.getRange("A5:B9").values = [["Tên shop", "Mây Mini Shop"], ["Người phụ trách", "Nguyễn Minh Anh"], ["Số điện thoại", "0900 000 000"], ["Kỳ theo dõi", "Tháng 08/2026"], ["Ngưỡng cảnh báo", "Theo từng sản phẩm"]];
guide.getRange("B5:B9").format = inputFmt;
guide.getRange("D4:H4").merge(); guide.getRange("D4").values = [["5 BƯỚC DÙNG NHANH"]]; guide.getRange("D4:H4").format = sectionFmt;
guide.getRange("D5:H9").merge(true);
guide.getRange("D5:D9").values = [["1. Sửa sản phẩm và tồn đầu trong sheet 1_SẢN_PHẨM."], ["2. Mỗi lần nhập hàng, ghi một dòng tại 2_NHẬP_KHO."], ["3. Mỗi lần bán/xuất hàng, ghi một dòng tại 3_XUẤT_KHO."], ["4. Xem tồn hiện tại và giá trị tồn tại 4_TỒN_KHO."], ["5. Xử lý sản phẩm hết/sắp hết tại 5_CẢNH_BÁO."]];
guide.getRange("D5:H9").format = noteFmt;
guide.getRange("A12:H12").merge(); guide.getRange("A12").values = [["QUY ƯỚC MÀU"]]; guide.getRange("A12:H12").format = sectionFmt;
guide.getRange("A13:H16").values = [
  ["Vàng nhạt", "Ô nhập liệu", "", "Xanh nhạt", "Ô tự tính", "", "Đỏ nhạt", "Cần xử lý ngay"],
  ["Mã SKU", "Không trùng nhau", "", "Số lượng", "Luôn nhập số dương", "", "Tồn kho", "Không sửa trực tiếp"],
  ["Nhập kho", "Tăng tồn", "", "Xuất kho", "Giảm tồn", "", "Dashboard", "Chỉ để xem"],
  ["Phiên bản", "1.0.0", "", "Ngày build", "18/08/2026", "", "Hỗ trợ", "Dùng dữ liệu mẫu để tập trước"],
];
guide.getRange("A13:B16").format.wrapText = true; guide.getRange("D13:E16").format.wrapText = true; guide.getRange("G13:H16").format.wrapText = true;
guide.getRange("A:A").format.columnWidth = 18; guide.getRange("B:B").format.columnWidth = 24; guide.getRange("C:C").format.columnWidth = 3; guide.getRange("D:H").format.columnWidth = 18;

// 1_SẢN_PHẨM
setTitle(products, "1. SẢN PHẨM", "Khai báo SKU, giá vốn, giá bán, tồn tối thiểu và tồn đầu kỳ", "I");
setHeaders(products, "A3:I3", ["Mã SKU", "Tên sản phẩm", "Nhóm hàng", "Đơn vị", "Giá vốn", "Giá bán", "Tồn tối thiểu", "Tồn đầu kỳ", "Trạng thái"]);
products.getRange("A4:I13").values = productRows;
products.getRange("A4:I203").format = inputFmt;
products.getRange("E4:F203").format.numberFormat = currencyFmt;
products.getRange("G4:H203").format.numberFormat = "#,##0";
products.getRange("C4:C203").dataValidation = { rule: { type: "list", formula1: "'7_DANH_MỤC'!$A$4:$A$6" } };
products.getRange("D4:D203").dataValidation = { rule: { type: "list", formula1: "'7_DANH_MỤC'!$C$4:$C$8" } };
products.getRange("I4:I203").dataValidation = { rule: { type: "list", values: ["Đang bán", "Ngừng bán"] } };
products.freezePanes.freezeRows(3);
products.getRange("A:A").format.columnWidth = 13; products.getRange("B:B").format.columnWidth = 26; products.getRange("C:D").format.columnWidth = 15; products.getRange("E:H").format.columnWidth = 14; products.getRange("I:I").format.columnWidth = 14;

// 2_NHẬP_KHO
setTitle(inbound, "2. NHẬP KHO", "Mỗi lần hàng về, thêm một dòng mới; tổng tiền được tự tính", "H");
setHeaders(inbound, "A3:H3", ["Ngày nhập", "Mã phiếu", "Mã SKU", "Số lượng", "Đơn giá", "Thành tiền", "Nhà cung cấp", "Ghi chú"]);
inbound.getRange("A4:E13").values = inboundRows.map(r => r.slice(0, 5));
inbound.getRange("G4:H13").values = inboundRows.map(r => r.slice(5));
inbound.getRange("F4").formulas = [["=IF(OR(D4=\"\",E4=\"\"),\"\",D4*E4)"]]; inbound.getRange("F4:F203").fillDown();
inbound.getRange("A4:E203").format = inputFmt; inbound.getRange("G4:H203").format = inputFmt; inbound.getRange("F4:F203").format = formulaFmt;
inbound.getRange("A4:A203").format.numberFormat = "dd/mm/yyyy"; inbound.getRange("D4:D203").format.numberFormat = "#,##0"; inbound.getRange("E4:F203").format.numberFormat = currencyFmt;
inbound.getRange("C4:C203").dataValidation = { rule: { type: "list", formula1: "'1_SẢN_PHẨM'!$A$4:$A$203" } };
inbound.getRange("D4:D203").dataValidation = { rule: { type: "whole", operator: "greaterThan", formula1: 0 } };
inbound.freezePanes.freezeRows(3);
inbound.getRange("A:B").format.columnWidth = 13; inbound.getRange("C:C").format.columnWidth = 13; inbound.getRange("D:F").format.columnWidth = 14; inbound.getRange("G:G").format.columnWidth = 20; inbound.getRange("H:H").format.columnWidth = 24;

// 3_XUẤT_KHO
setTitle(outbound, "3. XUẤT KHO", "Ghi hàng bán, hàng hỏng, tặng mẫu hoặc điều chỉnh kho", "G");
setHeaders(outbound, "A3:G3", ["Ngày xuất", "Mã phiếu", "Mã SKU", "Số lượng", "Lý do xuất", "Mã đơn", "Kênh bán"]);
outbound.getRange("A4:G13").values = outboundRows;
outbound.getRange("A4:G203").format = inputFmt;
outbound.getRange("A4:A203").format.numberFormat = "dd/mm/yyyy"; outbound.getRange("D4:D203").format.numberFormat = "#,##0";
outbound.getRange("C4:C203").dataValidation = { rule: { type: "list", formula1: "'1_SẢN_PHẨM'!$A$4:$A$203" } };
outbound.getRange("D4:D203").dataValidation = { rule: { type: "whole", operator: "greaterThan", formula1: 0 } };
outbound.getRange("E4:E203").dataValidation = { rule: { type: "list", formula1: "'7_DANH_MỤC'!$E$4:$E$7" } };
outbound.getRange("G4:G203").dataValidation = { rule: { type: "list", formula1: "'7_DANH_MỤC'!$G$4:$G$8" } };
outbound.freezePanes.freezeRows(3);
outbound.getRange("A:B").format.columnWidth = 13; outbound.getRange("C:D").format.columnWidth = 13; outbound.getRange("E:E").format.columnWidth = 17; outbound.getRange("F:F").format.columnWidth = 15; outbound.getRange("G:G").format.columnWidth = 16;

// 4_TỒN_KHO
setTitle(inventory, "4. TỒN KHO", "Sheet tự tổng hợp từ sản phẩm, nhập kho và xuất kho – không nhập trực tiếp", "J");
setHeaders(inventory, "A3:J3", ["Mã SKU", "Tên sản phẩm", "Tồn đầu", "Đã nhập", "Đã xuất", "Tồn hiện tại", "Tồn tối thiểu", "Trạng thái", "Giá vốn", "Giá trị tồn"]);
for (let i = 0; i < 10; i++) {
  const r = 4 + i;
  const pr = 4 + i;
  inventory.getRange(`A${r}:B${r}`).formulas = [[`='1_SẢN_PHẨM'!A${pr}`, `='1_SẢN_PHẨM'!B${pr}`]];
  inventory.getRange(`C${r}`).formulas = [[`='1_SẢN_PHẨM'!H${pr}`]];
  inventory.getRange(`D${r}`).formulas = [[`=SUMIF('2_NHẬP_KHO'!$C$4:$C$203,A${r},'2_NHẬP_KHO'!$D$4:$D$203)`]];
  inventory.getRange(`E${r}`).formulas = [[`=SUMIF('3_XUẤT_KHO'!$C$4:$C$203,A${r},'3_XUẤT_KHO'!$D$4:$D$203)`]];
  inventory.getRange(`F${r}`).formulas = [[`=C${r}+D${r}-E${r}`]];
  inventory.getRange(`G${r}`).formulas = [[`='1_SẢN_PHẨM'!G${pr}`]];
  inventory.getRange(`H${r}`).formulas = [[`=IF(F${r}<=0,\"Hết hàng\",IF(F${r}<=G${r},\"Sắp hết\",\"Đủ hàng\"))`]];
  inventory.getRange(`I${r}`).formulas = [[`='1_SẢN_PHẨM'!E${pr}`]];
  inventory.getRange(`J${r}`).formulas = [[`=F${r}*I${r}`]];
}
inventory.getRange("A4:J203").format = formulaFmt;
inventory.getRange("C4:G203").format.numberFormat = "#,##0"; inventory.getRange("I4:J203").format.numberFormat = currencyFmt;
inventory.getRange("H4:H203").conditionalFormats.add("containsText", { text: "Hết hàng", format: { fill: C.red, font: { bold: true, color: "#991B1B" } } });
inventory.getRange("H4:H203").conditionalFormats.add("containsText", { text: "Sắp hết", format: { fill: C.amber, font: { bold: true, color: "#92400E" } } });
inventory.getRange("H4:H203").conditionalFormats.add("containsText", { text: "Đủ hàng", format: { fill: C.mint, font: { color: C.green } } });
inventory.freezePanes.freezeRows(3);
inventory.getRange("A:A").format.columnWidth = 13; inventory.getRange("B:B").format.columnWidth = 26; inventory.getRange("C:G").format.columnWidth = 13; inventory.getRange("H:H").format.columnWidth = 15; inventory.getRange("I:J").format.columnWidth = 16;

// 5_CẢNH_BÁO
setTitle(alerts, "5. CẢNH BÁO", "Danh sách ưu tiên nhập thêm hàng dựa trên tồn tối thiểu", "G");
setHeaders(alerts, "A3:G3", ["Mã SKU", "Tên sản phẩm", "Tồn hiện tại", "Tồn tối thiểu", "Thiếu để đạt mức tối thiểu", "Mức độ", "Gợi ý xử lý"]);
for (let i = 0; i < 10; i++) {
  const r = 4 + i;
  alerts.getRange(`A${r}:D${r}`).formulas = [[`='4_TỒN_KHO'!A${r}`, `='4_TỒN_KHO'!B${r}`, `='4_TỒN_KHO'!F${r}`, `='4_TỒN_KHO'!G${r}`]];
  alerts.getRange(`E${r}`).formulas = [[`=MAX(0,D${r}-C${r})`]];
  alerts.getRange(`F${r}`).formulas = [[`=IF(C${r}<=0,\"Khẩn cấp\",IF(C${r}<=D${r},\"Cần nhập\",\"Ổn\"))`]];
  alerts.getRange(`G${r}`).formulas = [[`=IF(F${r}=\"Khẩn cấp\",\"Tạm ngưng bán và nhập ngay\",IF(F${r}=\"Cần nhập\",\"Lên đơn nhập bổ sung\",\"Chưa cần xử lý\"))`]];
}
alerts.getRange("A4:G13").format = formulaFmt;
alerts.getRange("C4:E13").format.numberFormat = "#,##0";
alerts.getRange("F4:F13").conditionalFormats.add("containsText", { text: "Khẩn cấp", format: { fill: C.red, font: { bold: true, color: "#991B1B" } } });
alerts.getRange("F4:F13").conditionalFormats.add("containsText", { text: "Cần nhập", format: { fill: C.amber, font: { bold: true, color: "#92400E" } } });
alerts.freezePanes.freezeRows(3);
alerts.getRange("A:A").format.columnWidth = 13; alerts.getRange("B:B").format.columnWidth = 26; alerts.getRange("C:E").format.columnWidth = 17; alerts.getRange("F:F").format.columnWidth = 14; alerts.getRange("G:G").format.columnWidth = 29;

// 6_TỔNG_QUAN
setTitle(dashboard, "6. TỔNG QUAN KHO", "Số liệu tự cập nhật khi bạn nhập thêm giao dịch", "N");
dashboard.getRange("A4:C4").merge(); dashboard.getRange("A4").values = [["TỔNG SẢN PHẨM"]];
dashboard.getRange("D4:F4").merge(); dashboard.getRange("D4").values = [["TỔNG TỒN"]];
dashboard.getRange("G4:I4").merge(); dashboard.getRange("G4").values = [["GIÁ TRỊ TỒN"]];
dashboard.getRange("J4:L4").merge(); dashboard.getRange("J4").values = [["CẦN NHẬP THÊM"]];
dashboard.getRange("A4:L4").format = sectionFmt;
dashboard.getRange("A5:C7").merge(); dashboard.getRange("A5").formulas = [["=COUNTA('4_TỒN_KHO'!A4:A13)"]];
dashboard.getRange("D5:F7").merge(); dashboard.getRange("D5").formulas = [["=SUM('4_TỒN_KHO'!F4:F13)"]];
dashboard.getRange("G5:I7").merge(); dashboard.getRange("G5").formulas = [["=SUM('4_TỒN_KHO'!J4:J13)"]];
dashboard.getRange("J5:L7").merge(); dashboard.getRange("J5").formulas = [["=COUNTIF('4_TỒN_KHO'!H4:H13,\"Sắp hết\")+COUNTIF('4_TỒN_KHO'!H4:H13,\"Hết hàng\")"]];
dashboard.getRange("A5:L7").format = { fill: C.white, font: { bold: true, color: C.green, size: 20 }, horizontalAlignment: "center", verticalAlignment: "center", borders: { preset: "outside", style: "thin", color: C.line } };
dashboard.getRange("G5:I7").format.numberFormat = currencyFmt;
dashboard.getRange("A11:C20").formulas = Array.from({length: 10}, (_, i) => [[`='4_TỒN_KHO'!B${4+i}`, `='4_TỒN_KHO'!F${4+i}`, `='4_TỒN_KHO'!G${4+i}`]]).flat();
dashboard.getRange("A10:C10").values = [["Sản phẩm", "Tồn hiện tại", "Tồn tối thiểu"]]; dashboard.getRange("A10:C10").format = headerFmt;
dashboard.getRange("A11:C20").format = formulaFmt;
dashboard.getRange("E10:F13").values = [["Trạng thái", "Số sản phẩm"], ["Hết hàng", null], ["Sắp hết", null], ["Đủ hàng", null]];
dashboard.getRange("F11").formulas = [["=COUNTIF('4_TỒN_KHO'!H4:H13,E11)"]]; dashboard.getRange("F11:F13").fillDown();
dashboard.getRange("E10:F10").format = headerFmt; dashboard.getRange("E11:F13").format = formulaFmt;
const stockChart = dashboard.charts.add("bar", dashboard.getRange("A10:C20"));
stockChart.title = "Tồn hiện tại so với mức tối thiểu"; stockChart.hasLegend = true; stockChart.setPosition("H10", "N26");
const statusChart = dashboard.charts.add("doughnut", dashboard.getRange("E10:F13"));
statusChart.title = "Sức khỏe tồn kho"; statusChart.hasLegend = true; statusChart.setPosition("A23", "G38");
dashboard.getRange("A:A").format.columnWidth = 24; dashboard.getRange("B:C").format.columnWidth = 15; dashboard.getRange("D:D").format.columnWidth = 3; dashboard.getRange("E:F").format.columnWidth = 16; dashboard.getRange("G:N").format.columnWidth = 12;

// 7_DANH_MỤC
setTitle(lists, "7. DANH MỤC", "Sửa các danh sách dùng cho menu chọn", "H");
lists.getRange("A3:A6").values = [["Nhóm hàng"], ["Mỹ phẩm"], ["Thời trang"], ["Phụ kiện"]];
lists.getRange("C3:C8").values = [["Đơn vị"], ["Cái"], ["Cây"], ["Chai"], ["Tuýp"], ["Đôi"]];
lists.getRange("E3:E7").values = [["Lý do xuất"], ["Bán hàng"], ["Hàng hỏng"], ["Tặng mẫu"], ["Điều chỉnh"]];
lists.getRange("G3:G8").values = [["Kênh bán"], ["TikTok Shop"], ["Shopee"], ["Facebook"], ["Instagram"], ["Zalo"]];
lists.getRange("A3:A3").format = headerFmt; lists.getRange("C3:C3").format = headerFmt; lists.getRange("E3:E3").format = headerFmt; lists.getRange("G3:G3").format = headerFmt;
lists.getRange("A4:A20").format = inputFmt; lists.getRange("C4:C20").format = inputFmt; lists.getRange("E4:E20").format = inputFmt; lists.getRange("G4:G20").format = inputFmt;
lists.getRange("A:A").format.columnWidth = 20; lists.getRange("B:B").format.columnWidth = 3; lists.getRange("C:C").format.columnWidth = 16; lists.getRange("D:D").format.columnWidth = 3; lists.getRange("E:E").format.columnWidth = 18; lists.getRange("F:F").format.columnWidth = 3; lists.getRange("G:G").format.columnWidth = 18;

// 8_HỆ_THỐNG
setTitle(system, "8. HỆ THỐNG", "Metadata phục vụ phiên bản và xuất bản sản phẩm", "D");
system.getRange("A4:B13").values = [
  ["Thương hiệu", "File Đi Làm"], ["Mã template", "quan_ly_kho_mini"], ["Tên sản phẩm", "Quản Lý Kho Mini"], ["Phiên bản", "1.0.0"], ["Ngày build", "2026-08-18T04:00:00"],
  ["Giá bán", 89000], ["Đối tượng", "Shop nhỏ bán TikTok, Shopee, Facebook, Instagram, Zalo"], ["Nhận file", "Ngay sau khi xác nhận thanh toán"], ["QC", "Kiểm tra công thức, dữ liệu mẫu và toàn bộ sheet"], ["Trạng thái", "READY_TO_PUBLISH"],
];
system.getRange("A4:A13").format = sectionFmt; system.getRange("B4:B13").format = formulaFmt; system.getRange("B9").format.numberFormat = currencyFmt;
system.getRange("A:A").format.columnWidth = 22; system.getRange("B:B").format.columnWidth = 58;

// Inspect key content and formula errors before export.
const summary = await wb.inspect({ kind: "table", sheetId: "6_TỔNG_QUAN", range: "A1:N20", include: "values,formulas", tableMaxRows: 20, tableMaxCols: 14, maxChars: 7000 });
const errors = await wb.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A", options: { useRegex: true, maxResults: 300 }, summary: "final formula error scan" });

await fs.mkdir(previewDir, { recursive: true });
for (const sheetName of ["0_BẮT_ĐẦU", "1_SẢN_PHẨM", "2_NHẬP_KHO", "3_XUẤT_KHO", "4_TỒN_KHO", "5_CẢNH_BÁO", "6_TỔNG_QUAN", "7_DANH_MỤC", "8_HỆ_THỐNG"]) {
  const preview = await wb.render({ sheetName, autoCrop: "all", scale: 1, format: "png" });
  const safe = sheetName.replace(/[^0-9A-Za-zÀ-ỹ_]+/g, "_");
  await fs.writeFile(path.join(previewDir, `${safe}.png`), new Uint8Array(await preview.arrayBuffer()));
}

await fs.mkdir(outputDir, { recursive: true });
const file = await SpreadsheetFile.exportXlsx(wb);
await file.save(outputPath);

console.log(JSON.stringify({ outputPath, previewDir, summary: summary.ndjson, errors: errors.ndjson }, null, 2));
