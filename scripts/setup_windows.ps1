# PowerShell setup script for Nexus AI Lab on Windows

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "     NEXUS AI LAB - WINDOWS ENVIRONMENT SETUP       " -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

$ScriptDir = Split-Path -Path $MyInvocation.MyCommand.Definition -Parent
$RootDir = Split-Path -Path $ScriptDir -Parent

Set-Location $RootDir

Write-Host "`n[1/5] Checking Python installation..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version
    Write-Host "Found Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: Python is not installed or not in PATH." -ForegroundColor Red
    exit 1
}

Write-Host "`n[2/5] Creating Python virtual environment..." -ForegroundColor Yellow
if (-not (Test-Path "$RootDir\env")) {
    python -m venv "$RootDir\env"
    Write-Host "Virtual environment created at $RootDir\env" -ForegroundColor Green
} else {
    Write-Host "Virtual environment already exists." -ForegroundColor Green
}

Write-Host "`n[3/5] Installing backend Python dependencies..." -ForegroundColor Yellow
& "$RootDir\env\Scripts\Activate.ps1"
pip install -r "$RootDir\backend\requirements.txt"

Write-Host "`n[4/5] Initializing database and seeding FAQs..." -ForegroundColor Yellow
python "$RootDir\scripts\seed_faqs.py"

Write-Host "`n[5/5] Checking Node.js and installing frontend dependencies..." -ForegroundColor Yellow
try {
    Set-Location "$RootDir\frontend"
    npm install
    Write-Host "Frontend packages installed successfully." -ForegroundColor Green
} catch {
    Write-Host "Warning: npm install failed. Please check Node.js installation." -ForegroundColor Red
}

Set-Location $RootDir

Write-Host "`n====================================================" -ForegroundColor Cyan
Write-Host " SETUP COMPLETE!" -ForegroundColor Green
Write-Host " To start backend:  env\Scripts\python backend\run.py" -ForegroundColor White
Write-Host " To start frontend: cd frontend; npm run dev" -ForegroundColor White
Write-Host "====================================================" -ForegroundColor Cyan
