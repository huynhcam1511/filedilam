function demoOverride27_() { return ""; }
/* Quản lý nhà trọ v2.10 — bound Apps Script, V8. Keep the existing deployment. */
const SPREADSHEET_ID = '1iRPgGsJwoq0lMIcX35qWk0F50xU8w7mKxxmavuKfFE8';
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxhwOd3zh5Qq5GDwlOcUMteRuXpzw3ZSHvtDvcv8WmMysI9Mw_opd-BmMkE42esYetq/exec';
const FIRST_ROW_ = 6;
const EXPECTED_HEADERS_ = {"Cài đặt":["Mục","Giá trị / Hướng dẫn"],"Khu trọ":["Mã khu","Tên khu","Địa chỉ giả lập","Người phụ trách","Ghi chú"],"Phòng":["Mã phòng","Mã khu","Tên phòng","Tầng","Diện tích m²","Giá thuê mặc định","Trạng thái","Ghi chú"],"Khách thuê":["Mã khách","Họ tên giả lập","Điện thoại mẫu","Giấy tờ mẫu","Ghi chú"],"Hợp đồng":["Mã hợp đồng","Mã phòng","Mã khách đại diện","Ngày bắt đầu","Ngày kết thúc","Giá thuê","Cọc thỏa thuận","Ngày đến hạn","Trạng thái","Ghi chú"],"Dịch vụ hợp đồng":["Mã hợp đồng","Tên dịch vụ","Cách tính","Đơn giá","Số lượng mặc định","Ngày hiệu lực","Ngày hết hiệu lực","Ghi chú"],"Chỉ số điện nước":["Mã bản ghi","Kỳ tháng","Mã phòng","Loại","Ngày ghi","Chỉ số đầu","Chỉ số cuối","Tiêu thụ","Đơn giá","Thành tiền","Ghi chú"],"Hóa đơn":["Mã hóa đơn","Kỳ tháng","Mã khu","Mã phòng","Tên khách","Hạn đóng","Tiền phòng","Điện","Nước","Rác","Wifi","Xe","Dịch vụ khác","Điều chỉnh (+/-)","Tổng phải đóng","Mã hợp đồng","Ghi chú"],"Thu tiền":["Mã phiếu thu","Ngày thu","Mã hợp đồng","Mã hóa đơn","Loại thu","Số tiền","Phương thức","Tài khoản nhận","Ghi chú"],"Chi phí":["Mã chi phí","Ngày phát sinh","Kỳ chi phí","Mã khu","Mã phòng","Nhóm chi","Nội dung","Số tiền","Tính vào lợi nhuận","Chứng từ mẫu","Ghi chú"],"Chi tiền":["Mã phiếu chi","Ngày chi","Mã chi phí","Mã hợp đồng","Loại chi","Số tiền","Phương thức","Tài khoản trả","Ghi chú"]};

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Quản lý trọ')
    .addItem('Mở ứng dụng Web App (Toàn màn hình)', 'showWebAppLink')
    .addToUi();
}

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Quản lý nhà trọ')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function showWebAppLink() {
  var html = HtmlService.createHtmlOutput(
    '<script>window.open("' + WEB_APP_URL + '", "_blank");google.script.host.close();</script>' +
    '<div style="font-family:Arial,sans-serif;padding:16px;text-align:center;">' +
      '<p style="font-size:14px;color:#334155;margin-bottom:12px;">Đang mở Web App Quản lý trọ trong tab mới...</p>' +
      '<a href="' + WEB_APP_URL + '" target="_blank" style="display:inline-block;background:#059669;color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:bold;font-size:13px;">Bấm vào đây nếu trình duyệt chặn pop-up</a>' +
    '</div>'
  ).setWidth(380).setHeight(140);
  SpreadsheetApp.getUi().showModalDialog(html, 'Mở Ứng Dụng Quản Lý');
}

// Chạy thủ công một lần trong Apps Script Editor bằng tài khoản sở hữu bảng tính.
// Tab ẩn/protection chỉ giúp tránh sửa nhầm; chủ sở hữu bản sao luôn có thể bỏ chúng.
const OVERVIEW_SHEET32_='TỔNG QUAN';
const OVERVIEW_MARK32_='FILE ĐI LÀM · TỔNG QUAN';
const SOURCE_PROTECTION32_='FILE ĐI LÀM · DỮ LIỆU NGUỒN';
function overviewOwner32_(ss){
  const file=DriveApp.getFileById(ss.getId()),owner=file.getOwner(),ownerEmail=owner&&owner.getEmail(),effective=Session.getEffectiveUser().getEmail();
  assert_(ownerEmail&&effective&&ownerEmail===effective,'Chỉ chủ sở hữu Google Sheets được thiết lập bảo vệ dữ liệu nguồn.');
  return ownerEmail;
}
function protectSource32_(sheet,ownerEmail){
  const matches=sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET).filter(p=>p.getDescription()===SOURCE_PROTECTION32_);
  const protection=matches[0]||sheet.protect();
  protection.setDescription(SOURCE_PROTECTION32_);
  protection.addEditor(ownerEmail);
  if(protection.isWarningOnly())protection.setWarningOnly(false);
  if(protection.getUnprotectedRanges().length)protection.setUnprotectedRanges([]);
  if(protection.canDomainEdit())protection.setDomainEdit(false);
  protection.getTargetAudiences().forEach(audience=>{const id=typeof audience==='string'?audience:typeof audience.getId==='function'?audience.getId():typeof audience.getAudienceId==='function'?audience.getAudienceId():'';assert_(id,'Không xác định được nhóm có quyền chỉnh sửa tab '+sheet.getName());protection.removeTargetAudience(id);});
  const otherEditors=protection.getEditors().map(user=>user.getEmail()).filter(email=>email&&email!==ownerEmail);
  if(otherEditors.length)protection.removeEditors(otherEditors);
  matches.slice(1).forEach(p=>p.remove());
  assert_(protection.canEdit(),'Apps Script không thể chỉnh sửa tab '+sheet.getName()+'. Kiểm tra tài khoản thực thi Web App.');
  assert_(!protection.canDomainEdit()&&!protection.getUnprotectedRanges().length&&!protection.getTargetAudiences().length&&!protection.getEditors().some(user=>user.getEmail()!==ownerEmail),'Tab '+sheet.getName()+' chưa được bảo vệ đúng quyền.');
  return !matches.length;
}
function renderOverview32_(sheet,db,ss){
  const used=sheet.getLastRow();
  assert_(!used||sheet.getRange('A1').getDisplayValue()===OVERVIEW_MARK32_,'Tab TỔNG QUAN đã có nội dung riêng. Không ghi đè; hãy kiểm tra thủ công.');
  const area=sheet.getRange('A1:H22');area.breakApart();area.clearContent();area.clearFormat();
  sheet.setHiddenGridlines(true);sheet.setColumnWidths(1,8,125);sheet.setRowHeights(1,22,32);
  area.setBackground('#ffffff').setFontFamily('Arial').setFontColor('#234633').setVerticalAlignment('middle');
  const merge=(range,value)=>{const cell=sheet.getRange(range);cell.merge();cell.setValue(value);return cell;};
  merge('A1:H1',OVERVIEW_MARK32_).setFontSize(11).setFontWeight('bold').setFontColor('#6c8973');
  merge('A2:H3','HỆ THỐNG QUẢN LÝ NHÀ TRỌ').setFontSize(22).setFontWeight('bold').setFontColor('#164b34');
  const brand=branding_(db);merge('A4:H4',brand.name||'Đơn vị quản lý').setFontSize(14).setFontWeight('bold');
  merge('A5:H5','Quản lý căn, phòng, khách thuê, điện nước, phiếu thu và công nợ trên Web App.').setFontSize(10).setFontColor('#5c7463');
  const url=WEB_APP_URL;
  assert_(/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url),'URL Web App chưa hợp lệ; kiểm tra đúng deployment hiện hữu.');
  const launch=merge('A7:D8','MỞ WEB APP QUẢN LÝ');
  launch.setFormula('=HYPERLINK("'+url+'","MỞ WEB APP QUẢN LÝ ↗")').setBackground('#19563a').setFontColor('#ffffff').setFontSize(13).setFontWeight('bold').setHorizontalAlignment('center');
  merge('A10:H10','TÌNH HÌNH PHÒNG CHO THUÊ').setFontSize(11).setFontWeight('bold');
  const cards=[['A11:B11','A12:B13','Căn cho thuê',"=COUNTA('Khu trọ'!A6:A)"],['C11:D11','C12:D13','Tổng phòng',"=COUNTA('Phòng'!A6:A)-COUNTIF('Phòng'!G6:G,\"Ngừng khai thác\")"],['E11:F11','E12:F13','Đang thuê',"=COUNTIF('Phòng'!G6:G,\"Đang thuê\")"],['G11:H11','G12:H13','Phòng trống',"=COUNTIF('Phòng'!G6:G,\"Trống\")"]];
  cards.forEach(([labelRange,valueRange,label,formula])=>{merge(labelRange,label).setBackground('#e9f2e9').setFontSize(10).setFontWeight('bold').setHorizontalAlignment('center');merge(valueRange,'').setFormula(formula).setBackground('#f6faf6').setFontSize(19).setFontWeight('bold').setHorizontalAlignment('center');});
  merge('A15:H15','BẮT ĐẦU SỬ DỤNG').setFontSize(11).setFontWeight('bold');
  merge('A16:H16','1. Nhấn nút “MỞ WEB APP QUẢN LÝ” ở trên.');
  merge('A17:H17','2. Khai báo căn và phòng, sau đó thêm khách thuê và tạo hồ sơ thuê.');
  merge('A18:H18','3. Hằng tháng nhập điện nước, lập phiếu và xác nhận khoản đã thu trên Web App.');
  merge('A19:H19','Dữ liệu nằm ở các tab ẩn để hạn chế sửa nhầm. Cần hỗ trợ, liên hệ người quản trị.').setFontColor('#6c8973');
  merge('A21:H21','Phiên bản mã nguồn 2.32 · Cập nhật '+Utilities.formatDate(new Date(),ss.getSpreadsheetTimeZone(),'dd/MM/yyyy HH:mm')).setFontSize(9).setFontColor('#829786');
  sheet.setFrozenRows(3);
}
function setupProtectedWorkbook(){
  reset27_();
  const active=SpreadsheetApp.getActiveSpreadsheet(),ss=book_();
  assert_(!demoOverride27_(),'Hàm này chỉ thiết lập bảng chính gắn với Web App hiện hữu; không áp dụng lên bản DEMO riêng.');
  assert_(active&&active.getId()===ss.getId(),'Chỉ chạy trong Apps Script gắn với đúng Google Sheets mà Web App đang đọc.');
  const ownerEmail=overviewOwner32_(ss),before=ss.getSheets(),existing=ss.getSheetByName(OVERVIEW_SHEET32_);
  if(existing)assert_(!existing.getLastRow()||existing.getRange('A1').getDisplayValue()===OVERVIEW_MARK32_,'Tab TỔNG QUAN đã có dữ liệu riêng; không ghi đè.');
  const db=all_(ss); // Cũng kiểm tra cấu trúc và quyền đọc các tab nguồn trước khi thay đổi.
  const overview=existing||ss.insertSheet(OVERVIEW_SHEET32_);
  overview.showSheet();ss.setActiveSheet(overview);ss.moveActiveSheet(1);
  renderOverview32_(overview,db,ss);
  const sources=ss.getSheets().filter(sheet=>sheet.getSheetId()!==overview.getSheetId());
  let protectionsCreated=0;
  sources.forEach(sheet=>{if(protectSource32_(sheet,ownerEmail))protectionsCreated++;});
  sources.forEach(sheet=>{if(!sheet.isSheetHidden())sheet.hideSheet();});
  SpreadsheetApp.flush();
  assert_(ss.getSheets().filter(sheet=>!sheet.isSheetHidden()).length===1&&!overview.isSheetHidden(),'Chưa ẩn đúng các tab dữ liệu nguồn.');
  sources.forEach(sheet=>assert_(sheet.isSheetHidden(),'Chưa ẩn tab '+sheet.getName()));
  reset27_();all_(ss); // Đọc lại tất cả tab dữ liệu khi chúng đang ẩn và được bảo vệ.
  const result={spreadsheetId:ss.getId(),overview:OVERVIEW_SHEET32_,hiddenSources:sources.length,protectionsCreated,webAppUrl:WEB_APP_URL,readVerified:true,writeVerified:false,message:'Đã thiết lập tab TỔNG QUAN và bảo vệ dữ liệu nguồn. Cần kiểm tra thao tác ghi thực tế trên Web App sau khi triển khai.'};
  Logger.log(JSON.stringify(result));return result;
}

// key, nhãn, kiểu, bắt buộc, lựa chọn hoặc tham chiếu [module, key].
function schemas_() {
  const f = (key,label,type,required,extra) => Object.assign({key,label,type:type||'text',required:!!required},
    Array.isArray(extra) && typeof extra[0] === 'string' ? {options:extra} : (extra||{}));
  const ref = (module,key) => ({ref:{module,key}});
  return {
    settings:{name:'Cài đặt',prefix:'CFG',fields:[f('id','Mục','text',true),f('value','Giá trị / hướng dẫn','text',true)]},
    sites:{name:'Khu trọ',prefix:'K',fields:[f('id','Mã khu','text',true),f('name','Tên khu','text',true),f('address','Địa chỉ'),f('manager','Người phụ trách'),f('note','Ghi chú','textarea')]},
    rooms:{name:'Phòng',prefix:'P',fields:[f('id','Mã phòng','text',true),f('site','Nhóm / dãy phòng','text',true,ref('sites','id')),f('name','Tên phòng','text',true),f('floor','Tầng','number'),f('area','Diện tích m²','number'),f('rent','Giá thuê tháng','money',true),f('status','Trạng thái','select',true,['Đang thuê','Trống','Bảo trì','Ngừng khai thác']),f('note','Ghi chú','textarea')]},
    tenants:{name:'Khách thuê',prefix:'KH',fields:[f('id','Mã khách','text',true),f('name','Họ tên','text',true),f('phone','Điện thoại'),f('document','Giấy tờ'),f('note','Ghi chú / người ở cùng','textarea')]},
    contracts:{name:'Hợp đồng',prefix:'HD',fields:[f('id','Mã hợp đồng','text',true),f('room','Mã phòng','text',true,ref('rooms','id')),f('tenant','Khách đại diện','text',true,ref('tenants','id')),f('start','Ngày bắt đầu','date',true),f('end','Ngày kết thúc','date'),f('rent','Giá thuê','money',true),f('deposit','Cọc thỏa thuận','money',true),f('dueDay','Ngày đến hạn hằng tháng','number',true),f('status','Trạng thái','select',true,['Đang hiệu lực','Đã kết thúc','Đã hủy']),f('note','Ghi chú','textarea')]},
    services:{name:'Dịch vụ hợp đồng',prefix:'DV',fields:[f('contract','Mã hợp đồng','text',true,ref('contracts','id')),f('name','Tên dịch vụ','text',true),f('method','Cách tính','select',true,['Theo kWh','Theo m³','Theo phòng','Theo người','Theo xe','Theo số lượng']),f('price','Đơn giá','money',true),f('quantity','Số lượng / số người / số xe','number',true),f('start','Ngày hiệu lực','date',true),f('end','Ngày hết hiệu lực','date'),f('note','Ghi chú','textarea')]},
    meters:{name:'Chỉ số điện nước',prefix:'CS',fields:[f('id','Mã bản ghi','text',true),f('month','Kỳ tháng','month',true),f('room','Mã phòng','text',true,ref('rooms','id')),f('type','Loại','select',true,['Điện','Nước']),f('date','Ngày ghi','date',true),f('previous','Chỉ số đầu','number',true),f('current','Chỉ số cuối','number',true),f('usage','Tiêu thụ','computed'),f('price','Đơn giá','money',true),f('amount','Thành tiền','computed'),f('note','Ghi chú / thay đồng hồ','textarea')]},
    invoices:{name:'Hóa đơn',prefix:'INV',fields:[f('id','Mã hóa đơn','text',true),f('month','Kỳ tháng','month',true),f('site','Nhóm / dãy phòng','text',true,ref('sites','id')),f('room','Mã phòng','text',true,ref('rooms','id')),f('tenant','Tên khách','text',true),f('due','Hạn đóng','date',true),f('rent','Tiền phòng','money',true),f('electricity','Điện','money',true),f('water','Nước','money',true),f('trash','Rác','money',true),f('wifi','Wifi','money',true),f('parking','Xe','money',true),f('other','Dịch vụ khác','money',true),f('adjustment','Điều chỉnh (+/-)','signed',true),f('total','Tổng phải đóng','computed'),f('contract','Mã hợp đồng','text',true,ref('contracts','id')),f('note','Ghi chú','textarea')]},
    receipts:{name:'Thu tiền',prefix:'PT',fields:[f('id','Mã phiếu thu','text',true),f('date','Ngày thu','date',true),f('contract','Mã hợp đồng','text',true,ref('contracts','id')),f('invoice','Mã hóa đơn','text',false,ref('invoices','id')),f('type','Loại thu','select',true,['Thanh toán hóa đơn','Nhận cọc']),f('amount','Số tiền','money',true),f('method','Phương thức','select',true,['Chuyển khoản','Tiền mặt']),f('account','Tài khoản nhận'),f('note','Ghi chú','textarea')]},
    costs:{name:'Chi phí',prefix:'CP',fields:[f('id','Mã chi phí','text',true),f('date','Ngày phát sinh','date',true),f('month','Kỳ chi phí','month',true),f('site','Nhóm / dãy phòng','text',true,ref('sites','id')),f('room','Mã phòng','text',false,ref('rooms','id')),f('category','Nhóm chi','text',true),f('description','Nội dung','textarea',true),f('amount','Số tiền','money',true),f('included','Tính vào lợi nhuận','select',true,['Có','Không']),f('document','Chứng từ / đường dẫn'),f('note','Ghi chú','textarea')]},
    payments:{name:'Chi tiền',prefix:'PC',fields:[f('id','Mã phiếu chi','text',true),f('date','Ngày chi','date',true),f('cost','Mã chi phí','text',false,ref('costs','id')),f('contract','Mã hợp đồng','text',false,ref('contracts','id')),f('type','Loại chi','select',true,['Thanh toán chi phí','Hoàn cọc']),f('amount','Số tiền','money',true),f('method','Phương thức','select',true,['Chuyển khoản','Tiền mặt']),f('account','Tài khoản trả'),f('note','Ghi chú','textarea')]}
  };
}
let request27_={sheets:{},rows:{},book:null,meta:null,metrics:{}};
function reset27_(){request27_={sheets:{},rows:{},book:null,meta:null,metrics:{}};}
function book_() {
  if (request27_.book) return request27_.book;
  var active = null;
  try {
    active = SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {}
  
  if (active) {
    request27_.book = active;
    return active;
  }
  
  const override = demoOverride27_();
  request27_.book = SpreadsheetApp.openById(override || SPREADSHEET_ID);
  return request27_.book;
}
function assert_(condition,message) { if (!condition) throw new Error(message); }
function schema_(module) { const s=schemas_()[module]; assert_(s,'Mục không hợp lệ.'); return s; }
function sheet_(ss,module) {
  if(request27_.sheets[module])return request27_.sheets[module];
  const s=schema_(module),sheet=ss.getSheetByName(s.name);
  assert_(sheet,'Không tìm thấy tab '+s.name+'. Kiểm tra ID Google Sheets.');
  const header=sheet.getRange(5,1,1,s.fields.length).getDisplayValues()[0];
  assert_(header[0] && header.every(Boolean),'Tab '+s.name+' cần đủ tiêu đề ở dòng 5.');
  header.forEach((value,i)=>assert_(value===EXPECTED_HEADERS_[s.name][i]||value===s.fields[i].label,'Tab '+s.name+': cột '+(i+1)+' không đúng cấu trúc. Không đổi thứ tự cột; kiểm tra tiêu đề dòng 5.'));
  request27_.sheets[module]=sheet;return sheet;
}
function token_(values) {
  return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,JSON.stringify(values)));
}
function dateString_(date,tz) { return Utilities.formatDate(date,tz,'yyyy-MM-dd'); }
function key_(module,obj) { return module==='services'?[obj.contract,obj.name,obj.start].join('|'):String(obj[schema_(module).fields[0].key]); }
function rows_(ss,module) {
  const s=schema_(module),sheet=sheet_(ss,module),last=sheet.getLastRow(),tz=ss.getSpreadsheetTimeZone();
  if(last<FIRST_ROW_) return [];
  const result=sheet.getRange(FIRST_ROW_,1,last-FIRST_ROW_+1,s.fields.length).getValues().map((r,i)=>{
    const obj={};s.fields.forEach((f,c)=>{
      const v=r[c];
      if(r[0]!==''&&r[0]!=null&&['number','money','signed'].includes(f.type)&&v!=='')assert_(typeof v==='number'&&Number.isFinite(v),s.name+' dòng '+(i+FIRST_ROW_)+': '+f.label+' phải là số.');
      if(r[0]!==''&&r[0]!=null&&['date','month'].includes(f.type)&&v!=='')assert_(v instanceof Date,s.name+' dòng '+(i+FIRST_ROW_)+': '+f.label+' phải là ngày hợp lệ trong Sheets.');
      obj[f.key]=v instanceof Date ? dateString_(v,tz).slice(0,f.type==='month'?7:10) : v;
    });
    obj._row=i+FIRST_ROW_;obj._token=token_(r);obj._key=key_(module,obj);return obj;
  }).filter(r=>r[s.fields[0].key]!=='' && r[s.fields[0].key]!=null);
  if(module==='invoices'&&(typeof sheet.getMaxColumns!=='function'||sheet.getMaxColumns()>=18)&&sheet.getRange(5,18).getValue()==='Chi tiết khoản thu (JSON)'){const extra=sheet.getRange(FIRST_ROW_,18,last-FIRST_ROW_+1,1).getValues();result.forEach(r=>{const raw=extra[r._row-FIRST_ROW_][0];if(raw){try{r.details=JSON.parse(String(raw));}catch(e){throw new Error('Chi tiết hóa đơn '+r.id+' không hợp lệ.');}}});}
  return result;
}
function all_(ss) { const started=Date.now(),db={};Object.keys(schemas_()).forEach(m=>{if(!request27_.rows[m])request27_.rows[m]=rows_(ss,m);db[m]=JSON.parse(JSON.stringify(request27_.rows[m]));});request27_.metrics.sheetReadMs=(request27_.metrics.sheetReadMs||0)+Date.now()-started;return db; }
function sum_(arr,key) { return arr.reduce((n,r)=>n+(Number(r[key])||0),0); }
function computed_(db) {
  const paid={}; db.receipts.filter(r=>r.type==='Thanh toán hóa đơn').forEach(r=>paid[r.invoice]=(paid[r.invoice]||0)+Number(r.amount));
  const today=dateString_(new Date(),book_().getSpreadsheetTimeZone());
  return db.invoices.map(r=>{
    const total=['rent','electricity','water','trash','wifi','parking','other','adjustment'].reduce((s,k)=>s+(Number(r[k])||0),0),p=paid[r.id]||0;
    return Object.assign({},r,{total,paid:p,debt:Math.max(0,total-p),surplus:Math.max(0,p-total),status:p>total?'Đóng dư':p===total?'Đã đóng đủ':p===0?'Chưa đóng':'Đóng một phần',overdue:total>p && r.due<today?'Quá hạn':''});
  });
}
function snapshot_(ss, supplied) {
  const started=Date.now(),db=supplied||all_(ss),bills=computed_(db),billById=new Map(bills.map(b=>[b.id,b]));
  db.invoices.forEach(r=>r.total=billById.get(r.id).total);
  db.meters.forEach(r=>{r.usage=Number(r.current)-Number(r.previous);r.amount=r.usage*Number(r.price);});
  db.receipts.forEach(r=>{const bill=billById.get(r.invoice);r.payStatus=bill?paymentStatus_(bill):'Đã thu cọc';});
  const result={version:'2.32',demoMode:!!metaAll_(ss).demoMaster27,catalogs:catalogs28_(ss,db),housing:housing_(ss),monthlyToken:token_([db.meters.map(r=>r._token),db.invoices.map(r=>r._token),db.receipts.map(r=>r._token),db.services.map(r=>r._token),db.contracts.map(r=>r._token)]),serviceRevision:token_(db.services.map(r=>r._token)),schemas:schemas_(),data:db,bills,branding:branding_(db),payment:payment_(db),updatedAt:Utilities.formatDate(new Date(),ss.getSpreadsheetTimeZone(),'dd/MM/yyyy HH:mm:ss'),spreadsheetUrl:ss.getUrl()};
  request27_.metrics.snapshotMs=(request27_.metrics.snapshotMs||0)+Date.now()-started;return result;
}
function branding_(db) {
  const read=key=>{const matches=db.settings.filter(r=>r.id===key);assert_(matches.length<=1,'Trùng mục '+key+' trong Cài đặt.');return matches[0]?String(matches[0].value):'';};
  const name=read('Tên nhà trọ'),logo=read('Logo nhà trọ');
  const representative=read('Người đại diện quản lý'),phone=read('Điện thoại quản lý'),email=read('Email quản lý'),address=read('Địa chỉ liên hệ quản lý'),note=read('Ghi chú đơn vị quản lý');
  return {name:name||'Quản lý nhà trọ',logo,representative,phone,email,address,note,token:token_([name,logo,representative,phone,email,address,note])};
}
function validateLogo_(logo) {
  assert_(typeof logo==='string'&&logo.length<=45000,'Logo quá lớn. Chọn ảnh nhỏ hơn.');
  if(!logo)return;
  assert_(!/^https?:\/\//i.test(logo),'Hãy tải logo từ máy.');
  const match=logo.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/);
  assert_(match,'Chỉ dùng logo PNG, JPEG hoặc WebP tải từ máy.');
  const bytes=Utilities.base64Decode(match[2]).map(b=>(b+256)%256);
  const good=match[1]==='png'?bytes.slice(0,8).join(',')==='137,80,78,71,13,10,26,10':match[1]==='jpeg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:String.fromCharCode.apply(null,bytes.slice(0,4))==='RIFF'&&String.fromCharCode.apply(null,bytes.slice(8,12))==='WEBP';
  assert_(good,'Dữ liệu ảnh logo không hợp lệ.');
}
function saveBranding(payload) {
  return lock_(()=>{
    const ss=book_(),db=all_(ss),current=branding_(db);
    assert_(payload&&payload.token===current.token,'Thông tin thương hiệu đã thay đổi. Hãy tải lại.');
    const name=String(payload.name||'').trim(),logo=String(payload.logo||'').trim();
    assert_(name.length>0&&name.length<=60&&!/^[=+@]/.test(name),'Tên nhà trọ cần 1–60 ký tự, không bắt đầu bằng công thức.');
    validateLogo_(logo);
    const representative=text26_(payload.representative,120),phone=text26_(payload.phone,40),email=text26_(payload.email,120),address=text26_(payload.address,250),note=text26_(payload.note,500);
    assert_(!email||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),'Email không hợp lệ.');
    [['Tên nhà trọ',name],['Logo nhà trọ',logo],['Người đại diện quản lý',representative],['Điện thoại quản lý',phone],['Email quản lý',email],['Địa chỉ liên hệ quản lý',address],['Ghi chú đơn vị quản lý',note]].forEach(([key,value])=>{
      const old=db.settings.find(r=>r.id===key),row=old?old._row:nextRow_(db,'settings');
      write_(ss,'settings',{id:key,value},row);if(!old)db.settings.push({id:key,value,_row:row});
    });SpreadsheetApp.flush();
    db.settings=rows_(ss,'settings');
    return {message:'Đã lưu thông tin đơn vị quản lý.',state:snapshot_(ss,db)};
  });
}
function getState() { reset27_();return snapshot_(book_()); }
function lock_(fn) {
  reset27_();
  const lock=LockService.getScriptLock();lock.waitLock(30000);
  try { return fn(); } finally { lock.releaseLock(); }
}
function parseDate_(value,month,tz) {
  const text=String(value)+(month?'-01':'');
  assert_(/^\d{4}-\d{2}-\d{2}$/.test(text),'Ngày không hợp lệ.');
  const date=Utilities.parseDate(text+' 12:00',tz,'yyyy-MM-dd HH:mm');
  assert_(dateString_(date,tz)===text,'Ngày không tồn tại.');return date;
}
function clean_(module,input) {
  const obj={}; schema_(module).fields.forEach(f=>{
    if(f.type==='computed') {obj[f.key]='';return;}
    let v=input[f.key]; v=v==null?'':v;
    assert_(!(typeof v==='object'),'Giá trị không hợp lệ: '+f.label);
    if(['number','money','signed'].includes(f.type)) {
      if(v==='') {assert_(!f.required,'Cần nhập '+f.label);obj[f.key]='';return;}
      v=Number(v);assert_(Number.isFinite(v),'Cần nhập số tại '+f.label);
      if(f.type!=='signed')assert_(v>=0,f.label+' không được âm.');
      if(['money','signed'].includes(f.type))assert_(Number.isInteger(v),'Số tiền phải là đồng nguyên.');
    } else {
      v=String(v).trim();assert_(v.length<=3000,'Nội dung quá dài: '+f.label);
      assert_(!f.required || v!=='','Cần nhập '+f.label);
      if(v && f.options){
        const customMethod=['receipts','payments'].includes(module)&&f.key==='method'&&catalogs28_(book_(),all_(book_())).items.some(item=>item.group==='Phương thức thanh toán'&&item.name===v&&item.active);
        assert_(f.options.includes(v)||customMethod,'Lựa chọn không hợp lệ: '+f.label);
      }
      if(v && ['date','month'].includes(f.type))parseDate_(v,f.type==='month',book_().getSpreadsheetTimeZone());
      // Plain text only: prevent a cell from executing a submitted formula.
      assert_(!/^\s*[=+@]/.test(v),'Không nhập công thức vào '+f.label);
    }
    obj[f.key]=v;
  }); return obj;
}
function find_(db,module,key) { return db[module].find(r=>String(r.id)===String(key)); }
function interval_(a,b) { return a.start<=(b.end||'9999-12-31') && b.start<=(a.end||'9999-12-31'); }
function validate_(module,obj,db,old) {
  const s=schema_(module);
  s.fields.filter(f=>f.ref && obj[f.key]).forEach(f=>assert_(db[f.ref.module].some(r=>String(r[f.ref.key])===String(obj[f.key])),'Không tìm thấy '+f.label+': '+obj[f.key]));
  const peers=db[module].filter(r=>!old || r._row!==old._row);
  assert_(!peers.some(r=>key_(module,r)===key_(module,obj)),'Trùng mã hoặc trùng dịch vụ/ngày hiệu lực.');
  if(old && module!=='services')assert_(obj[s.fields[0].key]===old[s.fields[0].key],'Không đổi mã của bản ghi đã lưu.');
  if(obj.start && obj.end)assert_(obj.end>=obj.start,'Ngày kết thúc phải từ ngày bắt đầu trở đi.');
  if(module==='contracts') {
    assert_(Number.isInteger(obj.dueDay)&&obj.dueDay>=1&&obj.dueDay<=31,'Ngày đến hạn từ 1 đến 31.');
    if(obj.status==='Đang hiệu lực')assert_(!peers.some(r=>r.status==='Đang hiệu lực'&&r.room===obj.room&&interval_(r,obj)),'Phòng có hợp đồng đang hiệu lực trùng thời gian.');
  }
  if(module==='services') {
    assert_(!peers.some(r=>r.contract===obj.contract&&r.name===obj.name&&interval_(r,obj)),'Dịch vụ này đã có đơn giá trùng thời gian.');
    if(obj.name==='Điện')assert_(obj.method==='Theo kWh','Dịch vụ điện cần cách tính Theo kWh.');
    if(obj.method==='Theo kWh')assert_(obj.name==='Điện','Theo kWh chỉ áp dụng cho Điện.');
    if(obj.method==='Theo m³')assert_(obj.name==='Nước','Theo m³ chỉ áp dụng cho Nước.');
  }
  if(module==='meters') {
    assert_(obj.current>=obj.previous,'Chỉ số cuối phải lớn hơn hoặc bằng chỉ số đầu. Khi thay đồng hồ, nhập chỉ số tương đương và ghi chú.');
    assert_(!peers.some(r=>r.month===obj.month&&r.room===obj.room&&r.type===obj.type),'Phòng đã có chỉ số loại này trong kỳ.');
  }
  if(module==='invoices') {
    const contract=find_(db,'contracts',obj.contract),room=find_(db,'rooms',obj.room);
    assert_(contract.room===obj.room,'Phòng không đúng hợp đồng.');
    assert_(room.site===obj.site,'Khu trọ không đúng phòng.');
    const year=Number(obj.month.slice(0,4)),month=Number(obj.month.slice(5));
    const end=obj.month+'-'+String(new Date(Date.UTC(year,month,0)).getUTCDate()).padStart(2,'0');
    assert_(contract.status!=='Đã hủy'&&interval_(contract,{start:obj.month+'-01',end}),'Hợp đồng không áp dụng cho kỳ hóa đơn này.');
    assert_(!peers.some(r=>r.month===obj.month&&r.contract===obj.contract),'Hợp đồng đã có hóa đơn trong kỳ này.');
    const total=['rent','electricity','water','trash','wifi','parking','other','adjustment'].reduce((n,k)=>n+obj[k],0);
    assert_(total>=0,'Tổng hóa đơn không được âm.');
    if(old)assert_(!db.receipts.some(r=>r.invoice===old.id),'Hóa đơn đã có phiếu thu. Hãy xử lý phiếu thu liên quan trước khi sửa.');
  }
  if(module==='costs') {
    if(obj.room)assert_(find_(db,'rooms',obj.room).site===obj.site,'Phòng không thuộc khu đã chọn.');
    if(old)assert_(!db.payments.some(r=>r.cost===old.id),'Chi phí đã có phiếu chi; xử lý phiếu chi trước khi sửa.');
  }
  if(module==='receipts') {
    assert_(obj.amount>0,'Số tiền thu phải lớn hơn 0.');
    if(obj.type==='Thanh toán hóa đơn') {
      const invoice=find_(db,'invoices',obj.invoice);assert_(invoice,'Chọn hóa đơn cần thu tiền.');
      assert_(invoice.contract===obj.contract,'Hợp đồng không khớp hóa đơn.');
    } else assert_(!obj.invoice,'Nhận cọc không gắn mã hóa đơn.');
  }
  if(module==='payments') {
    assert_(obj.amount>0,'Số tiền chi phải lớn hơn 0.');
    if(obj.type==='Thanh toán chi phí') {
      const cost=find_(db,'costs',obj.cost);assert_(cost,'Chọn khoản chi phí cần trả.');
      const paid=sum_(db.payments.filter(r=>r.cost===obj.cost&&r.type==='Thanh toán chi phí'&&(!old||r._row!==old._row)),'amount');
      assert_(paid+obj.amount<=cost.amount,'Tổng chi tiền vượt số tiền chi phí.');
      assert_(!obj.contract,'Thanh toán chi phí chỉ gắn mã chi phí.');
    } else {
      assert_(obj.contract && !obj.cost,'Hoàn cọc cần mã hợp đồng và để trống mã chi phí.');
    }
  }
  // Check cọc on the projected ledger, including edits to earlier receipts.
  if(module==='receipts'||module==='payments') {
    const projected=Object.assign({},db);projected[module]=peers.concat([obj]);
    const balances={};projected.receipts.filter(r=>r.type==='Nhận cọc').forEach(r=>balances[r.contract]=(balances[r.contract]||0)+Number(r.amount));
    projected.payments.filter(r=>r.type==='Hoàn cọc').forEach(r=>balances[r.contract]=(balances[r.contract]||0)-Number(r.amount));
    const deposits=metaAll_(book_());Object.keys(balances).forEach(k=>balances[k]-=sum_((deposits['deposit:'+k]||{}).deductions||[],'amount'));
    Object.keys(balances).forEach(k=>assert_(balances[k]>=0,'Hoàn cọc vượt số cọc thực nhận của '+k));
  }
  if(old && ['rooms','contracts'].includes(module)) {
    if(module==='rooms' && obj.site!==old.site)assert_(!db.invoices.some(r=>r.room===old.id),'Phòng đã có hóa đơn, không chuyển khu.');
    if(module==='contracts' && (obj.room!==old.room||obj.tenant!==old.tenant))assert_(!db.invoices.some(r=>r.contract===old.id)&&!db.receipts.some(r=>r.contract===old.id),'Hợp đồng đã có hóa đơn/phiếu thu, không đổi phòng/khách.');
  }
}
function cellValues_(ss,module,obj,row) {
  const tz=ss.getSpreadsheetTimeZone();
  return schema_(module).fields.map(f=>{
    const v=obj[f.key];return v && ['date','month'].includes(f.type)?parseDate_(v,f.type==='month',tz):v;
  }).map((v,c)=>{
    if(module==='invoices'&&c===14)return '=SUM(G'+row+':N'+row+')';
    if(module==='meters'&&c===7)return '=G'+row+'-F'+row;
    if(module==='meters'&&c===9)return '=H'+row+'*I'+row;
    return v;
  });
}
function write_(ss,module,obj,row) {
  delete request27_.rows[module];
  const sheet=sheet_(ss,module),s=schema_(module);
  if(row>sheet.getMaxRows())sheet.insertRowsAfter(sheet.getMaxRows(),Math.max(100,row-sheet.getMaxRows()));
  sheet.getRange(row,1,1,s.fields.length).setValues([cellValues_(ss,module,obj,row)]);
  sheet.getRange(row,1,1,s.fields.length).setFontFamily('Arial').setFontSize(10).setVerticalAlignment('middle')
    .setBackground(row%2?'#fffcfa':'#f3f8f1');
  const formats=s.fields.map(f=>['money','signed','computed','number'].includes(f.type)?'#,##0.##':f.type==='date'?'dd/MM/yyyy':f.type==='month'?'mm/yyyy':'@');
  const range=sheet.getRange(row,1,1,s.fields.length);
  if(typeof range.setNumberFormats==='function')range.setNumberFormats([formats]);
  else s.fields.forEach((f,c)=>sheet.getRange(row,c+1).setNumberFormat(formats[c]));
  // Expand an existing filter only when a new row falls outside it; edits never rebuild it.
  const filter=sheet.getFilter();if(filter&&typeof filter.getRange==='function'&&filter.getRange().getLastRow()<row){filter.remove();sheet.getRange(5,1,row-4,s.fields.length).createFilter();}

}
function nextRow_(db,module) { return db[module].reduce((n,r)=>Math.max(n,r._row+1),FIRST_ROW_); }
function saveRecord(payload) {
  return lock_(()=>{
    assert_(payload&&payload.module&&payload.values,'Thiếu dữ liệu.');
    const ss=book_(),module=payload.module;schema_(module);const db=all_(ss);
    if(module==='settings')assert_(!['Tên nhà trọ','Logo nhà trọ','Ngân hàng nhận','Số tài khoản nhận','Chủ tài khoản nhận','QR thanh toán','Mẫu nội dung chuyển khoản','Ghi chú thanh toán','BIN ngân hàng nhận'].includes(String(payload.values.id)),'Đổi tên/logo bằng phần Thương hiệu trong Cài đặt.');
    const old=payload.key?db[module].find(r=>r._key===payload.key):null;
    if(payload.key)assert_(old&&old._token===payload.token,'Dữ liệu đã thay đổi. Đóng form và tải lại trước khi sửa.');
    const obj=clean_(module,payload.values);if(module==='contracts')throw new Error('Dùng Tạo hợp đồng, Gia hạn hoặc Điều chỉnh giá & dịch vụ trong hồ sơ kỳ thuê.');if(module==='invoices'&&old)assert_(!(metaAll_(ss)['invoice:'+old.id]||{}).sealed,'Hóa đơn đã chốt.');validate_(module,obj,db,old);
    const targetRow=old?old._row:nextRow_(db,module);
    let invoicePayment=null;if(module==='invoices'){const detailSheet=sheet_(ss,module);if(typeof detailSheet.getMaxColumns==='function'&&detailSheet.getMaxColumns()<18)detailSheet.insertColumnsAfter(detailSheet.getMaxColumns(),18-detailSheet.getMaxColumns());const existingHeader=detailSheet.getRange(5,18).getValue();assert_(!existingHeader||existingHeader==='Chi tiết khoản thu (JSON)','Cột R đang có dữ liệu riêng. Cần để trống cột R trước khi lưu chi tiết hóa đơn.');obj.details=invoiceDetails_(db,obj);if(!old)invoicePayment=sitePayment38_(ss,db,obj.site);}
    write_(ss,module,obj,targetRow);
    if(module==='invoices'){const sheet=sheet_(ss,module);if(typeof sheet.getMaxColumns==='function'&&sheet.getMaxColumns()<18)sheet.insertColumnsAfter(sheet.getMaxColumns(),18-sheet.getMaxColumns());sheet.getRange(5,18).setValue('Chi tiết khoản thu (JSON)');sheet.getRange(targetRow,18).setValue(JSON.stringify(obj.details));if(!old)metaSet_(ss,'invoicepayment:'+obj.id,invoicePayment);}
    SpreadsheetApp.flush();
    db[module]=rows_(ss,module);return finish_(ss,'Đã lưu '+schema_(module).name+'.',db);
  });
}

