import fs from 'node:fs/promises';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';

const wb = Workbook.create();
const guide = wb.worksheets.add('BẮT ĐẦU');
const summary = wb.worksheets.add('TỔNG QUAN');
const items = wb.worksheets.add('ĐẦU VÀO');
const recipe = wb.worksheets.add('ĐỊNH MỨC');
const products = wb.worksheets.add('SẢN PHẨM');
const teal = '#0F766E', dark = '#123B3A', pale = '#E8F5F1', blue = '#EAF3FF', white = '#FFFFFF';
for (const sh of [guide, summary, items, recipe, products]) { sh.showGridLines = false; sh.getRange('A1:M110').format.font = {name:'Aptos',size:10,color:dark}; sh.freezePanes.freezeRows(5); }
function title(sh, name, subtitle, end='K') {
  sh.getRange(`A1:${end}2`).merge(); sh.getRange('A1').values=[[name]];
  sh.getRange(`A1:${end}2`).format={fill:teal,font:{name:'Aptos Display',size:18,bold:true,color:white},verticalAlignment:'center'};
  sh.getRange(`A3:${end}3`).merge(); sh.getRange('A3').values=[[subtitle]];
  sh.getRange(`A3:${end}3`).format={fill:pale,font:{name:'Aptos',size:10,color:dark},verticalAlignment:'center'};
  sh.getRange('1:2').format.rowHeight=25;
  sh.getRange('3:3').format.rowHeight=25;
}
function header(sh, range) { sh.getRange(range).format={fill:dark,font:{name:'Aptos',size:10,bold:true,color:white},wrapText:true,verticalAlignment:'center'}; sh.getRange('5:5').format.rowHeight=36; }
function input(sh, range) { sh.getRange(range).format.fill=blue; }

title(guide,'FILE ĐI LÀM  •  TÍNH COST ĐA NGÀNH','Bản mẫu 1.0 • Dùng cho F&B, bán lẻ, handmade và dịch vụ • Đơn vị tiền: VND','H');
guide.getRange('A5:B5').values=[['BƯỚC','VIỆC CẦN LÀM']]; header(guide,'A5:B5');
guide.getRange('A6:B10').values=[
  ['1','Khai báo nguyên liệu, vật tư, hàng nhập hoặc công lao động tại ĐẦU VÀO.'],
  ['2','Nhập mã sản phẩm, số đơn vị thành phẩm mỗi mẻ và chi phí bao bì tại SẢN PHẨM.'],
  ['3','Khai báo định mức từng đầu vào cho một mẻ tại ĐỊNH MỨC; dùng đúng đơn vị cơ sở.'],
  ['4','Xem cost mỗi đơn vị và trạng thái dữ liệu tại TỔNG QUAN.'],
  ['5','Đổi giá mua ở ĐẦU VÀO để kiểm tra cost sản phẩm tự cập nhật.']
];
guide.getRange('A12:B12').values=[['NGUYÊN TẮC','GIẢI THÍCH']]; header(guide,'A12:B12');
guide.getRange('A13:B17').values=[
  ['Cost đầu vào','Giá mua / (lượng mua × hệ số quy đổi × (1 − hao hụt)). Ví dụ 1 kg = 1.000 g.'],
  ['Cost một mẻ','Tổng định mức nguyên liệu/vật tư/lao động + bao bì + chi phí biến đổi khác.'],
  ['Cost một đơn vị','Cost một mẻ / số đơn vị thành phẩm thực nhận.'],
  ['Phạm vi','Chỉ tính chi phí trực tiếp và biến đổi. Chi phí cố định, thuế và điểm hòa vốn thuộc file khác.'],
  ['Lưu ý','Hao hụt ở ĐẦU VÀO áp dụng khi mua/sơ chế. Đừng cộng lại cùng khoản hao hụt trong định mức.']
];
guide.getRange('A:A').format.columnWidth=24; guide.getRange('B:B').format.columnWidth=100; guide.getRange('6:17').format.rowHeight=29;

