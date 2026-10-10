import fs from 'node:fs/promises';
import {Workbook,SpreadsheetFile} from '@oai/artifact-tool';
const root='C:/Users/ADMIN-PC/Documents/ANTIGRAVITY/FILE_DI_LAM_MVP';
const out=root+'/outputs/cost_v5_20261010'; await fs.mkdir(out,{recursive:true});
const data=JSON.parse(await fs.readFile(new URL('./samples.json',import.meta.url),'utf8'));
const w=Workbook.create();
const names=['BẮT ĐẦU','TỔNG QUAN','MÓN','CÔNG THỨC','MẺ','NGUYÊN LIỆU'];
const sheets=Object.fromEntries(names.map(n=>[n,w.worksheets.add(n)]));
const [start,dash,menu,recipe,batch,raw]=names.map(n=>sheets[n]);
const C={ink:'#493540',rose:'#8E3E67',pink:'#F5CFDE',input:'#FFF1F6',calc:'#EEF5FA',line:'#E7D9E0',red:'#FBE0E5',green:'#E1F0E9',note:'#FFF6DE'};
const rawEnd=205,menuEnd=65,lineEnd=605,batchEnd=25,blStart=32,blEnd=231,catEnd=225;
const rr=(s,c,a=6,b=rawEnd)=>`'${s}'!$${c}$${a}:$${c}$${b}`;
const col=n=>{let s='';while(n){n--;s=String.fromCharCode(65+n%26)+s;n=Math.floor(n/26)}return s};
function title(s,last,t,note,end=70){
 s.showGridLines=false;s.tabColor=C.rose;s.getRange(`A1:${last}${end}`).format={font:{name:'Arial',size:11,color:C.ink},rowHeight:25,verticalAlignment:'center'};
 s.getRange(`A2:${last}2`).merge();s.getRange('A2').values=[[t]];s.getRange(`A2:${last}2`).format={fill:C.pink,font:{name:'Arial',size:17,bold:true,color:C.rose},rowHeight:38};
 s.getRange(`A3:${last}3`).merge();s.getRange('A3').values=[[note]];s.getRange(`A3:${last}3`).format={wrapText:true,rowHeight:42,font:{name:'Arial',size:10,color:C.ink}};
 s.getRange(`A:${last}`).format.columnWidth=15;
}
function table(s,row,headers,end,widths,inputs){
 const last=col(headers.length);s.getRange(`A${row}:${last}${row}`).values=[headers];
 s.getRange(`A${row}:${last}${row}`).format={fill:C.rose,font:{name:'Arial',size:11,bold:true,color:'#FFFFFF'},wrapText:true,rowHeight:42};
 s.getRange(`A${row+1}:${last}${end}`).format.fill=C.calc;
 for(const r of inputs)s.getRange(r).format.fill=C.input;
 widths.forEach((v,i)=>s.getRange(`${col(i+1)}:${col(i+1)}`).format.columnWidth=v);
 s.freezePanes.freezeRows(row);
}
function fill(s,c,from,to,fn){s.getRange(`${c}${from}:${c}${to}`).formulas=Array.from({length:to-from+1},(_,i)=>[fn(i+from)]);}
function list(s,r,src){s.getRange(r).dataValidation={rule:{type:'list',...(Array.isArray(src)?{values:src}:{formula1:src})}};}
function warn(s,r,c){s.getRange(r).conditionalFormats.addCustom(`AND($${c}${r.match(/\d+/)[0]}<>"",$${c}${r.match(/\d+/)[0]}<>"Đủ dữ liệu")`,{fill:C.red,font:{color:'#922640'}})}
const unitList=['g','ml','cái','miếng'];
title(raw,'I','NGUYÊN LIỆU VÀ BAO BÌ','Nhập lượng thực dùng được sau sơ chế. Đã trừ hao hụt ở lượng này thì không cộng hao hụt lần nữa. Giá minh họa, hãy thay bằng giá của bạn.',rawEnd);
table(raw,5,['Mã cố định','Tên nguyên liệu / bao bì','Nhóm','Tiền đã trả (đ)','Lượng dùng được','Đơn vị','Ngày cập nhật','Giá / đơn vị','Kiểm tra'],rawEnd,[14,27,17,17,17,12,16,17,27],['A6:G205']);
const pack=[18,19,20,32,33,34];
const idByName={};
raw.getRange('A6:G55').values=data.ingredients.map((v,i)=>{let id='NL'+String(i+1).padStart(3,'0');idByName[v[0]]=id;return [id,v[0],pack.includes(i+1)?'Bao bì':'Nguyên liệu',v[1],v[2],v[3],new Date('2026-10-10T00:00:00Z')]});
list(raw,'C6:C205',['Nguyên liệu','Bao bì']);list(raw,'F6:F205',unitList);
raw.getRange('G6:G205').setNumberFormat('dd/mm/yyyy');raw.getRange('D6:E205').setNumberFormat('#,##0.##');raw.getRange('H6:H205').setNumberFormat('#,##0.00');
fill(raw,'I',6,rawEnd,r=>`=IF(COUNTA(A${r}:G${r})=0,"",IF(A${r}="","Thiếu mã",IF(COUNTIFS($A$6:$A$205,A${r})<>1,"Trùng mã",IF(OR(B${r}="",AND(C${r}<>"Nguyên liệu",C${r}<>"Bao bì")),"Thiếu tên / nhóm",IF(OR(NOT(ISNUMBER(D${r})),D${r}<0),"Thiếu / sai giá",IF(OR(NOT(ISNUMBER(E${r})),E${r}<=0),"Lượng phải > 0",IF(AND(F${r}<>"g",F${r}<>"ml",F${r}<>"cái",F${r}<>"miếng"),"Sai đơn vị","Đủ dữ liệu")))))))`);
fill(raw,'H',6,rawEnd,r=>`=IF(I${r}="Đủ dữ liệu",D${r}/E${r},"")`);
fill(raw,'J',6,rawEnd,r=>`=IF(A${r}="","",COUNTA($A$6:A${r}))`);
warn(raw,'I6:I205','I');

