/**
 * QUẢN LÝ CÔNG NỢ KHÁCH HÀNG & NCC — WEB APP v1.0 — FILE ĐI LÀM
 * Backend Engine & Google Sheets RPC Handlers
 * Chuẩn tuân thủ: AGENTS_MASTER.md V2.4 & FILE ĐI LÀM SYSTEM CONSTITUTION
 */

// 1. HẰNG SỐ CẤU HÌNH HỆ THỐNG
var WEB_APP_URL = "https://script.google.com/macros/s/AKfycbz_REPLACE_WITH_YOUR_DEPLOYMENT_ID/exec";
var APP_TITLE = "QUẢN LÝ CÔNG NỢ KHÁCH HÀNG & NCC — WEB APP v1.0 — FILE ĐI LÀM";

// Tên các tab Database chuẩn
var SHEETS = {
  DOI_TAC: 'DB_DoiTac',
  PHAT_SINH_NO: 'DB_PhatSinhNo',
  THANH_TOAN: 'DB_ThanhToan',
  DANH_MUC: 'DB_DanhMuc',
  CAI_DAT: 'DB_CaiDat',
  HDSD: 'HDSD'
};

/**
 * Khởi tạo Menu trên Google Sheet khi mở file
 */
function onOpen() {
  // Tự động đồng bộ tên File Google Sheet theo hằng số APP_TITLE
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var currentName = ss.getName();
    if (currentName !== APP_TITLE && !currentName.startsWith('Bản sao của')) {
      ss.rename(APP_TITLE);
    }
  } catch (e) {
    // Bỏ qua lỗi nếu không đủ quyền đổi tên
  }

  SpreadsheetApp.getUi()
    .createMenu('File Đi Làm')
    .addItem('Mở Ứng Dụng Công Nợ', 'openWebApp')
    .addSeparator()
    .addItem('Khởi Tạo & Khóa Dữ Liệu', 'setupDatabaseSheets')
    .addItem('Khóa & Ẩn Database (Bảo vệ dữ liệu)', 'lockAndHideDatabaseSheets')
    .addToUi();
}

/**
 * Mở Web App trực tiếp từ Google Sheet
 */
function openWebApp() {
  var html = HtmlService.createHtmlOutput(
    '<div style="font-family:sans-serif;padding:12px;text-align:center;">' +
      '<p style="margin-bottom:12px;font-size:14px;color:#334155;">Đang kết nối ứng dụng Web App Quản Lý Công Nợ...</p>' +
      '<a href="' + WEB_APP_URL + '" target="_blank" style="display:inline-block;padding:10px 18px;background:#059669;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;font-size:13px;">Nhấn vào đây nếu không tự mở</a>' +
    '</div>' +
    '<script>window.open("' + WEB_APP_URL + '", "_blank");setTimeout(function(){google.script.host.close();}, 800);</script>'
  ).setWidth(380).setHeight(130);
  SpreadsheetApp.getUi().showModalDialog(html, 'Đang mở Sổ Quản Lý Công Nợ...');
}

/**
 * Điểm vào Web App chính
 */
function doGet(e) {
  var template;
  try {
    template = HtmlService.createTemplateFromFile('CONGNO_Index');
  } catch (err) {
    try {
      template = HtmlService.createTemplateFromFile('Index');
    } catch (err2) {
      return HtmlService.createHtmlOutput(
        '<div style="font-family:sans-serif;padding:24px;text-align:center;">' +
        '<h3 style="color:#e11d48;">Chưa tìm thấy file giao diện HTML</h3>' +
        '<p style="color:#475569;">Vui lòng tạo tệp HTML trong Apps Script với tên là <b>CONGNO_Index</b> hoặc <b>Index</b> và dán toàn bộ mã giao diện vào.</p>' +
        '</div>'
      );
    }
  }
  return template.evaluate()
    .setTitle(APP_TITLE)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Hàm hỗ trợ nạp các module HTML partials theo kiến trúc Component-Based
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Sinh ID ngẫu nhiên chuẩn AGENTS.md: Prefix + 6 chữ số ngẫu nhiên
 * Ví dụ: KHNG-184920, NCCP-839201, HOAD-394821, PTHU-829103
 */
function generateId(prefix) {
  var cleanPrefix = prefix ? prefix.toUpperCase() : 'REC';
  var randomSix = Math.floor(100000 + Math.random() * 900000);
  return cleanPrefix + '-' + randomSix;
}

/**
 * QUY TẮC SINGLE VISIBLE TAB: Khóa và Ẩn toàn bộ tab DB_*, chỉ để lại tab HDSD hiển thị
 */
function lockAndHideDatabaseSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  
  // Đảm bảo tab HDSD tồn tại và được hiển thị trước khi ẩn các sheet khác
  var hdsdSheet = getOrCreateSheet(ss, SHEETS.HDSD);
  hdsdSheet.showSheet();
  ss.setActiveSheet(hdsdSheet);

  sheets.forEach(function(sh) {
    var name = sh.getName();
    if (name.indexOf('DB_') === 0) {
      try {
        sh.hideSheet();
      } catch (e) {
        // Tránh lỗi nếu sheet duy nhất đang hiển thị
      }
      var protections = sh.getProtections(SpreadsheetApp.ProtectionType.SHEET);
      if (protections.length === 0) {
        var protection = sh.protect().setDescription('Khóa bảo vệ Database FILE ĐI LÀM');
        protection.setWarningOnly(true);
      }
    } else if (name === SHEETS.HDSD) {
      sh.showSheet();
    }
  });

  return { success: true, message: 'Đã khóa & ẩn toàn bộ Database, duy trì Single Visible Tab (HDSD).' };
}

/**
 * Tự động tạo và chuẩn hóa cấu trúc 5 tab Database & 1 tab HDSD duy nhất
 */
function setupDatabaseSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. DB_DoiTac: [Mã ĐT, Loại, Tên Đối Tác, SĐT, Email, Địa Chỉ, Hạn Mức Tín Dụng, Hạn Nợ (Ngày), Ghi Chú, Trạng Thái, Ngày Tạo]
  var sDoiTac = getOrCreateSheet(ss, SHEETS.DOI_TAC);
  if (sDoiTac.getLastRow() === 0) {
    sDoiTac.appendRow([
      'Mã ĐT', 'Loại', 'Tên Đối Tác', 'SĐT', 'Email', 
      'Địa Chỉ', 'Hạn Mức Tín Dụng', 'Hạn Nợ (Ngày)', 'Ghi Chú', 'Trạng Thái', 'Ngày Tạo'
    ]);
    formatHeaderRow(sDoiTac);
    sDoiTac.appendRow([
      'KHNG-102938', 'Khách hàng', 'Công ty CP Đầu Tư Alpha', '0903123456', 'alpha.corp@gmail.com',
      '72 Lê Lợi, Bến Nghé, Quận 1, TP.HCM', 50000000, 30, 'Khách hàng VIP dự án nội thất', 'Đang giao dịch', '15/01/2026'
    ]);
    sDoiTac.appendRow([
      'KHNG-294819', 'Khách hàng', 'Đại Lý Phân Phối Minh Khang', '0918765432', 'minhkhang.dist@gmail.com',
      '128 Nguyễn Trãi, Thanh Xuân, Hà Nội', 30000000, 15, 'Đại lý độc quyền miền Bắc', 'Đang giao dịch', '20/02/2026'
    ]);
    sDoiTac.appendRow([
      'NCCP-582910', 'Nhà cung cấp', 'Tổng Kho Vật Tư Nam Sài Gòn', '0982345678', 'vattu.namsaigon@gmail.com',
      'Khu CN Tân Bình, Tây Thạnh, Tân Phú, TP.HCM', 100000000, 45, 'Nhà cung cấp vật tư chính', 'Đang giao dịch', '05/01/2026'
    ]);
    sDoiTac.appendRow([
      'NCCP-691823', 'Nhà cung cấp', 'Xưởng Sản Xuất Bao Bì Toàn Cầu', '0977889900', 'baobi.toancau@gmail.com',
      'Lô 4B Cụm CN Hưng Yên', 20000000, 30, 'Cung ứng thùng carton', 'Đang giao dịch', '10/02/2026'
    ]);
  }

  // 2. DB_PhatSinhNo: [Mã GD, Mã ĐT, Tên ĐT, Loại GD, Số Tiền, Đã Thanh Toán, Còn Lại, Hạn Thanh Toán, Ngày Chứng Từ, Số Hóa Đơn, Ghi Chú, Trạng Thái]
  var sPhatSinh = getOrCreateSheet(ss, SHEETS.PHAT_SINH_NO);
  if (sPhatSinh.getLastRow() === 0) {
    sPhatSinh.appendRow([
      'Mã GD', 'Mã ĐT', 'Tên ĐT', 'Loại GD', 'Số Tiền', 
      'Đã Thanh Toán', 'Còn Lại', 'Hạn Thanh Toán', 'Ngày Chứng Từ', 'Số Hóa Đơn', 'Ghi Chú', 'Trạng Thái'
    ]);
    formatHeaderRow(sPhatSinh);
    sPhatSinh.appendRow([
      'HOAD-102931', 'KHNG-102938', 'Công ty CP Đầu Tư Alpha', 'Bán hàng', 25000000,
      10000000, 15000000, '15/02/2026', '16/01/2026', 'HD-00129', 'Đơn hàng setup văn phòng Q1', 'Còn nợ'
    ]);
    sPhatSinh.appendRow([
      'HOAD-204918', 'KHNG-294819', 'Đại Lý Phân Phối Minh Khang', 'Bán hàng', 18000000,
      18000000, 0, '05/03/2026', '21/02/2026', 'HD-00135', 'Lô hàng giao đợt 1', 'Đã tất toán'
    ]);
    sPhatSinh.appendRow([
      'HOAD-305829', 'NCCP-582910', 'Tổng Kho Vật Tư Nam Sài Gòn', 'Mua hàng', 45000000,
      20000000, 25000000, '20/02/2026', '06/01/2026', 'PO-2026-08', 'Nhập gỗ An Cường đợt đầu', 'Còn nợ'
    ]);
  }

  // 3. DB_ThanhToan: [Mã TT, Mã GD, Mã ĐT, Tên ĐT, Loại TT, Số Tiền, Phương Thức, Ngày TT, Ghi Chú, Mã Tham Chiếu]
  var sThanhToan = getOrCreateSheet(ss, SHEETS.THANH_TOAN);
  if (sThanhToan.getLastRow() === 0) {
    sThanhToan.appendRow([
      'Mã TT', 'Mã GD', 'Mã ĐT', 'Tên ĐT', 'Loại TT', 
      'Số Tiền', 'Phương Thức', 'Ngày TT', 'Ghi Chú', 'Mã Tham Chiếu'
    ]);
    formatHeaderRow(sThanhToan);
    sThanhToan.appendRow([
      'PTHU-102938', 'HOAD-102931', 'KHNG-102938', 'Công ty CP Đầu Tư Alpha', 'Thu nợ',
      10000000, 'Chuyển khoản VietQR', '18/01/2026', 'Tạm ứng đợt 1 hợp đồng', 'VCB-98230192'
    ]);
    sThanhToan.appendRow([
      'PTHU-203948', 'HOAD-204918', 'KHNG-294819', 'Đại Lý Phân Phối Minh Khang', 'Thu nợ',
      18000000, 'Chuyển khoản VietQR', '28/02/2026', 'Tất toán hóa đơn HD-00135', 'TCB-81923011'
    ]);
    sThanhToan.appendRow([
      'PTRA-304918', 'HOAD-305829', 'NCCP-582910', 'Tổng Kho Vật Tư Nam Sài Gòn', 'Trả nợ',
      20000000, 'Chuyển khoản', '15/01/2026', 'Thanh toán đợt 1 tiền vật tư', 'MB-39102831'
    ]);
  }

  // 4. DB_DanhMuc: [Nhóm, Mã, Tên, Ghi Chú]
  var sDanhMuc = getOrCreateSheet(ss, SHEETS.DANH_MUC);
  if (sDanhMuc.getLastRow() === 0) {
    sDanhMuc.appendRow(['Nhóm', 'Mã', 'Tên', 'Ghi Chú']);
    formatHeaderRow(sDanhMuc);
    // HinhThucThanhToan
    sDanhMuc.appendRow(['Hình thức thanh toán', 'DMUC-101001', 'Chuyển khoản VietQR', 'Thanh toán quét mã QR động']);
    sDanhMuc.appendRow(['Hình thức thanh toán', 'DMUC-101002', 'Tiền mặt', 'Thu chi tiền mặt trực tiếp']);
    sDanhMuc.appendRow(['Hình thức thanh toán', 'DMUC-101003', 'Chuyển khoản thường', 'Internet Banking thông thường']);
    // LoaiDoiTac
    sDanhMuc.appendRow(['Loại đối tác', 'DMUC-201001', 'Khách hàng', 'Đối tác phát sinh công nợ phải thu']);
    sDanhMuc.appendRow(['Loại đối tác', 'DMUC-201002', 'Nhà cung cấp', 'Đối tác phát sinh công nợ phải trả']);
    // TrangThaiNo
    sDanhMuc.appendRow(['Trạng thái nợ', 'DMUC-301001', 'Còn nợ', 'Hóa đơn chưa thanh toán hoặc thanh toán 1 phần']);
    sDanhMuc.appendRow(['Trạng thái nợ', 'DMUC-301002', 'Đã tất toán', 'Đã thanh toán đủ toàn bộ']);
    sDanhMuc.appendRow(['Trạng thái nợ', 'DMUC-301003', 'Quá hạn', 'Còn nợ và đã vượt quá hạn thanh toán']);
  }

  // 5. DB_CaiDat: [Khóa, Giá Trị, Diễn Giải]
  var sCaiDat = getOrCreateSheet(ss, SHEETS.CAI_DAT);
  if (sCaiDat.getLastRow() === 0) {
    sCaiDat.appendRow(['Khóa', 'Giá Trị', 'Diễn Giải']);
    formatHeaderRow(sCaiDat);
    sCaiDat.appendRow(['TEN_DON_VI', 'CÔNG TY TNHH FILE ĐI LÀM VIỆT NAM', 'Tên doanh nghiệp / Đơn vị kinh doanh']);
    sCaiDat.appendRow(['DIA_CHI', 'Tòa nhà Innovation Hub, Quận 1, TP.HCM', 'Địa chỉ trụ sở chính']);
    sCaiDat.appendRow(['SO_DIEN_THOAI', '0901234567', 'Hotline liên hệ']);
    sCaiDat.appendRow(['EMAIL', 'contact@filedilam.com', 'Hòm thư điện tử liên hệ']);
    sCaiDat.appendRow(['NGAN_HANG', 'Vietcombank', 'Ngân hàng nhận thanh toán']);
    sCaiDat.appendRow(['STK', '9901234567', 'Số tài khoản nhận chuyển khoản']);
    sCaiDat.appendRow(['CHU_TAI_KHOAN', 'CONG TY TNHH FILE DI LAM', 'Tên chủ tài khoản ngân hàng']);
    sCaiDat.appendRow([
      'MAU_NHAC_NO_ZALO',
      'Kính gửi {TEN_DOI_TAC}, Doanh nghiệp {TEN_DON_VI} xin gửi thông báo công nợ đến ngày {NGAY_HIEN_TAI}: Tổng dư nợ còn lại là {CON_LAI} đ. Hạn thanh toán: {HAN_THANH_TOAN}. Vui lòng chuyển khoản về STK {STK} ({NGAN_HANG}) - CTK {CHU_TAI_KHOAN}. Xin chân thành cảm ơn Quý đối tác!',
      'Mẫu tin nhắn nhắc nợ sao chép gửi Zalo/SMS'
    ]);
  }

  // 6. HDSD: Sheet Hướng dẫn duy nhất hiển thị (Nút Mint B2:D3)
  var sHDSD = getOrCreateSheet(ss, SHEETS.HDSD);
  sHDSD.clear();
  sHDSD.setTabColor('#059669');

  // Nút hành động chính B2:D3
  var heroButton = sHDSD.getRange('B2:D3');
  heroButton.merge()
    .setValue('MỞ ỨNG DỤNG QUẢN LÝ CÔNG NỢ')
    .setBackground('#059669')
    .setFontColor('#ffffff')
    .setFontSize(13)
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');

  // Tiêu đề hướng dẫn
  sHDSD.getRange('B5').setValue('HƯỚNG DẪN 3 BƯỚC BẮT ĐẦU:')
    .setFontWeight('bold')
    .setFontColor('#0f172a')
    .setFontSize(11);

  sHDSD.getRange('B6').setValue('Bước 1: Bấm vào thanh menu trên cùng "File Đi Làm" -> "Mở Ứng Dụng Công Nợ" (hoặc mở trực tiếp link Web App đã triển khai).')
    .setFontColor('#334155');
  sHDSD.getRange('B7').setValue('Bước 2: Cấp quyền truy cập Google Account trong lần mở đầu tiên (chỉ cần thực hiện 1 lần duy nhất).')
    .setFontColor('#334155');
  sHDSD.getRange('B8').setValue('Bước 3: Nhập liệu Đối tác, Ghi nhận Hóa đơn và Phiếu thanh toán hoàn toàn trên giao diện Web App chuẩn Mobile-First.')
    .setFontColor('#334155');

  sHDSD.getRange('B10').setValue('LƯU Ý BẢO MẬT DỮ LIỆU:')
    .setFontWeight('bold')
    .setFontColor('#475569')
    .setFontSize(10);
  sHDSD.getRange('B11').setValue('• Toàn bộ các sheet Database (DB_*) đã được tự động khóa và ẩn để đảm bảo toàn vẹn dữ liệu kế toán.')
    .setFontColor('#64748b');
  sHDSD.getRange('B12').setValue('• Không chỉnh sửa công thức trực tiếp trên Google Sheets. Hãy sử dụng Web App để được tự động cấn trừ công nợ.')
    .setFontColor('#64748b');

  // Định dạng kích thước cột cho HDSD đẹp mắt
  sHDSD.setColumnWidth(1, 30);
  sHDSD.setColumnWidth(2, 220);
  sHDSD.setColumnWidth(3, 220);
  sHDSD.setColumnWidth(4, 220);

  // Khóa và ẩn toàn bộ tab DB_* ngay sau khi thiết lập
  lockAndHideDatabaseSheets();

  return {
    success: true,
    message: 'Khởi tạo cấu trúc Database và HDSD thành công! Toàn bộ Database đã được khóa và ẩn.'
  };
}

