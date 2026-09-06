$ErrorActionPreference = "Stop"
$backendDir = Join-Path $PSScriptRoot "..\backend"
Set-Location $backendDir

if (-not (Test-Path ".venv")) {
    Write-Host "No venv found. Run scripts\run_backend.ps1 first to bootstrap."
    exit 1
}

& ".venv\Scripts\python.exe" -m pytest ..\tests
