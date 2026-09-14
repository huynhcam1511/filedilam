/**
 * PHẦN MỀM QUẢN LÝ CÔNG NỢ KINH DOANH (GOOGLE SHEETS + APPS SCRIPT)
 * Phiên bản: 1.0 (VIP Pro)
 * 
 * HƯỚNG DẪN:
 * Copy toàn bộ đoạn code này dán vào file Code.gs trong Apps Script.
 */

// 1. Tạo Custom Menu khi mở file
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🏥 CÔNG NỢ VIP PRO')
    .addItem('📝 Mở Form Nhập Liệu', 'showSidebar')
    .addSeparator()
    .addItem('🚀 Khởi tạo Dữ liệu mẫu (Bấm 1 lần)', 'initSeedData')
    .addSeparator()
    .addItem('✉️ Gửi Email Nhắc Nợ Tự Động', 'sendDebtReminderEmails')
    .addToUi();
}

// 2. Hàm hiển thị Sidebar Form
function showSidebar() {
  // Đảm bảo có sheet Danh_Muc_Doi_Tac trước khi mở form
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss.getSheetByName("Danh_Muc_Doi_Tac")) {
    SpreadsheetApp.getUi().alert("Vui lòng chạy 'Khởi tạo Dữ liệu mẫu' trước!");
    return;
  }
  
  var html = HtmlService.createHtmlOutputFromFile('Sidebar')
      .setTitle('Nhập Giao Dịch Nhanh')
      .setWidth(350);
  SpreadsheetApp.getUi().showSidebar(html);
}

// 2.5 Hàm tự động tạo Sheet và Dữ liệu mẫu
function initSeedData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Tạo sheet Danh_Muc_Doi_Tac
  var sheet1 = ss.getSheetByName("Danh_Muc_Doi_Tac");
  if (!sheet1) {
    sheet1 = ss.insertSheet("Danh_Muc_Doi_Tac");
    sheet1.appendRow(["Mã ĐT", "Tên Khách hàng / Nhà cung cấp", "Phân loại", "Email kế toán", "Số điện thoại", "Dư nợ hiện tại"]);
    sheet1.getRange("A1:F1").setFontWeight("bold").setBackground("#e2e8f0");
    
    sheet1.appendRow(["KH001", "Cửa hàng VLXD Phát Đạt", "KH", "ketoan@phatdat.vn", "0901234567", 150000000]);
    sheet1.appendRow(["KH002", "Đại lý Tạp hóa Cô Ba", "KH", "coba@gmail.com", "0987654321", 4550000]);
    sheet1.appendRow(["DL001", "Tổng kho Phân phối Miền Nam", "KH", "hotro@tongkho.vn", "18006858", 0]);
    sheet1.appendRow(["NCC01", "Cty TNHH Sản xuất ABC", "NCC", "sale@abc.com", "0909123456", 22000000]);
  }
  
  // Tạo sheet Phat_Sinh_Cong_No
  var sheet2 = ss.getSheetByName("Phat_Sinh_Cong_No");
  if (!sheet2) {
    sheet2 = ss.insertSheet("Phat_Sinh_Cong_No");
    sheet2.appendRow(["Mã Giao Dịch", "Thời gian", "Mã Đối Tác", "Tên Đối Tác", "Loại Giao Dịch", "Số Tiền", "Ghi Chú"]);
    sheet2.getRange("A1:G1").setFontWeight("bold").setBackground("#e2e8f0");
  }
  
  // Xóa sheet mặc định nếu trống
  var defaultSheet = ss.getSheetByName("Trang tính1");
  if (defaultSheet && defaultSheet.getLastRow() === 0) {
    ss.deleteSheet(defaultSheet);
  }
  
  SpreadsheetApp.getUi().alert("Khởi tạo dữ liệu thành công! Bây giờ bạn có thể mở Form nhập liệu.");
}

// 3. Hàm lấy danh sách Khách hàng/Nhà cung cấp từ Sheet "Danh_Muc_Doi_Tac"
function getPartners() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Danh_Muc_Doi_Tac");
  if (!sheet) return [];
  
  var data = sheet.getDataRange().getValues();
  var partners = [];
  
  // Bỏ qua dòng tiêu đề (i=1)
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] && data[i][1]) {
      partners.push({
        id: data[i][0],
        name: data[i][1],
        email: data[i][3], // Email để gửi nhắc nợ
        debt: data[i][5] // Dư nợ hiện tại
      });
    }
  }
  return partners;
}

// 4. Hàm xử lý lưu giao dịch từ Form xuống Sheet "Phat_Sinh_Cong_No"
function addTransaction(formObject) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Phat_Sinh_Cong_No");
    if (!sheet) {
      return { success: false, message: "Lỗi: Không tìm thấy trang tính 'Phat_Sinh_Cong_No'" };
    }
    
    var timeStamp = new Date();
    var transactionId = "GD" + timeStamp.getTime().toString().slice(-6);
    
    sheet.appendRow([
      transactionId,
      timeStamp,
      formObject.partnerId,
      formObject.partnerName,
      formObject.transactionType,
      Number(formObject.amount),
      formObject.note
    ]);
    
    return { success: true, message: "Đã ghi nhận giao dịch thành công!" };
  } catch (error) {
    return { success: false, message: "Lỗi hệ thống: " + error.toString() };
  }
}

// 5. Hàm tự động gửi Email nhắc nợ (Tính năng Premium)
function sendDebtReminderEmails() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert('Xác nhận', 'Bạn có chắc chắn muốn gửi Email nhắc nợ đến các khách hàng/đối tác đang nợ quá hạn?', ui.ButtonSet.YES_NO);
  
  if (response == ui.Button.YES) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Danh_Muc_Doi_Tac");
    var data = sheet.getDataRange().getValues();
    var count = 0;
    
    for (var i = 1; i < data.length; i++) {
      var name = data[i][1];
      var email = data[i][3];
      var debt = Number(data[i][5]);
      
      // Chỉ gửi cho đối tác có nợ > 0 và có email
      if (debt > 0 && email && email.includes("@")) {
        var subject = "[THÔNG BÁO] Đối chiếu công nợ - " + name;
        var body = "Kính gửi Kế toán " + name + ",\n\n" +
                   "Chúng tôi xin gửi thông báo đối chiếu công nợ định kỳ.\n" +
                   "Tính đến thời điểm hiện tại, dư nợ của Quý đơn vị là: " + debt.toLocaleString('vi-VN') + " VNĐ.\n\n" +
                   "Vui lòng kiểm tra và phản hồi lại nếu có sai sót. Nếu không, kính mong Quý đơn vị sớm sắp xếp thanh toán.\n" +
                   "Trân trọng cảm ơn!";
        
        try {
          GmailApp.sendEmail(email, subject, body);
          count++;
        } catch (e) {
          // Bỏ qua lỗi gửi mail sai
        }
      }
    }
    
    ui.alert('Thành công', 'Đã gửi thành công ' + count + ' email nhắc nợ tự động!', ui.ButtonSet.OK);
  }
}
