from __future__ import annotations

from copy import copy
from pathlib import Path
import json

from openpyxl import load_workbook
from openpyxl.chart import BarChart, DoughnutChart, LineChart, Reference
from openpyxl.styles import Alignment, Border, Font, PatternFill, Protection, Side
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import FormulaRule
from openpyxl.formula.translate import Translator
from openpyxl.utils import get_column_letter
from openpyxl.workbook.properties import CalcProperties

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'outputs/tinh_cost_da_nganh_v1.xlsx'
OUTPUT = ROOT / 'outputs/tinh_cost_da_nganh_v2.xlsx'
TEAL, DARK, PALE, INPUT, WARN = '0F766E', '123B3A', 'E8F5F1', 'EAF3FF', 'FDE8E8'
WHITE = 'FFFFFF'
wb = load_workbook(SOURCE)
wb.calculation = CalcProperties(calcMode='auto', fullCalcOnLoad=True, forceFullCalc=True)
guide = wb['BẮT ĐẦU']
detail = wb['TỔNG QUAN']
detail.title = 'BẢNG COST'
detail.unmerge_cells('A38:F38')
for col in range(1,7): detail.cell(38,col).value=None
dashboard = wb.create_sheet('TỔNG QUAN', 1)
items, recipe, products = wb['ĐẦU VÀO'], wb['ĐỊNH MỨC'], wb['SẢN PHẨM']
prep = wb.create_sheet('BÁN THÀNH PHẨM', 5)
prep_recipe = wb.create_sheet('ĐM SƠ CHẾ', 6)
overhead = wb.create_sheet('CHI PHÍ CHUNG', 7)

def fill_formulas(sheet, cols: list[str], last: int, old_limits: dict[str, str]):
    for col in cols:
        source = sheet[f'{col}6']
        original = source.value
        for old, new in old_limits.items():
            original = original.replace(old, new)
        source.value = original
        for row in range(7, last + 1):
            dst = sheet[f'{col}{row}']
            dst.value = Translator(original, origin=f'{col}6').translate_formula(dst.coordinate)
            dst._style = copy(source._style)
            dst.protection = Protection(locked=True)

fill_formulas(items, ['J','K','L'], 1005, {'$A$55':'$A$1005'})
fill_formulas(recipe, ['E','F','G','H'], 5005, {'$A$55':'$A$1005','$B$55':'$B$1005','$I$55':'$I$1005','$K$55':'$K$1005','$L$55':'$L$1005','$A$35':'$A$505'})
fill_formulas(products, ['H','I','J','K','L'], 505, {'$A$105':'$A$5005','$F$105':'$F$5005','$H$105':'$H$5005','$A$35':'$A$505'})
fill_formulas(detail, ['A','B','C','D','E','F'], 505, {})

def input_area(sheet, start_col: int, end_col: int, last_row: int):
    for row in range(6, last_row+1):
        for col in range(start_col,end_col+1):
            c=sheet.cell(row,col)
            c.fill=PatternFill('solid', fgColor=INPUT)
            c.protection=Protection(locked=False)
            c.alignment=Alignment(vertical='center')

input_area(items,1,9,1005)
input_area(recipe,1,4,5005)
input_area(products,1,7,505)

def new_table(sheet, title, subtitle, headers, widths):
    sheet.sheet_view.showGridLines=False;sheet.freeze_panes='A6'
    end=get_column_letter(len(headers));sheet.merge_cells(f'A1:{end}2');sheet['A1']=title
    sheet['A1'].fill=PatternFill('solid',fgColor=TEAL);sheet['A1'].font=Font(name='Aptos Display',size=18,bold=True,color=WHITE)
    sheet.merge_cells(f'A3:{end}3');sheet['A3']=subtitle;sheet['A3'].fill=PatternFill('solid',fgColor=PALE)
    for c,h in enumerate(headers,1):
        x=sheet.cell(5,c);x.value=h;x.fill=PatternFill('solid',fgColor=DARK);x.font=Font(name='Aptos',bold=True,color=WHITE);x.alignment=Alignment(wrap_text=True,vertical='center')
    sheet.row_dimensions[5].height=38
    for i,width in enumerate(widths,1):sheet.column_dimensions[get_column_letter(i)].width=width