title(batch,'I','MẺ VÀ BÁN THÀNH PHẨM','Khai báo mẻ ở bảng trên; thành phần ở dòng 32 trở xuống. Một tầng mẻ, chỉ dùng nguyên liệu gốc. Lượng thực thu đã phản ánh hao hụt.',blEnd);
table(batch,5,['Mã mẻ','Tên bán thành phẩm','Lượng thực thu','Đơn vị','Phụ phí / mẻ (đ)','Tổng mẻ (đ)','Giá / đơn vị','Kiểm tra','Thứ tự'],batchEnd,[14,27,18,14,18,17,17,28,13],['A6:E25']);
batch.getRange('A6:E7').values=[['ME001','Trà đen đã ủ',1800,'ml',0],['ME002','Syrup đường nấu',1500,'ml',0]];
list(batch,'D6:D25',unitList);
table(batch,31,['Mã mẻ','Tên mẻ','Mã nguyên liệu','Tên nguyên liệu','Định lượng','Đơn vị','Giá / đơn vị','Thành tiền (đ)','Kiểm tra'],blEnd,[14,27,18,27,18,12,17,20,29],['A32:A231','C32:C231','E32:E231']);batch.freezePanes.freezeRows(5);
batch.getRange('A32:A35').values=[['ME001'],['ME001'],['ME002'],['ME002']];batch.getRange('C32:C35').values=[['NL005'],['NL044'],['NL004'],['NL044']];batch.getRange('E32:E35').values=[[100],[2000],[1000],[1000]];
list(batch,'A32:A231',"'MẺ'!$A$6:$A$25");list(batch,'C32:C231',"'NGUYÊN LIỆU'!$A$6:$A$205");
const rawLookup=(r,c,key='C')=>`INDEX(${rr('NGUYÊN LIỆU',c)},MATCH(${key}${r},${rr('NGUYÊN LIỆU','A')},0))`;
for(const [c,src] of [['D','B'],['F','F'],['G','H']])fill(batch,c,blStart,blEnd,r=>`=IF(OR(C${r}="",COUNTIFS(${rr('NGUYÊN LIỆU','A')},C${r})<>1),"",${rawLookup(r,src)})`);
fill(batch,'B',blStart,blEnd,r=>`=IF(OR(A${r}="",COUNTIFS($A$6:$A$25,A${r})<>1),"",INDEX($B$6:$B$25,MATCH(A${r},$A$6:$A$25,0)))`);
fill(batch,'I',blStart,blEnd,r=>`=IF(COUNTA(A${r},C${r},E${r})=0,"",IF(OR(A${r}="",COUNTIFS($A$6:$A$25,A${r})<>1),"Sai / thiếu mã mẻ",IF(OR(C${r}="",COUNTIFS(${rr('NGUYÊN LIỆU','A')},C${r})<>1),"Sai / thiếu nguyên liệu",IF(${rawLookup(r,'I')}<>"Đủ dữ liệu","Sửa danh mục nguyên liệu",IF(${rawLookup(r,'C')}<>"Nguyên liệu","Mẻ chỉ dùng nguyên liệu",IF(OR(NOT(ISNUMBER(E${r})),E${r}<=0),"Định lượng phải > 0","Đủ dữ liệu"))))))`);
fill(batch,'H',blStart,blEnd,r=>`=IF(I${r}="Đủ dữ liệu",E${r}*G${r},"")`);
fill(batch,'H',6,batchEnd,r=>`=IF(COUNTA(A${r}:E${r})=0,"",IF(OR(A${r}="",B${r}=""),"Thiếu mã / tên",IF(OR(COUNTIFS($A$6:$A$25,A${r})<>1,COUNTIFS(${rr('NGUYÊN LIỆU','A')},A${r})>0),"Trùng mã",IF(OR(NOT(ISNUMBER(C${r})),C${r}<=0),"Lượng thu phải > 0",IF(AND(D${r}<>"g",D${r}<>"ml",D${r}<>"cái",D${r}<>"miếng"),"Sai đơn vị",IF(OR(NOT(ISNUMBER(E${r})),E${r}<0),"Nhập phụ phí, 0 nếu không",IF(COUNTIFS($A$32:$A$231,A${r})=0,"Chưa có công thức",IF(COUNTIFS($A$32:$A$231,A${r},$I$32:$I$231,"<>Đủ dữ liệu")>0,"Sửa thành phần mẻ","Đủ dữ liệu"))))))))`);
fill(batch,'F',6,batchEnd,r=>`=IF(H${r}="Đủ dữ liệu",SUMIFS($H$32:$H$231,$A$32:$A$231,A${r})+E${r},"")`);
fill(batch,'G',6,batchEnd,r=>`=IF(H${r}="Đủ dữ liệu",F${r}/C${r},"")`);fill(batch,'J',6,batchEnd,r=>`=IF(A${r}="","",COUNTA($A$6:A${r}))`);batch.getRange('I5:I25').clear({applyTo:'contents'});
batch.getRange('E6:G25').setNumberFormat('#,##0.00');batch.getRange('E32:H231').setNumberFormat('#,##0.00');warn(batch,'H6:H25','H');warn(batch,'I32:I231','I');

