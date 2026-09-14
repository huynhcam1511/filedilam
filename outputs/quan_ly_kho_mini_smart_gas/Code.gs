const SMART = Object.freeze({
  version: '3.0.0',
  masterSpreadsheetId: '1xir1M-ieP0zqmGE5J4m1rGbxuzTIUaDw7aFoM7GEeZo',
  webAppUrl: 'https://script.google.com/macros/s/AKfycbyDXK4XPx-eA0dGkrDNLZw0hfy-0nIU6sPp3p_JIxI2yqkuSl0oKYrAl2ti3NGSOfCS/exec',
  productsSheet: '1_SẢN_PHẨM',
  inboundSheet: '2_NHẬP_KHO',
  outboundSheet: '3_XUẤT_KHO',
  inventorySheet: '4_TỒN_KHO',
  alertsSheet: '5_CẢNH_BÁO',
  dashboardSheet: '6_TỔNG_QUAN',
  configSheet: '9_CẤU_HÌNH',
  logSheet: '10_NHẬT_KÝ'
});

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('📦 Kho Mini Smart')
    .addItem('🚀 Mở ứng dụng quản lý kho', 'openSmartApp')
    .addSeparator()
    .addItem('Xem nhanh trong Sheets', 'showSmartSidebar')
    .addItem('Xem cảnh báo tồn kho', 'showLowStockDialog')
    .addSeparator()
    .addItem('Gửi báo cáo PDF', 'sendInventoryReport')
    .addItem('Kích hoạt tự động hóa', 'installSmartFeatures')
    .addToUi();
}

function doGet(e) {
  const requestedId = String(e && e.parameter && e.parameter.spreadsheetId || '').trim();
  
  if (!/^[A-Za-z0-9_-]{20,}$/.test(requestedId)) {
    return HtmlService.createHtmlOutput(`
      <div style="font-family:sans-serif; text-align:center; padding: 50px; color: #333;">
        <h2 style="color:#047857">Cấp quyền thành công! 🎉</h2>
        <p style="font-size: 16px;">Hệ thống đã kết nối xong. Vui lòng <b>đóng tab này lại</b> và quay về Google Sheets bấm <b>Mở ứng dụng quản lý kho</b> một lần nữa để bắt đầu!</p>
      </div>
    `);
  }

  const targetId = requestedId;
  SpreadsheetApp.openById(targetId); // Kiểm tra người dùng hiện tại có quyền với file.
  PropertiesService.getUserProperties().setProperty('SMART_TARGET_SPREADSHEET_ID', targetId);
  ensureSupportSheets_();
  return HtmlService.createTemplateFromFile('WebApp')
    .evaluate()
    .setTitle('Quản Lý Kho Mini – Smart')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function openSmartApp() {
  const ss = SpreadsheetApp.getActive();
  const url = `${SMART.webAppUrl}?spreadsheetId=${encodeURIComponent(ss.getId())}`;
  updateStartGuide_();
  const safeUrl = escapeHtml_(url);
  const html = HtmlService.createHtmlOutput(`<style>body{font:15px Arial;padding:24px;color:#1f2937;text-align:center}a{display:inline-block;margin-top:12px;padding:12px 20px;border-radius:10px;background:#047857;color:#fff;text-decoration:none;font-weight:700}</style><h2>Kho Mini Smart đã sẵn sàng</h2><p>Ứng dụng sẽ mở trong một tab mới.</p><a href="${safeUrl}" target="_blank">Mở ứng dụng quản lý kho</a><script>window.open('${safeUrl}','_blank');google.script.host.close();</script>`).setWidth(430).setHeight(230);
  SpreadsheetApp.getUi().showModalDialog(html, 'Mở Kho Mini Smart');
}

function saveWebAppUrlFromPrompt() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.prompt('Lưu link Web App', 'Dán đường dẫn Apps Script Web App kết thúc bằng /exec:', ui.ButtonSet.OK_CANCEL);
  if (result.getSelectedButton() !== ui.Button.OK) return;
  const url = validateWebAppUrl_(result.getResponseText());
  const sheet = requireSheet_(SMART.configSheet);
  sheet.getRange('A7').setValue('Link Web App');
  sheet.getRange('B7').setValue(url);
  updateStartGuide_();
  ui.alert('Đã lưu link', 'Từ lần sau bạn có thể chọn Mở ứng dụng quản lý kho. Trên điện thoại/iPad, mở trực tiếp link /exec hoặc chạm link tại sheet 0_BẮT_ĐẦU.', ui.ButtonSet.OK);
}

function showSmartSidebar() {
  const html = HtmlService.createTemplateFromFile('Sidebar')
    .evaluate()
    .setTitle('Quản Lý Kho Mini – Smart');
  SpreadsheetApp.getUi().showSidebar(html);
}

function installSmartFeatures() {
  ensureSupportSheets_();
  const triggers = ScriptApp.getProjectTriggers();
  if (!triggers.some(t => t.getHandlerFunction() === 'sendDailyLowStockAlert')) {
    ScriptApp.newTrigger('sendDailyLowStockAlert').timeBased().everyDays(1).atHour(8).create();
  }
  PropertiesService.getDocumentProperties().setProperty('SMART_ENABLED', 'true');
  logAction_('KÍCH HOẠT', '', 0, 'Đã tạo cấu hình, nhật ký và cảnh báo lúc 08:00 mỗi ngày');
  SpreadsheetApp.getUi().alert('Kích hoạt thành công', 'Giao diện thông minh và cảnh báo tồn kho hằng ngày đã sẵn sàng.', SpreadsheetApp.getUi().ButtonSet.OK);
}