new_table(prep,'BÁN THÀNH PHẨM • MẺ SƠ CHẾ','Ví dụ: trà nền nấu thành 200 ml rồi dùng tiếp trong đồ uống. Chỉ nhận đầu vào gốc, không lồng nhiều tầng.',['Mã sơ chế','Tên bán thành phẩm','Lượng thu được / mẻ','Đơn vị cơ sở','Cost đầu vào / mẻ','Cost / đơn vị','Số dòng định mức','Kiểm tra'],[18,28,22,17,22,20,20,22])
new_table(prep_recipe,'ĐỊNH MỨC SƠ CHẾ','Mỗi dòng lấy một nguyên liệu gốc cho một mẻ bán thành phẩm.',['Mã sơ chế','Mã đầu vào','Lượng dùng / mẻ','Đơn vị cơ sở','Cost / đơn vị','Cost dòng','Tên đầu vào','Kiểm tra'],[18,18,21,17,20,19,26,21])
new_table(overhead,'CHI PHÍ CHUNG • PHÂN BỔ','Nhập chi phí cố định theo tháng và sản lượng dự kiến cùng tháng; cost đầy đủ = cost trực tiếp + phần phân bổ.',['Nhóm ngành','Chi phí chung / tháng','Sản lượng dự kiến / tháng','Phân bổ / đơn vị','Kiểm tra'],[19,26,29,22,22])

input_area(prep,1,4,205);input_area(prep_recipe,1,4,1005);input_area(overhead,1,3,105)
prep['A6']='BT001';prep['B6']='Trà nền';prep['C6']=200;prep['D6']='ml'
prep_recipe['A6']='BT001';prep_recipe['B6']='NV001';prep_recipe['C6']=20;prep_recipe['D6']='g'
for r in range(6,206):
    prep[f'E{r}']=f'=IF(A{r}="","",SUMIF(\'ĐM SƠ CHẾ\'!$A$6:$A$1005,A{r},\'ĐM SƠ CHẾ\'!$F$6:$F$1005))'
    prep[f'F{r}']=f'=IF(A{r}="","",IF(H{r}<>"OK","",E{r}/C{r}))'
    prep[f'G{r}']=f'=IF(A{r}="","",COUNTIF(\'ĐM SƠ CHẾ\'!$A$6:$A$1005,A{r}))'
    prep[f'H{r}']=f'=IF(A{r}="","",IF(COUNTIF($A$6:$A$205,A{r})>1,"TRÙNG MÃ",IF(OR(B{r}="",NOT(ISNUMBER(C{r})),D{r}=""),"THIẾU DỮ LIỆU",IF(C{r}<=0,"SAI SẢN LƯỢNG",IF(G{r}=0,"THIẾU ĐỊNH MỨC",IF(COUNTIFS(\'ĐM SƠ CHẾ\'!$A$6:$A$1005,A{r},\'ĐM SƠ CHẾ\'!$H$6:$H$1005,"<>OK")>0,"KIỂM TRA ĐỊNH MỨC","OK"))))))'
    for col in 'EFGH':prep[f'{col}{r}'].protection=Protection(locked=True)
for r in range(6,1006):
    prep_recipe[f'E{r}']=f'=IF(B{r}="","",IF(COUNTIF(\'ĐẦU VÀO\'!$A$6:$A$1005,B{r})<>1,"",SUMIF(\'ĐẦU VÀO\'!$A$6:$A$1005,B{r},\'ĐẦU VÀO\'!$K$6:$K$1005)))'
    prep_recipe[f'F{r}']=f'=IF(A{r}="","",IF(OR(NOT(ISNUMBER(C{r})),NOT(ISNUMBER(E{r}))),"",C{r}*E{r}))'
    prep_recipe[f'G{r}']=f'=IF(B{r}="","",IF(COUNTIF(\'ĐẦU VÀO\'!$A$6:$A$1005,B{r})<>1,"",INDEX(\'ĐẦU VÀO\'!$B$6:$B$1005,MATCH(B{r},\'ĐẦU VÀO\'!$A$6:$A$1005,0))))'
    prep_recipe[f'H{r}']=f'=IF(A{r}="","",IF(COUNTIF(\'BÁN THÀNH PHẨM\'!$A$6:$A$205,A{r})<>1,"MÃ SƠ CHẾ LỖI",IF(COUNTIF(\'ĐẦU VÀO\'!$A$6:$A$1005,B{r})<>1,"MÃ ĐẦU VÀO LỖI",IF(OR(NOT(ISNUMBER(C{r})),C{r}<0),"LƯỢNG LỖI",IF(D{r}<>INDEX(\'ĐẦU VÀO\'!$I$6:$I$1005,MATCH(B{r},\'ĐẦU VÀO\'!$A$6:$A$1005,0)),"SAI ĐƠN VỊ",IF(INDEX(\'ĐẦU VÀO\'!$L$6:$L$1005,MATCH(B{r},\'ĐẦU VÀO\'!$A$6:$A$1005,0))<>"OK","ĐẦU VÀO LỖI","OK"))))))'
    for col in 'EFGH':prep_recipe[f'{col}{r}'].protection=Protection(locked=True)

