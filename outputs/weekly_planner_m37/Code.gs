/**
 * ============================================================================
 * DỰ ÁN: WEEKLY PLANNER & ROUTINE DASHBOARD (MẪU M37 - FILE ĐI LÀM)
 * PHIÊN BẢN: 3.6.0 (DẸP BỎ MA TRẬN PHỨC TẠP - QUY VỀ DẢI Ô B1:C8 CHUẨN ĐƠN GIẢN)
 * TIÊU CHUẨN: STANDARDS_TEMPLATE/AGENTS_MASTER.md
 * ============================================================================
 * 
 * GIẢI THÍCH CHO CÂU HỎI "SAO VẪN LÀ A15:H22 GÌ KÌ VẬY":
 * - Bản cũ cố tình dùng ma trận chéo A15:H22 (7 hàng x 8 cột) để tạo màu riêng
 *   cho từng cột, nhưng cấu trúc này quá phức tạp và làm công cụ Chart bị lỗi.
 * - BẢN 3.6.0 ĐÃ XÓA SẠCH MA TRẬN A15:H22!
 * - Quy về bảng dữ liệu 2 cột chuẩn mực duy nhất: DB_PLANNER!B1:C8
 *   + Cột B: Tên thứ (Thứ 2, Thứ 3, Thứ 4, Thứ 5, Thứ 6, Thứ 7, CN)
 *   + Cột C: Tỷ lệ % hoàn thành
 * - Biểu đồ cột nhận ngay lập tức, thanh vẽ cao rõ ràng, siêu nhẹ và siêu mượt!
 * - Vòng Donut nhận đúng dải ô có tiêu đề (J1:K3, J5:K7...) vẽ 2 lát [Đã xong, Chưa xong].
 */

const SHEET_MAIN = 'Weekly Planner';
const SHEET_DB = 'DB_PLANNER';
const FONT_FAMILY = 'Google Sans, Roboto, Arial, sans-serif';

const THEME = {
  bgMain: '#FFFDFB',      // Nền kem ấm pastel toàn sheet
  bgCard: '#FFFFFF',      // Nền thẻ card trắng sáng
  bgCardSoft: '#FAF8F5',  // Nền thẻ card kem mịn
  textDark: '#1E293B',    // Chữ than đậm
  textMuted: '#64748B',   // Chữ xám tro thanh lịch
  textSlate: '#475569',   // Chữ phụ
  borderCard: '#EAE4DC',  // Viền thẻ mềm mại
  borderRow: '#F2ECE5',   // Viền ngăn cách hàng nhẹ
  
  days: [
    { name: 'Thứ hai', key: 'mon', color: '#4E9F8E', light: '#E9F5F2', bgHeader: '#5EAAA8' },
    { name: 'Thứ ba',  key: 'tue', color: '#6B9080', light: '#EEF5F1', bgHeader: '#7BA490' },
    { name: 'Thứ tư',  key: 'wed', color: '#9A82B5', light: '#F4EFF8', bgHeader: '#A892C2' },
    { name: 'Thứ năm', key: 'thu', color: '#D97D64', light: '#FDF1ED', bgHeader: '#E28C75' },
    { name: 'Thứ sáu', key: 'fri', color: '#5B84B1', light: '#EDF3F9', bgHeader: '#6C93BF' }
  ],
  
  sidebar: {
    calHeaderBg: '#EAE4F2',
    calHeaderText: '#5C4B70',
    calDayBg: '#F7F3EE',
    calActiveBg: '#4E9F8E',
    calActiveText: '#FFFFFF',
    habitHeaderBg: '#DFEFEA',
    habitHeaderText: '#2A6356',
    goalsHeaderBg: '#F9EBE5',
    goalsHeaderText: '#874D3D'
  }
};

function getFormulaSeparator_(ss) {
  const locale = ss.getSpreadsheetLocale() || 'vi_VN';
  return /^(vi|de|fr|it|es|pt|ru|nl|da|sv|no|fi|pl|tr)/i.test(locale) ? ';' : ',';
}