function ensureSupportSheets_() {
  const ss = getSpreadsheet_();
  let config = ss.getSheetByName(SMART.configSheet);
  if (!config) {
    config = ss.insertSheet(SMART.configSheet);
  }
  if (config.getLastRow() < 2 || !String(config.getRange('A2').getValue()).trim()) {
    config.clear();
    config.getRange('A1:B1').setValues([['THIẾT LẬP', 'GIÁ TRỊ']]).setFontWeight('bold').setBackground('#047857').setFontColor('#FFFFFF');
    config.getRange('A2:B6').setValues([
      ['Email nhận báo cáo', ''],
      ['Giờ cảnh báo', '08:00'],
      ['Tên báo cáo', 'Báo cáo tồn kho'],
      ['Phiên bản Smart', SMART.version],
      ['Trạng thái', 'Đã kích hoạt']
    ]);
    config.setFrozenRows(1);
    config.setColumnWidth(1, 190);
    config.setColumnWidth(2, 320);
  }
  if (!String(config.getRange('A7').getValue()).trim()) config.getRange('A7').setValue('Link Web App');
  updateStartGuide_();

  let log = ss.getSheetByName(SMART.logSheet);
  if (!log) {
    log = ss.insertSheet(SMART.logSheet);
    log.getRange('A1:G1').setValues([['Thời gian', 'Người dùng', 'Thao tác', 'Mã SKU', 'Số lượng', 'Chi tiết', 'Phiên bản']])
      .setFontWeight('bold').setBackground('#047857').setFontColor('#FFFFFF');
    log.setFrozenRows(1);
  }
}

function getSmartBootstrap() {
  ensureSupportSheets_();
  return {
    dashboard: getDashboardData(),
    products: searchProducts(''),
    config: getSmartConfig_(),
    version: SMART.version
  };
}

function getDashboardData() {
  const sheet = requireSheet_(SMART.inventorySheet);
  const rows = sheet.getRange(4, 1, Math.max(sheet.getLastRow() - 3, 1), 10).getValues()
    .filter(row => row[0]);
  const items = rows.map(row => ({
    sku: row[0],
    name: row[1],
    stock: number_(row[5]),
    minimum: number_(row[6]),
    status: row[7],
    value: number_(row[9])
  }));
  return {
    productCount: items.length,
    totalStock: items.reduce((sum, item) => sum + item.stock, 0),
    inventoryValue: items.reduce((sum, item) => sum + item.value, 0),
    lowStockCount: items.filter(item => item.stock <= item.minimum).length,
    lowStock: items.filter(item => item.stock <= item.minimum).sort((a, b) => (a.stock - a.minimum) - (b.stock - b.minimum))
  };
}

function searchProducts(query) {
  const sheet = requireSheet_(SMART.productsSheet);
  const rows = sheet.getRange(4, 1, Math.max(sheet.getLastRow() - 3, 1), 9).getDisplayValues();
  const inventory = getInventoryMap_();
  const needle = String(query || '').trim().toLowerCase();
  return rows
    .filter(row => row[0] && row[8] !== 'Ngừng bán')
    .map(row => ({
      sku: row[0], name: row[1], group: row[2], unit: row[3],
      cost: number_(row[4]), price: number_(row[5]), minimum: number_(row[6]),
      opening: number_(row[7]), status: row[8] || 'Đang bán', stock: inventory[row[0]] || 0
    }))
    .filter(item => !needle || `${item.sku} ${item.name} ${item.group}`.toLowerCase().includes(needle))
    .slice(0, 50);
}

function saveProduct(payload) {
  if (!payload) throw new Error('Thiếu dữ liệu sản phẩm.');
  const sku = String(payload.sku || '').trim().toUpperCase();
  const originalSku = String(payload.originalSku || '').trim().toUpperCase();
  const name = String(payload.name || '').trim();
  if (!/^[A-Z0-9_-]{2,20}$/.test(sku)) throw new Error('SKU gồm 2–20 ký tự: chữ, số, gạch ngang hoặc gạch dưới.');
  if (!name) throw new Error('Vui lòng nhập tên sản phẩm.');
  const sheet = requireSheet_(SMART.productsSheet);
  const lastRow = Math.max(sheet.getLastRow(), 4);
  const rows = sheet.getRange(4, 1, lastRow - 3, 9).getValues();
  const found = rows.findIndex(row => String(row[0] || '').trim().toUpperCase() === (originalSku || sku));
  const duplicate = rows.findIndex(row => String(row[0] || '').trim().toUpperCase() === sku);
  if (duplicate >= 0 && duplicate !== found) throw new Error(`SKU ${sku} đã tồn tại.`);
  if (found >= 0 && originalSku && originalSku !== sku && hasProductMovements_(originalSku)) {
    throw new Error('Không thể đổi SKU đã phát sinh nhập/xuất. Hãy giữ SKU cũ hoặc ngừng bán.');
  }
  const values = [[sku, name, String(payload.group || '').trim(), String(payload.unit || '').trim(), number_(payload.cost), number_(payload.price), number_(payload.minimum), number_(payload.opening), payload.status === 'Ngừng bán' ? 'Ngừng bán' : 'Đang bán']];
  const rowNumber = found >= 0 ? found + 4 : nextEmptyRow_(sheet, 4, 1);
  sheet.getRange(rowNumber, 1, 1, 9).setValues(values);
  SpreadsheetApp.flush();
  logAction_(found >= 0 ? 'SỬA SẢN PHẨM' : 'THÊM SẢN PHẨM', sku, 0, name);
  return { ok: true, message: found >= 0 ? 'Đã cập nhật sản phẩm' : 'Đã thêm sản phẩm', products: searchProducts('') };
}

function deactivateProduct(sku) {
  sku = String(sku || '').trim().toUpperCase();
  const sheet = requireSheet_(SMART.productsSheet);
  const rows = sheet.getRange(4, 1, Math.max(sheet.getLastRow() - 3, 1), 9).getValues();
  const index = rows.findIndex(row => String(row[0] || '').trim().toUpperCase() === sku);
  if (index < 0) throw new Error('Không tìm thấy sản phẩm.');
  sheet.getRange(index + 4, 9).setValue('Ngừng bán');
  logAction_('NGỪNG BÁN', sku, 0, rows[index][1]);
  return { ok: true, message: `Đã ngừng bán ${sku}`, products: searchProducts('') };
}

