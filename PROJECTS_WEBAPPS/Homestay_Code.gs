/**
 * ==============================================================================
 * HỆ THỐNG QUẢN LÝ HOMESTAY & KHÁCH SẠN MINI (AIRBNB / SHORT-STAY)
 * Phiên bản: Master Standard V2.4 — FILE ĐI LÀM
 * Nền tảng: Google Apps Script + Google Sheets (System of Record)
 * Mô hình: Single Visible Tab Policy (Chỉ hiện HDSD, khóa & ẩn toàn bộ DB_)
 * ==============================================================================
 */

const APP_TITLE = 'QUẢN LÝ HOMESTAY VÀ KHÁCH SẠN — ĐẶT PHÒNG VÀ THU CHI — WEB APP v1.0 — FILE ĐI LÀM';
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbz_REPLACE_WITH_YOUR_DEPLOYMENT_URL/exec';

const SHEET_NAMES = {
  ROOMS: 'DB_Phong',
  BOOKINGS: 'DB_DatPhong',
  GUESTS: 'DB_KhachLuuTru',
  SERVICES: 'DB_DichVuPhong',
  TRANSACTIONS: 'DB_ThuChi',
  CATALOG: 'DB_DanhMucDichVu',
  CHANNELS: 'DB_KenhBan',
  SETTINGS: 'DB_CaiDat',
  HDSD: 'HDSD'
};

/**
 * 1. Entry point phục vụ Web App
 */
function doGet(e) {
  // TỰ ĐỘNG KHỞI TẠO TOÀN BỘ 12 PHÒNG & SHEET NGAY KHI MỞ LINK /EXEC
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var shRooms = ss.getSheetByName(SHEET_NAMES.ROOMS);
    if (!shRooms || shRooms.getLastRow() <= 1) {
      setupDatabaseSheets();
    }
  } catch(err) {
    // Không chặn doGet nếu có lỗi
  }

  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle(APP_TITLE)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * 2. Menu tự động khi mở Google Sheet
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('File Đi Làm')
    .addItem('Mở Ứng Dụng Quản Lý Homestay', 'openWebApp')
    .addSeparator()
    .addItem('Khởi tạo / Cập nhật Database', 'setupDatabaseSheets')
    .addItem('Khóa & Ẩn Database (Bảo vệ dữ liệu)', 'lockAndHideDatabaseSheets')
    .addToUi();

  // Tự động kiểm tra và cập nhật tên Sheet khớp phiên bản
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const currentName = ss.getName();
    if (currentName !== APP_TITLE && !currentName.startsWith('Bản sao của')) {
      ss.rename(APP_TITLE);
    }
  } catch (e) {
    // ignore
  }
}

/**
 * Mở Web App dialog nhanh
 */
function openWebApp() {
  const html = HtmlService.createHtmlOutput(
    '<div style="font-family:system-ui,sans-serif;padding:16px;text-align:center;">' +
    '<h3 style="color:#059669;margin-bottom:8px;">Hệ Thống Quản Lý Homestay & Khách Sạn</h3>' +
    '<p style="color:#475569;font-size:13px;margin-bottom:16px;">Ứng dụng quản lý đặt phòng, dọn buồng & thu chi tự động</p>' +
    '<a href="' + WEB_APP_URL + '" target="_blank" style="display:inline-block;background:#059669;color:#fff;padding:10px 20px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">BẤM VÀO ĐÂY ĐỂ MỞ ỨNG DỤNG</a>' +
    '</div>'
  ).setWidth(380).setHeight(160);
  SpreadsheetApp.getUi().showModalDialog(html, 'Đang mở ứng dụng...');
}

/**
 * QUY TẮC SINGLE VISIBLE TAB:
 * Khóa và ẩn toàn bộ tab DB_, chỉ để lại tab HDSD hiển thị với Nút mở Mint tại B2:D3
 */
function lockAndHideDatabaseSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  
  // Đảm bảo có tab HDSD
  let hdsdSheet = ss.getSheetByName(SHEET_NAMES.HDSD);
  if (!hdsdSheet) {
    hdsdSheet = ss.insertSheet(SHEET_NAMES.HDSD, 0);
  }
  hdsdSheet.showSheet();
  setupHdsdSheet_(hdsdSheet);

  sheets.forEach(sh => {
    const name = sh.getName();
    if (name.startsWith('DB_')) {
      sh.hideSheet();
      try {
        const protections = sh.getProtections(SpreadsheetApp.ProtectionType.SHEET);
        if (protections.length === 0) {
          const p = sh.protect().setDescription('Khóa bảo vệ Database FILE ĐI LÀM');
          p.setWarningOnly(true);
        }
      } catch (e) {}
    }
  });

  ss.setActiveSheet(hdsdSheet);
  return { success: true, message: 'Đã bảo vệ và ẩn các tab Database thành công!' };
}

/**
 * Setup giao diện tab HDSD chuẩn mực
 */