// Lưu khoản phải chi và một giao dịch thực chi cùng lúc, hoặc không lưu gì.
function saveCostAndPayment41(payload){return lock_(()=>{
 const ss=book_(),db=all_(ss),cost=clean_('costs',payload.values||{}),pay=payload.payment||{};
 validate_('costs',cost,db,null);
 assert_(cost.site&&db.sites.some(s=>s.id===cost.site),'Chọn căn cho thuê.');
 assert_(cost.amount>0,'Số tiền phải chi phải lớn hơn 0.');
 const method=String(pay.method||''),account=String(pay.account||''),date=String(pay.date||'');
 parseDate_(date,false,ss.getSpreadsheetTimeZone());
 assert_(['Chuyển khoản','Tiền mặt'].includes(method),'Chọn phương thức chi tiền.');
 const accountRow=catalogs28_(ss,db).items.find(x=>x.group==='Tài khoản thu / chi'&&x.active&&x.name===account);
 assert_(accountRow&&((method==='Chuyển khoản'&&(accountRow.accountType==='Tài khoản ngân hàng'||!!accountRow.bank))||(method==='Tiền mặt'&&accountRow.accountType==='Quỹ tiền mặt')),'Chọn tài khoản chi phù hợp trong Danh mục.');
 const payment=clean_('payments',{id:'PC-'+Utilities.getUuid().slice(0,8).toUpperCase(),date,cost:cost.id,contract:'',type:'Thanh toán chi phí',amount:cost.amount,method,account,note:text26_(pay.note,1000)});
 const work={...db,costs:db.costs.concat([{...cost,_row:nextRow_(db,'costs')}])};validate_('payments',payment,work,null);
 atomic26_([cellTask26_(ss,'costs',cost,nextRow_(db,'costs')),cellTask26_(ss,'payments',payment,nextRow_(db,'payments'))]);
 return {message:'Đã lưu chi phí và ghi nhận thanh toán đầy đủ.',created:cost.id,state:snapshot_(ss)};
});}
function deleteRecord(payload) {
  return lock_(()=>{
    const ss=book_(),module=payload.module,s=schema_(module),db=all_(ss),old=db[module].find(r=>r._key===payload.key);
    assert_(module!=='contracts','Hồ sơ kỳ thuê cần được kết thúc qua quy trình trả phòng; không xóa lịch sử.');
    if(module==='settings')assert_(!['Tên nhà trọ','Logo nhà trọ','Ngân hàng nhận','Số tài khoản nhận','Chủ tài khoản nhận','QR thanh toán','Mẫu nội dung chuyển khoản','Ghi chú thanh toán','BIN ngân hàng nhận'].includes(String(payload.key)),'Đổi tên/logo bằng phần Thương hiệu trong Cài đặt.');
    assert_(old&&old._token===payload.token,'Dữ liệu đã đổi hoặc đã bị xóa. Hãy tải lại.');
    if(module==='tenants')assert_(!Object.values(metaAll_(ss)).some(v=>v&&v.people&&v.people.some(p=>p.tenantId===old.id)),'Không xóa khách thuộc hồ sơ nhận phòng.');if(module==='contracts')assert_(!metaAll_(ss)['stay:'+old.id],'Không xóa hợp đồng đã lưu hồ sơ.');if(module==='invoices')assert_(!(metaAll_(ss)['invoice:'+old.id]||{}).sealed,'Hóa đơn đã chốt.');const value=old[s.fields[0].key];
    if(module!=='services')Object.keys(schemas_()).forEach(m=>schemas_()[m].fields.filter(f=>f.ref&&f.ref.module===module).forEach(f=>assert_(!db[m].some(r=>String(r[f.key])===String(value)),'Không xóa được: '+schemas_()[m].name+' đang liên kết bản ghi này.')));
    if(module==='receipts'&&old.type==='Nhận cọc') {
      const balance=sum_(db.receipts.filter(r=>r.type==='Nhận cọc'&&r.contract===old.contract&&r._row!==old._row),'amount')-sum_(db.payments.filter(r=>r.type==='Hoàn cọc'&&r.contract===old.contract),'amount')-sum_((metaAll_(ss)['deposit:'+old.contract]||{}).deductions||[],'amount');
      assert_(balance>=0,'Không xóa phiếu nhận cọc đã dùng để hoàn cọc.');
    }
    sheet_(ss,module).getRange(old._row,1,1,s.fields.length).clearContent();if(module==='invoices'&&(typeof sheet_(ss,module).getMaxColumns!=='function'||sheet_(ss,module).getMaxColumns()>=18))sheet_(ss,module).getRange(old._row,18).clearContent();SpreadsheetApp.flush();
    delete request27_.rows[module];db[module]=db[module].filter(r=>r._row!==old._row);return finish_(ss,'Đã xóa bản ghi.',db);
  });
}
function finish_(ss,message,db) {
  return {message:message+' Web app đã cập nhật. Bấm Đồng bộ Sheet khi cần cập nhật bảng tổng hợp trong Sheets.',state:snapshot_(ss,db)};
}

// Tạo bản nháp: không ghi dữ liệu cho đến khi người dùng kiểm tra và Lưu.
function previewInvoice(contractId,month) {return draftInvoice_(book_(),all_(book_()),contractId,month,false);}
function previewBatchInvoices30(payload) {
  const ss=book_(),db=all_(ss),month=String(payload&&payload.month||''),ids=payload&&payload.contracts;
  parseDate_(month,true,ss.getSpreadsheetTimeZone());
  assert_(Array.isArray(ids)&&ids.length>0&&ids.length<=100&&new Set(ids).size===ids.length,'Chọn 1–100 hợp đồng, không trùng nhau.');
  const meta=metaAll_(ss),rows=ids.map(id=>{const contract=db.contracts.find(c=>c.id===id),room=db.rooms.find(r=>r.id===contract?.room),tenant=db.tenants.find(t=>t.id===contract?.tenant),existing=db.invoices.find(i=>i.contract===id&&i.month===month),base={contract:id,room:room?.name||contract?.room||'',tenant:tenant?.name||''};try{if(existing&&(db.receipts.some(r=>r.invoice===existing.id)||(meta['invoice:'+existing.id]||{}).sealed))return {...base,ready:false,status:'locked',error:'Phiếu đã chốt hoặc đã thu, không thể cập nhật.'};const draft=draftInvoice_(ss,db,id,month,!!existing);return {...base,ready:!existing,status:existing?'draft':'ready',invoiceId:existing?.id||draft.id,rent:draft.rent,electricity:draft.electricity,water:draft.water,other:draft.trash+draft.wifi+draft.parking+draft.other+draft.adjustment,total:draft.rent+draft.electricity+draft.water+draft.trash+draft.wifi+draft.parking+draft.other+draft.adjustment};}catch(e){return {...base,ready:false,status:'missing',error:e.message||String(e)};}});
  return {rows,token:token_([db.contracts.map(r=>r._token),db.meters.map(r=>r._token),db.services.map(r=>r._token),db.invoices.map(r=>r._token),db.receipts.map(r=>r._token),db.settings.map(r=>r._token),token_(metaAll_(ss))]),month};
}
function createBatchInvoices30(payload) {return lock_(()=>{
  const ss=book_(),db=all_(ss),month=String(payload&&payload.month||''),ids=payload&&payload.contracts;
  parseDate_(month,true,ss.getSpreadsheetTimeZone());
  assert_(Array.isArray(ids)&&ids.length>0&&ids.length<=100&&new Set(ids).size===ids.length,'Chọn 1–100 hợp đồng, không trùng nhau.');
  const meta=metaAll_(ss);
  assert_(payload.token===token_([db.contracts.map(r=>r._token),db.meters.map(r=>r._token),db.services.map(r=>r._token),db.invoices.map(r=>r._token),db.receipts.map(r=>r._token),db.settings.map(r=>r._token),token_(meta)]),'Dữ liệu đã thay đổi. Xem trước lại trước khi tạo phiếu.');
  const drafts=ids.map(id=>{const existing=db.invoices.find(i=>i.contract===id&&i.month===month);assert_(!existing||(!db.receipts.some(r=>r.invoice===existing.id)&&!(meta['invoice:'+existing.id]||{}).sealed),'Phiếu đã chốt hoặc đã thu, không thể cập nhật.');const draft=draftInvoice_(ss,db,id,month,!!existing);if(existing){draft.id=existing.id;draft.adjustment=existing.adjustment;draft.details=invoiceDetails_(db,draft);}return {draft,existing};});
  const sh=sheet_(ss,'invoices'),header=sh.getRange(5,18).getValue();
  assert_(!header||header==='Chi tiết khoản thu (JSON)','Cột chi tiết hóa đơn đang chứa dữ liệu khác.');
  if(typeof sh.getMaxColumns==='function'&&sh.getMaxColumns()<18)sh.insertColumnsAfter(sh.getMaxColumns(),18-sh.getMaxColumns());
  let row=nextRow_(db,'invoices');const tasks=[];
  const paymentUpdates=[];drafts.forEach(({draft,existing})=>{const target=existing?existing._row:row++,old=sh.getRange(target,18).getValue();tasks.push(cellTask26_(ss,'invoices',draft,target),{run:()=>sh.getRange(target,18).setValue(JSON.stringify(draft.details)),undo:()=>sh.getRange(target,18).setValue(old)});if(!existing)paymentUpdates.push(['invoicepayment:'+draft.id,sitePayment38_(ss,db,draft.site)]);});if(paymentUpdates.length)tasks.push(metaBatchTask27_(ss,paymentUpdates));
  tasks.push({run:()=>sh.getRange(5,18).setValue('Chi tiết khoản thu (JSON)'),undo:()=>sh.getRange(5,18).setValue(header)});
  atomic26_(tasks);
  const created=drafts.filter(x=>!x.existing).map(x=>x.draft.id),updated=drafts.filter(x=>x.existing).map(x=>x.draft.id);
  return {message:'Đã tạo '+created.length+' và cập nhật '+updated.length+' phiếu nháp.',created,updated,state:snapshot_(ss)};
});}
function rentForMonth35_(ss,contract,end){const stay=metaAll_(ss)['stay:'+contract.id]||{},rates=(stay.rentChanges||[]).filter(x=>x.start<=end).sort((a,b)=>b.start.localeCompare(a.start));return rates.length?Number(rates[0].rent):Number(contract.rent);}
function draftInvoice_(ss,db,contractId,month,allowExisting) {parseDate_(month,true,ss.getSpreadsheetTimeZone());
  const contract=find_(db,'contracts',contractId);assert_(contract,'Không tìm thấy hợp đồng.');
  assert_(contract.status==='Đang hiệu lực','Chọn hợp đồng đang hiệu lực.');
  const start=month+'-01',y=Number(month.slice(0,4)),m=Number(month.slice(5)),days=new Date(Date.UTC(y,m,0)).getUTCDate(),end=month+'-'+String(days).padStart(2,'0');
  assert_(interval_(contract,{start,end}),'Hợp đồng không có hiệu lực trong tháng này.');
  assert_(allowExisting||!db.invoices.some(r=>r.contract===contractId&&r.month===month),'Đã có hóa đơn cho hợp đồng trong tháng này.');
  const room=find_(db,'rooms',contract.room),tenant=find_(db,'tenants',contract.tenant);
  assert_(room&&tenant,'Hợp đồng thiếu phòng hoặc khách thuê.');
  const getSetting=(key,otherwise)=>{const r=db.settings.find(s=>s.id===key);return r&&Number.isFinite(Number(r.value))?Number(r.value):otherwise;};
  const obj={id:'INV-'+contractId+'-'+month.replace('-',''),month,site:room.site,room:room.id,tenant:tenant.name,
    due:month+'-'+String(Math.min(days,Number(contract.dueDay))).padStart(2,'0'),rent:rentForMonth35_(ss,contract,end),electricity:0,water:0,
    trash:getSetting('Rác / phòng / tháng',0),wifi:getSetting('Wifi / phòng / tháng',0),parking:0,other:0,adjustment:0,contract:contractId,note:''};
  const notes=['Bản nháp tính cả tháng; nếu đổi giá trong tháng dùng giá hiệu lực mới nhất trong kỳ, không tự chia ngày. Kiểm tra trước khi lưu.'];
  const mapping={'Điện':'electricity','Nước':'water','Rác':'trash','Wifi':'wifi','Xe':'parking','Dịch vụ khác':'other'};
  const services=invoiceServices_(db,contractId,start,end),seen={};
  services.forEach(s=>{
    assert_(!seen[s.name],'Có nhiều đơn giá '+s.name+' trong tháng. Hãy lập hóa đơn thủ công hoặc gộp số tiền đã chốt.');seen[s.name]=true;
    const field=mapping[s.name]||'other';
    if(['Theo kWh','Theo m³'].includes(s.method)){
      const meter=db.meters.find(r=>r.room===room.id&&r.month===month&&r.type===s.name);
      assert_(meter,'Thiếu chỉ số '+s.name+' của '+room.id+' tháng '+month);
      assert_(Number(meter.current)>=Number(meter.previous),'Chỉ số không hợp lệ.');
      obj[field]=Math.round((Number(meter.current)-Number(meter.previous))*Number(s.price));
    } else {if(field==='other')obj[field]+=Math.round(Number(s.price)*Number(s.quantity));else obj[field]=Math.round(Number(s.price)*Number(s.quantity));}
  });
  // New lifecycle contracts charge only the agreed selected services.
  if(metaAll_(ss)['stay:'+contractId]){if(!seen['Rác'])obj.trash=0;if(!seen['Wifi'])obj.wifi=0;}
  // Với mẫu cũ chỉ lưu dịch vụ Điện: dùng bản ghi nước đã chốt nếu có.
  if(!seen['Nước']){const water=db.meters.find(r=>r.room===room.id&&r.month===month&&r.type==='Nước');if(water)obj.water=Math.round((water.current-water.previous)*water.price);else notes.push('Chưa có dịch vụ/chỉ số nước: nhập số tiền nước sau khi kiểm tra.');}
  if(!seen['Xe'])notes.push('Tiền xe mặc định 0: nhập số tiền hoặc bổ sung dịch vụ Xe.');
  obj.note=notes.join(' ');obj.details=invoiceDetails_(db,obj);return obj;
}
function syncSummaries() { return lock_(()=>{const ss=book_();sync_(ss);return {message:'Đã đồng bộ bảng tổng hợp.',state:snapshot_(ss)};}); }
function sync_(ss) {
  const db=all_(ss),invoices=db.invoices,track=ss.getSheetByName('Theo dõi thu tiền'),report=ss.getSheetByName('Báo cáo');
  assert_(track&&report,'Thiếu tab Theo dõi thu tiền / Báo cáo.');
  const max=Math.max(105,ss.getSheetByName('Thu tiền').getMaxRows());
  const output=invoices.map((v,i)=>{
    const r=i+6,source=v._row,arr=[];
    for(let c=0;c<15;c++){const col=String.fromCharCode(65+c);arr.push("=IF('Hóa đơn'!A"+source+'="","",\'Hóa đơn\'!'+col+source+')');}
    arr.push('=SUMIFS(\'Thu tiền\'!$F$6:$F$'+max+',\'Thu tiền\'!$D$6:$D$'+max+',A'+r+',\'Thu tiền\'!$E$6:$E$'+max+',"Thanh toán hóa đơn")',
      '=MAX(0,O'+r+'-P'+r+')','=MAX(0,P'+r+'-O'+r+')',
      '=IF(P'+r+'>O'+r+',"Đóng dư",IF(P'+r+'=O'+r+',"Đã đóng đủ",IF(P'+r+'=0,"Chưa đóng","Đóng một phần")))',
      '=IF(AND(Q'+r+'>0,F'+r+'<TODAY()),"Quá hạn","")');return arr;
  });
  const clearEnd=Math.max(track.getLastRow(),6+output.length);
  if(clearEnd>track.getMaxRows())track.insertRowsAfter(track.getMaxRows(),clearEnd-track.getMaxRows()+100);
  track.getRange(6,1,clearEnd-5,20).clearContent();
  if(output.length){track.getRange(6,1,output.length,20).setValues(output);track.getRange(6,2,output.length,1).setNumberFormat('mm/yyyy');track.getRange(6,6,output.length,1).setNumberFormat('dd/MM/yyyy');track.getRange(6,7,output.length,12).setNumberFormat('#,##0');}
  if(track.getFilter())track.getFilter().remove();track.getRange(5,1,Math.max(output.length+1,2),20).createFilter();
  // Keep existing report layout, charts, and helper cells. Expand formula bounds.
  const invoiceMax=ss.getSheetByName('Hóa đơn').getMaxRows(),costMax=ss.getSheetByName('Chi phí').getMaxRows(),paymentMax=ss.getSheetByName('Chi tiền').getMaxRows();
  const months=[dateString_(new Date(),ss.getSpreadsheetTimeZone()).slice(0,7)]
    .concat(db.invoices.map(r=>r.month),db.costs.map(r=>r.month),db.receipts.map(r=>r.date.slice(0,7)),db.payments.map(r=>r.date.slice(0,7))).filter(Boolean).sort();
  const latest=months[months.length-1],lastYear=Number(latest.slice(0,4)),lastMonth=Number(latest.slice(5));
  const periods=Array.from({length:30},(_,i)=>{
    const d=new Date(Date.UTC(lastYear,lastMonth-30+i,1));
    return [parseDate_(d.toISOString().slice(0,10),false,ss.getSpreadsheetTimeZone())];
  });
  report.getRange(37,1,30,1).setValues(periods).setNumberFormat('mm/yyyy');
  const formulas=periods.map((v,i)=>{
    const r=37+i;return [
      '=SUMIF(\'Hóa đơn\'!B6:B'+invoiceMax+',A'+r+',\'Hóa đơn\'!O6:O'+invoiceMax+')',
      '=SUMIFS(\'Chi phí\'!H6:H'+costMax+',\'Chi phí\'!C6:C'+costMax+',A'+r+',\'Chi phí\'!I6:I'+costMax+',"Có")',
      '=B'+r+'-C'+r,
      '=SUMIFS(\'Thu tiền\'!F6:F'+max+',\'Thu tiền\'!B6:B'+max+',">="&A'+r+',\'Thu tiền\'!B6:B'+max+',"<"&EDATE(A'+r+',1))',
      '=SUMIFS(\'Chi tiền\'!F6:F'+paymentMax+',\'Chi tiền\'!B6:B'+paymentMax+',">="&A'+r+',\'Chi tiền\'!B6:B'+paymentMax+',"<"&EDATE(A'+r+',1))',
      '=E'+r+'-F'+r];
  });report.getRange(37,2,30,6).setValues(formulas);
  report.getRange('A5').setValue('=SUM(\'Hóa đơn\'!O6:O'+invoiceMax+')');
  report.getRange('F5').setValue('=SUMIF(\'Chi phí\'!I6:I'+costMax+',"Có",\'Chi phí\'!H6:H'+costMax+')');
  report.getRange('K5').setValue('=A5-F5');report.getRange('P5').setValue('=SUM(\'Theo dõi thu tiền\'!Q6:Q'+track.getMaxRows()+')');
  ['Đã đóng đủ','Đóng một phần','Chưa đóng','Đóng dư'].forEach((status,i)=>report.getRange(44+i,10).setValue('=COUNTIF(\'Theo dõi thu tiền\'!S6:S'+track.getMaxRows()+',"'+status+'")'));
  const categories=report.getRange(44,13,10,1).getDisplayValues();categories.forEach((v,i)=>{report.getRange(44+i,14).setValue('=SUMIF(\'Chi phí\'!F6:F'+costMax+',M'+(44+i)+',\'Chi phí\'!H6:H'+costMax+')');});
  SpreadsheetApp.flush();
}

// Stable public entry point: reject unknown actions instead of dynamic frontend calls.
function appApi(action,args) {
 const handlers={getState,saveRecord,deleteRecord,saveBranding,previewInvoice,previewBatchInvoices30,createBatchInvoices30,previewRoomBatch30,createRoomBatch30,extendContract32,adjustContractTerms35,saveContractDraft35,saveSignedContract35,syncSummaries,savePayment,saveSitePayment38,saveServiceBatch,saveHousingCommon,saveSiteConfig28,previewSiteApply39,copySiteConfig39,cloneSite39,setSiteActive39,saveSiteProfile31,recordDepositDeduction28,recordDepositTransfer40,saveRoomWithConfig,createRoomBatch,createStay,checkoutStay,saveTenantProfile34,addCoTenant34,endResidence34,saveMonthlyMeters,sealInvoice,previewDemoCleanup,reduceDemoSamples,saveCatalog28,previewFactoryReset26,backupFactoryReset26,executeFactoryReset26,resetDataOneClick};
 assert_(Object.prototype.hasOwnProperty.call(handlers,action),'Chức năng không được hỗ trợ.');
 reset27_();const started=Date.now(),result=handlers[action].apply(null,args||[]);
 if(result&&result.state&&action!=='getState'){
 const changed={saveRecord:[args&&args[0]?args[0].module:''],deleteRecord:[args&&args[0]?args[0].module:''],saveServiceBatch:['services'],saveBranding:['settings'],savePayment:['settings'],saveCatalog28:[]}[action];
 if(changed){const full=result.state,patch={...full,data:{}};changed.forEach(m=>patch.data[m]=full.data[m]);delete patch.schemas;delete patch.housing;delete patch.branding;delete patch.payment;delete patch.catalogs;
 if(changed.includes('settings')){patch.branding=full.branding;patch.payment=full.payment;}if(action==='saveCatalog28')patch.catalogs=full.catalogs;
 delete result.state;result.patchState=patch;}
 }
 if(result&&typeof result==='object')result.serverMs=Date.now()-started;
 if(typeof console!=='undefined'&&console.log)console.log(JSON.stringify({event:'rental_api',action,serverMs:Date.now()-started,...request27_.metrics}));
 return result;
}

function payment_(db){
 const keys=['Ngân hàng nhận','Số tài khoản nhận','Chủ tài khoản nhận','QR thanh toán','Mẫu nội dung chuyển khoản','Ghi chú thanh toán','BIN ngân hàng nhận'];
 const values=keys.map(k=>{const rows=db.settings.filter(r=>r.id===k);assert_(rows.length<=1,'Trùng cài đặt '+k);return rows.length?String(rows[0].value):'';});
 return {bank:values[0],account:values[1],holder:values[2],qr:values[3],memo:values[4]||'{phong} {thang}',note:values[5],bin:values[6],token:token_(values)};
}
function savePayment(payload){return lock_(()=>{
 const ss=book_(),db=all_(ss);assert_(payload&&payload.token===payment_(db).token,'Thông tin thanh toán đã đổi. Hãy tải lại.');
 const fields=[['Ngân hàng nhận','bank',100],['Số tài khoản nhận','account',50],['Chủ tài khoản nhận','holder',120],['QR thanh toán','qr',45000],['Mẫu nội dung chuyển khoản','memo',150],['Ghi chú thanh toán','note',250],['BIN ngân hàng nhận','bin',6]];
 const rows=fields.map(([id,key,max])=>{const value=String(payload[key]||'').trim();assert_(value.length<=max&&!/^[=+@]/.test(value),'Thông tin '+id+' không hợp lệ.');if(key==='bin')assert_(!value||/^\d{6}$/.test(value),'Mã ngân hàng không hợp lệ.');if(key==='account')assert_(!value||/^[A-Za-z0-9]{1,19}$/.test(value),'STK cần 1–19 chữ hoặc số.');if(key==='qr'){assert_(!value||value.indexOf('data:image/')===0,'Hãy tải ảnh QR từ máy.');validateLogo_(value);}return {id,value};});
 if(payload.bin){assert_(payload.confirmed===true,'Cần xác nhận đã kiểm tra tài khoản nhận tiền.');assert_(payload.bank&&payload.account&&payload.holder,'Nhập đầy đủ ngân hàng, STK và chủ tài khoản.');}
 if(payload.qr)assert_(payload.bin&&payload.account&&payload.holder&&payload.confirmed===true,'Ảnh QR cần thông tin tài khoản đã được chủ trọ kiểm tra.');
 let next=nextRow_(db,'settings');const tasks=rows.map(obj=>{const old=db.settings.find(r=>r.id===obj.id);return cellTask26_(ss,'settings',obj,old?old._row:next++);});atomic26_(tasks);
 db.settings=rows_(ss,'settings');return {message:'Đã lưu thông tin thanh toán dùng chung.',state:snapshot_(ss,db)};
});}

function sitePayment38_(ss,db,siteId){
 const config=metaAll_(ss)['sitepayment:'+siteId]||{},global=payment_(db);
 if(!config.accountId)return {bank:global.bank,bin:global.bin,account:global.account,holder:global.holder,qr:global.qr,memo:global.memo,note:global.note,source:'Đơn vị quản lý'};
 const item=catalogs28_(ss,db).items.find(x=>x.id===config.accountId&&x.group==='Tài khoản thu / chi'&&x.active!==false&&x.accountType==='Tài khoản ngân hàng');
 assert_(item,'Tài khoản nhận tiền của căn không còn trong Danh mục.');
 return {bank:item.bank,bin:config.bin||'',account:item.account,holder:item.owner,qr:config.qr||'',memo:config.memo||'{phong} {thang} {hoadon}',note:config.note||'',source:'Căn cho thuê',accountId:item.id};
}
function saveSitePayment38(payload){return lock_(()=>{
 const ss=book_(),db=all_(ss);checkHousing_(ss,payload.revision);
 const site=db.sites.find(s=>s.id===payload.site);assert_(site,'Chọn căn cho thuê hợp lệ.');
 const accountId=text26_(payload.accountId,100),bin=text26_(payload.bin,6),memo=text26_(payload.memo,150),note=text26_(payload.note,250),qr=String(payload.qr||'');
 if(accountId){const item=catalogs28_(ss,db).items.find(x=>x.id===accountId&&x.group==='Tài khoản thu / chi'&&x.active&&x.accountType==='Tài khoản ngân hàng');assert_(item,'Chọn tài khoản ngân hàng đang dùng trong Danh mục.');assert_(item.bank&&item.account&&item.owner,'Tài khoản chưa đủ ngân hàng, STK và chủ tài khoản.');}
 assert_(!bin||/^\d{6}$/.test(bin),'Mã ngân hàng không hợp lệ.');assert_(!qr||accountId,'Chọn tài khoản trước khi lưu ảnh QR.');validateLogo_(qr);
 atomic26_([metaTask26_(ss,'sitepayment:'+site.id,{accountId,bin,qr,memo,note})]);
 return {message:'Đã lưu thanh toán cho '+site.name+'. Chỉ áp dụng phiếu lập mới.',state:snapshot_(ss)};
});}
function paymentStatus_(bill){return bill.paid>bill.total?'Thu dư':bill.paid===bill.total?'Đã thu đủ':bill.paid>0?'Thu một phần':'Chưa thu';}
function invoiceDetails_(db,r){
 const fields={electricity:'Điện',water:'Nước',trash:'Rác',wifi:'Wifi',parking:'Xe',other:'Dịch vụ khác'};
 const result=[{name:'Tiền phòng',unit:'tháng',quantity:1,price:r.rent,amount:r.rent}];
 const start=r.month+'-01',end=r.month+'-31',services=invoiceServices_(db,r.contract,start,end);
 Object.keys(fields).forEach(key=>{const amount=Number(r[key])||0,name=fields[key],found=services.filter(s=>s.name===name||(key==='other'&&!['Điện','Nước','Rác','Wifi','Xe'].includes(s.name)));
 const details=found.map(s=>{let quantity=Number(s.quantity),unit={'Theo phòng':'phòng','Theo người':'người','Theo xe':'xe','Theo số lượng':'lần','Theo kWh':'kWh','Theo m³':'m³'}[s.method];const d={name:s.name,unit,price:Number(s.price)};
 if(['Theo kWh','Theo m³'].includes(s.method)){const meter=db.meters.find(m=>m.room===r.room&&m.month===r.month&&m.type===s.name);if(!meter)return null;d.previous=meter.previous;d.current=meter.current;quantity=meter.current-meter.previous;}
 d.quantity=quantity;d.amount=Math.round(d.price*quantity);return d;}).filter(Boolean);
 if(details.length&&sum_(details,'amount')===amount){result.push.apply(result,details);return;}
 const meter=['Điện','Nước'].includes(name)?db.meters.find(m=>m.room===r.room&&m.month===r.month&&m.type===name):null;
 if(meter&&meter.current>meter.previous){const quantity=meter.current-meter.previous;result.push({name,previous:meter.previous,current:meter.current,quantity,unit:name==='Điện'?'kWh':'m³',price:amount/quantity,amount});}
 else result.push({name,quantity:1,unit:'khoản',price:amount,amount,manual:true});
 });
 if(Number(r.adjustment))result.push({name:'Điều chỉnh',quantity:1,unit:'khoản',price:r.adjustment,amount:r.adjustment});
 assert_(sum_(result,'amount')===['rent','electricity','water','trash','wifi','parking','other','adjustment'].reduce((n,k)=>n+Number(r[k]||0),0),'Chi tiết không khớp tổng hóa đơn.');
 return result;
}
function saveServiceBatch(payload){return lock_(()=>{
 const ss=book_(),db=all_(ss),tz=ss.getSpreadsheetTimeZone();assert_(payload&&payload.revision===token_(db.services.map(r=>r._token)),'Dịch vụ đã thay đổi. Tải lại trước khi áp dụng.');
 assert_(Array.isArray(payload.contracts)&&payload.contracts.length>0&&payload.contracts.length<=500,'Chọn 1–500 hợp đồng.');assert_(new Set(payload.contracts).size===payload.contracts.length,'Trùng hợp đồng.');
 assert_(Array.isArray(payload.items)&&payload.items.length>0&&payload.items.length<=30,'Chọn 1–30 khoản thu.');assert_(new Set(payload.items.map(i=>String(i.name||'').trim())).size===payload.items.length,'Không thêm trùng tên khoản thu trong một lần áp dụng.');parseDate_(payload.start,false,tz);if(payload.end)parseDate_(payload.end,false,tz);
 assert_(!payload.end||payload.end>=payload.start,'Ngày hết hiệu lực không hợp lệ.');const plan=[],work=Object.assign({},db,{services:db.services.map(r=>Object.assign({},r))});
 payload.contracts.forEach(id=>{const contract=find_(db,'contracts',id);assert_(contract&&contract.status==='Đang hiệu lực'&&contract.start<=payload.start&&(!contract.end||contract.end>=payload.start),'Hợp đồng '+id+' không hiệu lực tại ngày áp dụng.');
 payload.items.forEach(item=>{const obj=clean_('services',Object.assign({},item,{contract:id,start:payload.start,end:payload.end||''}));assert_(obj.name.length<=80,'Tên dịch vụ quá dài.');const matches=work.services.filter(r=>r.contract===id&&r.name===obj.name&&interval_(r,obj));
 matches.forEach(old=>{assert_(old.start<=obj.start,'Có giá tương lai chồng lấn. Chọn lại ngày hoặc sửa riêng.');if(old.start===obj.start){work.services=work.services.filter(r=>r!==old);}else{const date=new Date(obj.start+'T12:00:00Z');date.setUTCDate(date.getUTCDate()-1);const changed=Object.assign({},old,{end:date.toISOString().slice(0,10)});plan.push({obj:changed,row:old._row,old:Object.assign({},old)});old.end=changed.end;}});
 const same=matches.find(r=>r.start===obj.start);const row=same?same._row:nextRow_(work,'services');validate_('services',obj,work,null);work.services.push(Object.assign({},obj,{_row:row}));plan.push({obj,row,old:same||null});
 });});
 // Entire batch is validated before any write. Roll back completed rows on a write error.
 const completed=[];try{plan.forEach(p=>{completed.push(p);write_(ss,'services',p.obj,p.row);});SpreadsheetApp.flush();}catch(e){const errors=[];completed.reverse().forEach(p=>{try{if(p.old)write_(ss,'services',p.old,p.row);else sheet_(ss,'services').getRange(p.row,1,1,8).clearContent();}catch(x){errors.push(x.message);}});throw new Error('Không hoàn tất lưu dịch vụ: '+e.message+(errors.length?' Cần kiểm tra lại Sheets: '+errors.join('; '):' Đã khôi phục các dòng đã ghi.'));}
 db.services=rows_(ss,'services');return finish_(ss,'Đã áp dụng '+payload.items.length+' khoản cho '+payload.contracts.length+' hợp đồng.',db);
});}

// Full-month billing: when a rate changes during the month, use its latest
// effective start within that month. No automatic daily proration.
function invoiceServices_(db,contract,start,end){const byName={};db.services.filter(s=>s.contract===contract&&interval_(s,{start,end})).forEach(s=>{if(!byName[s.name]||s.start>byName[s.name].start)byName[s.name]=s;});return Object.keys(byName).map(k=>byName[k]);}