function clearSampleData() {
  const lock = LockService.getDocumentLock();
  lock.waitLock(20000);
  try {
    [SMART.productsSheet, SMART.inboundSheet, SMART.outboundSheet].forEach(name => {
      const sheet = requireSheet_(name);
      if (sheet.getLastRow() >= 4) sheet.getRange(4, 1, sheet.getLastRow() - 3, sheet.getLastColumn()).clearContent();
    });
    SpreadsheetApp.flush();
    logAction_('XÓA DỮ LIỆU MẪU', '', 0, 'Giữ nguyên cấu trúc và công thức hệ thống');
    return { ok: true, message: 'Đã xóa dữ liệu mẫu. Bạn có thể thêm sản phẩm thật.' };
  } finally {
    lock.releaseLock();
  }
}

function seedVideoDemoData() {
  const lock = LockService.getDocumentLock();
  lock.waitLock(20000);
  try {
    const productSheet = requireSheet_(SMART.productsSheet);
    const inboundSheet = requireSheet_(SMART.inboundSheet);
    const outboundSheet = requireSheet_(SMART.outboundSheet);
    [productSheet, inboundSheet, outboundSheet].forEach(sheet => {
      if (sheet.getLastRow() >= 4) sheet.getRange(4, 1, sheet.getLastRow() - 3, Math.max(sheet.getLastColumn(), 20)).clearContent();
    });

    const names = ['Son tint Rose','Kem chống nắng Daily','Áo thun Basic','Túi tote Canvas','Kẹp tóc nơ','Serum phục hồi','Quần short Linen','Vớ cổ ngắn','Gương mini','Sữa rửa mặt dịu nhẹ','Nước hoa mini','Kem dưỡng ẩm','Áo sơ mi Oxford','Chân váy Midi','Túi đeo chéo','Dầu gội thảo mộc','Mặt nạ dưỡng da','Dép quai ngang','Bình giữ nhiệt','Sổ tay kế hoạch','Son dưỡng môi','Phấn phủ kiềm dầu','Áo khoác mỏng','Quần jean ống rộng','Ví mini','Kính mát thời trang','Nến thơm','Xịt thơm phòng','Cốc thủy tinh','Bộ cọ trang điểm'];
    const groups = ['Mỹ phẩm','Thời trang','Phụ kiện','Đồ gia dụng','Văn phòng'];
    const units = ['Cái','Hộp','Chai','Bộ','Đôi'];
    const suppliers = ['NCC Hoa Hồng','Xưởng May Mộc','Kho Phụ Kiện 88','Nhà phân phối An Nhiên','Tổng kho Sài Gòn'];
    const warehouses = ['Kho chính','Kho online','Kho dự phòng'];
    const productExtraHeaders = ['Barcode','Thương hiệu','Mã NCC','Nhà cung cấp','Xuất xứ','Kho','Kệ','Màu sắc','Kích thước','Khối lượng','Thuế VAT'];
    productSheet.getRange(3, 10, 1, productExtraHeaders.length).setValues([productExtraHeaders]);
    const products = names.map((name, i) => {
      const cost = 18000 + (i % 10) * 9000;
      return [`SP${String(i + 1).padStart(3, '0')}`,name,groups[i % groups.length],units[i % units.length],cost,Math.round(cost * 1.75),5 + (i % 8),3 + (i % 12),'Đang bán',`893${String(100000000 + i).padStart(9,'0')}`,`Nhãn ${String.fromCharCode(65 + i % 6)}`,`NCC${String(i % 5 + 1).padStart(2,'0')}`,suppliers[i % suppliers.length],i % 3 === 0 ? 'Việt Nam' : (i % 3 === 1 ? 'Thái Lan' : 'Hàn Quốc'),warehouses[i % warehouses.length],`K${i % 6 + 1}-${i % 8 + 1}`,['Đỏ','Đen','Kem','Xanh','Tự nhiên'][i % 5],['S','M','L','Tiêu chuẩn'][i % 4],`${100 + i * 15}g`,i % 2 ? '8%' : '10%'];
    });
    productSheet.getRange(4, 1, products.length, products[0].length).setValues(products);
    const inventorySheet = requireSheet_(SMART.inventorySheet);
    if (inventorySheet.getMaxRows() < 33) inventorySheet.insertRowsAfter(inventorySheet.getMaxRows(), 33 - inventorySheet.getMaxRows());
    const inventoryFormulas = products.map((_, i) => {
      const row = i + 4;
      return [
        `='1_SẢN_PHẨM'!A${row}`, `='1_SẢN_PHẨM'!B${row}`, `='1_SẢN_PHẨM'!H${row}`,
        `=SUMIF('2_NHẬP_KHO'!C:C;A${row};'2_NHẬP_KHO'!D:D)`,
        `=SUMIF('3_XUẤT_KHO'!C:C;A${row};'3_XUẤT_KHO'!D:D)`,
        `=C${row}+D${row}-E${row}`, `='1_SẢN_PHẨM'!G${row}`,
        `=IF(F${row}<=0;"Hết hàng";IF(F${row}<=G${row};"Sắp hết";"Đủ hàng"))`,
        `='1_SẢN_PHẨM'!E${row}`, `=F${row}*I${row}`
      ];
    });
    inventorySheet.getRange(4, 1, 30, 10).setFormulas(inventoryFormulas);
    inventorySheet.getRange(4, 1, 30, 10).setBorder(true, true, true, true, true, true, '#dbe4ea', SpreadsheetApp.BorderStyle.SOLID);

    const inboundExtraHeaders = ['Người nhận','Kho nhận','Vị trí kệ','Số PO','Mã lô','Ngày sản xuất','Hạn sử dụng','Trạng thái QC','Phương thức vận chuyển','Số hóa đơn','Đã thanh toán','Chứng từ'];
    inboundSheet.getRange(3, 9, 1, inboundExtraHeaders.length).setValues([inboundExtraHeaders]);
    const inbound = Array.from({length: 80}, (_, i) => {
      const p = products[i % products.length], date = new Date(2026, 4 + Math.floor(i / 28), i % 28 + 1), qty = 20 + (i * 7) % 45, cost = p[4];
      return [date,`NK${String(i + 1).padStart(4,'0')}`,p[0],qty,cost,qty * cost,suppliers[i % suppliers.length],i % 4 ? 'Nhập bổ sung' : 'Nhập đầu kỳ',['Minh Anh','Thu Hà','Quang Huy'][i % 3],warehouses[i % warehouses.length],`K${i % 6 + 1}-${i % 8 + 1}`,`PO${String(i + 1).padStart(4,'0')}`,`LOT${String(260500 + i)}`,new Date(date.getTime() - 30 * 86400000),new Date(date.getTime() + (240 + i % 120) * 86400000),i % 13 ? 'Đạt' : 'Chờ kiểm tra',['Xe tải','Chuyển phát','Nhận trực tiếp'][i % 3],`HD${String(5000 + i)}`,i % 5 ? 'Đã thanh toán' : 'Công nợ',`CT-${String(i + 1).padStart(4,'0')}`];
    });
    inboundSheet.getRange(4, 1, inbound.length, inbound[0].length).setValues(inbound);

    const outboundExtraHeaders = ['Khách hàng','Số điện thoại','Tỉnh/Thành','Kho xuất','Vị trí kệ','Nhân viên','Đơn vị vận chuyển','Mã vận đơn','Trạng thái giao','Tiền COD','Phí vận chuyển','Ghi chú','Ca làm việc'];
    outboundSheet.getRange(3, 8, 1, outboundExtraHeaders.length).setValues([outboundExtraHeaders]);
    const channels = ['TikTok Shop','Shopee','Facebook','Instagram','Zalo'];
    const outbound = Array.from({length: 120}, (_, i) => {
      const p = products[i % products.length], date = new Date(2026, 5 + Math.floor(i / 35), i % 28 + 1), qty = 1 + (i * 3) % 6;
      return [date,`XK${String(i + 1).padStart(4,'0')}`,p[0],qty,i % 17 ? 'Bán hàng' : 'Tặng mẫu',`DH${String(10001 + i)}`,channels[i % channels.length],`Khách ${String(i + 1).padStart(3,'0')}`,`09${String(10000000 + i).slice(-8)}`,['TP.HCM','Hà Nội','Đà Nẵng','Cần Thơ','Bình Dương'][i % 5],warehouses[i % warehouses.length],`K${i % 6 + 1}-${i % 8 + 1}`,['Lan','Huy','Vy','Nam'][i % 4],['GHN','GHTK','J&T','Viettel Post'][i % 4],`VD${String(900000 + i)}`,i % 9 ? 'Đã giao' : 'Đang giao',p[5] * qty,22000 + i % 4 * 5000,i % 8 ? '' : 'Khách dặn gọi trước',['Sáng','Chiều','Tối'][i % 3]];
    });
    outboundSheet.getRange(4, 1, outbound.length, outbound[0].length).setValues(outbound);
    formatVideoDemoSheet_(productSheet, 30, 20, [5,6], [7,8], []);
    formatVideoDemoSheet_(inboundSheet, 80, 20, [5,6], [4], [1,14,15]);
    formatVideoDemoSheet_(outboundSheet, 120, 20, [17,18], [4], [1]);
    formatVideoDemoSheet_(inventorySheet, 30, 10, [9,10], [3,4,5,6,7], []);
    SpreadsheetApp.flush();
    logAction_('NẠP DỮ LIỆU QUAY DEMO', '', 200, '30 sản phẩm, 80 phiếu nhập, 120 phiếu xuất');
    return {ok:true,message:'Đã nạp 30 sản phẩm và 200 giao dịch mẫu để quay video.'};
  } finally {
    lock.releaseLock();
  }
}

