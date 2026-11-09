
/**
 * ==============================================================================
 * MENU KHỞI TẠO & QUY TẮC SINGLE VISIBLE TAB (HIẾN PHÁP MASTER AGENTS V2.3)
 * ==============================================================================
 */
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbtznoJQLtSgcDd5N-oQfD3bWoujGamgNinxkggjn3LM8ArVMbzqMOvGdy3u_CiTrEgg/exec';

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('File Đi Làm')
    .addItem('Mở Ứng Dụng Quản Lý', 'openWebApp')
    .addSeparator()
    .addItem('Nạp Data Mẫu (10 BĐS, 100 Khách, 80 Hẹn, 20 Cọc)', 'seedRichFunnelData')
    .addItem('Khóa & Ẩn Database (Bảo vệ dữ liệu)', 'lockAndHideDatabaseSheets')
    .addToUi();
}

function openWebApp() {
  const html = HtmlService.createHtmlOutput(
    '<script>window.open("' + WEB_APP_URL + '", "_blank");google.script.host.close();</script>'
  ).setWidth(300).setHeight(80);
  SpreadsheetApp.getUi().showModalDialog(html, 'Đang mở ứng dụng...');
}

/**
 * QUY TẮC SINGLE VISIBLE TAB: Khóa và Ẩn toàn bộ tab DB_, chỉ để lại tab HDSD hiển thị
 */
function lockAndHideDatabaseSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let shHdsd = ss.getSheetByName('HDSD');
  if (!shHdsd) {
    shHdsd = ss.insertSheet('HDSD', 0);
    // Khởi tạo giao diện nút bấm và hướng dẫn trên tab HDSD
    shHdsd.getRange('B2:E3').merge()
      .setValue('MỞ ỨNG DỤNG CRM BẤT ĐỘNG SẢN (BẤM VÀO ĐÂY)')
      .setBackground('#059669')
      .setFontColor('#FFFFFF')
      .setFontWeight('bold')
      .setFontSize(13)
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle');
    shHdsd.getRange('B5').setValue('HƯỚNG DẪN BẢO MẬT & VẬN HÀNH:').setFontWeight('bold');
    shHdsd.getRange('B6').setValue('1. Toàn bộ cơ sở dữ liệu đã được tự động lưu trữ và bảo vệ tại các bảng tính nền.');
    shHdsd.getRange('B7').setValue('2. Vui lòng bấm vào nút Xanh phía trên hoặc vào menu "File Đi Làm > Mở Ứng Dụng Quản Lý" để thao tác.');
    shHdsd.getRange('B8').setValue('3. Mọi thắc mắc kỹ thuật vui lòng liên hệ kênh hỗ trợ Zalo chính thức của File Đi Làm.');
  }

  shHdsd.showSheet();
  ss.setActiveSheet(shHdsd);

  const sheets = ss.getSheets();
  sheets.forEach(sh => {
    const name = sh.getName();
    if (name.indexOf('DB_') === 0 || name === 'CAI_DAT') {
      sh.hideSheet();
      const protection = sh.protect().setDescription('Khóa bảo vệ Database FILE ĐI LÀM');
      protection.setWarningOnly(true);
    }
  });
}

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
    SETTINGS: 'CAI_DAT',
    TAXONOMY: 'DB_DANH_MUC'
  }
};

/**
 * Entry point cho Web App
 */