// v2.7 metadata: append-only keys; original 13 business tabs remain intact.
function metaSheet_(ss,create){let sh=ss.getSheetByName('_Dữ liệu ứng dụng');if(!sh&&create){sh=ss.insertSheet('_Dữ liệu ứng dụng');sh.getRange(1,1,1,2).setValues([['Mục','Dữ liệu JSON']]);sh.hideSheet();}return sh;}
function metaAll_(ss){if(request27_.meta)return JSON.parse(JSON.stringify(request27_.meta));const started=Date.now(),sh=metaSheet_(ss,false),out={};if(sh&&sh.getLastRow()>=2)sh.getRange(2,1,sh.getLastRow()-1,2).getValues().forEach(r=>{if(r[0]){assert_(!Object.prototype.hasOwnProperty.call(out,r[0]),'Trùng cấu hình '+r[0]);try{out[r[0]]=JSON.parse(String(r[1]));}catch(e){throw new Error('Cấu hình '+r[0]+' bị lỗi JSON.');}}});request27_.meta=out;request27_.metrics.metaReadMs=(request27_.metrics.metaReadMs||0)+Date.now()-started;return JSON.parse(JSON.stringify(out));}
function metaSet_(ss,key,value){const sh=metaSheet_(ss,true),rows=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,1).getValues():[],i=rows.findIndex(r=>r[0]===key),row=i>=0?i+2:sh.getLastRow()+1;const raw=JSON.stringify(value);assert_(raw.length<=45000,'Hồ sơ quá lớn.');sh.getRange(row,1,1,2).setValues([[key,raw]]);request27_.meta=null;}
function housing_(ss){const meta=metaAll_(ss),rooms={},sites={},siteProfiles={},sitePayments={},invoicePayments={},stays={},invoices={},deposits={},tenantProfiles={},contractDrafts={};Object.keys(meta).forEach(k=>{if(k.indexOf('room:')===0)rooms[k.slice(5)]=meta[k];if(k.indexOf('siteconfig:')===0)sites[k.slice(11)]=meta[k];if(k.indexOf('siteprofile:')===0)siteProfiles[k.slice(12)]=meta[k];if(k.indexOf('sitepayment:')===0)sitePayments[k.slice(12)]=meta[k];if(k.indexOf('invoicepayment:')===0)invoicePayments[k.slice(15)]=meta[k];if(k.indexOf('stay:')===0)stays[k.slice(5)]=meta[k];if(k.indexOf('invoice:')===0)invoices[k.slice(8)]=meta[k];if(k.indexOf('deposit:')===0)deposits[k.slice(8)]=meta[k];if(k.indexOf('tenantprofile:')===0)tenantProfiles[k.slice(14)]=meta[k];if(k.indexOf('contractdraft:')===0&&meta[k].status==='Bản nháp')contractDrafts[k.slice(14)]=meta[k];});return {common:meta.common||{},sites,siteProfiles,sitePayments,invoicePayments,rooms,stays,invoices,deposits,tenantProfiles,contractDrafts,revision:token_(meta)};}
function text26_(v,max){v=String(v||'').trim();assert_(v.length<=(max||200)&&!/^\s*[=+@]/.test(v),'Nội dung không hợp lệ.');return v;}
function num26_(v){v=Number(v);assert_(Number.isFinite(v)&&v>=0,'Số không hợp lệ.');return v;}
function setup26_(input){input=input||{};const out={};['address','owner','ownerPhone','roomLabel','defaultSite','roomPrefix','sitePrefix'].forEach(k=>out[k]=text26_(input[k],250));out.digits=num26_(input.digits||3);assert_(Number.isInteger(out.digits)&&out.digits>=1&&out.digits<=6,'Số chữ số từ 1–6.');out.defaultRent=num26_(input.defaultRent||0);out.startNo=num26_(input.startNo||1);assert_(Number.isInteger(out.startNo),'Số bắt đầu phải là số nguyên.');out.features=(input.features||[]).map(v=>text26_(v,80));assert_(out.features.length<=30,'Quá nhiều đặc điểm.');out.furniture=(input.furniture||[]).map(r=>({name:text26_(r.name,80),quantity:num26_(r.quantity),condition:text26_(r.condition||'Tốt',100)}));assert_(out.furniture.length<=50&&out.furniture.every(r=>r.name&&r.quantity>0&&Number.isInteger(r.quantity)),'Nội thất cần tên và số lượng lớn hơn 0.');out.services=(input.services||[]).map(r=>({name:text26_(r.name,80),method:text26_(r.method,50),price:num26_(r.price),quantity:num26_(r.quantity)}));assert_(out.services.length<=30&&new Set(out.services.map(r=>r.name)).size===out.services.length,'Danh mục dịch vụ trùng hoặc quá nhiều.');out.services.forEach(r=>{assert_(r.name&&['Theo kWh','Theo m³','Theo phòng','Theo người','Theo xe','Theo số lượng'].includes(r.method),'Cách tính dịch vụ không hợp lệ.');assert_(Number.isInteger(r.price),'Đơn giá phải là đồng nguyên.');if(r.name==='Điện')assert_(r.method==='Theo kWh','Điện tính theo kWh.');});out.initial={month:text26_(input.initial&&input.initial.month,7),electricity:input.initial&&input.initial.electricity!==''&&input.initial.electricity!=null?num26_(input.initial.electricity):null,water:input.initial&&input.initial.water!==''&&input.initial.water!=null?num26_(input.initial.water):null,note:text26_(input.initial&&input.initial.note,300)};return out;}
function checkHousing_(ss,revision){assert_(revision===housing_(ss).revision,'Thông tin phòng đã thay đổi. Hãy tải lại.');}
function saveHousingCommon(payload){return lock_(()=>{
 const ss=book_(),db=all_(ss);checkHousing_(ss,payload.revision);const common=setup26_(payload.config),meta=metaAll_(ss);common.initial={month:'',electricity:null,water:null};
 if(common.defaultSite)assert_(db.sites.some(s=>s.id===common.defaultSite),'Nhóm phòng không tồn tại.');
 const targets=payload.rooms||[],parts=payload.parts||[];assert_(Array.isArray(targets)&&new Set(targets).size===targets.length,'Danh sách phòng không hợp lệ.');
 assert_(Array.isArray(parts)&&parts.every(k=>['identity','features','furniture','services'].includes(k)),'Phần cấu hình không hợp lệ.');
 assert_(!targets.length||parts.length,'Chọn phần muốn áp dụng.');
 const updates=[['common',common]];targets.forEach(id=>{const room=db.rooms.find(r=>r.id===id);assert_(room,'Không tìm thấy phòng '+id);
 if(payload.addressKey)assert_(addressKey27_(ss,db,room,meta)===payload.addressKey,'Phòng không thuộc địa chỉ đã chọn.');
 const old=setup26_(meta['room:'+id]||meta.common||{}),next=JSON.parse(JSON.stringify(old));
 parts.forEach(k=>{(k==='identity'?['address','owner','ownerPhone']:[k]).forEach(f=>next[f]=common[f]);});
 // Never propagate common meter readings to rooms.
 next.initial=meta['room:'+id]?.initial||{month:'',electricity:null,water:null};updates.push(['room:'+id,next]);});atomic26_([metaBatchTask27_(ss,updates)]);
 return {message:'Đã lưu cấu hình'+(targets.length?' và áp dụng '+targets.length+' phòng.':'.')+' Chỉ số đầu, tiền thuê và hợp đồng/hóa đơn cũ được giữ nguyên.',state:snapshot_(ss)};
});}
function addressKey27_(ss,db,room,stored){const meta=stored||metaAll_(ss),site=db.sites.find(s=>s.id===room.site)||{};return String((meta['room:'+room.id]||{}).address||site.address||(meta.common||{}).address||('Chưa có địa chỉ · '+room.site)).trim();}

function saveSiteConfig28(payload){return lock_(()=>{
 const ss=book_(),db=all_(ss);checkHousing_(ss,payload.revision);
 const site=db.sites.find(s=>s.id===payload.site);assert_(site,'Căn / địa chỉ không tồn tại.');
 const config=setup26_(payload.config);config.address=site.address||'';config.initial={month:'',electricity:null,water:null};
 const updates=[['siteconfig:'+site.id,config]],meta=metaAll_(ss);
 const selected=Array.isArray(payload.rooms)?payload.rooms:(payload.applyRooms?db.rooms.filter(r=>r.site===site.id).map(r=>r.id):[]);
 const parts=Array.isArray(payload.parts)?payload.parts:['features','furniture','services'];
 assert_(new Set(selected).size===selected.length&&selected.length<=500,'Danh sách phòng áp dụng không hợp lệ.');
 assert_(parts.length>0&&new Set(parts).size===parts.length&&parts.every(k=>['features','furniture','services'].includes(k)),'Phần cấu hình áp dụng không hợp lệ.');
 if(selected.length&&payload.roomToken)assert_(payload.roomToken===token_(db.rooms.map(r=>r._token)),'Danh sách phòng đã thay đổi. Hãy xem trước lại.');
 selected.forEach(id=>{const room=db.rooms.find(r=>r.id===id&&r.site===site.id);assert_(room,'Phòng áp dụng không thuộc căn này.');if(payload.onlyVacant)assert_(room.status==='Trống','Chỉ chọn phòng trống khi áp dụng phạm vi này.');const old=meta['room:'+id]||{},next={...old};parts.forEach(k=>next[k]=config[k]);updates.push(['room:'+id,next]);});
 atomic26_([metaBatchTask27_(ss,updates)]);
 return {message:'Đã lưu cấu hình căn'+(selected.length?' và áp dụng cho '+selected.length+' phòng được chọn.':' cho phòng mới.')+' Giá thuê, chỉ số và hợp đồng cũ được giữ nguyên.',state:snapshot_(ss)};
});}
function previewSiteApply39(payload){
 const ss=book_(),db=all_(ss);checkHousing_(ss,payload.revision);const site=db.sites.find(s=>s.id===payload.site);assert_(site,'Căn không tồn tại.');
 const cfg=setup26_(payload.config),meta=metaAll_(ss),parts=payload.parts||['features','furniture','services'];assert_(Array.isArray(parts)&&parts.length>0&&parts.every(k=>['features','furniture','services'].includes(k)),'Chọn phần cần áp dụng.');
 const ids=payload.rooms||[];assert_(Array.isArray(ids)&&new Set(ids).size===ids.length&&ids.length<=500,'Danh sách phòng không hợp lệ.');
 const rows=ids.map(id=>{const room=db.rooms.find(r=>r.id===id&&r.site===site.id);assert_(room,'Phòng không thuộc căn.');const old=meta['room:'+id]||{},changed=parts.filter(k=>JSON.stringify(old[k]||[])!==JSON.stringify(cfg[k]||[]));return {id,name:room.name,status:room.status,changed};});
 return {rows,roomToken:token_(db.rooms.map(r=>r._token)),revision:payload.revision};
}
function copySiteConfig39(payload){return lock_(()=>{
 const ss=book_(),db=all_(ss);checkHousing_(ss,payload.revision);const source=db.sites.find(s=>s.id===payload.source),target=db.sites.find(s=>s.id===payload.target);assert_(source&&target&&source.id!==target.id,'Chọn hai căn khác nhau.');
 const parts=payload.parts||[];assert_(Array.isArray(parts)&&parts.length>0&&new Set(parts).size===parts.length&&parts.every(k=>['features','furniture','services','payment'].includes(k)),'Chọn phần cấu hình cần sao chép.');
 const meta=metaAll_(ss),from=meta['siteconfig:'+source.id]||{},to=meta['siteconfig:'+target.id]||{},updates=[];let next={...to};parts.filter(k=>k!=='payment').forEach(k=>next[k]=JSON.parse(JSON.stringify(from[k]||[])));
 if(parts.some(k=>k!=='payment')){next.address=target.address||'';next.initial={month:'',electricity:null,water:null};updates.push(['siteconfig:'+target.id,next]);}
 if(parts.includes('payment')){const payment=meta['sitepayment:'+source.id]||{accountId:'',bin:'',qr:'',memo:'',note:''};if(payment.accountId)assert_(catalogs28_(ss,db).items.some(x=>x.id===payment.accountId&&x.group==='Tài khoản thu / chi'&&x.active),'Tài khoản ở căn nguồn không còn sử dụng.');updates.push(['sitepayment:'+target.id,{...payment}]);}
 atomic26_([metaBatchTask27_(ss,updates)]);return {message:'Đã sao chép cấu hình sang '+target.name+'. Phòng, khách, hợp đồng và giao dịch vẫn giữ nguyên.',state:snapshot_(ss)};
});}
function cloneSite39(payload){return lock_(()=>{
 const ss=book_(),db=all_(ss);checkHousing_(ss,payload.revision);const source=db.sites.find(s=>s.id===payload.source);assert_(source,'Chọn căn mẫu hợp lệ.');
 const name=text26_(payload.name,120),address=text26_(payload.address,250);assert_(name&&address,'Nhập tên và địa chỉ căn mới.');
 const parts=payload.parts||[];assert_(Array.isArray(parts)&&parts.every(k=>['features','furniture','services','payment'].includes(k)),'Phần sao chép không hợp lệ.');
 let id;do{id='K-'+Utilities.getUuid().slice(0,8).toUpperCase();}while(db.sites.some(s=>s.id===id));const site=clean_('sites',{id,name,address,manager:'',note:''});validate_('sites',site,db,null);
 const meta=metaAll_(ss),sourceCfg=meta['siteconfig:'+source.id]||{},cfg={...sourceCfg,address,owner:'',ownerPhone:'',initial:{month:'',electricity:null,water:null}};['features','furniture','services'].forEach(k=>{if(!parts.includes(k))cfg[k]=[];});const sourceProfile=meta['siteprofile:'+source.id]||{};const tasks=[cellTask26_(ss,'sites',site,nextRow_(db,'sites')),metaTask26_(ss,'siteprofile:'+id,{type:sourceProfile.type||'Nhà trọ',manager:'',phone:'',note:'',active:true}),metaTask26_(ss,'siteconfig:'+id,cfg)];
 if(parts.includes('payment')){const pay=meta['sitepayment:'+source.id]||{accountId:'',bin:'',qr:'',memo:'',note:''};if(pay.accountId)assert_(catalogs28_(ss,db).items.some(x=>x.id===pay.accountId&&x.group==='Tài khoản thu / chi'&&x.active),'Tài khoản căn mẫu không còn sử dụng.');tasks.push(metaTask26_(ss,'sitepayment:'+id,{...pay}));}
 atomic26_(tasks);return {message:'Đã tạo căn mới từ mẫu; chưa sao chép phòng hay dữ liệu thuê.',created:id,state:snapshot_(ss)};
});}
function setSiteActive39(payload){return lock_(()=>{const ss=book_(),db=all_(ss);checkHousing_(ss,payload.revision);const site=db.sites.find(s=>s.id===payload.site);assert_(site,'Căn không tồn tại.');const meta=metaAll_(ss),old=meta['siteprofile:'+site.id]||{};atomic26_([metaTask26_(ss,'siteprofile:'+site.id,{...old,active:payload.active===true})]);return {message:payload.active?'Đã mở khai thác căn.':'Đã ngừng nhận khách mới tại căn; lịch sử vẫn được giữ.',state:snapshot_(ss)};});}
function saveSiteProfile31(payload){return lock_(()=>{
 const ss=book_(),db=all_(ss);checkHousing_(ss,payload.revision);
 const old=payload.key?db.sites.find(r=>r._key===payload.key):null;
 if(payload.key)assert_(old&&old._token===payload.token,'Thông tin căn đã thay đổi. Hãy tải lại.');
 const site=clean_('sites',payload.values);validate_('sites',site,db,old);
 const types=['Nhà trọ','Căn hộ dịch vụ','Chung cư mini','Nhà nguyên căn','Tòa nhà cho thuê','Khác'];
 const profile={type:text26_(payload.profile&&payload.profile.type,60)||'Nhà trọ',manager:text26_(payload.profile&&payload.profile.manager,120),phone:text26_(payload.profile&&payload.profile.phone,40),note:text26_(payload.profile&&payload.profile.note,500),active:(metaAll_(ss)['siteprofile:'+site.id]||{}).active!==false};
 assert_(types.includes(profile.type),'Loại hình căn không hợp lệ.');
 atomic26_([cellTask26_(ss,'sites',site,old?old._row:nextRow_(db,'sites')),metaTask26_(ss,'siteprofile:'+site.id,profile)]);
 return {message:'Đã lưu thông tin căn cho thuê.',state:snapshot_(ss)};
});}
function recordDepositDeduction28(payload){return lock_(()=>{
 const ss=book_(),db=all_(ss);checkHousing_(ss,payload.revision);
 const contract=find_(db,'contracts',payload.contract);assert_(contract,'Không tìm thấy hợp đồng.');
 parseDate_(payload.date,false,ss.getSpreadsheetTimeZone());
 const amount=num26_(payload.amount),reason=text26_(payload.reason,300);
 assert_(amount>0&&Number.isInteger(amount)&&reason,'Nhập số tiền khấu trừ và lý do.');
 const meta=metaAll_(ss),old=meta['deposit:'+contract.id]||{deductions:[]},deductions=old.deductions||[];
 const received=sum_(db.receipts.filter(r=>r.contract===contract.id&&r.type==='Nhận cọc'),'amount');
 const refunded=sum_(db.payments.filter(r=>r.contract===contract.id&&r.type==='Hoàn cọc'),'amount');
 assert_(amount<=received-refunded-sum_(deductions,'amount'),'Khấu trừ vượt tiền cọc còn giữ.');
 const next={deductions:deductions.concat([{id:Utilities.getUuid(),date:payload.date,amount,reason}])};
 atomic26_([metaTask26_(ss,'deposit:'+contract.id,next)]);
 return {message:'Đã ghi khấu trừ cọc, không tính là tiền thực chi.',state:snapshot_(ss)};
});}

// Một giao dịch cọc chỉ ghi vào một sổ tiền thực thu hoặc thực chi.
function recordDepositTransfer40(payload){return lock_(()=>{
 const ss=book_(),db=all_(ss),kind=String(payload.kind||''),contract=find_(db,'contracts',payload.contract),requestId=String(payload.requestId||'');
 assert_(['Nhận cọc','Nhận bổ sung','Hoàn cọc'].includes(kind)&&contract,'Chọn hợp đồng và loại giao dịch cọc.');
 assert_(!requestId||/^[A-Za-z0-9-]{8,80}$/.test(requestId),'Mã yêu cầu không hợp lệ.');
 const fingerprint=token_([kind,contract.id,payload.date,Number(payload.amount),payload.method,payload.account,String(payload.note||'')]);
 const prior=requestId?metaAll_(ss)['depositrequest:'+requestId]:null;
 if(prior){assert_(prior.fingerprint===fingerprint,'Giao dịch đã lưu với nội dung khác. Đóng form rồi mở lại để tạo giao dịch mới.');return {message:'Giao dịch cọc đã được ghi nhận trước đó · '+prior.id+'.',transactionId:prior.id,state:snapshot_(ss)};}
 parseDate_(payload.date,false,ss.getSpreadsheetTimeZone());
 const amount=num26_(payload.amount);assert_(Number.isInteger(amount)&&amount>0,'Nhập số tiền cọc hợp lệ.');
 assert_(kind==='Hoàn cọc'||contract.status==='Đang hiệu lực','Chỉ nhận cọc cho hợp đồng đang hiệu lực.');
 const meta=metaAll_(ss),deductions=sum_((meta['deposit:'+contract.id]||{}).deductions||[],'amount');
 const received=sum_(db.receipts.filter(r=>r.contract===contract.id&&r.type==='Nhận cọc'),'amount');
 const refunded=sum_(db.payments.filter(r=>r.contract===contract.id&&r.type==='Hoàn cọc'),'amount');
 if(kind==='Hoàn cọc')assert_(contract.status!=='Đang hiệu lực'&&amount<=received-refunded-deductions,'Chỉ hoàn cọc sau khi trả phòng và không vượt số đang giữ.');
 const method=String(payload.method||''),account=String(payload.account||'');
 assert_(['Chuyển khoản','Tiền mặt'].includes(method),'Chọn phương thức thanh toán.');
 const accountRow=catalogs28_(ss,db).items.find(x=>x.group==='Tài khoản thu / chi'&&x.active&&x.name===account);
 assert_(accountRow&&((method==='Chuyển khoản'&&(accountRow.accountType==='Tài khoản ngân hàng'||!!accountRow.bank))||(method==='Tiền mặt'&&accountRow.accountType==='Quỹ tiền mặt')),'Chọn tài khoản phù hợp đã khai báo trong Danh mục.');
 const module=kind==='Hoàn cọc'?'payments':'receipts',values={id:module==='receipts'?'PT-'+Utilities.getUuid().slice(0,8).toUpperCase():'PC-'+Utilities.getUuid().slice(0,8).toUpperCase(),date:payload.date,contract:contract.id,invoice:'',cost:'',type:kind==='Nhận bổ sung'?'Nhận cọc':kind,amount,method,account,note:text26_(payload.note,1000)};
 const obj=clean_(module,values);validate_(module,obj,db,null);
 const tasks=[cellTask26_(ss,module,obj,nextRow_(db,module))];if(requestId)tasks.push(metaTask26_(ss,'depositrequest:'+requestId,{id:obj.id,contract:contract.id,kind,fingerprint}));
 atomic26_(tasks);
 return {message:kind==='Hoàn cọc'?'Đã ghi nhận hoàn cọc.':'Đã ghi nhận tiền cọc.',transactionId:obj.id,state:snapshot_(ss)};
});}