function formatVideoDemoSheet_(sheet, dataRows, columnCount, moneyColumns, numberColumns, dateColumns) {
  const lastRow = dataRows + 3;
  const fullRange = sheet.getRange(1, 1, lastRow, columnCount);
  fullRange.setFontFamily('Arial').setFontSize(10).setVerticalAlignment('middle');
  sheet.getRange(1, 1, 1, columnCount).setBackground('#047857').setFontColor('#ffffff').setFontWeight('bold').setFontSize(16);
  sheet.getRange(2, 1, 1, columnCount).setBackground('#d1fae5').setFontColor('#065f46').setFontStyle('italic');
  sheet.getRange(3, 1, 1, columnCount).setBackground('#065f46').setFontColor('#ffffff').setFontWeight('bold').setWrap(true).setHorizontalAlignment('center');
  sheet.setRowHeight(1, 30);
  sheet.setRowHeight(2, 24);
  sheet.setRowHeight(3, 38);
  const backgrounds = Array.from({length:dataRows}, (_, i) => Array(columnCount).fill(i % 2 ? '#f8fafc' : '#ffffff'));
  sheet.getRange(4, 1, dataRows, columnCount).setBackgrounds(backgrounds).setBorder(false, false, true, false, false, false, '#e2e8f0', SpreadsheetApp.BorderStyle.SOLID);
  moneyColumns.forEach(column => sheet.getRange(4, column, dataRows, 1).setNumberFormat('#,##0 "đ"').setHorizontalAlignment('right'));
  numberColumns.forEach(column => sheet.getRange(4, column, dataRows, 1).setNumberFormat('#,##0').setHorizontalAlignment('right'));
  dateColumns.forEach(column => sheet.getRange(4, column, dataRows, 1).setNumberFormat('dd/MM/yyyy').setHorizontalAlignment('center'));
  sheet.setFrozenRows(3);
  sheet.setFrozenColumns(0);
  if (sheet.getFilter()) sheet.getFilter().remove();
  sheet.getRange(3, 1, dataRows + 1, columnCount).createFilter();
  for (let column = 1; column <= columnCount; column++) sheet.setColumnWidth(column, 112);
  sheet.setColumnWidth(1, 105);
  if (columnCount >= 2) sheet.setColumnWidth(2, 205);
  if (columnCount >= 3) sheet.setColumnWidth(3, 135);
  for (let row = 4; row <= lastRow; row++) sheet.setRowHeight(row, 25);
  sheet.getRange(4, 1, dataRows, columnCount).setWrap(false);
  if (sheet.getName() === SMART.inventorySheet) {
    const statusRange = sheet.getRange(4, 8, dataRows, 1);
    const rules = sheet.getConditionalFormatRules().filter(rule => !rule.getRanges().some(range => range.getColumn() === 8 && range.getRow() >= 4));
    rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Hết hàng').setBackground('#fee2e2').setFontColor('#b91c1c').setRanges([statusRange]).build());
    rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Sắp hết').setBackground('#fef3c7').setFontColor('#b45309').setRanges([statusRange]).build());
    rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Đủ hàng').setBackground('#dcfce7').setFontColor('#047857').setRanges([statusRange]).build());
    sheet.setConditionalFormatRules(rules);
  }
}

