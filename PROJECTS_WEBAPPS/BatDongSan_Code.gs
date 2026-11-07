/**
 * ==============================================================================
 * BẤT ĐỘNG SẢN CRM PRO - GOOGLE APPS SCRIPT BACKEND (V2.0 MICRO-SPEC)
 * Thương hiệu: File Đi Làm
 * Nền tảng: Google Apps Script + Google Sheets (Single Source of Truth)
 * ==============================================================================
 */

const CONFIG_BDS = {
  APP_TITLE: 'CRM Bất Động Sản Pro · File Đi Làm',
  SHEET_NAMES: {
    CUSTOMERS: 'DB_KHACH_HANG',
    PROPERTIES: 'DB_GIO_HANG',
    LOGS: 'DB_NHAT_KY',
    DEALS: 'DB_GIAO_DICH',
    SETTINGS: 'CAI_DAT'
  }
};

/**
 * Entry point cho Web App
 */
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle(CONFIG_BDS.APP_TITLE)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Đọc toàn bộ dữ liệu hệ thống trả về 1 JSON payload chuẩn duy nhất
 */
function getInitialData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Đảm bảo các sheet tồn tại
    ensureRequiredSheets_(ss);

    const customers = readSheetData_(ss, CONFIG_BDS.SHEET_NAMES.CUSTOMERS);
    const properties = readSheetData_(ss, CONFIG_BDS.SHEET_NAMES.PROPERTIES);
    const logs = readSheetData_(ss, CONFIG_BDS.SHEET_NAMES.LOGS);
    const deals = readSheetData_(ss, CONFIG_BDS.SHEET_NAMES.DEALS);
    const settingsRaw = readSheetData_(ss, CONFIG_BDS.SHEET_NAMES.SETTINGS);

    // Chuẩn hóa cấu hình Settings
    const settings = parseSettingsData_(settingsRaw);

    return {
      success: true,
      data: {
        customers: customers,
        properties: properties,
        logs: logs,
        deals: deals,
        settings: settings
      }
    };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * Thêm hoặc Cập nhật Khách Hàng (Module 2)
 */