title(items,'ĐẦU VÀO  •  GIÁ MUA & QUY ĐỔI','Ô xanh được nhập • Mỗi mã là duy nhất • Quy về một đơn vị cơ sở như g, ml, cái, phút','L');
items.getRange('A5:L5').values=[['Mã','Tên đầu vào','Nhóm ngành','Lượng mua','Đơn vị mua','Hệ số ra đơn vị cơ sở','Hao hụt mua/sơ chế','Giá mua (đ)','Đơn vị cơ sở','Lượng dùng được','Cost / đơn vị cơ sở','Kiểm tra']]; header(items,'A5:L5');
const itemRows=[
 ['NV001','Trà khô','Pha chế',1,'kg',1000,0.05,180000,'g'],
 ['NV002','Sữa tươi','Pha chế',1,'lít',1000,0,32000,'ml'],
 ['NV003','Đường','Pha chế',1,'kg',1000,0,22000,'g'],
 ['NV004','Trân châu','Pha chế',1,'kg',1000,0.1,70000,'g'],
 ['NV005','Cốc nhựa','Bao bì',100,'cái',1,0,60000,'cái'],
 ['NV006','Gạo','Món ăn',1,'kg',1000,0,18000,'g'],
 ['NV007','Thịt gà','Món ăn',1,'kg',1000,0.15,85000,'g'],
 ['NV008','Dầu ăn','Món ăn',1,'lít',1000,0,42000,'ml'],
 ['NV009','Hộp cơm','Bao bì',100,'cái',1,0,70000,'cái'],
 ['NV010','Sáp nến','Handmade',1,'kg',1000,0.02,115000,'g'],
 ['NV011','Tinh dầu','Handmade',100,'ml',1,0,68000,'ml'],
 ['NV012','Hũ nến','Bao bì',12,'cái',1,0,84000,'cái'],
 ['NV013','Công lao động','Dịch vụ',60,'phút',1,0,60000,'phút'],
 ['NV014','Hàng nhập','Bán lẻ',10,'cái',1,0,240000,'cái']
];
items.getRange(`A6:I${5+itemRows.length}`).values=itemRows;
for(let r=6;r<=55;r++) {
 items.getRange(`J${r}`).formulas=[[`=IF(A${r}="","",IF(OR(D${r}<=0,F${r}<=0,G${r}<0,G${r}>=1),"",D${r}*F${r}*(1-G${r})))`]];
 items.getRange(`K${r}`).formulas=[[`=IF(A${r}="","",IF(OR(NOT(ISNUMBER(J${r})),NOT(ISNUMBER(H${r}))),"",H${r}/J${r}))`]];
 items.getRange(`L${r}`).formulas=[[`=IF(A${r}="","",IF(COUNTIF($A$6:$A$55,A${r})>1,"TRÙNG MÃ",IF(OR(B${r}="",NOT(ISNUMBER(D${r})),E${r}="",NOT(ISNUMBER(F${r})),NOT(ISNUMBER(G${r})),NOT(ISNUMBER(H${r})),I${r}=""),"THIẾU DỮ LIỆU",IF(OR(D${r}<=0,F${r}<=0,H${r}<0,G${r}<0,G${r}>=1),"SAI GIÁ TRỊ","OK"))))`]];
}
input(items,'A6:I55'); items.getRange('G6:G55').setNumberFormat('0.0%'); items.getRange('H6:H55').setNumberFormat('#,##0'); items.getRange('J6:K55').setNumberFormat('#,##0.00');
for(const [c,w] of Object.entries({A:12,B:23,C:16,D:13,E:15,F:21,G:20,H:16,I:16,J:19,K:21,L:18})) items.getRange(`${c}:${c}`).format.columnWidth=w;