function refreshVideoDemoFormatting() {
  const productSheet = requireSheet_(SMART.productsSheet);
  const inboundSheet = requireSheet_(SMART.inboundSheet);
  const outboundSheet = requireSheet_(SMART.outboundSheet);
  const inventorySheet = requireSheet_(SMART.inventorySheet);
  const productRows = Math.max(productSheet.getLastRow() - 3, 1);
  const inboundRows = Math.max(inboundSheet.getLastRow() - 3, 1);
  const outboundRows = Math.max(outboundSheet.getLastRow() - 3, 1);
  const inventoryRows = Math.min(productRows, 30);
  const formulas = Array.from({length: inventoryRows}, (_, index) => {
    const row = index + 4;
    return [
      `='1_SẢN_PHẨM'!A${row}`,
      `='1_SẢN_PHẨM'!B${row}`,
      `='1_SẢN_PHẨM'!G${row}`,
      `=SUMIF('2_NHẬP_KHO'!C:C;A${row};'2_NHẬP_KHO'!D:D)`,
      `=SUMIF('3_XUẤT_KHO'!C:C;A${row};'3_XUẤT_KHO'!D:D)`,
      `=C${row}+D${row}-E${row}`,
      `='1_SẢN_PHẨM'!H${row}`,
      `=IF(F${row}<=0;"Hết hàng";IF(F${row}<=G${row};"Sắp hết";"Đủ hàng"))`,
      `='1_SẢN_PHẨM'!E${row}`,
      `=F${row}*I${row}`
    ];
  });
  inventorySheet.getRange(4, 1, inventoryRows, 10).setFormulas(formulas);
  formatVideoDemoSheet_(productSheet, productRows, 20, [5,6], [7,8], []);
  formatVideoDemoSheet_(inboundSheet, inboundRows, 20, [5,6], [4], [1,14,15]);
  formatVideoDemoSheet_(outboundSheet, outboundRows, 20, [17,18], [4], [1]);
  formatVideoDemoSheet_(inventorySheet, inventoryRows, 10, [9,10], [3,4,5,6,7], []);
  SpreadsheetApp.flush();
  return {ok:true,message:'Đã làm đẹp dữ liệu hiện tại mà không xóa hay tạo lại giao dịch.'};
}

function hasProductMovements_(sku) {
  return [SMART.inboundSheet, SMART.outboundSheet].some(name => {
    const sheet = requireSheet_(name);
    if (sheet.getLastRow() < 4) return false;
    return sheet.getRange(4, 3, sheet.getLastRow() - 3, 1).getDisplayValues().some(row => String(row[0]).trim().toUpperCase() === sku);
  });
}

function nextEmptyRow_(sheet, startRow, column) {
  const lastRow = Math.max(sheet.getLastRow(), startRow);
  const values = sheet.getRange(startRow, column, lastRow - startRow + 1, 1).getDisplayValues();
  const empty = values.findIndex(row => !String(row[0] || '').trim());
  return empty >= 0 ? startRow + empty : lastRow + 1;
}

function submitMovement(payload) {
  ensureSupportSheets_();
  const lock = LockService.getDocumentLock();
  lock.waitLock(20000);
  try {
    validateMovement_(payload);
    const type = payload.type === 'IN' ? 'IN' : 'OUT';
    const now = new Date();
    const quantity = Number(payload.quantity);
    const sku = String(payload.sku).trim();
    const inventory = getInventoryMap_();
    if (type === 'OUT' && quantity > (inventory[sku] || 0)) {
      throw new Error(`Không thể xuất ${quantity}. Tồn hiện tại của ${sku} chỉ còn ${inventory[sku] || 0}.`);
    }

    const sheet = requireSheet_(type === 'IN' ? SMART.inboundSheet : SMART.outboundSheet);
    const code = nextMovementCode_(type, sheet);
    const targetRow = nextTransactionRow_(sheet);
    if (type === 'IN') {
      sheet.getRange(targetRow, 1, 1, 8).setValues([[now, code, sku, quantity, Number(payload.unitPrice || 0), '', payload.partner || '', payload.note || '']]);
    } else {
      sheet.getRange(targetRow, 1, 1, 7).setValues([[now, code, sku, quantity, payload.reason || 'Bán hàng', payload.orderCode || '', payload.channel || '']]);
    }
    SpreadsheetApp.flush();
    logAction_(type === 'IN' ? 'NHẬP KHO' : 'XUẤT KHO', sku, quantity, payload.note || payload.orderCode || '');
    return { ok: true, code, message: `${type === 'IN' ? 'Nhập' : 'Xuất'} kho thành công`, dashboard: getDashboardData() };
  } finally {
    lock.releaseLock();
  }
}

function nextTransactionRow_(sheet) {
  const startRow = 4;
  const lastRow = Math.max(sheet.getLastRow(), startRow);
  const codes = sheet.getRange(startRow, 2, lastRow - startRow + 1, 1).getDisplayValues();
  const emptyIndex = codes.findIndex(row => !String(row[0] || '').trim());
  return emptyIndex >= 0 ? startRow + emptyIndex : lastRow + 1;
}

