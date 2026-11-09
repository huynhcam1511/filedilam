/**
 * QUẢN LÝ TÀI SẢN & THIẾT BỊ DOANH NGHIỆP v1.0 — FILE ĐI LÀM
 * Backend Engine & Google Sheets RPC Handlers
 * Chuẩn tuân thủ: AGENTS_MASTER.md V2.2
 */

// 1. HẰNG SỐ CẤU HÌNH HỆ THỐNG
var WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbz_YOUR_DEPLOYMENT_ID/exec';
var APP_TITLE = 'Quản Lý Tài Sản & Thiết Bị — FILE ĐI LÀM';

// Tên các tab Database chuẩn
var SHEETS = {
  TAI_SAN: 'DB_TaiSan',
  NHAN_SU: 'DB_NhanSu',
  GIAO_DICH: 'DB_GiaoDich',
  BAO_TRI: 'DB_BaoTri',
  DANH_MUC: 'DB_DanhMuc',
  CAI_DAT: 'DB_CaiDat',
  HDSD: 'HDSD'
};

/**
 * Khởi tạo Menu trên Google Sheet khi mở file
 */

/**
 * QUY TẮC SINGLE VISIBLE TAB: Khóa và Ẩn toàn bộ tab DB_, chỉ để lại tab HDSD hiển thị
 */
function lockAndHideDatabaseSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  sheets.forEach(function(sh) {
    var name = sh.getName();
    if (name.indexOf('DB_') === 0) {
      sh.hideSheet(); // Ẩn tab DB_
      var protection = sh.protect().setDescription('Khóa bảo vệ Database FILE ĐI LÀM');
      protection.setWarningOnly(true);
    } else if (name === 'HDSD') {
      sh.showSheet(); // Luôn hiển thị duy nhất tab HDSD
      ss.setActiveSheet(sh);
    }
  });
}

function onOpen() {
  // Tự động đồng bộ tên File Google Sheet theo hằng số APP_TITLE
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var currentName = ss.getName();
    if (currentName !== APP_TITLE && !currentName.startsWith('Bản sao của')) {
      ss.rename(APP_TITLE);
    }
  } catch (e) {
    // Bỏ qua nếu không đủ quyền đổi tên
  }

  SpreadsheetApp.getUi()
    .createMenu('File Đi Làm')
    .addItem('Mở Ứng Dụng Quản Lý', 'openWebApp')
    .addSeparator()
    .addItem('Khởi tạo / Cập nhật cấu trúc Sheet', 'setupDatabaseSheets')
    .addItem('Khóa & Ẩn Database (Bảo vệ dữ liệu)', 'lockAndHideDatabaseSheets')
    .addToUi();
}

/**
 * Mở Web App trực tiếp từ Sheet
 */
function openWebApp() {
  var html = HtmlService.createHtmlOutput(
    '<script>window.open("' + WEB_APP_URL + '", "_blank");google.script.host.close();</script>'
  ).setWidth(320).setHeight(90);
  SpreadsheetApp.getUi().showModalDialog(html, 'Đang mở ứng dụng Web App...');
}

/**
 * Điểm vào Web App chính
 */
