/**
 * =========================================================================================
 * DỰ ÁN: QUẢN LÝ CÔNG VIỆC TEAM & TIẾN ĐỘ DỰ ÁN 3.5 — WEB APP — FILE ĐI LÀM
 * =========================================================================================
 * Phiên bản: Master Standard V2.4 (Map-Reduce Pipeline & Single Visible Tab Policy)
 * Thương hiệu: FILE ĐI LÀM (Workbook & Apps Script Web App Architecture)
 * File: _part_backend.gs (Backend Core Logic & RPC API Handlers)
 * =========================================================================================
 */

// --- CẤU HÌNH HỆ THỐNG & CONSTANTS TOÀN CỤC ---
var APP_TITLE = 'QUẢN LÝ CÔNG VIỆC TEAM & TIẾN ĐỘ DỰ ÁN 3.5 — WEB APP — FILE ĐI LÀM';
var APP_VERSION = 'Bản 3.5 (Active)';
var WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyexample/exec';

// Tên các Tab Database chuẩn theo Master Contract
var SHEET_HDSD = 'HDSD';
var SHEET_CONG_VIEC = 'DB_CongViec';
var SHEET_DU_AN = 'DB_DuAn';
var SHEET_NHAN_SU = 'DB_NhanSu';
var SHEET_LICH_LAP = 'DB_LichLapLai';
var SHEET_CHECKLIST = 'DB_ChecklistLap';
var SHEET_DANH_MUC = 'DB_DanhMuc';

// Giữ lại các alias TAB_* để đảm bảo tương thích ngược 100%
var TAB_HDSD = SHEET_HDSD;
var TAB_CONG_VIEC = SHEET_CONG_VIEC;
var TAB_DU_AN = SHEET_DU_AN;
var TAB_NHAN_SU = SHEET_NHAN_SU;
var TAB_LICH_LAP_LAI = SHEET_LICH_LAP;
var TAB_CHECKLIST_LAP = SHEET_CHECKLIST;
var TAB_DANH_MUC = SHEET_DANH_MUC;

var ALL_DB_SHEETS = [
  SHEET_CONG_VIEC,
  SHEET_DU_AN,
  SHEET_NHAN_SU,
  SHEET_LICH_LAP,
  SHEET_CHECKLIST,
  SHEET_DANH_MUC
];

// Header Schema cho từng bảng
var SCHEMA_CONG_VIEC = [
  'Mã Task', 'Tên Nhiệm Vụ', 'Mã Dự Án', 'Tên Dự Án', 'Người Phụ Trách', 
  'Email Nhân Sự', 'Cấp Độ', 'Trọng Số', 'Ngày Bắt Đầu', 'Deadline', 
  'Giờ Deadline', 'Tiến Độ %', 'Trạng Thái', 'Ghi Chú', 'Cập Nhật Cuối'
];

var SCHEMA_DU_AN = [
  'Mã Dự Án', 'Tên Dự Án', 'Phòng Ban', 'Người Quản Lý', 'Mục Tiêu', 
  'Ngày Bắt Đầu', 'Hạn Hoàn Thành', 'Ngân Sách', 'Trạng Thái', 'Tiến Độ Tổng %', 'Ghi Chú'
];

var SCHEMA_NHAN_SU = [
  'Mã Nhân Sự', 'Họ Và Tên', 'Chức Danh', 'Cấp Bậc', 'Phòng Ban', 
  'Số Điện Thoại', 'Google Email', 'Task Đang Làm', 'Task Hoàn Thành', 
  'Tỷ Lệ Đúng Hạn %', 'Hiệu Suất Thời Gian %', 'Trạng Thái'
];

var SCHEMA_LICH_LAP_LAI = [
  'Mã Lịch', 'Tiêu Đề Đầu Việc / Meeting', 'Tần Suất', 'Lịch Cụ Thể', 
  'Giờ Bắt Đầu', 'Giờ Kết Thúc', 'Người Chủ Trì', 'Ghi Chú', 'Trạng Thái'
];

var SCHEMA_CHECKLIST_LAP = [
  'Mã Lịch', 'Nhiệm Vụ / Meeting', 'Mã Nhân Sự', 'Tên Nhân Sự', 
  'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Tỷ Lệ Tuần %', 'Tuần Thứ'
];

var SCHEMA_DANH_MUC = [
  'Nhóm', 'Mã Danh Mục', 'Tên Danh Mục', 'Màu Sắc / Mã CSS', 'Thứ Tự', 'Ghi Chú'
];

/**
 * =========================================================================================
 * 1. KHỞI TẠO MENU THANH CÔNG CỤ & TỰ ĐỘNG ĐỒNG BỘ TÊN SPREADSHEET
 * =========================================================================================
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('File Đi Làm')
    .addItem('Mở Ứng Dụng Quản Lý', 'openWebApp')
    .addSeparator()
    .addItem('Khóa & Ẩn Database (Bảo vệ dữ liệu)', 'lockAndHideDatabaseSheets')
    .addItem('Đồng bộ Deadline sang Google Calendar', 'syncDeadlinesToGoogleCalendar')
    .addItem('Khởi tạo Dữ Liệu Chuẩn', 'setupDatabaseSheets')
    .addToUi();

  // Tự động kiểm tra và đồng bộ tên file Google Sheet khớp với APP_TITLE
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var currentName = ss.getName();
    if (currentName !== APP_TITLE && !currentName.startsWith('Bản sao của')) {
      ss.rename(APP_TITLE);
    }
  } catch (err) {
    Logger.log('Không thể đổi tên Spreadsheet tự động: ' + err.toString());
  }
}

/**
 * Mở Web App trực tiếp qua Dialog nếu chưa mở link /exec
 */
function openWebApp() {
  var html = HtmlService.createHtmlOutput(
    '<div style="font-family:sans-serif;padding:16px;text-align:center;">' +
    '<h3 style="color:#059669;margin-bottom:12px;">FILE ĐI LÀM — QUẢN LÝ TIẾN ĐỘ 3.0</h3>' +
    '<p style="font-size:13px;color:#475569;margin-bottom:20px;">Hệ thống đang mở ứng dụng Web App trên tab mới...</p>' +
    '<a href="' + WEB_APP_URL + '" target="_blank" style="background:#059669;color:#ffffff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;display:inline-block;">Mở Trực Tiếp Ngay</a>' +
    '<script>window.open("' + WEB_APP_URL + '", "_blank");setTimeout(function(){google.script.host.close();}, 1500);</script>' +
    '</div>'
  ).setWidth(380).setHeight(180);
  SpreadsheetApp.getUi().showModalDialog(html, 'Đang mở ứng dụng Web App...');
}

/**
 * =========================================================================================
 * 2. ROUTING WEB APP VỚI DOGET() & IFRAME ALLOWALL
 * =========================================================================================
 */
function doGet(e) {
  var template;
  try {
    template = HtmlService.createTemplateFromFile('QuanLyCongViecTeam_Index');
  } catch (err) {
    try {
      template = HtmlService.createTemplateFromFile('Index');
    } catch (err2) {
      template = HtmlService.createTemplateFromFile('_part_shell');
    }
  }
  var output = template.evaluate()
    .setTitle(APP_TITLE)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  return output;
}

/**
 * Include file HTML phụ nếu cần (phục vụ tách file)
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * =========================================================================================
 * 3. HÀM GOM DỮ LIỆU BAN ĐẦU (GET INITIAL DATA) & AUTO-SEED
 * =========================================================================================
 */
function getInitialData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var taskSheet = ss.getSheetByName(SHEET_CONG_VIEC);
  
  // Tự động kiểm tra: nếu chưa có tab chính hoặc không có dữ liệu -> Auto-Seed tức thì
  if (!taskSheet || taskSheet.getLastRow() <= 1) {
    Logger.log('Phát hiện cơ sở dữ liệu trống hoặc chưa khởi tạo. Bắt đầu Auto-Seed...');
    setupDatabaseSheets();
  }

  // Đọc đồng thời 6 tab dữ liệu với Dual Header Mapping
  var tasks = readSheetDataDual(SHEET_CONG_VIEC, mapTaskRow);
  var projects = readSheetDataDual(SHEET_DU_AN, mapProjectRow);
  var staff = readSheetDataDual(SHEET_NHAN_SU, mapStaffRow);
  var routines = readSheetDataDual(SHEET_LICH_LAP, mapRoutineRow);
  var checklist = readSheetDataDual(SHEET_CHECKLIST, mapChecklistRow);
  var taxonomy = readSheetDataDual(SHEET_DANH_MUC, mapTaxonomyRow);

  var now = new Date();
  return {
    success: true,
    tasks: tasks,
    projects: projects,
    staff: staff,
    routines: routines,
    checklist: checklist,
    taxonomy: taxonomy,
    serverTime: now.toISOString(),
    serverTimeFormatted: Utilities.formatDate(now, 'GMT+7', 'yyyy-MM-dd HH:mm:ss'),
    spreadsheetId: ss.getId(),
    appTitle: APP_TITLE,
    version: APP_VERSION
  };
}

/**
 * Helper đọc dữ liệu bảng tính siêu tốc bằng getValues() và dual-mapping
 */
function readSheetDataDual(sheetName, mapperFn) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1 || lastCol < 1) return [];

  var rawValues = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var result = [];

  for (var i = 0; i < rawValues.length; i++) {
    var row = rawValues[i];
    // Bỏ qua dòng hoàn toàn rỗng
    var hasContent = row.some(function(cell) { return cell !== '' && cell !== null; });
    if (!hasContent) continue;
    
    var obj = mapperFn(row, i + 2);
    if (obj) result.push(obj);
  }
  return result;
}

/**
 * Helper định dạng giá trị Ngày & Giờ tránh timezone lệch khi nạp về JSON
 */
function formatCellDate(cell) {
  if (!cell) return '';
  if (cell instanceof Date) {
    return Utilities.formatDate(cell, 'GMT+7', 'dd/MM/yyyy');
  }
  var str = String(cell).trim();
  // Nếu client gửi lên định dạng yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    var parts = str.substring(0, 10).split('-');
    return parts[2] + '/' + parts[1] + '/' + parts[0];
  }
  return str;
}

function formatCellTime(cell) {
  if (!cell) return '';
  if (cell instanceof Date) {
    return Utilities.formatDate(cell, 'GMT+7', 'HH:mm');
  }
  return String(cell).trim();
}