title(recipe,'ĐỊNH MỨC  •  THÀNH PHẦN MỖI MẺ','Nhập mã sản phẩm, mã đầu vào và lượng dùng trong đơn vị cơ sở • Một món có thể có nhiều dòng','H');
recipe.getRange('A5:H5').values=[['Mã sản phẩm','Mã đầu vào','Lượng dùng / mẻ','Đơn vị cơ sở','Cost / đơn vị cơ sở','Cost dòng (đ)','Tên đầu vào','Kiểm tra']]; header(recipe,'A5:H5');
const recipeRows=[
 ['SP001','NV001',20,'g'],['SP001','NV002',200,'ml'],['SP001','NV003',30,'g'],['SP001','NV004',50,'g'],
 ['SP002','NV006',150,'g'],['SP002','NV007',180,'g'],['SP002','NV008',15,'ml'],
 ['SP003','NV010',180,'g'],['SP003','NV011',15,'ml'],
 ['SP004','NV013',45,'phút'],['SP005','NV014',1,'cái']
];
recipe.getRange(`A6:D${5+recipeRows.length}`).values=recipeRows;
for(let r=6;r<=105;r++) {
 recipe.getRange(`E${r}`).formulas=[[`=IF(B${r}="","",IF(COUNTIF('ĐẦU VÀO'!$A$6:$A$55,B${r})<>1,"",SUMIF('ĐẦU VÀO'!$A$6:$A$55,B${r},'ĐẦU VÀO'!$K$6:$K$55)))`]];
 recipe.getRange(`F${r}`).formulas=[[`=IF(A${r}="","",IF(OR(NOT(ISNUMBER(E${r})),NOT(ISNUMBER(C${r}))),"",C${r}*E${r}))`]];
 recipe.getRange(`G${r}`).formulas=[[`=IF(B${r}="","",IF(COUNTIF('ĐẦU VÀO'!$A$6:$A$55,B${r})<>1,"",INDEX('ĐẦU VÀO'!$B$6:$B$55,MATCH(B${r},'ĐẦU VÀO'!$A$6:$A$55,0))))`]];
 recipe.getRange(`H${r}`).formulas=[[`=IF(A${r}="","",IF(COUNTIF('SẢN PHẨM'!$A$6:$A$35,A${r})<>1,"MÃ SP LỖI",IF(COUNTIF('ĐẦU VÀO'!$A$6:$A$55,B${r})<>1,"MÃ ĐẦU VÀO LỖI",IF(OR(NOT(ISNUMBER(C${r})),C${r}<0),"LƯỢNG LỖI",IF(D${r}<>INDEX('ĐẦU VÀO'!$I$6:$I$55,MATCH(B${r},'ĐẦU VÀO'!$A$6:$A$55,0)),"SAI ĐƠN VỊ",IF(INDEX('ĐẦU VÀO'!$L$6:$L$55,MATCH(B${r},'ĐẦU VÀO'!$A$6:$A$55,0))<>"OK","ĐẦU VÀO LỖI","OK"))))))`]];
}
input(recipe,'A6:D105'); recipe.getRange('C6:C105').setNumberFormat('#,##0.00'); recipe.getRange('E6:F105').setNumberFormat('#,##0.00');
for(const [c,w] of Object.entries({A:18,B:17,C:21,D:19,E:23,F:19,G:25,H:21})) recipe.getRange(`${c}:${c}`).format.columnWidth=w;

title(products,'SẢN PHẨM  •  COST MỖI ĐƠN VỊ','Một mẻ có thể ra nhiều ly/suất/cái • Bao bì và chi phí biến đổi khác nhập theo cả mẻ','L');
products.getRange('A5:L5').values=[['Mã','Tên sản phẩm / dịch vụ','Ngành','Thành phẩm / mẻ','Đơn vị bán','Bao bì / mẻ (đ)','Biến đổi khác / mẻ (đ)','Định mức / mẻ (đ)','Tổng cost / mẻ (đ)','Cost / đơn vị (đ)','Số dòng định mức','Kiểm tra']]; header(products,'A5:L5');
products.getRange('A6:G10').values=[
 ['SP001','Trà sữa trân châu','Pha chế',1,'ly',600,0],
 ['SP002','Cơm gà','Món ăn',1,'suất',700,1000],
 ['SP003','Nến thơm 180g','Handmade',1,'hũ',7000,0],
 ['SP004','Dịch vụ chăm sóc','Dịch vụ',1,'lượt',0,5000],
 ['SP005','Sản phẩm nhập bán lại','Bán lẻ',1,'cái',1500,0]
];
for(let r=6;r<=35;r++) {
 products.getRange(`H${r}`).formulas=[[`=IF(A${r}="","",SUMIF('ĐỊNH MỨC'!$A$6:$A$105,A${r},'ĐỊNH MỨC'!$F$6:$F$105))`]];
 products.getRange(`I${r}`).formulas=[[`=IF(A${r}="","",IF(L${r}<>"OK","",H${r}+F${r}+G${r}))`]];
 products.getRange(`J${r}`).formulas=[[`=IF(A${r}="","",IF(NOT(ISNUMBER(I${r})),"",I${r}/D${r}))`]];
 products.getRange(`K${r}`).formulas=[[`=IF(A${r}="","",COUNTIF('ĐỊNH MỨC'!$A$6:$A$105,A${r}))`]];
 products.getRange(`L${r}`).formulas=[[`=IF(A${r}="","",IF(COUNTIF($A$6:$A$35,A${r})>1,"TRÙNG MÃ",IF(OR(B${r}="",C${r}="",NOT(ISNUMBER(D${r})),E${r}="",NOT(ISNUMBER(F${r})),NOT(ISNUMBER(G${r}))),"THIẾU DỮ LIỆU",IF(OR(D${r}<=0,F${r}<0,G${r}<0),"SAI GIÁ TRỊ",IF(K${r}=0,"THIẾU ĐỊNH MỨC",IF(COUNTIFS('ĐỊNH MỨC'!$A$6:$A$105,A${r},'ĐỊNH MỨC'!$H$6:$H$105,"<>OK")>0,"KIỂM TRA ĐỊNH MỨC","OK"))))))`]];
}
input(products,'A6:G35'); products.getRange('F6:J35').setNumberFormat('#,##0.00');
for(const [c,w] of Object.entries({A:12,B:28,C:16,D:20,E:15,F:21,G:23,H:21,I:22,J:21,K:19,L:24})) products.getRange(`${c}:${c}`).format.columnWidth=w;