function doGet(e) {
  var template = HtmlService.createTemplateFromFile('TAISAN_Index');
  return template.evaluate()
    .setTitle(APP_TITLE)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Tự động tạo và chuẩn hóa cấu trúc 6 tab Database & 1 tab HDSD
 */
function setupDatabaseSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. DB_TaiSan
  var sTaiSan = getOrCreateSheet(ss, SHEETS.TAI_SAN);
  if (sTaiSan.getLastRow() === 0) {
    sTaiSan.appendRow([
      'MaTaiSan', 'TenTaiSan', 'MaNhom', 'SoSerial', 'PhongBan', 
      'MaNguoiGiu', 'NguoiGiu', 'NguyenGia', 'NgayMua', 'HanBaoHanh', 'TrangThai', 'GhiChu'
    ]);
    formatHeaderRow(sTaiSan);
    // Dữ liệu mẫu ban đầu
    sTaiSan.appendRow(['TSAN-102938', 'MacBook Pro 14 M3 Pro', 'IT', 'C02G901KMD6R', 'Kỹ thuật', 'NHAN-839201', 'Nguyễn Văn An', 45000000, '15/01/2026', '15/01/2027', 'DANG_DUNG', 'Máy kèm sạc zin']);
    sTaiSan.appendRow(['TSAN-294819', 'Màn hình Dell UltraSharp 27', 'IT', 'CN-0K7910-742', 'Thiết kế', 'NHAN-910283', 'Trần Thị Mai', 12500000, '20/02/2026', '20/02/2029', 'DANG_DUNG', 'Cáp Type-C']);
    sTaiSan.appendRow(['TSAN-394821', 'Máy in Canon LBP 2900', 'TBVP', 'KMYB-91823', 'Hành chính', '', '', 4200000, '05/03/2026', '05/03/2027', 'TRONG_KHO', 'Sẵn sàng cấp phát']);
    sTaiSan.appendRow(['TSAN-482910', 'Xe máy Honda Wave Alpha', 'XE', '59S3-819.20', 'Giao vận', '', '', 19000000, '10/01/2026', '10/01/2028', 'DANG_SUA', 'Đang bảo dưỡng định kỳ']);
  }

  // 2. DB_NhanSu
  var sNhanSu = getOrCreateSheet(ss, SHEETS.NHAN_SU);
  if (sNhanSu.getLastRow() === 0) {
    sNhanSu.appendRow(['MaNhanSu', 'HoTen', 'SoDienThoai', 'Email', 'PhongBan', 'ChucVu', 'TrangThai']);
    formatHeaderRow(sNhanSu);
    sNhanSu.appendRow(['NHAN-839201', 'Nguyễn Văn An', '0901234567', 'an.nguyen@congty.com', 'Kỹ thuật', 'Lập trình viên', 'DANG_LAM']);
    sNhanSu.appendRow(['NHAN-910283', 'Trần Thị Mai', '0912345678', 'mai.tran@congty.com', 'Thiết kế', 'UI/UX Designer', 'DANG_LAM']);
    sNhanSu.appendRow(['NHAN-748291', 'Lê Hoàng Nam', '0987654321', 'nam.le@congty.com', 'Hành chính', 'Chuyên viên Nhân sự', 'DANG_LAM']);
  }

  // 3. DB_GiaoDich (Cấp phát & Thu hồi)
  var sGiaoDich = getOrCreateSheet(ss, SHEETS.GIAO_DICH);
  if (sGiaoDich.getLastRow() === 0) {
    sGiaoDich.appendRow(['MaGiaoDich', 'LoaiGiaoDich', 'MaTaiSan', 'TenTaiSan', 'MaNhanSu', 'TenNhanSu', 'NgayGiaoDich', 'TinhTrang', 'NguoiThucHien', 'GhiChu']);
    formatHeaderRow(sGiaoDich);
    sGiaoDich.appendRow(['BGIA-582910', 'CAP_PHAT', 'TSAN-102938', 'MacBook Pro 14 M3 Pro', 'NHAN-839201', 'Nguyễn Văn An', '15/01/2026', 'Mới 100%', 'Admin', 'Cấp phát nhận việc']);
    sGiaoDich.appendRow(['BGIA-691823', 'CAP_PHAT', 'TSAN-294819', 'Màn hình Dell UltraSharp 27', 'NHAN-910283', 'Trần Thị Mai', '20/02/2026', 'Mới 100%', 'Admin', 'Bàn giao thiết bị làm việc']);
  }

  // 4. DB_BaoTri
  var sBaoTri = getOrCreateSheet(ss, SHEETS.BAO_TRI);
  if (sBaoTri.getLastRow() === 0) {
    sBaoTri.appendRow(['MaBaoTri', 'MaTaiSan', 'TenTaiSan', 'NgayYeuCau', 'NoiDung', 'ChiPhi', 'DonViSua', 'NgayHoanThanh', 'TrangThai']);
    formatHeaderRow(sBaoTri);
    sBaoTri.appendRow(['BTRI-749102', 'TSAN-482910', 'Xe máy Honda Wave Alpha', '02/11/2026', 'Thay nhớt, bảo dưỡng phanh trước', 350000, 'Head Honda Phát Tiến', '', 'DANG_SUA']);
  }

  // 5. DB_DanhMuc
  var sDanhMuc = getOrCreateSheet(ss, SHEETS.DANH_MUC);
  if (sDanhMuc.getLastRow() === 0) {
    sDanhMuc.appendRow(['LoaiDanhMuc', 'MaDanhMuc', 'TenDanhMuc', 'GhiChu']);
    formatHeaderRow(sDanhMuc);
    sDanhMuc.appendRow(['NHOM_TAI_SAN', 'IT', 'Thiết bị Công nghệ & Máy tính', 'Laptop, PC, Màn hình']);
    sDanhMuc.appendRow(['NHOM_TAI_SAN', 'TBVP', 'Thiết bị Văn phòng', 'Máy in, Máy chiếu, Bàn ghế']);
    sDanhMuc.appendRow(['NHOM_TAI_SAN', 'XE', 'Phương tiện Đi lại & Vận chuyển', 'Xe máy, Xe tải']);
    sDanhMuc.appendRow(['PHONG_BAN', 'PB_KT', 'Kỹ thuật', 'Phòng Công nghệ & IT']);
    sDanhMuc.appendRow(['PHONG_BAN', 'PB_TK', 'Thiết kế', 'Phòng Sáng tạo & Media']);
    sDanhMuc.appendRow(['PHONG_BAN', 'PB_HC', 'Hành chính', 'Phòng Hành chính Nhân sự']);
    sDanhMuc.appendRow(['PHONG_BAN', 'PB_GV', 'Giao vận', 'Đội xe & Kho vận']);
  }

  // 6. DB_CaiDat
  var sCaiDat = getOrCreateSheet(ss, SHEETS.CAI_DAT);
  if (sCaiDat.getLastRow() === 0) {
    sCaiDat.appendRow(['Key', 'Value']);
    formatHeaderRow(sCaiDat);
    sCaiDat.appendRow(['TenDoanhNghiep', 'CÔNG TY TNHH FILE ĐI LÀM VIỆT NAM']);
    sCaiDat.appendRow(['Hotline', '0901 234 567']);
    sCaiDat.appendRow(['DiaChi', 'Tòa nhà Innovation Hub, Quận 1, TP.HCM']);
    sCaiDat.appendRow(['EmailLienHe', 'support@filedilam.com']);
  }

  // 7. HDSD (Nút Mint B2:D3)
  var sHDSD = getOrCreateSheet(ss, SHEETS.HDSD);
  if (sHDSD.getLastRow() === 0) {
    sHDSD.getRange('B2:D3').merge()
      .setValue('MỞ ỨNG DỤNG WEB APP (BẤM VÀO ĐÂY)')
      .setBackground('#059669')
      .setFontColor('#ffffff')
      .setFontWeight('bold')
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle');
    sHDSD.getRange('B5').setValue('HƯỚNG DẪN BẮT ĐẦU:');
    sHDSD.getRange('B6').setValue('1. Bấm vào nút màu xanh ở trên để mở Web App quản lý.');
    sHDSD.getRange('B7').setValue('2. Cấp quyền truy cập Google Account trong lần đầu tiên mở ứng dụng.');
    sHDSD.getRange('B8').setValue('3. Mọi thắc mắc kỹ thuật vui lòng liên hệ Zalo FILE ĐI LÀM.');
  }

  lockAndHideDatabaseSheets();
  return { success: true, message: 'Đã khởi tạo, khóa & ẩn toàn bộ Database, chỉ giữ hiển thị tab HDSD!' };
}

