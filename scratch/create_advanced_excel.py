import os
try:
    import openpyxl
    from openpyxl.styles import PatternFill, Font, Alignment, Border, Side
    from openpyxl.worksheet.datavalidation import DataValidation
    from openpyxl.chart import BarChart, Reference, Series
except ImportError:
    import subprocess
    import sys
    subprocess.check_call([sys.executable, "-m", "pip", "install", "openpyxl"])
    import openpyxl
    from openpyxl.styles import PatternFill, Font, Alignment, Border, Side
    from openpyxl.worksheet.datavalidation import DataValidation
    from openpyxl.chart import BarChart, Reference, Series

def create_advanced_excel(filename):
    wb = openpyxl.Workbook()
    
    # ---------------------------------------------------------
    # Sheet 1: 0_BẮT_ĐẦU (Start)
    # ---------------------------------------------------------
    ws0 = wb.active
    ws0.title = "0_BẮT_ĐẦU"
    
    header_fill = PatternFill(start_color="FCE4EC", end_color="FCE4EC", fill_type="solid")
    header_font = Font(name="Arial", size=14, bold=True, color="D81B60")
    label_fill = PatternFill(start_color="FFF3E0", end_color="FFF3E0", fill_type="solid")
    label_font = Font(name="Arial", size=11, bold=True, color="5D4037")
    value_fill = PatternFill(start_color="FAFAFA", end_color="FAFAFA", fill_type="solid")
    value_font = Font(name="Arial", size=11, color="212121")
    border_side = Side(border_style="thin", color="E0E0E0")
    border = Border(left=border_side, right=border_side, top=border_side, bottom=border_side)
    
    ws0["A1"] = "SHOP ONLINE MINI (ADVANCED)"
    ws0.merge_cells("A1:C1")
    ws0["A1"].font = Font(name="Arial", size=18, bold=True, color="E91E63")
    ws0["A1"].alignment = Alignment(horizontal="center", vertical="center")
    
    ws0["A3"] = "Thông tin shop"
    ws0.merge_cells("A3:C3")
    ws0["A3"].fill = header_fill
    ws0["A3"].font = header_font
    
    shop_info = [
        ("Tên shop", "Luna Studio"),
        ("Hotline", "0903 123 456"),
        ("Phân loại hàng", "Thời trang")
    ]
    
    row_num = 4
    for label, value in shop_info:
        ws0.cell(row=row_num, column=1, value=label).fill = label_fill
        ws0.cell(row=row_num, column=1).font = label_font
        ws0.cell(row=row_num, column=1).border = border
        ws0.cell(row=row_num, column=2, value=value).fill = value_fill
        ws0.cell(row=row_num, column=2).font = value_font
        ws0.cell(row=row_num, column=2).border = border
        ws0.merge_cells(start_row=row_num, start_column=2, end_row=row_num, end_column=3)
        row_num += 1

    ws0.column_dimensions['A'].width = 25
    ws0.column_dimensions['B'].width = 40
    ws0.column_dimensions['C'].width = 20

    # ---------------------------------------------------------
    # Sheet 2: 5_DANH_MỤC (Categories / Data for Dropdown)
    # ---------------------------------------------------------
    ws_dm = wb.create_sheet("5_DANH_MỤC")
    
    ws_dm["A1"] = "Danh Mục Trạng Thái Đơn"
    ws_dm["A1"].font = Font(bold=True, color="FFFFFF")
    ws_dm["A1"].fill = PatternFill(start_color="1976D2", end_color="1976D2", fill_type="solid")
    
    statuses = ["Chờ xác nhận", "Đang gói hàng", "Đang giao", "Hoàn thành", "Đã Hủy"]
    for i, s in enumerate(statuses, start=2):
        ws_dm.cell(row=i, column=1, value=s)
        
    ws_dm.column_dimensions['A'].width = 25

    # ---------------------------------------------------------
    # Sheet 3: 1_ĐƠN_HÀNG (Orders with Dropdown)
    # ---------------------------------------------------------
    ws_orders = wb.create_sheet("1_ĐƠN_HÀNG")
    headers = ["Mã Đơn", "Khách Hàng", "Sản Phẩm", "Số Lượng", "Trạng Thái"]
    for col_num, header in enumerate(headers, start=1):
        cell = ws_orders.cell(row=1, column=col_num, value=header)
        cell.font = Font(bold=True, color="FFFFFF")
        cell.fill = PatternFill(start_color="388E3C", end_color="388E3C", fill_type="solid")
        cell.alignment = Alignment(horizontal="center")
        
    ws_orders.column_dimensions['B'].width = 25
    ws_orders.column_dimensions['C'].width = 30
    ws_orders.column_dimensions['E'].width = 20
    
    # Add some dummy data
    data = [
        ("DH001", "Nguyễn Văn A", "Áo thun trắng", 2, "Chờ xác nhận"),
        ("DH002", "Trần Thị B", "Quần Jeans", 1, "Đang giao"),
        ("DH003", "Lê Văn C", "Áo khoác", 1, "Hoàn thành")
    ]
    
    for row_num, row_data in enumerate(data, start=2):
        for col_num, value in enumerate(row_data, start=1):
            ws_orders.cell(row=row_num, column=col_num, value=value)
            
    # Add Data Validation (Dropdown) to 'Trạng Thái' column
    # The reference is to '5_DANH_MỤC'!$A$2:$A$6
    dv = DataValidation(type="list", formula1="'5_DANH_MỤC'!$A$2:$A$6", allow_blank=True)
    dv.error = 'Vui lòng chọn trạng thái từ danh sách'
    dv.errorTitle = 'Lỗi nhập liệu'
    dv.prompt = 'Chọn trạng thái'
    dv.promptTitle = 'Trạng thái'
    
    ws_orders.add_data_validation(dv)
    # Apply to E2:E100
    dv.add('E2:E100')

    # ---------------------------------------------------------
    # Sheet 4: 4_TỔNG_QUAN (Dashboard with Chart)
    # ---------------------------------------------------------
    ws_dash = wb.create_sheet("4_TỔNG_QUAN")
    ws_dash["A1"] = "BÁO CÁO DOANH THU"
    ws_dash["A1"].font = Font(size=16, bold=True, color="1565C0")
    
    # Dummy data for chart
    chart_data = [
        ["Tháng", "Doanh Thu (Triệu VNĐ)"],
        ["Tháng 1", 15],
        ["Tháng 2", 22],
        ["Tháng 3", 18],
        ["Tháng 4", 30],
        ["Tháng 5", 25]
    ]
    
    for row_num, row_data in enumerate(chart_data, start=3):
        for col_num, value in enumerate(row_data, start=1):
            ws_dash.cell(row=row_num, column=col_num, value=value)
            
    # Create Bar Chart
    chart = BarChart()
    chart.type = "col"
    chart.style = 10
    chart.title = "Doanh Thu Các Tháng Gần Đây"
    chart.y_axis.title = 'Triệu VNĐ'
    chart.x_axis.title = 'Tháng'

    data_ref = Reference(ws_dash, min_col=2, min_row=3, max_row=8, max_col=2)
    cats_ref = Reference(ws_dash, min_col=1, min_row=4, max_row=8)
    
    chart.add_data(data_ref, titles_from_data=True)
    chart.set_categories(cats_ref)
    chart.shape = 4
    
    ws_dash.add_chart(chart, "D3")
    
    # Save the file
    wb.save(filename)
    print(f"Successfully created {filename}")

if __name__ == '__main__':
    create_advanced_excel('shop_online_mini_advanced.xlsx')