/**
 * =========================================================================================
 * 4. DUAL HEADER MAPPING CHO TỪNG BẢNG THỰC THỂ
 * =========================================================================================
 */
function mapTaskRow(r, rowIndex) {
  var maTask = String(r[0] || '').trim();
  var tenNhiemVu = String(r[1] || '').trim();
  var maDuAn = String(r[2] || '').trim();
  var tenDuAn = String(r[3] || '').trim();
  var nguoiPhuTrach = String(r[4] || '').trim();
  var email = String(r[5] || '').trim();
  var capDo = String(r[6] || 'Bình thường').trim();
  var trongSo = Number(r[7]) || 1;
  var ngayBatDau = formatCellDate(r[8]);
  var deadline = formatCellDate(r[9]);
  var gioDeadline = formatCellTime(r[10]);
  var tienDo = Number(r[11]) || 0;
  var trangThai = String(r[12] || 'Chờ thực hiện').trim();
  var ghiChu = String(r[13] || '').trim();
  var capNhatCuoi = String(r[14] || '').trim();

  return {
    rowIndex: rowIndex,
    // CamelCase Keys
    maTask: maTask,
    tenNhiemVu: tenNhiemVu,
    maDuAn: maDuAn,
    tenDuAn: tenDuAn,
    nguoiPhuTrach: nguoiPhuTrach,
    emailNhanSu: email,
    capDo: capDo,
    trongSo: trongSo,
    ngayBatDau: ngayBatDau,
    deadline: deadline,
    gioDeadline: gioDeadline,
    tienDo: tienDo,
    trangThai: trangThai,
    ghiChu: ghiChu,
    capNhatCuoi: capNhatCuoi,

    // Aliases & Tiếng Việt có dấu
    'Mã Task': maTask,
    'Tên Nhiệm Vụ': tenNhiemVu,
    'Mã Dự Án': maDuAn,
    'Tên Dự Án': tenDuAn,
    'Người Phụ Trách': nguoiPhuTrach,
    'Email Nhân Sự': email,
    'Cấp Độ': capDo,
    'Trọng Số': trongSo,
    'Ngày Bắt Đầu': ngayBatDau,
    'Deadline': deadline,
    'Giờ Deadline': gioDeadline,
    'Tiến Độ %': tienDo,
    'Trạng Thái': trangThai,
    'Ghi Chú': ghiChu,
    'Cập Nhật Cuối': capNhatCuoi,
    
    // Quick aliases
    id: maTask,
    name: tenNhiemVu,
    title: tenNhiemVu,
    status: trangThai,
    progress: tienDo,
    priority: capDo,
    assignee: nguoiPhuTrach,
    email: email,
    project: tenDuAn,
    projectId: maDuAn,
    dueDate: deadline,
    dueTime: gioDeadline,
    startDate: ngayBatDau,
    weight: trongSo,
    note: ghiChu
  };
}

function mapProjectRow(r, rowIndex) {
  var maDuAn = String(r[0] || '').trim();
  var tenDuAn = String(r[1] || '').trim();
  var phongBan = String(r[2] || '').trim();
  var nguoiQuanLy = String(r[3] || '').trim();
  var mucTieu = String(r[4] || '').trim();
  var ngayBatDau = formatCellDate(r[5]);
  var hanHoanThanh = formatCellDate(r[6]);
  var nganSach = Number(r[7]) || 0;
  var trangThai = String(r[8] || 'Đang tiến hành').trim();
  var tienDoTong = Number(r[9]) || 0;
  var ghiChu = String(r[10] || '').trim();

  return {
    rowIndex: rowIndex,
    maDuAn: maDuAn,
    tenDuAn: tenDuAn,
    phongBan: phongBan,
    nguoiQuanLy: nguoiQuanLy,
    mucTieu: mucTieu,
    ngayBatDau: ngayBatDau,
    hanHoanThanh: hanHoanThanh,
    nganSach: nganSach,
    trangThai: trangThai,
    tienDoTong: tienDoTong,
    ghiChu: ghiChu,

    'Mã Dự Án': maDuAn,
    'Tên Dự Án': tenDuAn,
    'Phòng Ban': phongBan,
    'Người Quản Lý': nguoiQuanLy,
    'Mục Tiêu': mucTieu,
    'Ngày Bắt Đầu': ngayBatDau,
    'Hạn Hoàn Thành': hanHoanThanh,
    'Ngân Sách': nganSach,
    'Trạng Thái': trangThai,
    'Tiến Độ Tổng %': tienDoTong,
    'Ghi Chú': ghiChu,

    id: maDuAn,
    name: tenDuAn,
    title: tenDuAn,
    department: phongBan,
    manager: nguoiQuanLy,
    goal: mucTieu,
    startDate: ngayBatDau,
    endDate: hanHoanThanh,
    budget: nganSach,
    progress: tienDoTong,
    status: trangThai,
    note: ghiChu
  };
}

function mapStaffRow(r, rowIndex) {
  var maNhanSu = String(r[0] || '').trim();
  var hoTen = String(r[1] || '').trim();
  var chucDanh = String(r[2] || '').trim();
  var capBac = String(r[3] || 'Mid').trim();
  var phongBan = String(r[4] || '').trim();
  var soDienThoai = String(r[5] || '').trim();
  var googleEmail = String(r[6] || '').trim();
  var taskDangLam = Number(r[7]) || 0;
  var taskHoanThanh = Number(r[8]) || 0;
  var tyLeDungHan = Number(r[9]) || 100;
  var hieuSuatThoiGian = Number(r[10]) || 100;
  var trangThai = String(r[11] || 'Đang hoạt động').trim();

  return {
    rowIndex: rowIndex,
    maNhanSu: maNhanSu,
    hoTen: hoTen,
    chucDanh: chucDanh,
    capBac: capBac,
    phongBan: phongBan,
    soDienThoai: soDienThoai,
    googleEmail: googleEmail,
    taskDangLam: taskDangLam,
    taskHoanThanh: taskHoanThanh,
    tyLeDungHan: tyLeDungHan,
    hieuSuatThoiGian: hieuSuatThoiGian,
    trangThai: trangThai,

    'Mã Nhân Sự': maNhanSu,
    'Họ Và Tên': hoTen,
    'Chức Danh': chucDanh,
    'Cấp Bậc': capBac,
    'Phòng Ban': phongBan,
    'Số Điện Thoại': soDienThoai,
    'Google Email': googleEmail,
    'Task Đang Làm': taskDangLam,
    'Task Hoàn Thành': taskHoanThanh,
    'Tỷ Lệ Đúng Hạn %': tyLeDungHan,
    'Hiệu Suất Thời Gian %': hieuSuatThoiGian,
    'Trạng Thái': trangThai,

    id: maNhanSu,
    name: hoTen,
    role: chucDanh,
    title: chucDanh,
    level: capBac,
    department: phongBan,
    phone: soDienThoai,
    email: googleEmail,
    activeTasks: taskDangLam,
    completedTasks: taskHoanThanh,
    onTimeRate: tyLeDungHan,
    efficiency: hieuSuatThoiGian,
    status: trangThai
  };
}

function mapRoutineRow(r, rowIndex) {
  var maLich = String(r[0] || '').trim();
  var tieuDe = String(r[1] || '').trim();
  var tanSuat = String(r[2] || '').trim();
  var lichCuThe = String(r[3] || '').trim();
  var gioBatDau = formatCellTime(r[4]);
  var gioKetThuc = formatCellTime(r[5]);
  var nguoiChuTri = String(r[6] || '').trim();
  var ghiChu = String(r[7] || '').trim();
  var trangThai = String(r[8] || 'Đang kích hoạt').trim();

  return {
    rowIndex: rowIndex,
    maLich: maLich,
    tieuDe: tieuDe,
    tanSuat: tanSuat,
    lichCuThe: lichCuThe,
    gioBatDau: gioBatDau,
    gioKetThuc: gioKetThuc,
    nguoiChuTri: nguoiChuTri,
    ghiChu: ghiChu,
    trangThai: trangThai,

    'Mã Lịch': maLich,
    'Tiêu Đề Đầu Việc / Meeting': tieuDe,
    'Tần Suất': tanSuat,
    'Lịch Cụ Thể': lichCuThe,
    'Giờ Bắt Đầu': gioBatDau,
    'Giờ Kết Thúc': gioKetThuc,
    'Người Chủ Trì': nguoiChuTri,
    'Ghi Chú': ghiChu,
    'Trạng Thái': trangThai,

    id: maLich,
    title: tieuDe,
    frequency: tanSuat,
    schedule: lichCuThe,
    startTime: gioBatDau,
    endTime: gioKetThuc,
    time: gioBatDau + ' - ' + gioKetThuc,
    host: nguoiChuTri,
    note: ghiChu,
    status: trangThai
  };
}

function mapChecklistRow(r, rowIndex) {
  var maLich = String(r[0] || '').trim();
  var nhiemVu = String(r[1] || '').trim();
  var maNhanSu = String(r[2] || '').trim();
  var tenNhanSu = String(r[3] || '').trim();
  var thu2 = String(r[4] || '-').trim();
  var thu3 = String(r[5] || '-').trim();
  var thu4 = String(r[6] || '-').trim();
  var thu5 = String(r[7] || '-').trim();
  var thu6 = String(r[8] || '-').trim();
  var thu7 = String(r[9] || '-').trim();
  var tyLeTuan = String(r[10] || '0%').trim();
  var tuanThu = String(r[11] || '').trim();

  return {
    rowIndex: rowIndex,
    maLich: maLich,
    nhiemVu: nhiemVu,
    maNhanSu: maNhanSu,
    tenNhanSu: tenNhanSu,
    thu2: thu2,
    thu3: thu3,
    thu4: thu4,
    thu5: thu5,
    thu6: thu6,
    thu7: thu7,
    tyLeTuan: tyLeTuan,
    tuanThu: tuanThu,

    'Mã Lịch': maLich,
    'Nhiệm Vụ / Meeting': nhiemVu,
    'Mã Nhân Sự': maNhanSu,
    'Tên Nhân Sự': tenNhanSu,
    'Thứ 2': thu2,
    'Thứ 3': thu3,
    'Thứ 4': thu4,
    'Thứ 5': thu5,
    'Thứ 6': thu6,
    'Thứ 7': thu7,
    'Tỷ Lệ Tuần %': tyLeTuan,
    'Tuần Thứ': tuanThu,

    id: maLich + '_' + maNhanSu,
    routineId: maLich,
    title: nhiemVu,
    staffId: maNhanSu,
    staffName: tenNhanSu,
    rate: tyLeTuan,
    week: tuanThu,
    mon: thu2,
    tue: thu3,
    wed: thu4,
    thu: thu5,
    fri: thu6,
    sat: thu7
  };
}