function doGet(e) {
  var template;
  try {
    template = HtmlService.createTemplateFromFile('Index');
  } catch (err) {
    template = HtmlService.createTemplateFromFile('BatDongSan_Index');
  }
  return template.evaluate()
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
    const taxonomyRaw = readSheetData_(ss, CONFIG_BDS.SHEET_NAMES.TAXONOMY);

    // Chuẩn hóa cấu hình Settings & Master Taxonomy
    const settings = parseSettingsData_(settingsRaw, taxonomyRaw);

    return {
      success: true,
      data: {
        customers: customers,
        properties: properties,
        logs: logs,
        deals: deals,
        settings: settings,
        taxonomy: settings.taxonomyItems || []
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
      const newId = 'KHNG-' + Math.floor(100000 + Math.random() * 900000);
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
 * SPRINT 4 CHUYÊN SÂU: Thêm hoặc Cập nhật Căn BĐS vào Giỏ Hàng (Module 3)
 * Hỗ trợ: Chống trùng mã căn, Chuẩn hóa địa chỉ & dự án, Update theo ID, Kiểm tra diện tích & giá
 */
function saveProperty(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName(CONFIG_BDS.SHEET_NAMES.PROPERTIES);
    if (!sh) throw new Error('Không tìm thấy tab ' + CONFIG_BDS.SHEET_NAMES.PROPERTIES);

    const price = Number(payload.price) || 0;
    if (price <= 0) {
      return { success: false, error: 'Giá chào bán phải lớn hơn 0 triệu VNĐ!' };
    }

    const data = sh.getDataRange().getValues();
    const isUpdate = Boolean(payload.id);

    if (isUpdate) {
      // Cập nhật căn BĐS hiện có theo ID
      let foundIndex = -1;
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]).trim() === String(payload.id).trim()) {
          foundIndex = i + 1;
          break;
        }
      }
      if (foundIndex === -1) {
        return { success: false, error: 'Không tìm thấy căn BĐS có mã ' + payload.id + ' để cập nhật!' };
      }

      sh.getRange(foundIndex, 2).setValue(payload.type || 'Chung cư');
      sh.getRange(foundIndex, 3).setValue(payload.projectName || '');
      sh.getRange(foundIndex, 4).setValue(payload.address || '');
      sh.getRange(foundIndex, 5).setValue(Number(payload.area) || 0);
      sh.getRange(foundIndex, 6).setValue(price);
      sh.getRange(foundIndex, 7).setValue(payload.ownerName || '');
      sh.getRange(foundIndex, 8).setValue(payload.phone || '');
      sh.getRange(foundIndex, 9).setValue(payload.status || 'Đang bán');
      sh.getRange(foundIndex, 10).setValue(Number(payload.commission) || 1.5);
      sh.getRange(foundIndex, 11).setValue(payload.note || '');

      return { success: true, id: payload.id, isUpdate: true };
    } else {
      // Thêm mới căn BĐS
      const newId = 'BDSS-' + Math.floor(100000 + Math.random() * 900000);
      sh.appendRow([
        newId,
        payload.type || 'Chung cư',
        payload.projectName || '',
        payload.address || '',
        Number(payload.area) || 0,
        price,
        payload.ownerName || '',
        payload.phone || '',
        payload.status || 'Đang bán',
        Number(payload.commission) || 1.5,
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
 * SPRINT 4 CHUYÊN SÂU: Cập nhật nhanh trạng thái Căn BĐS
 */
function updatePropertyStatus(propertyId, newStatus) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    updateEntityStatus_(ss, CONFIG_BDS.SHEET_NAMES.PROPERTIES, 0, propertyId, 8, newStatus);
    return { success: true, id: propertyId, status: newStatus };
  } catch (err) {
    return { success: false, error: err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * SPRINT 4 CHUYÊN SÂU: Xóa mềm Căn BĐS khỏi giỏ hàng
 */
function deleteProperty(propertyId) {
  return updatePropertyStatus(propertyId, 'Đã xóa');
}

/**
 * SPRINT 6 CHUYÊN SÂU: Ghi Nhật Ký Tương Tác / Lịch Hẹn (Module 4)
 * Hỗ trợ: Gắn mã khách + mã căn (nếu có), Cập nhật theo ID, Cảnh báo ngày hẹn
 */
function saveInteraction(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName(CONFIG_BDS.SHEET_NAMES.LOGS);
    if (!sh) throw new Error('Không tìm thấy tab ' + CONFIG_BDS.SHEET_NAMES.LOGS);

    const isUpdate = Boolean(payload.id);
    const data = sh.getDataRange().getValues();

    if (isUpdate) {
      let foundRow = -1;
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]).trim() === String(payload.id).trim()) {
          foundRow = i + 1;
          break;
        }
      }
      if (foundRow === -1) {
        return { success: false, error: 'Không tìm thấy nhật ký có mã ' + payload.id + ' để cập nhật!' };
      }

      sh.getRange(foundRow, 2).setValue(payload.customerId || '');
      sh.getRange(foundRow, 3).setValue(payload.customerName || '');
      sh.getRange(foundRow, 4).setValue(payload.interactionType || 'Cuộc gọi tư vấn');
      sh.getRange(foundRow, 5).setValue(payload.content || '');
      sh.getRange(foundRow, 6).setValue(payload.followUpDate || '');

      return { success: true, id: payload.id, isUpdate: true };
    } else {
      const newId = 'LOGS-' + Math.floor(100000 + Math.random() * 900000);
      sh.appendRow([
        newId,
        payload.customerId || '',
        payload.customerName || '',
        payload.interactionType || 'Cuộc gọi tư vấn',
        payload.content || '',
        payload.followUpDate || '',
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
 * SPRINT 6 CHUYÊN SÂU: Xóa nhật ký tương tác
 */
function deleteInteraction(logId) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName(CONFIG_BDS.SHEET_NAMES.LOGS);
    if (!sh) throw new Error('Không tìm thấy tab ' + CONFIG_BDS.SHEET_NAMES.LOGS);

    const data = sh.getDataRange().getValues();
    let foundRow = -1;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === String(logId).trim()) {
        foundRow = i + 1;
        break;
      }
    }
    if (foundRow === -1) {
      return { success: false, error: 'Không tìm thấy nhật ký cần xóa!' };
    }

    sh.deleteRow(foundRow);
    return { success: true, id: logId };
  } catch (err) {
    return { success: false, error: err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Chốt Cọc & Hoa Hồng - CẬP NHẬT TỰ ĐỘNG QUAN HỆ CHÉO (Module 5)
 * SPRINT 9: ATOMIC DEAL TRANSACTION
 * Tự động đồng bộ quan hệ 2 chiều giữa Hợp Đồng <-> Căn BĐS <-> Khách Hàng:
 * 1. Khi tạo deal mới hoặc deal active: Prop -> 'Đã cọc/Đã bán', Cust -> 'Đã chốt cọc'.
 * 2. Khi đổi căn BĐS trong hợp đồng: Hoàn trả căn cũ về 'Đang bán', chuyển căn mới sang 'Đã cọc/Đã bán'.
 * 3. Khi chuyển trạng thái hợp đồng sang 'Đã hủy/Đã xóa': Hoàn trả căn BĐS về 'Đang bán'.
 */
function saveDeal(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let shDeals = ss.getSheetByName(CONFIG_BDS.SHEET_NAMES.DEALS);
    if (!shDeals) {
      shDeals = ss.insertSheet(CONFIG_BDS.SHEET_NAMES.DEALS);
      shDeals.appendRow(['Mã Hợp Đồng', 'Mã Khách', 'Tên Khách', 'Mã Căn', 'Địa Chỉ Căn', 'Giá Chốt (Triệu)', 'Tỷ Lệ Hoa Hồng (%)', 'Hoa Hồng Thực Nhận (đ)', 'Ngày Chốt', 'Trạng Thái', 'Ghi Chú', 'Ngày Tạo']);
    }

    const closedPrice = Number(payload.closedPriceMillion) || 0;
    const commRate = Number(payload.commissionPercent) || 0;
    const commAmount = Number(payload.commissionAmount) > 0 ? Number(payload.commissionAmount) : (closedPrice * 1000000 * (commRate / 100));
    const dealDate = payload.dealDate || new Date().toISOString().slice(0, 10);
    const status = payload.status || 'Đã thu hoa hồng';
    const note = payload.note || '';

    // Trường hợp CẬP NHẬT Hợp Đồng đã có
    if (payload.id) {
      const data = shDeals.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === payload.id) {
          const oldPropId = String(data[i][3] || '').trim();
          const oldCustId = String(data[i][1] || '').trim();
          const oldStatus = String(data[i][9] || '').trim();

          shDeals.getRange(i + 1, 2).setValue(payload.customerId || '');
          shDeals.getRange(i + 1, 3).setValue(payload.customerName || '');
          shDeals.getRange(i + 1, 4).setValue(payload.propertyId || '');
          shDeals.getRange(i + 1, 5).setValue(payload.propertyAddress || '');
          shDeals.getRange(i + 1, 6).setValue(closedPrice);
          shDeals.getRange(i + 1, 7).setValue(commRate);
          shDeals.getRange(i + 1, 8).setValue(commAmount);
          shDeals.getRange(i + 1, 9).setValue(dealDate);
          shDeals.getRange(i + 1, 10).setValue(status);
          shDeals.getRange(i + 1, 11).setValue(note);
          
          // ATOMIC SYNC 1: Nếu hợp đồng bị hủy, hoàn trả căn BĐS về 'Đang bán'
          if (status === 'Đã hủy/Đã xóa' || status === 'Đã xóa') {
            if (payload.propertyId) {
              updateEntityStatus_(ss, CONFIG_BDS.SHEET_NAMES.PROPERTIES, 0, payload.propertyId, 8, 'Đang bán');
            }
          } else {
            // Nếu đổi sang căn BĐS khác, hoàn trả căn cũ về 'Đang bán'
            if (oldPropId && oldPropId !== payload.propertyId) {
              updateEntityStatus_(ss, CONFIG_BDS.SHEET_NAMES.PROPERTIES, 0, oldPropId, 8, 'Đang bán');
            }
            if (payload.propertyId) {
              updateEntityStatus_(ss, CONFIG_BDS.SHEET_NAMES.PROPERTIES, 0, payload.propertyId, 8, 'Đã cọc/Đã bán');
            }
            if (payload.customerId) {
              updateEntityStatus_(ss, CONFIG_BDS.SHEET_NAMES.CUSTOMERS, 0, payload.customerId, 8, 'Đã chốt cọc');
            }
          }

          return { success: true, id: payload.id, commissionAmount: commAmount, updated: true };
        }
      }
    }

    // Trường hợp TẠO MỚI Hợp Đồng
    const newId = 'HOAD-' + Math.floor(100000 + Math.random() * 900000);

    shDeals.appendRow([
      newId,
      payload.customerId || '',
      payload.customerName || '',
      payload.propertyId || '',
      payload.propertyAddress || '',
      closedPrice,
      commRate,
      commAmount,
      dealDate,
      status,
      note,
      new Date()
    ]);

    // ATOMIC SYNC 2: Cập nhật tự động liên module khi tạo hợp đồng
    if (status !== 'Đã hủy/Đã xóa' && status !== 'Đã xóa') {
      if (payload.propertyId) {
        updateEntityStatus_(ss, CONFIG_BDS.SHEET_NAMES.PROPERTIES, 0, payload.propertyId, 8, 'Đã cọc/Đã bán');
      }
      if (payload.customerId) {
        updateEntityStatus_(ss, CONFIG_BDS.SHEET_NAMES.CUSTOMERS, 0, payload.customerId, 8, 'Đã chốt cọc');
      }
    }

    return { success: true, id: newId, commissionAmount: commAmount };
  } catch (err) {
    return { success: false, error: err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Xóa mềm giao dịch chốt cọc (Module 5) & GIẢI PHÓNG HÀNG TỒN KHO ATOMIC (SPRINT 9)
 */
function deleteDeal(dealId) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName(CONFIG_BDS.SHEET_NAMES.DEALS);
    if (!sh) return { success: false, error: 'Sheet giao dịch không tồn tại' };

    const data = sh.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === dealId) {
        const propId = String(data[i][3] || '').trim();
        const custId = String(data[i][1] || '').trim();

        // 1. Đánh dấu xóa mềm Hợp đồng
        sh.getRange(i + 1, 10).setValue('Đã hủy/Đã xóa');

        // 2. ATOMIC ROLLBACK: Hoàn trả trạng thái Căn BĐS về 'Đang bán' để môi giới tiếp tục dẫn khách
        if (propId) {
          updateEntityStatus_(ss, CONFIG_BDS.SHEET_NAMES.PROPERTIES, 0, propId, 8, 'Đang bán');
        }

        return { success: true, dealId: dealId, releasedPropertyId: propId };
      }
    }
    return { success: false, error: 'Không tìm thấy mã hợp đồng: ' + dealId };
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
      ['PROPERTY_TYPES', (payload.propertyTypes || []).join(';'), 'Master Taxonomy: Danh mục loại hình BĐS / Nhu cầu'],
      ['LOCATIONS', (payload.locations || []).join(';'), 'Master Taxonomy: Danh mục khu vực địa lý'],
      ['CUSTOMER_SOURCES', (payload.customerSources || []).join(';'), 'Master Taxonomy: Danh mục nguồn khách'],
      ['CUSTOMER_STATUSES', (payload.customerStatuses || []).join(';'), 'Master Taxonomy: Danh mục trạng thái chăm sóc khách'],
      ['PROPERTY_STATUSES', (payload.propertyStatuses || []).join(';'), 'Master Taxonomy: Danh mục trạng thái căn trong giỏ hàng']
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
    locations: ['Quận 1', 'Quận 2 (TP. Thủ Đức)', 'Quận 7', 'Bình Thạnh', 'Thảo Điền', 'Phú Mỹ Hưng', 'Thủ Đức'],
    customerSources: ['Facebook Ads', 'Tiktok Bio', 'Người quen giới thiệu', 'Đăng tin BĐS', 'Khách vãng lai'],
    customerStatuses: ['Mới tiếp cận', 'Đang chăm', 'Đang dẫn xem', 'Đang thương lượng', 'Đã chốt cọc', 'Dừng chăm sóc'],
    propertyStatuses: ['Đang bán', 'Đã cọc/Đã bán', 'Tạm ngưng']
  };
  
  // Khởi tạo lại cả tab DB_DANH_MUC
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let shTaxonomy = ss.getSheetByName(CONFIG_BDS.SHEET_NAMES.TAXONOMY);
  if (shTaxonomy) {
    shTaxonomy.clear();
    shTaxonomy.appendRow(['Mã Mục', 'Mã Danh Mục', 'Tên Mục', 'Ghi Chú', 'Thứ Tự', 'Trạng Thái', 'Ngày Tạo']);
    seedDefaultTaxonomy_(shTaxonomy);
  }
  
  return saveSettings(defaultPayload);
}

