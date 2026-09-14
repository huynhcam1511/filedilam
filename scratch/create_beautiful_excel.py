import os
try:
    import openpyxl
    from openpyxl.styles import PatternFill, Font, Alignment, Border, Side
    from openpyxl.utils import get_column_letter
except ImportError:
    import subprocess
    import sys
    subprocess.check_call([sys.executable, "-m", "pip", "install", "openpyxl"])
    import openpyxl
    from openpyxl.styles import PatternFill, Font, Alignment, Border, Side
    from openpyxl.utils import get_column_letter

def create_beautiful_excel(filename):
    wb = openpyxl.Workbook()
    
    # --- Sheet 0_BẮT_ĐẦU ---
    ws = wb.active
    ws.title = "0_BẮT_ĐẦU"
    
    # Define styles
    header_fill = PatternFill(start_color="FCE4EC", end_color="FCE4EC", fill_type="solid") # Light pastel pink
    header_font = Font(name="Arial", size=14, bold=True, color="D81B60") # Dark pink text
    
    label_fill = PatternFill(start_color="FFF3E0", end_color="FFF3E0", fill_type="solid") # Light pastel orange
    label_font = Font(name="Arial", size=11, bold=True, color="5D4037")
    
    value_fill = PatternFill(start_color="FAFAFA", end_color="FAFAFA", fill_type="solid")
    value_font = Font(name="Arial", size=11, color="212121")
    
    instruction_header_fill = PatternFill(start_color="E1BEE7", end_color="E1BEE7", fill_type="solid") # Light purple
    
    border_side = Side(border_style="thin", color="E0E0E0")
    border = Border(left=border_side, right=border_side, top=border_side, bottom=border_side)
    
    # Title
    ws["A1"] = "SHOP ONLINE MINI"
    ws.merge_cells("A1:C1")
    ws["A1"].font = Font(name="Arial", size=18, bold=True, color="E91E63")
    ws["A1"].alignment = Alignment(horizontal="center", vertical="center")
    
    ws["A2"] = "Bản pastel gọn gàng cho shop nhỏ, dễ nhập, dễ hiểu"
    ws.merge_cells("A2:C2")
    ws["A2"].font = Font(name="Arial", size=10, italic=True, color="757575")
    ws["A2"].alignment = Alignment(horizontal="center", vertical="center")
    
    # Section 1: Thông tin shop
    ws["A3"] = "Thông tin shop"
    ws.merge_cells("A3:C3")
    ws["A3"].fill = header_fill
    ws["A3"].font = header_font
    
    shop_info = [
        ("Tên shop", "Luna Studio"),
        ("Hotline", "0903 123 456"),
        ("Zalo / Instagram", "@lunastudio.vn"),
        ("Địa chỉ / kho", "45 Nguyễn Trãi, Q1, TP.HCM"),
        ("Mô tả ngắn của shop", "Phong cách pastel, hàng chỉnh chu, giao nhanh")
    ]
    
    row_num = 4
    for label, value in shop_info:
        ws.cell(row=row_num, column=1, value=label).fill = label_fill
        ws.cell(row=row_num, column=1).font = label_font
        ws.cell(row=row_num, column=1).border = border
        
        ws.cell(row=row_num, column=2, value=value).fill = value_fill
        ws.cell(row=row_num, column=2).font = value_font
        ws.cell(row=row_num, column=2).border = border
        ws.merge_cells(start_row=row_num, start_column=2, end_row=row_num, end_column=3)
        row_num += 1
        
    row_num += 1
    
    # Section 2: Hướng dẫn nhanh
    ws.cell(row=row_num, column=1, value="Hướng dẫn nhanh").fill = instruction_header_fill
    ws.cell(row=row_num, column=1).font = Font(name="Arial", size=12, bold=True, color="4A148C")
    ws.merge_cells(start_row=row_num, start_column=1, end_row=row_num, end_column=3)
    row_num += 1
    
    instructions = [
        ("Bước 1", "vào sheet 0_BẮT_ĐẦU, điền tên shop, hotline..."),
        ("Bước 2", "sang sheet 5_DANH_MỤC để sửa sản phẩm..."),
        ("Bước 3", "nhập đơn tại 1_ĐƠN_HÀNG. Các cột bên trái là cột nhập..."),
        ("Bước 4", "ghi thu chi tại 2_THU_CHI..."),
        ("Bước 5", "xem báo cáo nhanh tại 4_TỔNG_QUAN...")
    ]
    
    for step, desc in instructions:
        ws.cell(row=row_num, column=1, value=step).fill = PatternFill(start_color="FCE4EC", end_color="FCE4EC", fill_type="solid")
        ws.cell(row=row_num, column=1).font = Font(name="Arial", size=11, bold=True, color="D81B60")
        ws.cell(row=row_num, column=1).alignment = Alignment(vertical="center")
        ws.cell(row=row_num, column=1).border = border
        
        ws.cell(row=row_num, column=2, value=desc).font = value_font
        ws.cell(row=row_num, column=2).alignment = Alignment(wrap_text=True, vertical="center")
        ws.cell(row=row_num, column=2).border = border
        ws.merge_cells(start_row=row_num, start_column=2, end_row=row_num, end_column=3)
        row_num += 1

    # Adjust column widths
    ws.column_dimensions['A'].width = 25
    ws.column_dimensions['B'].width = 40
    ws.column_dimensions['C'].width = 20
    
    # --- Add other sheets ---
    sheet_names = ["1_ĐƠN_HÀNG", "2_THU_CHI", "3_THEO_DÕI_COD", "4_TỔNG_QUAN", "5_DANH_MỤC"]
    for name in sheet_names:
        wb.create_sheet(title=name)
        
    wb.save(filename)
    print(f"Successfully created {filename}")

if __name__ == '__main__':
    create_beautiful_excel('shop_online_mini_beautiful.xlsx')
