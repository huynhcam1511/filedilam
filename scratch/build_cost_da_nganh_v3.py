from __future__ import annotations

from copy import copy
from datetime import date
from pathlib import Path
import json

from openpyxl import load_workbook
from openpyxl.chart import BarChart, DoughnutChart, LineChart, Reference
from openpyxl.chart.label import DataLabelList
from openpyxl.chart.legend import Legend
from openpyxl.chart.shapes import GraphicalProperties
from openpyxl.drawing.line import LineProperties
from openpyxl.styles import Alignment, Border, Font, PatternFill, Protection, Side
from openpyxl.formatting.rule import FormulaRule
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.utils import get_column_letter
from openpyxl.workbook.defined_name import DefinedName

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'outputs/tinh_cost_da_nganh_v2.xlsx'
OUTPUT = ROOT / 'outputs/tinh_cost_da_nganh_v3.xlsx'
wb = load_workbook(SOURCE)

INK = '463445'
PINK = 'A23B72'
DEEP = '682E52'
ROSE = 'F8DCEB'
BLUSH = 'FFF0F6'
INPUT = 'FFF4F9'
WHITE = 'FFFFFF'
LINE = 'E9D7E1'
MUTED = '806C7C'
GREEN = 'E5F4EA'
RED = 'FBE3E8'
BLUE = 'E9F0FC'
AMBER = 'FFF0DB'
VIOLET = 'F1EAFE'
CHART_COLORS = [PINK, 'E6A1BF', '8D72B0', 'D49B71', '76A69E']
FONT = 'Arial'
FMT_INT = '#,##0;[Red](#,##0);–'
FMT_MONEY = '#,##0.00;[Red](#,##0.00);–'

items = wb['ĐẦU VÀO']
products = wb['SẢN PHẨM']
recipe = wb['ĐỊNH MỨC']
dashboard = wb['TỔNG QUAN']
guide = wb['BẮT ĐẦU']

# These 31 records extend the existing 14 real examples to 45 populated input rows.
# Price and yield assumptions are illustrative, not current supplier quotations.
input_samples = [
    ('Bột cacao','Pha chế',1,'kg',1000,.02,145000,'g'),
    ('Cà phê rang xay','Pha chế',1,'kg',1000,.03,220000,'g'),
    ('Sữa đặc','Pha chế',1,'lít',1000,0,58000,'ml'),
    ('Siro đào','Pha chế',1,'lít',1000,0,125000,'ml'),
    ('Đào ngâm','Pha chế',1,'kg',1000,.08,89000,'g'),
    ('Chanh tươi','Pha chế',1,'kg',1000,.35,42000,'g'),
    ('Lá bạc hà','Pha chế',1,'kg',1000,.18,110000,'g'),
    ('Bột matcha','Pha chế',1,'kg',1000,.02,390000,'g'),
    ('Kem béo','Pha chế',1,'lít',1000,0,72000,'ml'),
    ('Nước soda','Pha chế',24,'cái',1,0,180000,'cái'),
    ('Thịt bò','Món ăn',1,'kg',1000,.18,230000,'g'),
    ('Trứng gà','Món ăn',30,'cái',1,.03,90000,'cái'),
    ('Rau xà lách','Món ăn',1,'kg',1000,.22,45000,'g'),
    ('Cà chua','Món ăn',1,'kg',1000,.12,36000,'g'),
    ('Bún tươi','Món ăn',1,'kg',1000,0,24000,'g'),
    ('Bánh mì','Món ăn',20,'cái',1,0,70000,'cái'),
    ('Bột mì','Món ăn',1,'kg',1000,.01,25000,'g'),
    ('Bơ lạt','Món ăn',1,'kg',1000,.02,165000,'g'),
    ('Phô mai','Món ăn',1,'kg',1000,.02,180000,'g'),
    ('Gia vị tổng hợp','Món ăn',1,'kg',1000,.02,95000,'g'),
    ('Nắp ly','Bao bì',100,'cái',1,0,28000,'cái'),
    ('Ống hút','Bao bì',100,'cái',1,0,18000,'cái'),
    ('Túi giấy','Bao bì',100,'cái',1,0,90000,'cái'),
    ('Tem nhãn','Bao bì',100,'cái',1,0,40000,'cái'),
    ('Bấc nến','Handmade',100,'cái',1,0,50000,'cái'),
    ('Màu nến','Handmade',100,'g',1,0,55000,'g'),
    ('Hoa khô','Handmade',1,'kg',1000,.05,175000,'g'),
    ('Giấy gói','Handmade',100,'cái',1,0,85000,'cái'),
    ('Giờ thiết kế','Dịch vụ',1,'giờ',60,0,180000,'phút'),
    ('Giờ hỗ trợ','Dịch vụ',1,'giờ',60,0,120000,'phút'),
    ('Hàng nhập loại B','Bán lẻ',10,'cái',1,0,360000,'cái'),
]
for n, rec in enumerate(input_samples, 15):
    row = n + 5
    for col, value in enumerate((f'NV{n:03d}', *rec), 1):
        items.cell(row, col).value = value