function cellTask26_(ss,module,obj,row){const sh=sheet_(ss,module),width=schema_(module).fields.length,before=backupRange26_(sh.getRange(row,1,1,width));return {run:()=>write_(ss,module,obj,row),undo:()=>sh.getRange(row,1,1,width).setValues(before)};}
function metaTask26_(ss,key,value){const sh=metaSheet_(ss,true),rows=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,1).getValues():[],i=rows.findIndex(r=>r[0]===key),old=i>=0?sh.getRange(i+2,1,1,2).getValues():null;return {run:()=>metaSet_(ss,key,value),undo:()=>{request27_.meta=null;const list=sh.getRange(2,1,Math.max(1,sh.getLastRow()-1),1).getValues(),j=list.findIndex(r=>r[0]===key);if(j>=0){if(old)sh.getRange(j+2,1,1,2).setValues(old);else sh.getRange(j+2,1,1,2).clearContent();}}};}
function atomic26_(tasks){const started=Date.now(),done=[];try{tasks.forEach(t=>{done.push(t);t.run();});SpreadsheetApp.flush();request27_.metrics.sheetWriteMs=(request27_.metrics.sheetWriteMs||0)+Date.now()-started;}catch(e){request27_.meta=null;const errors=[];done.reverse().forEach(t=>{try{t.undo();}catch(x){errors.push(x.message);}});throw new Error(e.message+(errors.length?' Cần kiểm tra Sheets: '+errors.join('; '):' Các dòng đã ghi đã được khôi phục.'));}}
function saveRoomWithConfig(payload){return lock_(()=>{const ss=book_(),db=all_(ss);checkHousing_(ss,payload.revision);const old=payload.key?db.rooms.find(r=>r._key===payload.key):null;if(payload.key)assert_(old&&old._token===payload.token,'Phòng đã thay đổi.');const room=clean_('rooms',payload.values);validate_('rooms',room,db,old);const active=db.contracts.some(c=>c.room===room.id&&c.status==='Đang hiệu lực');assert_(!active||room.status==='Đang thuê','Phòng có hợp đồng hiệu lực phải giữ trạng thái Đang thuê.');const config=setup26_(payload.config);atomic26_([cellTask26_(ss,'rooms',room,old?old._row:nextRow_(db,'rooms')),metaTask26_(ss,'room:'+room.id,config)]);return {message:'Đã lưu phòng và cấu hình riêng.',state:snapshot_(ss)};});}
function createRoomBatch(payload){return lock_(()=>{const ss=book_(),db=all_(ss);checkHousing_(ss,payload.revision);const count=num26_(payload.count),start=num26_(payload.start),prefix=text26_(payload.prefix,20),digits=num26_(payload.digits);assert_(Number.isInteger(count)&&count>=1&&count<=100&&Number.isInteger(start)&&Number.isInteger(digits)&&digits>=1&&digits<=6,'Tạo 1–100 phòng; số bắt đầu và số chữ số phải hợp lệ.');const config=setup26_(payload.config),tasks=[],ids=[];config.initial={month:'',electricity:null,water:null};let row=nextRow_(db,'rooms');for(let i=0;i<count;i++){const id=prefix+String(start+i).padStart(digits,'0'),room=clean_('rooms',{id,site:payload.site,name:'Phòng '+id,floor:0,area:0,rent:payload.rent,status:'Trống',note:''});validate_('rooms',room,db,null);db.rooms.push(Object.assign({},room,{_row:row}));tasks.push(cellTask26_(ss,'rooms',room,row++),metaTask26_(ss,'room:'+id,config));ids.push(id);}atomic26_(tasks);return {message:'Đã tạo '+ids.length+' phòng: '+ids.join(', '),state:snapshot_(ss)};});}
function previewRoomBatch30(payload){
 const ss=book_(),db=all_(ss),site=String(payload&&payload.site||''),first=Number(payload&&payload.floorStart),last=Number(payload&&payload.floorEnd),count=Number(payload&&payload.roomsPerFloor),start=Number(payload&&payload.roomStart||1);
 assert_(db.sites.some(s=>s.id===site),'Chọn căn / địa chỉ hợp lệ.');
 assert_(Number.isInteger(first)&&Number.isInteger(last)&&first>=0&&last>=first&&last<=99&&Number.isInteger(count)&&count>=1&&count<=99&&(last-first+1)*count<=100,'Chọn tối đa 100 phòng; lầu 0–99 và 1–99 phòng mỗi lầu.');
 assert_(Number.isInteger(start)&&start>=1&&start+count-1<=99,'Số phòng bắt đầu phải từ 1 đến 99 và đủ chỗ cho số phòng mỗi lầu.');
 const names=new Set(db.rooms.filter(r=>r.site===site).map(r=>String(r.name).trim().toLocaleLowerCase('vi'))),rooms=[];
 for(let floor=first;floor<=last;floor++)for(let n=start;n<start+count;n++){const name='Phòng '+String(floor)+String(n).padStart(2,'0');rooms.push({floor,name,duplicate:names.has(name.toLocaleLowerCase('vi'))});}
 return {rooms,token:token_(db.rooms.map(r=>r._token)),site};
}
function createRoomBatch30(payload){return lock_(()=>{
 const ss=book_(),db=all_(ss);checkHousing_(ss,payload.revision);
 assert_(payload.token===token_(db.rooms.map(r=>r._token)),'Danh sách phòng đã thay đổi. Xem trước lại.');
 const site=String(payload.site||'');assert_(db.sites.some(s=>s.id===site),'Căn / địa chỉ không tồn tại.');
 const entries=payload.rooms;assert_(Array.isArray(entries)&&entries.length>=1&&entries.length<=100,'Chọn 1–100 phòng.');
 const rent=num26_(payload.rent);assert_(rent>=0,'Giá thuê không hợp lệ.');
 const names=new Set(db.rooms.filter(r=>r.site===site).map(r=>String(r.name).trim().toLocaleLowerCase('vi'))),config=setup26_(payload.config),tasks=[],ids=[];config.initial={month:'',electricity:null,water:null};let row=nextRow_(db,'rooms');
 entries.forEach(item=>{const floor=Number(item.floor),name=text26_(item.name,80).trim(),key=name.toLocaleLowerCase('vi');assert_(Number.isInteger(floor)&&floor>=0&&floor<=99&&name&&names.has(key)===false,'Tên phòng trống hoặc trùng trong căn.');names.add(key);let id;do{id='P-'+Utilities.getUuid().slice(0,8).toUpperCase();}while(db.rooms.some(r=>r.id===id)||ids.includes(id));const room=clean_('rooms',{id,site,name,floor,area:0,rent,status:'Trống',note:''});validate_('rooms',room,db,null);db.rooms.push({...room,_row:row});tasks.push(cellTask26_(ss,'rooms',room,row++),metaTask26_(ss,'room:'+id,config));ids.push(id);});
 atomic26_(tasks);return {message:'Đã tạo '+ids.length+' phòng trong căn đã chọn.',created:ids,state:snapshot_(ss)};
});}
function extendContract32(payload){return lock_(()=>{
 const ss=book_(),db=all_(ss),contract=find_(db,'contracts',String(payload&&payload.contract||''));
 assert_(contract&&contract.status==='Đang hiệu lực'&&contract._token===payload.token,'Hợp đồng đã thay đổi hoặc không còn hiệu lực. Hãy tải lại.');
 const end=String(payload.end||'');parseDate_(end,false,ss.getSpreadsheetTimeZone());
 assert_(end>contract.start&&(!contract.end||end>contract.end),'Ngày kết thúc mới phải sau ngày bắt đầu và ngày kết thúc cũ.');
 const next=clean_('contracts',{...contract,end});validate_('contracts',next,db,contract);
 const stay=metaAll_(ss)['stay:'+contract.id]||{},tasks=[cellTask26_(ss,'contracts',next,contract._row)];
 const history=[...(stay.history||[]),{type:'Gia hạn',date:dateString_(new Date(),ss.getSpreadsheetTimeZone()),oldEnd:contract.end||'',newEnd:end,note:text26_(payload.note,500)}];
 let rentChanges=stay.rentChanges||[];if(payload.rent!==undefined&&payload.rent!==null&&payload.rent!==''){const rent=num26_(payload.rent),effective=String(payload.effectiveDate||contract.end||'');assert_(rent>=0,'Giá thuê gia hạn không hợp lệ.');parseDate_(effective,false,ss.getSpreadsheetTimeZone());assert_(effective>=contract.start&&effective<=end,'Ngày áp dụng giá mới ngoài kỳ thuê.');assert_(!db.invoices.some(i=>i.contract===contract.id&&i.month>=effective.slice(0,7)),'Đã có phiếu từ kỳ áp dụng; không đổi giá lịch sử.');assert_(!(stay.rentChanges||[]).some(x=>x.start>=effective),'Đã có giá hiệu lực từ ngày này hoặc sau đó.');rentChanges=[...rentChanges,{start:effective,rent,note:text26_(payload.note,500),type:'Gia hạn'}];history.push({type:'Giá gia hạn',date:effective,oldRent:rentForMonth35_(ss,contract,effective),newRent:rent,note:text26_(payload.note,500)});}
 tasks.push(metaTask26_(ss,'stay:'+contract.id,{...stay,terms:{...(stay.terms||{}),plannedEnd:end},rentChanges,history}));
 if(contract.end)db.services.filter(s=>s.contract===contract.id&&s.end===contract.end).forEach(s=>tasks.push(cellTask26_(ss,'services',{...s,end},s._row)));
 atomic26_(tasks);return {message:'Đã gia hạn hợp đồng đến '+end+'.',state:snapshot_(ss)};
});}
function adjustContractTerms35(payload){return lock_(()=>{
 const ss=book_(),db=all_(ss),contract=find_(db,'contracts',String(payload.contract||''));checkHousing_(ss,payload.revision);assert_(contract&&contract.status==='Đang hiệu lực'&&contract._token===payload.token,'Hợp đồng đã đổi hoặc hết hiệu lực.');
 const start=String(payload.start||'');parseDate_(start,false,ss.getSpreadsheetTimeZone());assert_(start>contract.start&&start.slice(8)==='01','Ngày áp dụng cần là ngày đầu tháng sau ngày nhận phòng.');assert_(!contract.end||start<=contract.end,'Ngày áp dụng sau khi hợp đồng hết hạn.');assert_(!db.invoices.some(i=>i.contract===contract.id&&i.month>=start.slice(0,7)),'Đã có phiếu từ kỳ áp dụng; không sửa giá hoặc dịch vụ đã lập phiếu.');
 const rent=num26_(payload.rent),note=text26_(payload.note,500);assert_(rent>=0&&note,'Nhập giá thuê mới và lý do điều chỉnh.');const oldRent=rentForMonth35_(ss,contract,start);
 const meta=metaAll_(ss),stay=meta['stay:'+contract.id]||{room:contract.room,people:[],status:contract.status};assert_(!(stay.rentChanges||[]).some(x=>x.start>=start),'Đã có lần điều chỉnh giá từ ngày này hoặc sau đó.');
 const services=Array.isArray(payload.services)?payload.services:null;assert_(services&&services.length<=30,'Danh sách dịch vụ không hợp lệ.');const names=new Set(),nextServices=services.map(x=>{const name=text26_(x.name,100),method=text26_(x.method,30),price=num26_(x.price),quantity=num26_(x.quantity);assert_(name&&!names.has(name)&&price>=0&&quantity>=0,'Dịch vụ trống, trùng hoặc số tiền không hợp lệ.');names.add(name);return clean_('services',{contract:contract.id,name,method,price,quantity,start,end:contract.end||'',note:'Điều chỉnh: '+note});});
 const priorDay=dateString_(new Date(Date.parse(start+'T00:00:00Z')-86400000),ss.getSpreadsheetTimeZone()),tasks=[];db.services.filter(s=>s.contract===contract.id&&s.start<start&&(!s.end||s.end>=start)).forEach(s=>tasks.push(cellTask26_(ss,'services',{...s,end:priorDay},s._row)));assert_(!db.services.some(s=>s.contract===contract.id&&s.start>=start),'Có dịch vụ hiệu lực từ ngày này hoặc sau đó; cần xử lý riêng.');
 const work={...db,services:db.services.filter(s=>s.contract!==contract.id||s.end&&s.end<start).map(s=>({...s}))};let row=nextRow_(db,'services');nextServices.forEach(s=>{validate_('services',s,work,null);work.services.push({...s,_row:row});tasks.push(cellTask26_(ss,'services',s,row++));});
 const oldServices=invoiceServices_(db,contract.id,start,start).map(s=>({name:s.name,method:s.method,price:s.price,quantity:s.quantity}));const history=[...(stay.history||[]),{type:'Điều chỉnh giá & dịch vụ',date:start,oldRent,newRent:rent,oldServices,newServices:nextServices.map(s=>({name:s.name,method:s.method,price:s.price,quantity:s.quantity})),note}];
 tasks.push(metaTask26_(ss,'stay:'+contract.id,{...stay,rentChanges:[...(stay.rentChanges||[]),{start,rent,note,type:'Điều chỉnh'}],history}));atomic26_(tasks);return {message:'Đã lưu giá và dịch vụ mới từ '+start+'. Phiếu đã lập giữ nguyên.',state:snapshot_(ss)};
});}
function uploadPrivate26_(file,name,created){const started=Date.now();assert_(file&&/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(file),'Bắt buộc tải ảnh giấy tờ PNG/JPG/WebP.');const bits=file.split(','),bytes=Utilities.base64Decode(bits[1]);assert_(bytes.length>20&&bytes.length<=1200000,'Ảnh giấy tờ tối đa 1,2 MB sau nén.');const head=bytes.map(b=>(b+256)%256),mime=bits[0].slice(5,-7);assert_(mime==='image/jpeg'?head[0]===255&&head[1]===216: mime==='image/png'?head.slice(0,4).join(',')==='137,80,78,71':String.fromCharCode.apply(null,head.slice(0,4))==='RIFF','Định dạng ảnh không hợp lệ.');const ss=book_(),meta=metaAll_(ss);let folder;if(meta.identityFolder){folder=DriveApp.getFolderById(meta.identityFolder);assertPrivate26_(folder);}else{folder=DriveApp.createFolder('Hồ sơ khách trọ riêng tư — '+SPREADSHEET_ID);folder.setSharing(DriveApp.Access.PRIVATE,DriveApp.Permission.VIEW);metaSet_(ss,'identityFolder',folder.getId());}const f=folder.createFile(Utilities.newBlob(bytes,mime,name));created.push(f);f.setSharing(DriveApp.Access.PRIVATE,DriveApp.Permission.VIEW);assertPrivate26_(f);request27_.metrics.fileUploadMs=(request27_.metrics.fileUploadMs||0)+Date.now()-started;return {id:f.getId(),url:f.getUrl()};}
function uploadSigned35_(data,name,created){const started=Date.now();assert_(typeof data==='string'&&/^data:(application\/pdf|image\/(jpeg|png|webp));base64,[A-Za-z0-9+/]+={0,2}$/.test(data),'Hợp đồng đã ký phải là PDF hoặc ảnh JPG/PNG/WebP.');const parts=data.split(','),bytes=Utilities.base64Decode(parts[1]),mime=parts[0].slice(5,-7),head=bytes.slice(0,8).map(b=>(b+256)%256);assert_(bytes.length>20&&bytes.length<=6000000,'Tệp hợp đồng đã ký tối đa 6 MB.');assert_(mime==='application/pdf'?String.fromCharCode.apply(null,head.slice(0,4))==='%PDF':mime==='image/jpeg'?head[0]===255&&head[1]===216:mime==='image/png'?head.slice(0,4).join(',')==='137,80,78,71':String.fromCharCode.apply(null,head.slice(0,4))==='RIFF','Tệp hợp đồng không đúng định dạng.');const ss=book_(),meta=metaAll_(ss);let folder;if(meta.identityFolder){folder=DriveApp.getFolderById(meta.identityFolder);assertPrivate26_(folder);}else{folder=DriveApp.createFolder('Hồ sơ khách trọ riêng tư — '+SPREADSHEET_ID);folder.setSharing(DriveApp.Access.PRIVATE,DriveApp.Permission.VIEW);metaSet_(ss,'identityFolder',folder.getId());}const f=folder.createFile(Utilities.newBlob(bytes,mime,name));created.push(f);f.setSharing(DriveApp.Access.PRIVATE,DriveApp.Permission.VIEW);assertPrivate26_(f);request27_.metrics.fileUploadMs=(request27_.metrics.fileUploadMs||0)+Date.now()-started;return {id:f.getId(),url:f.getUrl(),name,mime,date:dateString_(new Date(),ss.getSpreadsheetTimeZone())};}
function saveContractDraft35(payload){return lock_(()=>{const ss=book_(),db=all_(ss);checkHousing_(ss,payload.revision);const id=text26_(payload.id,80),room=find_(db,'rooms',payload.room);assert_(id&&room,'Chọn phòng trước khi lưu nháp.');assert_(!db.contracts.some(c=>c.id===id),'Mã này đã là hợp đồng hiệu lực.');const old=metaAll_(ss)['contractdraft:'+id];assert_(!old||old.status==='Bản nháp','Bản nháp không còn chỉnh được.');const people=Array.isArray(payload.people)?payload.people.slice(0,15).map(p=>({name:text26_(p.name,150),phone:text26_(p.phone,30),type:text26_(p.type,20),number:text26_(p.number,30)})):[];const draft={status:'Bản nháp',id,room:room.id,site:room.site,start:text26_(payload.start,10),end:text26_(payload.end,10),rent:Number(payload.rent)||0,deposit:Number(payload.deposit)||0,collectionStart:Number(payload.collectionStart)||0,collectionEnd:Number(payload.collectionEnd)||0,note:text26_(payload.note,1000),electricity:payload.electricity===''?null:Number(payload.electricity),water:payload.water===''?null:Number(payload.water),config:setup26_(payload.config||{}),people,updatedAt:dateString_(new Date(),ss.getSpreadsheetTimeZone())};assert_(draft.rent>=0&&draft.deposit>=0,'Giá thuê và cọc không hợp lệ.');if(draft.start)parseDate_(draft.start,false,ss.getSpreadsheetTimeZone());if(draft.end)parseDate_(draft.end,false,ss.getSpreadsheetTimeZone());atomic26_([metaTask26_(ss,'contractdraft:'+id,draft)]);return {message:'Đã lưu bản nháp. Phòng chưa chuyển sang Đang thuê.',state:snapshot_(ss)};});}
function saveSignedContract35(payload){return lock_(()=>{const ss=book_(),db=all_(ss),contract=find_(db,'contracts',String(payload.contract||''));checkHousing_(ss,payload.revision);assert_(contract,'Không tìm thấy hồ sơ kỳ thuê.');const meta=metaAll_(ss),stay=meta['stay:'+contract.id]||{room:contract.room,people:[],status:contract.status},created=[];try{const file=uploadSigned35_(payload.data,contract.id+'-'+text26_(payload.name,100),created);const docs=[...(stay.signedDocuments||[])];if(payload.replaceId){const old=docs.find(x=>x.id===payload.replaceId&&!x.replacedBy);assert_(old,'Tài liệu cần thay đã đổi. Hãy mở lại hồ sơ.');old.replacedBy=file.id;}docs.push(file);atomic26_([metaTask26_(ss,'stay:'+contract.id,{...stay,signedDocuments:docs})]);}catch(e){created.forEach(f=>{try{f.setTrashed(true);}catch(x){}});throw e;}return {message:'Đã lưu tệp hợp đồng đã ký ở chế độ riêng tư.',state:snapshot_(ss)};});}
function createStay(payload){return lock_(()=>{
 const ss=book_(),db=all_(ss);checkHousing_(ss,payload.revision);
 const room=find_(db,'rooms',payload.room);
 assert_(room&&room.status==='Trống','Chọn phòng Trống; cần xác nhận khách cũ trả phòng trước.');
 assert_((metaAll_(ss)['siteprofile:'+room.site]||{}).active!==false,'Căn đã ngừng khai thác; mở lại trước khi nhận khách mới.');
 assert_(payload.roomToken===room._token,'Phòng đã thay đổi.');
 assert_(!db.contracts.some(c=>c.room===room.id&&c.status==='Đang hiệu lực'),'Phòng đang có hợp đồng hiệu lực.');
 const config=setup26_(payload.config);
 if(!config.address)config.address=(find_(db,'sites',room.site)||{}).address||'';
 assert_(config.address&&config.owner,'Nhập địa chỉ và họ tên chủ trọ trong hợp đồng trước khi lưu.');
 assert_(Array.isArray(payload.people)&&payload.people.length>=1&&payload.people.length<=15,'Nhập 1–15 khách.');
 const persons=payload.people.map((p,i)=>{
  const existing=p.existingId?find_(db,'tenants',p.existingId):db.tenants.find(t=>t.document===p.type+' '+text26_(p.number,30));
  assert_(!p.existingId||existing,'Khách đã chọn không còn trong hồ sơ.');
  const name=text26_(p.name,150),type=p.type,number=text26_(p.number,30),phone=text26_(p.phone,30);
  assert_(name&&['CCCD','Hộ chiếu'].includes(type),'Khách '+(i+1)+' thiếu họ tên/loại giấy tờ.');
  assert_(type==='CCCD'?/^\d{12}$/.test(number):/^[A-Za-z0-9]{5,20}$/.test(number),'Số giấy tờ khách '+(i+1)+' không hợp lệ.');
  assert_(p.front&&(type!=='CCCD'||p.back),'Khách '+(i+1)+' cần đủ ảnh giấy tờ.');
  if(existing)assert_(existing.name===name&&existing.document===type+' '+number,'Thông tin khách đã chọn khác hồ sơ lưu.');
  else assert_(!db.tenants.some(t=>t.document===type+' '+number),'Giấy tờ đã có trong hồ sơ. Kiểm tra lại thông tin khách thuê.');
  return {name,type,number,phone,tenantId:existing?existing.id:String(payload.id)+'-KH'+(i+1),existing:!!existing};
 });
 assert_(new Set(persons.map(p=>p.type+':'+p.number)).size===persons.length,'Trùng giấy tờ trong danh sách khách.');
 assert_(new Set(persons.map(p=>p.tenantId)).size===persons.length,'Trùng khách trong hợp đồng.');
 const collectionStart=payload.collectionStart==null||payload.collectionStart===''?null:Number(payload.collectionStart);
 const collectionEnd=Number(payload.collectionEnd??payload.dueDay);
 assert_(Number.isInteger(collectionEnd)&&collectionEnd>=1&&collectionEnd<=31,'Chọn ngày kết thúc kỳ thu tiền từ 1 đến 31.');
 assert_(collectionStart===null||(Number.isInteger(collectionStart)&&collectionStart>=1&&collectionStart<=collectionEnd),'Ngày bắt đầu thu phải từ 1 đến ngày kết thúc.');
 const contract=clean_('contracts',{id:payload.id,room:room.id,tenant:persons[0].tenantId,start:payload.start,end:payload.end||'',rent:payload.rent,deposit:payload.deposit,dueDay:collectionEnd,status:'Đang hiệu lực',note:payload.note||''});
 const newRows=persons.filter(p=>!p.existing).map(p=>clean_('tenants',{id:p.tenantId,name:p.name,phone:p.phone,document:p.type+' '+p.number,note:''}));
 newRows.forEach(t=>{validate_('tenants',t,db,null);db.tenants.push(t);});
 validate_('contracts',contract,db,null);
 assert_(payload.electricity!==''&&payload.electricity!=null,'Nhập chỉ số điện bàn giao.');
 const initialE=num26_(payload.electricity),initialW=payload.water===''||payload.water==null?null:num26_(payload.water);
 assert_(initialW!==null||!config.services.some(s=>s.name==='Nước'&&s.method==='Theo m³'),'Nhập chỉ số nước bàn giao.');
 const serviceRows=config.services.map(s=>clean_('services',Object.assign({},s,{contract:contract.id,start:contract.start,end:contract.end,note:'Giá bàn giao hợp đồng'})));
 db.contracts.push(contract);serviceRows.forEach(s=>validate_('services',s,db,null));
 const created=[],tasks=[];
 try{
  persons.forEach((p,i)=>{
   p.front=uploadPrivate26_(payload.people[i].front,contract.id+'-KH'+(i+1)+'-truoc',created);
   if(p.type==='CCCD')p.back=uploadPrivate26_(payload.people[i].back,contract.id+'-KH'+(i+1)+'-sau',created);
   p.start=contract.start;p.end='';
   delete p.existing;
  });
  let row=nextRow_(all_(ss),'tenants');newRows.forEach(t=>tasks.push(cellTask26_(ss,'tenants',t,row++)));
  tasks.push(cellTask26_(ss,'contracts',contract,nextRow_(all_(ss),'contracts')),cellTask26_(ss,'rooms',Object.assign({},room,{status:'Đang thuê'}),room._row));
  let sr=nextRow_(all_(ss),'services');serviceRows.forEach(s=>tasks.push(cellTask26_(ss,'services',s,sr++)));
  const signedDocuments=payload.signed?[uploadSigned35_(payload.signed,contract.id+'-hop-dong-da-ky',created)]:[];
  tasks.push(metaTask26_(ss,'stay:'+contract.id,{room:room.id,config,people:persons,terms:{rent:contract.rent,deposit:contract.deposit,collectionStart,collectionEnd,dueDay:contract.dueDay,plannedEnd:contract.end},start:contract.start,handover:{electricity:initialE,water:initialW},status:'Đang hiệu lực',signedDocuments,history:[]}));
  const draft=metaAll_(ss)['contractdraft:'+contract.id];if(draft&&draft.status==='Bản nháp')tasks.push(metaTask26_(ss,'contractdraft:'+contract.id,{...draft,status:'Đã kích hoạt',activatedAt:contract.start}));
  atomic26_(tasks);
 }catch(e){created.forEach(f=>{try{f.setTrashed(true);}catch(x){}});throw e;}
 return {message:'Đã nhận khách, lưu giấy tờ riêng tư và kích hoạt hợp đồng.',state:snapshot_(ss)};
});}
function saveTenantProfile34(payload){return lock_(()=>{
 const ss=book_(),db=all_(ss),old=payload.key?db.tenants.find(t=>t._key===payload.key):null;
 const requestId=String(payload.requestId||'');
 assert_(!requestId||/^[A-Za-z0-9-]{8,80}$/.test(requestId),'Mã yêu cầu không hợp lệ.');
 const requestKey=requestId?'tenantrequest:'+requestId:'';
 const prior=requestKey?metaAll_(ss)[requestKey]:null;
 if(prior){const saved=db.tenants.find(t=>t.id===prior.tenantId);assert_(saved,'Không tìm thấy hồ sơ đã lưu của yêu cầu này.');return {message:'Hồ sơ khách đã được lưu trước đó.',tenantId:saved.id,state:snapshot_(ss)};}
 if(payload.key)assert_(old&&old._token===payload.token,'Hồ sơ khách đã thay đổi. Hãy tải lại.');
 const name=text26_(payload.name,150),phone=text26_(payload.phone,30),type=text26_(payload.type,20),number=text26_(payload.number,30),note=text26_(payload.note,1000);
 assert_(name,'Nhập họ tên khách thuê.');
 assert_(!type&&!number||['CCCD','Hộ chiếu'].includes(type)&&number,'Chọn loại và nhập số giấy tờ, hoặc để trống cả hai.');
 if(type)assert_(type==='CCCD'?/^\d{12}$/.test(number):/^[A-Za-z0-9]{5,20}$/.test(number),'Số giấy tờ không hợp lệ.');
 const id=old?old.id:'KH-'+Utilities.getUuid().slice(0,8).toUpperCase(),document=type?type+' '+number:'';
 if(old&&document!==old.document)assert_(!Object.values(housing_(ss).stays).some(s=>(s.people||[]).some(p=>p.tenantId===old.id)),'Giấy tờ đã gắn lịch sử cư trú; cần đối chiếu hồ sơ trước khi đổi.');
 const tenant=clean_('tenants',{id,name,phone,document,note});validate_('tenants',tenant,db,old);
 assert_(!document||!db.tenants.some(t=>t.id!==id&&t.document===document),'Số giấy tờ đã thuộc hồ sơ khách khác.');
 const birth=text26_(payload.birth,10);if(birth)parseDate_(birth,false,ss.getSpreadsheetTimeZone());
 const gender=text26_(payload.gender,20);assert_(!gender||['Nam','Nữ','Khác'].includes(gender),'Giới tính không hợp lệ.');const existing=metaAll_(ss)['tenantprofile:'+id]||{},profile={...existing,birth,gender,address:text26_(payload.address,300),emergency:text26_(payload.emergency,200),createdAt:existing.createdAt||Utilities.formatDate(new Date(),ss.getSpreadsheetTimeZone(),'yyyy-MM-dd')};
 const created=[];try{
  if(payload.front)profile.front=uploadPrivate26_(payload.front,id+'-giay-to-truoc',created);
  if(payload.back)profile.back=uploadPrivate26_(payload.back,id+'-giay-to-sau',created);
  const tasks=[cellTask26_(ss,'tenants',tenant,old?old._row:nextRow_(db,'tenants')),metaTask26_(ss,'tenantprofile:'+id,profile)];
  if(requestKey)tasks.push(metaTask26_(ss,requestKey,{tenantId:id}));
  atomic26_(tasks);
 }catch(e){created.forEach(f=>{try{f.setTrashed(true);}catch(x){}});throw e;}
 return {message:old?'Đã lưu hồ sơ khách.':'Đã tạo hồ sơ khách. Khách chưa được đánh dấu đang thuê.',tenantId:id,state:snapshot_(ss)};
});}
function addCoTenant34(payload){return lock_(()=>{
 const ss=book_(),db=all_(ss);checkHousing_(ss,payload.revision);
 const contract=find_(db,'contracts',String(payload.contract||''));assert_(contract&&contract.status==='Đang hiệu lực','Chỉ thêm người ở cùng vào hợp đồng đang hiệu lực.');
 const date=String(payload.start||'');parseDate_(date,false,ss.getSpreadsheetTimeZone());assert_(date>=contract.start&&(!contract.end||date<=contract.end),'Ngày bắt đầu cư trú ngoài thời hạn hợp đồng.');
 const name=text26_(payload.name,150),phone=text26_(payload.phone,30),type=text26_(payload.type,20),number=text26_(payload.number,30);
 assert_(name&&['CCCD','Hộ chiếu'].includes(type),'Nhập họ tên và loại giấy tờ.');
 assert_(type==='CCCD'?/^\d{12}$/.test(number):/^[A-Za-z0-9]{5,20}$/.test(number),'Số giấy tờ không hợp lệ.');
 assert_(payload.front&&(type!=='CCCD'||payload.back),'Tải đủ ảnh giấy tờ của người ở cùng.');
 const meta=metaAll_(ss),stay=meta['stay:'+contract.id];assert_(stay&&Array.isArray(stay.people),'Hợp đồng chưa có hồ sơ cư trú.');
 assert_(!stay.people.some(p=>p.type===type&&p.number===number&&!p.end),'Người này đang cư trú trong phòng.');
 assert_(stay.people.length<15,'Tối đa 15 người trong một hồ sơ.');
 const existing=db.tenants.find(t=>t.document===type+' '+number);if(existing)assert_(existing.name===name,'Số giấy tờ đã thuộc hồ sơ khách khác tên.');
 if(existing)assert_(!db.contracts.some(c=>c.id!==contract.id&&c.status==='Đang hiệu lực'&&(c.tenant===existing.id||(meta['stay:'+c.id]?.people||[]).some(p=>p.tenantId===existing.id&&!p.end))),'Khách này đang cư trú ở phòng khác. Kết thúc cư trú cũ trước khi chuyển phòng.');
 const id=existing?existing.id:'KH-'+Utilities.getUuid().slice(0,8).toUpperCase();
 const tenant=existing?null:clean_('tenants',{id,name,phone,document:type+' '+number,note:''});if(tenant)validate_('tenants',tenant,db,null);
 const created=[];try{
  const person={tenantId:id,name,phone,type,number,start:date,end:'',front:uploadPrivate26_(payload.front,contract.id+'-'+id+'-truoc',created)};
  if(type==='CCCD')person.back=uploadPrivate26_(payload.back,contract.id+'-'+id+'-sau',created);
  const tasks=[];if(tenant)tasks.push(cellTask26_(ss,'tenants',tenant,nextRow_(db,'tenants')));
  const history=[...(stay.history||[]),{type:'Thêm người ở cùng',tenantId:id,name,date,changedAt:new Date().toISOString(),actor:Session.getActiveUser().getEmail()||''}];
  tasks.push(metaTask26_(ss,'stay:'+contract.id,{...stay,people:[...stay.people,person],history}));atomic26_(tasks);
 }catch(e){created.forEach(f=>{try{f.setTrashed(true);}catch(x){}});throw e;}
 return {message:'Đã thêm người ở cùng vào hồ sơ cư trú.',tenantId:id,state:snapshot_(ss)};
});}
function endResidence34(payload){return lock_(()=>{
 const ss=book_(),db=all_(ss);checkHousing_(ss,payload.revision);
 const contract=find_(db,'contracts',String(payload.contract||''));assert_(contract&&contract.status==='Đang hiệu lực','Hợp đồng không còn hiệu lực.');
 const stay=metaAll_(ss)['stay:'+contract.id];assert_(stay&&Array.isArray(stay.people),'Không tìm thấy hồ sơ cư trú.');
 const index=stay.people.findIndex((p,i)=>i>0&&p.tenantId===payload.tenantId&&!p.end);assert_(index>=0,'Người ở cùng đã rời đi hoặc không tồn tại.');
 const date=String(payload.date||'');parseDate_(date,false,ss.getSpreadsheetTimeZone());assert_(date>=(stay.people[index].start||contract.start)&&(!contract.end||date<=contract.end),'Ngày kết thúc cư trú không hợp lệ.');
 const people=stay.people.map((p,i)=>i===index?{...p,end:date}:p),history=[...(stay.history||[]),{type:'Kết thúc cư trú',tenantId:stay.people[index].tenantId,name:stay.people[index].name,date,changedAt:new Date().toISOString(),actor:Session.getActiveUser().getEmail()||''}];atomic26_([metaTask26_(ss,'stay:'+contract.id,{...stay,people,history})]);
 return {message:'Đã kết thúc cư trú; lịch sử khách vẫn được giữ.',state:snapshot_(ss)};
});}
function checkoutStay(payload){return lock_(()=>{const ss=book_(),db=all_(ss);checkHousing_(ss,payload.revision);const contract=find_(db,'contracts',payload.contract);assert_(contract&&contract.status==='Đang hiệu lực'&&contract._token===payload.token,'Hợp đồng không còn hiệu lực hoặc đã thay đổi.');parseDate_(payload.date,false,ss.getSpreadsheetTimeZone());assert_(payload.date>=contract.start,'Ngày trả phòng trước ngày nhận.');assert_(['Trống','Bảo trì'].includes(payload.status),'Chọn tình trạng phòng sau khi trả.');const room=find_(db,'rooms',contract.room),meta=metaAll_(ss),stay=meta['stay:'+contract.id]||{room:room.id,start:contract.start,people:[],config:{}},electricity=(assert_(payload.electricity!==''&&payload.electricity!=null,'Nhập chỉ số điện trả phòng.'),num26_(payload.electricity)),water=payload.water===''||payload.water==null?null:num26_(payload.water);['Điện','Nước'].forEach(type=>{const value=type==='Điện'?electricity:water;if(value===null)return;const prior=db.meters.filter(m=>m.room===room.id&&m.date<=payload.date&&m.date>=contract.start&&m.type===type).sort((a,b)=>b.date.localeCompare(a.date))[0],base=prior?prior.current:stay.handover&&stay.handover[type==='Điện'?'electricity':'water'];assert_(base==null||value>=base,'Chỉ số trả phòng nhỏ hơn chỉ số đã ghi.');});assert_(water!==null||!(stay.config&&stay.config.services||[]).some(s=>s.name==='Nước'&&s.method==='Theo m³'),'Nhập chỉ số nước trả phòng.');const bills=computed_(db).filter(b=>b.contract===contract.id),debt=sum_(bills,'debt'),deposit=sum_(db.receipts.filter(r=>r.contract===contract.id&&r.type==='Nhận cọc'),'amount')-sum_(db.payments.filter(r=>r.contract===contract.id&&r.type==='Hoàn cọc'),'amount')-sum_((meta['deposit:'+contract.id]||{}).deductions||[],'amount');assert_(debt<=0&&deposit<=0||payload.settlementReviewed===true,'Kiểm tra và xác nhận công nợ, tiền cọc trước khi trả phòng.');stay.status='Đã kết thúc';stay.people=(stay.people||[]).map(p=>p.end?p:{...p,end:payload.date});stay.checkout={date:payload.date,electricity,water,note:text26_(payload.note,1000),debtAtCheckout:debt,depositAtCheckout:deposit,settlementReviewed:payload.settlementReviewed===true,furniture:setup26_({furniture:payload.furniture||[]}).furniture};atomic26_([cellTask26_(ss,'contracts',Object.assign({},contract,{end:payload.date,status:'Đã kết thúc'}),contract._row),cellTask26_(ss,'rooms',Object.assign({},room,{status:payload.status}),room._row),metaTask26_(ss,'stay:'+contract.id,stay)]);return {message:'Đã xác nhận trả phòng. Giữ nguyên hồ sơ, hóa đơn, công nợ và cọc chưa xử lý; không tự hoàn cọc.',state:snapshot_(ss)};});}
function previousMonth26_(month){const y=Number(month.slice(0,4)),m=Number(month.slice(5));return dateString_(new Date(Date.UTC(y,m-2,15)),book_().getSpreadsheetTimeZone()).slice(0,7);}
function saveMonthlyMeters(payload){return lock_(()=>{const ss=book_(),db=all_(ss),tz=ss.getSpreadsheetTimeZone();parseDate_(payload.month,true,tz);checkHousing_(ss,payload.revision);assert_(payload.dataToken===token_([db.meters.map(r=>r._token),db.invoices.map(r=>r._token),db.receipts.map(r=>r._token),db.services.map(r=>r._token),db.contracts.map(r=>r._token)]),'Chỉ số/hóa đơn đã thay đổi. Hãy tải lại.');assert_(Array.isArray(payload.items)&&payload.items.length>0&&payload.items.length<=200,'Chọn 1–200 phòng.');assert_(new Set(payload.items.map(r=>r.room)).size===payload.items.length,'Trùng phòng.');const meta=metaAll_(ss),tasks=[],paymentUpdates=[],work=Object.assign({},db,{meters:db.meters.map(r=>Object.assign({},r)),invoices:db.invoices.map(r=>Object.assign({},r))});let meterRow=nextRow_(db,'meters'),invoiceRow=nextRow_(db,'invoices');payload.items.forEach(item=>{const contract=db.contracts.find(c=>c.id===item.contract&&c.room===item.room&&c.status==='Đang hiệu lực');assert_(contract,'Phòng không có hợp đồng đang hiệu lực.');assert_(!db.contracts.some(c=>c.id!==contract.id&&c.room===item.room&&interval_(c,{start:payload.month+'-01',end:payload.month+'-31'})&&c.status!=='Đã hủy'),'Phòng đổi khách trong tháng: cần lập hóa đơn riêng theo chỉ số bàn giao.');const existing=db.invoices.find(r=>r.contract===contract.id&&r.month===payload.month);assert_(!existing||(!db.receipts.some(r=>r.invoice===existing.id)&&!(meta['invoice:'+existing.id]||{}).sealed),'Hóa đơn '+(existing&&existing.id)+' đã thu tiền hoặc đã chốt, không tự thay đổi.');const rates=invoiceServices_(db,contract.id,payload.month+'-01',payload.month+'-31');['Điện','Nước'].forEach(type=>{const key=type==='Điện'?'electricity':'water',input=item[key],rate=rates.find(s=>s.name===type);if(!input||input.current===''||input.current==null){assert_(!payload.makeInvoices||!rate||!['Theo kWh','Theo m³'].includes(rate.method),'Thiếu chỉ số '+type+' phòng '+item.room);return;}assert_(rate,'Chưa đặt đơn giá '+type+' cho phòng '+item.room);const prior=db.meters.find(r=>r.room===item.room&&r.month===previousMonth26_(payload.month)&&r.type===type),stay=meta['stay:'+contract.id],sameMonth=contract.start.slice(0,7)===payload.month,config=meta['room:'+item.room]||{};const expected=sameMonth&&stay&&stay.handover?stay.handover[key]:prior?prior.current:config.initial&&config.initial.month===payload.month?config.initial[key]:null;const previous=num26_(input.previous),current=num26_(input.current);assert_(input.previous!==''&&input.previous!=null,'Nhập chỉ số đầu '+type);assert_(expected==null||previous===Number(expected),'Chỉ số đầu '+type+' không khớp tháng trước/bàn giao.');assert_(current>=previous,'Chỉ số cuối phải >= chỉ số đầu.');const old=work.meters.find(r=>r.room===item.room&&r.month===payload.month&&r.type===type),row=old?old._row:meterRow++,obj=clean_('meters',{id:old?old.id:'CS-'+item.room+'-'+payload.month+'-'+(key==='electricity'?'E':'W'),month:payload.month,room:item.room,type,date:payload.month+'-'+String(new Date(Date.UTC(Number(payload.month.slice(0,4)),Number(payload.month.slice(5)),0)).getUTCDate()).padStart(2,'0'),previous,current,price:rate&&['Theo kWh','Theo m³'].includes(rate.method)?rate.price:0,note:expected==null?'Chỉ số đầu do chủ trọ xác nhận':''});validate_('meters',obj,work,old);if(old)work.meters=work.meters.filter(r=>r._row!==old._row);work.meters.push(Object.assign({},obj,{_row:row}));tasks.push(cellTask26_(ss,'meters',obj,row));});if(payload.makeInvoices){const draft=draftInvoice_(ss,work,contract.id,payload.month,true);if(existing){draft.id=existing.id;draft.adjustment=existing.adjustment;draft.details=invoiceDetails_(work,draft);}const row=existing?existing._row:invoiceRow++;tasks.push(cellTask26_(ss,'invoices',draft,row));if(!existing)paymentUpdates.push(['invoicepayment:'+draft.id,sitePayment38_(ss,db,draft.site)]);const sh=sheet_(ss,'invoices');if(typeof sh.getMaxColumns==='function'&&sh.getMaxColumns()<18)sh.insertColumnsAfter(sh.getMaxColumns(),18-sh.getMaxColumns());const old=sh.getRange(row,18).getValue();tasks.push({run:()=>sh.getRange(row,18).setValue(JSON.stringify(draft.details)),undo:()=>sh.getRange(row,18).setValue(old)});}});const inv=sheet_(ss,'invoices');if(payload.makeInvoices){const header=inv.getRange(5,18).getValue();assert_(!header||header==='Chi tiết khoản thu (JSON)','Cột R Hóa đơn có dữ liệu khác.');tasks.push({run:()=>inv.getRange(5,18).setValue('Chi tiết khoản thu (JSON)'),undo:()=>inv.getRange(5,18).setValue(header)});}if(paymentUpdates.length)tasks.push(metaBatchTask27_(ss,paymentUpdates));assert_(tasks.length>0,'Chưa có chỉ số hợp lệ để lưu.');atomic26_(tasks);return {message:'Đã lưu điện nước '+payload.items.length+' phòng'+(payload.makeInvoices?' và cập nhật hóa đơn nháp.':'.'),state:snapshot_(ss)};});}
function sealInvoice(payload){return lock_(()=>{const ss=book_(),db=all_(ss),bill=find_(db,'invoices',payload.id);assert_(bill&&bill._token===payload.token,'Hóa đơn đã đổi.');const meta=metaAll_(ss);assert_(!(meta['invoice:'+bill.id]||{}).sealed,'Hóa đơn đã chốt trước đó.');const tasks=[metaTask26_(ss,'invoice:'+bill.id,{sealed:true,date:dateString_(new Date(),ss.getSpreadsheetTimeZone())})];if(!db.receipts.some(r=>r.invoice===bill.id))tasks.push(metaTask26_(ss,'invoicepayment:'+bill.id,sitePayment38_(ss,db,bill.site)));atomic26_(tasks);return {message:'Đã chốt phiếu và lưu thông tin thanh toán tại thời điểm phát hành.',state:snapshot_(ss)};});}

// Run once in the editor if Google requests Drive authorization after updating.
function authorizePrivateStorage(){const ss=book_(),meta=metaAll_(ss);if(meta.identityFolder){const f=DriveApp.getFolderById(meta.identityFolder);assertPrivate26_(f);return 'Đã có thư mục giấy tờ riêng tư.';}const folder=DriveApp.createFolder('Hồ sơ khách trọ riêng tư — '+SPREADSHEET_ID);folder.setSharing(DriveApp.Access.PRIVATE,DriveApp.Permission.VIEW);metaSet_(ss,'identityFolder',folder.getId());return 'Đã sẵn sàng lưu ảnh giấy tờ riêng tư.';}

function backupRange26_(range){const values=range.getValues();if(typeof range.getFormulas==='function'){const formulas=range.getFormulas();values.forEach((row,i)=>row.forEach((v,j)=>{if(formulas[i][j])values[i][j]=formulas[i][j];}));}return values;}

function assertPrivate26_(file){assert_(file.getSharingAccess()===DriveApp.Access.PRIVATE,'Thư mục/ảnh giấy tờ phải ở chế độ Riêng tư.');if(typeof file.getEditors==='function'&&typeof file.getViewers==='function'){const owner=typeof file.getOwner==='function'?file.getOwner():null,email=owner?owner.getEmail():'';const shared=file.getEditors().concat(file.getViewers()).filter(u=>u.getEmail()!==email);assert_(!shared.length,'Thư mục/ảnh giấy tờ đã chia sẻ cho người khác. Dùng thư mục chỉ chủ tài khoản có quyền.');}}


const CATALOG_GROUPS28_=['Nội thất','Đặc điểm phòng','Dịch vụ / khoản thu','Đơn vị tính','Nhóm chi phí','Phương thức thanh toán','Tài khoản thu / chi'];
function catalogs28_(ss,db,defaultsOnly){
  const meta=metaAll_(ss),stored=meta.catalogs28;
  if(stored&&!defaultsOnly){assert_(Array.isArray(stored.items),'Danh mục không hợp lệ.');return {items:stored.items,revision:token_(stored.items)};}
  const defaults={
    'Nội thất':['Giường','Nệm','Tủ quần áo','Bàn ăn','Bàn làm việc','Ghế','Bếp','Sào phơi quần áo','Máy lạnh','Quạt','Rèm cửa','Kệ giày'],
    'Đặc điểm phòng':['Có gác','Bếp riêng','Toilet riêng','Ban công','Cửa sổ','Chỗ để xe'],
    'Dịch vụ / khoản thu':['Điện','Nước','Rác','Wifi','Giữ xe','Phí quản lý','Vệ sinh'],
    'Đơn vị tính':['kWh','m³','phòng','người','xe','cái','tháng'],
    'Nhóm chi phí':['Điện nước','Sửa chữa','Vệ sinh','Internet','Lương','Vật tư','Khác'],
    'Phương thức thanh toán':['Chuyển khoản','Tiền mặt'],
    'Tài khoản thu / chi':[]
  };
  const items=[];Object.keys(defaults).forEach(group=>defaults[group].forEach((name,i)=>items.push({id:'DM-'+group.length+'-'+i,group,name,unit:'',method:'',price:0,active:true,order:i+1,paymentType:group==='Phương thức thanh toán'?name:''})));
  (db&&db.costs||[]).forEach(r=>{const name=String(r.category||'').trim();if(name&&!items.some(x=>x.group==='Nhóm chi phí'&&x.name===name))items.push({id:'DM-CHI-'+items.length,group:'Nhóm chi phí',name,unit:'',method:'',price:0,active:true,order:items.length+1});});
  (db&&db.services||[]).forEach(r=>{const name=String(r.name||'').trim();if(name&&!items.some(x=>x.group==='Dịch vụ / khoản thu'&&x.name===name))items.push({id:'DM-DV-'+items.length,group:'Dịch vụ / khoản thu',name,unit:'',method:r.method||'',price:Number(r.price)||0,active:true,order:items.length+1});});
  return {items,revision:token_(items)};
}
function saveCatalog28(payload){return lock_(()=>{
  const ss=book_(),db=all_(ss),current=catalogs28_(ss,db);
  assert_(payload&&payload.revision===current.revision,'Danh mục đã đổi. Hãy tải lại.');
  const group=text26_(payload.group,80),name=text26_(payload.name,100),id=text26_(payload.id,80),unit=text26_(payload.unit,40),method=text26_(payload.method,40),price=num26_(payload.price||0);
  const description=text26_(payload.description,300),cycle=text26_(payload.cycle,40),symbol=text26_(payload.symbol,30),paymentType=text26_(payload.paymentType,40),bank=text26_(payload.bank,100),account=text26_(payload.account,50),owner=text26_(payload.owner,150),accountType=text26_(payload.accountType,40);
  assert_(CATALOG_GROUPS28_.includes(group)&&name,'Chọn nhóm và nhập tên danh mục.');
  assert_(Number.isInteger(price),'Đơn giá phải là số đồng nguyên.');
  if(group==='Dịch vụ / khoản thu')assert_(['Theo kWh','Theo m³','Theo phòng','Theo người','Theo xe','Theo số lượng'].includes(method),'Chọn cách tính dịch vụ.');
  if(group==='Phương thức thanh toán')assert_(['Tiền mặt','Chuyển khoản'].includes(paymentType),'Chọn loại phương thức thanh toán.');
  if(group==='Tài khoản thu / chi')assert_(['','Tài khoản ngân hàng','Quỹ tiền mặt'].includes(accountType),'Loại tài khoản không hợp lệ.');
  if(group==='Tài khoản thu / chi'&&accountType==='Tài khoản ngân hàng')assert_(bank&&account&&owner,'Nhập ngân hàng, số tài khoản và tên chủ tài khoản.');
  if(group==='Tài khoản thu / chi'&&bank)assert_(account&&/^[A-Za-z0-9]{1,19}$/.test(account),'Nhập số tài khoản ngân hàng hợp lệ.');
  const items=current.items.map(x=>({...x})),old=id?items.find(x=>x.id===id):null;
  assert_(!id||old,'Không tìm thấy mục cần sửa.');
  assert_(!items.some(x=>x!==old&&x.group===group&&x.name.toLocaleLowerCase('vi')===name.toLocaleLowerCase('vi')),'Tên danh mục đã có trong nhóm này.');
  const extra={description,cycle,symbol,paymentType,bank,account,owner,accountType};
  if(old){assert_(old.group===group,'Không chuyển nhóm mục đã lưu.');Object.assign(old,{name,unit,method,price,active:payload.active!==false,order:Number.isInteger(Number(payload.order))&&Number(payload.order)>0?Number(payload.order):old.order},extra);}
  else items.push(Object.assign({id:'DM-'+Utilities.getUuid(),group,name,unit,method,price,active:true,order:items.filter(x=>x.group===group).length+1},extra));
  assert_(items.length<=500,'Danh mục tối đa 500 mục.');
  metaSet_(ss,'catalogs28',{items});return {message:'Đã lưu danh mục.',state:snapshot_(ss)};
});}