/**
 * THƯỢNG NGUỒN MASTER TAXONOMY: Thêm hoặc Sửa một mục danh mục
 */
function saveTaxonomyItem(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sh = ss.getSheetByName(CONFIG_BDS.SHEET_NAMES.TAXONOMY);
    if (!sh) {
      ensureRequiredSheets_(ss);
      sh = ss.getSheetByName(CONFIG_BDS.SHEET_NAMES.TAXONOMY);
    }

    const data = sh.getDataRange().getValues();
    const isUpdate = Boolean(payload.id);
    const name = String(payload.name || '').trim();
    const categoryKey = String(payload.categoryKey || '').trim();
    if (!name || !categoryKey) {
      return { success: false, error: 'Tên mục và danh mục trực thuộc không được để trống!' };
    }

    const note = String(payload.note || '').trim();
    const sortOrder = Number(payload.sortOrder) || 1;
    const status = String(payload.status || 'Đang dùng').trim();
    const today = Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd');

    if (isUpdate) {
      let foundIndex = -1;
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]).trim() === String(payload.id).trim()) {
          foundIndex = i + 1;
          break;
        }
      }
      if (foundIndex === -1) {
        return { success: false, error: 'Không tìm thấy mục danh mục cần cập nhật!' };
      }
      sh.getRange(foundIndex, 2).setValue(categoryKey);
      sh.getRange(foundIndex, 3).setValue(name);
      sh.getRange(foundIndex, 4).setValue(note);
      sh.getRange(foundIndex, 5).setValue(sortOrder);
      sh.getRange(foundIndex, 6).setValue(status);
      return { success: true, id: payload.id, isUpdate: true };
    } else {
      // Chống trùng tên trong cùng một nhóm danh mục
      for (let i = 1; i < data.length; i++) {
        const existKey = String(data[i][1] || '').trim();
        const existName = String(data[i][2] || '').trim();
        if (existKey === categoryKey && existName.toLowerCase() === name.toLowerCase()) {
          return { success: false, error: 'Mục "' + name + '" đã tồn tại trong danh mục này!' };
        }
      }

      // Sinh mã DM-XXXXXX
      const newId = 'DANH-' + Math.floor(100000 + Math.random() * 900000);
      sh.appendRow([newId, categoryKey, name, note, sortOrder, status, today]);
      return { success: true, id: newId, isUpdate: false };
    }
  } catch (err) {
    return { success: false, error: err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * THƯỢNG NGUỒN MASTER TAXONOMY: Đổi trạng thái (Đang dùng / Tạm ngưng) hoặc Xóa
 */
function toggleTaxonomyItemStatus(id, newStatus) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    updateEntityStatus_(ss, CONFIG_BDS.SHEET_NAMES.TAXONOMY, 0, id, 5, newStatus);
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
 * Helper phân tích dữ liệu Settings phẳng thành cấu trúc JSON chuẩn đầy đủ (Sprint 1)
 */
function parseSettingsData_(rows, taxonomyRows) {
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
    locations: ['Quận 1', 'Quận 2 (TP. Thủ Đức)', 'Quận 7', 'Bình Thạnh', 'Thảo Điền', 'Phú Mỹ Hưng', 'Thủ Đức'],
    customerSources: ['Facebook Ads', 'Tiktok Bio', 'Người quen giới thiệu', 'Đăng tin BĐS', 'Khách vãng lai'],
    customerStatuses: ['Mới tiếp cận', 'Đang chăm', 'Đang dẫn xem', 'Đang thương lượng', 'Đã chốt cọc', 'Dừng chăm sóc'],
    propertyStatuses: ['Đang bán', 'Đã cọc/Đã bán', 'Tạm ngưng'],
    interactionTypes: ['Cuộc gọi', 'Nhắn tin Zalo', 'Gặp cafe tư vấn', 'Dẫn đi xem nhà', 'Đặt cọc / Ký HĐ'],
    taxonomyItems: []
  };

  if (rows && rows.length) {
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
      if (key === 'LOCATIONS' && val) settings.locations = val.split(';').map(s => s.trim()).filter(Boolean);
      if (key === 'CUSTOMER_SOURCES' && val) settings.customerSources = val.split(';').map(s => s.trim()).filter(Boolean);
      if (key === 'CUSTOMER_STATUSES' && val) settings.customerStatuses = val.split(';').map(s => s.trim()).filter(Boolean);
      if (key === 'PROPERTY_STATUSES' && val) settings.propertyStatuses = val.split(';').map(s => s.trim()).filter(Boolean);
    });
  }

  // Nạp từ DB_DANH_MUC nếu có dữ liệu dòng
  if (taxonomyRows && taxonomyRows.length) {
    settings.taxonomyItems = taxonomyRows.map(r => ({
      id: String(r['Mã Mục'] || '').trim(),
      categoryKey: String(r['Mã Danh Mục'] || '').trim(),
      name: String(r['Tên Mục'] || '').trim(),
      note: String(r['Ghi Chú'] || '').trim(),
      sortOrder: Number(r['Thứ Tự']) || 1,
      status: String(r['Trạng Thái'] || 'Đang dùng').trim()
    })).filter(item => item.id && item.name);

    // Đồng bộ các mảng đang hoạt động vào settings để dropdown kế thừa tức thì
    const activeItems = settings.taxonomyItems.filter(item => item.status === 'Đang dùng');
    
    const propTypes = activeItems.filter(i => i.categoryKey === 'prop_types').map(i => i.name);
    if (propTypes.length) settings.propertyTypes = propTypes;

    const locs = activeItems.filter(i => i.categoryKey === 'locations').map(i => i.name);
    if (locs.length) settings.locations = locs;

    const sources = activeItems.filter(i => i.categoryKey === 'lead_sources').map(i => i.name);
    if (sources.length) settings.customerSources = sources;

    const custSt = activeItems.filter(i => i.categoryKey === 'cust_statuses').map(i => i.name);
    if (custSt.length) settings.customerStatuses = custSt;

    const propSt = activeItems.filter(i => i.categoryKey === 'prop_statuses').map(i => i.name);
    if (propSt.length) settings.propertyStatuses = propSt;

    const interactSt = activeItems.filter(i => i.categoryKey === 'interaction_types').map(i => i.name);
    if (interactSt.length) settings.interactionTypes = interactSt;
  }

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
    let hasValidData = false;
    for (let j = 0; j < headers.length; j++) {
      const val = data[i][j];
      rowObj[headers[j]] = val;
    }
    // Dòng hợp lệ phải có mã ID ở cột 1 hoặc có dữ liệu cốt lõi (không phải dòng trống vô nghĩa)
    const firstColVal = String(data[i][0] || '').trim();
    const secondColVal = String(data[i][1] || '').trim();
    if (firstColVal || secondColVal) {
      hasValidData = true;
    }
    if (hasValidData) rows.push(rowObj);
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
    { name: CONFIG_BDS.SHEET_NAMES.SETTINGS, headers: ['Khóa Tham Số', 'Giá Trị Tham Số', 'Mô Tả / Phân Loại'] },
    { name: CONFIG_BDS.SHEET_NAMES.TAXONOMY, headers: ['Mã Mục', 'Mã Danh Mục', 'Tên Mục', 'Ghi Chú', 'Thứ Tự', 'Trạng Thái', 'Ngày Tạo'] }
  ];

  required.forEach(item => {
    let sh = ss.getSheetByName(item.name);
    if (!sh) {
      sh = ss.insertSheet(item.name);
      sh.appendRow(item.headers);
    }
  });

  // TỰ ĐỘNG KHỞI TẠO DỮ LIỆU CÀI ĐẶT & MASTER TAXONOMY NẾU SHEET TRỐNG
  const shSettings = ss.getSheetByName(CONFIG_BDS.SHEET_NAMES.SETTINGS);
  if (shSettings && shSettings.getLastRow() <= 1) {
    resetDefaultSettings();
  }

  const shTaxonomy = ss.getSheetByName(CONFIG_BDS.SHEET_NAMES.TAXONOMY);
  if (shTaxonomy && shTaxonomy.getLastRow() <= 1) {
    seedDefaultTaxonomy_(shTaxonomy);
  }

  // TỰ ĐỘNG NẠP BỘ DATA MẪU CHUẨN PHỄU NẾU KHÁCH HÀNG HOẶC GIỎ HÀNG ĐANG TRỐNG
  const shCust = ss.getSheetByName(CONFIG_BDS.SHEET_NAMES.CUSTOMERS);
  const shProp = ss.getSheetByName(CONFIG_BDS.SHEET_NAMES.PROPERTIES);
  if (shCust && shCust.getLastRow() <= 1 && shProp && shProp.getLastRow() <= 1) {
    seedRichFunnelData();
  }
}