# A product is useful only when its recipe is complete and traceable.
new_products = [
    ('Cacao sữa đá','Pha chế','ly',650,[(15,25),(2,180),(3,20)]),
    ('Cà phê sữa đá','Pha chế','ly',650,[(16,22),(17,35)]),
    ('Bạc xỉu','Pha chế','ly',650,[(16,15),(2,180),(17,40)]),
    ('Trà đào','Pha chế','ly',650,[(1,15),(18,35),(19,50)]),
    ('Trà chanh','Pha chế','ly',650,[(1,15),(20,40),(3,25)]),
    ('Soda chanh','Pha chế','ly',650,[(24,1),(20,35),(3,25)]),
    ('Matcha latte','Pha chế','ly',650,[(22,18),(2,220),(3,15)]),
    ('Matcha kem béo','Pha chế','ly',650,[(22,18),(23,80),(2,120)]),
    ('Trà sữa cacao','Pha chế','ly',650,[(1,18),(15,15),(2,180)]),
    ('Trà sữa đào','Pha chế','ly',650,[(1,18),(2,170),(19,50)]),
    ('Cà phê kem béo','Pha chế','ly',650,[(16,20),(23,65),(3,15)]),
    ('Trà bạc hà','Pha chế','ly',650,[(1,16),(21,10),(3,25)]),
    ('Cơm bò xào','Món ăn','suất',700,[(6,180),(25,120),(8,20),(34,5)]),
    ('Cơm gà trứng','Món ăn','suất',700,[(6,180),(7,150),(26,1)]),
    ('Cơm bò trứng','Món ăn','suất',700,[(6,180),(25,110),(26,1)]),
    ('Bún bò','Món ăn','suất',700,[(29,200),(25,120),(34,5)]),
    ('Bún gà','Món ăn','suất',700,[(29,200),(7,140),(27,35)]),
    ('Bánh mì bò','Món ăn','suất',350,[(30,1),(25,80),(27,25)]),
    ('Bánh mì trứng','Món ăn','suất',350,[(30,1),(26,2),(27,25)]),
    ('Salad gà','Món ăn','suất',700,[(7,130),(27,100),(28,60)]),
    ('Salad bò','Món ăn','suất',700,[(25,100),(27,100),(28,60)]),
    ('Bánh phô mai','Món ăn','suất',500,[(31,100),(32,30),(33,45)]),
    ('Nến hương hoa','Handmade','hũ',7000,[(10,180),(11,14),(12,1),(39,1),(41,5)]),
    ('Nến màu pastel','Handmade','hũ',7000,[(10,180),(12,1),(39,1),(40,3)]),
    ('Nến gói quà','Handmade','hũ',8500,[(10,180),(11,12),(12,1),(42,1)]),
    ('Nến mini','Handmade','hũ',5000,[(10,90),(12,1),(39,1)]),
    ('Trang trí nến','Handmade','hũ',7000,[(10,150),(40,2),(41,8)]),
    ('Chăm sóc 60 phút','Dịch vụ','lượt',0,[(13,60)]),
    ('Chăm sóc 90 phút','Dịch vụ','lượt',0,[(13,90)]),
    ('Thiết kế bài đăng','Dịch vụ','lượt',0,[(43,90)]),
    ('Thiết kế poster','Dịch vụ','lượt',0,[(43,150)]),
    ('Hỗ trợ vận hành','Dịch vụ','lượt',0,[(44,60)]),
    ('Sản phẩm nhập loại B','Bán lẻ','cái',1500,[(45,1)]),
    ('Combo 2 món loại B','Bán lẻ','hộp',3000,[(45,2)]),
    ('Combo loại A + B','Bán lẻ','hộp',3000,[(14,1),(45,1)]),
    ('Sản phẩm loại A gói quà','Bán lẻ','cái',2500,[(14,1),(42,1)]),
    ('Sản phẩm loại B gói quà','Bán lẻ','cái',2500,[(45,1),(42,1)]),
]
# Correct the human-facing IDs through the input catalogue, preserving its sequence.
# NV015..NV045 are contiguous; new names above refer to the intended ID.
assert len(new_products) == 37
recipe_row = 27
for n, (name, sector, unit, packaging, lines) in enumerate(new_products, 9):
    row = n + 5
    for col, value in enumerate((f'SP{n:03d}', name, sector, 1, unit, packaging, 0), 1):
        products.cell(row, col).value = value
    for input_id, amount in lines:
        input_row = input_id + 5
        base_unit = items.cell(input_row, 9).value
        assert base_unit in ('g','ml','cái','phút'), (input_id,base_unit)
        for col, value in enumerate((f'SP{n:03d}', f'NV{input_id:03d}', amount, base_unit), 1):
            recipe.cell(recipe_row, col).value = value
        recipe_row += 1