# Một giá đầu vào trong định mức thành phẩm có thể là nguyên liệu gốc hoặc bán thành phẩm một tầng.
for r in range(6,5006):
    recipe[f'E{r}']=f'=IF(B{r}="","",IF(COUNTIF(\'ĐẦU VÀO\'!$A$6:$A$1005,B{r})=1,SUMIF(\'ĐẦU VÀO\'!$A$6:$A$1005,B{r},\'ĐẦU VÀO\'!$K$6:$K$1005),IF(COUNTIF(\'BÁN THÀNH PHẨM\'!$A$6:$A$205,B{r})=1,SUMIF(\'BÁN THÀNH PHẨM\'!$A$6:$A$205,B{r},\'BÁN THÀNH PHẨM\'!$F$6:$F$205),"")))'
    recipe[f'G{r}']=f'=IF(B{r}="","",IF(COUNTIF(\'ĐẦU VÀO\'!$A$6:$A$1005,B{r})=1,INDEX(\'ĐẦU VÀO\'!$B$6:$B$1005,MATCH(B{r},\'ĐẦU VÀO\'!$A$6:$A$1005,0)),IF(COUNTIF(\'BÁN THÀNH PHẨM\'!$A$6:$A$205,B{r})=1,INDEX(\'BÁN THÀNH PHẨM\'!$B$6:$B$205,MATCH(B{r},\'BÁN THÀNH PHẨM\'!$A$6:$A$205,0)),"")))'
    recipe[f'H{r}']=f'=IF(A{r}="","",IF(COUNTIF(\'SẢN PHẨM\'!$A$6:$A$505,A{r})<>1,"MÃ SP LỖI",IF(OR(COUNTIF(\'ĐẦU VÀO\'!$A$6:$A$1005,B{r})+COUNTIF(\'BÁN THÀNH PHẨM\'!$A$6:$A$205,B{r})<>1,NOT(ISNUMBER(E{r}))),"MÃ ĐẦU VÀO LỖI",IF(OR(NOT(ISNUMBER(C{r})),C{r}<0),"LƯỢNG LỖI",IF(D{r}<>IF(COUNTIF(\'ĐẦU VÀO\'!$A$6:$A$1005,B{r})=1,INDEX(\'ĐẦU VÀO\'!$I$6:$I$1005,MATCH(B{r},\'ĐẦU VÀO\'!$A$6:$A$1005,0)),INDEX(\'BÁN THÀNH PHẨM\'!$D$6:$D$205,MATCH(B{r},\'BÁN THÀNH PHẨM\'!$A$6:$A$205,0))),"SAI ĐƠN VỊ",IF(IF(COUNTIF(\'ĐẦU VÀO\'!$A$6:$A$1005,B{r})=1,INDEX(\'ĐẦU VÀO\'!$L$6:$L$1005,MATCH(B{r},\'ĐẦU VÀO\'!$A$6:$A$1005,0)),INDEX(\'BÁN THÀNH PHẨM\'!$H$6:$H$205,MATCH(B{r},\'BÁN THÀNH PHẨM\'!$A$6:$A$205,0)))<>"OK","ĐẦU VÀO LỖI","OK"))))))'

