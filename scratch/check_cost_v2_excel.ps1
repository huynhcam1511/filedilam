$ErrorActionPreference = 'Stop'
$filePath = (Resolve-Path -LiteralPath 'outputs\tinh_cost_da_nganh_v2.xlsx').Path
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
try {
    $book = $excel.Workbooks.Open($filePath)
    try {
        $excel.CalculateFullRebuild()
        $cost = $book.Worksheets.Item('BẢNG COST')
        $inputs = $book.Worksheets.Item('ĐẦU VÀO')
        $recipe = $book.Worksheets.Item('ĐỊNH MỨC')
        $products = $book.Worksheets.Item('SẢN PHẨM')
        $prep = $book.Worksheets.Item('BÁN THÀNH PHẨM')
        $overhead = $book.Worksheets.Item('CHI PHÍ CHUNG')
        $dashboard = $book.Worksheets.Item('TỔNG QUAN')
        $baseCost = [double]$cost.Range('D6').Value2
        $oldTeaPrice = $inputs.Range('H6').Value2
        $inputs.Range('H6').Value2 = 190000
        $excel.CalculateFullRebuild()
        $raisedCost = [double]$cost.Range('D6').Value2
        $inputs.Range('H6').Value2 = $oldTeaPrice
        $excel.CalculateFullRebuild()
        if ([math]::Abs(($raisedCost - $baseCost) - (20 * 10000 / 950)) -gt 0.001) { throw 'Price sensitivity failed' }
        $inputs.Range('A1005:I1005').Value2 = @('NV999','Dòng cuối kiểm thử','Handmade',1,'cái',1,0,1000,'cái')
        $products.Range('A505:G505').Value2 = @('SP500','Thành phẩm dòng cuối','Handmade',1,'cái',0,0)
        $recipe.Range('A5005:D5005').Value2 = @('SP500','NV999',1,'cái')
        $excel.CalculateFullRebuild()
        $lastRowDirectCost = [double]$products.Range('J505').Value2
        $lastRowStatus = [string]$products.Range('L505').Value2
        $inputs.Range('A1005:I1005').ClearContents()
        $products.Range('A505:G505').ClearContents()
        $recipe.Range('A5005:D5005').ClearContents()
        $excel.CalculateFullRebuild()
        if ([math]::Abs($lastRowDirectCost - 1000) -gt 0.001 -or $lastRowStatus -ne 'OK') { throw 'Last-row calculation failed' }
        $recipe.Range('D6').Value2 = 'ml'
        $excel.CalculateFullRebuild()
        $wrongUnitStatus = [string]$recipe.Range('H6').Value2
        $blockedProductStatus = [string]$products.Range('L6').Value2
        $recipe.Range('D6').Value2 = 'g'
        $excel.CalculateFullRebuild()
        if ($wrongUnitStatus -ne 'SAI ĐƠN VỊ' -or $blockedProductStatus -ne 'KIỂM TRA ĐỊNH MỨC') { throw 'Invalid-unit warning failed' }
        $formulaErrors = [ordered]@{}
        foreach ($sheet in $book.Worksheets) {
            try { $formulaErrors[$sheet.Name] = $sheet.UsedRange.SpecialCells(16,16).Count }
            catch { $formulaErrors[$sheet.Name] = 0 }
        }
        $out = [ordered]@{
            base_cost = $cost.Range('D6').Value2
            large_cost = $cost.Range('D11').Value2
            no_topping_cost = $cost.Range('D12').Value2
            prep_cost_per_ml = $prep.Range('F6').Value2
            prep_product_direct_cost = $products.Range('J13').Value2
            prep_product_full_cost = $products.Range('N13').Value2
            prep_product_status = $products.Range('L13').Value2
            prep_product_full_status = $products.Range('O13').Value2
            overhead_per_ly = $overhead.Range('D6').Value2
            dashboard_valid_products = $dashboard.Range('A6').Value2
            dashboard_charts = $dashboard.ChartObjects().Count
            input_last_row_validation = $inputs.Range('C1005').Validation.Type
            recipe_last_row_validation = $recipe.Range('B5005').Validation.Type
            prep_last_row_validation = $prep.Range('D205').Validation.Type
            products_last_row_validation = $products.Range('C505').Validation.Type
            input_editable = (-not $inputs.Range('A1005').Locked)
            formula_locked = $inputs.Range('L1005').Locked
            input_protected = $inputs.ProtectContents
            dashboard_protected = $dashboard.ProtectContents
            price_sensitivity_delta = ($raisedCost - $baseCost)
            last_row_direct_cost_test = $lastRowDirectCost
            last_row_status_test = $lastRowStatus
            wrong_unit_status_test = $wrongUnitStatus
            blocked_product_status_test = $blockedProductStatus
            formula_errors_by_sheet = $formulaErrors
        }
        if ($out.dashboard_charts -lt 6 -or $out.dashboard_valid_products -lt 8) { throw 'Dashboard QC failed' }
        if ($out.input_last_row_validation -ne 3 -or $out.recipe_last_row_validation -ne 3 -or $out.products_last_row_validation -ne 3) { throw 'Dropdown QC failed' }
        if (-not $out.input_editable -or -not $out.formula_locked -or -not $out.input_protected -or -not $out.dashboard_protected) { throw 'Protection QC failed' }
        if ($out.prep_product_status -ne 'OK' -or $out.prep_product_full_status -ne 'OK') { throw 'F&B prep QC failed' }
        foreach ($count in $formulaErrors.Values) { if ($count -gt 0) { throw 'Formula error QC failed' } }
        $qc = [ordered]@{ product='Tính Giá Cost đa ngành'; version='2.0'; checked_in='Microsoft Excel'; passed=$true; observations=$out }
        $qc | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath 'outputs\tinh_cost_da_nganh_v2.qc.json' -Encoding utf8
        $out | ConvertTo-Json -Compress
        $book.Save()
    }
    finally { $book.Close($false) }
}
finally { $excel.Quit() }