/**
 * RPC GOM DỮ LIỆU TẬP TRUNG 1 CHẠM (GET INITIAL DATA)
 * Nạp đồng thời tất cả các bảng phục vụ Web App khởi động cực nhanh
 * Chuẩn hóa 2 lớp key: vừa giữ Header gốc tiếng Việt, vừa ánh xạ camelCase để Frontend truy xuất 100% không bao giờ bị rỗng
 */
function getInitialData() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // Tự động kiểm tra nếu các sheet DB chưa có thì tự khởi tạo mẫu luôn
    if (!ss.getSheetByName(SHEETS.DOI_TAC) || !ss.getSheetByName(SHEETS.PHAT_SINH_NO)) {
      setupDatabaseSheets();
    }

    var rawDoiTac = readSheetData(ss, SHEETS.DOI_TAC);
    var rawPhatSinhNo = readSheetData(ss, SHEETS.PHAT_SINH_NO);
    var rawThanhToan = readSheetData(ss, SHEETS.THANH_TOAN);
    var rawDanhMuc = readSheetData(ss, SHEETS.DANH_MUC);
    var rawCaiDatList = readSheetData(ss, SHEETS.CAI_DAT);

    // Chuẩn hóa Đối Tác: hỗ trợ cả maDoiTac/maDT/MaDoiTac và tenDoiTac/tenDT/TenDoiTac
    var doiTacList = rawDoiTac.map(function(item) {
      var ma = item['Mã ĐT'] || item['maDT'] || item['maDoiTac'] || item['MaDoiTac'] || '';
      var ten = item['Tên Đối Tác'] || item['tenDT'] || item['tenDoiTac'] || item['TenDoiTac'] || '';
      var loai = item['Loại'] || item['loaiDT'] || item['loaiDoiTac'] || item['LoaiDoiTac'] || 'Khách hàng';
      var sdt = item['SĐT'] || item['sdt'] || item['SoDienThoai'] || '';
      var email = item['Email'] || item['email'] || '';
      var diaChi = item['Địa Chỉ'] || item['diaChi'] || item['DiaChi'] || '';
      var hanMuc = Number(item['Hạn Mức Tín Dụng'] || item['hanMucTinDung'] || item['HanMucTinDung']) || 0;
      var hanNo = Number(item['Hạn Nợ (Ngày)'] || item['hanNoNgay'] || item['HanNoNgay']) || 30;
      var ghiChu = item['Ghi Chú'] || item['ghiChu'] || '';
      var trangThai = item['Trạng Thái'] || item['trangThai'] || 'Đang giao dịch';
      var ngayTao = item['Ngày Tạo'] || item['ngayTao'] || '';

      return {
        // CamelCase & Alias
        maDT: ma,
        maDoiTac: ma,
        MaDoiTac: ma,
        tenDT: ten,
        tenDoiTac: ten,
        TenDoiTac: ten,
        loaiDT: loai,
        loaiDoiTac: loai,
        LoaiDoiTac: loai,
        sdt: sdt,
        SoDienThoai: sdt,
        email: email,
        Email: email,
        diaChi: diaChi,
        DiaChi: diaChi,
        hanMucTinDung: hanMuc,
        HanMucTinDung: hanMuc,
        hanNoNgay: hanNo,
        HanNoNgay: hanNo,
        ghiChu: ghiChu,
        trangThai: trangThai,
        ngayTao: ngayTao,
        // Header tiếng Việt gốc
        'Mã ĐT': ma,
        'Tên Đối Tác': ten,
        'Loại': loai,
        'SĐT': sdt,
        'Địa Chỉ': diaChi,
        'Hạn Mức Tín Dụng': hanMuc,
        'Hạn Nợ (Ngày)': hanNo,
        'Ghi Chú': ghiChu,
        'Trạng Thái': trangThai,
        'Ngày Tạo': ngayTao
      };
    });

    // Chuẩn hóa Phát Sinh Nợ (Hóa đơn)
    var phatSinhList = rawPhatSinhNo.map(function(item) {
      var maGD = item['Mã GD'] || item['maPhatSinh'] || item['maHD'] || item['MaHoaDon'] || '';
      var maDT = item['Mã ĐT'] || item['maDT'] || item['maDoiTac'] || item['MaDoiTac'] || '';
      var tenDT = item['Tên ĐT'] || item['tenDT'] || item['tenDoiTac'] || item['TenDoiTac'] || '';
      var loaiGD = item['Loại GD'] || item['loaiGiaoDich'] || item['loai'] || item['Loai'] || 'Bán hàng';
      var soTien = Number(item['Số Tiền'] || item['soTien'] || item['SoTien'] || item['SoTienGoc']) || 0;
      var daTra = Number(item['Đã Thanh Toán'] || item['daTra'] || item['DaTra'] || item['DaThanhToan']) || 0;
      var conLai = Number(item['Còn Lại'] || item['conLai'] || item['conNo'] || item['ConNo']) || (soTien - daTra);
      var hanTT = item['Hạn Thanh Toán'] || item['hanThanhToan'] || item['HanThanhToan'] || '';
      var ngayCT = item['Ngày Chứng Từ'] || item['ngayChungTu'] || item['ngay'] || item['Ngay'] || '';
      var soHD = item['Số Hóa Đơn'] || item['soHoaDon'] || item['soHD'] || '';
      var ghiChu = item['Ghi Chú'] || item['ghiChu'] || '';
      var trangThai = item['Trạng Thái'] || item['trangThai'] || (conLai <= 0 ? 'Đã tất toán' : 'Còn nợ');

      return {
        maGD: maGD,
        maPhatSinh: maGD,
        maHD: maGD,
        MaHoaDon: maGD,
        MaHD: maGD,
        maDT: maDT,
        maDoiTac: maDT,
        MaDoiTac: maDT,
        tenDT: tenDT,
        tenDoiTac: tenDT,
        TenDoiTac: tenDT,
        loaiGD: loaiGD,
        loaiGiaoDich: loaiGD,
        loai: loaiGD,
        Loai: loaiGD,
        soTien: soTien,
        SoTien: soTien,
        SoTienGoc: soTien,
        daTra: daTra,
        DaTra: daTra,
        daThanhToan: daTra,
        conLai: conLai,
        conNo: conLai,
        ConNo: conLai,
        hanThanhToan: hanTT,
        HanThanhToan: hanTT,
        ngayChungTu: ngayCT,
        ngay: ngayCT,
        Ngay: ngayCT,
        soHoaDon: soHD,
        ghiChu: ghiChu,
        trangThai: trangThai,
        // Header tiếng Việt gốc
        'Mã GD': maGD,
        'Mã ĐT': maDT,
        'Tên ĐT': tenDT,
        'Loại GD': loaiGD,
        'Số Tiền': soTien,
        'Đã Thanh Toán': daTra,
        'Còn Lại': conLai,
        'Hạn Thanh Toán': hanTT,
        'Ngày Chứng Từ': ngayCT,
        'Số Hóa Đơn': soHD,
        'Ghi Chú': ghiChu,
        'Trạng Thái': trangThai
      };
    });

    // Chuẩn hóa Thanh Toán
    var thanhToanList = rawThanhToan.map(function(item) {
      var maTT = item['Mã TT'] || item['maThanhToan'] || item['MaThanhToan'] || '';
      var maGD = item['Mã GD'] || item['maPhatSinh'] || item['maHD'] || item['MaHoaDon'] || '';
      var maDT = item['Mã ĐT'] || item['maDT'] || item['maDoiTac'] || item['MaDoiTac'] || '';
      var tenDT = item['Tên ĐT'] || item['tenDT'] || item['tenDoiTac'] || item['TenDoiTac'] || '';
      var loaiTT = item['Loại TT'] || item['loaiThanhToan'] || item['loai'] || item['Loai'] || 'Thu nợ';
      var soTien = Number(item['Số Tiền'] || item['soTien'] || item['SoTien']) || 0;
      var phuongThuc = item['Phương Thức'] || item['phuongThuc'] || item['hinhThuc'] || item['PhuongThuc'] || 'Chuyển khoản VietQR';
      var ngayTT = item['Ngày TT'] || item['ngayThanhToan'] || item['ngay'] || item['Ngay'] || '';
      var ghiChu = item['Ghi Chú'] || item['ghiChu'] || '';
      var maThamChieu = item['Mã Tham Chiếu'] || item['maThamChieu'] || '';

      return {
        maTT: maTT,
        maThanhToan: maTT,
        MaThanhToan: maTT,
        maGD: maGD,
        maPhatSinh: maGD,
        maHD: maGD,
        MaHoaDon: maGD,
        MaChungTu: maGD,
        maDT: maDT,
        maDoiTac: maDT,
        MaDoiTac: maDT,
        tenDT: tenDT,
        tenDoiTac: tenDT,
        TenDoiTac: tenDT,
        loaiTT: loaiTT,
        loaiThanhToan: loaiTT,
        loai: loaiTT,
        Loai: loaiTT,
        soTien: soTien,
        SoTien: soTien,
        phuongThuc: phuongThuc,
        PhuongThuc: phuongThuc,
        hinhThuc: phuongThuc,
        ngayTT: ngayTT,
        ngayThanhToan: ngayTT,
        ngay: ngayTT,
        Ngay: ngayTT,
        ghiChu: ghiChu,
        maThamChieu: maThamChieu,
        // Header tiếng Việt gốc
        'Mã TT': maTT,
        'Mã GD': maGD,
        'Mã ĐT': maDT,
        'Tên ĐT': tenDT,
        'Loại TT': loaiTT,
        'Số Tiền': soTien,
        'Phương Thức': phuongThuc,
        'Ngày TT': ngayTT,
        'Ghi Chú': ghiChu,
        'Mã Tham Chiếu': maThamChieu
      };
    });

    // Chuẩn hóa Danh Mục: hỗ trợ đầy đủ tiếng Việt và camelCase
    var danhMucList = rawDanhMuc.map(function(item) {
      var nhom = item['Nhóm'] || item['Nhom'] || item['nhom'] || item['loai'] || item['LoaiDanhMuc'] || 'Chung';
      var ma = item['Mã'] || item['Ma'] || item['ma'] || item['maDanhMuc'] || '';
      var ten = item['Tên'] || item['Ten'] || item['ten'] || item['giaTri'] || item['TenDanhMuc'] || '';
      var ghiChu = item['Ghi Chú'] || item['GhiChu'] || item['ghiChu'] || '';

      var loaiAlias = nhom;
      if (nhom === 'HinhThucThanhToan') loaiAlias = 'HINH_THUC_TT';
      else if (nhom === 'LoaiDoiTac') loaiAlias = 'LOAI_DOI_TAC';
      else if (nhom === 'TrangThaiNo') loaiAlias = 'TRANG_THAI_NO';

      return {
        nhom: nhom,
        Nhom: nhom,
        'Nhóm': nhom,
        ma: ma,
        Ma: ma,
        'Mã': ma,
        maDanhMuc: ma,
        ten: ten,
        Ten: ten,
        'Tên': ten,
        giaTri: ten,
        TenDanhMuc: ten,
        ghiChu: ghiChu,
        GhiChu: ghiChu,
        'Ghi Chú': ghiChu,
        loai: loaiAlias,
        LoaiDanhMuc: loaiAlias
      };
    });

    // Chuẩn hóa cài đặt thành key-value object
    var caiDatObj = {};
    for (var i = 0; i < rawCaiDatList.length; i++) {
      var cItem = rawCaiDatList[i];
      var key = cItem['Khóa'] || cItem['Khoa'] || cItem['Key'];
      var val = cItem['Giá Trị'] || cItem['Gia Tri'] || cItem['Value'];
      if (key) {
        caiDatObj[key] = val;
      }
    }

    // Bổ sung các key alias cho Cài đặt
    caiDatObj.tenDoanhNghiep = caiDatObj['TEN_DON_VI'] || caiDatObj['tenCoSo'] || 'CÔNG TY TNHH FILE ĐI LÀM';
    caiDatObj.diaChi = caiDatObj['DIA_CHI'] || '';
    caiDatObj.hotline = caiDatObj['SO_DIEN_THOAI'] || '';
    caiDatObj.email = caiDatObj['EMAIL'] || '';
    caiDatObj.nganHang = caiDatObj['NGAN_HANG'] || 'Vietcombank';
    caiDatObj.soTaiKhoan = caiDatObj['STK'] || '';
    caiDatObj.chuTaiKhoan = caiDatObj['CHU_TAI_KHOAN'] || '';
    caiDatObj.mauNhacNoZalo = caiDatObj['MAU_NHAC_NO_ZALO'] || '';

    return {
      success: true,
      data: {
        doiTac: doiTacList,
        phatSinhNo: phatSinhList,
        thanhToan: thanhToanList,
        danhMuc: danhMucList,
        caiDat: caiDatObj
      }
    };
  } catch (err) {
    return {
      success: false,
      error: err.toString()
    };
  }
}