title(recipe,'J','CÔNG THỨC TỪNG MÓN','Mỗi thành phần một dòng: chọn mã món, mã nguyên liệu/mẻ và định lượng. Bao bì cũng nhập ở đây, tổng được tách riêng. Có 600 dòng thành phần.',lineEnd);
table(recipe,5,['Mã món','Tên món','Mã thành phần','Tên thành phần','Định lượng','Đơn vị','Giá / đơn vị','Thành tiền (đ)','Nhóm','Kiểm tra'],lineEnd,[14,25,17,27,15,11,17,18,17,28],['A6:A605','C6:C605','E6:E605']);
// Compact source list on this sheet; codes are stable even when names change.
recipe.getRange('AA5:AF5').values=[['Mã','Tên','Đơn vị','Giá / đơn vị','Nhóm','Kiểm tra']];
for(let r=6;r<=catEnd;r++){
 const n=r-5,rawCount=`COUNTA(${rr('NGUYÊN LIỆU','A')})`,batchCount=`COUNTA(${rr('MẺ','A',6,batchEnd)})`;
 for(const [c,rc,bc] of [['AA','A','A'],['AB','B','B'],['AC','F','D'],['AD','H','G'],['AE','C',null],['AF','I','H']]){
 const vraw=`INDEX(${rr('NGUYÊN LIỆU',rc)},MATCH(${n},${rr('NGUYÊN LIỆU','J')},0))`;
 const vb=bc?`INDEX(${rr('MẺ',bc,6,batchEnd)},MATCH(${n}-${rawCount},${rr('MẺ','J',6,batchEnd)},0))`:'"Nguyên liệu"';
 recipe.getRange(`${c}${r}`).formulas=[[`=IF(${n}<=${rawCount},${vraw},IF(${n}<=${rawCount}+${batchCount},${vb},""))`]];
 }
}
list(recipe,'A6:A605',"'MÓN'!$A$6:$A$65");list(recipe,'C6:C605','$AA$6:$AA$225');
const lk=(r,c)=>`INDEX($${c}$6:$${c}$225,MATCH(C${r},$AA$6:$AA$225,0))`;
for(const [c,src] of [['D','AB'],['F','AC'],['G','AD'],['I','AE']])fill(recipe,c,6,lineEnd,r=>`=IF(OR(C${r}="",COUNTIFS($AA$6:$AA$225,C${r})<>1),"",${lk(r,src)})`);
fill(recipe,'B',6,lineEnd,r=>`=IF(OR(A${r}="",COUNTIFS(${rr('MÓN','A',6,menuEnd)},A${r})<>1),"",INDEX(${rr('MÓN','B',6,menuEnd)},MATCH(A${r},${rr('MÓN','A',6,menuEnd)},0)))`);
fill(recipe,'J',6,lineEnd,r=>`=IF(COUNTA(A${r},C${r},E${r})=0,"",IF(OR(A${r}="",COUNTIFS(${rr('MÓN','A',6,menuEnd)},A${r})<>1),"Sai / thiếu mã món",IF(OR(C${r}="",COUNTIFS($AA$6:$AA$225,C${r})<>1),"Sai / thiếu thành phần",IF(${lk(r,'AF')}<>"Đủ dữ liệu","Sửa nguyên liệu / mẻ",IF(OR(NOT(ISNUMBER(E${r})),E${r}<=0),"Định lượng phải > 0","Đủ dữ liệu")))))`);
fill(recipe,'H',6,lineEnd,r=>`=IF(J${r}="Đủ dữ liệu",E${r}*G${r},"")`);
recipe.getRange('E6:H605').setNumberFormat('#,##0.00');warn(recipe,'J6:J605','J');