function validateMovement_(payload) {
  if (!payload || !['IN', 'OUT'].includes(payload.type)) throw new Error('Loại giao dịch không hợp lệ.');
  if (!payload.sku) throw new Error('Vui lòng chọn sản phẩm.');
  if (!Number.isFinite(Number(payload.quantity)) || Number(payload.quantity) <= 0) throw new Error('Số lượng phải lớn hơn 0.');
  const productExists = searchProducts(payload.sku).some(item => item.sku === payload.sku);
  if (!productExists) throw new Error('Mã sản phẩm không tồn tại hoặc đã ngừng bán.');
}

function nextMovementCode_(type, sheet) {
  const prefix = type === 'IN' ? 'NK' : 'XK';
  const date = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyMMdd');
  const sequence = String(Math.max(sheet.getLastRow() - 2, 1)).padStart(3, '0');
  return `${prefix}${date}${sequence}`;
}

function getInventoryMap_() {
  const sheet = requireSheet_(SMART.inventorySheet);
  const rows = sheet.getRange(4, 1, Math.max(sheet.getLastRow() - 3, 1), 6).getValues();
  return rows.reduce((map, row) => {
    if (row[0]) map[row[0]] = number_(row[5]);
    return map;
  }, {});
}

function showLowStockDialog() {
  const data = getDashboardData();
  const rows = data.lowStock.length
    ? data.lowStock.map(item => `<tr><td>${escapeHtml_(item.sku)}</td><td>${escapeHtml_(item.name)}</td><td>${item.stock}</td><td>${item.minimum}</td></tr>`).join('')
    : '<tr><td colspan="4">Kho đang ở mức an toàn.</td></tr>';
  const html = HtmlService.createHtmlOutput(`<style>body{font:14px Arial;padding:16px;color:#1f2937}table{width:100%;border-collapse:collapse}th,td{padding:8px;border-bottom:1px solid #ddd;text-align:left}th{background:#047857;color:white}</style><h2>Cảnh báo tồn kho</h2><table><tr><th>SKU</th><th>Sản phẩm</th><th>Tồn</th><th>Tối thiểu</th></tr>${rows}</table>`).setWidth(620).setHeight(420);
  SpreadsheetApp.getUi().showModalDialog(html, 'Cảnh báo tồn kho');
}

function sendDailyLowStockAlert() {
  ensureSupportSheets_();
  const config = getSmartConfig_();
  const data = getDashboardData();
  if (!config.email || !data.lowStock.length) return;
  const lines = data.lowStock.map(item => `${item.sku} – ${item.name}: còn ${item.stock}, tối thiểu ${item.minimum}`).join('\n');
  MailApp.sendEmail({
    to: config.email,
    subject: `[Quản Lý Kho Mini] ${data.lowStock.length} sản phẩm cần nhập thêm`,
    body: `Danh sách cảnh báo tồn kho:\n\n${lines}\n\nMở file: ${getSpreadsheet_().getUrl()}`
  });
  logAction_('EMAIL CẢNH BÁO', '', data.lowStock.length, config.email);
}

function sendInventoryReport() {
  ensureSupportSheets_();
  const config = getSmartConfig_();
  if (!config.email) throw new Error('Vui lòng nhập email tại sheet 9_CẤU_HÌNH.');
  const blob = createDashboardPdf_();
  MailApp.sendEmail({
    to: config.email,
    subject: `${config.reportName} – ${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy')}`,
    body: 'Báo cáo tồn kho được tạo tự động từ Quản Lý Kho Mini – Google Sheets Smart.',
    attachments: [blob]
  });
  logAction_('GỬI PDF', '', 0, config.email);
  return { ok: true, message: `Đã gửi báo cáo tới ${config.email}` };
}

function saveSmartConfig(payload) {
  ensureSupportSheets_();
  const email = String(payload && payload.email || '').trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Email chưa đúng định dạng.');
  const reportName = String(payload && payload.reportName || 'Báo cáo tồn kho').trim();
  const sheet = requireSheet_(SMART.configSheet);
  sheet.getRange('B2').setValue(email);
  sheet.getRange('B4').setValue(reportName || 'Báo cáo tồn kho');
  updateStartGuide_();
  logAction_('CẬP NHẬT CÀI ĐẶT', '', 0, email || 'Chưa nhập email');
  return getSmartConfig_();
}

function getRecentMovements() {
  const collect = (sheetName, type) => {
    const sheet = requireSheet_(sheetName);
    if (sheet.getLastRow() < 4) return [];
    return sheet.getRange(4, 1, sheet.getLastRow() - 3, Math.min(sheet.getLastColumn(), 8)).getDisplayValues()
      .filter(row => row[0] && row[2])
      .map(row => ({ date: row[0], code: row[1], sku: row[2], quantity: number_(row[3]), type }));
  };
  return collect(SMART.inboundSheet, 'IN').concat(collect(SMART.outboundSheet, 'OUT')).slice(-100).reverse();
}

function getInventoryRows() {
  const sheet = requireSheet_(SMART.inventorySheet);
  return sheet.getRange(4, 1, Math.max(sheet.getLastRow() - 3, 1), 10).getValues()
    .filter(row => row[0])
    .map(row => ({sku: String(row[0]), name: String(row[1]), opening: number_(row[2]), inbound: number_(row[3]), outbound: number_(row[4]), stock: number_(row[5]), minimum: number_(row[6]), status: String(row[7]), cost: number_(row[8]), value: number_(row[9])}));
}

function createSmartReport(payload) {
  payload = payload || {};
  const report = buildSmartReport_(payload);
  const pdf = HtmlService.createHtmlOutput(report.html).getBlob().getAs(MimeType.PDF).setName(report.fileName);
  logAction_('TẠO PDF', '', 0, report.title);
  return { ok: true, fileName: report.fileName, title: report.title, base64: Utilities.base64Encode(pdf.getBytes()) };
}