function onOpen(e) {
  try {
    SpreadsheetApp.getUi()
      .createMenu('FILE ĐI LÀM (v3.6.0)')
      .addItem('Khởi tạo Sheet Weekly Planner M37 Chuẩn (v3.6.0)', 'buildWeeklyPlanner')
      .addSeparator()
      .addItem('Xóa dữ liệu / Sang tuần mới (Clear Planner)', 'clearPlannerData')
      .addItem('Cập nhật Biểu đồ (Refresh Charts)', 'rebuildCharts')
      .addToUi();
  } catch (err) {
    console.log('Chạy từ Editor: ' + err);
  }
}

/**
 * HÀM CHÍNH KHỞI TẠO TOÀN DIỆN
 */
function buildWeeklyPlanner() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sep = getFormulaSeparator_(ss);

  // Đổi tên file để nhận biết rõ ràng phiên bản v3.6.0
  try {
    ss.rename('WEEKLY PLANNER & ROUTINE DASHBOARD M37 v3.6.0 — FILE ĐI LÀM');
  } catch (e) {
    console.log('Không thể đổi tên file: ' + e);
  }

  // 1. DỰNG TAB DATABASE NGẦM DB_PLANNER (CỰC KỲ ĐƠN GIẢN & CHUẨN XÁC)
  setupDatabaseSheet_(ss, sep);

  // 2. DỰNG SHEET GIAO DIỆN CHÍNH
  let sheet = ss.getSheetByName(SHEET_MAIN);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_MAIN, 0);
  } else {
    sheet.clear();
    const existingCharts = sheet.getCharts();
    existingCharts.forEach(c => sheet.removeChart(c));
  }

  sheet.setTabColor(THEME.days[0].color);
  sheet.setHiddenGridlines(false);

  // CỘT VÀ HÀNG
  sheet.setColumnWidth(1, 16);  // A
  sheet.setColumnWidth(2, 108); // B
  for (let c = 3; c <= 9; c++) {
    sheet.setColumnWidth(c, 29); // C - I
  }
  sheet.setColumnWidth(10, 18); // J: Spacer

  const dayStartCols = [11, 14, 17, 20, 23]; // K, N, Q, T, W (5 thứ)
  dayStartCols.forEach(col => {
    sheet.setColumnWidth(col, 30);     // Checkbox
    sheet.setColumnWidth(col + 1, 155);// Task description
    sheet.setColumnWidth(col + 2, 55); // Time
  });

  const maxCols = sheet.getMaxColumns();
  if (maxCols > 26) {
    sheet.deleteColumns(27, maxCols - 26);
  }

  sheet.setRowHeight(1, 15);
  sheet.setRowHeight(2, 28);
  sheet.setRowHeight(3, 26);
  sheet.setRowHeight(4, 24);
  for (let r = 5; r <= 10; r++) {
    sheet.setRowHeight(r, 20); // Chuẩn hóa hàng 5-10 đồng đều 20px
  }
  sheet.setRowHeight(11, 24); // Today Tasks header
  sheet.setRowHeights(12, 12, 26); // 12 tasks (Hàng 12 -> 23)
  sheet.setRowHeight(24, 22); // NOTES header
  sheet.setRowHeights(25, 7, 22); // 7 hàng Notes (Hàng 25 -> 31)

  sheet.getRange(1, 1, 31, 26)
    .setFontFamily(FONT_FAMILY)
    .setFontColor(THEME.textDark)
    .setBackground(THEME.bgMain);

  // =========================================================================
  // SIDEBAR TRÁI PASTEL FINTECH (CỘT B -> I)
  // =========================================================================
  sheet.getRange('B2:E2').merge()
    .setValue('PLANNER WEEKLY START')
    .setFontWeight('bold')
    .setFontSize(8)
    .setFontColor(THEME.textMuted)
    .setVerticalAlignment('middle');
    
  const clearBtn = sheet.getRange('F2:I2');
  clearBtn.merge()
    .setValue('Clear Planner')
    .setFontWeight('bold')
    .setFontSize(8)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setBackground(THEME.days[0].light)
    .setFontColor(THEME.days[0].color)
    .setBorder(true, true, true, true, false, false, '#C8E6DF', SpreadsheetApp.BorderStyle.SOLID);

  const startDayCell = sheet.getRange('B3:E3');
  startDayCell.merge()
    .setValue(new Date(2026, 8, 25))
    .setNumberFormat('dddd, dd "tháng" mm, yyyy')
    .setFontWeight('bold')
    .setFontSize(9)
    .setFontColor(THEME.textDark)
    .setVerticalAlignment('middle');
    
  sheet.getRange('F3:I3').merge()
    .setValue('Tháng 9 - 2026')
    .setFontWeight('bold')
    .setFontSize(9)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setBackground(THEME.bgCard)
    .setFontColor(THEME.sidebar.calHeaderText)
    .setBorder(true, true, true, true, false, false, THEME.borderCard, SpreadsheetApp.BorderStyle.SOLID);

  // Lịch Mini Card Nổi
  const calRange = sheet.getRange('B4:I10');
  calRange.clearFormat();
  calRange.setNumberFormat('@'); // Khóa định dạng Text phẳng, triệt tiêu lỗi 1300%

  sheet.getRange('B4:I4')
    .setBackground(THEME.sidebar.calHeaderBg)
    .setBorder(true, true, false, true, false, false, THEME.borderCard, SpreadsheetApp.BorderStyle.SOLID);
    
  const calHeaders = ['Tuần', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  for (let c = 0; c < 8; c++) {
    sheet.getRange(4, 2 + c).setValue(calHeaders[c])
      .setFontSize(7)
      .setFontWeight('bold')
      .setFontColor(THEME.sidebar.calHeaderText)
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle');
  }
  
  const calGridData = [
    ['1', '', '', '', '', '', '', '1'],
    ['2', '2', '3', '4', '5', '6', '7', '8'],
    ['3', '9', '10', '11', '12', '13', '14', '15'],
    ['4', '16', '17', '18', '19', '20', '21', '22'],
    ['5', '23', '24', '25', '26', '27', '28', '29'],
    ['6', '30', '', '', '', '', '', '']
  ];
  
  for (let r = 0; r < calGridData.length; r++) {
    const curRow = 5 + r;
    sheet.setRowHeight(curRow, 20); // Chiều cao hàng chuẩn 20px
    for (let c = 0; c < 8; c++) {
      const val = calGridData[r][c];
      const cell = sheet.getRange(curRow, 2 + c);
      cell.setNumberFormat('@');
      cell.setValue(val ? '' + val : '')
        .setFontSize(8)
        .setHorizontalAlignment('center')
        .setVerticalAlignment('middle');
        
      if (c === 0) {
        cell.setFontColor(THEME.textMuted).setBackground(THEME.sidebar.calDayBg);
      } else if (val === '25') {
        cell.setBackground(THEME.sidebar.calActiveBg)
          .setFontWeight('bold')
          .setFontColor(THEME.sidebar.calActiveText);
      } else {
        cell.setBackground(THEME.bgCard).setFontColor(val ? THEME.textDark : '#CBD5E1');
      }
      cell.setBorder(true, true, true, true, false, false, THEME.borderRow, SpreadsheetApp.BorderStyle.SOLID);
    }
  }

  // Khung chứa Biểu đồ Cột (Hàng 11 -> 19)
  sheet.getRange(11, 2, 9, 8)
    .setBackground(THEME.bgCard)
    .setBorder(true, true, true, true, false, false, THEME.borderCard, SpreadsheetApp.BorderStyle.SOLID);

  // Thẻ Habit Tracker (Hàng 20 -> 26)
  sheet.getRange('B20:I20').merge()
    .setValue('THEO DÕI THÓI QUEN')
    .setFontWeight('bold')
    .setFontSize(8)
    .setFontColor(THEME.sidebar.habitHeaderText)
    .setBackground(THEME.sidebar.habitHeaderBg)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setBorder(true, true, false, true, false, false, THEME.borderCard, SpreadsheetApp.BorderStyle.SOLID);

  sheet.getRange('B21').setValue('Thói quen').setFontSize(7).setFontWeight('bold').setFontColor(THEME.sidebar.habitHeaderText);
  const habitDayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  for (let c = 0; c < 7; c++) {
    sheet.getRange(21, 3 + c).setValue(habitDayLabels[c]).setFontSize(7).setFontWeight('bold').setFontColor(THEME.sidebar.habitHeaderText).setHorizontalAlignment('center');
  }
  sheet.getRange('B21:I21')
    .setBackground('#EEF7F4')
    .setBorder(true, true, true, true, false, false, THEME.borderRow, SpreadsheetApp.BorderStyle.SOLID);

  const habits = [
    'Đọc sách 30 phút',
    'Tập thể dục / Gym',
    'Uống 2 lít nước',
    'Học kỹ năng mới',
    'Viết nhật ký ngày'
  ];

  for (let i = 0; i < habits.length; i++) {
    const curRow = 22 + i;
    sheet.setRowHeight(curRow, 20);
    const rowBg = i % 2 === 0 ? THEME.bgCard : THEME.bgCardSoft;
    
    sheet.getRange(curRow, 2).setValue(habits[i])
      .setFontSize(8)
      .setFontColor(THEME.textDark)
      .setVerticalAlignment('middle');
    
    const habitChecks = sheet.getRange(curRow, 3, 1, 7);
    habitChecks.insertCheckboxes().setHorizontalAlignment('center').setVerticalAlignment('middle');
    
    if (i === 0) habitChecks.setValues([[true, true, true, true, true, false, false]]);
    if (i === 1) habitChecks.setValues([[true, true, false, true, true, false, false]]);
    if (i === 2) habitChecks.setValues([[true, true, true, true, true, true, true]]);
    if (i === 3) habitChecks.setValues([[false, true, true, true, true, false, false]]);
    if (i === 4) habitChecks.setValues([[true, true, true, false, true, false, false]]);
    
    sheet.getRange(curRow, 2, 1, 8)
      .setBackground(rowBg)
      .setBorder(true, true, true, true, false, false, THEME.borderRow, SpreadsheetApp.BorderStyle.SOLID);
  }

  // Thẻ Weekly Goals (Hàng 27 -> 31)
  sheet.getRange('B27:I27').merge()
    .setValue('MỤC TIÊU CỐT LÕI CỦA TUẦN')
    .setFontWeight('bold')
    .setFontSize(8)
    .setFontColor(THEME.sidebar.goalsHeaderText)
    .setBackground(THEME.sidebar.goalsHeaderBg)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setBorder(true, true, false, true, false, false, THEME.borderCard, SpreadsheetApp.BorderStyle.SOLID);

  const goals = [
    'Hoàn thiện giao diện & Bàn giao đúng hạn',
    'Đạt 100% mục tiêu Routine tập thể dục',
    'Duy trì đọc sách tối thiểu 5 ngày',
    'Review chi tiêu và kế hoạch tài chính'
  ];

  for (let i = 0; i < goals.length; i++) {
    const curRow = 28 + i;
    sheet.setRowHeight(curRow, 20);
    const rowBg = i % 2 === 0 ? THEME.bgCard : THEME.bgCardSoft;
    
    const chk = sheet.getRange(curRow, 2);
    chk.insertCheckboxes().setHorizontalAlignment('center').setVerticalAlignment('middle');
    if (i < 2) chk.setValue(true);
    
    sheet.getRange(curRow, 3, 1, 7).merge()
      .setValue(goals[i])
      .setFontSize(8)
      .setFontColor(THEME.textSlate)
      .setVerticalAlignment('middle');
      
    sheet.getRange(curRow, 2, 1, 8)
      .setBackground(rowBg)
      .setBorder(true, true, true, true, false, false, THEME.borderRow, SpreadsheetApp.BorderStyle.SOLID);
  }

  // =========================================================================
  // KHỐI 5 NGÀY TRONG TUẦN (CỘT K -> Y)
  // =========================================================================
  sheet.getRange('K2:Y2').merge()
    .setValue('Weekly Planner v3.6.0')
    .setFontSize(22)
    .setFontWeight('bold')
    .setFontFamily('Georgia, serif')
    .setFontColor(THEME.textDark)
    .setHorizontalAlignment('right')
    .setVerticalAlignment('middle');

  const sampleMainFocus = [
    'Tập trung vào giải đề toán',
    'Hoàn thành bài tập dự án',
    'Viết kịch bản video TikTok',
    'Thiết kế giao diện người dùng',
    'Tổng kết tuần và lên kế hoạch mới'
  ];

  const sampleTaskLists = [
    ['Lập trình viên', '08:30'],
    ['Giáo viên', '09:00'],
    ['Bác sĩ', '10:00'],
    ['Kỹ sư xây dựng', '11:00'],
    ['Thiết kế đồ họa', '14:30'],
    ['Nhân viên bán hàng', '15:00'],
    ['Marketing online', '16:00'],
    ['Kế toán viên', '17:00'],
    ['Nhạc sĩ', '18:00'],
    ['Chuyên viên nhân sự', '19:30'],
    ['Biên kịch', '20:30'],
    ['Quản lý dự án', '21:30']
  ];

  const dayDbRows = [2, 3, 4, 5, 6];

  dayStartCols.forEach((startCol, idx) => {
    const dayTheme = THEME.days[idx];
    const dbRow = dayDbRows[idx];

    // Header Thứ
    sheet.getRange(4, startCol, 1, 3).merge()
      .setValue(dayTheme.name)
      .setFontWeight('bold')
      .setFontSize(11)
      .setFontColor('#FFFFFF')
      .setBackground(dayTheme.bgHeader)
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle')
      .setBorder(true, true, false, true, false, false, dayTheme.bgHeader, SpreadsheetApp.BorderStyle.SOLID);

    // Ngày tháng
    sheet.getRange(5, startCol, 1, 3).merge()
      .setFormula('=$B$3 + ' + idx)
      .setNumberFormat('dd "tháng" mm, yyyy')
      .setFontSize(8)
      .setFontWeight('bold')
      .setFontColor(dayTheme.color)
      .setBackground(dayTheme.light)
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle');

    // Label Tiến độ hoàn thành
    sheet.getRange(6, startCol, 1, 3).merge()
      .setValue('Tiến độ hoàn thành')
      .setFontSize(8)
      .setFontColor(THEME.textMuted)
      .setHorizontalAlignment('center')
      .setBackground(THEME.bgCard);

    // HÀNG 7: Ô NỀN CHỨA SỐ % TẠI TÂM BIỂU ĐỒ DONUT
    const pctCell = sheet.getRange(7, startCol, 1, 3);
    pctCell.merge()
      .setFormula(`=DB_PLANNER!C${dbRow}`)
      .setFontSize(13)
      .setFontWeight('bold')
      .setFontColor(dayTheme.color)
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle')
      .setNumberFormat('0%')
      .setBackground(THEME.bgCard)
      .setBorder(true, true, true, true, false, false, THEME.borderCard, SpreadsheetApp.BorderStyle.SOLID);

    // Main Focus
    sheet.getRange(8, startCol, 1, 3).merge()
      .setValue('Main Focus')
      .setFontWeight('bold')
      .setFontSize(8)
      .setFontColor(dayTheme.color)
      .setBackground(dayTheme.light)
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle');

    sheet.getRange(9, startCol, 1, 3).merge()
      .setValue(sampleMainFocus[idx])
      .setFontSize(8)
      .setFontWeight('bold')
      .setFontColor(THEME.textDark)
      .setBackground(THEME.bgCard)
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle')
      .setWrap(true)
      .setBorder(true, true, true, true, false, false, THEME.borderCard, SpreadsheetApp.BorderStyle.SOLID);

    // Thống kê Done | Pending | Total
    sheet.getRange(10, startCol).setFormula(`=DB_PLANNER!D${dbRow}`).setFontSize(8).setFontWeight('bold').setFontColor(dayTheme.color).setHorizontalAlignment('center');
    sheet.getRange(10, startCol + 1).setFormula(`=DB_PLANNER!E${dbRow}`).setFontSize(8).setFontColor(THEME.textMuted).setHorizontalAlignment('center');
    sheet.getRange(10, startCol + 2).setFormula(`=DB_PLANNER!F${dbRow}`).setFontSize(8).setFontWeight('bold').setFontColor(THEME.textDark).setHorizontalAlignment('center');
    sheet.getRange(10, startCol, 1, 3).setBackground(THEME.bgCardSoft).setBorder(true, true, true, true, false, false, THEME.borderCard, SpreadsheetApp.BorderStyle.SOLID);

    // Tasks Header
    sheet.getRange(11, startCol).setValue('V').setFontWeight('bold').setFontSize(8).setFontColor(THEME.textMuted).setHorizontalAlignment('center').setBackground(dayTheme.light);
    sheet.getRange(11, startCol + 1).setValue('Today Tasks').setFontWeight('bold').setFontSize(8).setFontColor(THEME.textMuted).setBackground(dayTheme.light);
    sheet.getRange(11, startCol + 2).setValue('Time').setFontWeight('bold').setFontSize(8).setFontColor(THEME.textMuted).setHorizontalAlignment('center').setBackground(dayTheme.light);
    sheet.getRange(11, startCol, 1, 3).setBorder(true, true, true, true, false, false, THEME.borderCard, SpreadsheetApp.BorderStyle.SOLID);

    // Tasks Content
    const checkRange = sheet.getRange(12, startCol, 12, 1);
    checkRange.insertCheckboxes().setHorizontalAlignment('center').setVerticalAlignment('middle');

    const doneCounts = [8, 10, 8, 9, 5];
    const numDone = doneCounts[idx];

    for (let r = 0; r < 12; r++) {
      const curRow = 12 + r;
      if (r < numDone) {
        sheet.getRange(curRow, startCol).setValue(true);
      }
      sheet.getRange(curRow, startCol + 1).setValue(sampleTaskLists[r][0]).setFontSize(8).setVerticalAlignment('middle');
      sheet.getRange(curRow, startCol + 2).setValue(sampleTaskLists[r][1]).setFontSize(7).setFontColor(THEME.textMuted).setHorizontalAlignment('center').setVerticalAlignment('middle');
      
      const rowBg = r % 2 === 0 ? THEME.bgCard : THEME.bgCardSoft;
      sheet.getRange(curRow, startCol, 1, 3)
        .setBackground(rowBg)
        .setBorder(true, true, true, true, false, false, THEME.borderRow, SpreadsheetApp.BorderStyle.SOLID);
    }

    // Notes
    sheet.getRange(24, startCol, 1, 3).merge()
      .setValue('NOTES, SỰ KIỆN')
      .setFontWeight('bold')
      .setFontSize(8)
      .setFontColor(dayTheme.color)
      .setBackground(dayTheme.light)
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle');

    sheet.getRange(25, startCol, 7, 3).merge()
      .setValue('Ghi chú bài học, tiến độ và các ý tưởng cần lưu ý trong ngày...')
      .setFontSize(8)
      .setFontColor('#94A3B8')
      .setBackground(THEME.bgCard)
      .setVerticalAlignment('top')
      .setWrap(true)
      .setBorder(true, true, true, true, false, false, THEME.borderCard, SpreadsheetApp.BorderStyle.SOLID);
  });

  // CONDITIONAL FORMATTING: GẠCH CHỮ KHI CHECK XONG
  const rules = [];
  dayStartCols.forEach(startCol => {
    const colLetter = sheet.getRange(1, startCol).getA1Notation().replace(/\d+/, '');
    const rangeToFormat = sheet.getRange(12, startCol + 1, 12, 2);
    
    const rule = SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied(`=$${colLetter}12=TRUE`)
      .setStrikethrough(true)
      .setFontColor('#94A3B8')
      .setBackground('#F8FAFC')
      .setRanges([rangeToFormat])
      .build();
    rules.push(rule);
  });
  sheet.setConditionalFormatRules(rules);

  // CẮT GỌN TẠI HÀNG 31
  const curMaxRows = sheet.getMaxRows();
  if (curMaxRows > 31) {
    sheet.deleteRows(32, curMaxRows - 31);
  }

  SpreadsheetApp.flush();

  // DỰNG BIỂU ĐỒ CHUẨN
  rebuildCharts();

  try {
    SpreadsheetApp.getUi().alert('Khởi tạo hoàn tất!', 'Bản v3.6 đã quy về dải ô chuẩn DB_PLANNER!B1:C8 cực kỳ đơn giản và sạch sẽ. Cả Biểu đồ Cột và 5 Donut Chart đã vẽ lên trọn vẹn 100%!', SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (e) {
    console.log('Hoàn tất khởi tạo buildWeeklyPlanner thành công!');
  }
}

/**
 * THIẾT LẬP TAB DB_PLANNER (DẢI Ô B1:C8 DUY NHẤT & NGUỒN DONUT RÕ RÀNG)
 */
function setupDatabaseSheet_(ss, sep) {
  let dbSheet = ss.getSheetByName(SHEET_DB);
  if (!dbSheet) {
    dbSheet = ss.insertSheet(SHEET_DB);
  } else {
    dbSheet.clear();
  }
  dbSheet.setTabColor('#64748B');

  // 1. DỮ LIỆU CHÍNH: CỘT B (TÊN THỨ) & CỘT C (TỶ LỆ %) -> DẢI Ô B1:C8
  const dbHeaders = ['Mã ngày', 'Tên thứ', 'Tỷ lệ %', 'Số việc xong (Done)', 'Chưa xong (Pending)', 'Tổng việc (Total)'];
  dbSheet.getRange(1, 1, 1, 6).setValues([dbHeaders]).setFontWeight('bold').setBackground('#E2E8F0');

  const dayConfigs = [
    { code: 'MON', name: 'Thứ 2', chkCol: 'K', taskCol: 'L' },
    { code: 'TUE', name: 'Thứ 3', chkCol: 'N', taskCol: 'O' },
    { code: 'WED', name: 'Thứ 4', chkCol: 'Q', taskCol: 'R' },
    { code: 'THU', name: 'Thứ 5', chkCol: 'T', taskCol: 'U' },
    { code: 'FRI', name: 'Thứ 6', chkCol: 'W', taskCol: 'X' },
    { code: 'SAT', name: 'Thứ 7', chkCol: '', taskCol: '' },
    { code: 'SUN', name: 'CN',    chkCol: '', taskCol: '' }
  ];

  for (let i = 0; i < dayConfigs.length; i++) {
    const r = 2 + i;
    const cfg = dayConfigs[i];
    dbSheet.getRange(r, 1).setValue(cfg.code);
    dbSheet.getRange(r, 2).setValue(cfg.name);

    if (cfg.chkCol) {
      // Bắt buộc dùng ';' cho locale vi_VN để tránh lỗi Formula Parse Error #ERROR!
      dbSheet.getRange(r, 4).setFormula(`=COUNTIF('${SHEET_MAIN}'!${cfg.chkCol}12:${cfg.chkCol}23; TRUE)`);
      dbSheet.getRange(r, 6).setFormula(`=COUNTA('${SHEET_MAIN}'!${cfg.taskCol}12:${cfg.taskCol}23)`);
      dbSheet.getRange(r, 5).setFormula(`=F${r} - D${r}`);
      dbSheet.getRange(r, 3).setFormula(`=IFERROR(D${r} / F${r}; 0)`).setNumberFormat('0%');
    } else {
      dbSheet.getRange(r, 3).setValue(i === 5 ? 0.75 : 0.60).setNumberFormat('0%');
      dbSheet.getRange(r, 4).setValue(i === 5 ? 9 : 6);
      dbSheet.getRange(r, 5).setValue(i === 5 ? 3 : 4);
      dbSheet.getRange(r, 6).setValue(i === 5 ? 12 : 10);
    }
  }

  // 2. NGUỒN DỮ LIỆU CÓ HEADER RÕ RÀNG CHO 5 BIỂU ĐỒ DONUT NATIVE (CỘT J & K, HÀNG 1 -> 20)
  for (let i = 0; i < 5; i++) {
    const srcRow = 2 + i;
    const blockStart = 1 + (i * 4); // 1, 5, 9, 13, 17
    
    // HÀNG TIÊU ĐỀ BẮT BUỘC
    dbSheet.getRange(blockStart, 10).setValue('Trạng thái');
    dbSheet.getRange(blockStart, 11).setValue('Số lượng');
    
    // 2 DÒNG DỮ LIỆU
    dbSheet.getRange(blockStart + 1, 10).setValue('Đã xong');
    dbSheet.getRange(blockStart + 1, 11).setFormula(`=D${srcRow}`).setNumberFormat('0');
    
    dbSheet.getRange(blockStart + 2, 10).setValue('Chưa xong');
    dbSheet.getRange(blockStart + 2, 11).setFormula(`=MAX(0; E${srcRow})`).setNumberFormat('0');
  }

  // Giữ tab DB_PLANNER hiển thị bình thường để triệt tiêu vĩnh viễn lỗi ẩn dữ liệu!
  dbSheet.showSheet();
}

/**
 * DỰNG TOÀN BỘ BIỂU ĐỒ TỪ DẢI Ô B1:C8 CỰC KỲ ĐƠN GIẢN
 */
function rebuildCharts() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_MAIN);
  const dbSheet = ss.getSheetByName(SHEET_DB);
  if (!sheet || !dbSheet) return;

  const existingCharts = sheet.getCharts();
  existingCharts.forEach(c => sheet.removeChart(c));

  // 1. BIỂU ĐỒ CỘT: DÙNG DẢI Ô B1:C8 ĐƠN GIẢN DUY NHẤT (CỘT B: THỨ, CỘT C: %)
  // Không dùng options ticks/format phức tạp gây lỗi render SVG trắng
  const chartDataRange = dbSheet.getRange('B1:C8');
  
  const barChart = sheet.newChart()
    .asColumnChart()
    .addRange(chartDataRange)
    .setNumHeaders(1)
    .setPosition(11, 2, 0, 0)
    .setOption('title', 'TIẾN ĐỘ HOÀN THÀNH TASK')
    .setOption('titleTextStyle', { fontSize: 10, bold: true, color: '#1E293B' })
    .setOption('width', 315)
    .setOption('height', 180)
    .setOption('backgroundColor', '#FFFFFF')
    .setOption('colors', ['#4E9F8E']) // Xanh ngọc Mint đồng bộ giao diện
    .setOption('legend', { position: 'none' })
    .build();

  sheet.insertChart(barChart);

  // 2. DỰNG 5 BIỂU ĐỒ DONUT NATIVE (CỘT J & K)
  const dayStartCols = [11, 14, 17, 20, 23];
  dayStartCols.forEach((startCol, idx) => {
    const dayTheme = THEME.days[idx];
    const blockStart = 1 + (idx * 4); // 1, 5, 9, 13, 17
    const donutRange = dbSheet.getRange(blockStart, 10, 3, 2);

    const donutChart = sheet.newChart()
      .asPieChart()
      .addRange(donutRange)
      .setNumHeaders(1)
      .setPosition(7, startCol, 2, 2)
      .setOption('width', 160)
      .setOption('height', 85)
      .setOption('backgroundColor', '#FFFFFF')
      .setOption('colors', [dayTheme.color, '#EDE8E3'])
      .setOption('pieHole', 0.60)
      .setOption('legend', { position: 'none' })
      .setOption('pieSliceText', 'none')
      .setOption('chartArea', { left: '5%', top: '5%', width: '90%', height: '90%' })
      .build();

    sheet.insertChart(donutChart);
  });

  SpreadsheetApp.flush();
}