title(menu,'K','GIÁ COST TỪNG MÓN','Nhập mã, tên/size, đơn vị bán, giá bán và chi phí khác mỗi món (0 nếu không). Mỗi mã là một món/size. Tiền còn lại chưa trừ toàn bộ chi phí vận hành.',menuEnd);
table(menu,5,['Mã cố định','Tên món / size','Đơn vị bán','Giá bán (đ)','Chi khác / món (đ)','Nguyên liệu (đ)','Bao bì (đ)','Tổng cost (đ)','Tỷ lệ cost','Còn lại (đ)','Kiểm tra cost'],menuEnd,[14,28,12,16,17,17,15,17,14,17,28],['A6:E65']);
const menuData=data.menu.map(p=>({name:p[0],unit:p[1],price:p[2],items:p[3].map(([n,q])=>[idByName[n],q])}));
menuData.push({name:'Trà sữa mẻ 500 ml',unit:'ly',price:35000,items:[['ME001',150],['ME002',20],['NL003',100],['NL002',20],['NL013',40],['NL014',20],['NL009',15],['NL045',150],['NL018',1],['NL019',1],['NL020',1]]});
menuData.push({name:'Trà đào mẻ 500 ml',unit:'ly',price:32000,items:[['ME001',180],['ME002',20],['NL010',20],['NL012',2],['NL045',150],['NL018',1],['NL019',1],['NL020',1]]});
menuData.push({name:'Matcha latte lớn',unit:'ly',price:42000,items:[['NL008',12],['NL003',220],['NL002',25],['NL045',180],['NL018',1],['NL019',1],['NL020',1]]});
menu.getRange(`A6:E${5+menuData.length}`).values=menuData.map((p,i)=>['M'+String(i+1).padStart(3,'0'),p.name,p.unit,p.price,0]);
let lines=[];menuData.forEach((p,i)=>p.items.forEach(([code,qty])=>lines.push(['M'+String(i+1).padStart(3,'0'),null,code,null,qty])));
recipe.getRange(`A6:E${5+lines.length}`).values=lines;
// Reapply calculated name columns cleared by the rectangular sample write.
fill(recipe,'B',6,lineEnd,r=>`=IF(OR(A${r}="",COUNTIFS(${rr('MÓN','A',6,menuEnd)},A${r})<>1),"",INDEX(${rr('MÓN','B',6,menuEnd)},MATCH(A${r},${rr('MÓN','A',6,menuEnd)},0)))`);
fill(recipe,'D',6,lineEnd,r=>`=IF(OR(C${r}="",COUNTIFS($AA$6:$AA$225,C${r})<>1),"",${lk(r,'AB')})`);
list(menu,'C6:C65',['ly','phần','cái','chai','hộp']);
fill(menu,'K',6,menuEnd,r=>`=IF(COUNTA(A${r}:E${r})=0,"",IF(OR(A${r}="",B${r}="",C${r}=""),"Thiếu mã / tên / đơn vị",IF(COUNTIFS($A$6:$A$65,A${r})<>1,"Trùng mã món",IF(OR(NOT(ISNUMBER(E${r})),E${r}<0),"Nhập chi khác, 0 nếu không",IF(COUNTIFS(${rr('CÔNG THỨC','A',6,lineEnd)},A${r})=0,"Chưa có công thức",IF(COUNTIFS(${rr('CÔNG THỨC','A',6,lineEnd)},A${r},${rr('CÔNG THỨC','J',6,lineEnd)},"<>Đủ dữ liệu")>0,"Sửa thành phần món","Đủ dữ liệu"))))))`);
for(const [c,type] of [['F','Nguyên liệu'],['G','Bao bì']])fill(menu,c,6,menuEnd,r=>`=IF(K${r}="Đủ dữ liệu",SUMIFS(${rr('CÔNG THỨC','H',6,lineEnd)},${rr('CÔNG THỨC','A',6,lineEnd)},A${r},${rr('CÔNG THỨC','I',6,lineEnd)},"${type}"),"")`);
fill(menu,'H',6,menuEnd,r=>`=IF(K${r}="Đủ dữ liệu",SUM(E${r}:G${r}),"")`);
fill(menu,'I',6,menuEnd,r=>`=IF(AND(K${r}="Đủ dữ liệu",ISNUMBER(D${r}),D${r}>0),H${r}/D${r},"")`);
fill(menu,'J',6,menuEnd,r=>`=IF(AND(K${r}="Đủ dữ liệu",ISNUMBER(D${r}),D${r}>0),D${r}-H${r},"")`);
fill(menu,'L',6,menuEnd,r=>`=IF(K${r}="Đủ dữ liệu",COUNTIFS($H$6:$H$65,">"&H${r},$K$6:$K$65,"Đủ dữ liệu")+COUNTIFS($H$6:H${r},H${r},$K$6:K${r},"Đủ dữ liệu"),"")`);
menu.getRange('D6:H65').setNumberFormat('#,##0');menu.getRange('I6:I65').setNumberFormat('0.0%');menu.getRange('J6:J65').setNumberFormat('#,##0');warn(menu,'K6:K65','K');menu.getRange('J6:J65').conditionalFormats.add('cellIs',{operator:'lessThan',formula:0,format:{fill:C.red}});