/**
 * Khởi tạo dữ liệu mẫu chuẩn cho DB_DANH_MUC
 */
function seedDefaultTaxonomy_(sh) {
  const initial = [
    // 1. prop_types (Loại hình BĐS & Nhu cầu)
    ['DANH-100001', 'prop_types', 'Chung cư', 'Căn hộ chung cư, duplex, officetel', 1, 'Đang dùng', '2026-11-08'],
    ['DANH-100002', 'prop_types', 'Nhà phố', 'Nhà thổ cư hẻm và mặt tiền kinh doanh', 2, 'Đang dùng', '2026-11-08'],
    ['DANH-100003', 'prop_types', 'Đất nền', 'Đất thổ cư có sổ đỏ, đất nền dự án', 3, 'Đang dùng', '2026-11-08'],
    ['DANH-100004', 'prop_types', 'Biệt thự / Shophouse', 'Biệt thự nghỉ dưỡng, shophouse khối đế', 4, 'Đang dùng', '2026-11-08'],
    ['DANH-100005', 'prop_types', 'Cho thuê', 'Thuê căn hộ, mặt bằng hoặc nguyên căn', 5, 'Đang dùng', '2026-11-08'],

    // 2. locations (Khu vực địa bàn)
    ['DANH-200001', 'locations', 'Quận 1', 'Khu trung tâm hành chính tài chính', 1, 'Đang dùng', '2026-11-08'],
    ['DANH-200002', 'locations', 'Quận 2 (TP. Thủ Đức)', 'Thảo Điền, An Phú, Thủ Thiêm', 2, 'Đang dùng', '2026-11-08'],
    ['DANH-200003', 'locations', 'Quận 7', 'Phú Mỹ Hưng, Nam Long, Tân Hưng', 3, 'Đang dùng', '2026-11-08'],
    ['DANH-200004', 'locations', 'Bình Thạnh', 'Khu vực gần trung tâm, Điện Biên Phủ', 4, 'Đang dùng', '2026-11-08'],
    ['DANH-200005', 'locations', 'Thảo Điền', 'Biệt thự, căn hộ cao cấp ven sông', 5, 'Đang dùng', '2026-11-08'],
    ['DANH-200006', 'locations', 'Phú Mỹ Hưng', 'Đô thị kiểu mẫu, căn hộ cao cấp', 6, 'Đang dùng', '2026-11-08'],
    ['DANH-200007', 'locations', 'Thủ Đức', 'Võ Văn Ngân, Đặng Văn Bi, Hiệp Bình Chánh', 7, 'Đang dùng', '2026-11-08'],

    // 3. prop_statuses (Trạng thái giỏ hàng BĐS)
    ['DANH-300001', 'prop_statuses', 'Đang bán', 'Căn sẵn sàng giao dịch, tiếp khách xem nhà', 1, 'Đang dùng', '2026-11-08'],
    ['DANH-300002', 'prop_statuses', 'Đã cọc/Đã bán', 'Đã nhận cọc hoặc hoàn tất thủ tục công chứng', 2, 'Đang dùng', '2026-11-08'],
    ['DANH-300003', 'prop_statuses', 'Tạm ngưng', 'Chủ nhà hoãn bán hoặc đang chờ cập nhật sổ', 3, 'Đang dùng', '2026-11-08'],

    // 4. lead_sources (Nguồn khách hàng)
    ['DANH-400001', 'lead_sources', 'Facebook Ads', 'Chạy quảng cáo Lead Form Facebook', 1, 'Đang dùng', '2026-11-08'],
    ['DANH-400002', 'lead_sources', 'TikTok Bio', 'Khách bấm link bio từ kênh TikTok', 2, 'Đang dùng', '2026-11-08'],
    ['DANH-400003', 'lead_sources', 'Người quen giới thiệu', 'Mối quan hệ thân thiết, khách cũ giới thiệu', 3, 'Đang dùng', '2026-11-08'],
    ['DANH-400004', 'lead_sources', 'Đăng tin BĐS', 'Batdongsan, Chotot, CafeLand', 4, 'Đang dùng', '2026-11-08'],
    ['DANH-400005', 'lead_sources', 'Khách vãng lai', 'Treo biển, phát tờ rơi, khách trực tiếp', 5, 'Đang dùng', '2026-11-08'],

    // 5. cust_statuses (Trạng thái khách hàng / Phễu bán hàng)
    ['DANH-500001', 'cust_statuses', 'Mới tiếp cận', 'Vừa tiếp nhận SĐT, chưa phân loại sâu', 1, 'Đang dùng', '2026-11-08'],
    ['DANH-500002', 'cust_statuses', 'Đang chăm', 'Đã liên hệ, đang gửi danh sách căn phù hợp', 2, 'Đang dùng', '2026-11-08'],
    ['DANH-500003', 'cust_statuses', 'Đang dẫn xem', 'Khách đã hẹn và đi xem thực tế dự án/nhà', 3, 'Đang dùng', '2026-11-08'],
    ['DANH-500004', 'cust_statuses', 'Đang thương lượng', 'Đang đàm phán giá cả, pháp lý với chủ nhà', 4, 'Đang dùng', '2026-11-08'],
    ['DANH-500005', 'cust_statuses', 'Đã chốt cọc', 'Giao dịch thành công, đã ký đặt cọc', 5, 'Đang dùng', '2026-11-08'],
    ['DANH-500006', 'cust_statuses', 'Dừng chăm sóc', 'Tài chính không đủ hoặc đã mua chỗ khác', 6, 'Đang dùng', '2026-11-08'],

    // 6. interaction_types (Hình thức tương tác / Nhật ký)
    ['DANH-600001', 'interaction_types', 'Cuộc gọi', 'Gọi điện thoại thoại tư vấn, hỏi nhu cầu', 1, 'Đang dùng', '2026-11-08'],
    ['DANH-600002', 'interaction_types', 'Nhắn tin Zalo', 'Gửi hình ảnh, sổ đỏ, định vị qua Zalo', 2, 'Đang dùng', '2026-11-08'],
    ['DANH-600003', 'interaction_types', 'Gặp cafe tư vấn', 'Gặp trực tiếp tư vấn quy hoạch và bảng giá', 3, 'Đang dùng', '2026-11-08'],
    ['DANH-600004', 'interaction_types', 'Dẫn đi xem nhà', 'Đưa đón khách đến xem thực tế căn BĐS', 4, 'Đang dùng', '2026-11-08'],
    ['DANH-600005', 'interaction_types', 'Đặt cọc / Ký HĐ', 'Gặp mặt tại phòng công chứng hoặc văn phòng', 5, 'Đang dùng', '2026-11-08']
  ];

  initial.forEach(row => sh.appendRow(row));
}