const DEMO27_={"settings":[{"id":"Loại dữ liệu","value":"Toàn bộ 30 dòng/tab là giả lập để trải nghiệm."},{"id":"Phạm vi mẫu","value":"30 cơ sở, mỗi cơ sở 1 phòng đại diện; 30 khách và hợp đồng."},{"id":"Kỳ hóa đơn","value":"09/2026–11/2026; mỗi kỳ 10 hóa đơn mẫu."},{"id":"Tiền tệ","value":"VND; nhập số, không gõ chữ đ."},{"id":"Kỳ tháng","value":"Ngày đầu tháng; định dạng mm/yyyy."},{"id":"Ngày tháng","value":"Nhập ngày theo dd/mm/yyyy."},{"id":"Mã khu","value":"K001–K030, không trùng."},{"id":"Mã phòng","value":"P001–P030, không trùng."},{"id":"Mã khách","value":"KH001–KH030, không trùng."},{"id":"Mã hợp đồng","value":"HD001–HD030, không trùng."},{"id":"Mã hóa đơn","value":"INV001–INV030; một mã duy nhất cho mỗi hóa đơn."},{"id":"Điện mẫu","value":3500},{"id":"Nước mẫu","value":20000},{"id":"Rác / phòng / tháng","value":30000},{"id":"Wifi / phòng / tháng","value":70000},{"id":"Giữ xe / xe / tháng","value":100000},{"id":"Dịch vụ khác","value":"Vệ sinh bổ sung: 50.000 đồng khi có phát sinh."},{"id":"Giảm giá","value":"Số âm ở cột Điều chỉnh; không sửa tổng tiền."},{"id":"Thu tiền","value":"Chọn đúng loại Thanh toán hóa đơn và mã hóa đơn."},{"id":"Đóng nhiều lần","value":"Mỗi lần một dòng; cùng mã hóa đơn, khác mã phiếu thu."},{"id":"Đóng dư","value":"Hiển thị riêng; chưa tự chuyển sang kỳ sau."},{"id":"Nợ cũ","value":"Giữ tại hóa đơn cũ; không cộng lại vào hóa đơn mới."},{"id":"Chỉ số điện nước","value":"Mẫu ghi điện; nước trên hóa đơn là số đã chốt."},{"id":"Chốt hóa đơn","value":"Nhập số tiền theo thỏa thuận, kiểm tra điện nước trước khi chốt."},{"id":"Tiền cọc","value":"Loại thu Nhận cọc; loại chi Hoàn cọc; không tính vào lợi nhuận."},{"id":"Chi phí vận hành","value":"Chọn Có ở Tính vào lợi nhuận."},{"id":"Mua tài sản","value":"Chọn Không; phần phân bổ từng kỳ ghi riêng nếu cần."},{"id":"Lợi nhuận quản trị","value":"Doanh thu hóa đơn trừ chi phí đánh dấu Có theo kỳ."},{"id":"Dòng tiền","value":"Thực thu trừ thực chi; không phải số dư tài khoản."},{"id":"Vùng công thức","value":"Dòng 6–105 ở tab theo dõi; báo cáo tổng hợp cùng vùng. Đừng xóa công thức."}],"sites":[{"id":"K001","name":"Nhà trọ An Nhiên 01","address":"11 Đường Mẫu 1, TP.HCM","manager":"Quản lý An","note":"Giả lập · 1 phòng đại diện/cơ sở"},{"id":"K002","name":"Nhà trọ An Nhiên 02","address":"12 Đường Mẫu 2, TP.HCM","manager":"Quản lý Linh","note":"Giả lập · 1 phòng đại diện/cơ sở"},{"id":"K003","name":"Nhà trọ An Nhiên 03","address":"13 Đường Mẫu 3, TP.HCM","manager":"Quản lý Mai","note":"Giả lập · 1 phòng đại diện/cơ sở"},{"id":"K004","name":"Nhà trọ An Nhiên 04","address":"14 Đường Mẫu 4, TP.HCM","manager":"Quản lý An","note":"Giả lập · 1 phòng đại diện/cơ sở"},{"id":"K005","name":"Nhà trọ An Nhiên 05","address":"15 Đường Mẫu 5, TP.HCM","manager":"Quản lý Linh","note":"Giả lập · 1 phòng đại diện/cơ sở"},{"id":"K006","name":"Nhà trọ An Nhiên 06","address":"16 Đường Mẫu 6, TP.HCM","manager":"Quản lý Mai","note":"Giả lập · 1 phòng đại diện/cơ sở"},{"id":"K007","name":"Nhà trọ An Nhiên 07","address":"17 Đường Mẫu 7, TP.HCM","manager":"Quản lý An","note":"Giả lập · 1 phòng đại diện/cơ sở"},{"id":"K008","name":"Nhà trọ An Nhiên 08","address":"18 Đường Mẫu 8, TP.HCM","manager":"Quản lý Linh","note":"Giả lập · 1 phòng đại diện/cơ sở"},{"id":"K009","name":"Nhà trọ An Nhiên 09","address":"19 Đường Mẫu 9, TP.HCM","manager":"Quản lý Mai","note":"Giả lập · 1 phòng đại diện/cơ sở"},{"id":"K010","name":"Nhà trọ An Nhiên 10","address":"20 Đường Mẫu 10, TP.HCM","manager":"Quản lý An","note":"Giả lập · 1 phòng đại diện/cơ sở"},{"id":"K011","name":"Nhà trọ An Nhiên 11","address":"21 Đường Mẫu 11, TP.HCM","manager":"Quản lý Linh","note":"Giả lập · 1 phòng đại diện/cơ sở"},{"id":"K012","name":"Nhà trọ An Nhiên 12","address":"22 Đường Mẫu 12, TP.HCM","manager":"Quản lý Mai","note":"Giả lập · 1 phòng đại diện/cơ sở"},{"id":"K013","name":"Nhà trọ An Nhiên 13","address":"23 Đường Mẫu 13, TP.HCM","manager":"Quản lý An","note":"Giả lập · 1 phòng đại diện/cơ sở"},{"id":"K014","name":"Nhà trọ An Nhiên 14","address":"24 Đường Mẫu 14, TP.HCM","manager":"Quản lý Linh","note":"Giả lập · 1 phòng đại diện/cơ sở"},{"id":"K015","name":"Nhà trọ An Nhiên 15","address":"25 Đường Mẫu 15, TP.HCM","manager":"Quản lý Mai","note":"Giả lập · 1 phòng đại diện/cơ sở"},{"id":"K016","name":"Nhà trọ An Nhiên 16","address":"26 Đường Mẫu 16, TP.HCM","manager":"Quản lý An","note":"Giả lập · 1 phòng đại diện/cơ sở"},{"id":"K017","name":"Nhà trọ An Nhiên 17","address":"27 Đường Mẫu 17, TP.HCM","manager":"Quản lý Linh","note":"Giả lập · 1 phòng đại diện/cơ sở"},{"id":"K018","name":"Nhà trọ An Nhiên 18","address":"28 Đường Mẫu 18, TP.HCM","manager":"Quản lý Mai","note":"Giả lập · 1 phòng đại diện/cơ sở"},{"id":"K019","name":"Nhà trọ An Nhiên 19","address":"29 Đường Mẫu 19, TP.HCM","manager":"Quản lý An","note":"Giả lập · 1 phòng đại diện/cơ sở"},{"id":"K020","name":"Nhà trọ An Nhiên 20","address":"30 Đường Mẫu 20, TP.HCM","manager":"Quản lý Linh","note":"Giả lập · 1 phòng đại diện/cơ sở"},{"id":"K021","name":"Nhà trọ An Nhiên 21","address":"31 Đường Mẫu 21, TP.HCM","manager":"Quản lý Mai","note":"Giả lập · 1 phòng đại diện/cơ sở"},{"id":"K022","name":"Nhà trọ An Nhiên 22","address":"32 Đường Mẫu 22, TP.HCM","manager":"Quản lý An","note":"Giả lập · 1 phòng đại diện/cơ sở"},{"id":"K023","name":"Nhà trọ An Nhiên 23","address":"33 Đường Mẫu 23, TP.HCM","manager":"Quản lý Linh","note":"Giả lập · 1 phòng đại diện/cơ sở"},{"id":"K024","name":"Nhà trọ An Nhiên 24","address":"34 Đường Mẫu 24, TP.HCM","manager":"Quản lý Mai","note":"Giả lập · 1 phòng đại diện/cơ sở"},{"id":"K025","name":"Nhà trọ An Nhiên 25","address":"35 Đường Mẫu 25, TP.HCM","manager":"Quản lý An","note":"Giả lập · 1 phòng đại diện/cơ sở"},{"id":"K026","name":"Nhà trọ An Nhiên 26","address":"36 Đường Mẫu 26, TP.HCM","manager":"Quản lý Linh","note":"Giả lập · 1 phòng đại diện/cơ sở"},{"id":"K027","name":"Nhà trọ An Nhiên 27","address":"37 Đường Mẫu 27, TP.HCM","manager":"Quản lý Mai","note":"Giả lập · 1 phòng đại diện/cơ sở"},{"id":"K028","name":"Nhà trọ An Nhiên 28","address":"38 Đường Mẫu 28, TP.HCM","manager":"Quản lý An","note":"Giả lập · 1 phòng đại diện/cơ sở"},{"id":"K029","name":"Nhà trọ An Nhiên 29","address":"39 Đường Mẫu 29, TP.HCM","manager":"Quản lý Linh","note":"Giả lập · 1 phòng đại diện/cơ sở"},{"id":"K030","name":"Nhà trọ An Nhiên 30","address":"40 Đường Mẫu 30, TP.HCM","manager":"Quản lý Mai","note":"Giả lập · 1 phòng đại diện/cơ sở"}],"rooms":[{"id":"P001","site":"K001","name":"Phòng 101","floor":2,"area":19,"rent":2600000,"status":"Đang thuê","note":"Phòng mẫu có cửa sổ"},{"id":"P002","site":"K002","name":"Phòng 102","floor":3,"area":20,"rent":2800000,"status":"Đang thuê","note":"Phòng mẫu có cửa sổ"},{"id":"P003","site":"K003","name":"Phòng 103","floor":1,"area":21,"rent":3000000,"status":"Đang thuê","note":"Phòng mẫu có cửa sổ"},{"id":"P004","site":"K004","name":"Phòng 104","floor":2,"area":22,"rent":3200000,"status":"Đang thuê","note":"Phòng mẫu có cửa sổ"},{"id":"P005","site":"K005","name":"Phòng 105","floor":3,"area":23,"rent":2400000,"status":"Đang thuê","note":"Phòng mẫu có cửa sổ"},{"id":"P006","site":"K006","name":"Phòng 106","floor":1,"area":24,"rent":2600000,"status":"Đang thuê","note":"Phòng mẫu có cửa sổ"},{"id":"P007","site":"K007","name":"Phòng 107","floor":2,"area":25,"rent":2800000,"status":"Đang thuê","note":"Phòng mẫu có cửa sổ"},{"id":"P008","site":"K008","name":"Phòng 108","floor":3,"area":26,"rent":3000000,"status":"Đang thuê","note":"Phòng mẫu có cửa sổ"},{"id":"P009","site":"K009","name":"Phòng 109","floor":1,"area":18,"rent":3200000,"status":"Đang thuê","note":"Phòng mẫu có cửa sổ"},{"id":"P010","site":"K010","name":"Phòng 110","floor":2,"area":19,"rent":2400000,"status":"Đang thuê","note":"Phòng mẫu có cửa sổ"},{"id":"P011","site":"K011","name":"Phòng 111","floor":3,"area":20,"rent":2600000,"status":"Đang thuê","note":"Phòng mẫu có cửa sổ"},{"id":"P012","site":"K012","name":"Phòng 112","floor":1,"area":21,"rent":2800000,"status":"Đang thuê","note":"Phòng mẫu có cửa sổ"},{"id":"P013","site":"K013","name":"Phòng 113","floor":2,"area":22,"rent":3000000,"status":"Đang thuê","note":"Phòng mẫu có cửa sổ"},{"id":"P014","site":"K014","name":"Phòng 114","floor":3,"area":23,"rent":3200000,"status":"Đang thuê","note":"Phòng mẫu có cửa sổ"},{"id":"P015","site":"K015","name":"Phòng 115","floor":1,"area":24,"rent":2400000,"status":"Đang thuê","note":"Phòng mẫu có cửa sổ"},{"id":"P016","site":"K016","name":"Phòng 116","floor":2,"area":25,"rent":2600000,"status":"Đang thuê","note":"Phòng mẫu có cửa sổ"},{"id":"P017","site":"K017","name":"Phòng 117","floor":3,"area":26,"rent":2800000,"status":"Đang thuê","note":"Phòng mẫu có cửa sổ"},{"id":"P018","site":"K018","name":"Phòng 118","floor":1,"area":18,"rent":3000000,"status":"Đang thuê","note":"Phòng mẫu có cửa sổ"},{"id":"P019","site":"K019","name":"Phòng 119","floor":2,"area":19,"rent":3200000,"status":"Đang thuê","note":"Phòng mẫu có cửa sổ"},{"id":"P020","site":"K020","name":"Phòng 120","floor":3,"area":20,"rent":2400000,"status":"Đang thuê","note":"Phòng mẫu có cửa sổ"},{"id":"P021","site":"K021","name":"Phòng 121","floor":1,"area":21,"rent":2600000,"status":"Đang thuê","note":"Phòng mẫu có cửa sổ"},{"id":"P022","site":"K022","name":"Phòng 122","floor":2,"area":22,"rent":2800000,"status":"Đang thuê","note":"Phòng mẫu có cửa sổ"},{"id":"P023","site":"K023","name":"Phòng 123","floor":3,"area":23,"rent":3000000,"status":"Đang thuê","note":"Phòng mẫu có cửa sổ"},{"id":"P024","site":"K024","name":"Phòng 124","floor":1,"area":24,"rent":3200000,"status":"Đang thuê","note":"Phòng mẫu có cửa sổ"},{"id":"P025","site":"K025","name":"Phòng 125","floor":2,"area":25,"rent":2400000,"status":"Đang thuê","note":"Phòng mẫu có cửa sổ"},{"id":"P026","site":"K026","name":"Phòng 126","floor":3,"area":26,"rent":2600000,"status":"Đang thuê","note":"Phòng mẫu có cửa sổ"},{"id":"P027","site":"K027","name":"Phòng 127","floor":1,"area":18,"rent":2800000,"status":"Đang thuê","note":"Phòng mẫu có cửa sổ"},{"id":"P028","site":"K028","name":"Phòng 128","floor":2,"area":19,"rent":3000000,"status":"Đang thuê","note":"Phòng mẫu có cửa sổ"},{"id":"P029","site":"K029","name":"Phòng 129","floor":3,"area":20,"rent":3200000,"status":"Đang thuê","note":"Phòng mẫu có cửa sổ"},{"id":"P030","site":"K030","name":"Phòng 130","floor":1,"area":21,"rent":2400000,"status":"Đang thuê","note":"Phòng mẫu có cửa sổ"}],"tenants":[{"id":"KH001","name":"Nguyễn Minh Anh","phone":"09xx xxx 001","document":"DEMO-001","note":"Thông tin giả lập"},{"id":"KH002","name":"Trần Hoàng Nam","phone":"09xx xxx 002","document":"DEMO-002","note":"Thông tin giả lập"},{"id":"KH003","name":"Lê Thu Hà","phone":"09xx xxx 003","document":"DEMO-003","note":"Thông tin giả lập"},{"id":"KH004","name":"Phạm Quốc Bảo","phone":"09xx xxx 004","document":"DEMO-004","note":"Thông tin giả lập"},{"id":"KH005","name":"Võ Ngọc Mai","phone":"09xx xxx 005","document":"DEMO-005","note":"Thông tin giả lập"},{"id":"KH006","name":"Đặng Tuấn Kiệt","phone":"09xx xxx 006","document":"DEMO-006","note":"Thông tin giả lập"},{"id":"KH007","name":"Bùi Khánh Linh","phone":"09xx xxx 007","document":"DEMO-007","note":"Thông tin giả lập"},{"id":"KH008","name":"Đỗ Gia Huy","phone":"09xx xxx 008","document":"DEMO-008","note":"Thông tin giả lập"},{"id":"KH009","name":"Hồ Phương Thảo","phone":"09xx xxx 009","document":"DEMO-009","note":"Thông tin giả lập"},{"id":"KH010","name":"Dương Đức Minh","phone":"09xx xxx 010","document":"DEMO-010","note":"Thông tin giả lập"},{"id":"KH011","name":"Ngô Thanh Trúc","phone":"09xx xxx 011","document":"DEMO-011","note":"Thông tin giả lập"},{"id":"KH012","name":"Vũ Hải Đăng","phone":"09xx xxx 012","document":"DEMO-012","note":"Thông tin giả lập"},{"id":"KH013","name":"Huỳnh Bảo Ngọc","phone":"09xx xxx 013","document":"DEMO-013","note":"Thông tin giả lập"},{"id":"KH014","name":"Phan Minh Khang","phone":"09xx xxx 014","document":"DEMO-014","note":"Thông tin giả lập"},{"id":"KH015","name":"Trương Quỳnh Như","phone":"09xx xxx 015","document":"DEMO-015","note":"Thông tin giả lập"},{"id":"KH016","name":"Đinh Anh Tú","phone":"09xx xxx 016","document":"DEMO-016","note":"Thông tin giả lập"},{"id":"KH017","name":"Mai Thảo Vy","phone":"09xx xxx 017","document":"DEMO-017","note":"Thông tin giả lập"},{"id":"KH018","name":"Cao Nhật Minh","phone":"09xx xxx 018","document":"DEMO-018","note":"Thông tin giả lập"},{"id":"KH019","name":"Tạ Hoài An","phone":"09xx xxx 019","document":"DEMO-019","note":"Thông tin giả lập"},{"id":"KH020","name":"Lý Quốc Hưng","phone":"09xx xxx 020","document":"DEMO-020","note":"Thông tin giả lập"},{"id":"KH021","name":"Nguyễn Hải Yến","phone":"09xx xxx 021","document":"DEMO-021","note":"Thông tin giả lập"},{"id":"KH022","name":"Trần Khánh Duy","phone":"09xx xxx 022","document":"DEMO-022","note":"Thông tin giả lập"},{"id":"KH023","name":"Lê Mỹ Duyên","phone":"09xx xxx 023","document":"DEMO-023","note":"Thông tin giả lập"},{"id":"KH024","name":"Phạm Thành Đạt","phone":"09xx xxx 024","document":"DEMO-024","note":"Thông tin giả lập"},{"id":"KH025","name":"Võ Như Quỳnh","phone":"09xx xxx 025","document":"DEMO-025","note":"Thông tin giả lập"},{"id":"KH026","name":"Đặng Minh Quân","phone":"09xx xxx 026","document":"DEMO-026","note":"Thông tin giả lập"},{"id":"KH027","name":"Bùi Ngọc Hân","phone":"09xx xxx 027","document":"DEMO-027","note":"Thông tin giả lập"},{"id":"KH028","name":"Đỗ Tuấn Anh","phone":"09xx xxx 028","document":"DEMO-028","note":"Thông tin giả lập"},{"id":"KH029","name":"Hồ Thanh Tâm","phone":"09xx xxx 029","document":"DEMO-029","note":"Thông tin giả lập"},{"id":"KH030","name":"Dương Bảo Châu","phone":"09xx xxx 030","document":"DEMO-030","note":"Thông tin giả lập"}],"contracts":[{"id":"HD001","room":"P001","tenant":"KH001","start":"2026-01-01","end":"2026-12-31","rent":2600000,"deposit":2600000,"dueDay":5,"status":"Đang hiệu lực","note":"Hợp đồng giả lập · 1 người đại diện"},{"id":"HD002","room":"P002","tenant":"KH002","start":"2026-01-01","end":"2026-12-31","rent":2800000,"deposit":2800000,"dueDay":5,"status":"Đang hiệu lực","note":"Hợp đồng giả lập · 1 người đại diện"},{"id":"HD003","room":"P003","tenant":"KH003","start":"2026-01-01","end":"2026-12-31","rent":3000000,"deposit":3000000,"dueDay":5,"status":"Đang hiệu lực","note":"Hợp đồng giả lập · 1 người đại diện"},{"id":"HD004","room":"P004","tenant":"KH004","start":"2026-01-01","end":"2026-12-31","rent":3200000,"deposit":3200000,"dueDay":5,"status":"Đang hiệu lực","note":"Hợp đồng giả lập · 1 người đại diện"},{"id":"HD005","room":"P005","tenant":"KH005","start":"2026-01-01","end":"2026-12-31","rent":2400000,"deposit":2400000,"dueDay":5,"status":"Đang hiệu lực","note":"Hợp đồng giả lập · 1 người đại diện"},{"id":"HD006","room":"P006","tenant":"KH006","start":"2026-01-01","end":"2026-12-31","rent":2600000,"deposit":2600000,"dueDay":5,"status":"Đang hiệu lực","note":"Hợp đồng giả lập · 1 người đại diện"},{"id":"HD007","room":"P007","tenant":"KH007","start":"2026-01-01","end":"2026-12-31","rent":2800000,"deposit":2800000,"dueDay":5,"status":"Đang hiệu lực","note":"Hợp đồng giả lập · 1 người đại diện"},{"id":"HD008","room":"P008","tenant":"KH008","start":"2026-01-01","end":"2026-12-31","rent":3000000,"deposit":3000000,"dueDay":5,"status":"Đang hiệu lực","note":"Hợp đồng giả lập · 1 người đại diện"},{"id":"HD009","room":"P009","tenant":"KH009","start":"2026-01-01","end":"2026-12-31","rent":3200000,"deposit":3200000,"dueDay":5,"status":"Đang hiệu lực","note":"Hợp đồng giả lập · 1 người đại diện"},{"id":"HD010","room":"P010","tenant":"KH010","start":"2026-01-01","end":"2026-12-31","rent":2400000,"deposit":2400000,"dueDay":5,"status":"Đang hiệu lực","note":"Hợp đồng giả lập · 1 người đại diện"},{"id":"HD011","room":"P011","tenant":"KH011","start":"2026-01-01","end":"2026-12-31","rent":2600000,"deposit":2600000,"dueDay":5,"status":"Đang hiệu lực","note":"Hợp đồng giả lập · 1 người đại diện"},{"id":"HD012","room":"P012","tenant":"KH012","start":"2026-01-01","end":"2026-12-31","rent":2800000,"deposit":2800000,"dueDay":5,"status":"Đang hiệu lực","note":"Hợp đồng giả lập · 1 người đại diện"},{"id":"HD013","room":"P013","tenant":"KH013","start":"2026-01-01","end":"2026-12-31","rent":3000000,"deposit":3000000,"dueDay":5,"status":"Đang hiệu lực","note":"Hợp đồng giả lập · 1 người đại diện"},{"id":"HD014","room":"P014","tenant":"KH014","start":"2026-01-01","end":"2026-12-31","rent":3200000,"deposit":3200000,"dueDay":5,"status":"Đang hiệu lực","note":"Hợp đồng giả lập · 1 người đại diện"},{"id":"HD015","room":"P015","tenant":"KH015","start":"2026-01-01","end":"2026-12-31","rent":2400000,"deposit":2400000,"dueDay":5,"status":"Đang hiệu lực","note":"Hợp đồng giả lập · 1 người đại diện"},{"id":"HD016","room":"P016","tenant":"KH016","start":"2026-01-01","end":"2026-12-31","rent":2600000,"deposit":2600000,"dueDay":5,"status":"Đang hiệu lực","note":"Hợp đồng giả lập · 1 người đại diện"},{"id":"HD017","room":"P017","tenant":"KH017","start":"2026-01-01","end":"2026-12-31","rent":2800000,"deposit":2800000,"dueDay":5,"status":"Đang hiệu lực","note":"Hợp đồng giả lập · 1 người đại diện"},{"id":"HD018","room":"P018","tenant":"KH018","start":"2026-01-01","end":"2026-12-31","rent":3000000,"deposit":3000000,"dueDay":5,"status":"Đang hiệu lực","note":"Hợp đồng giả lập · 1 người đại diện"},{"id":"HD019","room":"P019","tenant":"KH019","start":"2026-01-01","end":"2026-12-31","rent":3200000,"deposit":3200000,"dueDay":5,"status":"Đang hiệu lực","note":"Hợp đồng giả lập · 1 người đại diện"},{"id":"HD020","room":"P020","tenant":"KH020","start":"2026-01-01","end":"2026-12-31","rent":2400000,"deposit":2400000,"dueDay":5,"status":"Đang hiệu lực","note":"Hợp đồng giả lập · 1 người đại diện"},{"id":"HD021","room":"P021","tenant":"KH021","start":"2026-01-01","end":"2026-12-31","rent":2600000,"deposit":2600000,"dueDay":5,"status":"Đang hiệu lực","note":"Hợp đồng giả lập · 1 người đại diện"},{"id":"HD022","room":"P022","tenant":"KH022","start":"2026-01-01","end":"2026-12-31","rent":2800000,"deposit":2800000,"dueDay":5,"status":"Đang hiệu lực","note":"Hợp đồng giả lập · 1 người đại diện"},{"id":"HD023","room":"P023","tenant":"KH023","start":"2026-01-01","end":"2026-12-31","rent":3000000,"deposit":3000000,"dueDay":5,"status":"Đang hiệu lực","note":"Hợp đồng giả lập · 1 người đại diện"},{"id":"HD024","room":"P024","tenant":"KH024","start":"2026-01-01","end":"2026-12-31","rent":3200000,"deposit":3200000,"dueDay":5,"status":"Đang hiệu lực","note":"Hợp đồng giả lập · 1 người đại diện"},{"id":"HD025","room":"P025","tenant":"KH025","start":"2026-01-01","end":"2026-12-31","rent":2400000,"deposit":2400000,"dueDay":5,"status":"Đang hiệu lực","note":"Hợp đồng giả lập · 1 người đại diện"},{"id":"HD026","room":"P026","tenant":"KH026","start":"2026-01-01","end":"2026-12-31","rent":2600000,"deposit":2600000,"dueDay":5,"status":"Đang hiệu lực","note":"Hợp đồng giả lập · 1 người đại diện"},{"id":"HD027","room":"P027","tenant":"KH027","start":"2026-01-01","end":"2026-12-31","rent":2800000,"deposit":2800000,"dueDay":5,"status":"Đang hiệu lực","note":"Hợp đồng giả lập · 1 người đại diện"},{"id":"HD028","room":"P028","tenant":"KH028","start":"2026-01-01","end":"2026-12-31","rent":3000000,"deposit":3000000,"dueDay":5,"status":"Đang hiệu lực","note":"Hợp đồng giả lập · 1 người đại diện"},{"id":"HD029","room":"P029","tenant":"KH029","start":"2026-01-01","end":"2026-12-31","rent":3200000,"deposit":3200000,"dueDay":5,"status":"Đang hiệu lực","note":"Hợp đồng giả lập · 1 người đại diện"},{"id":"HD030","room":"P030","tenant":"KH030","start":"2026-01-01","end":"2026-12-31","rent":2400000,"deposit":2400000,"dueDay":5,"status":"Đang hiệu lực","note":"Hợp đồng giả lập · 1 người đại diện"}],"services":[{"contract":"HD001","name":"Điện","method":"Theo kWh","price":3500,"quantity":1,"start":"2026-01-01","end":"2026-12-31","note":"Nước 20.000/m³; rác 30.000; wifi 70.000; xe 100.000/xe/tháng"},{"contract":"HD002","name":"Điện","method":"Theo kWh","price":3500,"quantity":1,"start":"2026-01-01","end":"2026-12-31","note":"Nước 20.000/m³; rác 30.000; wifi 70.000; xe 100.000/xe/tháng"},{"contract":"HD003","name":"Điện","method":"Theo kWh","price":3500,"quantity":1,"start":"2026-01-01","end":"2026-12-31","note":"Nước 20.000/m³; rác 30.000; wifi 70.000; xe 100.000/xe/tháng"},{"contract":"HD004","name":"Điện","method":"Theo kWh","price":3500,"quantity":1,"start":"2026-01-01","end":"2026-12-31","note":"Nước 20.000/m³; rác 30.000; wifi 70.000; xe 100.000/xe/tháng"},{"contract":"HD005","name":"Điện","method":"Theo kWh","price":3500,"quantity":1,"start":"2026-01-01","end":"2026-12-31","note":"Nước 20.000/m³; rác 30.000; wifi 70.000; xe 100.000/xe/tháng"},{"contract":"HD006","name":"Điện","method":"Theo kWh","price":3500,"quantity":1,"start":"2026-01-01","end":"2026-12-31","note":"Nước 20.000/m³; rác 30.000; wifi 70.000; xe 100.000/xe/tháng"},{"contract":"HD007","name":"Điện","method":"Theo kWh","price":3500,"quantity":1,"start":"2026-01-01","end":"2026-12-31","note":"Nước 20.000/m³; rác 30.000; wifi 70.000; xe 100.000/xe/tháng"},{"contract":"HD008","name":"Điện","method":"Theo kWh","price":3500,"quantity":1,"start":"2026-01-01","end":"2026-12-31","note":"Nước 20.000/m³; rác 30.000; wifi 70.000; xe 100.000/xe/tháng"},{"contract":"HD009","name":"Điện","method":"Theo kWh","price":3500,"quantity":1,"start":"2026-01-01","end":"2026-12-31","note":"Nước 20.000/m³; rác 30.000; wifi 70.000; xe 100.000/xe/tháng"},{"contract":"HD010","name":"Điện","method":"Theo kWh","price":3500,"quantity":1,"start":"2026-01-01","end":"2026-12-31","note":"Nước 20.000/m³; rác 30.000; wifi 70.000; xe 100.000/xe/tháng"},{"contract":"HD011","name":"Điện","method":"Theo kWh","price":3500,"quantity":1,"start":"2026-01-01","end":"2026-12-31","note":"Nước 20.000/m³; rác 30.000; wifi 70.000; xe 100.000/xe/tháng"},{"contract":"HD012","name":"Điện","method":"Theo kWh","price":3500,"quantity":1,"start":"2026-01-01","end":"2026-12-31","note":"Nước 20.000/m³; rác 30.000; wifi 70.000; xe 100.000/xe/tháng"},{"contract":"HD013","name":"Điện","method":"Theo kWh","price":3500,"quantity":1,"start":"2026-01-01","end":"2026-12-31","note":"Nước 20.000/m³; rác 30.000; wifi 70.000; xe 100.000/xe/tháng"},{"contract":"HD014","name":"Điện","method":"Theo kWh","price":3500,"quantity":1,"start":"2026-01-01","end":"2026-12-31","note":"Nước 20.000/m³; rác 30.000; wifi 70.000; xe 100.000/xe/tháng"},{"contract":"HD015","name":"Điện","method":"Theo kWh","price":3500,"quantity":1,"start":"2026-01-01","end":"2026-12-31","note":"Nước 20.000/m³; rác 30.000; wifi 70.000; xe 100.000/xe/tháng"},{"contract":"HD016","name":"Điện","method":"Theo kWh","price":3500,"quantity":1,"start":"2026-01-01","end":"2026-12-31","note":"Nước 20.000/m³; rác 30.000; wifi 70.000; xe 100.000/xe/tháng"},{"contract":"HD017","name":"Điện","method":"Theo kWh","price":3500,"quantity":1,"start":"2026-01-01","end":"2026-12-31","note":"Nước 20.000/m³; rác 30.000; wifi 70.000; xe 100.000/xe/tháng"},{"contract":"HD018","name":"Điện","method":"Theo kWh","price":3500,"quantity":1,"start":"2026-01-01","end":"2026-12-31","note":"Nước 20.000/m³; rác 30.000; wifi 70.000; xe 100.000/xe/tháng"},{"contract":"HD019","name":"Điện","method":"Theo kWh","price":3500,"quantity":1,"start":"2026-01-01","end":"2026-12-31","note":"Nước 20.000/m³; rác 30.000; wifi 70.000; xe 100.000/xe/tháng"},{"contract":"HD020","name":"Điện","method":"Theo kWh","price":3500,"quantity":1,"start":"2026-01-01","end":"2026-12-31","note":"Nước 20.000/m³; rác 30.000; wifi 70.000; xe 100.000/xe/tháng"},{"contract":"HD021","name":"Điện","method":"Theo kWh","price":3500,"quantity":1,"start":"2026-01-01","end":"2026-12-31","note":"Nước 20.000/m³; rác 30.000; wifi 70.000; xe 100.000/xe/tháng"},{"contract":"HD022","name":"Điện","method":"Theo kWh","price":3500,"quantity":1,"start":"2026-01-01","end":"2026-12-31","note":"Nước 20.000/m³; rác 30.000; wifi 70.000; xe 100.000/xe/tháng"},{"contract":"HD023","name":"Điện","method":"Theo kWh","price":3500,"quantity":1,"start":"2026-01-01","end":"2026-12-31","note":"Nước 20.000/m³; rác 30.000; wifi 70.000; xe 100.000/xe/tháng"},{"contract":"HD024","name":"Điện","method":"Theo kWh","price":3500,"quantity":1,"start":"2026-01-01","end":"2026-12-31","note":"Nước 20.000/m³; rác 30.000; wifi 70.000; xe 100.000/xe/tháng"},{"contract":"HD025","name":"Điện","method":"Theo kWh","price":3500,"quantity":1,"start":"2026-01-01","end":"2026-12-31","note":"Nước 20.000/m³; rác 30.000; wifi 70.000; xe 100.000/xe/tháng"},{"contract":"HD026","name":"Điện","method":"Theo kWh","price":3500,"quantity":1,"start":"2026-01-01","end":"2026-12-31","note":"Nước 20.000/m³; rác 30.000; wifi 70.000; xe 100.000/xe/tháng"},{"contract":"HD027","name":"Điện","method":"Theo kWh","price":3500,"quantity":1,"start":"2026-01-01","end":"2026-12-31","note":"Nước 20.000/m³; rác 30.000; wifi 70.000; xe 100.000/xe/tháng"},{"contract":"HD028","name":"Điện","method":"Theo kWh","price":3500,"quantity":1,"start":"2026-01-01","end":"2026-12-31","note":"Nước 20.000/m³; rác 30.000; wifi 70.000; xe 100.000/xe/tháng"},{"contract":"HD029","name":"Điện","method":"Theo kWh","price":3500,"quantity":1,"start":"2026-01-01","end":"2026-12-31","note":"Nước 20.000/m³; rác 30.000; wifi 70.000; xe 100.000/xe/tháng"},{"contract":"HD030","name":"Điện","method":"Theo kWh","price":3500,"quantity":1,"start":"2026-01-01","end":"2026-12-31","note":"Nước 20.000/m³; rác 30.000; wifi 70.000; xe 100.000/xe/tháng"}],"meters":[{"id":"CS001","month":"2026-09","room":"P001","type":"Điện","date":"2026-09-01","previous":1020,"current":1083,"price":3500,"note":"Chỉ số điện mẫu; nước chốt trong hóa đơn"},{"id":"CS002","month":"2026-09","room":"P002","type":"Điện","date":"2026-09-01","previous":1040,"current":1116,"price":3500,"note":"Chỉ số điện mẫu; nước chốt trong hóa đơn"},{"id":"CS003","month":"2026-09","room":"P003","type":"Điện","date":"2026-09-01","previous":1060,"current":1149,"price":3500,"note":"Chỉ số điện mẫu; nước chốt trong hóa đơn"},{"id":"CS004","month":"2026-09","room":"P004","type":"Điện","date":"2026-09-01","previous":1080,"current":1182,"price":3500,"note":"Chỉ số điện mẫu; nước chốt trong hóa đơn"},{"id":"CS005","month":"2026-09","room":"P005","type":"Điện","date":"2026-09-01","previous":1100,"current":1215,"price":3500,"note":"Chỉ số điện mẫu; nước chốt trong hóa đơn"},{"id":"CS006","month":"2026-09","room":"P006","type":"Điện","date":"2026-09-01","previous":1120,"current":1248,"price":3500,"note":"Chỉ số điện mẫu; nước chốt trong hóa đơn"},{"id":"CS007","month":"2026-09","room":"P007","type":"Điện","date":"2026-09-01","previous":1140,"current":1281,"price":3500,"note":"Chỉ số điện mẫu; nước chốt trong hóa đơn"},{"id":"CS008","month":"2026-09","room":"P008","type":"Điện","date":"2026-09-01","previous":1160,"current":1214,"price":3500,"note":"Chỉ số điện mẫu; nước chốt trong hóa đơn"},{"id":"CS009","month":"2026-09","room":"P009","type":"Điện","date":"2026-09-01","previous":1180,"current":1247,"price":3500,"note":"Chỉ số điện mẫu; nước chốt trong hóa đơn"},{"id":"CS010","month":"2026-09","room":"P010","type":"Điện","date":"2026-09-01","previous":1200,"current":1280,"price":3500,"note":"Chỉ số điện mẫu; nước chốt trong hóa đơn"},{"id":"CS011","month":"2026-10","room":"P011","type":"Điện","date":"2026-10-01","previous":1220,"current":1313,"price":3500,"note":"Chỉ số điện mẫu; nước chốt trong hóa đơn"},{"id":"CS012","month":"2026-10","room":"P012","type":"Điện","date":"2026-10-01","previous":1240,"current":1346,"price":3500,"note":"Chỉ số điện mẫu; nước chốt trong hóa đơn"},{"id":"CS013","month":"2026-10","room":"P013","type":"Điện","date":"2026-10-01","previous":1260,"current":1379,"price":3500,"note":"Chỉ số điện mẫu; nước chốt trong hóa đơn"},{"id":"CS014","month":"2026-10","room":"P014","type":"Điện","date":"2026-10-01","previous":1280,"current":1412,"price":3500,"note":"Chỉ số điện mẫu; nước chốt trong hóa đơn"},{"id":"CS015","month":"2026-10","room":"P015","type":"Điện","date":"2026-10-01","previous":1300,"current":1445,"price":3500,"note":"Chỉ số điện mẫu; nước chốt trong hóa đơn"},{"id":"CS016","month":"2026-10","room":"P016","type":"Điện","date":"2026-10-01","previous":1320,"current":1378,"price":3500,"note":"Chỉ số điện mẫu; nước chốt trong hóa đơn"},{"id":"CS017","month":"2026-10","room":"P017","type":"Điện","date":"2026-10-01","previous":1340,"current":1411,"price":3500,"note":"Chỉ số điện mẫu; nước chốt trong hóa đơn"},{"id":"CS018","month":"2026-10","room":"P018","type":"Điện","date":"2026-10-01","previous":1360,"current":1444,"price":3500,"note":"Chỉ số điện mẫu; nước chốt trong hóa đơn"},{"id":"CS019","month":"2026-10","room":"P019","type":"Điện","date":"2026-10-01","previous":1380,"current":1477,"price":3500,"note":"Chỉ số điện mẫu; nước chốt trong hóa đơn"},{"id":"CS020","month":"2026-10","room":"P020","type":"Điện","date":"2026-10-01","previous":1400,"current":1510,"price":3500,"note":"Chỉ số điện mẫu; nước chốt trong hóa đơn"},{"id":"CS021","month":"2026-11","room":"P021","type":"Điện","date":"2026-11-01","previous":1420,"current":1543,"price":3500,"note":"Chỉ số điện mẫu; nước chốt trong hóa đơn"},{"id":"CS022","month":"2026-11","room":"P022","type":"Điện","date":"2026-11-01","previous":1440,"current":1576,"price":3500,"note":"Chỉ số điện mẫu; nước chốt trong hóa đơn"},{"id":"CS023","month":"2026-11","room":"P023","type":"Điện","date":"2026-11-01","previous":1460,"current":1609,"price":3500,"note":"Chỉ số điện mẫu; nước chốt trong hóa đơn"},{"id":"CS024","month":"2026-11","room":"P024","type":"Điện","date":"2026-11-01","previous":1480,"current":1542,"price":3500,"note":"Chỉ số điện mẫu; nước chốt trong hóa đơn"},{"id":"CS025","month":"2026-11","room":"P025","type":"Điện","date":"2026-11-01","previous":1500,"current":1575,"price":3500,"note":"Chỉ số điện mẫu; nước chốt trong hóa đơn"},{"id":"CS026","month":"2026-11","room":"P026","type":"Điện","date":"2026-11-01","previous":1520,"current":1608,"price":3500,"note":"Chỉ số điện mẫu; nước chốt trong hóa đơn"},{"id":"CS027","month":"2026-11","room":"P027","type":"Điện","date":"2026-11-01","previous":1540,"current":1641,"price":3500,"note":"Chỉ số điện mẫu; nước chốt trong hóa đơn"},{"id":"CS028","month":"2026-11","room":"P028","type":"Điện","date":"2026-11-01","previous":1560,"current":1674,"price":3500,"note":"Chỉ số điện mẫu; nước chốt trong hóa đơn"},{"id":"CS029","month":"2026-11","room":"P029","type":"Điện","date":"2026-11-01","previous":1580,"current":1707,"price":3500,"note":"Chỉ số điện mẫu; nước chốt trong hóa đơn"},{"id":"CS030","month":"2026-11","room":"P030","type":"Điện","date":"2026-11-01","previous":1600,"current":1740,"price":3500,"note":"Chỉ số điện mẫu; nước chốt trong hóa đơn"}],"invoices":[{"id":"INV001","month":"2026-09","site":"K001","room":"P001","tenant":"Nguyễn Minh Anh","due":"2026-09-05","rent":2600000,"electricity":220500,"water":60000,"trash":30000,"wifi":70000,"parking":100000,"other":0,"adjustment":0,"contract":"HD001","note":"Dữ liệu giả lập"},{"id":"INV002","month":"2026-09","site":"K002","room":"P002","tenant":"Trần Hoàng Nam","due":"2026-09-05","rent":2800000,"electricity":266000,"water":80000,"trash":30000,"wifi":70000,"parking":100000,"other":0,"adjustment":0,"contract":"HD002","note":"Dữ liệu giả lập"},{"id":"INV003","month":"2026-09","site":"K003","room":"P003","tenant":"Lê Thu Hà","due":"2026-09-05","rent":3000000,"electricity":311500,"water":100000,"trash":30000,"wifi":70000,"parking":0,"other":0,"adjustment":0,"contract":"HD003","note":"Dữ liệu giả lập"},{"id":"INV004","month":"2026-09","site":"K004","room":"P004","tenant":"Phạm Quốc Bảo","due":"2026-09-05","rent":3200000,"electricity":357000,"water":40000,"trash":30000,"wifi":70000,"parking":100000,"other":0,"adjustment":0,"contract":"HD004","note":"Dữ liệu giả lập"},{"id":"INV005","month":"2026-09","site":"K005","room":"P005","tenant":"Võ Ngọc Mai","due":"2026-09-05","rent":2400000,"electricity":402500,"water":60000,"trash":30000,"wifi":70000,"parking":100000,"other":0,"adjustment":0,"contract":"HD005","note":"Dữ liệu giả lập"},{"id":"INV006","month":"2026-09","site":"K006","room":"P006","tenant":"Đặng Tuấn Kiệt","due":"2026-09-05","rent":2600000,"electricity":448000,"water":80000,"trash":30000,"wifi":70000,"parking":0,"other":0,"adjustment":0,"contract":"HD006","note":"Dữ liệu giả lập"},{"id":"INV007","month":"2026-09","site":"K007","room":"P007","tenant":"Bùi Khánh Linh","due":"2026-09-05","rent":2800000,"electricity":493500,"water":100000,"trash":30000,"wifi":70000,"parking":100000,"other":50000,"adjustment":0,"contract":"HD007","note":"Dữ liệu giả lập"},{"id":"INV008","month":"2026-09","site":"K008","room":"P008","tenant":"Đỗ Gia Huy","due":"2026-09-05","rent":3000000,"electricity":189000,"water":40000,"trash":30000,"wifi":70000,"parking":100000,"other":0,"adjustment":0,"contract":"HD008","note":"Dữ liệu giả lập"},{"id":"INV009","month":"2026-09","site":"K009","room":"P009","tenant":"Hồ Phương Thảo","due":"2026-09-05","rent":3200000,"electricity":234500,"water":60000,"trash":30000,"wifi":70000,"parking":0,"other":0,"adjustment":-100000,"contract":"HD009","note":"Dữ liệu giả lập"},{"id":"INV010","month":"2026-09","site":"K010","room":"P010","tenant":"Dương Đức Minh","due":"2026-09-05","rent":2400000,"electricity":280000,"water":80000,"trash":30000,"wifi":70000,"parking":100000,"other":0,"adjustment":0,"contract":"HD010","note":"Dữ liệu giả lập"},{"id":"INV011","month":"2026-10","site":"K011","room":"P011","tenant":"Ngô Thanh Trúc","due":"2026-10-05","rent":2600000,"electricity":325500,"water":100000,"trash":30000,"wifi":70000,"parking":100000,"other":0,"adjustment":0,"contract":"HD011","note":"Dữ liệu giả lập"},{"id":"INV012","month":"2026-10","site":"K012","room":"P012","tenant":"Vũ Hải Đăng","due":"2026-10-05","rent":2800000,"electricity":371000,"water":40000,"trash":30000,"wifi":70000,"parking":0,"other":0,"adjustment":0,"contract":"HD012","note":"Dữ liệu giả lập"},{"id":"INV013","month":"2026-10","site":"K013","room":"P013","tenant":"Huỳnh Bảo Ngọc","due":"2026-10-05","rent":3000000,"electricity":416500,"water":60000,"trash":30000,"wifi":70000,"parking":100000,"other":0,"adjustment":0,"contract":"HD013","note":"Dữ liệu giả lập"},{"id":"INV014","month":"2026-10","site":"K014","room":"P014","tenant":"Phan Minh Khang","due":"2026-10-05","rent":3200000,"electricity":462000,"water":80000,"trash":30000,"wifi":70000,"parking":100000,"other":50000,"adjustment":0,"contract":"HD014","note":"Dữ liệu giả lập"},{"id":"INV015","month":"2026-10","site":"K015","room":"P015","tenant":"Trương Quỳnh Như","due":"2026-10-05","rent":2400000,"electricity":507500,"water":100000,"trash":30000,"wifi":70000,"parking":0,"other":0,"adjustment":0,"contract":"HD015","note":"Dữ liệu giả lập"},{"id":"INV016","month":"2026-10","site":"K016","room":"P016","tenant":"Đinh Anh Tú","due":"2026-10-05","rent":2600000,"electricity":203000,"water":40000,"trash":30000,"wifi":70000,"parking":100000,"other":0,"adjustment":0,"contract":"HD016","note":"Dữ liệu giả lập"},{"id":"INV017","month":"2026-10","site":"K017","room":"P017","tenant":"Mai Thảo Vy","due":"2026-10-05","rent":2800000,"electricity":248500,"water":60000,"trash":30000,"wifi":70000,"parking":100000,"other":0,"adjustment":0,"contract":"HD017","note":"Dữ liệu giả lập"},{"id":"INV018","month":"2026-10","site":"K018","room":"P018","tenant":"Cao Nhật Minh","due":"2026-10-05","rent":3000000,"electricity":294000,"water":80000,"trash":30000,"wifi":70000,"parking":0,"other":0,"adjustment":-100000,"contract":"HD018","note":"Dữ liệu giả lập"},{"id":"INV019","month":"2026-10","site":"K019","room":"P019","tenant":"Tạ Hoài An","due":"2026-10-05","rent":3200000,"electricity":339500,"water":100000,"trash":30000,"wifi":70000,"parking":100000,"other":0,"adjustment":0,"contract":"HD019","note":"Dữ liệu giả lập"},{"id":"INV020","month":"2026-10","site":"K020","room":"P020","tenant":"Lý Quốc Hưng","due":"2026-10-05","rent":2400000,"electricity":385000,"water":40000,"trash":30000,"wifi":70000,"parking":100000,"other":0,"adjustment":0,"contract":"HD020","note":"Dữ liệu giả lập"},{"id":"INV021","month":"2026-11","site":"K021","room":"P021","tenant":"Nguyễn Hải Yến","due":"2026-11-05","rent":2600000,"electricity":430500,"water":60000,"trash":30000,"wifi":70000,"parking":0,"other":50000,"adjustment":0,"contract":"HD021","note":"Dữ liệu giả lập"},{"id":"INV022","month":"2026-11","site":"K022","room":"P022","tenant":"Trần Khánh Duy","due":"2026-11-05","rent":2800000,"electricity":476000,"water":80000,"trash":30000,"wifi":70000,"parking":100000,"other":0,"adjustment":0,"contract":"HD022","note":"Dữ liệu giả lập"},{"id":"INV023","month":"2026-11","site":"K023","room":"P023","tenant":"Lê Mỹ Duyên","due":"2026-11-05","rent":3000000,"electricity":521500,"water":100000,"trash":30000,"wifi":70000,"parking":100000,"other":0,"adjustment":0,"contract":"HD023","note":"Dữ liệu giả lập"},{"id":"INV024","month":"2026-11","site":"K024","room":"P024","tenant":"Phạm Thành Đạt","due":"2026-11-05","rent":3200000,"electricity":217000,"water":40000,"trash":30000,"wifi":70000,"parking":0,"other":0,"adjustment":0,"contract":"HD024","note":"Dữ liệu giả lập"},{"id":"INV025","month":"2026-11","site":"K025","room":"P025","tenant":"Võ Như Quỳnh","due":"2026-11-05","rent":2400000,"electricity":262500,"water":60000,"trash":30000,"wifi":70000,"parking":100000,"other":0,"adjustment":0,"contract":"HD025","note":"Dữ liệu giả lập"},{"id":"INV026","month":"2026-11","site":"K026","room":"P026","tenant":"Đặng Minh Quân","due":"2026-11-05","rent":2600000,"electricity":308000,"water":80000,"trash":30000,"wifi":70000,"parking":100000,"other":0,"adjustment":0,"contract":"HD026","note":"Dữ liệu giả lập"},{"id":"INV027","month":"2026-11","site":"K027","room":"P027","tenant":"Bùi Ngọc Hân","due":"2026-11-05","rent":2800000,"electricity":353500,"water":100000,"trash":30000,"wifi":70000,"parking":0,"other":0,"adjustment":-100000,"contract":"HD027","note":"Dữ liệu giả lập"},{"id":"INV028","month":"2026-11","site":"K028","room":"P028","tenant":"Đỗ Tuấn Anh","due":"2026-11-05","rent":3000000,"electricity":399000,"water":40000,"trash":30000,"wifi":70000,"parking":100000,"other":50000,"adjustment":0,"contract":"HD028","note":"Dữ liệu giả lập"},{"id":"INV029","month":"2026-11","site":"K029","room":"P029","tenant":"Hồ Thanh Tâm","due":"2026-11-05","rent":3200000,"electricity":444500,"water":60000,"trash":30000,"wifi":70000,"parking":100000,"other":0,"adjustment":0,"contract":"HD029","note":"Dữ liệu giả lập"},{"id":"INV030","month":"2026-11","site":"K030","room":"P030","tenant":"Dương Bảo Châu","due":"2026-11-05","rent":2400000,"electricity":490000,"water":80000,"trash":30000,"wifi":70000,"parking":0,"other":0,"adjustment":0,"contract":"HD030","note":"Dữ liệu giả lập"}],"receipts":[{"id":"PT001","date":"2026-09-02","contract":"HD001","invoice":"INV001","type":"Thanh toán hóa đơn","amount":1540250,"method":"Chuyển khoản","account":"Ngân hàng mẫu","note":"Lần 1/2 · giả lập"},{"id":"PT002","date":"2026-09-03","contract":"HD001","invoice":"INV001","type":"Thanh toán hóa đơn","amount":1540250,"method":"Chuyển khoản","account":"Ngân hàng mẫu","note":"Lần 2/2 · giả lập"},{"id":"PT003","date":"2026-09-02","contract":"HD002","invoice":"INV002","type":"Thanh toán hóa đơn","amount":1673000,"method":"Chuyển khoản","account":"Ngân hàng mẫu","note":"Lần 1/2 · giả lập"},{"id":"PT004","date":"2026-09-03","contract":"HD002","invoice":"INV002","type":"Thanh toán hóa đơn","amount":1673000,"method":"Chuyển khoản","account":"Ngân hàng mẫu","note":"Lần 2/2 · giả lập"},{"id":"PT005","date":"2026-09-02","contract":"HD003","invoice":"INV003","type":"Thanh toán hóa đơn","amount":3511500,"method":"Tiền mặt","account":"Quỹ tiền mặt","note":"Giả lập"},{"id":"PT006","date":"2026-09-02","contract":"HD004","invoice":"INV004","type":"Thanh toán hóa đơn","amount":3797000,"method":"Chuyển khoản","account":"Ngân hàng mẫu","note":"Giả lập"},{"id":"PT007","date":"2026-09-02","contract":"HD005","invoice":"INV005","type":"Thanh toán hóa đơn","amount":3062500,"method":"Chuyển khoản","account":"Ngân hàng mẫu","note":"Giả lập"},{"id":"PT008","date":"2026-09-02","contract":"HD006","invoice":"INV006","type":"Thanh toán hóa đơn","amount":1614000,"method":"Tiền mặt","account":"Quỹ tiền mặt","note":"Giả lập"},{"id":"PT009","date":"2026-09-02","contract":"HD007","invoice":"INV007","type":"Thanh toán hóa đơn","amount":1821750,"method":"Chuyển khoản","account":"Ngân hàng mẫu","note":"Giả lập"},{"id":"PT010","date":"2026-09-02","contract":"HD008","invoice":"INV008","type":"Thanh toán hóa đơn","amount":3600450,"method":"Chuyển khoản","account":"Ngân hàng mẫu","note":"Giả lập"},{"id":"PT011","date":"2026-10-02","contract":"HD011","invoice":"INV011","type":"Thanh toán hóa đơn","amount":1612750,"method":"Chuyển khoản","account":"Ngân hàng mẫu","note":"Lần 1/2 · giả lập"},{"id":"PT012","date":"2026-10-03","contract":"HD011","invoice":"INV011","type":"Thanh toán hóa đơn","amount":1612750,"method":"Chuyển khoản","account":"Ngân hàng mẫu","note":"Lần 2/2 · giả lập"},{"id":"PT013","date":"2026-10-02","contract":"HD012","invoice":"INV012","type":"Thanh toán hóa đơn","amount":1655500,"method":"Tiền mặt","account":"Quỹ tiền mặt","note":"Lần 1/2 · giả lập"},{"id":"PT014","date":"2026-10-03","contract":"HD012","invoice":"INV012","type":"Thanh toán hóa đơn","amount":1655500,"method":"Tiền mặt","account":"Quỹ tiền mặt","note":"Lần 2/2 · giả lập"},{"id":"PT015","date":"2026-10-02","contract":"HD013","invoice":"INV013","type":"Thanh toán hóa đơn","amount":3676500,"method":"Chuyển khoản","account":"Ngân hàng mẫu","note":"Giả lập"},{"id":"PT016","date":"2026-10-02","contract":"HD014","invoice":"INV014","type":"Thanh toán hóa đơn","amount":3992000,"method":"Chuyển khoản","account":"Ngân hàng mẫu","note":"Giả lập"},{"id":"PT017","date":"2026-10-02","contract":"HD015","invoice":"INV015","type":"Thanh toán hóa đơn","amount":3107500,"method":"Tiền mặt","account":"Quỹ tiền mặt","note":"Giả lập"},{"id":"PT018","date":"2026-10-02","contract":"HD016","invoice":"INV016","type":"Thanh toán hóa đơn","amount":1521500,"method":"Chuyển khoản","account":"Ngân hàng mẫu","note":"Giả lập"},{"id":"PT019","date":"2026-10-02","contract":"HD017","invoice":"INV017","type":"Thanh toán hóa đơn","amount":1654250,"method":"Chuyển khoản","account":"Ngân hàng mẫu","note":"Giả lập"},{"id":"PT020","date":"2026-10-02","contract":"HD018","invoice":"INV018","type":"Thanh toán hóa đơn","amount":3542700,"method":"Tiền mặt","account":"Quỹ tiền mặt","note":"Giả lập"},{"id":"PT021","date":"2026-11-02","contract":"HD021","invoice":"INV021","type":"Thanh toán hóa đơn","amount":1620250,"method":"Tiền mặt","account":"Quỹ tiền mặt","note":"Lần 1/2 · giả lập"},{"id":"PT022","date":"2026-11-03","contract":"HD021","invoice":"INV021","type":"Thanh toán hóa đơn","amount":1620250,"method":"Tiền mặt","account":"Quỹ tiền mặt","note":"Lần 2/2 · giả lập"},{"id":"PT023","date":"2026-11-02","contract":"HD022","invoice":"INV022","type":"Thanh toán hóa đơn","amount":1778000,"method":"Chuyển khoản","account":"Ngân hàng mẫu","note":"Lần 1/2 · giả lập"},{"id":"PT024","date":"2026-11-03","contract":"HD022","invoice":"INV022","type":"Thanh toán hóa đơn","amount":1778000,"method":"Chuyển khoản","account":"Ngân hàng mẫu","note":"Lần 2/2 · giả lập"},{"id":"PT025","date":"2026-11-02","contract":"HD023","invoice":"INV023","type":"Thanh toán hóa đơn","amount":3821500,"method":"Chuyển khoản","account":"Ngân hàng mẫu","note":"Giả lập"},{"id":"PT026","date":"2026-11-02","contract":"HD024","invoice":"INV024","type":"Thanh toán hóa đơn","amount":3557000,"method":"Tiền mặt","account":"Quỹ tiền mặt","note":"Giả lập"},{"id":"PT027","date":"2026-11-02","contract":"HD025","invoice":"INV025","type":"Thanh toán hóa đơn","amount":2922500,"method":"Chuyển khoản","account":"Ngân hàng mẫu","note":"Giả lập"},{"id":"PT028","date":"2026-11-02","contract":"HD026","invoice":"INV026","type":"Thanh toán hóa đơn","amount":1594000,"method":"Chuyển khoản","account":"Ngân hàng mẫu","note":"Giả lập"},{"id":"PT029","date":"2026-11-02","contract":"HD027","invoice":"INV027","type":"Thanh toán hóa đơn","amount":1626750,"method":"Tiền mặt","account":"Quỹ tiền mặt","note":"Giả lập"},{"id":"PT030","date":"2026-11-02","contract":"HD028","invoice":"INV028","type":"Thanh toán hóa đơn","amount":3873450,"method":"Chuyển khoản","account":"Ngân hàng mẫu","note":"Giả lập"}],"costs":[{"id":"CP001","date":"2026-09-03","month":"2026-09","site":"K001","room":"P001","category":"Điện tổng","description":"Điện tổng tại phòng P001","amount":850000,"included":"Có","document":"CT-DEMO-001","note":"Giả lập"},{"id":"CP002","date":"2026-09-04","month":"2026-09","site":"K002","room":"P002","category":"Nước tổng","description":"Nước tổng tại phòng P002","amount":180000,"included":"Có","document":"CT-DEMO-002","note":"Giả lập"},{"id":"CP003","date":"2026-09-02","month":"2026-09","site":"K003","room":"P003","category":"Rác","description":"Rác tại phòng P003","amount":120000,"included":"Có","document":"CT-DEMO-003","note":"Giả lập"},{"id":"CP004","date":"2026-09-03","month":"2026-09","site":"K004","room":"P004","category":"Internet","description":"Internet tại phòng P004","amount":350000,"included":"Có","document":"CT-DEMO-004","note":"Giả lập"},{"id":"CP005","date":"2026-09-04","month":"2026-09","site":"K005","room":"P005","category":"Sửa chữa","description":"Sửa chữa tại phòng P005","amount":600000,"included":"Có","document":"CT-DEMO-005","note":"Giả lập"},{"id":"CP006","date":"2026-09-02","month":"2026-09","site":"K006","room":"P006","category":"Vật tư","description":"Vật tư tại phòng P006","amount":250000,"included":"Có","document":"CT-DEMO-006","note":"Giả lập"},{"id":"CP007","date":"2026-09-03","month":"2026-09","site":"K007","room":"P007","category":"Vệ sinh","description":"Vệ sinh tại phòng P007","amount":90000,"included":"Có","document":"CT-DEMO-007","note":"Giả lập"},{"id":"CP008","date":"2026-09-04","month":"2026-09","site":"K008","room":"P008","category":"Nhân công","description":"Nhân công tại phòng P008","amount":450000,"included":"Có","document":"CT-DEMO-008","note":"Giả lập"},{"id":"CP009","date":"2026-09-02","month":"2026-09","site":"K009","room":"P009","category":"Phí ngân hàng","description":"Phí ngân hàng tại phòng P009","amount":150000,"included":"Có","document":"CT-DEMO-009","note":"Giả lập"},{"id":"CP010","date":"2026-09-03","month":"2026-09","site":"K010","room":"P010","category":"Mua tài sản","description":"Mua tài sản tại phòng P010","amount":1200000,"included":"Không","document":"CT-DEMO-010","note":"Giả lập"},{"id":"CP011","date":"2026-10-04","month":"2026-10","site":"K011","room":"P011","category":"Điện tổng","description":"Điện tổng tại phòng P011","amount":850000,"included":"Có","document":"CT-DEMO-011","note":"Giả lập"},{"id":"CP012","date":"2026-10-02","month":"2026-10","site":"K012","room":"P012","category":"Nước tổng","description":"Nước tổng tại phòng P012","amount":180000,"included":"Có","document":"CT-DEMO-012","note":"Giả lập"},{"id":"CP013","date":"2026-10-03","month":"2026-10","site":"K013","room":"P013","category":"Rác","description":"Rác tại phòng P013","amount":120000,"included":"Có","document":"CT-DEMO-013","note":"Giả lập"},{"id":"CP014","date":"2026-10-04","month":"2026-10","site":"K014","room":"P014","category":"Internet","description":"Internet tại phòng P014","amount":350000,"included":"Có","document":"CT-DEMO-014","note":"Giả lập"},{"id":"CP015","date":"2026-10-02","month":"2026-10","site":"K015","room":"P015","category":"Sửa chữa","description":"Sửa chữa tại phòng P015","amount":600000,"included":"Có","document":"CT-DEMO-015","note":"Giả lập"},{"id":"CP016","date":"2026-10-03","month":"2026-10","site":"K016","room":"P016","category":"Vật tư","description":"Vật tư tại phòng P016","amount":250000,"included":"Có","document":"CT-DEMO-016","note":"Giả lập"},{"id":"CP017","date":"2026-10-04","month":"2026-10","site":"K017","room":"P017","category":"Vệ sinh","description":"Vệ sinh tại phòng P017","amount":90000,"included":"Có","document":"CT-DEMO-017","note":"Giả lập"},{"id":"CP018","date":"2026-10-02","month":"2026-10","site":"K018","room":"P018","category":"Nhân công","description":"Nhân công tại phòng P018","amount":450000,"included":"Có","document":"CT-DEMO-018","note":"Giả lập"},{"id":"CP019","date":"2026-10-03","month":"2026-10","site":"K019","room":"P019","category":"Phí ngân hàng","description":"Phí ngân hàng tại phòng P019","amount":150000,"included":"Có","document":"CT-DEMO-019","note":"Giả lập"},{"id":"CP020","date":"2026-10-04","month":"2026-10","site":"K020","room":"P020","category":"Mua tài sản","description":"Mua tài sản tại phòng P020","amount":1200000,"included":"Không","document":"CT-DEMO-020","note":"Giả lập"},{"id":"CP021","date":"2026-11-02","month":"2026-11","site":"K021","room":"P021","category":"Điện tổng","description":"Điện tổng tại phòng P021","amount":850000,"included":"Có","document":"CT-DEMO-021","note":"Giả lập"},{"id":"CP022","date":"2026-11-03","month":"2026-11","site":"K022","room":"P022","category":"Nước tổng","description":"Nước tổng tại phòng P022","amount":180000,"included":"Có","document":"CT-DEMO-022","note":"Giả lập"},{"id":"CP023","date":"2026-11-04","month":"2026-11","site":"K023","room":"P023","category":"Rác","description":"Rác tại phòng P023","amount":120000,"included":"Có","document":"CT-DEMO-023","note":"Giả lập"},{"id":"CP024","date":"2026-11-02","month":"2026-11","site":"K024","room":"P024","category":"Internet","description":"Internet tại phòng P024","amount":350000,"included":"Có","document":"CT-DEMO-024","note":"Giả lập"},{"id":"CP025","date":"2026-11-03","month":"2026-11","site":"K025","room":"P025","category":"Sửa chữa","description":"Sửa chữa tại phòng P025","amount":600000,"included":"Có","document":"CT-DEMO-025","note":"Giả lập"},{"id":"CP026","date":"2026-11-04","month":"2026-11","site":"K026","room":"P026","category":"Vật tư","description":"Vật tư tại phòng P026","amount":250000,"included":"Có","document":"CT-DEMO-026","note":"Giả lập"},{"id":"CP027","date":"2026-11-02","month":"2026-11","site":"K027","room":"P027","category":"Vệ sinh","description":"Vệ sinh tại phòng P027","amount":90000,"included":"Có","document":"CT-DEMO-027","note":"Giả lập"},{"id":"CP028","date":"2026-11-03","month":"2026-11","site":"K028","room":"P028","category":"Nhân công","description":"Nhân công tại phòng P028","amount":450000,"included":"Có","document":"CT-DEMO-028","note":"Giả lập"},{"id":"CP029","date":"2026-11-04","month":"2026-11","site":"K029","room":"P029","category":"Phí ngân hàng","description":"Phí ngân hàng tại phòng P029","amount":150000,"included":"Có","document":"CT-DEMO-029","note":"Giả lập"},{"id":"CP030","date":"2026-11-02","month":"2026-11","site":"K030","room":"P030","category":"Mua tài sản","description":"Mua tài sản tại phòng P030","amount":1200000,"included":"Không","document":"CT-DEMO-030","note":"Giả lập"}],"payments":[{"id":"PC001","date":"2026-09-04","cost":"CP001","contract":"","type":"Thanh toán chi phí","amount":850000,"method":"Chuyển khoản","account":"Ngân hàng mẫu","note":"Thanh toán đủ · giả lập"},{"id":"PC002","date":"2026-09-03","cost":"CP002","contract":"","type":"Thanh toán chi phí","amount":180000,"method":"Chuyển khoản","account":"Ngân hàng mẫu","note":"Thanh toán đủ · giả lập"},{"id":"PC003","date":"2026-09-04","cost":"CP003","contract":"","type":"Thanh toán chi phí","amount":120000,"method":"Tiền mặt","account":"Quỹ tiền mặt","note":"Thanh toán đủ · giả lập"},{"id":"PC004","date":"2026-09-03","cost":"CP004","contract":"","type":"Thanh toán chi phí","amount":350000,"method":"Chuyển khoản","account":"Ngân hàng mẫu","note":"Thanh toán đủ · giả lập"},{"id":"PC005","date":"2026-09-04","cost":"CP005","contract":"","type":"Thanh toán chi phí","amount":600000,"method":"Chuyển khoản","account":"Ngân hàng mẫu","note":"Thanh toán đủ · giả lập"},{"id":"PC006","date":"2026-09-03","cost":"CP006","contract":"","type":"Thanh toán chi phí","amount":250000,"method":"Tiền mặt","account":"Quỹ tiền mặt","note":"Thanh toán đủ · giả lập"},{"id":"PC007","date":"2026-09-04","cost":"CP007","contract":"","type":"Thanh toán chi phí","amount":90000,"method":"Chuyển khoản","account":"Ngân hàng mẫu","note":"Thanh toán đủ · giả lập"},{"id":"PC008","date":"2026-09-03","cost":"CP008","contract":"","type":"Thanh toán chi phí","amount":450000,"method":"Chuyển khoản","account":"Ngân hàng mẫu","note":"Thanh toán đủ · giả lập"},{"id":"PC009","date":"2026-09-04","cost":"CP009","contract":"","type":"Thanh toán chi phí","amount":150000,"method":"Tiền mặt","account":"Quỹ tiền mặt","note":"Thanh toán đủ · giả lập"},{"id":"PC010","date":"2026-09-03","cost":"CP010","contract":"","type":"Thanh toán chi phí","amount":1200000,"method":"Chuyển khoản","account":"Ngân hàng mẫu","note":"Thanh toán đủ · giả lập"},{"id":"PC011","date":"2026-10-04","cost":"CP011","contract":"","type":"Thanh toán chi phí","amount":850000,"method":"Chuyển khoản","account":"Ngân hàng mẫu","note":"Thanh toán đủ · giả lập"},{"id":"PC012","date":"2026-10-03","cost":"CP012","contract":"","type":"Thanh toán chi phí","amount":180000,"method":"Tiền mặt","account":"Quỹ tiền mặt","note":"Thanh toán đủ · giả lập"},{"id":"PC013","date":"2026-10-04","cost":"CP013","contract":"","type":"Thanh toán chi phí","amount":120000,"method":"Chuyển khoản","account":"Ngân hàng mẫu","note":"Thanh toán đủ · giả lập"},{"id":"PC014","date":"2026-10-03","cost":"CP014","contract":"","type":"Thanh toán chi phí","amount":350000,"method":"Chuyển khoản","account":"Ngân hàng mẫu","note":"Thanh toán đủ · giả lập"},{"id":"PC015","date":"2026-10-04","cost":"CP015","contract":"","type":"Thanh toán chi phí","amount":600000,"method":"Tiền mặt","account":"Quỹ tiền mặt","note":"Thanh toán đủ · giả lập"},{"id":"PC016","date":"2026-10-03","cost":"CP016","contract":"","type":"Thanh toán chi phí","amount":250000,"method":"Chuyển khoản","account":"Ngân hàng mẫu","note":"Thanh toán đủ · giả lập"},{"id":"PC017","date":"2026-10-04","cost":"CP017","contract":"","type":"Thanh toán chi phí","amount":90000,"method":"Chuyển khoản","account":"Ngân hàng mẫu","note":"Thanh toán đủ · giả lập"},{"id":"PC018","date":"2026-10-03","cost":"CP018","contract":"","type":"Thanh toán chi phí","amount":450000,"method":"Tiền mặt","account":"Quỹ tiền mặt","note":"Thanh toán đủ · giả lập"},{"id":"PC019","date":"2026-10-04","cost":"CP019","contract":"","type":"Thanh toán chi phí","amount":150000,"method":"Chuyển khoản","account":"Ngân hàng mẫu","note":"Thanh toán đủ · giả lập"},{"id":"PC020","date":"2026-10-03","cost":"CP020","contract":"","type":"Thanh toán chi phí","amount":1200000,"method":"Chuyển khoản","account":"Ngân hàng mẫu","note":"Thanh toán đủ · giả lập"},{"id":"PC021","date":"2026-11-04","cost":"CP021","contract":"","type":"Thanh toán chi phí","amount":850000,"method":"Tiền mặt","account":"Quỹ tiền mặt","note":"Thanh toán đủ · giả lập"},{"id":"PC022","date":"2026-11-03","cost":"CP022","contract":"","type":"Thanh toán chi phí","amount":180000,"method":"Chuyển khoản","account":"Ngân hàng mẫu","note":"Thanh toán đủ · giả lập"},{"id":"PC023","date":"2026-11-04","cost":"CP023","contract":"","type":"Thanh toán chi phí","amount":120000,"method":"Chuyển khoản","account":"Ngân hàng mẫu","note":"Thanh toán đủ · giả lập"},{"id":"PC024","date":"2026-11-03","cost":"CP024","contract":"","type":"Thanh toán chi phí","amount":350000,"method":"Tiền mặt","account":"Quỹ tiền mặt","note":"Thanh toán đủ · giả lập"},{"id":"PC025","date":"2026-11-04","cost":"CP025","contract":"","type":"Thanh toán chi phí","amount":600000,"method":"Chuyển khoản","account":"Ngân hàng mẫu","note":"Thanh toán đủ · giả lập"},{"id":"PC026","date":"2026-11-03","cost":"CP026","contract":"","type":"Thanh toán chi phí","amount":250000,"method":"Chuyển khoản","account":"Ngân hàng mẫu","note":"Thanh toán đủ · giả lập"},{"id":"PC027","date":"2026-11-04","cost":"CP027","contract":"","type":"Thanh toán chi phí","amount":90000,"method":"Tiền mặt","account":"Quỹ tiền mặt","note":"Thanh toán đủ · giả lập"},{"id":"PC028","date":"2026-11-03","cost":"CP028","contract":"","type":"Thanh toán chi phí","amount":450000,"method":"Chuyển khoản","account":"Ngân hàng mẫu","note":"Thanh toán đủ · giả lập"},{"id":"PC029","date":"2026-11-04","cost":"CP029","contract":"","type":"Thanh toán chi phí","amount":150000,"method":"Chuyển khoản","account":"Ngân hàng mẫu","note":"Thanh toán đủ · giả lập"},{"id":"PC030","date":"2026-11-03","cost":"CP030","contract":"","type":"Thanh toán chi phí","amount":1200000,"method":"Tiền mặt","account":"Quỹ tiền mặt","note":"Thanh toán đủ · giả lập"}]};