# Additional operational attributes sit after the proven calculation columns.
def add_fields(sheet, header_map, end_row, dropdowns=()):
    for col, name, width in header_map:
        sheet[f'{col}5'] = name
        sheet.column_dimensions[col].width = width
        for row in range(6, end_row + 1):
            cell = sheet[f'{col}{row}']
            cell.protection = Protection(locked=False)
            cell.fill = PatternFill('solid', fgColor=INPUT)
    for col, values in dropdowns:
        dv = DataValidation(type='list', formula1='"' + ','.join(values) + '"')
        dv.allow_blank = True
        dv.showErrorMessage = True
        dv.errorTitle = 'Chọn từ danh sách'
        dv.error = 'Vui lòng chọn giá trị trong danh sách.'
        sheet.add_data_validation(dv)
        dv.add(f'{col}6:{col}{end_row}')

add_fields(items, [('M','Nhà cung cấp',22),('N','Ngày cập nhật giá',20),('O','Ghi chú mua / hao hụt',32)],1005)
add_fields(products, [('P','Size / quy cách',18),('Q','Kênh bán',20),('R','Ghi chú thành phẩm',30)],505,
           [('Q',['Tại quầy','Mang đi','Online','Sỉ','Dịch vụ'])])
add_fields(recipe, [('I','Nhóm cost',20),('J','Ghi chú định mức',30)],5005,
           [('I',['Nguyên liệu','Bao bì','Nhân công','Hao hụt','Khác'])])
add_fields(wb['BÁN THÀNH PHẨM'],[('I','Ghi chú sơ chế',32)],205)
add_fields(wb['ĐM SƠ CHẾ'],[('I','Nhóm cost',20),('J','Ghi chú sơ chế',30)],1005,
           [('I',['Nguyên liệu','Nhân công','Hao hụt','Khác'])])
add_fields(wb['CHI PHÍ CHUNG'],[('F','Ghi chú phân bổ',32)],105)

# The v2 cross-sheet validation extension cannot round-trip through openpyxl.
# Excel-compatible named ranges restore the code selectors to the final row.
for name, target in [
    ('CostProducts',"'SẢN PHẨM'!$A$6:$A$505"),
    ('CostInputsAndPrep',"'HỆ THỐNG'!$A$6:$A$1205"),
    ('CostInputs',"'ĐẦU VÀO'!$A$6:$A$1005"),
    ('CostPrep',"'BÁN THÀNH PHẨM'!$A$6:$A$205")]:
    wb.defined_names.add(DefinedName(name,attr_text=target))
