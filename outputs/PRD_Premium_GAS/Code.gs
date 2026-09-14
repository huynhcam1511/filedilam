/**
 * PHẦN MỀM QUẢN LÝ CÔNG NỢ KINH DOANH (PREMIUM)
 */

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🏥 CÔNG NỢ VIP PRO')
    .addItem('📝 Mở Form Nhập Liệu', 'showSidebar')
    .addSeparator()
    .addItem('✨ Làm Đẹp File (Auto-Format)', 'formatSheets')
    .addToUi();
}

function showSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('Sidebar').setTitle('Nhập Giao Dịch Nhanh').setWidth(350);
  SpreadsheetApp.getUi().showSidebar(html);
}

function getPartners() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('👥 DM Khách Hàng');
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  var partners = [];
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] && data[i][1]) {
      partners.push({ id: data[i][0], name: data[i][1], email: data[i][5] || '', debt: 0 });
    }
  }
  return partners;
}

function addTransaction(formObject) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var timeStamp = new Date();
    
    if (formObject.transactionType === 'Bán hàng (Ghi nợ)') {
      var sheet = ss.getSheetByName('📝 Ghi Nhận Doanh Thu');
      if (!sheet) return { success: false, message: 'Lỗi: Không tìm thấy sheet 📝 Ghi Nhận Doanh Thu' };
      var transactionId = 'HD' + timeStamp.getTime().toString().slice(-6);
      sheet.appendRow([transactionId, timeStamp, formObject.partnerId, formObject.partnerName, '', 'Sản phẩm chung', 1, Number(formObject.amount), Number(formObject.amount), formObject.note, '']);
    } else {
      var sheet = ss.getSheetByName('💰 Ghi Nhận Thu Tiền');
      if (!sheet) return { success: false, message: 'Lỗi: Không tìm thấy sheet 💰 Ghi Nhận Thu Tiền' };
      var transactionId = 'PT' + timeStamp.getTime().toString().slice(-6);
      sheet.appendRow([transactionId, timeStamp, '', formObject.partnerId, Number(formObject.amount), 'Chuyển khoản', formObject.note]);
    }
    return { success: true, message: 'Đã ghi nhận giao dịch thành công!' };
  } catch (error) {
    return { success: false, message: 'Lỗi hệ thống: ' + error.toString() };
  }
}

function formatSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    var sheet = sheets[i];
    sheet.setFrozenRows(1);
    try {
      sheet.getRange(1, 1, 1, sheet.getMaxColumns()).setFontWeight('bold').setBackground('#2B6CB0').setFontColor('white');
      sheet.autoResizeColumns(1, Math.min(sheet.getMaxColumns(), 10));
      sheet.getRange(2, 1, Math.max(1, sheet.getLastRow()-1), Math.max(1, sheet.getLastColumn())).setFontFamily('Inter');
    } catch(e) {}
  }
  SpreadsheetApp.getUi().alert('Đã Format xong! File đã trở nên siêu đẹp!');
}