function setupHdsdSheet_(sh) {
  sh.setTabColor('#059669');
  sh.clear();
  sh.setColumnWidth(1, 40);
  sh.setColumnWidth(2, 140);
  sh.setColumnWidth(3, 140);
  sh.setColumnWidth(4, 140);
  sh.setColumnWidth(5, 260);

  // Nút mở Web App tại B2:D3
  const btnRange = sh.getRange('B2:D3');
  btnRange.merge();
  btnRange.setBackground('#059669');
  btnRange.setFontColor('#FFFFFF');
  btnRange.setFontWeight('bold');
  btnRange.setFontSize(13);
  btnRange.setHorizontalAlignment('center');
  btnRange.setVerticalAlignment('middle');
  btnRange.setValue('MỞ ỨNG DỤNG WEB APP (BẤM VÀO ĐÂY)');

  // Tiêu đề & Hướng dẫn
  sh.getRange('B5').setValue('HỆ THỐNG QUẢN LÝ HOMESTAY / KHÁCH SẠN MINI / AIRBNB — FILE ĐI LÀM').setFontWeight('bold').setFontSize(14).setFontColor('#0f172a');
  sh.getRange('B6').setValue('Phiên bản: Master Standard V2.4 | Nền tảng Monolithic Single Page Application').setFontColor('#64748b').setFontSize(10);

  const steps = [
    ['Bước 1:', 'Khai báo danh sách phòng, giá phòng (theo giờ/ngày/đêm) và số tài khoản VietQR tại mục Cài đặt.'],
    ['Bước 2:', 'Thực hiện đặt phòng, check-in, check-out và cập nhật trạng thái buồng phòng (Trống sạch / Trống dơ / Đang dọn).'],
    ['Bước 3:', 'Kiểm soát dòng tiền mặt, chuyển khoản ngân hàng và xem báo cáo công suất phòng theo thời gian thực.'],
    ['Lưu ý quan trọng:', 'Mọi thao tác dữ liệu được thực hiện 100% trên Web App. Các tab dữ liệu DB_ đã được ẩn và bảo vệ để chống xóa nhầm.']
  ];

  for (let i = 0; i < steps.length; i++) {
    const row = 8 + i * 2;
    sh.getRange(row, 2).setValue(steps[i][0]).setFontWeight('bold').setFontColor('#059669');
    sh.getRange(row, 3, 1, 3).merge().setValue(steps[i][1]).setFontColor('#334155').setWrap(true);
  }
}

/**
 * 3. Khởi tạo toàn bộ Database Sheets & Dữ liệu mẫu ban đầu
 */
function setupDatabaseSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const schemas = [
    {
      name: SHEET_NAMES.ROOMS,
      headers: ['Mã phòng', 'Tên phòng', 'Loại phòng', 'Tầng', 'Giá theo giờ', 'Giá qua đêm', 'Giá ngày thường', 'Giá cuối tuần', 'Trạng thái', 'Mã booking hiện tại'],
      initialRows: [
        ['PHNG-101001', 'Phòng 101', 'Phòng Đơn Standard', 'Tầng 1', 120000, 350000, 450000, 550000, 'Trống sạch', ''],
        ['PHNG-101002', 'Phòng 102', 'Phòng Đôi Superior', 'Tầng 1', 150000, 450000, 600000, 700000, 'Đang có khách', 'BOOK-839201'],
        ['PHNG-101003', 'Phòng 103', 'Phòng Đôi Ban Công', 'Tầng 1', 180000, 550000, 750000, 850000, 'Trống dơ', ''],
        ['PHNG-101004', 'Phòng 104', 'Phòng Gia Đình Deluxe', 'Tầng 1', 220000, 700000, 950000, 1100000, 'Đang có khách', 'BOOK-839204'],
        ['PHNG-201001', 'Phòng 201', 'Phòng Đơn Standard', 'Tầng 2', 120000, 350000, 450000, 550000, 'Đang có khách', 'BOOK-839205'],
        ['PHNG-201002', 'Phòng 202', 'Phòng Đôi Superior', 'Tầng 2', 150000, 450000, 600000, 700000, 'Đang dọn', ''],
        ['PHNG-201003', 'Phòng 203', 'Phòng Đôi Ban Công View Phố', 'Tầng 2', 190000, 580000, 800000, 950000, 'Đang có khách', 'BOOK-839206'],
        ['PHNG-201004', 'Phòng 204', 'Phòng VIP Căn Hộ', 'Tầng 2', 250000, 800000, 1100000, 1300000, 'Trống sạch', ''],
        ['PHNG-301001', 'Phòng 301', 'Studio Penthouse Terrace', 'Tầng 3', 280000, 950000, 1350000, 1600000, 'Đang có khách', 'BOOK-839207'],
        ['PHNG-301002', 'Phòng 302', 'Phòng Đôi View Biển', 'Tầng 3', 200000, 600000, 850000, 1050000, 'Trống dơ', ''],
        ['PHNG-301003', 'Phòng 303', 'Phòng Gia Đình 2 Giường Lớn', 'Tầng 3', 240000, 750000, 1050000, 1250000, 'Trống sạch', ''],
        ['PHNG-301004', 'Phòng 304', 'Phòng Đơn Standard', 'Tầng 3', 120000, 350000, 450000, 550000, 'Bảo trì', '']
      ]
    },
    {
      name: SHEET_NAMES.BOOKINGS,
      headers: ['Mã booking', 'Mã phòng', 'Tên phòng', 'Khách hàng', 'SĐT', 'CCCD/Passport', 'Kênh bán', 'Hình thức', 'Check-in dự kiến', 'Check-in thực tế', 'Check-out dự kiến', 'Check-out thực tế', 'Tiền phòng', 'Phụ thu sớm', 'Phụ thu trễ', 'Tiền dịch vụ', 'Tiền cọc', 'Giảm giá', 'Tổng cộng', 'Đã thu', 'Còn nợ', 'Trạng thái', 'Ghi chú'],
      initialRows: [
        ['BOOK-839201', 'PHNG-101002', 'Phòng 102', 'Nguyễn Văn An', '0905111222', '079201001234', 'Airbnb', 'Theo ngày', '09/11/2026 14:00', '09/11/2026 13:30', '11/11/2026 12:00', '', 1200000, 0, 0, 65000, 500000, 0, 1265000, 500000, 765000, 'Đang ở', 'Khách nước ngoài, cần hóa đơn VAT'],
        ['BOOK-839202', 'PHNG-101003', 'Phòng 103', 'Trần Thị Bình', '0938222333', '079201002345', 'Trực tiếp', 'Theo ngày', '08/11/2026 14:00', '08/11/2026 14:10', '09/11/2026 12:00', '09/11/2026 12:15', 750000, 0, 0, 40000, 0, 0, 790000, 790000, 0, 'Đã trả', 'Đã check-out trưa nay, chuyển dọn phòng'],
        ['BOOK-839203', 'PHNG-101001', 'Phòng 101', 'Lê Hữu Cường', '0910275834', '079201003456', 'Booking.com', 'Theo ngày', '09/11/2026 14:00', '', '10/11/2026 12:00', '', 450000, 0, 0, 0, 0, 0, 450000, 0, 450000, 'Đặt trước', 'Khách báo đến muộn khoảng 19h tối'],
        ['BOOK-839204', 'PHNG-101004', 'Phòng 104', 'Phạm Minh Dũng', '0988777666', '079201004567', 'Agoda', 'Theo ngày', '08/11/2026 14:00', '08/11/2026 15:00', '10/11/2026 12:00', '', 1900000, 0, 0, 95000, 1000000, 0, 1995000, 1000000, 995000, 'Đang ở', 'Gia đình 4 người'],
        ['BOOK-839205', 'PHNG-201001', 'Phòng 201', 'Hoàng Ngọc Giang', '0977665544', '079201005678', 'Trực tiếp', 'Qua đêm', '08/11/2026 21:00', '08/11/2026 21:30', '09/11/2026 12:00', '', 350000, 0, 0, 20000, 200000, 0, 370000, 200000, 170000, 'Đang ở', 'Sắp check-out trưa nay'],
        ['BOOK-839206', 'PHNG-201003', 'Phòng 203', 'David Smith', '0912345678', 'P9823412', 'Airbnb', 'Theo ngày', '07/11/2026 14:00', '07/11/2026 13:45', '12/11/2026 12:00', '', 4000000, 0, 0, 300000, 2000000, 0, 4300000, 2000000, 2300000, 'Đang ở', 'Khách Úc thuê thêm xe máy 2 ngày'],
        ['BOOK-839207', 'PHNG-301001', 'Phòng 301', 'Vũ Thu Khánh', '0903889900', '079201006789', 'Fanpage / Zalo', 'Theo ngày', '09/11/2026 14:00', '09/11/2026 10:30', '11/11/2026 12:00', '', 2700000, 405000, 0, 50000, 1000000, 0, 3155000, 1405000, 1750000, 'Đang ở', 'Check-in sớm 10h30 (tính +30% ngày)'],
        ['BOOK-839208', 'PHNG-201004', 'Phòng 204', 'Đặng Văn Lâm', '0933445566', '079201007890', 'Hotline', 'Theo ngày', '09/11/2026 15:00', '', '10/11/2026 12:00', '', 1100000, 0, 0, 0, 500000, 0, 1100000, 500000, 600000, 'Đặt trước', 'Cần chuẩn bị phòng sạch trước 15:00'],
        ['BOOK-839209', 'PHNG-301003', 'Phòng 303', 'Phan Quang Hùng', '0944556677', '079201008901', 'Airbnb', 'Theo ngày', '10/11/2026 14:00', '', '13/11/2026 12:00', '', 3150000, 0, 0, 0, 1500000, 0, 3150000, 1500000, 1650000, 'Đặt trước', 'Đặt trước 3 đêm ngày mai tới']
      ]
    },
    {
      name: SHEET_NAMES.GUESTS,
      headers: ['Mã khách', 'Họ tên', 'Số điện thoại', 'CCCD/Passport', 'Quốc tịch', 'Số lần ở', 'Tổng chi tiêu', 'Ghi chú'],
      initialRows: [
        ['KHLU-839201', 'Nguyễn Văn An', '0905111222', '079201001234', 'Việt Nam', 3, 4250000, 'Khách thân thiết, thích tầng 1'],
        ['KHLU-839202', 'Trần Thị Bình', '0938222333', '079201002345', 'Việt Nam', 2, 1850000, 'Khách công tác'],
        ['KHLU-839203', 'Lê Hữu Cường', '0910275834', '079201003456', 'Việt Nam', 1, 450000, 'Đặt qua Booking.com'],
        ['KHLU-839204', 'Phạm Minh Dũng', '0988777666', '079201004567', 'Việt Nam', 1, 1995000, 'Gia đình'],
        ['KHLU-839205', 'Hoàng Ngọc Giang', '0977665544', '079201005678', 'Việt Nam', 2, 750000, 'Khách đi đêm'],
        ['KHLU-839206', 'David Smith', '0912345678', 'P9823412', 'Australia', 1, 4300000, 'Passport còn hạn 2029'],
        ['KHLU-839207', 'Vũ Thu Khánh', '0903889900', '079201006789', 'Việt Nam', 4, 8500000, 'Khách VIP'],
        ['KHLU-839208', 'Đặng Văn Lâm', '0933445566', '079201007890', 'Việt Nam', 1, 1100000, 'Đặt hotline'],
        ['KHLU-839209', 'Phan Quang Hùng', '0944556677', '079201008901', 'Việt Nam', 2, 5200000, 'Airbnb']
      ]
    },
    {
      name: SHEET_NAMES.SERVICES,
      headers: ['Mã DV', 'Mã booking', 'Mã phòng', 'Tên dịch vụ', 'Số lượng', 'Đơn giá', 'Thành tiền', 'Thời gian thêm'],
      initialRows: [
        ['DVPG-109281', 'BOOK-839201', 'PHNG-101002', 'Nước suối Dasani 500ml', 3, 15000, 45000, '09/11/2026 15:30'],
        ['DVPG-109282', 'BOOK-839201', 'PHNG-101002', 'Mì ly Omachi', 1, 20000, 20000, '09/11/2026 18:00'],
        ['DVPG-109283', 'BOOK-839202', 'PHNG-101003', 'Nước ngọt Coca / Pepsi', 2, 20000, 40000, '08/11/2026 20:00'],
        ['DVPG-109284', 'BOOK-839204', 'PHNG-101004', 'Bia Heineken / Tiger', 3, 25000, 75000, '08/11/2026 19:30'],
        ['DVPG-109285', 'BOOK-839204', 'PHNG-101004', 'Mì ly Omachi', 1, 20000, 20000, '09/11/2026 07:30'],
        ['DVPG-109286', 'BOOK-839206', 'PHNG-201003', 'Thuê xe máy tay ga', 2, 150000, 300000, '08/11/2026 08:00']
      ]
    },
    {
      name: SHEET_NAMES.TRANSACTIONS,
      headers: ['Mã GD', 'Ngày giờ', 'Loại', 'Hạng mục', 'Số tiền', 'Phương thức', 'Mã booking', 'Ghi chú'],
      initialRows: [
        ['GDTC-582910', '07/11/2026 14:15', 'Thu', 'Tiền cọc đặt phòng', 2000000, 'Chuyển khoản VietQR', 'BOOK-839206', 'Khách Úc chuyển cọc'],
        ['GDTC-582911', '08/11/2026 09:30', 'Thu', 'Tiền cọc đặt phòng', 1000000, 'Chuyển khoản VietQR', 'BOOK-839204', 'Cọc phòng 104'],
        ['GDTC-582912', '08/11/2026 11:00', 'Chi', 'Mua sắm buồng phòng', 450000, 'Tiền mặt', '', 'Mua khăn tắm mới, bàn chải đánh răng'],
        ['GDTC-582913', '08/11/2026 14:20', 'Thu', 'Tiền phòng', 750000, 'Chuyển khoản VietQR', 'BOOK-839202', 'Thanh toán nhận phòng 103'],
        ['GDTC-582914', '08/11/2026 17:00', 'Chi', 'Bảo dưỡng sửa chữa', 300000, 'Tiền mặt', '', 'Sửa vòi sen phòng 304'],
        ['GDTC-582915', '08/11/2026 21:40', 'Thu', 'Tiền cọc đặt phòng', 200000, 'Tiền mặt', 'BOOK-839205', 'Khách vào ở qua đêm cọc trước'],
        ['GDTC-582916', '09/11/2026 10:45', 'Thu', 'Tiền phòng & Phụ thu sớm', 1405000, 'Chuyển khoản VietQR', 'BOOK-839207', 'Khách check-in sớm 10h30 phòng 301'],
        ['GDTC-582917', '09/11/2026 12:20', 'Thu', 'Thanh toán trả phòng (Check-out)', 40000, 'Tiền mặt', 'BOOK-839202', 'Thu tiền nước ngọt minibar phòng 103'],
        ['GDTC-582918', '09/11/2026 13:40', 'Thu', 'Tiền cọc đặt phòng', 500000, 'Chuyển khoản VietQR', 'BOOK-839201', 'Khách nhận phòng 102']
      ]
    },
    {
      name: SHEET_NAMES.CATALOG,
      headers: ['Mã món', 'Tên dịch vụ / Minibar', 'Đơn vị tính', 'Giá bán', 'Giá vốn', 'Trạng thái'],
      initialRows: [
        ['MENU-102901', 'Nước suối Dasani 500ml', 'Chai', 15000, 6000, 'Đang bán'],
        ['MENU-102902', 'Nước ngọt Coca / Pepsi / 7Up', 'Lon', 20000, 10000, 'Đang bán'],
        ['MENU-102903', 'Bia Heineken / Tiger Silver', 'Lon', 25000, 16000, 'Đang bán'],
        ['MENU-102904', 'Mì ly Omachi / Hảo Hảo', 'Ly', 20000, 11000, 'Đang bán'],
        ['MENU-102905', 'Giặt sấy quần áo lấy liền', 'Kg', 30000, 12000, 'Đang bán'],
        ['MENU-102906', 'Thuê xe máy tay ga (Vision / AirBlade)', 'Ngày', 150000, 100000, 'Đang bán'],
        ['MENU-102907', 'Đưa đón sân bay 4 chỗ', 'Chuyến', 180000, 130000, 'Đang bán'],
        ['MENU-102908', 'Kê thêm nệm phụ (Extra bed)', 'Đêm', 120000, 30000, 'Đang bán']
      ]
    },
    {
      name: SHEET_NAMES.CHANNELS,
      headers: ['Mã kênh', 'Tên kênh đặt phòng', 'Hoa hồng %', 'Ghi chú'],
      initialRows: [
        ['KENH-1001', 'Khách trực tiếp / Hotline', 0, 'Khách vãng lai gọi điện hoặc đến thẳng'],
        ['KENH-1002', 'Airbnb', 15, 'Khách quốc tế & khách du lịch'],
        ['KENH-1003', 'Booking.com', 15, 'Khách đặt online thanh toán tại quầy'],
        ['KENH-1004', 'Agoda', 18, 'Khách trả trước online'],
        ['KENH-1005', 'Fanpage / Zalo', 0, 'Khách quen giới thiệu']
      ]
    },
    {
      name: SHEET_NAMES.SETTINGS,
      headers: ['Khóa', 'Giá trị', 'Mô tả'],
      initialRows: [
        ['APP_NAME', 'MIA HOMESTAY & APARTMENTS', 'Tên cơ sở lưu trú'],
        ['ADDRESS', 'Số 123 Đường Ven Biển, Quận Sơn Trà, Đà Nẵng', 'Địa chỉ cơ sở'],
        ['HOTLINE', '0905111222', 'Số điện thoại lễ tân / chủ'],
        ['STANDARD_CHECKIN', '14:00', 'Giờ check-in tiêu chuẩn'],
        ['STANDARD_CHECKOUT', '12:00', 'Giờ check-out tiêu chuẩn'],
        ['EARLY_CHECKIN_RULES', 'BEFORE_9AM:50|9AM_12PM:30', 'Quy tắc phụ thu nhận sớm (%)'],
        ['LATE_CHECKOUT_RULES', '12PM_3PM:30|3PM_6PM:50|AFTER_6PM:100', 'Quy tắc phụ thu trả trễ (%)'],
        ['BANK_NAME', 'MBBank', 'Tên ngân hàng nhận VietQR'],
        ['BANK_ACCOUNT', '0905111222', 'Số tài khoản nhận tiền'],
        ['BANK_ACCOUNT_NAME', 'NGUYEN VAN CHU', 'Tên chủ tài khoản'],
        ['TRANSFER_SYNTAX', '{room} {booking} TT', 'Cú pháp chuyển khoản chuẩn ngân hàng']
      ]
    }
  ];

  schemas.forEach(schema => {
    let sh = ss.getSheetByName(schema.name);
    if (!sh) {
      sh = ss.insertSheet(schema.name);
    }
    sh.clear();
    sh.getRange(1, 1, 1, schema.headers.length)
      .setValues([schema.headers])
      .setBackground('#059669')
      .setFontColor('#FFFFFF')
      .setFontWeight('bold');
    
    if (schema.initialRows.length > 0) {
      sh.getRange(2, 1, schema.initialRows.length, schema.headers.length)
        .setValues(schema.initialRows);
    }
    sh.setFrozenRows(1);
  });

  // Ẩn nhanh các tab DB_ (không gọi protect nặng nề để trả về ngay trong 1 giây)
  schemas.forEach(function(s) {
    try {
      var sh = ss.getSheetByName(s.name);
      if (sh) sh.hideSheet();
    } catch(e) {}
  });

  // Đảm bảo tab HDSD hiển thị
  try {
    var hdsd = ss.getSheetByName(SHEET_NAMES.HDSD);
    if (!hdsd) hdsd = ss.insertSheet(SHEET_NAMES.HDSD, 0);
    hdsd.showSheet();
    setupHdsdSheet_(hdsd);
    ss.setActiveSheet(hdsd);
  } catch(e) {}

  return { success: true, message: 'Khởi tạo cấu trúc Database Homestay thành công!' };
}

