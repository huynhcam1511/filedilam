param([Parameter(Mandatory=$true)][string]$Path, [string]$ReportPath)
$ErrorActionPreference = 'Stop'
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$excel.AskToUpdateLinks = $false
$excel.AutomationSecurity = 3
$book = $null
$checks = [System.Collections.Generic.List[string]]::new()
function Assert-Equal($Actual, $Expected, [string]$Label) {
    if ($Actual -ne $Expected) { throw "$Label expected [$Expected], got [$Actual]" }
    $checks.Add($Label)
}
try {
    $book = $excel.Workbooks.Open($Path, 0, $false)
    $excel.CalculateFullRebuild()
    $dashboard = $book.Worksheets.Item('4_TỔNG_QUAN')
    $orders = $book.Worksheets.Item('1_ĐƠN_HÀNG')
    $cash = $book.Worksheets.Item('2_THU_CHI')
    $catalog = $book.Worksheets.Item('5_DANH_MỤC')
    Assert-Equal $dashboard.ChartObjects().Count 6 'Six native charts'
    for ($i=1; $i -le 6; $i++) {Assert-Equal $dashboard.ChartObjects($i).Chart.PlotVisibleOnly $false "Chart $i includes hidden source"}
    Assert-Equal $dashboard.Range('B7').Value2 14 'Order KPI excludes empty formula rows'
    Assert-Equal $dashboard.Range('AQ3').Value2 1497000 'Initial product ranking'
    Assert-Equal $dashboard.Range('AN3').Value2 3947000 'Initial income'
    Assert-Equal $dashboard.Range('AN4').Value2 6930000 'Initial expense'
    Assert-Equal $book.Names.Item('shop_products').RefersToRange.Rows.Count 60 '60 products in dropdown'
    Assert-Equal $book.Names.Item('shop_channels').RefersToRange.Rows.Count 24 '24 channels in dropdown'
    Assert-Equal $book.Names.Item('shop_cashbook_categories').RefersToRange.Rows.Count 40 '40 cash categories in dropdown'
    if ($cash.Range('D203').Validation.Type -notin @(1,2)) {throw 'Amount validation missing'}
    $checks.Add('Amount validation on cash amount')
    Assert-Equal $orders.Range('D203').Validation.Type 3 'Product dropdown reaches last order'
    $book.Save()
    # Changes below are deliberately discarded after behavior testing.
    $catalog.Range('A63').Value2 = 'San pham kiem thu'
    $catalog.Range('G27').Value2 = 'Kenh kiem thu'
    $catalog.Range('J43').Value2 = 'Chi'
    $catalog.Range('K43').Value2 = 'Khoan chi kiem thu'
    $excel.CalculateFullRebuild()
    Assert-Equal $book.Names.Item('shop_products').RefersToRange.Rows.Count 61 'New product extends dropdown'
    Assert-Equal $book.Names.Item('shop_channels').RefersToRange.Rows.Count 25 'New channel extends dropdown'
    Assert-Equal $book.Names.Item('shop_cashbook_categories').RefersToRange.Rows.Count 41 'New category extends dropdown'
    $orders.Range('A203').Value2 = [double][datetime]::Today.ToOADate()
    $orders.Range('B203').Value2 = 'Kenh kiem thu'
    $orders.Range('D203').Value2 = $catalog.Range('E63').Value2
    $orders.Range('E203').Value2 = [double]9000000
    $orders.Range('F203').Value2 = 'COD'
    $orders.Range('H203').Value2 = [double][datetime]::Today.AddDays(-5).ToOADate()
    $orders.Range('I203').Value2 = 'Mới'
    $excel.CalculateFullRebuild()
    Assert-Equal $dashboard.Range('AA3').Value2 'Kenh kiem thu' 'Channel revenue ranking reacts'
    Assert-Equal $dashboard.Range('AB3').Value2 9000000 'New channel revenue included'
    Assert-Equal $dashboard.Range('AP3').Value2 $catalog.Range('E63').Value2 'New product becomes top seller'
    Assert-Equal $dashboard.Range('AQ3').Value2 9000000 'New product revenue included'
    Assert-Equal (@($dashboard.ChartObjects(5).Chart.SeriesCollection(1).Values)[0]) 9000000 'Native product chart updates its plotted value'
    Assert-Equal (@($dashboard.ChartObjects(5).Chart.SeriesCollection(1).XValues)[0]) $catalog.Range('E63').Value2 'Native product chart updates its category'
    Assert-Equal $dashboard.Range('AH3').Value2 1 'Previously unused order status included'
    Assert-Equal $dashboard.Range('AK5').Value2 9000000 'COD aged four to seven days'
    Assert-Equal $excel.WorksheetFunction.Sum($dashboard.Range('AE3:AE10')) 15 'Channel counts reconcile'
    $cash.Range('A203').Value2 = [double][datetime]::Today.ToOADate()
    $cash.Range('B203').Value2 = 'Thu'
    $cash.Range('C203').Value2 = 'T01 - Nhận COD'
    $cash.Range('D203').Value2 = [double]2000000
    $cash.Range('E203').Value2 = $orders.Range('K203').Value2
    $excel.CalculateFullRebuild()
    Assert-Equal $dashboard.Range('AN3').Value2 5947000 'Income chart reacts to new receipt'
    Assert-Equal $dashboard.Range('AK5').Value2 7000000 'COD chart reacts to partial receipt'
    foreach ($age in @(0,1,3,4,7,8)) {
        $orders.Range('H203').Value2 = [double][datetime]::Today.AddDays(-$age).ToOADate()
        $excel.CalculateFullRebuild()
        $cell = if ($age -eq 0) {'AK3'} elseif ($age -le 3) {'AK4'} elseif ($age -le 7) {'AK5'} else {'AK6'}
        $expected = if ($age -gt 7) {8889000} else {7000000}
        Assert-Equal $dashboard.Range($cell).Value2 $expected "COD age boundary $age"
    }
    $orders.Range('D202').Value2 = $catalog.Range('E62').Value2
    $orders.Range('E202').Value2 = [double]9000000
    $excel.CalculateFullRebuild()
    Assert-Equal $dashboard.Range('AQ4').Value2 9000000 'Tied products retain both revenues'
    if ($dashboard.Range('AP3').Value2 -eq $dashboard.Range('AP4').Value2) {throw 'Duplicate product in tied ranking'}
    $checks.Add('Tied products use distinct labels')
    $orders.Range('A4:J203').ClearContents()
    $cash.Range('A4:F203').ClearContents()
    $excel.CalculateFullRebuild()
    foreach ($range in @('AB3:AB10','AE3:AE10','AH3:AH7','AK3:AK6','AN3:AN4','AQ3:AQ7')) {
        Assert-Equal $excel.WorksheetFunction.Sum($dashboard.Range($range)) 0 "Empty workbook: $range"
    }
    Assert-Equal $dashboard.Range('AP3').Value2 '' 'Empty ranking has blank labels'
    if ($ReportPath) {$checks | ConvertTo-Json | Set-Content -LiteralPath $ReportPath -Encoding utf8}
    Write-Output "PASS: $($checks.Count) Excel checks. All test edits discarded."
} finally {
    if ($book) {$book.Close($false)}
    $excel.Quit()
    [void][System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($excel)
}