title(dash,'L','TỔNG QUAN GIÁ COST','Tất cả 60 vị trí món được tổng hợp. Biểu đồ lấy 8 món cost cao nhất đã đủ dữ liệu; bảng chi tiết bên dưới hiển thị toàn bộ danh sách.',105);
for(const [range,label,formula] of [
 ['A5:C5','MÓN ĐÃ KHAI BÁO',`=COUNTA(${rr('MÓN','A',6,menuEnd)})`],
 ['D5:F5','MÓN ĐỦ DỮ LIỆU',`=COUNTIFS(${rr('MÓN','K',6,menuEnd)},"Đủ dữ liệu")`],
 ['G5:I5','MÓN CẦN SỬA',`=COUNTIFS(${rr('MÓN','K',6,menuEnd)},"?*",${rr('MÓN','K',6,menuEnd)},"<>Đủ dữ liệu")`],
 ['J5:L5','DÒNG THÀNH PHẦN LỖI',`=COUNTIFS(${rr('CÔNG THỨC','J',6,lineEnd)},"?*",${rr('CÔNG THỨC','J',6,lineEnd)},"<>Đủ dữ liệu")+COUNTIFS(${rr('MẺ','I',blStart,blEnd)},"?*",${rr('MẺ','I',blStart,blEnd)},"<>Đủ dữ liệu")`]]){
 dash.getRange(range).merge();dash.getRange(range.split(':')[0]).values=[[label]];dash.getRange(range).format={fill:C.pink,wrapText:true,rowHeight:36,font:{bold:true,color:C.rose}};
 const nr=range.replaceAll('5','6');dash.getRange(nr).merge();dash.getRange(nr.split(':')[0]).formulas=[[formula]];dash.getRange(nr).format={fill:C.calc,rowHeight:35,font:{name:'Arial',size:17,bold:true,color:C.rose}};
}
dash.getRange('AA5:AE5').values=[['Món','Nguyên liệu (đ)','Bao bì (đ)','Khác (đ)','Cost (đ)']];
for(let r=6;r<=13;r++)for(const [dst,src] of [['AA','B'],['AB','F'],['AC','G'],['AD','E'],['AE','H']])dash.getRange(`${dst}${r}`).formulas=[[`=IF(${r-5}>$D$6,"",INDEX(${rr('MÓN',src,6,menuEnd)},MATCH(${r-5},${rr('MÓN','L',6,menuEnd)},0)))`]];
for(const [range,t,a,b] of [['AA5:AE13','8 món cost cao nhất (đ)','A9','L25']]){
 const ch=dash.charts.add('bar',[dash.getRange('AA5:AA13'),dash.getRange('AE5:AE13')]);ch.title=t;ch.hasLegend=false;ch.titleTextStyle.typeface='Arial';ch.titleTextStyle.fontSize=14;ch.series.items[0].fill=C.rose;ch.xAxis={numberFormatCode:'#,##0',numberFormatSourceLinked:false,textStyle:{typeface:'Arial',fontSize:11}};ch.yAxis={textStyle:{typeface:'Arial',fontSize:11}};ch.setPosition(a,b);
}
const ch=dash.charts.add('bar',dash.getRange('AA5:AD13'));ch.title='Thành phần cost của 8 món trên (đ)';ch.titleTextStyle.typeface='Arial';ch.titleTextStyle.fontSize=14;ch.legend={position:'bottom',textStyle:{typeface:'Arial'}};ch.series.items.forEach((s,i)=>s.fill=[C.rose,'#8FBFA8','#B4A3CF'][i]);ch.setPosition('A27','L44');
table(dash,47,['Mã món','Tên / size','Đơn vị','Giá bán (đ)','Chi khác (đ)','Nguyên liệu (đ)','Bao bì (đ)','Cost (đ)','Tỷ lệ cost','Còn lại (đ)','Kiểm tra'],107,[14,27,12,15,15,16,15,16,13,16,27],[]);dash.freezePanes.unfreeze();
for(let r=48;r<=107;r++)for(let c=1;c<=11;c++)dash.getRange(`${col(c)}${r}`).formulas=[[`=IF('MÓN'!A${r-42}="","",IF('MÓN'!${col(c)}${r-42}="","",'MÓN'!${col(c)}${r-42}))`]];
dash.getRange('D48:H107').setNumberFormat('#,##0');dash.getRange('I48:I107').setNumberFormat('0.0%');dash.getRange('J48:J107').setNumberFormat('#,##0');