function mapTaxonomyRow(r, rowIndex) {
  var nhom = String(r[0] || '').trim();
  var maDanhMuc = String(r[1] || '').trim();
  var tenDanhMuc = String(r[2] || '').trim();
  var mauSac = String(r[3] || '#64748b').trim();
  var thuTu = Number(r[4]) || 1;
  var ghiChu = String(r[5] || '').trim();

  return {
    rowIndex: rowIndex,
    nhom: nhom,
    maDanhMuc: maDanhMuc,
    tenDanhMuc: tenDanhMuc,
    mauSac: mauSac,
    thuTu: thuTu,
    ghiChu: ghiChu,

    'Nhóm': nhom,
    'Mã Danh Mục': maDanhMuc,
    'Tên Danh Mục': tenDanhMuc,
    'Màu Sắc / Mã CSS': mauSac,
    'Thứ Tự': thuTu,
    'Ghi Chú': ghiChu,

    group: nhom,
    code: maDanhMuc,
    label: tenDanhMuc,
    name: tenDanhMuc,
    color: mauSac,
    order: thuTu,
    note: ghiChu
  };
}

/**
 * =========================================================================================
 * 5. KHỞI TẠO CƠ SỞ DỮ LIỆU CHUẨN (SETUP DATABASE SHEETS & AUTO-SEED)
 * =========================================================================================
 */
function setupDatabaseSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Tạo hoặc dọn dẹp từng tab cơ sở dữ liệu
  ensureSheetWithSchema(ss, SHEET_CONG_VIEC, SCHEMA_CONG_VIEC);
  ensureSheetWithSchema(ss, SHEET_DU_AN, SCHEMA_DU_AN);
  ensureSheetWithSchema(ss, SHEET_NHAN_SU, SCHEMA_NHAN_SU);
  ensureSheetWithSchema(ss, SHEET_LICH_LAP, SCHEMA_LICH_LAP_LAI);
  ensureSheetWithSchema(ss, SHEET_CHECKLIST, SCHEMA_CHECKLIST_LAP);
  ensureSheetWithSchema(ss, SHEET_DANH_MUC, SCHEMA_DANH_MUC);

  // 2. Nạp bộ dữ liệu mẫu thực chiến chuyên sâu (15 tasks, 5 dự án, 8 nhân sự, 5 lịch, 8 checklist, 17 danh mục)
  seedSampleProjects(ss);
  seedSampleStaff(ss);
  seedSampleTasks(ss);
  seedSampleRoutines(ss);
  seedSampleChecklist(ss);
  seedSampleTaxonomy(ss);

  // 3. Khởi tạo và làm đẹp Tab HDSD (Tab duy nhất hiển thị)
  setupTabHDSD(ss);

  // 4. Khóa và ẩn toàn bộ các tab DB_, chỉ để lại tab HDSD hiển thị
  lockAndHideDatabaseSheets();

  return { success: true, message: 'Khởi tạo cơ sở dữ liệu và nạp dữ liệu mẫu thành công!' };
}

/**
 * Tạo sheet nếu chưa có và áp dụng schema tiêu đề chuẩn Fintech
 */
function ensureSheetWithSchema(ss, sheetName, headers) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  sheet.clear();
  sheet.setFrozenRows(1);

  // Ghi hàng Header
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setBackground('#0f172a'); // Nền Slate 900
  headerRange.setFontColor('#ffffff'); // Chữ trắng
  headerRange.setFontWeight('bold');
  headerRange.setFontFamily('Arial');
  headerRange.setFontSize(10);
  headerRange.setHorizontalAlignment('center');
  headerRange.setVerticalAlignment('middle');
  sheet.setRowHeight(1, 38);

  return sheet;
}

/**
 * =========================================================================================
 * 6. BỘ DỮ LIỆU MẪU THỰC CHIẾN (SEED REALISTIC DATA)
 * =========================================================================================
 */
function seedSampleProjects(ss) {
  var sheet = ss.getSheetByName(SHEET_DU_AN);
  var data = [
    [
      'DUAN-102931', 'Nâng Cấp Hệ Thống CRM & Bán Hàng 3.0', 'Kỹ thuật & Công nghệ',
      'Nguyễn Minh Trí', 'Tối ưu hóa phễu chuyển đổi và tự động hóa báo cáo KPI',
      '01/11/2026', '30/12/2026', 150000000, 'Đang tiến hành', 68,
      'Ưu tiên hoàn thành Module Lead & Deal trong tháng 11'
    ],
    [
      'DUAN-204812', 'Tái Thiết Kế Bộ Nhận Diện Thương Hiệu 2026', 'Thiết kế & Sản phẩm',
      'Trần Thị Thảo', 'Chuẩn hóa Design System và bộ ấn phẩm Marketing đa kênh',
      '15/10/2026', '15/12/2026', 85000000, 'Đang tiến hành', 82,
      'Đang nghiệm thu Brand Guidelines v2'
    ],
    [
      'DUAN-305928', 'Chiến Dịch Tăng Trưởng Khách Hàng Q4', 'Marketing & Truyền thông',
      'Phạm Quỳnh Anh', 'Thu hút 5,000 MQL và tăng nhận diện thương hiệu số',
      '01/10/2026', '31/12/2026', 120000000, 'Đang tiến hành', 45,
      'Cần đẩy mạnh chiến dịch Performance Ads và Webinar'
    ],
    [
      'DUAN-401923', 'Tự Động Hóa Vận Hành Kho & Đối Soát Công Nợ', 'Vận hành & Hậu cần',
      'Lê Hoàng Long', 'Tự động hóa luồng nhập xuất kho và đối soát công nợ tự động',
      '01/11/2026', '15/01/2027', 95000000, 'Đang tiến hành', 55,
      'Tập trung tích hợp hệ thống POS và ngân hàng VietQR'
    ],
    [
      'DUAN-502814', 'Hệ Thống Đào Tạo Nội Bộ & Knowledge Base', 'Nhân sự & Đào tạo',
      'Hoàng Thu Trang', 'Số hóa 100% tài liệu quy trình và xây dựng cổng học tập nội bộ',
      '15/10/2026', '30/11/2026', 40000000, 'Đang tiến hành', 90,
      'Chuẩn bị nghiệm thu giai đoạn 1 và bàn giao cho các phòng ban'
    ]
  ];
  sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
  formatDataRangeRows(sheet, 2, data.length, data[0].length);
}

function seedSampleStaff(ss) {
  var sheet = ss.getSheetByName(SHEET_NHAN_SU);
  var data = [
    [
      'NHAN-201941', 'Nguyễn Minh Trí', 'Tech Lead & Solution Architect', 'Lead',
      'Kỹ thuật & Công nghệ', '0908123456', 'tri.nguyen@filedilam.vn', 3, 14, 96, 94, 'Đang hoạt động'
    ],
    [
      'NHAN-201942', 'Trần Thị Thảo', 'Senior UI/UX Product Designer', 'Senior',
      'Thiết kế & Sản phẩm', '0912345678', 'thao.tran@filedilam.vn', 2, 18, 98, 96, 'Đang hoạt động'
    ],
    [
      'NHAN-201943', 'Lê Hoàng Long', 'Senior Fullstack Developer', 'Senior',
      'Kỹ thuật & Công nghệ', '0933456789', 'long.le@filedilam.vn', 4, 12, 92, 90, 'Đang hoạt động'
    ],
    [
      'NHAN-201944', 'Phạm Quỳnh Anh', 'Growth Marketing Lead', 'Lead',
      'Marketing & Truyền thông', '0944567890', 'quynhanh.pham@filedilam.vn', 3, 15, 95, 93, 'Đang hoạt động'
    ],
    [
      'NHAN-201945', 'Vũ Đức Nam', 'Frontend Developer', 'Mid',
      'Kỹ thuật & Công nghệ', '0977654321', 'nam.vu@filedilam.vn', 3, 9, 88, 85, 'Đang hoạt động'
    ],
    [
      'NHAN-201946', 'Hoàng Thu Trang', 'QA/QC Specialist & Tester', 'Junior',
      'Kỹ thuật & Công nghệ', '0988765432', 'trang.hoang@filedilam.vn', 2, 11, 94, 91, 'Đang hoạt động'
    ],
    [
      'NHAN-201947', 'Đỗ Minh Tuấn', 'Cloud DevOps Engineer', 'Senior',
      'Kỹ thuật & Công nghệ', '0966554433', 'tuan.do@filedilam.vn', 2, 8, 95, 92, 'Đang hoạt động'
    ],
    [
      'NHAN-201948', 'Bùi Mai Phương', 'Content & Community Specialist', 'Junior',
      'Marketing & Truyền thông', '0911223344', 'phuong.bui@filedilam.vn', 1, 7, 91, 89, 'Đang hoạt động'
    ]
  ];
  sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
  formatDataRangeRows(sheet, 2, data.length, data[0].length);
}

