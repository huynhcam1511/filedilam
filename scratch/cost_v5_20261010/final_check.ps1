$ErrorActionPreference='Stop'
$file=(Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '../../outputs/cost_v5_20261010/File_Di_Lam_Cost_Mon_v5.xlsx')).Path
$app=New-Object -ComObject Excel.Application
$app.Visible=$false;$app.DisplayAlerts=$false
try {
 $b=$app.Workbooks.Open($file,0,$true)
 foreach($s in $b.Worksheets){$s.Unprotect('')}
 $b.Worksheets.Item('NGUYÊN LIỆU').Range('A6:G205').ClearContents()
 $b.Worksheets.Item('MÓN').Range('A6:E65').ClearContents()
 foreach($r in @('A6:A605','C6:C605','E6:E605')){$b.Worksheets.Item('CÔNG THỨC').Range($r).ClearContents()}
 foreach($r in @('A6:E25','A32:A231','C32:C231','E32:E231')){$b.Worksheets.Item('MẺ').Range($r).ClearContents()}
 $app.CalculateFullRebuild()
 foreach($r in @('A6','D6','G6','J6')){if($b.Worksheets.Item('TỔNG QUAN').Range($r).Value2 -ne 0){throw "Clean state failed $r"}}
 foreach($s in $b.Worksheets){$bad=$null;try{$bad=$s.UsedRange.SpecialCells(-4123,16)}catch{};if($null -ne $bad){throw ('Clean state formula error '+$s.Name)}}
 $b.Close($false)
 Write-Output 'PASS clean workbook state without saving temporary changes'
} finally {$app.Quit();[System.Runtime.InteropServices.Marshal]::ReleaseComObject($app)|Out-Null}