title(start,'H','FILE ĐI LÀM — GIÁ COST MÓN','Bản 5.0 • Dữ liệu minh họa • Mỗi món được tính theo một đơn vị bán',35);
start.getRange('A:H').format.columnWidth=15;
const guide=[
 ['1. NGUYÊN LIỆU','Nhập mã cố định, tên, nhóm, tiền mua, lượng dùng được và đơn vị. Ví dụ 220.000đ / 800 g = 275đ/g.'],
 ['2. MẺ (nếu có)','Nhập lượng thực thu ở bảng trên; chọn nguyên liệu và lượng nấu ở bảng dưới. Mẻ không dùng mẻ khác.'],
 ['3. MÓN','Tạo mã món/size, đơn vị bán, giá bán tham khảo và chi khác mỗi món. Nhập 0 nếu không có chi khác.'],
 ['4. CÔNG THỨC','Mỗi dòng chọn mã món + mã thành phần + định lượng. Tên và đơn vị tự hiện. Bao bì nhập một lần như thành phần.'],
 ['5. XEM KẾT QUẢ','Xem cost tại MÓN và TỔNG QUAN. Dòng lỗi có nền đỏ; sửa đủ dữ liệu trước khi dùng kết quả.'],
 ['Màu ô','Hồng: bạn nhập/chọn. Xanh nhạt: tự tính. Đỏ: cần sửa. Mã giữ nguyên; có thể đổi tên.'],
 ['Đơn vị và hao hụt','Nhập lượng đã quy về g/ml/cái/miếng. Không coi g = ml. Lượng dùng được và lượng thực thu đã trừ hao hụt.'],
 ['Phạm vi','200 nguyên liệu/bao bì; 20 mẻ và 200 dòng mẻ; 60 món; 600 dòng thành phần món. Không kho, FIFO hoặc mẻ nhiều tầng.'],
 ['Thêm và sắp xếp','Điền dòng trống trong vùng đã chuẩn bị. Lọc để tìm món. Giữ mã cố định; nếu sắp xếp phải sắp cả bảng, không riêng một cột.'],
 ['Giá và số tiền còn lại','Cost gồm nguyên liệu + bao bì + chi khác đã nhập. Còn lại = giá bán − cost; chưa phải lợi nhuận ròng. Giá bán trống/sai thì không tính tỷ lệ.'],
 ['Làm bản sạch','Xóa nội dung ô hồng của món và công thức, sau đó mẻ/danh mục nếu cần. Không xóa ô xanh hoặc cả hàng/cột. Giữ bản sao trước khi xóa.'],
 ['Mở rộng sức chứa','Không nhập ngoài vùng hỗ trợ. Cần mở rộng đồng bộ công thức, nguồn dropdown và báo cáo trước khi vượt giới hạn.'],
 ['Ví dụ đối chiếu','Cà phê sữa mẫu: 30 g × 275đ + 35 ml × 58đ + ly 600đ + nắp 280đ + ống hút 180đ = 11.340đ.'],
 ['Ví dụ mẻ','Trà đen: 100 g × 180đ + 2.000 ml nước × 4đ = 26.000đ / 1.800 ml thực thu = 14,4444đ/ml.'],
];
guide.forEach(([a,b],i)=>{let r=6+i*2;start.getRange(`A${r}:B${r+1}`).merge();start.getRange(`C${r}:H${r+1}`).merge();start.getRange(`A${r}`).values=[[a]];start.getRange(`C${r}`).values=[[b]];start.getRange(`A${r}:B${r+1}`).format={fill:C.pink,font:{bold:true,color:C.rose},wrapText:true};start.getRange(`C${r}:H${r+1}`).format={fill:i%2?C.calc:'#FFFFFF',wrapText:true};start.getRange(`A${r}:H${r+1}`).format.rowHeight=23});
raw.getRange('E:E').format.columnWidth=21;
console.log('built; recalculating');w.recalculate();
await fs.writeFile(out+'/inspection.json',(await w.inspect({kind:'region',sheetId:'MÓN',range:'A5:K19',maxChars:7000,tableMaxRows:15,tableMaxCols:11})).ndjson);
console.log('exporting');await (await SpreadsheetFile.exportXlsx(w)).save(out+'/File_Di_Lam_Cost_Mon_v5.xlsx');
for(const [n,range] of [['BẮT ĐẦU','A2:H33'],['NGUYÊN LIỆU','A2:I16'],['MẺ','A2:I12'],['MẺ','A29:I38'],['CÔNG THỨC','A2:J16'],['MÓN','A2:K19'],['TỔNG QUAN','A2:L44']]){
 console.log('render',n,range);const img=await w.render({sheetName:n,range,scale:1,format:'png'});await fs.writeFile(out+'/'+n.replaceAll(' ','_')+'_'+range.split(':')[0]+'.png',new Uint8Array(await img.arrayBuffer()));
}
await fs.writeFile(out+'/build_manifest.json',JSON.stringify({version:'5.0',date:'10/10/2026',capacity:{ingredients:200,batches:20,batchLines:200,menu:60,recipeLines:600},samples:{ingredients:50,menu:menuData.length,batches:2,recipeLines:lines.length},uiVerification:'pending',output:out+'/File_Di_Lam_Cost_Mon_v5.xlsx'},null,2));
console.log('DONE '+out);