function demoSignature27_(module,row){const o={};schema_(module).fields.filter(f=>f.type!=='computed').forEach(f=>o[f.key]=row[f.key]??'');return JSON.stringify(o);}
function demoPlan27_(ss,db){
 const schema=schemas_(),nodes={},groups={},real=new Set(),sample=new Set(),keep=new Set(),meta=metaAll_(ss);
 Object.keys(schema).forEach(m=>{groups[m]=[];const signatures=new Set(DEMO27_[m].map(r=>demoSignature27_(m,r)));db[m].forEach(r=>{const id=m+':'+r._key;nodes[id]={m,r};groups[m].push(id);if(signatures.has(demoSignature27_(m,r))&&!(m==='invoices'&&r.details))sample.add(id);else real.add(id);});});
 function parents(id){const {m,r}=nodes[id],out=[];schema[m].fields.filter(f=>f.ref&&r[f.key]).forEach(f=>{const parent=db[f.ref.module].find(v=>String(v[f.ref.key])===String(r[f.key]));if(parent)out.push(f.ref.module+':'+parent._key);});return out;}
 // Dependencies of real records and lifecycle metadata are mandatory.
 const mandatory=new Set();function required(id){if(!nodes[id]||mandatory.has(id))return;mandatory.add(id);parents(id).forEach(required);}real.forEach(required);Object.keys(meta).forEach(k=>{const prefix=k.startsWith('room:')?'rooms:':k.startsWith('stay:')?'contracts:':k.startsWith('invoice:')?'invoices:':'';if(prefix)required(prefix+k.slice(k.indexOf(':')+1));});
 keep.clear();mandatory.forEach(id=>keep.add(id));const count=(set,m)=>[...set].filter(id=>nodes[id].m===m&&sample.has(id)).length;
 ['invoices','receipts','payments','services','meters','costs','contracts','tenants','rooms','sites','settings'].forEach(m=>groups[m].filter(id=>sample.has(id)).forEach(id=>{const addition=new Set();function closure(v){if(!nodes[v]||keep.has(v)||addition.has(v))return;addition.add(v);parents(v).forEach(closure);}closure(id);const proposal=new Set([...keep,...addition]);if(Object.keys(schema).every(k=>count(proposal,k)<=Math.max(5,count(mandatory,k))))addition.forEach(v=>keep.add(v));}));
 const remove=[...sample].filter(id=>!keep.has(id)).map(id=>nodes[id]);const summary=Object.keys(schema).map(m=>({module:m,label:schema[m].name,remove:remove.filter(n=>n.m===m).length,remaining:db[m].length-remove.filter(n=>n.m===m).length,samples:count(keep,m),protectedReal:groups[m].filter(id=>real.has(id)).length}));
 return {token:token_([Object.keys(db).map(m=>db[m].map(r=>r._token)),meta]),summary,remove};
}
function previewDemoCleanup(){return lock_(()=>{const ss=book_(),plan=demoPlan27_(ss,all_(ss));return {token:plan.token,summary:plan.summary,count:plan.remove.length};});}
function reduceDemoSamples(payload){return lock_(()=>{const ss=book_(),db=all_(ss),plan=demoPlan27_(ss,db);assert_(payload&&payload.token===plan.token,'Dữ liệu đã đổi. Xem lại kế hoạch dọn mẫu.');if(!plan.remove.length)return {message:'Không còn dữ liệu mẫu cần dọn.',state:snapshot_(ss,db)};
 // Permanent local backup in the same spreadsheet before any deletion; preserve cell formulas.
 const backupName='_Sao lưu mẫu '+Utilities.formatDate(new Date(),ss.getSpreadsheetTimeZone(),'yyyyMMdd HHmmss');let name=backupName,n=1;while(ss.getSheetByName(name))name=backupName+' '+n++;
 const backup=ss.insertSheet(name),blocks=[];plan.remove.sort((a,b)=>a.m.localeCompare(b.m)||a.r._row-b.r._row).forEach(n=>{const prev=blocks[blocks.length-1];if(prev&&prev.m===n.m&&prev.row+prev.count===n.r._row)prev.count++;else blocks.push({m:n.m,row:n.r._row,count:1});});
 blocks.forEach(block=>{const sh=sheet_(ss,block.m);block.width=block.m==='invoices'&&(typeof sh.getMaxColumns!=='function'||sh.getMaxColumns()>=18)?18:schema_(block.m).fields.length;block.range=sh.getRange(block.row,1,block.count,block.width);block.before=backupRange26_(block.range);});
 const records=blocks.map(n=>[schema_(n.m).name,n.row,n.count,JSON.stringify(n.before)]);backup.getRange(1,1,1,4).setValues([['Tab nguồn','Dòng bắt đầu','Số dòng','Giá trị/công thức JSON']]);backup.getRange(2,1,records.length,4).setValues(records);if(typeof backup.hideSheet==='function')backup.hideSheet();
 const tasks=blocks.map(n=>({run:()=>n.range.clearContent(),undo:()=>n.range.setValues(n.before)}));atomic26_(tasks);plan.remove.forEach(n=>delete request27_.rows[n.m]);
 return {message:'Đã dọn '+plan.remove.length+' dòng mẫu gốc. Dữ liệu đã chỉnh sửa và liên kết thật được giữ; bản sao lưu: '+name+'. Bấm Đồng bộ Sheet để cập nhật tổng hợp.',summary:plan.summary,state:snapshot_(ss)};
});}