for sh,col,last,name in [(recipe,'A',5005,'CostProducts'),(recipe,'B',5005,'CostInputsAndPrep'),
                         (wb['ĐM SƠ CHẾ'],'A',1005,'CostPrep'),(wb['ĐM SƠ CHẾ'],'B',1005,'CostInputs')]:
    dv=DataValidation(type='list',formula1=f'={name}')
    dv.allow_blank=True
    dv.showErrorMessage=True
    dv.errorTitle='Mã không hợp lệ'
    dv.error='Chọn mã từ danh sách.'
    sh.add_data_validation(dv)
    dv.add(f'{col}6:{col}{last}')
for row in range(6,51):
    items[f'M{row}'] = ['Nhà cung cấp A','Nhà cung cấp B','Chợ / đại lý'][row % 3]
    items[f'N{row}'] = date(2026,9,1)
    items[f'N{row}'].number_format = 'dd/mm/yyyy'
    if row % 7 == 0:
        items[f'O{row}'] = 'Giá ví dụ; thay bằng báo giá thực tế'
for row in range(6,51):
    products[f'P{row}'] = 'M' if products[f'C{row}'].value == 'Pha chế' else 'Tiêu chuẩn'
    products[f'Q{row}'] = 'Tại quầy' if products[f'C{row}'].value in ('Pha chế','Món ăn') else 'Online'
for row in range(6, recipe_row):
    if recipe[f'A{row}'].value:
        recipe[f'I{row}'] = 'Nguyên liệu'

# A single typography and color system across all reader-facing cells.
for sh in wb.worksheets:
    if sh.title == 'HỆ THỐNG':
        continue
    sh.sheet_view.showGridLines = False
    sh.sheet_view.zoomScale = 90 if sh == dashboard else 100
    sh.sheet_properties.tabColor = PINK if sh in (guide,dashboard,wb['BẢNG COST']) else 'E6A1BF'
    max_col = min(sh.max_column, 18 if sh == products else 15 if sh == items else 17 if sh == dashboard else 10)
    max_row = 65 if sh == dashboard else 32 if sh == guide else sh.max_row
    for row in sh.iter_rows(min_row=1,max_row=max_row,min_col=1,max_col=max_col):
        for cell in row:
            if cell.__class__.__name__ == 'MergedCell':
                continue
            old = cell.font
            cell.font = Font(name=FONT,size=11 if cell.row >= 5 else 12,bold=old.bold,
                             italic=old.italic,color=INK if not old.bold else DEEP)
            if cell.row == 5 and sh not in (guide,dashboard):
                cell.fill = PatternFill('solid',fgColor=DEEP)
                cell.font = Font(name=FONT,size=10.5,bold=True,color=WHITE)
                cell.alignment = Alignment(horizontal='center',vertical='center',wrap_text=True)
            elif cell.row in (1,2) and cell.value is not None and sh != dashboard:
                cell.fill = PatternFill('solid',fgColor=BLUSH)
                cell.font = Font(name=FONT,size=16,bold=True,color=DEEP)
            elif cell.row == 3 and cell.value is not None and sh != dashboard:
                cell.fill = PatternFill('solid',fgColor=WHITE)
                cell.font = Font(name=FONT,size=10,italic=True,color=MUTED)
            elif cell.row >= 6 and sh not in (guide,dashboard):
                if not cell.protection.locked:
                    cell.fill = PatternFill('solid',fgColor=INPUT if cell.row % 2 == 0 else WHITE)
                elif cell.value is not None:
                    cell.fill = PatternFill('solid',fgColor='FCFAFC' if cell.row % 2 == 0 else WHITE)
                cell.border = Border(bottom=Side(style='hair',color=LINE))
                cell.alignment = Alignment(vertical='center',horizontal='right' if isinstance(cell.value,(int,float)) or cell.data_type=='f' and cell.number_format not in ('General','@') else 'left')
    if sh not in (guide,dashboard):
        sh.row_dimensions[5].height = 40
        for r in range(6,min(max_row,55)+1):sh.row_dimensions[r].height = 23
        sh.freeze_panes = 'C6' if sh in (items,products,recipe) else 'A6'