function seedSampleTasks(ss) {
  var sheet = ss.getSheetByName(SHEET_CONG_VIEC);
  var data = [
    [
      'TASK-829101', 'Xây dựng luồng xác thực OAuth2 & RBAC', 'DUAN-102931',
      'Nâng Cấp Hệ Thống CRM & Bán Hàng 3.0', 'Nguyễn Minh Trí', 'tri.nguyen@filedilam.vn',
      'Khẩn cấp', 5, '05/11/2026', '12/11/2026', '17:30', 85, 'Đang tiến hành',
      'Đã hoàn thành module Token Refresh, đang test vai trò Admin', '11/11/2026 10:15'
    ],
    [
      'TASK-829102', 'Thiết kế bộ UI Components Figma v3', 'DUAN-204812',
      'Tái Thiết Kế Bộ Nhận Diện Thương Hiệu 2026', 'Trần Thị Thảo', 'thao.tran@filedilam.vn',
      'Cao', 4, '01/11/2026', '14/11/2026', '18:00', 95, 'Chờ duyệt',
      'Gửi link Figma cho ban giám đốc review phiên bản màu Mint Fintech', '11/11/2026 09:20'
    ],
    [
      'TASK-829103', 'Tối ưu hóa Database Query & Caching Redis', 'DUAN-102931',
      'Nâng Cấp Hệ Thống CRM & Bán Hàng 3.0', 'Lê Hoàng Long', 'long.le@filedilam.vn',
      'Cao', 4, '08/11/2026', '15/11/2026', '12:00', 50, 'Đang tiến hành',
      'Giảm thời gian response endpoint /api/deals từ 420ms xuống 65ms', '11/11/2026 08:45'
    ],
    [
      'TASK-829104', 'Setup Chiến Dịch Google Performance Max Q4', 'DUAN-305928',
      'Chiến Dịch Tăng Trưởng Khách Hàng Q4', 'Phạm Quỳnh Anh', 'quynhanh.pham@filedilam.vn',
      'Khẩn cấp', 5, '03/11/2026', '10/11/2026', '17:00', 100, 'Hoàn thành',
      'Chiến dịch đã live và đem lại 120 leads ngày đầu tiên', '10/11/2026 17:30'
    ],
    [
      'TASK-829105', 'Lập trình Form Drawer & Validation phía Client', 'DUAN-102931',
      'Nâng Cấp Hệ Thống CRM & Bán Hàng 3.0', 'Vũ Đức Nam', 'nam.vu@filedilam.vn',
      'Bình thường', 3, '09/11/2026', '16/11/2026', '17:30', 40, 'Đang tiến hành',
      'Cần bổ sung kiểm tra định dạng số điện thoại Việt Nam', '11/11/2026 11:00'
    ],
    [
      'TASK-829106', 'Kiểm thử tự động API Lead Creation', 'DUAN-102931',
      'Nâng Cấp Hệ Thống CRM & Bán Hàng 3.0', 'Hoàng Thu Trang', 'trang.hoang@filedilam.vn',
      'Bình thường', 3, '10/11/2026', '17/11/2026', '18:00', 30, 'Đang tiến hành',
      'Viết kịch bản test bằng Postman và Newman CLI', '11/11/2026 10:50'
    ],
    [
      'TASK-829107', 'Nghiên cứu thị trường & Phân tích đối thủ Q4', 'DUAN-305928',
      'Chiến Dịch Tăng Trưởng Khách Hàng Q4', 'Phạm Quỳnh Anh', 'quynhanh.pham@filedilam.vn',
      'Thấp', 2, '01/11/2026', '08/11/2026', '16:00', 100, 'Hoàn thành',
      'Hoàn thành báo cáo 25 trang phân tích pricing và feature matrix', '08/11/2026 16:15'
    ],
    [
      'TASK-829108', 'Thiết kế Landing Page Chuyển Đổi Cao', 'DUAN-204812',
      'Tái Thiết Kế Bộ Nhận Diện Thương Hiệu 2026', 'Trần Thị Thảo', 'thao.tran@filedilam.vn',
      'Cao', 4, '07/11/2026', '13/11/2026', '17:00', 70, 'Đang tiến hành',
      'Wireframe đã thông qua, đang hoàn thiện responsive mobile', '11/11/2026 09:40'
    ],
    [
      'TASK-829109', 'Tích hợp Cổng Thanh Toán MoMo & VietQR', 'DUAN-102931',
      'Nâng Cấp Hệ Thống CRM & Bán Hàng 3.0', 'Lê Hoàng Long', 'long.le@filedilam.vn',
      'Khẩn cấp', 5, '11/11/2026', '18/11/2026', '17:30', 20, 'Đang tiến hành',
      'Đã nhận API Key từ đối tác, bắt đầu ghép webhook IPN', '11/11/2026 11:30'
    ],
    [
      'TASK-829110', 'Kiểm tra bảo mật và rà soát lỗ hổng OWASP', 'DUAN-102931',
      'Nâng Cấp Hệ Thống CRM & Bán Hàng 3.0', 'Nguyễn Minh Trí', 'tri.nguyen@filedilam.vn',
      'Cao', 4, '12/11/2026', '19/11/2026', '17:30', 0, 'Chờ thực hiện',
      'Chuẩn bị môi trường staging và tài khoản test phân quyền', '10/11/2026 14:00'
    ],
    [
      'TASK-829111', 'Xây dựng Email Sequences Onboarding tự động', 'DUAN-305928',
      'Chiến Dịch Tăng Trưởng Khách Hàng Q4', 'Phạm Quỳnh Anh', 'quynhanh.pham@filedilam.vn',
      'Bình thường', 3, '09/11/2026', '15/11/2026', '17:00', 60, 'Đang tiến hành',
      'Chuỗi 5 email chăm sóc khách sau khi đăng ký dùng thử', '11/11/2026 09:15'
    ],
    [
      'TASK-829112', 'Soạn tài liệu Release Notes & Hướng Dẫn Vận Hành', 'DUAN-102931',
      'Nâng Cấp Hệ Thống CRM & Bán Hàng 3.0', 'Hoàng Thu Trang', 'trang.hoang@filedilam.vn',
      'Thấp', 2, '15/11/2026', '22/11/2026', '17:00', 0, 'Chờ thực hiện',
      'Đang tập hợp tài liệu các module từ team dev', '10/11/2026 15:30'
    ],
    [
      'TASK-829113', 'Triển khai Hạ tầng CI/CD Pipeline & Docker Registry', 'DUAN-401923',
      'Tự Động Hóa Vận Hành Kho & Đối Soát Công Nợ', 'Đỗ Minh Tuấn', 'tuan.do@filedilam.vn',
      'Cao', 4, '06/11/2026', '14/11/2026', '17:30', 75, 'Đang tiến hành',
      'Đã hoàn thiện build runner tự động trên GitHub Actions', '11/11/2026 14:00'
    ],
    [
      'TASK-829114', 'Tối ưu Core Web Vitals & Lazy Load Media', 'DUAN-204812',
      'Tái Thiết Kế Bộ Nhận Diện Thương Hiệu 2026', 'Vũ Đức Nam', 'nam.vu@filedilam.vn',
      'Bình thường', 3, '08/11/2026', '16/11/2026', '16:00', 50, 'Đang tiến hành',
      'LCP giảm từ 3.2s xuống 1.4s trên thiết bị di động 4G', '11/11/2026 15:10'
    ],
    [
      'TASK-829115', 'Biên soạn Video Hướng Dẫn & Onboarding FAQ', 'DUAN-502814',
      'Hệ Thống Đào Tạo Nội Bộ & Knowledge Base', 'Bùi Mai Phương', 'phuong.bui@filedilam.vn',
      'Bình thường', 3, '10/11/2026', '18/11/2026', '17:00', 35, 'Đang tiến hành',
      'Hoàn thành 3/8 video kịch bản hướng dẫn nghiệp vụ chuẩn', '11/11/2026 16:00'
    ]
  ];
  sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
  formatDataRangeRows(sheet, 2, data.length, data[0].length);
}

function seedSampleRoutines(ss) {
  var sheet = ss.getSheetByName(SHEET_LICH_LAP);
  var data = [
    [
      'LICH-301921', 'Họp Standup Đầu Ngày (Daily Standup)', 'Hàng ngày (Thứ 2 - Thứ 6)',
      '09:00 - 09:20', '09:00', '09:20', 'Nguyễn Minh Trí',
      'Báo cáo 3 câu hỏi: Hôm qua làm gì? Hôm nay làm gì? Có blocker gì không?', 'Đang kích hoạt'
    ],
    [
      'LICH-301922', 'Review Tiến Độ Dự Án & Giải Phóng Nghẽn', 'Thứ 2 & Thứ 5',
      '14:00 - 15:00', '14:00', '15:00', 'Nguyễn Minh Trí',
      'Rà soát Gantt Chart, điều phối lại nguồn lực các task P1', 'Đang kích hoạt'
    ],
    [
      'LICH-301923', 'Thiết Kế & Demo Sản Phẩm (Design Critique)', 'Thứ 3 hàng tuần',
      '15:00 - 16:30', '15:00', '16:30', 'Trần Thị Thảo',
      'Demo nguyên mẫu tương tác và thu thập feedback người dùng', 'Đang kích hoạt'
    ],
    [
      'LICH-301924', 'Đánh Giá Kỷ Luật & Khớp Checklist Tuần', 'Thứ 6 hàng tuần',
      '16:30 - 17:30', '16:30', '17:30', 'Phạm Quỳnh Anh',
      'Tổng kết ma trận tuần, ghi nhận tỷ lệ đúng hạn và KPI', 'Đang kích hoạt'
    ],
    [
      'LICH-301925', 'Retrospective & Lên Kế Hoạch Tuần Mới', 'Thứ 6 hàng tuần',
      '17:30 - 18:15', '17:30', '18:15', 'Nguyễn Minh Trí',
      'Nhìn nhận cải tiến: What went well? What could be better? Action items', 'Đang kích hoạt'
    ]
  ];
  sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
  formatDataRangeRows(sheet, 2, data.length, data[0].length);
}

function seedSampleChecklist(ss) {
  var sheet = ss.getSheetByName(SHEET_CHECKLIST);
  var data = [
    ['LICH-301921', 'Họp Standup Đầu Ngày', 'NHAN-201941', 'Nguyễn Minh Trí', 'Done', 'Done', 'Done', 'Not Yet', 'Not Yet', '-', '60%', 'Tuần 46'],
    ['LICH-301921', 'Họp Standup Đầu Ngày', 'NHAN-201943', 'Lê Hoàng Long', 'Done', 'Done', 'Done', 'Not Yet', 'Not Yet', '-', '60%', 'Tuần 46'],
    ['LICH-301921', 'Họp Standup Đầu Ngày', 'NHAN-201945', 'Vũ Đức Nam', 'Done', 'Not Yet', 'Done', 'Not Yet', 'Not Yet', '-', '40%', 'Tuần 46'],
    ['LICH-301921', 'Họp Standup Đầu Ngày', 'NHAN-201946', 'Hoàng Thu Trang', 'Done', 'Done', 'Done', 'Not Yet', 'Not Yet', '-', '60%', 'Tuần 46'],
    ['LICH-301922', 'Review Tiến Độ Dự Án', 'NHAN-201941', 'Nguyễn Minh Trí', 'Done', '-', '-', 'Not Yet', '-', '-', '50%', 'Tuần 46'],
    ['LICH-301922', 'Review Tiến Độ Dự Án', 'NHAN-201944', 'Phạm Quỳnh Anh', 'Done', '-', '-', 'Not Yet', '-', '-', '50%', 'Tuần 46'],
    ['LICH-301923', 'Thiết Kế & Demo Sản Phẩm', 'NHAN-201942', 'Trần Thị Thảo', '-', 'Done', '-', '-', '-', '-', '100%', 'Tuần 46'],
    ['LICH-301924', 'Đánh Giá Kỷ Luật & Checklist', 'NHAN-201944', 'Phạm Quỳnh Anh', '-', '-', '-', '-', 'Not Yet', '-', '0%', 'Tuần 46']
  ];
  sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
  formatDataRangeRows(sheet, 2, data.length, data[0].length);
}