products['A13']='SP008';products['B13']='Trà sữa dùng trà nền';products['C13']='Pha chế';products['D13']=1;products['E13']='ly';products['F13']=600;products['G13']=0
for row,vals in enumerate([('SP008','BT001',150,'ml'),('SP008','NV002',200,'ml'),('SP008','NV003',30,'g')],24):
    for col,val in enumerate(vals,1):recipe.cell(row,col).value=val

for r,sector in enumerate(['Pha chế','Món ăn','Handmade','Dịch vụ','Bán lẻ'],6):
    overhead[f'A{r}']=sector;overhead[f'B{r}']=[3000000,5000000,1000000,2000000,500000][r-6];overhead[f'C{r}']=[1000,1200,300,200,500][r-6]
for r in range(6,106):
    overhead[f'D{r}']=f'=IF(A{r}="","",IF(OR(NOT(ISNUMBER(B{r})),NOT(ISNUMBER(C{r})),C{r}<=0),"",B{r}/C{r}))'
    overhead[f'E{r}']=f'=IF(A{r}="","",IF(COUNTIF($A$6:$A$105,A{r})>1,"TRÙNG NHÓM",IF(OR(NOT(ISNUMBER(B{r})),NOT(ISNUMBER(C{r}))),"THIẾU DỮ LIỆU",IF(OR(B{r}<0,C{r}<=0),"SAI GIÁ TRỊ","OK"))))'
    for col in 'DE':overhead[f'{col}{r}'].protection=Protection(locked=True)
    for col in 'BCD':overhead[f'{col}{r}'].number_format='#,##0.00'
products['M5']='Chi phí chung / đơn vị';products['N5']='Cost đầy đủ / đơn vị';products['O5']='Kiểm tra cost đầy đủ'
for col in 'MNO':products[f'{col}5'].fill=PatternFill('solid',fgColor=DARK);products[f'{col}5'].font=Font(bold=True,color=WHITE)
products.column_dimensions['M'].width=23;products.column_dimensions['N'].width=24;products.column_dimensions['O'].width=25
for r in range(6,506):
    products[f'M{r}']=f'=IF(A{r}="","",IF(O{r}<>"OK","",SUMIF(\'CHI PHÍ CHUNG\'!$A$6:$A$105,C{r},\'CHI PHÍ CHUNG\'!$D$6:$D$105)))'
    products[f'N{r}']=f'=IF(A{r}="","",IF(OR(NOT(ISNUMBER(J{r})),NOT(ISNUMBER(M{r}))),"",J{r}+M{r}))'
    products[f'O{r}']=f'=IF(A{r}="","",IF(L{r}<>"OK","COST TRỰC TIẾP LỖI",IF(COUNTIF(\'CHI PHÍ CHUNG\'!$A$6:$A$105,C{r})<>1,"THIẾU NHÓM CHI PHÍ",IF(INDEX(\'CHI PHÍ CHUNG\'!$E$6:$E$105,MATCH(C{r},\'CHI PHÍ CHUNG\'!$A$6:$A$105,0))<>"OK","CHI PHÍ CHUNG LỖI","OK"))))'
    products[f'M{r}'].number_format=products[f'N{r}'].number_format='#,##0.00'
    for col in 'MNO':products[f'{col}{r}'].protection=Protection(locked=True)

# Mẫu biến thể để người dùng thấy cách làm size và topping bằng mã thành phẩm riêng.
products['A11']='SP006'; products['B11']='Trà sữa size L'; products['C11']='Pha chế';products['D11']=1;products['E11']='ly';products['F11']=900;products['G11']=0
products['A12']='SP007'; products['B12']='Trà sữa size M không topping'; products['C12']='Pha chế';products['D12']=1;products['E12']='ly';products['F12']=600;products['G12']=0
extra=[('SP006','NV001',25,'g'),('SP006','NV002',300,'ml'),('SP006','NV003',40,'g'),('SP006','NV004',70,'g'),('SP007','NV001',20,'g'),('SP007','NV002',200,'ml'),('SP007','NV003',30,'g')]
for row,vals in enumerate(extra,17):
    for col,val in enumerate(vals,1): recipe.cell(row,col).value=val

