$ErrorActionPreference='Stop'
$file=Join-Path $PSScriptRoot '../../outputs/cost_v5_20261010/File_Di_Lam_Cost_Mon_v5.xlsx'
$file=(Resolve-Path -LiteralPath $file).Path
$excel=New-Object -ComObject Excel.Application
$excel.Visible=$false
$excel.DisplayAlerts=$false
$report=[System.Collections.Generic.List[object]]::new()
function Check($name,$actual,$expected){
 $ok=if($expected -is [double] -or $expected -is [int]){ $null -ne $actual -and [Math]::Abs([double]$actual-[double]$expected) -lt 0.001 }else{[string]$actual -eq [string]$expected}
 $report.Add(@{test=$name;actual=$actual;expected=$expected;pass=$ok})
 if(-not $ok){throw "FAILED $name : $actual expected $expected"}
}
try{
 $book=$excel.Workbooks.Open($file,0,$false)
 $raw=$book.Worksheets.Item('NGUYÊN LIỆU');$menu=$book.Worksheets.Item('MÓN');$recipe=$book.Worksheets.Item('CÔNG THỨC');$batch=$book.Worksheets.Item('MẺ');$dash=$book.Worksheets.Item('TỔNG QUAN')
 $excel.CalculateFullRebuild()
 Check 'Cost cà phê đối chiếu tay' $menu.Range('H6').Value2 11340
 Check 'Trà mẻ đối chiếu tay' $batch.Range('F6').Value2 26000
 Check 'Món 11 nhiều thành phần và hai mẻ' $menu.Range('H16').Value2 ([double](150*26000/1800+20*26000/1500+100*32+20*58+40*70+20*65+15*72+150*1.25+600+280+180))
 Check 'Tổng quan bao phủ món 11' $dash.Range('A58').Value2 'M011'
 Check '13 món hợp lệ' $dash.Range('D6').Value2 13
 $old=$raw.Range('D6').Value2;$raw.Range('D6').Value2=440000;$excel.CalculateFullRebuild();Check 'Đổi giá cập nhật cost' $menu.Range('H6').Value2 19590;$raw.Range('D6').Value2=$old
 $old=$raw.Range('D10').Value2;$raw.Range('D10').Value2=360000;$excel.CalculateFullRebuild();Check 'Đổi giá cập nhật mẻ' $batch.Range('F6').Value2 44000;Check 'Đổi giá cập nhật món dùng mẻ' $menu.Range('H16').Value2 ([double](13300.8333333333+1500));$raw.Range('D10').Value2=$old
 $raw.Range('D6').ClearContents();$excel.CalculateFullRebuild();Check 'Thiếu giá không ra tổng thiếu' $menu.Range('H6').Value2 '';Check 'Thiếu giá có cảnh báo' $raw.Range('I6').Value2 'Thiếu / sai giá';$raw.Range('D6').Value2=220000
 $recipe.Range('E6').ClearContents();$excel.CalculateFullRebuild();Check 'Thiếu định lượng chặn cost' $menu.Range('H6').Value2 '';$recipe.Range('E6').Value2=0;$excel.CalculateFullRebuild();Check 'Định lượng 0 chặn cost' $menu.Range('H6').Value2 '';$recipe.Range('E6').Value2=30
 $raw.Range('A7').Value2='NL001';$excel.CalculateFullRebuild();Check 'Trùng mã không lấy bản ghi đầu' $menu.Range('H6').Value2 '';$raw.Range('A7').Value2='NL002'
 $oldName=[string]$raw.Range('B6').Value2;$raw.Range('B6').Value2='Cà phê đổi tên';$excel.CalculateFullRebuild();Check 'Đổi tên giữ liên kết' $menu.Range('H6').Value2 11340;Check 'Đổi tên hiển thị ở công thức' $recipe.Range('D6').Value2 'Cà phê đổi tên';$raw.Range('B6').Value2=[string]$oldName
 $raw.Range('A6').ClearContents();$excel.CalculateFullRebuild();Check 'Xóa mã đang dùng chặn cost' $menu.Range('H6').Value2 '';$raw.Range('A6').Value2='NL001'
 $batch.Range('C6').Value2=0;$excel.CalculateFullRebuild();Check 'Mẻ lượng thu 0 chặn món liên quan' $menu.Range('H16').Value2 '';$batch.Range('C6').Value2=1800
 $batch.Range('C32').Value2='ME002';$excel.CalculateFullRebuild();Check 'Không tham chiếu mẻ nhiều tầng' $menu.Range('H16').Value2 '';$batch.Range('C32').Value2='NL005'
 $raw.Range('D6').Value2=0;$excel.CalculateFullRebuild();Check 'Giá 0 hợp lệ không coi là thiếu' $menu.Range('H6').Value2 3090;$raw.Range('D6').Value2=220000
 $raw.Range('A205').Value2='NL200';$raw.Range('B205').Value2='Nguyên liệu cuối';$raw.Range('C205').Value2='Nguyên liệu';$raw.Range('D205').Value2=100000;$raw.Range('E205').Value2=1000;$raw.Range('F205').Value2='g'
 $menu.Range('A65').Value2='M060';$menu.Range('B65').Value2='Món cuối';$menu.Range('C65').Value2='ly';$menu.Range('D65').Value2=50000;$menu.Range('E65').Value2=0
 $recipe.Range('A605').Value2='M060';$recipe.Range('C605').Value2='NL200';$recipe.Range('E605').Value2=600;$excel.CalculateFullRebuild()
 Check 'Dòng cuối cost đúng' $menu.Range('H65').Value2 60000;Check 'Dòng cuối vào bảng tổng quan' $dash.Range('A107').Value2 'M060';Check 'Dòng cuối thay đổi top biểu đồ' $dash.Range('AA6').Value2 'Món cuối'
 Check 'Dropdown cuối vùng có rule' $recipe.Range('C605').Validation.Type 3;Check 'Dropdown chấp nhận mã mới' $recipe.Range('C605').Validation.Value $true
 $raw.Range('A205:G205').ClearContents();$menu.Range('A65:E65').ClearContents();$recipe.Range('A605').ClearContents();$recipe.Range('C605').ClearContents();$recipe.Range('E605').ClearContents()
 # Sort full raw table to verify stable-code lookups, then restore by code.
 $raw.Range('A5:J205').Sort($raw.Range('B6'),2,$null,$null,1,$null,1,1)
 $excel.CalculateFullRebuild();Check 'Sắp xếp toàn bảng giữ cost' $menu.Range('H6').Value2 11340
 $raw.Range('A5:J205').Sort($raw.Range('A6'),1,$null,$null,1,$null,1,1)
 $excel.CalculateFullRebuild()
 # Supplement only native features not exposed by documented artifact APIs.
 foreach($s in $book.Worksheets){$s.Cells.Locked=$true;$s.PageSetup.Orientation=2;$s.PageSetup.Zoom=$false;$s.PageSetup.FitToPagesWide=1;$s.PageSetup.FitToPagesTall=$false}
 $raw.Range('A6:G205').Locked=$false;$menu.Range('A6:E65').Locked=$false
 foreach($r in @('A6:A605','C6:C605','E6:E605')){$recipe.Range($r).Locked=$false}
 foreach($r in @('A6:E25','A32:A231','C32:C231','E32:E231')){$batch.Range($r).Locked=$false}
 $raw.Columns.Item('J:J').Hidden=$true;$menu.Columns.Item('L:L').Hidden=$true;$recipe.Columns.Item('AA:AF').Hidden=$true;$batch.Columns.Item('J:J').Hidden=$true;$dash.Columns.Item('AA:AE').Hidden=$true
 $raw.Range('A5:I205').AutoFilter()|Out-Null;$menu.Range('A5:K65').AutoFilter()|Out-Null;$recipe.Range('A5:J605').AutoFilter()|Out-Null
 foreach($s in @($raw,$menu,$recipe,$batch)){
  try{$vs=$s.Cells.SpecialCells(-4174);foreach($area in $vs.Areas){$area.Validation.ShowError=$true;$area.Validation.ErrorTitle='Chọn giá trị trong danh sách';$area.Validation.ErrorMessage='Hãy chọn mục có sẵn hoặc thêm vào danh mục trước.';$area.Validation.InCellDropdown=$true}}catch{}
 }
 foreach($chart in $dash.ChartObjects()){$chart.Chart.PlotVisibleOnly=$false}
 foreach($s in $book.Worksheets){$s.Protect('', $true,$true,$true,$false,$false,$false,$false,$false,$false,$false,$false,$false,$true,$true,$false)}
 Check 'Ô nhập vẫn mở khóa' $recipe.Range('C605').Locked $false;Check 'Công thức khóa' $recipe.Range('H6').Locked $true
 $book.Worksheets.Item('BẮT ĐẦU').Activate();$excel.ActiveWindow.Zoom=85
 $excel.CalculateFullRebuild();$book.Save();$book.Close($true)
 $book=$excel.Workbooks.Open($file,0,$true);$excel.CalculateFullRebuild();Check 'Lưu mở lại giữ kết quả' $book.Worksheets.Item('MÓN').Range('H6').Value2 11340;Check 'Lưu mở lại giữ bảo vệ' $book.Worksheets.Item('MÓN').ProtectContents $true
 $errors=@();foreach($s in $book.Worksheets){try{$e=$s.UsedRange.SpecialCells(-4123,16);$errors+=($s.Name+':'+$e.Address())}catch{}}
 Check 'Không lỗi công thức Excel' $errors.Count 0
 $book.Close($false)
}finally{
 $report|ConvertTo-Json -Depth 6|Set-Content -LiteralPath (Join-Path (Split-Path $file) 'native_qc.json') -Encoding UTF8
 $excel.Quit();[System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel)|Out-Null
}
Write-Output ('PASS '+$report.Count+' native Excel checks')