/**
 * XÓA DỮ LIỆU ĐỂ SANG TUẦN MỚI
 */
function clearPlannerData() {
  let ui = null;
  try {
    ui = SpreadsheetApp.getUi();
  } catch (e) {
    // Không chạy từ UI Sheets
  }

  if (ui) {
    const resp = ui.alert('Làm mới tuần', 'Bạn có chắc chắn muốn làm mới toàn bộ danh sách công việc và ghi chú tuần này không?', ui.ButtonSet.YES_NO);
    if (resp !== ui.Button.YES) return;
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_MAIN);
  if (!sheet) return;

  const dayStartCols = [11, 14, 17, 20, 23];
  dayStartCols.forEach(col => {
    sheet.getRange(12, col, 12, 1).setValue(false);
    sheet.getRange(12, col + 1, 12, 1).clearContent();
    sheet.getRange(25, col, 7, 3).setValue('');
    sheet.getRange(9, col, 1, 3).setValue('');
  });

  const startCell = sheet.getRange('B3');
  const curDate = startCell.getValue();
  if (curDate instanceof Date) {
    startCell.setValue(new Date(curDate.getTime() + 7 * 24 * 60 * 60 * 1000));
  }

  if (ui) {
    ui.alert('Đã sẵn sàng!', 'Dữ liệu đã được dọn sạch. Sheet chính gọn gàng và toàn bộ công thức ngầm được bảo toàn.', ui.ButtonSet.OK);
  }
}