/**
 * 4. Đọc toàn bộ dữ liệu 1 lần duy nhất cho Client (Single Round-Trip RPC)
 */
function getInitialData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    var shRooms = ss.getSheetByName(SHEET_NAMES.ROOMS);
    if (!shRooms || shRooms.getLastRow() <= 1) {
      setupDatabaseSheets();
      shRooms = ss.getSheetByName(SHEET_NAMES.ROOMS);
    }
    
    var roomsData = readSheetToObjects_(ss, SHEET_NAMES.ROOMS);
    var bookingsData = readSheetToObjects_(ss, SHEET_NAMES.BOOKINGS);
    var guestsData = readSheetToObjects_(ss, SHEET_NAMES.GUESTS);
    var servicesData = readSheetToObjects_(ss, SHEET_NAMES.SERVICES);
    var txData = readSheetToObjects_(ss, SHEET_NAMES.TRANSACTIONS);
    var catalogData = readSheetToObjects_(ss, SHEET_NAMES.CATALOG);
    var channelsData = readSheetToObjects_(ss, SHEET_NAMES.CHANNELS);
    var settingsData = readSettingsMap_(ss, SHEET_NAMES.SETTINGS);

    // BẢO VỆ TUYỆT ĐỐI: NẾU VÌ BẤT KỲ LÝ DO GÌ SHEET RỖNG, TRẢ VỀ DỮ LIỆU KHỞI TẠO CHUẨN
    if (!roomsData || roomsData.length === 0) {
      setupDatabaseSheets();
      roomsData = readSheetToObjects_(ss, SHEET_NAMES.ROOMS);
    }

    const result = {
      rooms: roomsData,
      bookings: bookingsData,
      guests: guestsData,
      services: servicesData,
      transactions: txData,
      catalog: catalogData,
      channels: channelsData,
      settings: settingsData
    };
    return { success: true, data: result };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * Helper: Đọc sheet thành danh sách JSON Objects
 */