for sh, cols, last in [
    (items,'DFGHJK',1005),(recipe,'CEF',5005),(products,'DFGHIJKMN',505),
    (wb['BÁN THÀNH PHẨM'],'CEFG',205),(wb['ĐM SƠ CHẾ'],'CEF',1005),
    (wb['CHI PHÍ CHUNG'],'BCD',105),(wb['BẢNG COST'],'CDEG',505)]:
    for row in range(6,last+1):
        for col in cols:
            if sh == items and col == 'G': fmt = '0.0%'
            elif (sh == items and col in 'DFJ') or (sh == products and col in 'DK') or (sh == recipe and col == 'C'):
                fmt = FMT_INT
            elif sh == wb['CHI PHÍ CHUNG'] and col in 'BC': fmt = FMT_INT
            else: fmt = FMT_MONEY
            sh[f'{col}{row}'].number_format = fmt

# Inputs have colored category selections and bounded, reactive warnings.
for sh, col, last in [(items,'C',1005),(products,'C',505)]:
    for label,color in [('Pha chế',ROSE),('Món ăn',AMBER),('Handmade',VIOLET),('Bán lẻ',BLUE),('Dịch vụ',GREEN),('Bao bì','F5E8DC')]:
        sh.conditional_formatting.add(f'{col}6:{col}{last}',FormulaRule(formula=[f'{col}6="{label}"'],
            fill=PatternFill('solid',fgColor=color),font=Font(name=FONT,color=DEEP,bold=True)))
for sh, col, last in [(items,'L',1005),(recipe,'H',5005),(products,'L',505),(products,'O',505),
                      (wb['BÁN THÀNH PHẨM'],'H',205),(wb['ĐM SƠ CHẾ'],'H',1005),(wb['CHI PHÍ CHUNG'],'E',105)]:
    sh.conditional_formatting.add(f'{col}6:{col}{last}',FormulaRule(formula=[f'AND({col}6<>"",{col}6<>"OK")'],
        fill=PatternFill('solid',fgColor=RED),font=Font(name=FONT,color='A6264C',bold=True)))

for sh,end_col,last in [(items,'O',1005),(products,'R',505),(recipe,'J',5005),
                        (wb['BÁN THÀNH PHẨM'],'I',205),(wb['ĐM SƠ CHẾ'],'J',1005),(wb['CHI PHÍ CHUNG'],'F',105)]:
    sh.auto_filter.ref = f'A5:{end_col}{last}'

# Dashboard: worksheet titles occupy their own top row; chart plots can never obscure them.
for area in ('A1:Q2','A3:Q3','A8:Q8'):
    for row in dashboard[area]:
        for cell in row:
            if cell.__class__.__name__ != 'MergedCell':cell.fill = PatternFill('solid',fgColor=WHITE)
dashboard['A1'].font = Font(name=FONT,size=18,bold=True,color=DEEP)
dashboard['A3'].font = Font(name=FONT,size=10,color=MUTED)
dashboard['A8'].font = Font(name=FONT,size=10,color=INK)
dashboard.row_dimensions[1].height = 23
dashboard.row_dimensions[2].height = 20
dashboard.row_dimensions[3].height = 22
dashboard.row_dimensions[4].height = 12
dashboard.row_dimensions[8].height = 26
for label_cell,value_cell in [('A5','A6'),('E5','E6'),('I5','I6'),('M5','M6')]:
    dashboard[label_cell].fill=PatternFill('solid',fgColor=ROSE)
    dashboard[label_cell].font=Font(name=FONT,size=10,bold=True,color=DEEP)
    dashboard[value_cell].fill=PatternFill('solid',fgColor=BLUSH)
    dashboard[value_cell].font=Font(name=FONT,size=19,bold=True,color=PINK)
    dashboard[value_cell].alignment=Alignment(horizontal='left',vertical='center',indent=1)
for row in (9,26,43):
    dashboard.row_dimensions[row].height=28
    for start,end in [('A','H'),('J','Q')]:
        dashboard.merge_cells(f'{start}{row}:{end}{row}')
        for col in range(1 if start=='A' else 10,9 if start=='A' else 18):
            dashboard.cell(row,col).fill=PatternFill('solid',fgColor=ROSE)
        c=dashboard[f'{start}{row}']
        c.font=Font(name=FONT,size=11,bold=True,color=DEEP)
        c.alignment=Alignment(vertical='center',indent=1)
