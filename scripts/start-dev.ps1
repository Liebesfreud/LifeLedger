param(
  [string]$GoPort = "8080",
  [string]$WebPort = "5173"
)

$ErrorActionPreference = "Stop"

# resolve paths relative to this script
$root = Split-Path -Parent $MyInvocation.MyCommand.Definition
$serverDir = Join-Path $root "..\\server"
$webDir = Join-Path $root "..\\front"

Write-Host "Starting SubTrack Go API on port $GoPort and Vite dev server on port $WebPort..."

# prepare logs folder
$logsDir = Join-Path $root "logs"
if (-not (Test-Path $logsDir)) { New-Item -ItemType Directory -Path $logsDir | Out-Null }
$apiLog = Join-Path $logsDir "api.log"
$webLog = Join-Path $logsDir "web.log"

# Start Go API (new window, logs to logs/api.log)
if (-not (Test-Path (Join-Path $serverDir "go.mod"))) {
  throw "server/go.mod not found. Run from repo/scripts."
}
Push-Location $serverDir
$env:PORT = $GoPort
if (-not $env:DATABASE_PATH) { $env:DATABASE_PATH = "./data/subtrack.db" }
if (-not $env:JWT_SECRET) { $env:JWT_SECRET = "please-change-me" }
Write-Host "Launching Go API (PORT=$env:PORT, DATABASE_PATH=$env:DATABASE_PATH)..."
# ensure env vars apply inside child PowerShell
$apiCmd = "`$env:PORT='$GoPort'; `$env:DATABASE_PATH='$($env:DATABASE_PATH)'; `$env:JWT_SECRET='$($env:JWT_SECRET)'; cd `"$PWD`"; go run ./cmd/api *>&1 | Tee-Object -FilePath `"$apiLog`"; Read-Host 'API stopped, press Enter'"
Start-Process powershell -ArgumentList "-NoLogo", "-NoProfile", "-Command", $apiCmd | Out-Null
Pop-Location

# Start Vite dev server (new window, logs to logs/web.log)
if (-not (Test-Path (Join-Path $webDir "package.json"))) {
  throw "front/package.json not found. Run from repo/scripts."
}
Push-Location $webDir
$env:VITE_API_BASE = "http://localhost:$GoPort"
Write-Host "Launching Vite dev server (VITE_API_BASE=$env:VITE_API_BASE, port $WebPort)..."
$webCmd = "`$env:VITE_API_BASE='$($env:VITE_API_BASE)'; cd `"$PWD`"; npm run dev -- --host --port $WebPort *>&1 | Tee-Object -FilePath `"$webLog`"; Read-Host 'Web stopped, press Enter'"
Start-Process powershell -ArgumentList "-NoLogo", "-NoProfile", "-Command", $webCmd | Out-Null
Pop-Location

Write-Host "`nStarted background processes. If you don't see terminals, check Task Manager for node/go processes."
Write-Host "API:     http://localhost:$GoPort/api/health"
Write-Host "Frontend http://localhost:$WebPort"
Write-Host "Logs:    $apiLog , $webLog"
