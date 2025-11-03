# Quick Start Script for Modelia AI Studio
# Run this in PowerShell: .\quick-start.ps1

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  Modelia AI Studio - Quick Start" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Kill existing processes
Write-Host "[1/6] Stopping any running Node.js processes..." -ForegroundColor Yellow
taskkill /F /IM node.exe 2>$null
Start-Sleep -Seconds 2

# Step 2: Check dependencies
Write-Host "[2/6] Checking dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "backend\node_modules")) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    Set-Location backend
    npm install
    Set-Location ..
}

if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    Set-Location ..
}

# Step 3: Setup environment
Write-Host "[3/6] Setting up environment..." -ForegroundColor Yellow
if (-not (Test-Path "backend\.env")) {
    Copy-Item "backend\.env.example" "backend\.env"
    Write-Host "Created backend\.env file" -ForegroundColor Green
}

# Step 4: Create uploads directory
Write-Host "[4/6] Creating uploads directory..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "backend\uploads" | Out-Null

# Step 5: Start backend
Write-Host "[5/6] Starting backend server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Backend will start on: http://localhost:3001" -ForegroundColor Cyan
Write-Host ""

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; npm run dev"
Start-Sleep -Seconds 5

# Step 6: Start frontend
Write-Host "[6/6] Starting frontend server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Frontend will start on: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm run dev"

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Two new windows opened:" -ForegroundColor White
Write-Host "  1. Backend (port 3001)" -ForegroundColor White
Write-Host "  2. Frontend (port 3000)" -ForegroundColor White
Write-Host ""
Write-Host "Open your browser to: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "First time? Click 'Sign up' to create an account!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to exit this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