function seedSampleTaxonomy(ss) {
  var sheet = ss.getSheetByName(SHEET_DANH_MUC);
  var data = [
    ['Trạng Thái Task', 'CAT-TT-01', 'Chờ thực hiện', '#64748b', 1, 'Nhiệm vụ mới tạo chưa bắt đầu'],
    ['Trạng Thái Task', 'CAT-TT-02', 'Đang tiến hành', '#0284c7', 2, 'Đang trong quá trình xử lý / Đang làm'],
    ['Trạng Thái Task', 'CAT-TT-03', 'Chờ duyệt', '#d97706', 3, 'Đã làm xong, đang đợi nghiệm thu'],
    ['Trạng Thái Task', 'CAT-TT-04', 'Hoàn thành', '#059669', 4, 'Đã được nghiệm thu và đóng'],
    ['Trạng Thái Task', 'CAT-TT-05', 'Tạm hoãn', '#94a3b8', 5, 'Tạm dừng do thiếu thông tin'],
    ['Mức Độ Ưu Tiên', 'CAT-UT-01', 'Khẩn cấp', '#e11d48', 1, 'Cần xử lý ngay trong ngày (P1)'],
    ['Mức Độ Ưu Tiên', 'CAT-UT-02', 'Cao', '#ea580c', 2, 'Quan trọng, cần ưu tiên (P2)'],
    ['Mức Độ Ưu Tiên', 'CAT-UT-03', 'Bình thường', '#0284c7', 3, 'Công việc chuẩn theo kế hoạch (P3)'],
    ['Mức Độ Ưu Tiên', 'CAT-UT-04', 'Thấp', '#64748b', 4, 'Có thể dời lại nếu cần tập trung (P4)'],
    ['Phòng Ban', 'CAT-PB-01', 'Kỹ thuật & Công nghệ', '#0284c7', 1, 'Phát triển phần mềm, hạ tầng kỹ thuật'],
    ['Phòng Ban', 'CAT-PB-02', 'Thiết kế & Sản phẩm', '#7c3aed', 2, 'UI/UX, nghiên cứu sản phẩm, thương hiệu'],
    ['Phòng Ban', 'CAT-PB-03', 'Marketing & Truyền thông', '#db2777', 3, 'Tăng trưởng người dùng, truyền thông'],
    ['Phòng Ban', 'CAT-PB-04', 'Kinh doanh & Vận hành', '#059669', 4, 'Bán hàng, đối tác & vận hành doanh nghiệp'],
    ['Phòng Ban', 'CAT-PB-05', 'Tài chính & Kế toán', '#f59e0b', 5, 'Quản trị dòng tiền, ngân sách & kế toán'],
    ['Phòng Ban', 'CAT-PB-06', 'Nhân sự & Đào tạo', '#10b981', 6, 'Tuyển dụng, đào tạo & văn hóa doanh nghiệp'],
    ['Cấp Bậc Nhân Sự', 'CAT-CB-01', 'Lead', '#dc2626', 1, 'Trưởng nhóm / Trưởng bộ phận'],
    ['Cấp Bậc Nhân Sự', 'CAT-CB-02', 'Senior', '#ea580c', 2, 'Chuyên viên cao cấp'],
    ['Cấp Bậc Nhân Sự', 'CAT-CB-03', 'Mid', '#0284c7', 3, 'Chuyên viên chính thức'],
    ['Cấp Bậc Nhân Sự', 'CAT-CB-04', 'Junior', '#64748b', 4, 'Chuyên viên tập sự / mới vào'],
    ['Trạng Thái Dự Án', 'CAT-DA-01', 'Đang tiến hành', '#0284c7', 1, 'Dự án đang trong quá trình thực thi'],
    ['Trạng Thái Dự Án', 'CAT-DA-02', 'Hoàn thành', '#059669', 2, 'Dự án đã nghiệm thu bàn giao'],
    ['Trạng Thái Dự Án', 'CAT-DA-03', 'Tạm dừng', '#ea580c', 3, 'Dự án tạm ngưng chờ quyết định'],
    ['Trạng Thái Dự Án', 'CAT-DA-04', 'Chuẩn bị', '#64748b', 4, 'Dự án đang lập kế hoạch ban đầu'],
    ['Trạng Thái Nhân Sự', 'CAT-NS-01', 'Đang hoạt động', '#059669', 1, 'Nhân sự đang công tác bình thường'],
    ['Trạng Thái Nhân Sự', 'CAT-NS-02', 'Nghỉ phép / Tạm ngưng', '#94a3b8', 2, 'Nhân sự đang nghỉ phép hoặc tạm ngưng']
  ];
  sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
  formatDataRangeRows(sheet, 2, data.length, data[0].length);
}

/**
 * Định dạng hàng dữ liệu tiêu chuẩn: Font Arial, Size 10, viền xám nhẹ
 */
function formatDataRangeRows(sheet, startRow, numRows, numCols) {
  var range = sheet.getRange(startRow, 1, numRows, numCols);
  range.setFontFamily('Arial');
  range.setFontSize(10);
  range.setVerticalAlignment('middle');
  range.setBorder(true, true, true, true, true, true, '#e2e8f0', SpreadsheetApp.BorderStyle.SOLID);
  sheet.autoResizeColumns(1, numCols);
}

/**
 * =========================================================================================
 * 7. THIẾT LẬP TAB HDSD DUY NHẤT HIỂN THỊ (QUY TẮC SINGLE VISIBLE TAB)
 * =========================================================================================
 */
function setupTabHDSD(ss) {
  var sheet = ss.getSheetByName(SHEET_HDSD);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_HDSD, 0);
  }
  sheet.clear();
  sheet.setTabColor('#059669'); // Tab màu Mint nổi bật
  sheet.showSheet();

  // Đặt độ rộng các cột A -> G
  sheet.setColumnWidth(1, 30);  // A: lề trái
  sheet.setColumnWidth(2, 160); // B
  sheet.setColumnWidth(3, 220); // C
  sheet.setColumnWidth(4, 260); // D
  sheet.setColumnWidth(5, 200); // E
  sheet.setColumnWidth(6, 40);  // F: lề phải

  // Dòng 1-2: Tiêu đề thương hiệu
  sheet.getRange('B2:E2').merge()
    .setValue('HỆ THỐNG QUẢN LÝ TIẾN ĐỘ DỰ ÁN & CÔNG VIỆC TEAM 3.0')
    .setFontFamily('Arial').setFontSize(14).setFontWeight('bold')
    .setFontColor('#0f172a').setVerticalAlignment('middle');
  sheet.setRowHeight(2, 32);

  // Dòng 3-4: Nút Mint Launcher bấm mở Web App (B3:E4 Merged)
  var btnRange = sheet.getRange('B3:E4').merge();
  btnRange.setValue('MỞ ỨNG DỤNG WEB APP (BẤM VÀO ĐÂY)')
    .setFontFamily('Arial').setFontSize(13).setFontWeight('bold')
    .setFontColor('#ffffff').setBackground('#059669')
    .setHorizontalAlignment('center').setVerticalAlignment('middle')
    .setBorder(true, true, true, true, true, true, '#047857', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  sheet.setRowHeight(3, 26);
  sheet.setRowHeight(4, 26);

  // Link trực tiếp đến Web App URL
  try {
    sheet.getRange('B3').setFormula('=HYPERLINK("' + WEB_APP_URL + '", "MỞ ỨNG DỤNG WEB APP (BẤM VÀO ĐÂY)")');
  } catch (e) {
    // Fallback nếu formula không thành công
  }

  // Dòng 6: Tiêu đề khối hướng dẫn
  sheet.getRange('B6:E6').merge()
    .setValue('📌 QUY TRÌNH VẬN HÀNH 3 BƯỚC NHANH CHO NHÀ QUẢN LÝ & TEAM')
    .setFontFamily('Arial').setFontSize(11).setFontWeight('bold')
    .setFontColor('#0369a1').setBackground('#f0f9ff')
    .setVerticalAlignment('middle');
  sheet.setRowHeight(6, 30);

  // Bảng 3 bước Onboarding
  var stepsHeader = ['Bước', 'Nghiệp Vụ Cốt Lõi', 'Mô Tả Thao Tác Chi Tiết', 'Kết Quả Đạt Được'];
  sheet.getRange(7, 2, 1, 4).setValues([stepsHeader])
    .setFontWeight('bold').setBackground('#e2e8f0').setFontColor('#334155')
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  sheet.setRowHeight(7, 28);

  var stepsData = [
    [
      'Bước 1',
      'Khai Báo Thành Viên & Dự Án',
      'Mở Web App -> Tab Nhân Sự & Dự Án -> Bấm "+ Thêm Mới". Nhập đầy đủ Email Google để đồng bộ thông báo.',
      'Sơ đồ phân bổ nguồn lực & workload tự động tính toán chính xác 100%.'
    ],
    [
      'Bước 2',
      'Giao Task & Thiết Lập Deadline',
      'Tab Công Việc -> Bấm "+ Tạo Task". Chọn dự án, người nhận việc, trọng số và hạn chót có kèm giờ phút cụ thể.',
      'Hiển thị trực quan trên Master Table và Gantt Timeline có đường đỏ Today.'
    ],
    [
      'Bước 3',
      'Đồng Bộ Calendar & Checklist Tuần',
      'Bấm nút "Đồng bộ Calendar" trên Menu hoặc Header. Điểm danh họp Standup và checklist kỷ luật mỗi ngày.',
      'Google Calendar nhắc hẹn tự động, ma trận checklist chấm điểm KPI minh bạch.'
    ]
  ];
  sheet.getRange(8, 2, stepsData.length, 4).setValues(stepsData)
    .setFontFamily('Arial').setFontSize(9.5).setVerticalAlignment('middle')
    .setBorder(true, true, true, true, true, true, '#cbd5e1', SpreadsheetApp.BorderStyle.SOLID);
  sheet.setRowHeight(8, 36);
  sheet.setRowHeight(9, 36);
  sheet.setRowHeight(10, 36);

  // Khối lưu ý Single Visible Tab
  sheet.getRange('B12:E12').merge()
    .setValue('🔒 QUY TẮC BẢO VỆ DỮ LIỆU CỐT LÕI (SINGLE VISIBLE TAB POLICY)')
    .setFontFamily('Arial').setFontSize(11).setFontWeight('bold')
    .setFontColor('#b91c1c').setBackground('#fef2f2')
    .setVerticalAlignment('middle');
  sheet.setRowHeight(12, 30);

  var policyText = [
    ['Lưu ý 1', 'Toàn bộ các bảng dữ liệu nguồn (DB_CongViec, DB_DuAn, DB_NhanSu...) đã được hệ thống Khóa & Ẩn tự động.'],
    ['Lưu ý 2', 'Người dùng thao tác 100% qua giao diện Web App. Tuyệt đối không gõ tay trên Sheet để tránh hỏng dữ liệu liên kết.'],
    ['Lưu ý 3', 'Nếu muốn hiện lại các bảng DB để kiểm tra cấu trúc, vào menu "File Đi Làm" -> chọn "Mở Ứng Dụng Quản Lý".']
  ];
  sheet.getRange(13, 2, policyText.length, 2).setValues(policyText)
    .setFontFamily('Arial').setFontSize(9.5).setVerticalAlignment('middle')
    .setBorder(true, true, true, true, true, true, '#fecaca', SpreadsheetApp.BorderStyle.SOLID);

  // Khối hỗ trợ kỹ thuật
  sheet.getRange('B17:E17').merge()
    .setValue('HỖ TRỢ KỸ THUẬT & BẢN QUYỀN SẢN PHẨM: FILE ĐI LÀM (Zalo: 09xx.xxx.xxx — Hỗ trợ 24/7)')
    .setFontFamily('Arial').setFontSize(9).setFontStyle('italic')
    .setFontColor('#64748b').setHorizontalAlignment('center');

  // Đưa tab HDSD lên vị trí đầu tiên
  ss.setActiveSheet(sheet);
  ss.moveActiveSheet(1);
}

