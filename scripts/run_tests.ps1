$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$python = Join-Path $repoRoot "backend\.venv\Scripts\python.exe"

if (-not (Test-Path $python)) {
    Write-Host "No venv found. Run scripts\run_backend.ps1 first to bootstrap."
    exit 1
}

# Run from the repo root so pytest.ini's testpaths resolves both suites
# (tests/ and backend/tests/). Running from backend/ only collects backend/tests.
Push-Location $repoRoot
& $python -m pytest
$exitCode = $LASTEXITCODE
Pop-Location
exit $exitCode