function sendSmartReport(payload) {
  payload = payload || {};
  const recipient = String(payload.email || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) throw new Error('Vui lòng nhập email người nhận hợp lệ.');
  if (MailApp.getRemainingDailyQuota() < 1) throw new Error('Tài khoản Google đã hết hạn mức gửi email hôm nay.');
  const report = buildSmartReport_(payload);
  const pdf = HtmlService.createHtmlOutput(report.html).getBlob().getAs(MimeType.PDF).setName(report.fileName);
  MailApp.sendEmail({
    to: recipient,
    subject: `${report.title} – ${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy')}`,
    body: 'Báo cáo được tạo từ Quản Lý Kho Mini – Google Sheets Smart.',
    htmlBody: `<p>Xin chào,</p><p>Đính kèm là <b>${escapeHtml_(report.title)}</b> được tạo từ Kho Mini Smart.</p><p style="color:#64748b">File Đi Làm – Công cụ quản lý đơn giản cho shop nhỏ.</p>`,
    name: 'File Đi Làm – Báo cáo kho',
    attachments: [pdf]
  });
  logAction_('GỬI BÁO CÁO', '', 0, `${report.title} → ${recipient}`);
  return { ok: true, message: `Đã gửi ${report.title} tới ${recipient}` };
}

function previewSmartReport(payload) {
  const report = buildSmartReport_(payload || {});
  return { title: report.title, html: report.html };
}