/**
 * =========================================================================================
 * 8. KHÓA VÀ ẨN DATABASE NỀN (SINGLE VISIBLE TAB POLICY)
 * =========================================================================================
 */
function lockAndHideDatabaseSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  var hdsdSheet = ss.getSheetByName(SHEET_HDSD);

  if (hdsdSheet) {
    hdsdSheet.showSheet();
    ss.setActiveSheet(hdsdSheet);
  }

  for (var i = 0; i < sheets.length; i++) {
    var sh = sheets[i];
    var name = sh.getName();

    if (name.indexOf('DB_') === 0) {
      // Ẩn sheet DB
      try {
        sh.hideSheet();
      } catch (e) {
        Logger.log('Không thể ẩn sheet ' + name + ': ' + e.toString());
      }

      // Khóa bảo vệ sheet DB tránh người dùng sửa nhầm
      try {
        var protections = sh.getProtections(SpreadsheetApp.ProtectionType.SHEET);
        var p = (protections.length > 0) ? protections[0] : sh.protect();
        p.setDescription('Khóa bảo vệ Database FILE ĐI LÀM — ' + name);
        p.setWarningOnly(true);
      } catch (e2) {
        // Bỏ qua nếu không có quyền can thiệp protection
      }
    }
  }

  return { success: true, message: 'Đã khóa và ẩn toàn bộ các tab Database nền thành công!' };
}

/**
 * =========================================================================================
 * 9. ĐỒNG BỘ DEADLINE TASK RA GOOGLE CALENDAR (CALENDARAPP ENGINE)
 * =========================================================================================
 */
function syncDeadlinesToGoogleCalendar() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_CONG_VIEC);
    if (!sheet) return { success: false, message: 'Không tìm thấy tab DB_CongViec' };

    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return { success: true, message: 'Chưa có công việc nào để đồng bộ', count: 0 };

    var rawData = sheet.getRange(2, 1, lastRow - 1, 15).getValues();
    var calendar = CalendarApp.getDefaultCalendar();
    if (!calendar) return { success: false, message: 'Không truy cập được Google Calendar mặc định' };

    var syncCount = 0;
    var now = new Date();

    for (var i = 0; i < rawData.length; i++) {
      var row = rawData[i];
      var maTask = String(row[0] || '').trim();
      var tenTask = String(row[1] || '').trim();
      var tenDuAn = String(row[3] || '').trim();
      var nguoiPhuTrach = String(row[4] || '').trim();
      var deadlineStr = formatCellDate(row[9]);
      var timeStr = formatCellTime(row[10]) || '17:30';
      var trangThai = String(row[12] || '').trim();
      var ghiChu = String(row[13] || '').trim();

      // Bỏ qua task đã hoàn thành hoặc không có deadline
      if (trangThai === 'Hoàn thành' || !deadlineStr) continue;

      // Phân tích ngày và giờ deadline (định dạng dd/MM/yyyy và HH:mm)
      var dateParts = deadlineStr.split('/');
      if (dateParts.length !== 3) continue;

      var timeParts = timeStr.split(':');
      var hours = parseInt(timeParts[0], 10) || 17;
      var minutes = parseInt(timeParts[1], 10) || 30;

      var deadlineDate = new Date(
        parseInt(dateParts[2], 10),
        parseInt(dateParts[1], 10) - 1,
        parseInt(dateParts[0], 10),
        hours,
        minutes,
        0
      );

      // Bỏ qua task quá hạn quá 30 ngày để tiết kiệm quota
      if (deadlineDate.getTime() < now.getTime() - (30 * 24 * 60 * 60 * 1000)) continue;

      var startTime = new Date(deadlineDate.getTime() - (60 * 60 * 1000)); // Bắt đầu trước 1 tiếng
      var eventTitle = '⏰ [DEADLINE] [' + maTask + '] ' + tenTask;

      // Kiểm tra xem sự kiện đã tồn tại trong khoảng thời gian này chưa để tránh tạo trùng
      var searchStart = new Date(deadlineDate.getTime() - (2 * 60 * 60 * 1000));
      var searchEnd = new Date(deadlineDate.getTime() + (2 * 60 * 60 * 1000));
      var existingEvents = calendar.getEvents(searchStart, searchEnd, { search: maTask });

      if (existingEvents.length === 0) {
        var description = '📌 CÔNG VIỆC: ' + tenTask + '\n' +
                          '📁 DỰ ÁN: ' + tenDuAn + '\n' +
                          '👤 PHỤ TRÁCH: ' + nguoiPhuTrach + '\n' +
                          '⏳ TRẠNG THÁI: ' + trangThai + '\n' +
                          '📝 GHI CHÚ: ' + ghiChu + '\n\n' +
                          'Đồng bộ tự động từ: ' + APP_TITLE;

        calendar.createEvent(eventTitle, startTime, deadlineDate, {
          description: description,
          location: 'Văn phòng / Online'
        });
        syncCount++;
      }
    }

    return {
      success: true,
      message: 'Đã đồng bộ thành công ' + syncCount + ' sự kiện deadline lên Google Calendar!',
      count: syncCount
    };
  } catch (err) {
    Logger.log('Lỗi sync Calendar: ' + err.toString());
    return {
      success: false,
      message: 'Lỗi khi đồng bộ Google Calendar: ' + err.toString(),
      count: 0
    };
  }
}

/**
 * =========================================================================================
 * 10. BỘ API GIAO TIẾP VỚI FRONTEND (RPC HANDLERS VỚI LOCKSERVICE 15S)
 * =========================================================================================
 */

/**
 * Helper sinh mã ID chuẩn: Tiền tố 4 ký tự + '-' + 6 chữ số ngẫu nhiên
 */
function generateEntityId(prefix) {
  var randomNum = Math.floor(100000 + Math.random() * 900000);
  return prefix + '-' + randomNum;
}

/**
 * API: Lưu hoặc Cập nhật Công việc (Task)
 */