function metaBatchTask27_(ss,updates){const sh=metaSheet_(ss,true),last=sh.getLastRow(),before=last>1?sh.getRange(2,1,last-1,2).getValues():[],after=before.map(r=>r.slice());updates.forEach(([key,value])=>{const raw=JSON.stringify(value);assert_(raw.length<=45000,'Hồ sơ quá lớn.');const i=after.findIndex(r=>r[0]===key);if(i<0)after.push([key,raw]);else after[i]=[key,raw];});const count=Math.max(before.length,after.length,1),restore=before.concat(Array.from({length:count-before.length},()=>['','']));return {run:()=>{sh.getRange(2,1,after.length,2).setValues(after);request27_.meta=null;},undo:()=>{sh.getRange(2,1,count,2).setValues(restore);request27_.meta=null;}};}

// v2.26: factory reset is deliberately a three-step, owner-operated action.
// It never runs on open/deploy. A private, verified Drive copy is required.
const RESET_BUSINESS26_=['payments','receipts','invoices','meters','services','contracts','tenants','costs','rooms','sites','settings'];
const RESET_DERIVED26_=['Theo dõi thu tiền','Báo cáo'];
function resetOwner26_(){
  // Cho phép bản sao của khách hàng được reset / xóa trắng dữ liệu để bàn giao
  return true;
}
function resetFiles26_(meta){if(!meta.identityFolder)return [];const folder=DriveApp.getFolderById(meta.identityFolder);assertPrivate26_(folder);assert_(!folder.getFolders().hasNext(),'Thư mục giấy tờ có thư mục con: cần kiểm tra thủ công trước khi đặt lại.');const files=[],it=folder.getFiles();while(it.hasNext()){const file=it.next();assertPrivate26_(file);files.push({id:file.getId(),name:file.getName(),size:file.getSize()});}return files.sort((a,b)=>a.id.localeCompare(b.id));}
function resetDigest26_(ss,files){const names=RESET_BUSINESS26_.map(m=>schema_(m).name).concat('_Dữ liệu ứng dụng'),blocks=[];names.forEach(name=>{const sh=ss.getSheetByName(name);if(!sh){blocks.push([name,null]);return;}const last=sh.getLastRow(),cols=Math.max(2,sh.getLastColumn());blocks.push([name,last,cols,last?backupRange26_(sh.getRange(1,1,last,cols)):[]]);});return token_([SPREADSHEET_ID,blocks,files.map(f=>[f.id,f.size])]);}
function resetAudit26_(ss){const db=all_(ss),meta=metaAll_(ss),files=resetFiles26_(meta),known=new Set(RESET_BUSINESS26_.map(m=>schema_(m).name).concat(RESET_DERIVED26_,'_Dữ liệu ứng dụng')),extra=[];ss.getSheets().forEach(sh=>{const name=sh.getName();if(!known.has(name)&&sh.getLastRow()>0&&!/^_Sao lưu mẫu /.test(name))extra.push(name);});assert_(!extra.length,'Có tab ngoài phạm vi đã biết: '+extra.join(', ')+'. Kiểm tra và dọn thủ công trước khi đặt lại.');RESET_DERIVED26_.forEach(name=>assert_(ss.getSheetByName(name),'Thiếu tab tổng hợp '+name));const counts={};RESET_BUSINESS26_.forEach(m=>counts[m]=db[m].length);counts.metadata=Object.keys(meta).length;counts.attachments=files.length;counts.oldSampleBackups=ss.getSheets().filter(sh=>/^_Sao lưu mẫu /.test(sh.getName())).reduce((n,sh)=>n+Math.max(0,sh.getLastRow()-1),0);return {counts,files,meta,token:resetDigest26_(ss,files),defaults:catalogs28_(ss,{costs:[],services:[]},true).items};}
function previewFactoryReset26(){return lock_(()=>{resetOwner26_();const ss=book_(),audit=resetAudit26_(ss);return {spreadsheetId:(book_().getId()),suffix:(book_().getId().slice(-6)),counts:audit.counts,defaultGroups:CATALOG_GROUPS28_.map(group=>({group,count:audit.defaults.filter(x=>x.group===group).length})),token:audit.token,message:'Chỉ xem trước; chưa sao lưu hoặc xóa dữ liệu.'};});}
function backupFactoryReset26(payload){return lock_(()=>{resetOwner26_();const ss=book_(),audit=resetAudit26_(ss);assert_(payload&&payload.token===audit.token,'Dữ liệu đã thay đổi. Hãy xem trước lại.');const now=Utilities.formatDate(new Date(),ss.getSpreadsheetTimeZone(),'yyyyMMdd-HHmmss'),folder=DriveApp.createFolder('SAO LƯU TRƯỚC ĐẶT LẠI TRỌ '+now);folder.setSharing(DriveApp.Access.PRIVATE,DriveApp.Permission.VIEW);assertPrivate26_(folder);const source=DriveApp.getFileById(book_().getId()),copy=source.makeCopy('Google Sheets quản lý trọ '+now,folder);copy.setSharing(DriveApp.Access.PRIVATE,DriveApp.Permission.VIEW);assertPrivate26_(copy);const copied=SpreadsheetApp.openById(copy.getId());assert_(resetDigest26_(copied,audit.files)===audit.token,'Bản sao Google Sheets không khớp nguồn; chưa xóa dữ liệu.');const original=audit.meta.identityFolder?DriveApp.getFolderById(audit.meta.identityFolder):null,backupFiles=[];audit.files.forEach(info=>{const file=DriveApp.getFileById(info.id),clone=file.makeCopy(info.name,folder);clone.setSharing(DriveApp.Access.PRIVATE,DriveApp.Permission.VIEW);assertPrivate26_(clone);assert_(clone.getSize()===info.size,'Bản sao tệp '+info.name+' không khớp; chưa xóa dữ liệu.');backupFiles.push({original:info.id,copy:clone.getId(),size:info.size});});assert_(backupFiles.length===audit.files.length,'Chưa sao lưu đủ tệp đính kèm.');const manifest={sourceId:SPREADSHEET_ID,sourceToken:audit.token,backupSpreadsheetId:copy.getId(),backupFolderId:folder.getId(),identityFolderId:original?original.getId():'',files:backupFiles,counts:audit.counts,created:now},manifestFile=folder.createFile('reset-manifest.json',JSON.stringify(manifest),'application/json');manifestFile.setSharing(DriveApp.Access.PRIVATE,DriveApp.Permission.VIEW);assertPrivate26_(manifestFile);return {backupSpreadsheetId:copy.getId(),backupFolderId:folder.getId(),manifestId:manifestFile.getId(),sourceToken:audit.token,counts:audit.counts,backupUrl:copy.getUrl(),message:'Đã tạo và đối chiếu bản sao riêng tư. Chưa xóa dữ liệu.'};});}
function executeFactoryReset26(payload){return lock_(()=>{resetOwner26_();assert_(payload&&payload.confirmation==='XÓA TOÀN BỘ DỮ LIỆU'&&payload.suffix===(book_().getId().slice(-6)),'Cần nhập đúng câu xác nhận và 6 ký tự cuối ID bảng tính.');assert_(payload.manifestId&&payload.backupSpreadsheetId&&payload.backupFolderId&&payload.sourceToken,'Thiếu bản sao lưu đã xác minh.');const ss=book_(),audit=resetAudit26_(ss),manifestFile=DriveApp.getFileById(payload.manifestId);assertPrivate26_(manifestFile);const manifest=JSON.parse(manifestFile.getBlob().getDataAsString('UTF-8'));assert_(manifest.sourceId===(book_().getId())&&manifest.sourceToken===audit.token&&payload.sourceToken===audit.token,'Dữ liệu đã thay đổi sau sao lưu. Cần sao lưu lại.');assert_(manifest.backupSpreadsheetId===payload.backupSpreadsheetId&&manifest.backupFolderId===payload.backupFolderId,'Thông tin bản sao lưu không khớp.');const folder=DriveApp.getFolderById(manifest.backupFolderId),backup=DriveApp.getFileById(manifest.backupSpreadsheetId);assertPrivate26_(folder);assertPrivate26_(backup);assert_(resetDigest26_(SpreadsheetApp.openById(backup.getId()),audit.files)===audit.token,'Bản sao Sheets không còn khớp; không xóa.');assert_(manifest.files.length===audit.files.length,'Thiếu bản sao tệp đính kèm.');manifest.files.forEach((saved,i)=>{assert_(saved.original===audit.files[i].id&&saved.size===audit.files[i].size,'Danh sách tệp đã thay đổi; không xóa.');const file=DriveApp.getFileById(saved.copy);assertPrivate26_(file);assert_(file.getSize()===saved.size,'Bản sao tệp đính kèm không hợp lệ; không xóa.');});const defaults={items:audit.defaults};
  // Clear dependent records before parents. Keep every sheet, header, format and validation.
  RESET_BUSINESS26_.forEach(m=>{const sh=sheet_(ss,m),last=sh.getLastRow();if(last>=FIRST_ROW_)sh.getRange(FIRST_ROW_,1,last-FIRST_ROW_+1,sh.getMaxColumns()).clearContent();delete request27_.rows[m];});
  const metaSheet=metaSheet_(ss,true),metaLast=metaSheet.getLastRow();if(metaLast>1)metaSheet.getRange(2,1,metaLast-1,2).clearContent();metaSet_(ss,'catalogs28',defaults);
  ss.getSheets().filter(sh=>/^_Sao lưu mẫu /.test(sh.getName())).forEach(sh=>{if(sh.getLastRow()>1)sh.getRange(2,1,sh.getLastRow()-1,sh.getMaxColumns()).clearContent();});
  sync_(ss);SpreadsheetApp.flush();manifest.files.forEach(saved=>DriveApp.getFileById(saved.original).setTrashed(true));if(manifest.identityFolderId)DriveApp.getFolderById(manifest.identityFolderId).setTrashed(true);
  reset27_();const after=resetAudit26_(book_()),remaining=Object.entries(after.counts).filter(([key,n])=>key!=='metadata'&&n!==0);assert_(after.counts.metadata===1&&!remaining.length,'Đã xóa một phần nhưng còn dữ liệu. Khôi phục từ bản sao lưu: '+backup.getUrl());return {message:'Đã đặt lại dữ liệu. Bản sao lưu riêng tư: '+backup.getUrl(),deleted:audit.counts,preservedDefaults:audit.defaults.length,backupUrl:backup.getUrl(),state:snapshot_(book_())};});}

// v2.27: editor-only DEMO seed. Never call this from appApi or onOpen.
const DEMO_MONTHS27_=['2026-04','2026-05','2026-06','2026-07','2026-08','2026-09'];
function demoDate27_(month,day){return month+'-'+String(day).padStart(2,'0');}
function demoMonthIndex27_(month){return DEMO_MONTHS27_.indexOf(month);}
function demoContractFor27_(model,room,month){const d=demoDate27_(month,1);return model.contracts.find(c=>c.room===room&&c.start<=month+'-30'&&(!c.end||c.end>=d));}
function buildDemoMaster27_(){
  const data={};Object.keys(schemas_()).forEach(k=>data[k]=[]);
  const meta={},sites=[
    {id:'DEMO-A',name:'DEMO — An Phú Residence',type:'Nhà trọ',count:10,base:2500000,electricity:3500,water:18000,waterMethod:'Theo m³'},
    {id:'DEMO-B',name:'DEMO — Riverside Apartments',type:'Căn hộ dịch vụ',count:8,base:4000000,electricity:3800,water:100000,waterMethod:'Theo phòng'},
    {id:'DEMO-C',name:'DEMO — Green House',type:'Nhà trọ',count:6,base:2200000,electricity:3200,water:60000,waterMethod:'Theo người'}
  ];
  data.settings.push({id:'Tên nhà trọ',value:'DEMO — An Phú Rental Management'},{id:'Người đại diện quản lý',value:'Chủ trọ DEMO'});
  sites.forEach(s=>{
    data.sites.push({id:s.id,name:s.name,address:'Địa chỉ minh họa DEMO '+s.id,manager:'Chủ trọ DEMO',note:'Dữ liệu giả lập'});
    meta['siteprofile:'+s.id]={type:s.type,manager:'Chủ trọ DEMO',phone:'',note:'DEMO',active:true};
    meta['siteconfig:'+s.id]={address:'Địa chỉ minh họa DEMO '+s.id,owner:'Chủ trọ DEMO',ownerPhone:'',features:['Toilet riêng','Cửa sổ'],furniture:[{name:'Giường',quantity:1,condition:'Tốt'},{name:'Tủ quần áo',quantity:1,condition:'Tốt'}],services:[{name:'Điện',method:'Theo kWh',price:s.electricity,quantity:1},{name:'Nước',method:s.waterMethod,price:s.water,quantity:s.waterMethod==='Theo người'?2:1},{name:'Rác',method:'Theo phòng',price:30000,quantity:1},{name:'Wifi',method:'Theo phòng',price:s.id==='DEMO-B'?0:70000,quantity:1}],initial:{month:'2026-03',electricity:0,water:0}};
  });
  const rooms=[],roomSite={};let global=0;
  sites.forEach((s,siteIndex)=>{for(let j=1;j<=s.count;j++){global++;const id='DEMO-P'+String(global).padStart(2,'0'),floor=Math.ceil(j/(s.id==='DEMO-A'?4:3)),rent=s.base+(j-1)*(s.id==='DEMO-B'?330000: s.id==='DEMO-C'?180000:110000);
    const row={id,site:s.id,name:(s.id==='DEMO-B'?'Căn hộ ':'Phòng ')+String(floor)+String(j).padStart(2,'0'),floor,area:siteIndex===1?28+j:17+j,rent,status:global===18?'Trống':'Đang thuê',note:'Phòng mẫu DEMO'};
    data.rooms.push(row);rooms.push(row);roomSite[id]=s;
    meta['room:'+id]={...meta['siteconfig:'+s.id],features:siteIndex===1?['Ban công','Bếp riêng','Toilet riêng']:['Cửa sổ','Toilet riêng'],furniture:[{name:'Giường',quantity:1,condition:global===18?'Cần sửa khi trả phòng':'Tốt'},{name:'Tủ quần áo',quantity:1,condition:'Tốt'},{name:siteIndex===1?'Máy lạnh':'Bàn làm việc',quantity:1,condition:'Tốt'}],initial:{month:'2026-03',electricity:1000+global*41,water:200+global*11}};
  }});
  for(let i=1;i<=32;i++)data.tenants.push({id:'DEMO-KH'+String(i).padStart(2,'0'),name:'Khách DEMO '+String(i).padStart(2,'0'),phone:'',document:'DEMO-ID-'+String(i).padStart(4,'0'),note:i>=28?'Người ở cùng DEMO':''});
  function addContract(roomNo,tenantNo,start,end,status,extra){
    const room=rooms[roomNo-1],id='DEMO-HD'+String(data.contracts.length+1).padStart(2,'0'),rent=room.rent+(extra&&extra.rentDelta||0),deposit=rent;
    const c={id,room:room.id,tenant:'DEMO-KH'+String(tenantNo).padStart(2,'0'),start,end,rent,deposit,dueDay:5,status,note:extra&&extra.note||'Hợp đồng DEMO'};
    data.contracts.push(c);
    const site=roomSite[room.id],count=site.waterMethod==='Theo người'&&roomNo%3===0?1:2,serviceItems=[
      {name:'Điện',method:'Theo kWh',price:site.electricity,quantity:1},
      {name:'Nước',method:site.waterMethod,price:site.water,quantity:site.waterMethod==='Theo người'?count:1},
      {name:'Rác',method:'Theo phòng',price:30000,quantity:1},
      {name:'Wifi',method:'Theo phòng',price:site.id==='DEMO-B'?0:70000,quantity:1}
    ];
    serviceItems.forEach(v=>data.services.push({contract:id,...v,start,end,note:'Dịch vụ DEMO'}));
    const people=[{tenantId:c.tenant,name:data.tenants[tenantNo-1].name,type:'Người đại diện',start}];
    if(roomNo<=6)people.push({tenantId:'DEMO-KH'+(27+roomNo),name:'Khách DEMO '+String(27+roomNo),type:'Người ở cùng',start,end:end&&end<'2026-09-30'?end:''});
    meta['stay:'+id]={room:room.id,config:{services:serviceItems,furniture:meta['room:'+room.id].furniture,features:meta['room:'+room.id].features},people,terms:{rent,deposit,collectionStart:1,collectionEnd:5,dueDay:5,plannedEnd:end},start,handover:{electricity:meta['room:'+room.id].initial.electricity,water:meta['room:'+room.id].initial.water},status,history:extra&&extra.history||[],signedDocuments:[]};
    return c;
  }
  for(let n=1;n<=23;n++){
    const start=n===22?'2026-05-01':n===23?'2026-06-01':'2026-04-01';
    const end=n>=17&&n<=21?'2026-06-30':'2026-12-31';
    addContract(n,n,start,end,n>=17&&n<=21?'Đã kết thúc':'Đang hiệu lực',{});
  }
  addContract(17,17,'2026-07-01','2026-12-31','Đang hiệu lực',{rentDelta:250000,note:'Gia hạn và điều chỉnh giá DEMO',history:[{type:'Gia hạn',date:'2026-07-01'}]});
  [19,20,21].forEach((n,i)=>addContract(n,25+i,'2026-08-01','2026-12-31','Đang hiệu lực',{rentDelta:180000,note:'Khách mới sau một tháng trống DEMO'}));
  addContract(24,19,'2026-09-01','2026-12-31','Đang hiệu lực',{note:'Khách chuyển từ phòng DEMO-P19'});
  const electric={},water={};rooms.forEach((r,i)=>{electric[r.id]=1000+(i+1)*41;water[r.id]=200+(i+1)*11;});
  data.contracts.forEach((c,i)=>{
    // A few deposits are partial, including one received in two installments.
    const amount=i===22?Math.floor(c.deposit/2):c.deposit;
    data.receipts.push({id:'DEMO-C'+String(i+1).padStart(3,'0'),date:c.start,contract:c.id,invoice:'',type:'Nhận cọc',amount,method:i%3?'Chuyển khoản':'Tiền mặt',account:'',note:'Cọc giả lập DEMO'});
  });
  data.receipts.push({id:'DEMO-C029',date:'2026-05-10',contract:data.contracts[22].id,invoice:'',type:'Nhận cọc',amount:data.contracts[22].deposit-Math.floor(data.contracts[22].deposit/2),method:'Tiền mặt',account:'',note:'Bổ sung cọc DEMO'});
  [17,18,19].forEach((index,j)=>{const c=data.contracts[index],deduct=j===0?250000:0;
    if(deduct)meta['deposit:'+c.id]={deductions:[{date:'2026-07-03',amount:deduct,reason:'Sửa nội thất hư hỏng DEMO'}]};
    const refund=c.deposit-deduct;
    data.payments.push({id:'DEMO-HC'+String(j+1).padStart(2,'0'),date:'2026-07-05',cost:'',contract:c.id,type:'Hoàn cọc',amount:refund,method:'Chuyển khoản',account:'',note:'Hoàn cọc sau trả phòng DEMO'});
    meta['stay:'+c.id].checkout={date:'2026-06-30',note:deduct?'Khấu trừ hư hỏng nội thất DEMO':'Trả phòng DEMO',settlementReviewed:true};
  });
  DEMO_MONTHS27_.forEach((month,mi)=>{
    rooms.forEach((room,ri)=>{
      const contract=demoContractFor27_(data,room.id,month);if(!contract)return;
      const site=roomSite[room.id],useE=40+((ri*19+mi*31)%160)+(month==='2026-06'&&ri===4?65:0),prevE=electric[room.id];electric[room.id]+=useE;
      data.meters.push({id:'DEMO-E-'+room.id+'-'+month,month,room:room.id,type:'Điện',date:demoDate27_(month,Math.min(28,27+mi%2)),previous:prevE,current:electric[room.id],usage:useE,price:site.electricity,amount:useE*site.electricity,note:'Chỉ số DEMO'});
      let waterAmount=0,waterUsed=0;if(site.waterMethod==='Theo m³'){waterUsed=2+((ri+mi*2)%7);const prevW=water[room.id];water[room.id]+=waterUsed;
        data.meters.push({id:'DEMO-W-'+room.id+'-'+month,month,room:room.id,type:'Nước',date:demoDate27_(month,Math.min(28,27+mi%2)),previous:prevW,current:water[room.id],usage:waterUsed,price:site.water,amount:waterUsed*site.water,note:'Chỉ số DEMO'});
        waterAmount=waterUsed*site.water;
      }else waterAmount=site.water*(site.waterMethod==='Theo người'&&ri%3!==2?2:1);
      const wifi=site.id==='DEMO-B'?0:70000,adjustment=mi===4&&ri===7?-50000:0,invoice={
        id:'DEMO-INV-'+room.id+'-'+month,month,site:room.site,room:room.id,tenant:data.tenants.find(t=>t.id===contract.tenant).name,
        due:demoDate27_(month,5),rent:contract.rent,electricity:useE*site.electricity,water:waterAmount,trash:30000,wifi,parking:0,other:0,adjustment,
        total:contract.rent+useE*site.electricity+waterAmount+30000+wifi+adjustment,contract:contract.id,note:'Phiếu DEMO'+(adjustment?' · giảm phí dịch vụ':'')
      };data.invoices.push(invoice);
      const pattern=(ri*7+mi*11)%13,share=mi===2?pattern<3?0:pattern<6?.5:1:mi===5?pattern<1?0:pattern<3?.5:1:pattern<2?0:pattern<4?.5:1;
      if(share>0){const first=share===1&&pattern%5===0?Math.floor(invoice.total*.45):Math.round(invoice.total*share);data.receipts.push({id:'DEMO-T'+String(data.receipts.length+1).padStart(3,'0'),date:demoDate27_(month,Math.min(25,4+pattern)),contract:contract.id,invoice:invoice.id,type:'Thanh toán hóa đơn',amount:first,method:pattern%3?'Chuyển khoản':'Tiền mặt',account:'',note:'Thu tiền DEMO'});
        if(first<invoice.total&&share===1)data.receipts.push({id:'DEMO-T'+String(data.receipts.length+1).padStart(3,'0'),date:demoDate27_(month,Math.min(26,15+pattern)),contract:contract.id,invoice:invoice.id,type:'Thanh toán hóa đơn',amount:invoice.total-first,method:'Chuyển khoản',account:'',note:'Thanh toán phần còn lại DEMO'});
      }
    });
    const categories=['Điện nước','Điện nước','Internet','Vệ sinh','Sửa chữa','Vật tư'];
    categories.forEach((category,j)=>{const site=sites[(mi+j)%3],amount=[1150000,620000,430000,280000,mi===5?1450000:650000,mi===5?860000:360000][j]+mi*25000,
      cost={id:'DEMO-CP-'+month+'-'+(j+1),date:demoDate27_(month,8+j*3),month,site:site.id,room:j===4?rooms[(mi*3)%24].id:'',category,description:category+' · chi vận hành DEMO',amount,included:'Có',document:'',note:'Chi phí giả lập'};
      data.costs.push(cost);if((mi+j)%5!==0)data.payments.push({id:'DEMO-PC-'+month+'-'+(j+1),date:demoDate27_(month,11+j*3),cost:cost.id,contract:'',type:'Thanh toán chi phí',amount:mi===2&&j===4?Math.floor(amount/2):amount,method:j%2?'Tiền mặt':'Chuyển khoản',account:'',note:'Chi phí DEMO'});
    });
  });
  data.contracts.forEach(c=>{const stay=meta['stay:'+c.id],prior=type=>data.meters.filter(m=>m.room===c.room&&m.type===type&&m.date<c.start).sort((a,b)=>b.date.localeCompare(a.date))[0];const e=prior('Điện'),w=prior('Nước');if(e)stay.handover.electricity=e.current;if(w)stay.handover.water=w.current;if(stay.checkout){const lastE=data.meters.filter(m=>m.room===c.room&&m.type==='Điện'&&m.date<=stay.checkout.date).sort((a,b)=>b.date.localeCompare(a.date))[0],lastW=data.meters.filter(m=>m.room===c.room&&m.type==='Nước'&&m.date<=stay.checkout.date).sort((a,b)=>b.date.localeCompare(a.date))[0];stay.checkout.electricity=lastE?lastE.current:stay.handover.electricity;stay.checkout.water=lastW?lastW.current:stay.handover.water;}});
  meta.demoMaster27={period:'2026-04/2026-09',status:'seeded',source:'Generated by buildDemoMaster27_'};
  return {data,meta,period:DEMO_MONTHS27_};
}

function qaDemoMaster27_(model){
  const d=model.data,ids=(name)=>new Set(d[name].map(x=>x.id)),sites=ids('sites'),rooms=ids('rooms'),tenants=ids('tenants'),contracts=ids('contracts'),invoices=ids('invoices'),costs=ids('costs'),errors=[];
  const check=(ok,msg)=>{if(!ok)errors.push(msg);};
  check(d.sites.length===3&&d.rooms.length===24,'Cần đúng 3 căn, 24 phòng');
  check(d.tenants.length>=30&&d.tenants.length<=35,'Số khách ngoài phạm vi');
  check(d.contracts.length>=26&&d.contracts.length<=32,'Số hợp đồng ngoài phạm vi');
  check(d.invoices.length>=110&&d.invoices.length<=135,'Số phiếu ngoài phạm vi');
  check(d.costs.length>=30&&d.costs.length<=48,'Số chi phí ngoài phạm vi');
  d.rooms.forEach(r=>check(sites.has(r.site),'Phòng thiếu căn '+r.id));
  d.contracts.forEach(c=>{check(rooms.has(c.room)&&tenants.has(c.tenant),'Hợp đồng thiếu liên kết '+c.id);d.contracts.filter(other=>other!==c&&other.room===c.room).forEach(other=>check(c.end<other.start||other.end<c.start,'Chồng kỳ thuê '+c.id));});
  const seen=new Set();d.invoices.forEach(i=>{const c=d.contracts.find(x=>x.id===i.contract),r=d.rooms.find(x=>x.id===i.room),key=i.contract+'|'+i.month;check(c&&r&&r.site===i.site&&c.room===i.room,'Phiếu sai căn/phòng '+i.id);check(!seen.has(key),'Phiếu trùng '+key);seen.add(key);check(i.total===['rent','electricity','water','trash','wifi','parking','other','adjustment'].reduce((n,k)=>n+Number(i[k]),0),'Sai tổng phiếu '+i.id);});
  const chains={};d.meters.forEach(m=>{const key=m.room+'|'+m.type,prior=chains[key];check(rooms.has(m.room)&&m.current>=m.previous&&m.amount===(m.current-m.previous)*m.price,'Chỉ số sai '+m.id);if(prior)check(prior.current===m.previous,'Đứt chuỗi '+key);chains[key]=m;});
  const paid={};d.receipts.forEach(r=>{check(contracts.has(r.contract)&&r.amount>=0,'Thu tiền thiếu hợp đồng '+r.id);if(r.type==='Thanh toán hóa đơn'){check(invoices.has(r.invoice),'Thu tiền thiếu phiếu '+r.id);paid[r.invoice]=(paid[r.invoice]||0)+r.amount;}});
  d.invoices.forEach(i=>check((paid[i.id]||0)<=i.total,'Thu vượt phiếu '+i.id));
  const received={},returned={};d.receipts.filter(r=>r.type==='Nhận cọc').forEach(r=>received[r.contract]=(received[r.contract]||0)+r.amount);
  d.payments.forEach(p=>{if(p.type==='Hoàn cọc'){check(contracts.has(p.contract),'Hoàn cọc thiếu hợp đồng');returned[p.contract]=(returned[p.contract]||0)+p.amount;}else check(costs.has(p.cost),'Chi tiền thiếu chi phí');});
  Object.keys(returned).forEach(k=>check(returned[k]+((model.meta['deposit:'+k]||{}).deductions||[]).reduce((n,x)=>n+x.amount,0)<=received[k],'Hoàn cọc vượt số dư '+k));
  const countByMonth=Object.fromEntries(DEMO_MONTHS27_.map(m=>[m,d.invoices.filter(i=>i.month===m).length]));DEMO_MONTHS27_.forEach(m=>check(countByMonth[m]>0,'Thiếu kỳ '+m));
  const invoiceReceipts=d.receipts.filter(r=>r.type==='Thanh toán hóa đơn');
  check(invoiceReceipts.length>=90&&invoiceReceipts.length<=140,'Số giao dịch thu ngoài phạm vi');
  const totals={receivable:d.invoices.reduce((n,i)=>n+i.total,0),received:invoiceReceipts.reduce((n,r)=>n+r.amount,0),costs:d.costs.reduce((n,c)=>n+c.amount,0),paidCosts:d.payments.filter(p=>p.type==='Thanh toán chi phí').reduce((n,p)=>n+p.amount,0)};
  totals.debt=totals.receivable-totals.received;
  return {ok:!errors.length,errors,counts:Object.fromEntries(Object.keys(d).map(k=>[k,d[k].length])),countByMonth,totals};
}

function demoTarget27_(){
  assert_(typeof SpreadsheetApp.getActiveSpreadsheet==='function','Chỉ chạy từ trình chỉnh sửa Apps Script gắn với bản sao DEMO.');
  const ss=SpreadsheetApp.getActiveSpreadsheet();assert_(ss&&ss.getId&&ss.getId()!==SPREADSHEET_ID,'Không được seed trên Spreadsheet sản xuất.');
  const approval=PropertiesService.getScriptProperties().getProperty('RENTAL_DEMO_APPROVED_ID');
  assert_(approval&&approval===ss.getId(),'Chưa xác nhận đúng ID bản sao DEMO. Đặt Script property RENTAL_DEMO_APPROVED_ID bằng ID của Sheet DEMO.');
  const file=DriveApp.getFileById(ss.getId()),owner=file.getOwner(),email=Session.getEffectiveUser().getEmail();
  assert_(email&&owner&&owner.getEmail()===email,'Chỉ chủ sở hữu bản sao DEMO mới được seed.');
  assertPrivate26_(file);return ss;
}
function previewDemoMaster27(){
  const ss=demoTarget27_(),model=buildDemoMaster27_(),qa=qaDemoMaster27_(model);
  assert_(qa.ok,'Dữ liệu sinh lỗi: '+qa.errors.join('; '));
  const meta=metaAll_(ss);assert_(!meta.demoMaster27,'Bản DEMO đã được seed; không chạy trùng.');
  Object.keys(schemas_()).forEach(m=>assert_(!rows_(ss,m).length,'Tab '+schema_(m).name+' đã có dữ liệu. Chỉ seed từ bản CLEAN.'));
  assert_(Object.keys(meta).every(k=>k==='catalogs28'),'Bản sao đã có cấu hình vận hành. Chỉ seed từ bản CLEAN.');
  return {spreadsheetId:ss.getId(),spreadsheetUrl:ss.getUrl(),period:model.period,qa,ready:true};
}
function seedDemoMaster27(){
  const lock=LockService.getScriptLock();lock.waitLock(30000);
  try{
    reset27_();const preview=previewDemoMaster27(),ss=demoTarget27_(),model=buildDemoMaster27_(),source=DriveApp.getFileById(ss.getId());
    const backup=source.makeCopy('Sao lưu trước DEMO '+Utilities.formatDate(new Date(),ss.getSpreadsheetTimeZone(),'yyyyMMdd-HHmmss'));
    assertPrivate26_(backup);assert_(backup.getId()!==ss.getId(),'Sao lưu DEMO không hợp lệ.');
    const backupSheet=SpreadsheetApp.openById(backup.getId());assert_(backupSheet&&backupSheet.getId&&backupSheet.getId()===backup.getId(),'Không mở được bản sao lưu DEMO để đối chiếu.');
    Object.keys(schemas_()).forEach(m=>{reset27_();const saved=rows_(backupSheet,m).length;reset27_();assert_(saved===rows_(ss,m).length,'Bản sao lưu thiếu dữ liệu '+m);});reset27_();
    const props=PropertiesService.getScriptProperties();
    try{
      // The CLEAN copy is already verified empty. Settings are branding, so replace on DEMO.
      Object.keys(model.data).forEach(m=>{
        const sh=sheet_(ss,m),last=sh.getLastRow(),fields=schema_(m).fields.length;
        if(m==='settings'&&last>=FIRST_ROW_)sh.getRange(FIRST_ROW_,1,last-FIRST_ROW_+1,fields).clearContent();
        const arr=model.data[m];if(!arr.length)return;
        const needed=FIRST_ROW_+arr.length-1;if(needed>sh.getMaxRows())sh.insertRowsAfter(sh.getMaxRows(),needed-sh.getMaxRows()+20);
        sh.getRange(FIRST_ROW_,1,arr.length,fields).setValues(arr.map((obj,i)=>cellValues_(ss,m,obj,FIRST_ROW_+i)));
        const formats=schema_(m).fields.map(f=>['money','signed','computed','number'].includes(f.type)?'#,##0.##':f.type==='date'?'dd/MM/yyyy':f.type==='month'?'mm/yyyy':'@');
        sh.getRange(FIRST_ROW_,1,arr.length,fields).setNumberFormats(arr.map(()=>formats));
      });
      const invoiceSheet=sheet_(ss,'invoices');if(invoiceSheet.getMaxColumns()<18)invoiceSheet.insertColumnsAfter(invoiceSheet.getMaxColumns(),18-invoiceSheet.getMaxColumns());
      invoiceSheet.getRange(5,18).setValue('Chi tiết khoản thu (JSON)');
      invoiceSheet.getRange(FIRST_ROW_,18,model.data.invoices.length,1).setValues(model.data.invoices.map(i=>[JSON.stringify(invoiceDetails_(model.data,i))]));
      const entries=Object.entries(model.meta),metaSheet=metaSheet_(ss,true),old=metaSheet.getLastRow();if(old>1)metaSheet.getRange(2,1,old-1,2).clearContent();
      if(entries.length+1>metaSheet.getMaxRows())metaSheet.insertRowsAfter(metaSheet.getMaxRows(),entries.length+1-metaSheet.getMaxRows()+10);
      metaSheet.getRange(2,1,entries.length,2).setValues(entries.map(([k,v])=>[k,JSON.stringify(v)]));
      SpreadsheetApp.flush();reset27_();
      const actual=all_(ss),readback=qaDemoMaster27_({data:actual,meta:metaAll_(ss)});
      assert_(readback.ok,'Đối chiếu Sheet sau seed lỗi: '+readback.errors.join('; '));
      Object.keys(model.data).forEach(m=>assert_(actual[m].length===model.data[m].length,'Thiếu dòng ở '+m));
      metaSet_(ss,'demoMaster27',{...model.meta.demoMaster27,spreadsheetId:ss.getId(),backupUrl:backup.getUrl(),qa:readback});
      sync_(ss);SpreadsheetApp.flush();
      props.setProperty('RENTAL_DEMO_SPREADSHEET_ID',ss.getId());reset27_();
      return {message:'Đã seed DEMO trên bản sao riêng.',spreadsheetUrl:ss.getUrl(),backupUrl:backup.getUrl(),qa:readback,liveWebAppVerified:false};
    }catch(e){throw new Error('Seed DEMO chưa hoàn tất. Khôi phục bản sao trước khi thử lại: '+backup.getUrl()+'. Lỗi: '+e.message);}
  }finally{lock.releaseLock();}
}