def dropdown(sheet, range_, values=None, formula=None):
    dv=DataValidation(type='list')
    if values is not None: dv.formula1='"'+','.join(values)+'"'
    else: dv.formula1=formula
    dv.allow_blank=True; dv.errorTitle='Chọn từ danh sách'; dv.error='Vui lòng chọn một giá trị trong danh sách.'; dv.showErrorMessage=True
    dv.promptTitle='Chọn nhanh'; dv.prompt='Bấm mũi tên để chọn giá trị phù hợp.'; dv.showInputMessage=True
    sheet.add_data_validation(dv); dv.add(range_)

dropdown(items,'C6:C1005',['Pha chế','Món ăn','Handmade','Bán lẻ','Dịch vụ','Bao bì','Khác'])
dropdown(items,'E6:E1005',['kg','g','lít','ml','cái','hộp','thùng','phút','giờ','mét','m2'])
dropdown(items,'I6:I1005',['g','ml','cái','phút','mét','m2'])
dropdown(recipe,'A6:A5005',formula="'SẢN PHẨM'!$A$6:$A$505")
system=wb.create_sheet('HỆ THỐNG')
for r in range(6,1006):system[f'A{r}']=f'NV{r-5:03d}'
for r in range(1006,1206):system[f'A{r}']=f'BT{r-1005:03d}'
system.sheet_state='hidden';system.protection.sheet=True
dropdown(recipe,'B6:B5005',formula="'HỆ THỐNG'!$A$6:$A$1205")
dropdown(recipe,'D6:D5005',['g','ml','cái','phút','mét','m2'])
dropdown(products,'C6:C505',['Pha chế','Món ăn','Handmade','Bán lẻ','Dịch vụ','Khác'])
dropdown(products,'E6:E505',['ly','suất','cái','hũ','lượt','hộp','kg','m2'])
dropdown(prep,'D6:D205',['g','ml','cái','phút','mét','m2'])
dropdown(prep_recipe,'A6:A1005',formula="'BÁN THÀNH PHẨM'!$A$6:$A$205")
dropdown(prep_recipe,'B6:B1005',formula="'ĐẦU VÀO'!$A$6:$A$1005")
dropdown(prep_recipe,'D6:D1005',['g','ml','cái','phút','mét','m2'])
dropdown(overhead,'A6:A105',['Pha chế','Món ăn','Handmade','Bán lẻ','Dịch vụ','Khác'])

for sheet, status_col, last in [(items,'L',1005),(recipe,'H',5005),(products,'L',505),(prep,'H',205),(prep_recipe,'H',1005),(overhead,'E',105)]:
    status=f'{status_col}6:{status_col}{last}'
    sheet.conditional_formatting.add(status,FormulaRule(formula=[f'{status_col}6="OK"'],fill=PatternFill('solid',fgColor='DCFCE7'),font=Font(color='166534',bold=True)))
    sheet.conditional_formatting.add(status,FormulaRule(formula=[f'AND({status_col}6<>"",{status_col}6<>"OK")'],fill=PatternFill('solid',fgColor=WARN),font=Font(color='B91C1C',bold=True)))
for sheet,col,last,labels in [(items,'C',1005,['Pha chế','Món ăn','Handmade','Bán lẻ','Dịch vụ']), (products,'C',505,['Pha chế','Món ăn','Handmade','Bán lẻ','Dịch vụ'])]:
    colors=['DCFCE7','FFEDD5','FCE7F3','DBEAFE','EDE9FE']
    for label,color in zip(labels,colors):
        sheet.conditional_formatting.add(f'{col}6:{col}{last}',FormulaRule(formula=[f'{col}6="{label}"'],fill=PatternFill('solid',fgColor=color),font=Font(color=DARK,bold=True)))

for sh in [items,recipe,products,prep,prep_recipe,overhead,detail]:
    sh.sheet_view.showGridLines=False
    sh.freeze_panes='A6'
    sh.auto_filter.ref=f'A5:{get_column_letter(15 if sh==products else 12 if sh==items else 8 if sh in (recipe,prep,prep_recipe,detail) else 5)}{1005 if sh==items or sh==prep_recipe else 5005 if sh==recipe else 205 if sh==prep else 105 if sh==overhead else 505}'
    sh.protection.sheet=True
    sh.protection.selectUnlockedCells=False
    sh.protection.selectLockedCells=True
    sh.protection.autoFilter=False
    sh.protection.sort=False