/**
 * RPC GOM DỮ LIỆU TẬP TRUNG 1 CHẠM (GET INITIAL DATA)
 */
function getInitialData() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    var rawTaiSan = readSheetData(ss, SHEETS.TAI_SAN);
    var rawNhanSu = readSheetData(ss, SHEETS.NHAN_SU);
    var rawGiaoDich = readSheetData(ss, SHEETS.GIAO_DICH);
    var rawBaoTri = readSheetData(ss, SHEETS.BAO_TRI);
    var rawDanhMuc = readSheetData(ss, SHEETS.DANH_MUC);
    var rawCaiDatList = readSheetData(ss, SHEETS.CAI_DAT);

    // Chuyển CaiDat thành key-value object
    var caiDatObj = {};
    for (var i = 0; i < rawCaiDatList.length; i++) {
      if (rawCaiDatList[i].Key) {
        caiDatObj[rawCaiDatList[i].Key] = rawCaiDatList[i].Value;
      }
    }

    return {
      success: true,
      data: {
        taiSan: rawTaiSan,
        nhanSu: rawNhanSu,
        giaoDich: rawGiaoDich,
        baoTri: rawBaoTri,
        danhMuc: rawDanhMuc,
        caiDat: caiDatObj
      }
    };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * API LƯU TÀI SẢN (Thêm mới / Cập nhật - Bọc LockService)
 */