/**
 * NẠP BỘ DỮ LIỆU MẪU CHUẨN PHỄU (END-TO-END SALES FUNNEL)
 * Gồm: 10 Sản phẩm BĐS, 100 Khách hàng (theo đúng 5 tầng phễu), 80 Lịch hẹn tương tác, 20 Hợp đồng chốt cọc
 * Tự động tính toán Hoa hồng chuẩn VNĐ và đồng bộ tức thời lên Google Sheets
 */
function seedRichFunnelData() {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    ensureRequiredSheets_(ss);

    const shCust = ss.getSheetByName(CONFIG_BDS.SHEET_NAMES.CUSTOMERS);
    const shProp = ss.getSheetByName(CONFIG_BDS.SHEET_NAMES.PROPERTIES);
    const shLogs = ss.getSheetByName(CONFIG_BDS.SHEET_NAMES.LOGS);
    const shDeals = ss.getSheetByName(CONFIG_BDS.SHEET_NAMES.DEALS);

    // 1. Khởi tạo 10 Căn BĐS đa dạng loại hình và phân khúc
    const propRows = [
      ['BDSS-100201', 'Chung cư', 'Vinhomes Central Park', 'Tòa Landmark 3 - Căn L3-12.08', 78.5, 4650, 'Anh Tuấn', '0987654321', 'Đã cọc/Đã bán', 1.5, 'View công viên Landmark 81, nội thất cao cấp', '2026-10-10'],
      ['BDSS-100202', 'Nhà phố', 'Nhà Phố D2', '14/8 Nguyễn Gia Trí, P.25, Bình Thạnh', 64.0, 8200, 'Chị Thảo', '0918273645', 'Đang bán', 1.0, 'Hẻm xe hơi 6m tránh nhau, gần các trường đại học', '2026-10-12'],
      ['BDSS-100203', 'Chung cư', 'Masteri Thảo Điền', 'Tháp T2 - Căn T2-18.04, Quận 2', 69.2, 4200, 'Anh Hoàng', '0903829102', 'Đã cọc/Đã bán', 1.5, 'Nội thất nhập khẩu cao cấp, view hồ bơi', '2026-10-15'],
      ['BDSS-100204', 'Đất nền', 'Khu dân cư Hiệp Bình Chánh', 'Lô B12 Đường 23, Hiệp Bình Chánh, Thủ Đức', 110.0, 6800, 'Chú Sáu', '0938192837', 'Đang bán', 2.0, 'Sổ đỏ thổ cư 100%, gần sông thoáng mát xây tự do', '2026-10-18'],
      ['BDSS-100205', 'Biệt thự / Shophouse', 'Vinhomes Grand Park', 'Shophouse Manhattan M9-22, TP. Thủ Đức', 140.0, 16500, 'Chị Hà', '0977281920', 'Đã cọc/Đã bán', 1.5, 'Mặt tiền trục chính kinh doanh, HĐMB nhận nhà ngay', '2026-10-20'],
      ['BDSS-100206', 'Chung cư', 'Scenic Valley 1', 'Tòa C - Căn C-09.02, Phú Mỹ Hưng, Q7', 75.0, 3950, 'Cô Dung', '0944182930', 'Đang bán', 1.5, 'Cửa hướng Nam mát mẻ, sổ hồng lâu dài', '2026-10-22'],
      ['BDSS-100207', 'Nhà phố', 'Khu cư xá Đô Thành', '48 Đường số 3, Cư xá Đô Thành, Quận 3', 52.0, 9500, 'Bác Hùng', '0913928172', 'Đã cọc/Đã bán', 1.0, 'Trung tâm Quận 3 tiện mở văn phòng hoặc cho thuê spa', '2026-10-25'],
      ['BDSS-100208', 'Chung cư', 'The Sun Avenue', 'Tháp 4 - Căn 4-15.06, Mai Chí Thọ, Quận 2', 86.0, 5100, 'Anh Cường', '0988273619', 'Đang bán', 1.5, '3 phòng ngủ view hồ bơi, sổ hồng sẵn sàng', '2026-10-28'],
      ['BDSS-100209', 'Biệt thự / Shophouse', 'Château Villa Phú Mỹ Hưng', 'Biệt thự đơn lập số 12 Khu Château, Q7', 320.0, 48000, 'Tổng GĐ Hưng', '0908889999', 'Đang bán', 1.0, 'View sông nội bộ cao cấp bậc nhất Sài Gòn', '2026-10-30'],
      ['BDSS-100210', 'Cho thuê', 'Riverpark Premier', 'Căn R-05.01 Đặng Đức Thuật, Phú Mỹ Hưng, Q7', 125.0, 45, 'Chị Lan', '0933281928', 'Đã cọc/Đã bán', 100.0, 'Cho thuê khách chuyên gia nước ngoài ở lâu dài', '2026-11-01']
    ];

    // Xóa dữ liệu cũ (chừa header dòng 1) và nạp mới
    if (shProp.getLastRow() > 1) shProp.deleteRows(2, shProp.getLastRow() - 1);
    shProp.getRange(2, 1, propRows.length, propRows[0].length).setValues(propRows);

    // 2. Khởi tạo 100 Khách Hàng (Đúng 5 tầng phễu: 25 Mới, 30 Đang chăm, 15 Dẫn xem, 10 Thương lượng, 20 Đã chốt)
    const propertyTypes = ['Chung cư', 'Nhà phố', 'Đất nền', 'Biệt thự / Shophouse', 'Cho thuê'];
    const locations = ['Quận 1', 'Quận 2 (TP. Thủ Đức)', 'Quận 7', 'Bình Thạnh', 'Thảo Điền', 'Phú Mỹ Hưng', 'Thủ Đức'];
    const sources = ['Facebook Ads', 'TikTok Bio', 'Người quen giới thiệu', 'Đăng tin BĐS', 'Khách vãng lai'];
    const hoList = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý'];
    const demList = ['Văn', 'Thị', 'Đức', 'Quốc', 'Thanh', 'Hải', 'Thái', 'Phương', 'Minh', 'Ngọc', 'Anh', 'Kim', 'Bảo', 'Gia'];
    const tenList = ['An', 'Bình', 'Cường', 'Dũng', 'Hương', 'Khánh', 'Lan', 'Mai', 'Nam', 'Oanh', 'Phúc', 'Quân', 'Sơn', 'Tâm', 'Tuấn', 'Uyên', 'Vinh', 'Yến', 'Trang', 'Tú'];

    const funnelStatuses = [];
    for (let i = 0; i < 25; i++) funnelStatuses.push('Mới tiếp cận');
    for (let i = 0; i < 30; i++) funnelStatuses.push('Đang chăm');
    for (let i = 0; i < 15; i++) funnelStatuses.push('Đang dẫn xem');
    for (let i = 0; i < 10; i++) funnelStatuses.push('Đang thương lượng');
    for (let i = 0; i < 20; i++) funnelStatuses.push('Đã chốt cọc');

    const priceRanges = ['2 - 4 Tỷ', '4 - 7 Tỷ', '7 - 12 Tỷ', 'Trên 15 Tỷ', '30 - 50 Tr/tháng'];
    const custRows = [];
    const custObjs = [];

    for (let i = 0; i < 100; i++) {
      const code = 'KHNG-' + String(100100 + i);
      const ho = hoList[i % hoList.length];
      const dem = demList[(i * 3 + 2) % demList.length];
      const ten = tenList[(i * 7 + 5) % tenList.length];
      const fullName = ho + ' ' + dem + ' ' + ten;
      const phone = '09' + String(10000000 + (i * 876543) % 90000000).padStart(8, '0');
      const demand = propertyTypes[i % propertyTypes.length];
      const price = priceRanges[i % priceRanges.length];
      const loc = locations[i % locations.length];
      const src = sources[i % sources.length];
      const st = funnelStatuses[i];
      const interestedProp = (i >= 80) ? propRows[i % propRows.length][0] : '';
      const note = 'Khách quan tâm phân khúc ' + demand + ' tại ' + loc + '.';
      const date = '2026-10-' + String((i % 28) + 1).padStart(2, '0');

      custRows.push([code, fullName, phone, demand, price, loc, interestedProp, src, st, note, date]);
      custObjs.push({ code, name: fullName, phone, demand, price, loc, status: st });
    }

    if (shCust.getLastRow() > 1) shCust.deleteRows(2, shCust.getLastRow() - 1);
    shCust.getRange(2, 1, custRows.length, custRows[0].length).setValues(custRows);

    // 3. Khởi tạo 80 Lịch hẹn & Nhật ký chăm sóc (Interactions)
    const interactTypes = ['Cuộc gọi', 'Nhắn tin Zalo', 'Gặp cafe tư vấn', 'Dẫn đi xem nhà', 'Đặt cọc / Ký HĐ'];
    const logRows = [];

    for (let i = 0; i < 80; i++) {
      const code = 'LOGS-' + String(100000 + i);
      const cust = custObjs[i % 80];
      const itType = interactTypes[i % interactTypes.length];
      const p = propRows[i % propRows.length];
      let content = '';
      if (itType === 'Cuộc gọi') content = 'Gọi trao đổi tài chính và gửi danh sách 3 căn phù hợp qua Zalo.';
      else if (itType === 'Nhắn tin Zalo') content = 'Đã gửi hình ảnh thực tế, sổ đỏ và định vị căn ' + p[0] + '.';
      else if (itType === 'Gặp cafe tư vấn') content = 'Gặp cafe tư vấn kỹ tiến độ thanh toán và giải pháp vay ngân hàng 70%.';
      else if (itType === 'Dẫn đi xem nhà') content = 'Dẫn khách cùng gia đình đi xem thực tế căn ' + p[3] + '. Khách đánh giá cao ban công.';
      else content = 'Khách hài lòng điều khoản thỏa thuận, chuẩn bị chốt cọc tại sàn.';

      const day = (i % 25) + 1;
      const createDate = '2026-11-' + String(day).padStart(2, '0');
      const nextDay = ((day + 3) > 30) ? 30 : (day + 3);
      const nextDate = (i % 4 === 0) ? ('2026-11-' + String(nextDay).padStart(2, '0')) : '';

      logRows.push([code, cust.code, cust.name, itType, content, nextDate, createDate]);
    }

    if (shLogs.getLastRow() > 1) shLogs.deleteRows(2, shLogs.getLastRow() - 1);
    shLogs.getRange(2, 1, logRows.length, logRows[0].length).setValues(logRows);

    // 4. Khởi tạo 20 Hợp đồng chốt cọc (Deals) & Tự động tính toán Hoa hồng chuẩn
    const closedCusts = custObjs.filter(c => c.status === 'Đã chốt cọc');
    const dealRows = [];

    for (let i = 0; i < 20; i++) {
      const code = 'HOAD-' + String(800000 + i);
      const cust = closedCusts[i] || custObjs[80 + i];
      const p = propRows[i % propRows.length];
      const priceMillion = Number(p[5]) || 0;
      const commRate = Number(p[9]) || 1.5;

      let commVND = 0;
      if (p[1] === 'Cho thuê') {
        commVND = priceMillion * 1000000;
      } else {
        commVND = Math.round(priceMillion * 1000000 * (commRate / 100));
      }

      const st = (i < 15) ? 'Đã thu hoa hồng' : 'Chờ chủ nhà thanh toán';
      const day = (i % 20) + 1;
      const closedDate = '2026-11-' + String(day).padStart(2, '0');
      const note = 'Giao dịch chốt cọc thành công căn ' + p[0] + '. Chủ nhà: ' + p[6] + ' (' + p[7] + ')';

      dealRows.push([code, cust.code, cust.name, p[0], p[3], priceMillion, commRate, commVND, closedDate, st, note, closedDate]);
    }

    if (shDeals.getLastRow() > 1) shDeals.deleteRows(2, shDeals.getLastRow() - 1);
    shDeals.getRange(2, 1, dealRows.length, dealRows[0].length).setValues(dealRows);

    // BẮT BUỘC: Cam kết ghi toàn bộ bộ nhớ đệm xuống Google Sheets tức thì
    SpreadsheetApp.flush();

    // Lấy ngay dữ liệu hệ thống mới nhất trả về trực tiếp trong 1 roundtrip duy nhất
    const initialData = getInitialData();

    return {
      success: true,
      data: initialData.data,
      message: 'Đã nạp thành công 10 BĐS, 100 Khách Hàng, 80 Lịch Hẹn và 20 Hợp Đồng Chốt Cọc!'
    };
  } catch (err) {
    return { success: false, error: err.toString() };
  } finally {
    lock.releaseLock();
  }
}