/**
 * API LƯU ĐỐI TÁC (Thêm mới / Cập nhật - Bọc LockService)
 * Mã tự sinh: KHNG-XXXXXX (Khách hàng) hoặc NCCP-XXXXXX (Nhà cung cấp)
 */
function saveDoiTac(payload) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = getOrCreateSheet(ss, SHEETS.DOI_TAC);
    var data = sheet.getDataRange().getValues();

    var isNew = !payload.maDT && !payload['Mã ĐT'];
    var loai = payload.loai || payload['Loại'] || 'Khách hàng';
    var prefix = loai === 'Nhà cung cấp' ? 'NCCP' : 'KHNG';
    var maDT = (payload.maDT || payload['Mã ĐT']) ? (payload.maDT || payload['Mã ĐT']) : generateId(prefix);
    
    var rowIndex = -1;
    if (!isNew) {
      for (var r = 1; r < data.length; r++) {
        if (data[r][0] === maDT) {
          rowIndex = r + 1;
          break;
        }
      }
    }

    var rowData = [
      maDT,
      loai,
      payload.tenDoiTac || payload['Tên Đối Tác'] || '',
      payload.sdt || payload['SĐT'] || '',
      payload.email || payload['Email'] || '',
      payload.diaChi || payload['Địa Chỉ'] || '',
      Number(payload.hanMucTinDung || payload['Hạn Mức Tín Dụng']) || 0,
      Number(payload.hanNoNgay || payload['Hạn Nợ (Ngày)']) || 30,
      payload.ghiChu || payload['Ghi Chú'] || '',
      payload.trangThai || payload['Trạng Thái'] || 'Đang giao dịch',
      payload.ngayTao || payload['Ngày Tạo'] || Utilities.formatDate(new Date(), 'GMT+7', 'dd/MM/yyyy')
    ];

    if (rowIndex > 0) {
      sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
    } else {
      sheet.appendRow(rowData);
    }

    return {
      success: true,
      maDT: maDT,
      message: isNew ? 'Đã thêm mới đối tác thành công!' : 'Đã cập nhật thông tin đối tác!'
    };
  } catch (err) {
    return { success: false, error: err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * API LƯU PHÁT SINH NỢ / HÓA ĐƠN (Thêm mới / Cập nhật - Bọc LockService)
 * Mã tự sinh: HOAD-XXXXXX
 * Tự động tính Còn Lại = Số Tiền - Đã Thanh Toán
 */
function savePhatSinhNo(payload) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = getOrCreateSheet(ss, SHEETS.PHAT_SINH_NO);
    var data = sheet.getDataRange().getValues();

    var isNew = !payload.maGD && !payload['Mã GD'];
    var maGD = (payload.maGD || payload['Mã GD']) ? (payload.maGD || payload['Mã GD']) : generateId('HOAD');
    
    var rowIndex = -1;
    var existingDaThanhToan = 0;
    if (!isNew) {
      for (var r = 1; r < data.length; r++) {
        if (data[r][0] === maGD) {
          rowIndex = r + 1;
          existingDaThanhToan = Number(data[r][5]) || 0;
          break;
        }
      }
    }

    var soTien = Number(payload.soTien || payload['Số Tiền']) || 0;
    var daThanhToan = isNew ? (Number(payload.daThanhToan || payload['Đã Thanh Toán']) || 0) : existingDaThanhToan;
    if (payload.daThanhToan !== undefined && payload.daThanhToan !== null && !isNew) {
      daThanhToan = Number(payload.daThanhToan);
    }
    var conLai = Math.max(0, soTien - daThanhToan);
    var trangThai = conLai === 0 ? 'Đã tất toán' : 'Còn nợ';

    var rowData = [
      maGD,
      payload.maDT || payload['Mã ĐT'] || '',
      payload.tenDT || payload['Tên ĐT'] || '',
      payload.loaiGD || payload['Loại GD'] || 'Bán hàng',
      soTien,
      daThanhToan,
      conLai,
      payload.hanThanhToan || payload['Hạn Thanh Toán'] || '',
      payload.ngayChungTu || payload['Ngày Chứng Từ'] || Utilities.formatDate(new Date(), 'GMT+7', 'dd/MM/yyyy'),
      payload.soHoaDon || payload['Số Hóa Đơn'] || '',
      payload.ghiChu || payload['Ghi Chú'] || '',
      trangThai
    ];

    if (rowIndex > 0) {
      sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
    } else {
      sheet.appendRow(rowData);
    }

    return {
      success: true,
      maGD: maGD,
      conLai: conLai,
      trangThai: trangThai,
      message: 'Đã lưu chứng từ công nợ thành công!'
    };
  } catch (err) {
    return { success: false, error: err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * API GHI NHẬN THANH TOÁN & TỰ ĐỘNG CẤN TRỪ CÔNG NỢ (Bọc LockService)
 * Mã tự sinh: PTHU-XXXXXX (Thu nợ) hoặc PTRA-XXXXXX (Trả nợ)
 * Cập nhật 'Đã Thanh Toán', 'Còn Lại' và 'Trạng Thái' của hóa đơn phát sinh tương ứng
 */
function saveThanhToan(payload) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sThanhToan = getOrCreateSheet(ss, SHEETS.THANH_TOAN);
    var sPhatSinh = getOrCreateSheet(ss, SHEETS.PHAT_SINH_NO);

    var loaiTT = payload.loaiTT || payload['Loại TT'] || 'Thu nợ';
    var prefix = (loaiTT === 'Thu nợ' || loaiTT === 'THU_NO') ? 'PTHU' : 'PTRA';
    var maTT = (payload.maTT || payload['Mã TT']) ? (payload.maTT || payload['Mã TT']) : generateId(prefix);
    var maGD = payload.maGD || payload['Mã GD'] || '';
    var soTienTT = Number(payload.soTien || payload['Số Tiền']) || 0;

    if (soTienTT <= 0) {
      return { success: false, error: 'Số tiền thanh toán phải lớn hơn 0!' };
    }

    // 1. Ghi nhận phiếu thanh toán vào DB_ThanhToan
    var rowData = [
      maTT,
      maGD,
      payload.maDT || payload['Mã ĐT'] || '',
      payload.tenDT || payload['Tên ĐT'] || '',
      loaiTT,
      soTienTT,
      payload.phuongThuc || payload['Phương Thức'] || 'Chuyển khoản VietQR',
      payload.ngayTT || payload['Ngày TT'] || Utilities.formatDate(new Date(), 'GMT+7', 'dd/MM/yyyy'),
      payload.ghiChu || payload['Ghi Chú'] || '',
      payload.maThamChieu || payload['Mã Tham Chiếu'] || ''
    ];
    sThanhToan.appendRow(rowData);

    // 2. Tự động cấn trừ công nợ trong DB_PhatSinhNo nếu có liên kết Mã GD
    var canTruResult = { canTru: false };
    if (maGD) {
      var psData = sPhatSinh.getDataRange().getValues();
      for (var i = 1; i < psData.length; i++) {
        if (psData[i][0] === maGD) {
          var rowNum = i + 1;
          var tongTienGD = Number(psData[i][4]) || 0;
          var daThanhToanHienTai = Number(psData[i][5]) || 0;

          var daThanhToanMoi = daThanhToanHienTai + soTienTT;
          var conLaiMoi = Math.max(0, tongTienGD - daThanhToanMoi);
          var trangThaiMoi = conLaiMoi === 0 ? 'Đã tất toán' : 'Còn nợ';

          // Cập nhật Đã Thanh Toán (cột 6), Còn Lại (cột 7), Trạng Thái (cột 12)
          sPhatSinh.getRange(rowNum, 6).setValue(daThanhToanMoi);
          sPhatSinh.getRange(rowNum, 7).setValue(conLaiMoi);
          sPhatSinh.getRange(rowNum, 12).setValue(trangThaiMoi);

          canTruResult = {
            canTru: true,
            maGD: maGD,
            daThanhToanMoi: daThanhToanMoi,
            conLaiMoi: conLaiMoi,
            trangThaiMoi: trangThaiMoi
          };
          break;
        }
      }
    }

    return {
      success: true,
      maTT: maTT,
      canTru: canTruResult,
      message: 'Đã lập phiếu ' + loaiTT.toLowerCase() + ' và cấn trừ công nợ thành công!'
    };
  } catch (err) {
    return { success: false, error: err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * API LƯU CẤU HÌNH DOANH NGHIỆP & CÀI ĐẶT (Bọc LockService)
 */
function saveCaiDat(settings) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = getOrCreateSheet(ss, SHEETS.CAI_DAT);
    var data = sheet.getDataRange().getValues();

    // Map các dòng hiện có theo Key
    var keyRowMap = {};
    for (var r = 1; r < data.length; r++) {
      var k = data[r][0];
      if (k) keyRowMap[k] = r + 1;
    }

    // Cập nhật hoặc thêm mới từng cài đặt
    for (var key in settings) {
      if (settings.hasOwnProperty(key)) {
        var val = settings[key];
        if (keyRowMap[key]) {
          sheet.getRange(keyRowMap[key], 2).setValue(val);
        } else {
          sheet.appendRow([key, val, 'Cài đặt hệ thống']);
        }
      }
    }

    return { success: true, message: 'Đã lưu cấu hình doanh nghiệp thành công!' };
  } catch (err) {
    return { success: false, error: err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * API XÓA ĐỐI TÁC (Chỉ xóa khi đối tác chưa từng có phát sinh nợ)
 */
function deleteDoiTac(maDT) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sDoiTac = getOrCreateSheet(ss, SHEETS.DOI_TAC);
    var sPhatSinh = getOrCreateSheet(ss, SHEETS.PHAT_SINH_NO);

    // Kiểm tra xem đối tác đã có phát sinh nợ chưa
    var psData = sPhatSinh.getDataRange().getValues();
    for (var i = 1; i < psData.length; i++) {
      if (psData[i][1] === maDT) {
        return {
          success: false,
          error: 'Không thể xóa đối tác đã có giao dịch công nợ phát sinh (' + psData[i][0] + ')!'
        };
      }
    }

    // Tiến hành xóa đối tác
    var dtData = sDoiTac.getDataRange().getValues();
    var deleted = false;
    for (var r = 1; r < dtData.length; r++) {
      if (dtData[r][0] === maDT) {
        sDoiTac.deleteRow(r + 1);
        deleted = true;
        break;
      }
    }

    if (deleted) {
      return { success: true, message: 'Đã xóa đối tác thành công!' };
    } else {
      return { success: false, error: 'Không tìm thấy mã đối tác: ' + maDT };
    }
  } catch (err) {
    return { success: false, error: err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * API XÓA HÓA ĐƠN PHÁT SINH CÔNG NỢ
 * Xóa kèm theo kiểm tra và cảnh báo nếu đã có thanh toán liên kết
 */
function deletePhatSinhNo(maGD) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sPhatSinh = getOrCreateSheet(ss, SHEETS.PHAT_SINH_NO);
    var sThanhToan = getOrCreateSheet(ss, SHEETS.THANH_TOAN);

    // Kiểm tra xem hóa đơn đã có phiếu thanh toán nào chưa
    var ttData = sThanhToan.getDataRange().getValues();
    for (var t = 1; t < ttData.length; t++) {
      if (ttData[t][1] === maGD) {
        return {
          success: false,
          error: 'Không thể xóa hóa đơn đã có phiếu thanh toán liên kết (' + ttData[t][0] + ')! Vui lòng hủy các phiếu thanh toán trước.'
        };
      }
    }

    // Tiến hành xóa dòng phát sinh nợ
    var psData = sPhatSinh.getDataRange().getValues();
    var deleted = false;
    for (var r = 1; r < psData.length; r++) {
      if (psData[r][0] === maGD) {
        sPhatSinh.deleteRow(r + 1);
        deleted = true;
        break;
      }
    }

    if (deleted) {
      return { success: true, message: 'Đã xóa chứng từ công nợ thành công!' };
    } else {
      return { success: false, error: 'Không tìm thấy mã chứng từ: ' + maGD };
    }
  } catch (err) {
    return { success: false, error: err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * API XÓA PHIẾU THANH TOÁN & KHÔI PHỤC CÔNG NỢ HÓA ĐƠN (Bọc LockService)
 * Tìm dòng thanh toán qua maTT, lấy số tiền và mã hóa đơn liên kết (maGD)
 * Xóa dòng thanh toán trong DB_ThanhToan
 * Khôi phục lại Đã Thanh Toán và Còn Lại trên DB_PhatSinhNo, cập nhật Trạng Thái 'Còn nợ'
 * Trả về getInitialData() để client cập nhật đồng bộ tức thì
 */
function deleteThanhToan(maTT) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sThanhToan = getOrCreateSheet(ss, SHEETS.THANH_TOAN);
    var sPhatSinh = getOrCreateSheet(ss, SHEETS.PHAT_SINH_NO);

    var ttData = sThanhToan.getDataRange().getValues();
    var targetRow = -1;
    var maGD = '';
    var soTienTT = 0;

    for (var r = 1; r < ttData.length; r++) {
      if (ttData[r][0] === maTT) {
        targetRow = r + 1;
        maGD = ttData[r][1];
        soTienTT = Number(ttData[r][5]) || 0;
        break;
      }
    }

    if (targetRow <= 0) {
      return { success: false, error: 'Không tìm thấy phiếu thanh toán: ' + maTT };
    }

    // Xóa phiếu thanh toán
    sThanhToan.deleteRow(targetRow);

    // Khôi phục công nợ trên hóa đơn liên kết nếu có
    if (maGD) {
      var psData = sPhatSinh.getDataRange().getValues();
      for (var p = 1; p < psData.length; p++) {
        if (psData[p][0] === maGD) {
          var psRowNum = p + 1;
          var tongTienGD = Number(psData[p][4]) || 0;
          var daThanhToanHienTai = Number(psData[p][5]) || 0;

          var daThanhToanMoi = Math.max(0, daThanhToanHienTai - soTienTT);
          var conLaiMoi = Math.max(0, tongTienGD - daThanhToanMoi);
          var trangThaiMoi = conLaiMoi === 0 ? 'Đã tất toán' : 'Còn nợ';

          // Cột 6: Đã Thanh Toán, Cột 7: Còn Lại, Cột 12: Trạng Thái
          sPhatSinh.getRange(psRowNum, 6).setValue(daThanhToanMoi);
          sPhatSinh.getRange(psRowNum, 7).setValue(conLaiMoi);
          sPhatSinh.getRange(psRowNum, 12).setValue(trangThaiMoi);
          break;
        }
      }
    }

    // Trả về dữ liệu mới nhất
    return getInitialData();
  } catch (err) {
    return { success: false, error: err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * API LƯU DANH MỤC HỆ THỐNG (Bọc LockService)
 * [Nhóm, Mã, Tên, Ghi Chú]
 */
function saveDanhMuc(payload) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sDanhMuc = getOrCreateSheet(ss, SHEETS.DANH_MUC);
    var data = sDanhMuc.getDataRange().getValues();

    var nhom = payload.nhom || payload.Nhom || payload['Nhóm'] || 'Chung';
    var ma = payload.ma || payload.Ma || payload['Mã'] || generateId('DMUC');
    var ten = payload.ten || payload.Ten || payload['Tên'] || '';
    var ghiChu = payload.ghiChu || payload.GhiChu || payload['Ghi Chú'] || '';

    var targetRow = -1;
    for (var r = 1; r < data.length; r++) {
      if (data[r][1] === ma) {
        targetRow = r + 1;
        break;
      }
    }

    var rowData = [nhom, ma, ten, ghiChu];
    if (targetRow > 0) {
      sDanhMuc.getRange(targetRow, 1, 1, 4).setValues([rowData]);
    } else {
      sDanhMuc.appendRow(rowData);
    }

    return {
      success: true,
      message: 'Đã lưu danh mục thành công!',
      data: { nhom: nhom, ma: ma, ten: ten, ghiChu: ghiChu }
    };
  } catch (err) {
    return { success: false, error: err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * CÁC HÀM TIỆN ÍCH HỖ TRỢ (HELPER FUNCTIONS)
 */
function getOrCreateSheet(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  return sheet;
}

function formatHeaderRow(sheet) {
  var header = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  header.setBackground('#0f172a') // Slate-900 sang trọng
        .setFontColor('#ffffff')
        .setFontWeight('bold')
        .setVerticalAlignment('middle');
  sheet.setFrozenRows(1);
}

function readSheetData(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var rows = [];
  for (var r = 1; r < values.length; r++) {
    var obj = {};
    for (var c = 0; c < headers.length; c++) {
      var val = values[r][c];
      if (val instanceof Date) {
        val = Utilities.formatDate(val, 'GMT+7', 'dd/MM/yyyy');
      }
      obj[headers[c]] = val;
    }
    rows.push(obj);
  }
  return rows;
}
