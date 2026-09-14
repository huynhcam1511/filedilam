$ErrorActionPreference = 'Stop'
$path=(Resolve-Path -LiteralPath 'outputs\tinh_cost_da_nganh_v2.xlsx').Path
$outDir=Join-Path (Get-Location).Path 'scratch\cost_v2_previews'
New-Item -ItemType Directory -Path $outDir -Force | Out-Null
$excel=New-Object -ComObject Excel.Application
$excel.Visible=$false;$excel.DisplayAlerts=$false
try {
  $book=$excel.Workbooks.Open($path,0,$true)
  try {
    $pages=@(
      @('BẮT ĐẦU','A1:B30','bat_dau'),
      @('TỔNG QUAN','A1:Q61','tong_quan'),
      @('BẢNG COST','A1:G14','bang_cost'),
      @('ĐẦU VÀO','A1:L13','dau_vao'),
      @('ĐỊNH MỨC','A1:H13','dinh_muc'),
      @('BÁN THÀNH PHẨM','A1:H12','ban_thanh_pham'),
      @('ĐM SƠ CHẾ','A1:H12','dm_so_che'),
      @('CHI PHÍ CHUNG','A1:E13','chi_phi_chung'),
      @('SẢN PHẨM','A1:O14','san_pham')
    )
    foreach($entry in $pages){
      $sheet=$book.Worksheets.Item($entry[0]);$sheet.PageSetup.PrintArea=$entry[1]
      $sheet.PageSetup.Orientation=2;$sheet.PageSetup.Zoom=$false;$sheet.PageSetup.FitToPagesWide=1;$sheet.PageSetup.FitToPagesTall=1
      $sheet.ExportAsFixedFormat(0,(Join-Path $outDir ($entry[2]+'.pdf')))
    }
  } finally {$book.Close($false)}
} finally {$excel.Quit()}
Get-ChildItem $outDir -Filter '*.pdf' | Select-Object Name,Length