function saveTaiSan(payload) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = getOrCreateSheet(ss, SHEETS.TAI_SAN);
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    
    var isNew = !payload.MaTaiSan;
    var maTS = payload.MaTaiSan || ('TSAN-' + Math.floor(100000 + Math.random() * 900000));
    var rowIndex = -1;

    if (!isNew) {
      for (var r = 1; r < data.length; r++) {
        if (data[r][0] === maTS) {
          rowIndex = r + 1;
          break;
        }
      }
    }

    var rowData = [
      maTS,
      payload.TenTaiSan || '',
      payload.MaNhom || 'IT',
      payload.SoSerial || '',
      payload.PhongBan || '',
      payload.MaNguoiGiu || '',
      payload.NguoiGiu || '',
      Number(payload.NguyenGia) || 0,
      payload.NgayMua || '',
      payload.HanBaoHanh || '',
      payload.TrangThai || 'TRONG_KHO',
      payload.GhiChu || ''
    ];

    if (rowIndex > 0) {
      sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
    } else {
      sheet.appendRow(rowData);
    }

    return { success: true, maTaiSan: maTS, message: 'Đã lưu thông tin tài sản thành công!' };
  } catch (err) {
    return { success: false, error: err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * API LƯU GIAO DỊCH BÀN GIAO / THU HỒI
 */
function saveGiaoDich(payload) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sGiaoDich = getOrCreateSheet(ss, SHEETS.GIAO_DICH);
    var sTaiSan = getOrCreateSheet(ss, SHEETS.TAI_SAN);

    var prefix = payload.LoaiGiaoDich === 'CAP_PHAT' ? 'BGIA-' : 'THOI-';
    var maGD = prefix + Math.floor(100000 + Math.random() * 900000);

    // Ghi giao dịch
    sGiaoDich.appendRow([
      maGD,
      payload.LoaiGiaoDich,
      payload.MaTaiSan,
      payload.TenTaiSan,
      payload.MaNhanSu,
      payload.TenNhanSu,
      payload.NgayGiaoDich || Utilities.formatDate(new Date(), 'GMT+7', 'dd/MM/yyyy'),
      payload.TinhTrang || 'Bình thường',
      payload.NguoiThucHien || 'Admin',
      payload.GhiChu || ''
    ]);

    // Cập nhật trạng thái tài sản tương ứng
    var tsData = sTaiSan.getDataRange().getValues();
    for (var i = 1; i < tsData.length; i++) {
      if (tsData[i][0] === payload.MaTaiSan) {
        var rowNum = i + 1;
        if (payload.LoaiGiaoDich === 'CAP_PHAT') {
          sTaiSan.getRange(rowNum, 6).setValue(payload.MaNhanSu); // MaNguoiGiu
          sTaiSan.getRange(rowNum, 7).setValue(payload.TenNhanSu); // NguoiGiu
          sTaiSan.getRange(rowNum, 11).setValue('DANG_DUNG');     // TrangThai
        } else {
          sTaiSan.getRange(rowNum, 6).setValue('');
          sTaiSan.getRange(rowNum, 7).setValue('');
          sTaiSan.getRange(rowNum, 11).setValue('TRONG_KHO');
        }
        break;
      }
    }

    return { success: true, maGiaoDich: maGD, message: 'Đã lập phiếu ' + (payload.LoaiGiaoDich === 'CAP_PHAT' ? 'bàn giao' : 'thu hồi') + ' thành công!' };
  } catch (err) {
    return { success: false, error: err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * HELPER FUNCTIONS
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
  header.setBackground('#0f172a') // Slate-900
        .setFontColor('#ffffff')
        .setFontWeight('bold');
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