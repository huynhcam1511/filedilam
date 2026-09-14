param(
    [ValidateSet('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')]
    [string]$Day = 'Monday',
    [ValidatePattern('^([01]\d|2[0-3]):[0-5]\d$')]
    [string]$Time = '08:00',
    [string]$TaskName = 'FileDiLam-Weekly-Market-Research'
)

$pipelineRoot = Split-Path -Parent $PSScriptRoot
$projectRoot = Split-Path -Parent $pipelineRoot
$scriptPath = Join-Path $pipelineRoot 'scripts\run_pipeline.py'
$logDir = Join-Path $pipelineRoot 'logs'
$python = (Get-Command python -ErrorAction Stop).Source

if (-not (Test-Path -LiteralPath $scriptPath)) {
    throw "Không tìm thấy pipeline: $scriptPath"
}

New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$action = New-ScheduledTaskAction -Execute $python -Argument "`"$scriptPath`" --live --rotation --max-jobs 2" -WorkingDirectory $projectRoot
$trigger = New-ScheduledTaskTrigger -Weekly -WeeksInterval 1 -DaysOfWeek $Day -At $Time
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Hours 2)

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Description 'File Đi Làm: Apify market research và báo cáo tuần' -Force
Write-Output "Đã đăng ký ${TaskName}: $Day lúc $Time"