function apiSaveTask(taskData) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_CONG_VIEC);
    if (!sheet) throw new Error('Không tìm thấy tab DB_CongViec');

    var maTask = (taskData.maTask || taskData['Mã Task'] || taskData.id || '').trim();
    var isNew = false;

    if (!maTask) {
      maTask = generateEntityId('TASK');
      isNew = true;
    }

    var nowStr = Utilities.formatDate(new Date(), 'GMT+7', 'dd/MM/yyyy HH:mm');
    var rowValues = [
      maTask,
      taskData.tenNhiemVu || taskData['Tên Nhiệm Vụ'] || taskData.name || taskData.title || '',
      taskData.maDuAn || taskData['Mã Dự Án'] || taskData.projectId || '',
      taskData.tenDuAn || taskData['Tên Dự Án'] || taskData.project || '',
      taskData.nguoiPhuTrach || taskData['Người Phụ Trách'] || taskData.assignee || '',
      taskData.emailNhanSu || taskData['Email Nhân Sự'] || taskData.email || '',
      taskData.capDo || taskData['Cấp Độ'] || taskData.priority || 'Bình thường',
      Number(taskData.trongSo || taskData['Trọng Số'] || taskData.weight) || 1,
      formatCellDate(taskData.ngayBatDau || taskData['Ngày Bắt Đầu'] || taskData.startDate),
      formatCellDate(taskData.deadline || taskData['Deadline'] || taskData.dueDate),
      formatCellTime(taskData.gioDeadline || taskData['Giờ Deadline'] || taskData.dueTime) || '17:30',
      Number(taskData.tienDo || taskData['Tiến Độ %'] || taskData.progress) || 0,
      taskData.trangThai || taskData['Trạng Thái'] || taskData.status || 'Chờ thực hiện',
      taskData.ghiChu || taskData['Ghi Chú'] || taskData.note || '',
      nowStr
    ];

    var lastRow = sheet.getLastRow();
    var targetRow = -1;

    if (!isNew && lastRow > 1) {
      var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (var i = 0; i < ids.length; i++) {
        if (String(ids[i][0]).trim() === maTask) {
          targetRow = i + 2;
          break;
        }
      }
    }

    if (targetRow > 1) {
      sheet.getRange(targetRow, 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
      targetRow = sheet.getLastRow();
      formatDataRangeRows(sheet, targetRow, 1, rowValues.length);
    }

    // Tự động tính toán lại tiến độ tổng của dự án tương ứng
    var pId = taskData.maDuAn || taskData['Mã Dự Án'] || taskData.projectId;
    if (pId) recalculateProjectProgress(ss, pId);

    // Cập nhật lại thống kê workload nhân sự
    recalculateStaffWorkload(ss);

    return {
      success: true,
      message: (isNew ? 'Tạo mới' : 'Cập nhật') + ' công việc thành công!',
      maTask: maTask
    };
  } catch (err) {
    Logger.log('Lỗi apiSaveTask: ' + err.toString());
    return { success: false, message: 'Lỗi: ' + err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * API: Bật/Tắt nhanh trạng thái hoàn thành của Task (Toggle Complete)
 */
function apiQuickToggleTask(maTask, isDone) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_CONG_VIEC);
    if (!sheet) throw new Error('Không tìm thấy tab DB_CongViec');

    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) throw new Error('Bảng công việc rỗng');

    var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    var targetRow = -1;

    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]).trim() === maTask) {
        targetRow = i + 2;
        break;
      }
    }

    if (targetRow === -1) throw new Error('Không tìm thấy mã công việc: ' + maTask);

    var isComplete = (isDone === true || isDone === 'true' || isDone === 'Hoàn thành');
    var newStatus = isComplete ? 'Hoàn thành' : 'Đang tiến hành';
    var newProgress = isComplete ? 100 : 50;
    var nowStr = Utilities.formatDate(new Date(), 'GMT+7', 'dd/MM/yyyy HH:mm');

    // Cập nhật Cột 12 (Tiến độ), Cột 13 (Trạng thái), Cột 15 (Cập nhật cuối)
    sheet.getRange(targetRow, 12).setValue(newProgress);
    sheet.getRange(targetRow, 13).setValue(newStatus);
    sheet.getRange(targetRow, 15).setValue(nowStr);

    // Tính lại tiến độ dự án
    var maDuAn = String(sheet.getRange(targetRow, 3).getValue()).trim();
    if (maDuAn) recalculateProjectProgress(ss, maDuAn);

    // Cập nhật lại thống kê workload nhân sự
    recalculateStaffWorkload(ss);

    return {
      success: true,
      message: 'Đã đổi trạng thái sang: ' + newStatus,
      newStatus: newStatus,
      status: newStatus,
      newProgress: newProgress,
      progress: newProgress
    };
  } catch (err) {
    Logger.log('Lỗi apiQuickToggleTask: ' + err.toString());
    return { success: false, message: 'Lỗi: ' + err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * API: Lưu hoặc Cập nhật Dự án (Project)
 */
function apiSaveProject(projData) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_DU_AN);
    if (!sheet) throw new Error('Không tìm thấy tab DB_DuAn');

    var maDuAn = (projData.maDuAn || projData['Mã Dự Án'] || projData.id || '').trim();
    var isNew = false;

    if (!maDuAn) {
      maDuAn = generateEntityId('DUAN');
      isNew = true;
    }

    var rowValues = [
      maDuAn,
      projData.tenDuAn || projData['Tên Dự Án'] || projData.name || projData.title || '',
      projData.phongBan || projData['Phòng Ban'] || projData.department || '',
      projData.nguoiQuanLy || projData['Người Quản Lý'] || projData.manager || '',
      projData.mucTieu || projData['Mục Tiêu'] || projData.goal || '',
      formatCellDate(projData.ngayBatDau || projData['Ngày Bắt Đầu'] || projData.startDate),
      formatCellDate(projData.hanHoanThanh || projData['Hạn Hoàn Thành'] || projData.endDate),
      Number(projData.nganSach || projData['Ngân Sách'] || projData.budget) || 0,
      projData.trangThai || projData['Trạng Thái'] || projData.status || 'Đang tiến hành',
      Number(projData.tienDoTong || projData['Tiến Độ Tổng %'] || projData.progress) || 0,
      projData.ghiChu || projData['Ghi Chú'] || projData.note || ''
    ];

    var lastRow = sheet.getLastRow();
    var targetRow = -1;

    if (!isNew && lastRow > 1) {
      var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (var i = 0; i < ids.length; i++) {
        if (String(ids[i][0]).trim() === maDuAn) {
          targetRow = i + 2;
          break;
        }
      }
    }

    if (targetRow > 1) {
      sheet.getRange(targetRow, 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
      targetRow = sheet.getLastRow();
      formatDataRangeRows(sheet, targetRow, 1, rowValues.length);
    }

    return {
      success: true,
      message: (isNew ? 'Tạo mới' : 'Cập nhật') + ' dự án thành công!',
      maDuAn: maDuAn
    };
  } catch (err) {
    Logger.log('Lỗi apiSaveProject: ' + err.toString());
    return { success: false, message: 'Lỗi: ' + err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * API: Lưu hoặc Cập nhật Nhân sự (Staff)
 */
function apiSaveStaff(staffData) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NHAN_SU);
    if (!sheet) throw new Error('Không tìm thấy tab DB_NhanSu');

    var maNhanSu = (staffData.maNhanSu || staffData['Mã Nhân Sự'] || staffData.id || '').trim();
    var isNew = false;

    if (!maNhanSu) {
      maNhanSu = generateEntityId('NHAN');
      isNew = true;
    }

    var rowValues = [
      maNhanSu,
      staffData.hoTen || staffData['Họ Và Tên'] || staffData.name || '',
      staffData.chucDanh || staffData['Chức Danh'] || staffData.role || staffData.title || '',
      staffData.capBac || staffData['Cấp Bậc'] || staffData.level || 'Mid',
      staffData.phongBan || staffData['Phòng Ban'] || staffData.department || '',
      staffData.soDienThoai || staffData['Số Điện Thoại'] || staffData.phone || '',
      staffData.googleEmail || staffData['Google Email'] || staffData.email || '',
      Number(staffData.taskDangLam || staffData['Task Đang Làm'] || staffData.activeTasks) || 0,
      Number(staffData.taskHoanThanh || staffData['Task Hoàn Thành'] || staffData.completedTasks) || 0,
      Number(staffData.tyLeDungHan || staffData['Tỷ Lệ Đúng Hạn %'] || staffData.onTimeRate) || 100,
      Number(staffData.hieuSuatThoiGian || staffData['Hiệu Suất Thời Gian %'] || staffData.efficiency) || 100,
      staffData.trangThai || staffData['Trạng Thái'] || staffData.status || 'Đang hoạt động'
    ];

    var lastRow = sheet.getLastRow();
    var targetRow = -1;

    if (!isNew && lastRow > 1) {
      var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (var i = 0; i < ids.length; i++) {
        if (String(ids[i][0]).trim() === maNhanSu) {
          targetRow = i + 2;
          break;
        }
      }
    }

    if (targetRow > 1) {
      sheet.getRange(targetRow, 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
      targetRow = sheet.getLastRow();
      formatDataRangeRows(sheet, targetRow, 1, rowValues.length);
    }

    return {
      success: true,
      message: (isNew ? 'Thêm mới' : 'Cập nhật') + ' hồ sơ nhân sự thành công!',
      maNhanSu: maNhanSu
    };
  } catch (err) {
    Logger.log('Lỗi apiSaveStaff: ' + err.toString());
    return { success: false, message: 'Lỗi: ' + err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * API: Cập nhật trực tiếp 1 ô trong Ma trận Checklist Tuần (Done / Not Yet)
 */
function apiUpdateChecklistCell(maLich, maNhanSu, dayKey, status) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_CHECKLIST);
    if (!sheet) throw new Error('Không tìm thấy tab DB_ChecklistLap');

    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) throw new Error('Bảng checklist trống');

    // Xác định cột tương ứng của ngày trong tuần (Thứ 2 = col 5, Thứ 3 = col 6...)
    var dayColMap = {
      'thu2': 5, 'Thứ 2': 5, 't2': 5, 'mon': 5, 'monday': 5, '2': 5,
      'thu3': 6, 'Thứ 3': 6, 't3': 6, 'tue': 6, 'tuesday': 6, '3': 6,
      'thu4': 7, 'Thứ 4': 7, 't4': 7, 'wed': 7, 'wednesday': 7, '4': 7,
      'thu5': 8, 'Thứ 5': 8, 't5': 8, 'thu': 8, 'thursday': 8, '5': 8,
      'thu6': 9, 'Thứ 6': 9, 't6': 9, 'fri': 9, 'friday': 9, '6': 9,
      'thu7': 10, 'Thứ 7': 10, 't7': 10, 'sat': 10, 'saturday': 10, '7': 10
    };

    var colIndex = dayColMap[dayKey];
    if (!colIndex) throw new Error('Ngày trong tuần không hợp lệ: ' + dayKey);

    var rawData = sheet.getRange(2, 1, lastRow - 1, 12).getValues();
    var targetRow = -1;

    for (var i = 0; i < rawData.length; i++) {
      var row = rawData[i];
      if (String(row[0]).trim() === maLich && String(row[2]).trim() === maNhanSu) {
        targetRow = i + 2;
        break;
      }
    }

    if (targetRow === -1) throw new Error('Không tìm thấy dòng checklist của lịch ' + maLich + ' và nhân sự ' + maNhanSu);

    // Cập nhật giá trị ô ngày
    sheet.getRange(targetRow, colIndex).setValue(status);

    // Tính lại Tỷ Lệ Tuần % (Cột 11)
    var updatedWeekRow = sheet.getRange(targetRow, 5, 1, 6).getValues()[0];
    var doneCount = 0;
    var totalActiveDays = 0;

    for (var d = 0; d < updatedWeekRow.length; d++) {
      var val = String(updatedWeekRow[d]).trim();
      if (val !== '-') {
        totalActiveDays++;
        if (val === 'Done') doneCount++;
      }
    }

    var newRateStr = totalActiveDays > 0 ? Math.round((doneCount / totalActiveDays) * 100) + '%' : '0%';
    sheet.getRange(targetRow, 11).setValue(newRateStr);

    return {
      success: true,
      message: 'Cập nhật checklist thành công!',
      newRate: newRateStr,
      status: status
    };
  } catch (err) {
    Logger.log('Lỗi apiUpdateChecklistCell: ' + err.toString());
    return { success: false, message: 'Lỗi: ' + err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * API: Xóa Công việc
 */
function apiDeleteTask(maTask) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_CONG_VIEC);
    if (!sheet) throw new Error('Không tìm thấy tab DB_CongViec');

    var lastRow = sheet.getLastRow();
    for (var i = 2; i <= lastRow; i++) {
      if (String(sheet.getRange(i, 1).getValue()).trim() === maTask) {
        var pId = String(sheet.getRange(i, 3).getValue()).trim();
        sheet.deleteRow(i);
        if (pId) recalculateProjectProgress(ss, pId);
        recalculateStaffWorkload(ss);
        return { success: true, message: 'Đã xóa công việc: ' + maTask };
      }
    }
    return { success: false, message: 'Không tìm thấy công việc để xóa' };
  } catch (err) {
    return { success: false, message: 'Lỗi: ' + err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * API: Xóa Dự án
 */
function apiDeleteProject(maDuAn) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_DU_AN);
    if (!sheet) throw new Error('Không tìm thấy tab DB_DuAn');

    var lastRow = sheet.getLastRow();
    for (var i = 2; i <= lastRow; i++) {
      if (String(sheet.getRange(i, 1).getValue()).trim() === maDuAn) {
        sheet.deleteRow(i);
        return { success: true, message: 'Đã xóa dự án: ' + maDuAn };
      }
    }
    return { success: false, message: 'Không tìm thấy dự án để xóa' };
  } catch (err) {
    return { success: false, message: 'Lỗi: ' + err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * API: Xóa Nhân sự
 */
function apiDeleteStaff(maNhanSu) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NHAN_SU);
    if (!sheet) throw new Error('Không tìm thấy tab DB_NhanSu');

    var lastRow = sheet.getLastRow();
    for (var i = 2; i <= lastRow; i++) {
      if (String(sheet.getRange(i, 1).getValue()).trim() === maNhanSu) {
        sheet.deleteRow(i);
        return { success: true, message: 'Đã xóa nhân sự: ' + maNhanSu };
      }
    }
    return { success: false, message: 'Không tìm thấy nhân sự để xóa' };
  } catch (err) {
    return { success: false, message: 'Lỗi: ' + err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Helper tính toán lại % tiến độ của Dự Án dựa trên danh sách Task thuộc Dự Án đó
 */
function recalculateProjectProgress(ss, maDuAn) {
  if (!maDuAn) return;
  try {
    var taskSheet = ss.getSheetByName(SHEET_CONG_VIEC);
    var projSheet = ss.getSheetByName(SHEET_DU_AN);
    if (!taskSheet || !projSheet) return;

    var lastTaskRow = taskSheet.getLastRow();
    if (lastTaskRow <= 1) return;

    var taskData = taskSheet.getRange(2, 3, lastTaskRow - 1, 10).getValues(); // Cột 3: Mã DA, Cột 12: Tiến Độ
    var totalProgress = 0;
    var taskCount = 0;

    for (var i = 0; i < taskData.length; i++) {
      var row = taskData[i];
      if (String(row[0]).trim() === maDuAn) {
        taskCount++;
        totalProgress += Number(row[9]) || 0;
      }
    }

    var avgProgress = taskCount > 0 ? Math.round(totalProgress / taskCount) : 0;

    // Tìm và cập nhật cột 10 (Tiến độ tổng) trong tab DB_DuAn
    var lastProjRow = projSheet.getLastRow();
    if (lastProjRow > 1) {
      var projIds = projSheet.getRange(2, 1, lastProjRow - 1, 1).getValues();
      for (var p = 0; p < projIds.length; p++) {
        if (String(projIds[p][0]).trim() === maDuAn) {
          projSheet.getRange(p + 2, 10).setValue(avgProgress);
          break;
        }
      }
    }
  } catch (e) {
    Logger.log('Lỗi tính lại tiến độ dự án: ' + e.toString());
  }
}

/**
 * Helper cập nhật số task đang làm và đã hoàn thành của nhân sự
 */
function recalculateStaffWorkload(ss) {
  try {
    var taskSheet = ss.getSheetByName(SHEET_CONG_VIEC);
    var staffSheet = ss.getSheetByName(SHEET_NHAN_SU);
    if (!taskSheet || !staffSheet) return;

    var lastTaskRow = taskSheet.getLastRow();
    var lastStaffRow = staffSheet.getLastRow();
    if (lastStaffRow <= 1) return;

    var staffCounts = {};
    if (lastTaskRow > 1) {
      var tasks = taskSheet.getRange(2, 5, lastTaskRow - 1, 9).getValues(); // Cột 5: Người phụ trách, Cột 13: Trạng thái
      for (var t = 0; t < tasks.length; t++) {
        var assignee = String(tasks[t][0] || '').trim();
        var status = String(tasks[t][8] || '').trim();
        if (!assignee) continue;
        if (!staffCounts[assignee]) staffCounts[assignee] = { active: 0, completed: 0 };
        if (status === 'Hoàn thành') {
          staffCounts[assignee].completed++;
        } else {
          staffCounts[assignee].active++;
        }
      }
    }

    var staffData = staffSheet.getRange(2, 2, lastStaffRow - 1, 8).getValues(); // Cột 2: Họ tên, Cột 8: Active, Cột 9: Completed
    for (var s = 0; s < staffData.length; s++) {
      var name = String(staffData[s][0] || '').trim();
      var counts = staffCounts[name] || { active: 0, completed: 0 };
      staffSheet.getRange(s + 2, 8).setValue(counts.active);
      staffSheet.getRange(s + 2, 9).setValue(counts.completed);
    }
  } catch (err) {
    Logger.log('Lỗi recalculateStaffWorkload: ' + err.toString());
  }
}

/**
 * =========================================================================================
 * 11. BỘ API QUẢN TRỊ DANH MỤC HỆ THỐNG (DB_DanhMuc)
 * =========================================================================================
 */

/**
 * API: Lưu hoặc Cập nhật Mục Danh Mục Hệ Thống (DB_DanhMuc)
 * Đảm bảo cơ chế LockService 15s và ánh xạ dual-header Tiếng Việt + camelCase
 */
function apiSaveCatalogItem(itemData) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_DANH_MUC);
    if (!sheet) throw new Error('Không tìm thấy tab DB_DanhMuc');

    var nhom = String(itemData.nhom || itemData['Nhóm'] || itemData.group || 'Phòng Ban').trim();
    var maDanhMuc = String(itemData.maDanhMuc || itemData['Mã Danh Mục'] || itemData.code || itemData.id || '').trim();
    var tenDanhMuc = String(itemData.tenDanhMuc || itemData['Tên Danh Mục'] || itemData.name || itemData.label || '').trim();
    var mauSac = String(itemData.mauSac || itemData['Màu Sắc / Mã CSS'] || itemData.color || '#64748b').trim();
    var thuTu = Number(itemData.thuTu !== undefined ? itemData.thuTu : (itemData['Thứ Tự'] !== undefined ? itemData['Thứ Tự'] : (itemData.order !== undefined ? itemData.order : 1))) || 1;
    var ghiChu = String(itemData.ghiChu || itemData['Ghi Chú'] || itemData.note || '').trim();

    if (!tenDanhMuc) throw new Error('Tên danh mục không được để trống');

    var isNew = false;
    if (!maDanhMuc) {
      maDanhMuc = generateEntityId('CATG');
      isNew = true;
    }

    // Chống Formula Injection: Nếu chuỗi bắt đầu bằng =, +, -, @ thì thêm ' để Google Sheets lưu text thuần
    var rowValues = [nhom, maDanhMuc, tenDanhMuc, mauSac, thuTu, ghiChu].map(function(val) {
      if (typeof val === 'string' && /^[=+\-@]/.test(val)) {
        return val.replace(/^([=+\-@])/, "'$1");
      }
      return val;
    });
    var lastRow = sheet.getLastRow();
    var targetRow = -1;

    // Tìm kiếm xem mã danh mục đã tồn tại chưa (Cột 2: Mã Danh Mục)
    if (!isNew && lastRow > 1) {
      var ids = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
      for (var i = 0; i < ids.length; i++) {
        if (String(ids[i][0]).trim().toUpperCase() === maDanhMuc.toUpperCase()) {
          targetRow = i + 2;
          break;
        }
      }
    }

    if (targetRow > 1) {
      sheet.getRange(targetRow, 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      isNew = true;
      sheet.appendRow(rowValues);
      targetRow = sheet.getLastRow();
      formatDataRangeRows(sheet, targetRow, 1, rowValues.length);
    }

    return {
      success: true,
      message: (isNew ? 'Thêm mới' : 'Cập nhật') + ' danh mục thành công!',
      maDanhMuc: maDanhMuc
    };
  } catch (err) {
    Logger.log('Lỗi apiSaveCatalogItem: ' + err.toString());
    return { success: false, message: 'Lỗi: ' + err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * API: Xóa Mục Danh Mục Khỏi DB_DanhMuc
 * Có bảo vệ LockService 15s
 */
function apiDeleteCatalogItem(maDanhMuc) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_DANH_MUC);
    if (!sheet) throw new Error('Không tìm thấy tab DB_DanhMuc');

    var targetId = String(maDanhMuc || '').trim().toUpperCase();
    if (!targetId) throw new Error('Mã danh mục không hợp lệ');

    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      var ids = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
      for (var i = 0; i < ids.length; i++) {
        if (String(ids[i][0]).trim().toUpperCase() === targetId) {
          sheet.deleteRow(i + 2);
          return { success: true, message: 'Đã xóa danh mục: ' + maDanhMuc };
        }
      }
    }
    return { success: false, message: 'Không tìm thấy danh mục để xóa' };
  } catch (err) {
    Logger.log('Lỗi apiDeleteCatalogItem: ' + err.toString());
    return { success: false, message: 'Lỗi: ' + err.toString() };
  } finally {
    lock.releaseLock();
  }
}
