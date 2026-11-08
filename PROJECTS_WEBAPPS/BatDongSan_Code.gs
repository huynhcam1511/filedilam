/**
 * ==============================================================================
 * BẤT ĐỘNG SẢN CRM PRO - GOOGLE APPS SCRIPT BACKEND (V2.1 - SPRINT 1 COMPLETE)
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
    
    // Đảm bảo các sheet tồn tại và có header chuẩn
    ensureRequiredSheets_(ss);

    const customers = readSheetData_(ss, CONFIG_BDS.SHEET_NAMES.CUSTOMERS);
    const properties = readSheetData_(ss, CONFIG_BDS.SHEET_NAMES.PROPERTIES);
    const logs = readSheetData_(ss, CONFIG_BDS.SHEET_NAMES.LOGS);
    const deals = readSheetData_(ss, CONFIG_BDS.SHEET_NAMES.DEALS);
    const settingsRaw = readSheetData_(ss, CONFIG_BDS.SHEET_NAMES.SETTINGS);

    // Chuẩn hóa cấu hình Settings & Master Taxonomy
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
 * SPRINT 2 CHUYÊN SÂU: Thêm hoặc Cập nhật Khách Hàng (Module 2)
 * Hỗ trợ: Validate SĐT Việt Nam 10 số, Chống trùng SĐT, Cập nhật theo ID, Quản lý trạng thái
 */