# Bắt đầu: người mới theo được một ví dụ, thay vì đọc một bảng mô tả dài.
guide['A1']='FILE ĐI LÀM • TÍNH GIÁ COST ĐA NGÀNH'
guide['A3']='Bản 2.0 • Bắt đầu tại đây; trang TỔNG QUAN chỉ để xem dashboard'
guide['B9']='Mở BẢNG COST để xem từng cost và trạng thái; mở TỔNG QUAN để xem dashboard.'
guide['A19']='THỬ VỚI 1 LY TRÀ SỮA'
guide['B19']='Làm theo 4 bước dưới đây rồi đối chiếu kết quả.'
walk=[
 ('1','ĐẦU VÀO: tìm NV001, giá trà 180.000đ/kg; hao hụt 5%.'),
 ('2','ĐỊNH MỨC: tìm SP001, dùng trà 20g, sữa 200ml, đường 30g, trân châu 50g.'),
 ('3','SẢN PHẨM: SP001 ra 1 ly/mẻ, bao bì 600đ.'),
 ('4','BẢNG COST: kết quả mẫu 15.338,36đ/ly. Đổi giá trà rồi xem số tự cập nhật.')]
for r,(a,b) in enumerate(walk,20): guide[f'A{r}']=a;guide[f'B{r}']=b
guide['A25']='MÀU TRONG FILE';guide['B25']='Xanh nhạt = được nhập/chọn • Trắng = tự tính/khóa • Đỏ nhạt = cần sửa dữ liệu'
guide['A27']='SỨC CHỨA';guide['B27']='1.000 đầu vào • 5.000 dòng định mức • 500 thành phẩm; dropdown và công thức đã phủ đến dòng cuối.'
guide['A28']='PHẠM VI';guide['B28']='Tính cost trực tiếp và biến đổi. Giá bán đề xuất, chi phí cố định và hòa vốn thuộc file riêng.'
guide['A29']='BÁN THÀNH PHẨM';guide['B29']='Nếu có sơ chế (ví dụ trà nền), khai báo mẻ tại BÁN THÀNH PHẨM và nguyên liệu tại ĐM SƠ CHẾ; sau đó chọn mã BT trong ĐỊNH MỨC.'
guide['A30']='CHI PHÍ CHUNG';guide['B30']='Nhập chi phí chung/tháng và sản lượng dự kiến/tháng theo nhóm ngành để xem cost đầy đủ riêng với cost trực tiếp.'
guide['B28']='File tách cost trực tiếp và cost đầy đủ có phân bổ. Giá bán đề xuất và điểm hòa vốn thuộc file riêng.'
guide.column_dimensions['A'].width=22;guide.column_dimensions['B'].width=105
for r in (27,28,29,30):guide.row_dimensions[r].height=36;guide[f'B{r}'].alignment=Alignment(wrap_text=True,vertical='center')
for row in (19,25,27,28,29,30):
    for cell in guide[row][:2]:cell.fill=PatternFill('solid',fgColor=TEAL);cell.font=Font(name='Aptos',bold=True,color=WHITE)
guide.protection.sheet=True