// v2.29: editor-only, deterministic showcase for an empty private DEMO copy.
// These functions are intentionally absent from appApi and onOpen.
const SHOWCASE_MONTHS29_=['2026-04','2026-05','2026-06','2026-07','2026-08','2026-09'];
function showcaseDate29_(month,day){return month+'-'+String(day).padStart(2,'0');}
function showcaseNextMonth29_(month){const [year,number]=month.split('-').map(Number);return new Date(Date.UTC(year,number,1)).toISOString().slice(0,7);}
function buildDemoShowcase29_(){
 const data={};Object.keys(schemas_()).forEach(k=>data[k]=[]);
 const meta={},sites=[
  {id:'DEMO-S1',name:'Nhà trọ An Phúc',type:'Nhà trọ',base:2400000,electricity:3500,water:18000,waterMethod:'Theo m³'},
  {id:'DEMO-S2',name:'Khu căn hộ Minh Gia',type:'Căn hộ dịch vụ',base:3600000,electricity:3800,water:90000,waterMethod:'Theo phòng'},
  {id:'DEMO-S3',name:'Nhà trọ Hòa Bình',type:'Nhà trọ',base:2100000,electricity:3300,water:65000,waterMethod:'Theo người'}
 ];
 data.settings.push({id:'Tên nhà trọ',value:'ĐƠN VỊ QUẢN LÝ DEMO · KHÔNG GIAO DỊCH'},{id:'Người đại diện quản lý',value:'Người quản lý DEMO'});
 const catalog=[],addCatalog=(group,name,extra={})=>catalog.push({id:'DEMO-DM'+String(catalog.length+1).padStart(3,'0'),group,name,unit:'',method:'',price:0,active:true,order:catalog.length+1,...extra});
 ['Giường','Nệm','Tủ quần áo','Bàn làm việc','Bàn ăn','Ghế','Máy lạnh','Quạt','Rèm cửa','Kệ giày'].forEach(x=>addCatalog('Nội thất',x));
 ['Toilet riêng','Cửa sổ','Ban công','Bếp riêng','Có gác','Chỗ để xe'].forEach(x=>addCatalog('Đặc điểm phòng',x));
 ['Điện','Nước','Rác','Wifi','Giữ xe','Phí quản lý','Vệ sinh'].forEach(x=>addCatalog('Dịch vụ / khoản thu',x));
 ['kWh','m³','phòng','người','xe','cái','tháng'].forEach(x=>addCatalog('Đơn vị tính',x));
 ['Điện nước','Internet','Vệ sinh','Sửa chữa','Vật tư','Lương','Khác'].forEach(x=>addCatalog('Nhóm chi phí',x));
 addCatalog('Phương thức thanh toán','Chuyển khoản',{paymentType:'Chuyển khoản'});addCatalog('Phương thức thanh toán','Tiền mặt',{paymentType:'Tiền mặt'});
 sites.forEach((s,i)=>{
  const address='Địa chỉ minh họa DEMO '+(i+1)+' · Không có thật',accountId='DEMO-BANK-'+(i+1);
  data.sites.push({id:s.id,name:s.name,address,manager:'Người quản lý DEMO',note:'DEMO · không dùng địa chỉ thật'});
  meta['siteprofile:'+s.id]={type:s.type,manager:'Người quản lý DEMO',phone:'',note:'DEMO',active:true};
  meta['siteconfig:'+s.id]={address,owner:'Người quản lý DEMO',ownerPhone:'',features:['Toilet riêng','Cửa sổ'],furniture:[{name:'Giường',quantity:1,condition:'Tốt'},{name:'Tủ quần áo',quantity:1,condition:'Tốt'}],services:[{name:'Điện',method:'Theo kWh',price:s.electricity,quantity:1},{name:'Nước',method:s.waterMethod,price:s.water,quantity:s.waterMethod==='Theo người'?2:1},{name:'Rác',method:'Theo phòng',price:30000,quantity:1},{name:'Wifi',method:'Theo phòng',price:60000,quantity:1}],initial:{month:'2026-03',electricity:0,water:0}};
  addCatalog('Tài khoản thu / chi','Tài khoản DEMO căn '+(i+1),{id:accountId,accountType:'Tài khoản ngân hàng',bank:'NGÂN HÀNG DEMO · KHÔNG CHUYỂN TIỀN',account:'DEMO-ONLY-'+(i+1),owner:'CHỦ TÀI KHOẢN DEMO'});
  meta['sitepayment:'+s.id]={accountId,bin:'',qr:'',memo:'DEMO {maphong} {thang} {nam}',note:'DEMO · không chuyển tiền thật'};
 });
 meta.catalogs28={items:catalog};
 const rooms=[],siteById=Object.fromEntries(sites.map(s=>[s.id,s]));
 sites.forEach((s,si)=>{for(let j=1;j<=6;j++){
  const n=si*6+j,id='DEMO-R'+String(n).padStart(2,'0'),floor=Math.ceil(j/3),rent=s.base+(j-1)*(si===1?220000:130000),status=n===18?'Bảo trì':[1,2,3,4,5,13,14,16].includes(n)?'Đang thuê':'Trống';
  const room={id,site:s.id,name:'Phòng '+(si+1)+floor+String(j).padStart(2,'0'),floor,area:18+si*7+j*2,rent,status,note:'Phòng DEMO'};
  data.rooms.push(room);rooms.push(room);
  meta['room:'+id]={...meta['siteconfig:'+s.id],features:si===1?['Ban công','Bếp riêng','Toilet riêng']:['Cửa sổ','Toilet riêng'],furniture:[{name:'Giường',quantity:1,condition:'Tốt'},{name:'Tủ quần áo',quantity:1,condition:'Tốt'},{name:si===1?'Máy lạnh':'Bàn làm việc',quantity:1,condition:'Tốt'}],initial:{month:'2026-03',electricity:1000+n*33,water:200+n*9}};
 }});
 for(let n=1;n<=26;n++)data.tenants.push({id:'DEMO-KH'+String(n).padStart(2,'0'),name:'Khách mẫu '+String(n).padStart(2,'0'),phone:'',document:'DEMO-ONLY-'+String(n).padStart(3,'0'),note:'Thông tin giả lập DEMO'});
 const contracts=[];
 function contract29(roomNo,tenantNo,start,end,status,scenario){
  const room=rooms[roomNo-1],s=siteById[room.site],id='DEMO-HD'+String(contracts.length+1).padStart(2,'0'),rent=room.rent+(scenario==='Điều chỉnh giá'?250000:0),deposit=rent;
  const c={id,room:room.id,tenant:data.tenants[tenantNo-1].id,start,end,rent,deposit,dueDay:5,status,note:'DEMO · '+scenario};contracts.push(c);data.contracts.push(c);
  const services=[{name:'Điện',method:'Theo kWh',price:s.electricity,quantity:1},{name:'Nước',method:s.waterMethod,price:s.water,quantity:s.waterMethod==='Theo người'?2:1},{name:'Rác',method:'Theo phòng',price:30000,quantity:1},{name:'Wifi',method:'Theo phòng',price:60000,quantity:1}];
  services.forEach(v=>data.services.push({contract:id,...v,start,end,note:'DEMO'}));
  const people=[{tenantId:c.tenant,name:data.tenants[tenantNo-1].name,type:'Người đại diện',start}];if(roomNo<=6)people.push({tenantId:data.tenants[16+roomNo-1].id,name:data.tenants[16+roomNo-1].name,type:'Người ở cùng',start});
  meta['stay:'+id]={room:room.id,config:{services,furniture:meta['room:'+room.id].furniture,features:meta['room:'+room.id].features},people,terms:{rent,deposit,collectionEnd:5,dueDay:5,plannedEnd:end},start,handover:{electricity:meta['room:'+room.id].initial.electricity,water:meta['room:'+room.id].initial.water},status,history:scenario==='Gia hạn'?[{type:'Gia hạn',date:'2026-07-01',oldEnd:'2026-09-30',newEnd:end}]:scenario==='Điều chỉnh giá'?[{type:'Điều chỉnh giá',date:'2026-07-01',oldRent:rent-250000,newRent:rent}]:[],signedDocuments:[]};
  if(status==='Đã kết thúc')meta['stay:'+id].checkout={date:end,note:'Trả phòng DEMO',settlementReviewed:true};
  return c;
 }
 for(let n=1;n<=5;n++)contract29(n,n,'2026-04-01','2026-12-31','Đang hiệu lực',n===1?'Gia hạn':n===2?'Điều chỉnh giá':'Thuê ổn định');
 const extra=[['2026-04',6],['2026-05',7],['2026-06',8],['2026-06',9],['2026-07',10],['2026-07',11],['2026-08',12],['2026-09',13],['2026-09',14]];
 extra.forEach(([m,r],i)=>contract29(r,i===8?7:6+i,showcaseDate29_(m,1),m==='2026-09'?'2026-12-31':showcaseDate29_(m,28),m==='2026-09'?'Đang hiệu lực':'Đã kết thúc',i===8?'Khách quay lại':'Khách ngắn hạn'));
 contract29(15,15,'2026-02-01','2026-03-31','Đã kết thúc','Đã trả trước kỳ DEMO');contract29(16,16,'2026-09-01','2027-03-31','Đang hiệu lực','Chưa lập phiếu');
 // 16 nhận cọc (một hợp đồng nhận hai đợt) + 2 hoàn = 18 giao dịch.
 contracts.forEach((c,i)=>{if(i===14)return;const split=i===15,amount=split?Math.floor(c.deposit/2):c.deposit;data.receipts.push({id:'DEMO-COC-'+String(i+1).padStart(2,'0'),date:c.start,contract:c.id,invoice:'',type:'Nhận cọc',amount,method:i%2?'Tiền mặt':'Chuyển khoản',account:'',note:'Tiền cọc DEMO'});if(split)data.receipts.push({id:'DEMO-COC-BS',date:'2026-09-10',contract:c.id,invoice:'',type:'Nhận cọc',amount:c.deposit-amount,method:'Tiền mặt',account:'',note:'Nhận cọc bổ sung DEMO'});});
 [5,6].forEach((index,j)=>{const c=contracts[index],deduct=j===0?200000:0;if(deduct)meta['deposit:'+c.id]={deductions:[{date:'2026-04-29',amount:deduct,reason:'Khấu trừ nội thất DEMO'}]};data.payments.push({id:'DEMO-HOAN-'+(j+1),date:showcaseDate29_(j?'2026-06':'2026-05',29),cost:'',contract:c.id,type:'Hoàn cọc',amount:c.deposit-deduct,method:'Chuyển khoản',account:'',note:'Hoàn cọc DEMO'});});
 const meterE={},meterW={};rooms.forEach((r,i)=>{meterE[r.id]=1000+(i+1)*33;meterW[r.id]=200+(i+1)*9;});
 const extraByMonth={};extra.forEach(([m,r])=>(extraByMonth[m]||(extraByMonth[m]=[])).push(r));
 let invoiceNo=0,paymentNo=0,costNo=0;
 SHOWCASE_MONTHS29_.forEach((month,mi)=>{
  const selected=[1,2,3,4,5,...(extraByMonth[month]||[])];
  selected.forEach((n,slot)=>{
   const room=rooms[n-1],s=siteById[room.site],contract=contracts.find(c=>c.room===room.id&&c.start<=month+'-28'&&c.end>=month+'-01');assert_(contract,'Thiếu hợp đồng DEMO '+room.id+' '+month);
   const useE=55+((n*19+mi*31)%100)+(month==='2026-06'&&n===3?70:0),beforeE=meterE[room.id];meterE[room.id]+=useE;
   data.meters.push({id:'DEMO-E'+String(data.meters.length+1).padStart(3,'0'),month,room:room.id,type:'Điện',date:showcaseDate29_(month,28),previous:beforeE,current:meterE[room.id],usage:useE,price:s.electricity,amount:useE*s.electricity,note:'Chỉ số DEMO'});
   let waterAmount=s.water*(s.waterMethod==='Theo người'?2:1);if(s.waterMethod==='Theo m³'){const used=2+((n+mi)%5),beforeW=meterW[room.id];meterW[room.id]+=used;data.meters.push({id:'DEMO-W'+String(data.meters.length+1).padStart(3,'0'),month,room:room.id,type:'Nước',date:showcaseDate29_(month,28),previous:beforeW,current:meterW[room.id],usage:used,price:s.water,amount:used*s.water,note:'Chỉ số nước DEMO'});waterAmount=used*s.water;}
   const nextMonth=showcaseNextMonth29_(month),adjustment=mi===4&&n===2?-50000:0,invoice={id:'DEMO-INV'+String(++invoiceNo).padStart(3,'0'),month,site:room.site,room:room.id,tenant:data.tenants.find(t=>t.id===contract.tenant).name,due:showcaseDate29_(nextMonth,5),rent:contract.rent,electricity:useE*s.electricity,water:waterAmount,trash:30000,wifi:60000,parking:0,other:0,adjustment,total:contract.rent+useE*s.electricity+waterAmount+90000+adjustment,contract:contract.id,note:'Phiếu DEMO'};
   data.invoices.push(invoice);meta['invoice:'+invoice.id]={sealed:true,date:showcaseDate29_(month,29)};meta['invoicepayment:'+invoice.id]={bank:'NGÂN HÀNG DEMO · KHÔNG CHUYỂN TIỀN',bin:'',account:'DEMO-ONLY-'+(sites.findIndex(x=>x.id===room.site)+1),holder:'CHỦ TÀI KHOẢN DEMO',qr:'',memo:'DEMO {maphong} {thang} {nam}',note:'DEMO · không chuyển tiền thật',source:'Căn cho thuê'};
   if(slot<5){const split=[0,2,4].includes(mi)&&slot===1,share=split?.6:((mi+slot)%7===0?.5:1),first=Math.round(invoice.total*share);data.receipts.push({id:'DEMO-THU'+String(++paymentNo).padStart(3,'0'),date:showcaseDate29_(nextMonth,slot===2?12:5+slot),contract:contract.id,invoice:invoice.id,type:'Thanh toán hóa đơn',amount:first,method:slot%2?'Tiền mặt':'Chuyển khoản',account:'',note:'Đã thu thực tế DEMO'});
    if(split)data.receipts.push({id:'DEMO-THU'+String(++paymentNo).padStart(3,'0'),date:showcaseDate29_(nextMonth,18),contract:contract.id,invoice:invoice.id,type:'Thanh toán hóa đơn',amount:invoice.total-first,method:'Chuyển khoản',account:'',note:'Thu đợt hai DEMO'});
   }
  });
  const categories=['Điện nước','Internet','Vệ sinh','Sửa chữa','Vật tư','Lương','Khác'];
  selected.forEach((_,j)=>{const s=sites[(mi+j)%3],category=categories[(mi+j)%categories.length],amount=[1050000,420000,310000,750000,240000,900000,190000][(mi+j)%7]+mi*25000,id='DEMO-CP'+String(++costNo).padStart(3,'0');data.costs.push({id,date:showcaseDate29_(month,9+j*2),month,site:s.id,room:'',category,description:category+' DEMO',amount,included:'Có',document:'',note:'Chi phí DEMO'});if((mi+j)%5!==0)data.payments.push({id:'DEMO-CHI'+String(costNo).padStart(3,'0'),date:showcaseDate29_(month,12+j*2),cost:id,contract:'',type:'Thanh toán chi phí',amount:(mi+j)%9===0?Math.floor(amount/2):amount,method:j%2?'Tiền mặt':'Chuyển khoản',account:'',note:'Chi tiền DEMO'});});
 });
 meta.demoMaster27={period:'2026-04/2026-09',status:'seeded',source:'buildDemoShowcase29_',showcase:true};
 return {data,meta,period:SHOWCASE_MONTHS29_};
}
function qaDemoShowcase29_(model){
 const d=model.data,m=model.meta,errors=[],check=(ok,msg)=>{if(!ok)errors.push(msg);},ids=k=>new Set(d[k].map(x=>x.id));
 const sites=ids('sites'),rooms=ids('rooms'),tenants=ids('tenants'),contracts=ids('contracts'),invoices=ids('invoices'),costs=ids('costs');
 [['sites',3],['rooms',18],['tenants',26],['contracts',16],['invoices',39],['costs',39]].forEach(([k,n])=>check(d[k].length===n,k+' cần '+n+' dòng'));
 const invoiceMonth=Object.fromEntries(d.invoices.map(x=>[x.id,x.month])),byMonth={};SHOWCASE_MONTHS29_.forEach(month=>{const i=d.invoices.filter(x=>x.month===month).length,e=d.meters.filter(x=>x.month===month&&x.type==='Điện').length,c=d.costs.filter(x=>x.month===month).length;byMonth[month]={invoices:i,electricity:e,costs:c,receipts:d.receipts.filter(x=>x.type==='Thanh toán hóa đơn'&&invoiceMonth[x.invoice]===month).length};check(i>=5&&i<=7&&e===i&&c===i,'Thiếu 5–7 nghiệp vụ tháng '+month);});
 d.rooms.forEach(r=>check(sites.has(r.site),'Phòng sai căn '+r.id));d.contracts.forEach(c=>check(rooms.has(c.room)&&tenants.has(c.tenant),'Hợp đồng thiếu liên kết '+c.id));
 const unique=new Set(),paid={};d.invoices.forEach(i=>{const c=d.contracts.find(x=>x.id===i.contract),r=d.rooms.find(x=>x.id===i.room),key=i.contract+'|'+i.month;check(c&&r&&c.room===r.id&&r.site===i.site&&c.start<=i.month+'-28'&&c.end>=i.month+'-01','Phiếu sai liên kết '+i.id);check(!unique.has(key),'Phiếu trùng kỳ '+key);unique.add(key);check(i.due>showcaseDate29_(i.month,28),'Hạn đóng trước ngày chốt chỉ số '+i.id);check(i.total===['rent','electricity','water','trash','wifi','parking','other','adjustment'].reduce((n,k)=>n+Number(i[k]||0),0),'Tổng phiếu sai '+i.id);});
 const chain={};d.meters.forEach(x=>{const key=x.room+'|'+x.type;if(chain[key])check(chain[key].current===x.previous,'Đứt chỉ số '+key);chain[key]=x;check(rooms.has(x.room)&&x.current>=x.previous&&x.amount===(x.current-x.previous)*x.price,'Chỉ số sai '+x.id);});
 const deposits={};d.receipts.forEach(r=>{check(contracts.has(r.contract)&&r.amount>0,'Phiếu thu sai hợp đồng '+r.id);if(r.type==='Nhận cọc')deposits[r.contract]=(deposits[r.contract]||0)+r.amount;else {check(invoices.has(r.invoice),'Thu thiếu phiếu '+r.id);paid[r.invoice]=(paid[r.invoice]||0)+r.amount;}});
 d.invoices.forEach(i=>check((paid[i.id]||0)<=i.total,'Thu vượt phiếu '+i.id));
 const refunds={};d.payments.forEach(p=>{if(p.type==='Hoàn cọc'){check(contracts.has(p.contract),'Hoàn thiếu hợp đồng '+p.id);refunds[p.contract]=(refunds[p.contract]||0)+p.amount;}else check(costs.has(p.cost),'Chi thiếu khoản chi '+p.id);});
 Object.keys(refunds).forEach(id=>{const deduction=(m['deposit:'+id]?.deductions||[]).reduce((n,x)=>n+x.amount,0);check(refunds[id]+deduction<=(deposits[id]||0),'Hoàn/khấu trừ cọc vượt '+id);});
 check(d.receipts.filter(x=>x.type==='Thanh toán hóa đơn').length===33,'Cần 33 giao dịch thu');check(d.receipts.filter(x=>x.type==='Nhận cọc').length+d.payments.filter(x=>x.type==='Hoàn cọc').length===18,'Cần 18 giao dịch cọc');
 check(d.meters.filter(x=>x.type==='Điện').length===39,'Cần 39 kỳ nhập điện');
 check(!d.receipts.some(x=>x.account&&!x.account.startsWith('DEMO')),'Có tài khoản thật trong thu DEMO');check(!m.catalogs28.items.some(x=>x.group==='Tài khoản thu / chi'&&!String(x.account).startsWith('DEMO-ONLY-')),'Có tài khoản thật trong Danh mục DEMO');
 const totals={receivable:d.invoices.reduce((n,x)=>n+x.total,0),received:d.receipts.filter(x=>x.type==='Thanh toán hóa đơn').reduce((n,x)=>n+x.amount,0),costs:d.costs.reduce((n,x)=>n+x.amount,0),paidCosts:d.payments.filter(x=>x.type==='Thanh toán chi phí').reduce((n,x)=>n+x.amount,0)};totals.debt=totals.receivable-totals.received;
 return {ok:!errors.length,errors,counts:Object.fromEntries(Object.keys(d).map(k=>[k,d[k].length])),byMonth,totals};
}
function auditLegacyPayment29(){
 const ss=book_(),db=all_(ss),meta=metaAll_(ss),result=[],match=v=>/(?:^|[^\p{L}])(?:thi|cẩm)(?=$|[^\p{L}])/iu.test(String(v||'').normalize('NFC')),mask=v=>{const s=String(v||'');return s?s.slice(0,2)+'…'+s.slice(-3):'';};
 function scan(source,key,value,account){if(match(value))result.push({source,key,matchedField:'Tên/chú thích',accountMasked:mask(account)});}
 db.settings.forEach(r=>scan('Cài đặt',r.id,r.value,''));
 const catalog=meta.catalogs28?.items||[];catalog.filter(x=>x.group==='Tài khoản thu / chi').forEach(x=>scan('Danh mục tài khoản',x.id,[x.name,x.owner,x.bank].join(' '),x.account));
 Object.keys(meta).filter(k=>k.startsWith('sitepayment:')||k.startsWith('invoicepayment:')).forEach(k=>{const v=meta[k]||{};scan(k.startsWith('sitepayment:')?'Tài khoản căn':'Snapshot phiếu',k,[v.holder,v.note,v.bank,v.memo].join(' '),v.account);});
 const report={spreadsheetId:ss.getId(),found:result.length,records:result,hasDemoSeed:!!meta.demoMaster27,message:'Chỉ kiểm tra, không xóa hoặc đổi dữ liệu. Cần đối chiếu thủ công bản ghi thật trước khi xử lý.'};console.log(JSON.stringify(report));return report;
}
function previewDemoShowcase29(){
 const ss=demoTarget27_(),model=buildDemoShowcase29_(),qa=qaDemoShowcase29_(model);assert_(qa.ok,'Dữ liệu DEMO sai: '+qa.errors.join('; '));
 const meta=metaAll_(ss);assert_(!meta.demoMaster27,'Bản DEMO đã có dữ liệu; không nạp trùng.');
 Object.keys(schemas_()).forEach(k=>assert_(!rows_(ss,k).length,'Tab '+schema_(k).name+' không sạch. Chỉ nạp trên bản sao CLEAN.'));
 assert_(Object.keys(meta).every(k=>k==='catalogs28'),'Bản sao có cấu hình riêng. Chỉ nạp trên bản sao CLEAN.');
 const result={spreadsheetId:ss.getId(),spreadsheetUrl:ss.getUrl(),qa,period:model.period,ready:true};console.log(JSON.stringify(result));return result;
}
function seedDemoShowcase29(){
 const lock=LockService.getScriptLock();lock.waitLock(30000);
 try{
  reset27_();const preview=previewDemoShowcase29(),ss=demoTarget27_(),model=buildDemoShowcase29_(),source=DriveApp.getFileById(ss.getId());
  const backup=source.makeCopy('Sao lưu trước DEMO Showcase '+Utilities.formatDate(new Date(),ss.getSpreadsheetTimeZone(),'yyyyMMdd-HHmmss'));assertPrivate26_(backup);assert_(backup.getId()!==ss.getId(),'Sao lưu không hợp lệ.');
  const backupSheet=SpreadsheetApp.openById(backup.getId());assert_(backupSheet&&backupSheet.getId()===backup.getId(),'Không đối chiếu được bản sao lưu.');
  Object.keys(schemas_()).forEach(k=>{reset27_();const n=rows_(backupSheet,k).length;reset27_();assert_(n===rows_(ss,k).length,'Bản sao lưu thiếu dữ liệu '+k);});reset27_();
  try{
   Object.keys(model.data).forEach(k=>{const sh=sheet_(ss,k),last=sh.getLastRow(),width=schema_(k).fields.length;if(k==='settings'&&last>=FIRST_ROW_)sh.getRange(FIRST_ROW_,1,last-FIRST_ROW_+1,width).clearContent();const rows=model.data[k];if(!rows.length)return;const needed=FIRST_ROW_+rows.length-1;if(needed>sh.getMaxRows())sh.insertRowsAfter(sh.getMaxRows(),needed-sh.getMaxRows()+20);sh.getRange(FIRST_ROW_,1,rows.length,width).setValues(rows.map((x,i)=>cellValues_(ss,k,x,FIRST_ROW_+i)));const formats=schema_(k).fields.map(f=>['money','signed','computed','number'].includes(f.type)?'#,##0.##':f.type==='date'?'dd/MM/yyyy':f.type==='month'?'mm/yyyy':'@');sh.getRange(FIRST_ROW_,1,rows.length,width).setNumberFormats(rows.map(()=>formats));});
   const inv=sheet_(ss,'invoices');if(inv.getMaxColumns()<18)inv.insertColumnsAfter(inv.getMaxColumns(),18-inv.getMaxColumns());inv.getRange(5,18).setValue('Chi tiết khoản thu (JSON)');inv.getRange(FIRST_ROW_,18,model.data.invoices.length,1).setValues(model.data.invoices.map(x=>[JSON.stringify(invoiceDetails_(model.data,x))]));
   const entries=Object.entries(model.meta),sh=metaSheet_(ss,true),last=sh.getLastRow();if(last>1)sh.getRange(2,1,last-1,2).clearContent();if(entries.length+1>sh.getMaxRows())sh.insertRowsAfter(sh.getMaxRows(),entries.length+1-sh.getMaxRows()+10);sh.getRange(2,1,entries.length,2).setValues(entries.map(([k,v])=>[k,JSON.stringify(v)]));
   SpreadsheetApp.flush();reset27_();const actual=all_(ss),readback=qaDemoShowcase29_({data:actual,meta:metaAll_(ss)});assert_(readback.ok,'Đối chiếu sau ghi lỗi: '+readback.errors.join('; '));
   Object.keys(model.data).forEach(k=>assert_(actual[k].length===model.data[k].length,'Thiếu dòng '+k));metaSet_(ss,'demoMaster27',{...model.meta.demoMaster27,spreadsheetId:ss.getId(),backupUrl:backup.getUrl(),qa:readback});sync_(ss);SpreadsheetApp.flush();PropertiesService.getScriptProperties().setProperty('RENTAL_DEMO_SPREADSHEET_ID',ss.getId());reset27_();
   const result={message:'Đã nạp DEMO Showcase vào bản sao riêng.',spreadsheetUrl:ss.getUrl(),backupUrl:backup.getUrl(),qa:readback,liveWebAppVerified:false};console.log(JSON.stringify(result));return result;
  }catch(e){throw new Error('Nạp DEMO chưa hoàn tất. Khôi phục bản sao '+backup.getUrl()+'. Lỗi: '+e.message);}
 }finally{lock.releaseLock();}
}
// Chạy một lần từ dự án Apps Script gắn với bản sao DEMO đã được nạp dữ liệu.
// Chỉ kết nối khi dấu DEMO, cấu trúc và toàn bộ quan hệ nghiệp vụ được đối chiếu.
function connectSeededDemoShowcase29(){
 reset27_();
 const ss=SpreadsheetApp.getActiveSpreadsheet();
 assert_(ss&&ss.getId&&ss.getId()!==SPREADSHEET_ID,'Chỉ kết nối từ dự án Apps Script gắn với bản sao DEMO riêng.');
 const file=DriveApp.getFileById(ss.getId()),owner=file.getOwner(),email=Session.getEffectiveUser().getEmail();
 assert_(email&&owner&&owner.getEmail()===email,'Chỉ chủ sở hữu bản sao DEMO mới được kết nối.');
 assertPrivate26_(file);
 const meta=metaAll_(ss),marker=meta.demoMaster27;
 assert_(marker&&marker.showcase===true&&marker.spreadsheetId===ss.getId(),'Bảng này chưa có dấu DEMO Showcase đúng ID.');
 const actual=all_(ss),qa=qaDemoShowcase29_({data:actual,meta});
 assert_(qa.ok,'Bản DEMO chưa đạt đối soát: '+qa.errors.join('; '));
 Object.keys(qa.counts).forEach(k=>assert_(actual[k].every(r=>k==='settings'||String(k==='services'?r.contract:r.id).startsWith('DEMO-')),'Có bản ghi ngoài DEMO trong '+k));
 PropertiesService.getScriptProperties().setProperties({RENTAL_DEMO_APPROVED_ID:ss.getId(),RENTAL_DEMO_SPREADSHEET_ID:ss.getId()});
 reset27_();assert_(book_().getId()===ss.getId(),'Ứng dụng chưa trỏ tới bảng DEMO.');
 const result={message:'Đã kết nối mã Apps Script này với bảng DEMO riêng.',spreadsheetId:ss.getId(),qa,webAppDeploymentVerified:false};
 console.log(JSON.stringify(result));return result;
}
function demoResetAudit29_(){
 const ss=demoTarget27_(),db=all_(ss),meta=metaAll_(ss);assert_(meta.demoMaster27?.showcase===true&&meta.demoMaster27.spreadsheetId===ss.getId(),'Đây không phải bản sao DEMO Showcase đã nạp.');
 Object.keys(db).forEach(k=>db[k].forEach(r=>{const key=k==='services'?r.contract:r.id;if(k==='settings')assert_(['Tên nhà trọ','Người đại diện quản lý'].includes(key),'Có cài đặt khác DEMO; không đặt lại.');else assert_(String(key||'').startsWith('DEMO-'),'Có bản ghi không thuộc DEMO trong '+k+'; không đặt lại.');}));
 Object.keys(meta).forEach(k=>assert_(k==='catalogs28'||k==='demoMaster27'||/^(?:siteprofile|siteconfig|sitepayment|room|stay|deposit|invoice|invoicepayment):DEMO-/.test(k),'Có cấu hình/tài liệu không thuộc DEMO: '+k));
 assert_(!Object.keys(meta).some(k=>k.startsWith('stay:')&&(meta[k].signedDocuments||[]).length),'Có hợp đồng đã tải tài liệu; kiểm tra và sao lưu riêng trước khi đặt lại.');
 const catalog=meta.catalogs28?.items||[];assert_(catalog.every(x=>String(x.id||'').startsWith('DEMO-')),'Danh mục có mục ngoài DEMO; không đặt lại.');
 return {ss,db,meta,token:token_([ss.getId(),Object.keys(db).map(k=>db[k].map(r=>r._token)),meta]),counts:Object.fromEntries(Object.keys(db).map(k=>[k,db[k].length]))};
}
function previewResetDemoShowcase29(){const a=demoResetAudit29_(),result={spreadsheetId:a.ss.getId(),suffix:a.ss.getId().slice(-6),token:a.token,counts:a.counts,message:'Chỉ xem trước; chưa xóa dữ liệu DEMO.'};console.log(JSON.stringify(result));return result;}
function resetDemoShowcase29(payload){
 const lock=LockService.getScriptLock();lock.waitLock(30000);
 try{
  reset27_();const a=demoResetAudit29_();assert_(payload&&payload.token===a.token&&payload.suffix===a.ss.getId().slice(-6)&&payload.confirmation==='ĐẶT LẠI DEMO','Cần xem trước và nhập đúng ĐẶT LẠI DEMO cùng 6 ký tự cuối ID Sheet.');
  const source=DriveApp.getFileById(a.ss.getId()),backup=source.makeCopy('Sao lưu trước đặt lại DEMO '+Utilities.formatDate(new Date(),a.ss.getSpreadsheetTimeZone(),'yyyyMMdd-HHmmss'));assertPrivate26_(backup);assert_(backup.getId()!==a.ss.getId(),'Bản sao lưu không hợp lệ.');
  const copied=SpreadsheetApp.openById(backup.getId());assert_(copied&&copied.getId()===backup.getId(),'Không kiểm tra được bản sao lưu.');
  Object.keys(a.db).forEach(k=>{reset27_();assert_(rows_(copied,k).length===a.db[k].length,'Bản sao lưu thiếu '+k);});reset27_();
  Object.keys(schemas_()).forEach(k=>{const sh=sheet_(a.ss,k),last=sh.getLastRow();if(last>=FIRST_ROW_)sh.getRange(FIRST_ROW_,1,last-FIRST_ROW_+1,sh.getMaxColumns()).clearContent();delete request27_.rows[k];});
  const sh=metaSheet_(a.ss,true),last=sh.getLastRow();if(last>1)sh.getRange(2,1,last-1,2).clearContent();request27_.meta=null;
  metaSet_(a.ss,'catalogs28',{items:catalogs28_(a.ss,{costs:[],services:[]},true).items});sync_(a.ss);SpreadsheetApp.flush();reset27_();
  return {message:'Đã đặt lại riêng bản DEMO. Có thể nạp lại Showcase.',backupUrl:backup.getUrl(),spreadsheetUrl:a.ss.getUrl(),liveWebAppVerified:false};
 }finally{lock.releaseLock();}
}
function resetDemoShowcaseFromEditor29(){const props=PropertiesService.getScriptProperties(),token=props.getProperty('RENTAL_DEMO_RESET_TOKEN'),phrase=props.getProperty('RENTAL_DEMO_RESET_CONFIRM')||'',audit=demoResetAudit29_(),suffix=audit.ss.getId().slice(-6);assert_(phrase==='ĐẶT LẠI DEMO '+suffix,'Nhập Script property RENTAL_DEMO_RESET_CONFIRM = ĐẶT LẠI DEMO '+suffix);const result=resetDemoShowcase29({token,suffix,confirmation:'ĐẶT LẠI DEMO'});props.deleteProperty('RENTAL_DEMO_RESET_TOKEN');props.deleteProperty('RENTAL_DEMO_RESET_CONFIRM');console.log(JSON.stringify(result));return result;}

/**
 * HÀM RESET DỮ LIỆU 1-CHẠM (Chuẩn File Đi Làm V2.4)
 * Xóa sạch toàn bộ dữ liệu mẫu (phòng, khách, hợp đồng, điện nước, hóa đơn, chi phí)
 * Giữ nguyên tiêu đề, cấu hình danh mục và đưa về trạng thái sạch sẽ để bắt đầu nhập thật.
 */
function resetDataOneClick() {
  return lock_(() => {
    const ss = book_();
    const modulesToClear = ['payments','receipts','invoices','meters','services','contracts','tenants','costs','rooms','sites'];
    const clearedCounts = {};
    
    modulesToClear.forEach(m => {
      try {
        const sh = sheet_(ss, m);
        const last = sh.getLastRow();
        if (last >= FIRST_ROW_) {
          sh.getRange(FIRST_ROW_, 1, last - FIRST_ROW_ + 1, sh.getMaxColumns()).clearContent();
          clearedCounts[m] = last - FIRST_ROW_ + 1;
        } else {
          clearedCounts[m] = 0;
        }
      } catch (err) {
        clearedCounts[m] = 0;
      }
      delete request27_.rows[m];
    });
    
    // Reset branding về mặc định sạch
    try {
      const metaSheet = metaSheet_(ss, true);
      const metaLast = metaSheet.getLastRow();
      if (metaLast > 1) {
        metaSheet.getRange(2, 1, metaLast - 1, 2).clearContent();
      }
    } catch(e) {}
    
    // Đồng bộ lại công thức trên Sheet
    try {
      sync_(ss);
      SpreadsheetApp.flush();
    } catch(e) {}
    
    reset27_();
    const freshState = snapshot_(book_());
    return {
      success: true,
      message: 'Đã xóa sạch toàn bộ dữ liệu mẫu. Hệ thống đã sẵn sàng để bạn nhập mới từ đầu!',
      cleared: clearedCounts,
      state: freshState
    };
  });
}