function saveCustomer(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName(CONFIG_BDS.SHEET_NAMES.CUSTOMERS);
    if (!sh) throw new Error('Không tìm thấy tab ' + CONFIG_BDS.SHEET_NAMES.CUSTOMERS);

    // Chuẩn hóa và validate SĐT Việt Nam (Bắt buộc 10 số, đầu 03, 05, 07, 08, 09)
    let cleanPhone = String(payload.phone || '').replace(/\D/g, '');
    if (!/^0(3|5|7|8|9)\d{8}$/.test(cleanPhone)) {
      return { success: false, error: 'Số điện thoại không hợp lệ! Vui lòng nhập đúng định dạng 10 số của Việt Nam (VD: 0901234567).' };
    }

    const data = sh.getDataRange().getValues();
    const isUpdate = Boolean(payload.id);

    // Chống trùng số điện thoại khi thêm mới
    if (!isUpdate) {
      for (let i = 1; i < data.length; i++) {
        const existPhone = String(data[i][2] || '').replace(/\D/g, '');
        const existStatus = String(data[i][8] || '');
        if (existPhone === cleanPhone && existStatus !== 'Đã xóa') {
          return { success: false, error: 'Số điện thoại này đã tồn tại trong hệ thống (Thuộc khách: ' + data[i][1] + ' - ' + data[i][0] + ')!' };
        }
      }
    }

    if (isUpdate) {
      // Cập nhật khách hàng đã có theo ID
      let foundIndex = -1;
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]).trim() === String(payload.id).trim()) {
          foundIndex = i + 1;
          break;
        }
      }
      if (foundIndex === -1) {
        return { success: false, error: 'Không tìm thấy khách hàng có mã ' + payload.id + ' để cập nhật!' };
      }

      sh.getRange(foundIndex, 2).setValue(payload.name || '');
      sh.getRange(foundIndex, 3).setValue(cleanPhone);
      sh.getRange(foundIndex, 4).setValue(payload.demand || 'Căn hộ chung cư');
      sh.getRange(foundIndex, 5).setValue(payload.priceRange || '');
      sh.getRange(foundIndex, 6).setValue(payload.area || '');
      sh.getRange(foundIndex, 7).setValue(payload.interestedIn || '');
      sh.getRange(foundIndex, 8).setValue(payload.source || 'Facebook Ads');
      sh.getRange(foundIndex, 9).setValue(payload.status || 'Mới tiếp cận');
      sh.getRange(foundIndex, 10).setValue(payload.note || '');

      return { success: true, id: payload.id, isUpdate: true };
    } else {
      // Thêm mới hoàn toàn khách hàng
      const newId = 'KH-' + Math.floor(100000 + Math.random() * 900000);
      sh.appendRow([
        newId,
        payload.name || '',
        cleanPhone,
        payload.demand || 'Căn hộ chung cư',
        payload.priceRange || '',
        payload.area || '',
        payload.interestedIn || '',
        payload.source || 'Facebook Ads',
        payload.status || 'Mới tiếp cận',
        payload.note || '',
        new Date()
      ]);
      return { success: true, id: newId, isUpdate: false };
    }
  } catch (err) {
    return { success: false, error: err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * SPRINT 2 CHUYÊN SÂU: Xóa mềm Khách Hàng (Soft Delete)
 * Chuyển trạng thái sang 'Đã xóa', bảo toàn audit log và lịch sử giao dịch liên quan
 */
function deleteCustomer(customerId) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName(CONFIG_BDS.SHEET_NAMES.CUSTOMERS);
    if (!sh) throw new Error('Không tìm thấy tab ' + CONFIG_BDS.SHEET_NAMES.CUSTOMERS);

    const data = sh.getDataRange().getValues();
    let foundRow = -1;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === String(customerId).trim()) {
        foundRow = i + 1;
        break;
      }
    }

    if (foundRow === -1) {
      return { success: false, error: 'Không tìm thấy khách hàng cần xóa!' };
    }

    // Ghi nhận Soft Delete vào cột Trạng Thái (cột 9)
    sh.getRange(foundRow, 9).setValue('Đã xóa');
    return { success: true, id: customerId };
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
 * SPRINT 1 CHUYÊN SÂU: Lưu Cài Đặt Hệ Thống & Toàn Bộ Master Taxonomy (Module 6)
 * Hỗ trợ lưu danh mục động, cấu hình hoa hồng chuẩn, tài khoản VietQR và hạn nhắc việc.
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

    const rowsToAppend = [
      ['BROKER_NAME', payload.brokerName || '', 'Hồ sơ cá nhân: Họ tên môi giới'],
      ['BROKER_PHONE', payload.brokerPhone || '', 'Hồ sơ cá nhân: Số điện thoại'],
      ['BROKER_EMAIL', payload.brokerEmail || '', 'Hồ sơ cá nhân: Email liên hệ'],
      ['AGENCY_NAME', payload.agencyName || '', 'Hồ sơ cá nhân: Sàn / Đội nhóm'],
      ['BANK_NAME', payload.bankName || 'MB Bank', 'Thanh toán: Tên ngân hàng nhận hoa hồng'],
      ['BANK_ACC', payload.bankAcc || '', 'Thanh toán: Số tài khoản ngân hàng'],
      ['BANK_HOLDER', payload.bankHolder || '', 'Thanh toán: Tên chủ tài khoản (In hoa)'],
      ['DEFAULT_COMM_RATE', String(payload.defaultCommRate || '1.5'), 'Cấu hình: % Hoa hồng mặc định'],
      ['FOLLOWUP_ALERT_DAYS', String(payload.followupAlertDays || '0'), 'Cấu hình: Số ngày nhắc việc trước hạn'],
      ['PROPERTY_TYPES', (payload.propertyTypes || []).join(';'), 'Master Taxonomy: Danh mục loại hình BĐS'],
      ['CUSTOMER_SOURCES', (payload.customerSources || []).join(';'), 'Master Taxonomy: Danh mục nguồn khách'],
      ['CUSTOMER_STATUSES', (payload.customerStatuses || []).join(';'), 'Master Taxonomy: Danh mục trạng thái khách'],
      ['PROPERTY_STATUSES', (payload.propertyStatuses || []).join(';'), 'Master Taxonomy: Danh mục trạng thái căn']
    ];

    rowsToAppend.forEach(r => sh.appendRow(r));

    return { success: true };
  } catch (err) {
    return { success: false, error: err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * SPRINT 1 CHUYÊN SÂU: Khôi phục danh mục và cài đặt gốc (Reset Default Settings)
 */
function resetDefaultSettings() {
  const defaultPayload = {
    brokerName: 'Môi Giới Chuyên Nghiệp',
    brokerPhone: '0900000000',
    brokerEmail: 'broker@filedilam.vn',
    agencyName: 'Văn Phòng Bất Động Sản',
    bankName: 'MB Bank',
    bankAcc: '0900000000',
    bankHolder: 'NGUYEN VAN A',
    defaultCommRate: 1.5,
    followupAlertDays: 0,
    propertyTypes: ['Chung cư', 'Nhà phố', 'Đất nền', 'Biệt thự / Shophouse', 'Cho thuê'],
    customerSources: ['Facebook Ads', 'Tiktok Bio', 'Người quen giới thiệu', 'Đăng tin BĐS', 'Khách vãng lai'],
    customerStatuses: ['Mới tiếp cận', 'Đang chăm', 'Đang dẫn xem', 'Đang thương lượng', 'Đã chốt cọc', 'Dừng chăm sóc'],
    propertyStatuses: ['Đang bán', 'Đã cọc/Đã bán', 'Tạm ngưng']
  };
  return saveSettings(defaultPayload);
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
 * Helper phân tích dữ liệu Settings phẳng thành cấu trúc JSON chuẩn đầy đủ (Sprint 1)
 */
function parseSettingsData_(rows) {
  const settings = {
    brokerName: 'Môi Giới Chuyên Nghiệp',
    brokerPhone: '0900000000',
    brokerEmail: 'broker@filedilam.vn',
    agencyName: 'Văn Phòng Bất Động Sản',
    bankName: 'MB Bank',
    bankAcc: '0900000000',
    bankHolder: 'NGUYEN VAN A',
    defaultCommRate: 1.5,
    followupAlertDays: 0,
    propertyTypes: ['Chung cư', 'Nhà phố', 'Đất nền', 'Biệt thự / Shophouse', 'Cho thuê'],
    customerSources: ['Facebook Ads', 'Tiktok Bio', 'Người quen giới thiệu', 'Đăng tin BĐS', 'Khách vãng lai'],
    customerStatuses: ['Mới tiếp cận', 'Đang chăm', 'Đang dẫn xem', 'Đang thương lượng', 'Đã chốt cọc', 'Dừng chăm sóc'],
    propertyStatuses: ['Đang bán', 'Đã cọc/Đã bán', 'Tạm ngưng']
  };

  rows.forEach(r => {
    const key = String(r['Khóa Tham Số'] || '').trim();
    const val = String(r['Giá Trị Tham Số'] || '').trim();
    if (!key) return;

    if (key === 'BROKER_NAME' && val) settings.brokerName = val;
    if (key === 'BROKER_PHONE' && val) settings.brokerPhone = val;
    if (key === 'BROKER_EMAIL' && val) settings.brokerEmail = val;
    if (key === 'AGENCY_NAME' && val) settings.agencyName = val;
    if (key === 'BANK_NAME' && val) settings.bankName = val;
    if (key === 'BANK_ACC' && val) settings.bankAcc = val;
    if (key === 'BANK_HOLDER' && val) settings.bankHolder = val;
    if (key === 'DEFAULT_COMM_RATE' && val) settings.defaultCommRate = Number(val) || 1.5;
    if (key === 'FOLLOWUP_ALERT_DAYS' && val) settings.followupAlertDays = Number(val) || 0;
    if (key === 'PROPERTY_TYPES' && val) settings.propertyTypes = val.split(';').map(s => s.trim()).filter(Boolean);
    if (key === 'CUSTOMER_SOURCES' && val) settings.customerSources = val.split(';').map(s => s.trim()).filter(Boolean);
    if (key === 'CUSTOMER_STATUSES' && val) settings.customerStatuses = val.split(';').map(s => s.trim()).filter(Boolean);
    if (key === 'PROPERTY_STATUSES' && val) settings.propertyStatuses = val.split(';').map(s => s.trim()).filter(Boolean);
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
