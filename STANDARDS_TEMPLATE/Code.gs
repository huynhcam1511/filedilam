/**
 * ==============================================================================
 * HỆ THỐNG QUẢN LÝ NHÀ TRỌ PRO - GOOGLE APPS SCRIPT BACKEND
 * Phiên bản: V5.0 Consolidated
 * Nền tảng: Google Apps Script + Google Sheets (System of Record)
 * ==============================================================================
 */

const CONFIG = {
  APP_TITLE: 'Quản Lý Nhà Trọ · File Đi Làm',
  SHEET_NAMES: {
    UNITS: 'DB_CAN_CHO_THUE',
    ROOMS: 'DB_PHONG',
    TENANTS: 'DB_KHACH_THUE',
    CONTRACTS: 'DB_HOP_DONG',
    UTILITIES: 'DB_DIEN_NUOC',
    INVOICES: 'DB_THU_TIEN',
    EXPENSES: 'DB_QUAN_LY_CHI',
    DEPOSITS: 'DB_TIEN_COC',
    CATALOG: 'DB_DANH_MUC',
    SETTINGS: 'CAI_DAT'
  }
};

/**
 * Entry point cho Web App
 */
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle(CONFIG.APP_TITLE)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Đọc toàn bộ dữ liệu 10 tab để trả về cho Client trong 1 round-trip duy nhất
 */
function getInitialData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const result = {
      properties: readSheetData_(ss, CONFIG.SHEET_NAMES.UNITS),
      rooms: readSheetData_(ss, CONFIG.SHEET_NAMES.ROOMS),
      tenants: readSheetData_(ss, CONFIG.SHEET_NAMES.TENANTS),
      contracts: readSheetData_(ss, CONFIG.SHEET_NAMES.CONTRACTS),
      utilities: readSheetData_(ss, CONFIG.SHEET_NAMES.UTILITIES),
      invoices: readSheetData_(ss, CONFIG.SHEET_NAMES.INVOICES),
      expenses: readSheetData_(ss, CONFIG.SHEET_NAMES.EXPENSES),
      deposits: readSheetData_(ss, CONFIG.SHEET_NAMES.DEPOSITS),
      catalog: readSheetData_(ss, CONFIG.SHEET_NAMES.CATALOG),
      settings: readSheetData_(ss, CONFIG.SHEET_NAMES.SETTINGS)
    };
    return { success: true, data: result };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * Helper đọc sheet thành mảng Object (dòng 1 làm header)
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
 * Ghi nhận chỉ số điện nước hàng loạt
 */
function saveUtilitiesBatch(payloadList) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName(CONFIG.SHEET_NAMES.UTILITIES);
    if (!sh) throw new Error('Không tìm thấy tab ' + CONFIG.SHEET_NAMES.UTILITIES);
    
    // Ghi dữ liệu
    payloadList.forEach(item => {
      sh.appendRow([
        'DN-' + Math.floor(100000 + Math.random() * 900000),
        item.unitId || '',
        item.roomId || '',
        item.period || '',
        item.elecStart || 0,
        item.elecEnd || 0,
        item.waterStart || 0,
        item.waterEnd || 0,
        item.status || 'Đã nhập',
        new Date()
      ]);
    });
    return { success: true, count: payloadList.length };
  } catch (err) {
    return { success: false, error: err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Thêm mới khách thuê
 */
function saveTenant(tenantData) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName(CONFIG.SHEET_NAMES.TENANTS);
    if (!sh) throw new Error('Không tìm thấy tab ' + CONFIG.SHEET_NAMES.TENANTS);

    const tenantId = tenantData.id || ('KT-' + Math.floor(100000 + Math.random() * 900000));
    sh.appendRow([
      tenantId,
      tenantData.fullName || '',
      tenantData.phone || '',
      tenantData.idCard || '',
      tenantData.address || '',
      tenantData.status || 'Đang thuê',
      tenantData.note || '',
      new Date()
    ]);
    return { success: true, tenantId: tenantId };
  } catch (err) {
    return { success: false, error: err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Thao tác sổ tiền cọc (Nhận cọc, nhận thêm, hoàn, khấu trừ)
 */
function saveDepositTransaction(txData) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName(CONFIG.SHEET_NAMES.DEPOSITS);
    if (!sh) throw new Error('Không tìm thấy tab ' + CONFIG.SHEET_NAMES.DEPOSITS);

    const txId = 'DC-' + Math.floor(100000 + Math.random() * 900000);
    sh.appendRow([
      txId,
      txData.contractId || '',
      txData.roomId || '',
      txData.type || 'Nhận cọc', // Nhận cọc, Nhận thêm, Hoàn cọc, Khấu trừ
      txData.amount || 0,
      txData.paymentMethod || 'Chuyển khoản',
      txData.date || new Date(),
      txData.note || '',
      'Đã xác nhận'
    ]);
    return { success: true, txId: txId };
  } catch (err) {
    return { success: false, error: err.toString() };
  } finally {
    lock.releaseLock();
  }
}