function saveCustomer(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName(CONFIG_BDS.SHEET_NAMES.CUSTOMERS);
    const newId = payload.id || ('KH-' + Math.floor(100000 + Math.random() * 900000));
    
    sh.appendRow([
      newId,
      payload.name || '',
      payload.phone || '',
      payload.demand || 'Căn hộ chung cư',
      payload.priceRange || '',
      payload.area || '',
      payload.interestedIn || '',
      payload.source || 'Facebook Ads',
      payload.status || 'Mới tiếp cận',
      payload.note || '',
      new Date()
    ]);
    return { success: true, id: newId };
  } catch (err) {
    return { success: false, error: err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Thêm hoặc Cập nhật Căn BĐS vào Giỏ Hàng (Module 3)
 */
function saveProperty(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName(CONFIG_BDS.SHEET_NAMES.PROPERTIES);
    const newId = payload.id || ('BDS-' + Math.floor(100000 + Math.random() * 900000));
    
    sh.appendRow([
      newId,
      payload.type || 'Chung cư',
      payload.projectName || '',
      payload.address || '',
      Number(payload.area) || 0,
      Number(payload.price) || 0,
      payload.ownerName || '',
      payload.phone || '',
      payload.status || 'Đang bán',
      Number(payload.commission) || 1,
      payload.note || '',
      new Date()
    ]);
    return { success: true, id: newId };
  } catch (err) {
    return { success: false, error: err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Ghi Nhật Ký Tương Tác / Lịch Hẹn (Module 4)
 */
function saveInteraction(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName(CONFIG_BDS.SHEET_NAMES.LOGS);
    const newId = 'LOG-' + Math.floor(100000 + Math.random() * 900000);
    
    sh.appendRow([
      newId,
      payload.customerId || '',
      payload.customerName || '',
      payload.interactionType || 'Cuộc gọi tư vấn',
      payload.content || '',
      payload.followUpDate || '',
      new Date()
    ]);
    return { success: true, id: newId };
  } catch (err) {
    return { success: false, error: err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Chốt Cọc & Hoa Hồng - CẬP NHẬT TỰ ĐỘNG QUAN HỆ CHÉO (Module 5)
 * Căn BĐS -> Đổi sang "Đã chốt/Đã cọc"
 * Khách Hàng -> Đổi sang "Đã chốt cọc"
 */
function saveDeal(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const shDeals = ss.getSheetByName(CONFIG_BDS.SHEET_NAMES.DEALS);
    const newId = 'HD-' + Math.floor(100000 + Math.random() * 900000);
    
    const closedPrice = Number(payload.closedPriceMillion) || 0;
    const commRate = Number(payload.commissionPercent) || 0;
    // Tính số tiền hoa hồng thực nhận (đ)
    const commAmount = closedPrice * 1000000 * (commRate / 100);

    shDeals.appendRow([
      newId,
      payload.customerId || '',
      payload.customerName || '',
      payload.propertyId || '',
      payload.propertyAddress || '',
      closedPrice,
      commRate,
      commAmount,
      payload.dealDate || new Date().toISOString().slice(0, 10),
      payload.status || 'Đã thu hoa hồng',
      payload.note || '',
      new Date()
    ]);

    // RELATIONAL INTEGRITY 1: Cập nhật trạng thái Căn BĐS sang 'Đã bán/Đã cọc'
    if (payload.propertyId) {
      updateEntityStatus_(ss, CONFIG_BDS.SHEET_NAMES.PROPERTIES, 0, payload.propertyId, 8, 'Đã cọc/Đã bán');
    }

    // RELATIONAL INTEGRITY 2: Cập nhật trạng thái Khách hàng sang 'Đã chốt cọc'
    if (payload.customerId) {
      updateEntityStatus_(ss, CONFIG_BDS.SHEET_NAMES.CUSTOMERS, 0, payload.customerId, 8, 'Đã chốt cọc');
    }

    return { success: true, id: newId, commissionAmount: commAmount };
  } catch (err) {
    return { success: false, error: err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Lưu Cài Đặt Hệ Thống & Danh Mục (Module 6)
 */
function saveSettings(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sh = ss.getSheetByName(CONFIG_BDS.SHEET_NAMES.SETTINGS);
    if (!sh) sh = ss.insertSheet(CONFIG_BDS.SHEET_NAMES.SETTINGS);

    sh.clear();
    sh.appendRow(['Khóa Tham Số', 'Giá Trị Tham Số', 'Mô Tả / Phân Loại']);

    sh.appendRow(['BROKER_NAME', payload.brokerName || '', 'Thông tin cá nhân']);
    sh.appendRow(['BROKER_PHONE', payload.brokerPhone || '', 'Thông tin cá nhân']);
    sh.appendRow(['BANK_NAME', payload.bankName || '', 'Ngân hàng']);
    sh.appendRow(['BANK_ACC', payload.bankAcc || '', 'Số tài khoản']);
    sh.appendRow(['BANK_HOLDER', payload.bankHolder || '', 'Chủ tài khoản']);
    sh.appendRow(['PROPERTY_TYPES', (payload.propertyTypes || []).join(';'), 'Danh mục loại hình']);
    sh.appendRow(['CUSTOMER_SOURCES', (payload.customerSources || []).join(';'), 'Danh mục nguồn khách']);

    return { success: true };
  } catch (err) {
    return { success: false, error: err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Helper cập nhật cột trạng thái của một dòng dựa trên ID (Index 0-based)
 */
function updateEntityStatus_(ss, sheetName, idColIndex, idValue, targetColIndex, newStatus) {
  const sh = ss.getSheetByName(sheetName);
  if (!sh) return;
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idColIndex]).trim() === String(idValue).trim()) {
      sh.getRange(i + 1, targetColIndex + 1).setValue(newStatus);
      break;
    }
  }
}

/**
 * Helper phân tích dữ liệu Settings phẳng thành cấu trúc JSON chuẩn
 */
function parseSettingsData_(rows) {
  const settings = {
    brokerName: 'Môi Giới Chuyên Nghiệp',
    brokerPhone: '0900000000',
    bankName: 'MB Bank',
    bankAcc: '0900000000',
    bankHolder: 'NGUYEN VAN A',
    propertyTypes: ['Chung cư', 'Nhà phố', 'Đất nền', 'Biệt thự / Shophouse', 'Cho thuê'],
    customerSources: ['Facebook Ads', 'Tiktok Bio', 'Người quen giới thiệu', 'Đăng tin BĐS', 'Khách vãng lai'],
    customerStatuses: ['Mới tiếp cận', 'Đang chăm', 'Đang dẫn xem', 'Đang thương lượng', 'Đã chốt cọc', 'Dừng chăm sóc']
  };

  rows.forEach(r => {
    const key = String(r['Khóa Tham Số'] || '').trim();
    const val = String(r['Giá Trị Tham Số'] || '').trim();
    if (key === 'BROKER_NAME' && val) settings.brokerName = val;
    if (key === 'BROKER_PHONE' && val) settings.brokerPhone = val;
    if (key === 'BANK_NAME' && val) settings.bankName = val;
    if (key === 'BANK_ACC' && val) settings.bankAcc = val;
    if (key === 'BANK_HOLDER' && val) settings.bankHolder = val;
    if (key === 'PROPERTY_TYPES' && val) settings.propertyTypes = val.split(';').map(s => s.trim()).filter(Boolean);
    if (key === 'CUSTOMER_SOURCES' && val) settings.customerSources = val.split(';').map(s => s.trim()).filter(Boolean);
  });

  return settings;
}

/**
 * Helper đọc dữ liệu Sheet thành mảng Object
 */
function readSheetData_(ss, sheetName) {
  const sh = ss.getSheetByName(sheetName);
  if (!sh) return [];
  const data = sh.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0].map(h => String(h).trim());
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const rowObj = {};
    let hasData = false;
    for (let j = 0; j < headers.length; j++) {
      const val = data[i][j];
      rowObj[headers[j]] = val;
      if (val !== '' && val !== null && val !== undefined) hasData = true;
    }
    if (hasData) rows.push(rowObj);
  }
  return rows;
}

/**
 * Đảm bảo các sheet cần thiết tồn tại và có header chuẩn
 */
function ensureRequiredSheets_(ss) {
  const required = [
    { name: CONFIG_BDS.SHEET_NAMES.CUSTOMERS, headers: ['Mã Khách', 'Họ Và Tên', 'Số Điện Thoại', 'Nhu Cầu', 'Khoảng Giá', 'Khu Vực', 'Căn Quan Tâm', 'Nguồn Khách', 'Trạng Thái', 'Ghi Chú', 'Ngày Tạo'] },
    { name: CONFIG_BDS.SHEET_NAMES.PROPERTIES, headers: ['Mã Căn', 'Loại Hình', 'Tên Dự Án', 'Địa Chỉ', 'Diện Tích (m2)', 'Giá Chào (Triệu)', 'Tên Chủ', 'SĐT Chủ / Đầu Chủ', 'Trạng Thái', 'Hoa Hồng (%)', 'Ghi Chú', 'Ngày Tạo'] },
    { name: CONFIG_BDS.SHEET_NAMES.LOGS, headers: ['Mã Nhật Ký', 'Mã Khách', 'Tên Khách', 'Hình Thức', 'Nội Dung Trao Đổi', 'Lịch Hẹn Tiếp', 'Ngày Tạo'] },
    { name: CONFIG_BDS.SHEET_NAMES.DEALS, headers: ['Mã Hợp Đồng', 'Mã Khách', 'Tên Khách', 'Mã Căn', 'Địa Chỉ Căn', 'Giá Chốt (Triệu)', 'Tỷ Lệ Hoa Hồng (%)', 'Hoa Hồng Thực Nhận (đ)', 'Ngày Chốt', 'Trạng Thái', 'Ghi Chú', 'Ngày Tạo'] },
    { name: CONFIG_BDS.SHEET_NAMES.SETTINGS, headers: ['Khóa Tham Số', 'Giá Trị Tham Số', 'Mô Tả / Phân Loại'] }
  ];

  required.forEach(item => {
    let sh = ss.getSheetByName(item.name);
    if (!sh) {
      sh = ss.insertSheet(item.name);
      sh.appendRow(item.headers);
    }
  });
}