# Dashboard: dữ liệu nguồn ở cột AA:AS, biểu đồ liên kết ô để tự đổi khi người dùng nhập.
dashboard.sheet_view.showGridLines=False
for col in range(1,18): dashboard.column_dimensions[get_column_letter(col)].width=12
dashboard.merge_cells('A1:Q2');dashboard['A1']='TỔNG QUAN • GIÁ COST'
dashboard['A1'].fill=PatternFill('solid',fgColor=TEAL);dashboard['A1'].font=Font(name='Aptos Display',size=20,bold=True,color=WHITE)
dashboard['A1'].alignment=Alignment(vertical='center')
dashboard.merge_cells('A3:Q3');dashboard['A3']='Dashboard chỉ xem • Hướng dẫn nhập ở BẮT ĐẦU • Kết quả chi tiết ở BẢNG COST'
dashboard['A3'].fill=PatternFill('solid',fgColor=PALE)
cards=[('A5:D5','A6:D7','THÀNH PHẨM HỢP LỆ',"=COUNTIF('SẢN PHẨM'!$L$6:$L$505,\"OK\")"),('E5:H5','E6:H7','COST BÌNH QUÂN',"=IF(A6=0,\"\",SUM('SẢN PHẨM'!$J$6:$J$505)/A6)"),('I5:L5','I6:L7','COST CAO NHẤT',"=MAX('SẢN PHẨM'!$J$6:$J$505)"),('M5:P5','M6:P7','CẦN KIỂM TRA',"=COUNTIF('SẢN PHẨM'!$A$6:$A$505,\"?*\")-COUNTIF('SẢN PHẨM'!$L$6:$L$505,\"OK\")")]
for lr,vr,label,formula in cards:
    dashboard.merge_cells(lr);dashboard[lr.split(':')[0]]=label
    dashboard[lr.split(':')[0]].fill=PatternFill('solid',fgColor=DARK);dashboard[lr.split(':')[0]].font=Font(name='Aptos',bold=True,color=WHITE)
    dashboard.merge_cells(vr);c=dashboard[vr.split(':')[0]];c.value=formula;c.fill=PatternFill('solid',fgColor=PALE);c.font=Font(name='Aptos Display',size=19,bold=True,color=DARK);c.number_format='#,##0'
dashboard.merge_cells('A8:Q8');dashboard['A8']='Đọc nhanh: xem nhóm chi phí lớn, món cost cao và đầu vào nhạy giá. Nếu có cảnh báo, mở SẢN PHẨM hoặc ĐỊNH MỨC.'
dashboard['A8'].fill=PatternFill('solid',fgColor='FFF6E7')

headers={'AA2':'Sản phẩm','AB2':'Cost trực tiếp','AC2':'Cost đầy đủ','AD2':'Ngành','AE2':'Số thành phẩm','AG2':'Sản phẩm','AH2':'Định mức','AI2':'Bao bì','AJ2':'Khác','AL2':'Thành phần','AM2':'Cost tăng nếu giá +10%','AO2':'Giá trà ±','AP2':'Cost trà sữa','AR2':'Thành phần','AS2':'Cost/ly'}
for cell,value in headers.items():dashboard[cell]=value
sectors=['Pha chế','Món ăn','Handmade','Dịch vụ','Bán lẻ']
for i in range(5):
    r=3+i;p=6+i
    dashboard[f'AA{r}']=f"='SẢN PHẨM'!B{p}";dashboard[f'AB{r}']=f"='SẢN PHẨM'!J{p}";dashboard[f'AC{r}']=f"='SẢN PHẨM'!N{p}"
    dashboard[f'AD{r}']=sectors[i]
    dashboard[f'AE{r}']=f'=COUNTIFS(\'SẢN PHẨM\'!$C$6:$C$505,AD{r},\'SẢN PHẨM\'!$L$6:$L$505,"OK")'
    dashboard[f'AG{r}']=f"='SẢN PHẨM'!B{p}";dashboard[f'AH{r}']=f"='SẢN PHẨM'!H{p}/'SẢN PHẨM'!D{p}";dashboard[f'AI{r}']=f"='SẢN PHẨM'!F{p}/'SẢN PHẨM'!D{p}";dashboard[f'AJ{r}']=f"='SẢN PHẨM'!G{p}/'SẢN PHẨM'!D{p}"
    dashboard[f'AO{r}']=(i-2)*.1;dashboard[f'AO{r}'].number_format='0%';dashboard[f'AP{r}']=f"='SẢN PHẨM'!J6+('ĐỊNH MỨC'!C6*'ĐẦU VÀO'!K6)*AO{r}"
for i in range(4):
    r=3+i;p=6+i
    dashboard[f'AL{r}']=f"='ĐỊNH MỨC'!G{p}";dashboard[f'AM{r}']=f"='ĐỊNH MỨC'!F{p}*10%"
    dashboard[f'AR{r}']=f"='ĐỊNH MỨC'!G{p}";dashboard[f'AS{r}']=f"='ĐỊNH MỨC'!F{p}"
dashboard['AR7']='Bao bì';dashboard['AS7']="='SẢN PHẨM'!F6"