title(summary,'TỔNG QUAN  •  COST THEO SẢN PHẨM','Kết quả chỉ hiện khi dữ liệu đầu vào và định mức hợp lệ • Đổi giá mua để cập nhật tự động','F');
summary.getRange('A5:F5').values=[['Mã','Sản phẩm / dịch vụ','Ngành','Cost / đơn vị (đ)','Đơn vị bán','Trạng thái']]; header(summary,'A5:F5');
for(let r=6;r<=35;r++) { const p=r; summary.getRange(`A${r}:F${r}`).formulas=[[`=IF('SẢN PHẨM'!A${p}="","",'SẢN PHẨM'!A${p})`,`=IF(A${r}="","",'SẢN PHẨM'!B${p})`,`=IF(A${r}="","",'SẢN PHẨM'!C${p})`,`=IF(A${r}="","",'SẢN PHẨM'!J${p})`,`=IF(A${r}="","",'SẢN PHẨM'!E${p})`,`=IF(A${r}="","",'SẢN PHẨM'!L${p})`]]; }
summary.getRange('D6:D35').setNumberFormat('#,##0.00');
summary.getRange('D6:D35').format.borders={right:{style:'thin',color:'#D7E8E3'}};
for(const [c,w] of Object.entries({A:16,B:30,C:18,D:23,E:16,F:25})) summary.getRange(`${c}:${c}`).format.columnWidth=w;
summary.getRange('A38:F38').merge(); summary.getRange('A38').values=[['Lưu ý: File này tính cost, chưa tính giá bán đề xuất hoặc điểm hòa vốn. Hai phần đó là sản phẩm độc lập trong kế hoạch tháng 9.']]; summary.getRange('A38:F38').format={fill:pale,font:{name:'Aptos',size:10,color:dark},wrapText:true}; summary.getRange('38:38').format.rowHeight=36;

wb.recalculate();
const baseCost=summary.getRange('D6').values[0][0];
items.getRange('H6').values=[[190000]]; wb.recalculate();
const raisedCost=summary.getRange('D6').values[0][0];
if(Math.abs((raisedCost-baseCost)-20*10000/950)>0.001) throw new Error(`Price sensitivity failed: ${baseCost} -> ${raisedCost}`);
items.getRange('H6').values=[[180000]]; wb.recalculate();
if(Math.abs(summary.getRange('D6').values[0][0]-baseCost)>0.001) throw new Error('Price restore failed');
console.log('PRICE_SENSITIVITY_OK',baseCost,raisedCost);
for(const [s,range] of [['TỔNG QUAN','A1:F12'],['ĐẦU VÀO','A1:L13'],['ĐỊNH MỨC','A1:H12'],['SẢN PHẨM','A1:L11'],['BẮT ĐẦU','A1:B17']]) {
 const result=await wb.inspect({kind:'table',range:`'${s}'!${range}`,include:'values,formulas',tableMaxRows:15,tableMaxCols:12,maxChars:2500});
 console.log(s,result.ndjson);
}
const errors=await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!',options:{useRegex:true,maxResults:30},summary:'formula errors'});
console.log('ERRORS',errors.ndjson);
const out='outputs/tinh_cost_da_nganh_v1.xlsx';
const xlsx=await SpreadsheetFile.exportXlsx(wb); await xlsx.save(out); console.log('SAVED',out);
for(const s of ['TỔNG QUAN','ĐẦU VÀO','ĐỊNH MỨC','SẢN PHẨM','BẮT ĐẦU']) {
 const blob=await wb.render({sheetName:s,range:s==='BẮT ĐẦU'?'A1:B17':s==='TỔNG QUAN'?'A1:F12':s==='ĐỊNH MỨC'?'A1:H12':'A1:L12',scale:1,format:'png'});
 await fs.writeFile(`scratch/${s.replaceAll(' ','_')}_cost_preview.png`,new Uint8Array(await blob.arrayBuffer()));
}