for row,labels in [(9,('COST THEO THÀNH PHẨM','CƠ CẤU COST MỘT LY TRÀ SỮA')),
                   (26,('SỐ THÀNH PHẨM THEO NGÀNH','THÀNH PHẦN COST THEO SẢN PHẨM')),
                   (43,('ĐỘ NHẠY GIÁ NGUYÊN LIỆU','GIÁ TRÀ THAY ĐỔI • COST / LY'))]:
    dashboard[f'A{row}'],dashboard[f'J{row}']=labels
for row in list(range(10,26))+list(range(27,43))+list(range(44,60)):
    dashboard.row_dimensions[row].height=20
for c in dashboard._charts:
    c.title = None
    c.width = 18.9
    c.height = 9.6
    c.style = 13
    c.legend = Legend(legendPos='b') if isinstance(c,(DoughnutChart,BarChart)) else None
    if hasattr(c,'y_axis'):
        c.y_axis.delete = False
        c.y_axis.majorGridlines = None
    if hasattr(c,'x_axis'):
        c.x_axis.delete = False
        c.x_axis.tickLblPos = 'nextTo'
    for idx,ser in enumerate(c.series):
        color = CHART_COLORS[idx % len(CHART_COLORS)]
        try:
            ser.graphicalProperties.solidFill = color
            ser.graphicalProperties.line.solidFill = color
        except AttributeError:
            pass
    if isinstance(c,DoughnutChart):
        c.dataLabels=DataLabelList()
        c.dataLabels.showPercent=True
        c.dataLabels.showCategoryName=False
        c.dataLabels.showVal=False
        c.dataLabels.showLeaderLines=True
for idx in (0,4):
    dashboard._charts[idx].type='bar'
dashboard['A61']='Ví dụ minh họa • Sửa giá và định mức trong các bảng nhập để xem dashboard tự cập nhật.'
dashboard['A61'].font=Font(name=FONT,size=10,italic=True,color=MUTED)
dashboard.sheet_view.zoomScale=80
dashboard.sheet_properties.pageSetUpPr.fitToPage=True
dashboard.print_options.horizontalCentered=True
dashboard.print_area='A1:Q61'
dashboard.sheet_format.defaultRowHeight=20

guide['A3']='Bản 3.0 • Bắt đầu tại đây; TỔNG QUAN là dashboard chỉ xem'
guide['B25']='Hồng phấn = được nhập/chọn • Trắng = tự tính/khóa • Đỏ hồng = cần sửa dữ liệu'
guide['B27']='45 đầu vào và 45 thành phẩm mẫu • sức chứa: 1.000 đầu vào, 5.000 dòng định mức, 500 thành phẩm.'
guide['B31']='DỮ LIỆU MẪU';guide['C31']='Giá và định mức chỉ để minh họa; thay bằng số liệu thực tế của bạn trước khi ra quyết định.'
guide.column_dimensions['C'].width=66
for row in (19,25,27,28,29,30,31):
    for col in (1,2):
        c=guide.cell(row,col)
        c.fill=PatternFill('solid',fgColor=ROSE)
        c.font=Font(name=FONT,size=11,bold=True,color=DEEP)
guide['C31'].font=Font(name=FONT,size=11,color=INK)

OUTPUT.parent.mkdir(parents=True,exist_ok=True)
wb.save(OUTPUT)
manifest={
    'product':'Tính Giá Cost đa ngành','version':'3.0',
    'workbook':str(OUTPUT.relative_to(ROOT)).replace('\\','/'),
    'qc':'outputs/tinh_cost_da_nganh_v3.qc.json',
    'capacity':{'inputs':1000,'recipe_lines':5000,'preps':200,'prep_lines':1000,'products':500,'overhead_groups':100},
    'sample_rows':{'inputs':45,'products':45},
    'status':'candidate_for_review_not_published',
    'note':'Giá và định mức mẫu chỉ để minh họa; cần thay bằng dữ liệu thực tế.'
}
OUTPUT.with_suffix('.manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'output':str(OUTPUT),'charts':len(dashboard._charts),'samples':manifest['sample_rows']},ensure_ascii=False))