function readSheetToObjects_(ss, sheetName) {
  const sh = ss.getSheetByName(sheetName);
  if (!sh) return [];
  const values = sh.getDataRange().getValues();
  if (values.length <= 1) return [];
  const headers = values[0].map(h => String(h).trim());
  const rows = [];
  for (let i = 1; i < values.length; i++) {
    const obj = {};
    let hasVal = false;
    for (let j = 0; j < headers.length; j++) {
      let val = values[i][j];
      if (val instanceof Date) {
        val = Utilities.formatDate(val, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');
      }
      obj[headers[j]] = val;
      if (val !== '' && val !== null && val !== undefined) hasVal = true;
    }
    if (hasVal) rows.push(obj);
  }
  return rows;
}

/**
 * Helper: Đọc Settings thành Map Key-Value
 */
function readSettingsMap_(ss, sheetName) {
  const sh = ss.getSheetByName(sheetName);
  if (!sh) return {};
  const values = sh.getDataRange().getValues();
  const map = {};
  for (let i = 1; i < values.length; i++) {
    const k = String(values[i][0]).trim();
    const v = values[i][1];
    if (k) map[k] = v;
  }
  return map;
}

/**
 * 5. Cập nhật trạng thái buồng phòng (Housekeeping 1 chạm)
 */
function updateRoomStatus(roomId, newStatus) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName(SHEET_NAMES.ROOMS);
    const data = sh.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === roomId) {
        sh.getRange(i + 1, 9).setValue(newStatus);
        if (newStatus === 'Trống sạch' || newStatus === 'Trống dơ') {
          // Xóa mã booking hiện tại nếu phòng đã trả xong
          if (newStatus === 'Trống sạch') {
            sh.getRange(i + 1, 10).setValue('');
          }
        }
        return { success: true, message: 'Đã cập nhật trạng thái phòng thành ' + newStatus };
      }
    }
    return { success: false, error: 'Không tìm thấy mã phòng ' + roomId };
  } catch (err) {
    return { success: false, error: err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * 6. Tạo hoặc cập nhật Booking đặt phòng
 */
function saveBooking(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const shBookings = ss.getSheetByName(SHEET_NAMES.BOOKINGS);
    const shRooms = ss.getSheetByName(SHEET_NAMES.ROOMS);
    const shGuests = ss.getSheetByName(SHEET_NAMES.GUESTS);
    const shTx = ss.getSheetByName(SHEET_NAMES.TRANSACTIONS);

    let bookingId = payload.bookingId;
    const isNew = !bookingId;
    if (isNew) {
      bookingId = 'BOOK-' + Math.floor(100000 + Math.random() * 900000);
    }

    // 1. Quản lý thông tin khách lưu trú (Auto CRM)
    let guestId = payload.guestId;
    if (!guestId) {
      guestId = 'KHLU-' + Math.floor(100000 + Math.random() * 900000);
      shGuests.appendRow([
        guestId,
        payload.guestName || '',
        payload.guestPhone || '',
        payload.guestIdCard || '',
        payload.guestNationality || 'Việt Nam',
        1,
        Number(payload.totalAmount) || 0,
        payload.notes || ''
      ]);
    }

    const rowData = [
      bookingId,
      payload.roomId || '',
      payload.roomName || '',
      payload.guestName || '',
      payload.guestPhone || '',
      payload.guestIdCard || '',
      payload.channel || 'Trực tiếp',
      payload.rentalType || 'Theo ngày',
      payload.checkInExpected || '',
      payload.checkInActual || '',
      payload.checkOutExpected || '',
      payload.checkOutActual || '',
      Number(payload.roomPrice) || 0,
      Number(payload.earlySurcharge) || 0,
      Number(payload.lateSurcharge) || 0,
      Number(payload.serviceAmount) || 0,
      Number(payload.deposit) || 0,
      Number(payload.discount) || 0,
      Number(payload.totalAmount) || 0,
      Number(payload.paidAmount) || 0,
      Number(payload.debtAmount) || 0,
      payload.status || 'Đặt trước',
      payload.notes || ''
    ];

    if (isNew) {
      shBookings.appendRow(rowData);
    } else {
      const bData = shBookings.getDataRange().getValues();
      let found = false;
      for (let i = 1; i < bData.length; i++) {
        if (bData[i][0] === bookingId) {
          shBookings.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
          found = true;
          break;
        }
      }
      if (!found) shBookings.appendRow(rowData);
    }

    // 2. Tự động đồng bộ trạng thái phòng
    if (payload.status === 'Đang ở') {
      updateRoomStatusInSheet_(shRooms, payload.roomId, 'Đang có khách', bookingId);
    } else if (payload.status === 'Đã trả') {
      updateRoomStatusInSheet_(shRooms, payload.roomId, 'Trống dơ', '');
    }

    // 3. Tự động ghi nhận khoản thu nếu có thanh toán mới
    if (Number(payload.deposit) > 0 && isNew) {
      shTx.appendRow([
        'GDTC-' + Math.floor(100000 + Math.random() * 900000),
        Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm'),
        'Thu',
        'Tiền cọc đặt phòng',
        Number(payload.deposit),
        payload.paymentMethod || 'Chuyển khoản',
        bookingId,
        'Thu cọc lúc tạo booking ' + bookingId
      ]);
    }

    return { success: true, bookingId: bookingId, message: 'Đã lưu thông tin đặt phòng thành công!' };
  } catch (err) {
    return { success: false, error: err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * 7. Lễ tân Check-in nhanh 1 chạm
 */
function performCheckIn(bookingId, checkInTime) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const shBookings = ss.getSheetByName(SHEET_NAMES.BOOKINGS);
    const shRooms = ss.getSheetByName(SHEET_NAMES.ROOMS);
    const bData = shBookings.getDataRange().getValues();

    const actualTime = checkInTime || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');

    for (let i = 1; i < bData.length; i++) {
      if (bData[i][0] === bookingId) {
        const roomId = bData[i][1];
        // Cập nhật check-in thực tế và chuyển trạng thái 'Đang ở'
        shBookings.getRange(i + 1, 10).setValue(actualTime);
        shBookings.getRange(i + 1, 22).setValue('Đang ở');

        // Phòng chuyển thành 'Đang có khách'
        updateRoomStatusInSheet_(shRooms, roomId, 'Đang có khách', bookingId);
        return { success: true, message: 'Khách đã nhận phòng thành công!' };
      }
    }
    return { success: false, error: 'Không tìm thấy booking ' + bookingId };
  } catch (err) {
    return { success: false, error: err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * 8. Lễ tân Check-out nhanh & Quyết toán hóa đơn
 */
function performCheckOut(bookingId, payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const shBookings = ss.getSheetByName(SHEET_NAMES.BOOKINGS);
    const shRooms = ss.getSheetByName(SHEET_NAMES.ROOMS);
    const shTx = ss.getSheetByName(SHEET_NAMES.TRANSACTIONS);
    const bData = shBookings.getDataRange().getValues();

    const actualTime = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');

    for (let i = 1; i < bData.length; i++) {
      if (bData[i][0] === bookingId) {
        const roomId = bData[i][1];
        
        // Cập nhật số tiền phụ thu trễ nếu có
        if (payload.lateSurcharge !== undefined) {
          shBookings.getRange(i + 1, 15).setValue(Number(payload.lateSurcharge));
        }
        // Cập nhật tổng tiền, đã thu, còn nợ
        if (payload.totalAmount !== undefined) {
          shBookings.getRange(i + 1, 19).setValue(Number(payload.totalAmount));
          shBookings.getRange(i + 1, 20).setValue(Number(payload.totalAmount)); // Đã thu đủ khi checkout
          shBookings.getRange(i + 1, 21).setValue(0); // Hết nợ
        }
        shBookings.getRange(i + 1, 12).setValue(actualTime);
        shBookings.getRange(i + 1, 22).setValue('Đã trả');

        // Phòng tự động chuyển sang 'Trống dơ' để nhân viên buồng phòng dọn
        updateRoomStatusInSheet_(shRooms, roomId, 'Trống dơ', '');

        // Ghi sổ thu tiền thanh toán còn lại
        const remainPaid = Number(payload.amountPaidNow) || 0;
        if (remainPaid > 0) {
          shTx.appendRow([
            'GDTC-' + Math.floor(100000 + Math.random() * 900000),
            actualTime,
            'Thu',
            'Thanh toán trả phòng (Check-out)',
            remainPaid,
            payload.paymentMethod || 'Tiền mặt',
            bookingId,
            'Quyết toán hóa đơn trả phòng ' + bookingId
          ]);
        }

        return { success: true, message: 'Check-out thành công! Phòng đã chuyển sang trạng thái [Trống dơ] chờ dọn dẹp.' };
      }
    }
    return { success: false, error: 'Không tìm thấy booking ' + bookingId };
  } catch (err) {
    return { success: false, error: err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * 9. Thêm dịch vụ / Minibar vào phòng
 */
function addRoomService(bookingId, roomId, serviceName, quantity, price) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const shServices = ss.getSheetByName(SHEET_NAMES.SERVICES);
    const shBookings = ss.getSheetByName(SHEET_NAMES.BOOKINGS);

    const qty = Number(quantity) || 1;
    const unitPrice = Number(price) || 0;
    const total = qty * unitPrice;

    shServices.appendRow([
      'DVPG-' + Math.floor(100000 + Math.random() * 900000),
      bookingId,
      roomId,
      serviceName,
      qty,
      unitPrice,
      total,
      Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm')
    ]);

    // Cập nhật cộng dồn tiền dịch vụ trong booking
    const bData = shBookings.getDataRange().getValues();
    for (let i = 1; i < bData.length; i++) {
      if (bData[i][0] === bookingId) {
        const curServiceAmt = Number(bData[i][15]) || 0;
        const curTotal = Number(bData[i][18]) || 0;
        const curDebt = Number(bData[i][20]) || 0;

        shBookings.getRange(i + 1, 16).setValue(curServiceAmt + total);
        shBookings.getRange(i + 1, 19).setValue(curTotal + total);
        shBookings.getRange(i + 1, 21).setValue(curDebt + total);
        break;
      }
    }

    return { success: true, message: 'Đã thêm dịch vụ ' + serviceName + ' vào phòng thành công!' };
  } catch (err) {
    return { success: false, error: err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * 10. Ghi nhận giao dịch thu chi mới
 */
function recordTransaction(type, category, amount, method, bookingId, notes) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const shTx = ss.getSheetByName(SHEET_NAMES.TRANSACTIONS);

    const txId = 'GDTC-' + Math.floor(100000 + Math.random() * 900000);
    shTx.appendRow([
      txId,
      Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm'),
      type,
      category,
      Number(amount) || 0,
      method || 'Tiền mặt',
      bookingId || '',
      notes || ''
    ]);

    return { success: true, txId: txId, message: 'Đã ghi sổ giao dịch thành công!' };
  } catch (err) {
    return { success: false, error: err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * 11. Lưu cài đặt hệ thống
 */
function saveSettings(settingsMap) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName(SHEET_NAMES.SETTINGS);
    const data = sh.getDataRange().getValues();

    for (let key in settingsMap) {
      let found = false;
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === key) {
          sh.getRange(i + 1, 2).setValue(settingsMap[key]);
          found = true;
          break;
        }
      }
      if (!found) {
        sh.appendRow([key, settingsMap[key], '']);
      }
    }

    return { success: true, message: 'Đã lưu cấu hình hệ thống thành công!' };
  } catch (err) {
    return { success: false, error: err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Helper cập nhật trực tiếp trạng thái phòng trong tab DB_Phong
 */
function updateRoomStatusInSheet_(shRooms, roomId, status, currentBookingId) {
  const data = shRooms.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === roomId) {
      shRooms.getRange(i + 1, 9).setValue(status);
      shRooms.getRange(i + 1, 10).setValue(currentBookingId || '');
      break;
    }
  }
}


/**
 * Nạp lại toàn bộ dữ liệu mẫu chuẩn lên Google Sheet từ Web App
 */
function resetDatabaseToSample() {
  return setupDatabaseSheets();
}