def chart(kind, title, catcol, valcols, first, last, anchor, width=16.5, height=8):
    c=kind();c.title=title;c.style=10;c.width=width;c.height=height
    for col in valcols:c.add_data(Reference(dashboard,min_col=col,min_row=2,max_row=last),titles_from_data=True)
    c.set_categories(Reference(dashboard,min_col=catcol,min_row=first,max_row=last))
    if kind is BarChart:c.type='col';c.grouping='clustered'
    if kind is DoughnutChart:c.holeSize=60
    if len(valcols)==1 and kind is not DoughnutChart:c.legend=None
    dashboard.add_chart(c,anchor)

chart(BarChart,'Cost trực tiếp so với cost đầy đủ',27,[28,29],3,7,'A10')
chart(DoughnutChart,'Cơ cấu cost trà sữa',44,[45],3,7,'J10')
chart(BarChart,'Số thành phẩm theo ngành',30,[31],3,7,'A27')
chart(BarChart,'Định mức • bao bì • chi phí khác',33,[34,35,36],3,7,'J27')
chart(BarChart,'Cost/ly tăng khi mỗi đầu vào +10%',38,[39],3,6,'A44')
chart(LineChart,'Giá trà thay đổi: tác động cost/ly',41,[42],3,7,'J44')
dashboard.merge_cells('A61:Q61');dashboard['A61']='Các biểu đồ lấy từ dữ liệu mẫu và tự đổi khi giá/định mức thay đổi. File này chưa tính giá bán hoặc điểm hòa vốn.'
dashboard['A61'].fill=PatternFill('solid',fgColor=PALE)
dashboard.protection.sheet=True

# Bảng chi tiết chỉ xem; không để hướng dẫn dài trên dashboard.
detail['A1']='BẢNG COST • CHI TIẾT THÀNH PHẨM'
detail['A3']='Xem cost từng sản phẩm và trạng thái dữ liệu. Hướng dẫn nhập ở BẮT ĐẦU.'
detail['G5']='Cost đầy đủ / đơn vị'
detail['G5'].fill=PatternFill('solid',fgColor=DARK);detail['G5'].font=Font(bold=True,color=WHITE)
detail.column_dimensions['G'].width=25
detail['H5']='Kiểm tra cost đầy đủ';detail['H5'].fill=PatternFill('solid',fgColor=DARK);detail['H5'].font=Font(bold=True,color=WHITE);detail.column_dimensions['H'].width=25
for r in range(6,506):
    detail[f'G{r}']=f'=IF(A{r}="","",\'SẢN PHẨM\'!N{r})'
    detail[f'H{r}']=f'=IF(A{r}="","",\'SẢN PHẨM\'!O{r})'
    detail[f'G{r}'].number_format='#,##0.00'
    detail[f'G{r}'].protection=Protection(locked=True)
    detail[f'H{r}'].protection=Protection(locked=True)
detail.merge_cells('A507:F507')
detail['A507']='File này tính cost; giá bán đề xuất và điểm hòa vốn thuộc hai sản phẩm riêng.'
for sh in [items,recipe,products]:
    sh.sheet_properties.pageSetUpPr.fitToPage=True
    sh.print_options.horizontalCentered=True

OUTPUT.parent.mkdir(parents=True,exist_ok=True)
for sheet in wb.worksheets:
    for row in sheet:
        for cell in row:
            if cell.data_type=='f' and cell.value.count('(')!=cell.value.count(')'):
                raise ValueError(f'Unbalanced formula: {sheet.title}!{cell.coordinate}')
wb.save(OUTPUT)
(OUTPUT.with_suffix('.manifest.json')).write_text(json.dumps({'product':'Tính Giá Cost đa ngành','version':'2.0','workbook':str(OUTPUT.relative_to(ROOT)).replace('\\','/'),'qc':'outputs/tinh_cost_da_nganh_v2.qc.json','capacity':{'inputs':1000,'recipe_lines':5000,'preps':200,'prep_lines':1000,'products':500,'overhead_groups':100},'status':'candidate_for_review_not_published'},ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'file':str(OUTPUT),'sheets':wb.sheetnames,'charts':len(dashboard._charts),'capacity':{'items':1000,'recipe_lines':5000,'products':500}},ensure_ascii=False))