function buildSmartReport_(payload) {
  const type = String(payload.type || 'summary');
  const names = {summary:'Báo cáo tổng quan kho',products:'Danh mục sản phẩm',inbound:'Báo cáo nhập kho',outbound:'Báo cáo xuất kho',inventory:'Báo cáo tồn kho',alerts:'Báo cáo hàng cần nhập'};
  if (!names[type]) throw new Error('Loại báo cáo không hợp lệ.');
  const from = parseReportDate_(payload.from, false);
  const to = parseReportDate_(payload.to, true);
  if (from && to && from > to) throw new Error('Ngày bắt đầu phải trước ngày kết thúc.');
  let headers = [], rows = [], metrics = [];
  if (type === 'products') {
    headers = ['SKU','Tên sản phẩm','Nhóm','Đơn vị','Giá vốn','Giá bán','Tồn tối thiểu','Tồn đầu'];
    rows = searchProducts('').map(x => [x.sku,x.name,x.group,x.unit,moneyText_(x.cost),moneyText_(x.price),x.minimum,x.opening]);
  } else if (type === 'inbound' || type === 'outbound') {
    const isIn = type === 'inbound';
    const sheet = requireSheet_(isIn ? SMART.inboundSheet : SMART.outboundSheet);
    const width = isIn ? 8 : 7;
    headers = isIn ? ['Ngày','Mã phiếu','SKU','Số lượng','Đơn giá','Thành tiền','Nhà cung cấp','Ghi chú'] : ['Ngày','Mã phiếu','SKU','Số lượng','Lý do','Mã đơn','Kênh bán'];
    rows = sheet.getLastRow() < 4 ? [] : sheet.getRange(4,1,sheet.getLastRow()-3,width).getValues().filter(row => row[0] && row[2] && inReportRange_(row[0],from,to)).map(row => row.map((v,i) => i === 0 ? Utilities.formatDate(new Date(v),Session.getScriptTimeZone(),'dd/MM/yyyy') : (isIn && [4,5].includes(i) ? moneyText_(v) : v)));
    metrics = [['Số giao dịch', rows.length], ['Tổng số lượng', rows.reduce((s,r)=>s+number_(r[3]),0)]];
  } else {
    const inventory = getInventoryRows();
    if (type === 'inventory') {
      headers = ['SKU','Tên sản phẩm','Đã nhập','Đã xuất','Tồn hiện tại','Tối thiểu','Trạng thái','Giá trị tồn'];
      rows = inventory.map(x => [x.sku,x.name,x.inbound,x.outbound,x.stock,x.minimum,x.status,moneyText_(x.value)]);
    } else if (type === 'alerts') {
      headers = ['SKU','Tên sản phẩm','Tồn hiện tại','Tồn tối thiểu','Cần nhập thêm'];
      rows = inventory.filter(x=>x.stock<=x.minimum).map(x=>[x.sku,x.name,x.stock,x.minimum,Math.max(x.minimum-x.stock,0)]);
    } else {
      headers = ['SKU','Tên sản phẩm','Tồn hiện tại','Tồn tối thiểu','Trạng thái','Giá trị tồn'];
      rows = inventory.map(x=>[x.sku,x.name,x.stock,x.minimum,x.status,moneyText_(x.value)]);
      const d = getDashboardData();
      metrics = [['Sản phẩm',d.productCount],['Tổng tồn',d.totalStock],['Giá trị tồn',moneyText_(d.inventoryValue)],['Cần nhập',d.lowStockCount]];
    }
  }
  const period = (from || to) ? `${from ? Utilities.formatDate(from,Session.getScriptTimeZone(),'dd/MM/yyyy') : 'đầu kỳ'} – ${to ? Utilities.formatDate(to,Session.getScriptTimeZone(),'dd/MM/yyyy') : 'hiện tại'}` : 'Tại thời điểm lập báo cáo';
  const metricHtml = metrics.length ? `<div class="metrics">${metrics.map(m=>`<div><span>${escapeHtml_(m[0])}</span><b>${escapeHtml_(m[1])}</b></div>`).join('')}</div>` : '';
  const tableHtml = `<table><thead><tr>${headers.map(h=>`<th>${escapeHtml_(h)}</th>`).join('')}</tr></thead><tbody>${rows.length ? rows.map(r=>`<tr>${r.map(v=>`<td>${escapeHtml_(v)}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${headers.length}">Không có dữ liệu trong kỳ đã chọn.</td></tr>`}</tbody></table>`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>@page{size:A4 landscape;margin:15mm}body{font:12px Arial;color:#172033}header{border-bottom:3px solid #047857;padding-bottom:12px;margin-bottom:16px}h1{color:#065f46;margin:0 0 5px}.sub{color:#64748b}.metrics{display:flex;gap:10px;margin:14px 0}.metrics div{flex:1;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:10px}.metrics span{display:block;color:#64748b;font-size:10px}.metrics b{font-size:18px;color:#047857}table{width:100%;border-collapse:collapse}th{background:#047857;color:white}th,td{padding:7px;border:1px solid #dbe4ea;text-align:left}tr:nth-child(even){background:#f8fafc}footer{margin-top:15px;color:#64748b;font-size:10px}</style></head><body><header><h1>${escapeHtml_(names[type])}</h1><div class="sub">${escapeHtml_(period)} · File Đi Làm – Kho Mini Smart</div></header>${metricHtml}${tableHtml}<footer>Tạo lúc ${Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'HH:mm dd/MM/yyyy')}</footer></body></html>`;
  return { title:names[type], html, fileName:`${type}_${Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'yyyyMMdd_HHmm')}.pdf` };
}

function parseReportDate_(value, endOfDay) {
  if (!value) return null;
  const parts = String(value).split('-').map(Number);
  if (parts.length !== 3) return null;
  return new Date(parts[0], parts[1]-1, parts[2], endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0);
}

function inReportRange_(value, from, to) {
  const date = new Date(value);
  return (!from || date >= from) && (!to || date <= to);
}

function moneyText_(value) {
  return new Intl.NumberFormat('vi-VN').format(number_(value)) + ' đ';
}

function createDashboardPdf_() {
  const ss = getSpreadsheet_();
  SpreadsheetApp.flush();
  const file = DriveApp.getFileById(ss.getId());
  return file.getAs(MimeType.PDF)
    .setName(`Bao_cao_ton_kho_${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmm')}.pdf`);
}

function getSmartConfig_() {
  ensureSupportSheets_();
  const sheet = requireSheet_(SMART.configSheet);
  return {
    email: String(sheet.getRange('B2').getValue() || '').trim(),
    reportName: String(sheet.getRange('B4').getValue() || 'Báo cáo tồn kho').trim()
  };
}

function validateWebAppUrl_(value) {
  const url = String(value || '').trim();
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec(?:[?#].*)?$/.test(url)) {
    throw new Error('Link Web App chưa đúng. Hãy sao chép đường dẫn triển khai kết thúc bằng /exec.');
  }
  return url;
}

function updateStartGuide_() {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName('0_BẮT_ĐẦU');
  if (!sheet) return;
  const marker = 'MỞ WEB APP QUẢN LÝ KHO';
  const current = String(sheet.getRange('A18').getValue() || '').trim();
  if (current && current !== marker && current !== 'THIẾT LẬP WEB APP – CHỈ LÀM 1 LẦN') return;
  sheet.getRange('A18:H25').breakApart();
  sheet.getRange('A18:H18').merge().setValue(marker).setBackground('#047857').setFontColor('#ffffff').setFontWeight('bold').setFontSize(13);
  const lines = [
    'Không cần vào Tiện ích mở rộng, không cần tự triển khai Apps Script và không cần dán link /exec.',
    '1. Sau khi tạo bản sao, tải lại Google Sheets một lần để menu 📦 Kho Mini Smart xuất hiện.',
    '2. Chọn 📦 Kho Mini Smart → Mở ứng dụng quản lý kho.',
    '3. Lần đầu, Google sẽ yêu cầu cấp quyền để Web App đọc và ghi đúng file của bạn.',
    '4. Web App tự liên kết với bản Google Sheets này; dữ liệu vẫn nằm trong Google Drive của bạn.',
    '5. Có thể lưu link Web App bên dưới để mở lại trên điện thoại, iPad hoặc máy tính.'
  ];
  lines.forEach((text, index) => sheet.getRange(19 + index, 1, 1, 8).merge().setValue(text));
  sheet.getRange('A19:H24').setBackground('#ecfdf5').setFontColor('#065f46').setWrap(true).setVerticalAlignment('middle');
  const url = `${SMART.webAppUrl}?spreadsheetId=${encodeURIComponent(ss.getId())}`;
  const linkCell = sheet.getRange('A25:H25').merge().setBackground('#dbeafe').setFontWeight('bold').setHorizontalAlignment('center');
  linkCell.setRichTextValue(SpreadsheetApp.newRichTextValue().setText('🚀 MỞ WEB APP QUẢN LÝ KHO').setLinkUrl(url).build()).setFontColor('#1d4ed8');
  sheet.setRowHeights(18, 8, 30);
}

function refreshCustomerGuide() {
  ensureSupportSheets_();
  return { ok: true, message: 'Đã bổ sung hướng dẫn thiết lập mà không thay đổi dữ liệu kho.' };
}

function logAction_(action, sku, quantity, detail) {
  ensureSupportSheets_();
  const sheet = requireSheet_(SMART.logSheet);
  sheet.appendRow([new Date(), 'Người dùng file', action, sku, quantity, detail, SMART.version]);
}

function requireSheet_(name) {
  const sheet = getSpreadsheet_().getSheetByName(name);
  if (!sheet) throw new Error(`Không tìm thấy sheet ${name}. Vui lòng dùng đúng file master.`);
  return sheet;
}

function getSpreadsheet_() {
  const targetId = String(PropertiesService.getUserProperties().getProperty('SMART_TARGET_SPREADSHEET_ID') || '').trim();
  if (/^[A-Za-z0-9_-]{20,}$/.test(targetId)) return SpreadsheetApp.openById(targetId);
  const active = SpreadsheetApp.getActive();
  if (active) return active;
  return SpreadsheetApp.openById(SMART.masterSpreadsheetId);
}

function number_(value) {
  if (typeof value === 'number') return value;
  return Number(String(value || '0').replace(/[^0-9.-]/g, '')) || 0;
}

function escapeHtml_(value) {
  return String(value || '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}
