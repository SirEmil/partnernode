Write-Host "==========================================" -ForegroundColor Green
Write-Host "   Contract Sender Development Launcher" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Step 1: Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "OK - Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Step 2: Checking npm installation..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "OK - npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: npm is not installed!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Step 3: Checking project structure..." -ForegroundColor Yellow
if (Test-Path "api") {
    Write-Host "OK - api folder found" -ForegroundColor Green
} else {
    Write-Host "ERROR: api folder not found!" -ForegroundColor Red
    Write-Host "Make sure you're running this from the project root directory." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

if (Test-Path "frontend") {
    Write-Host "OK - frontend folder found" -ForegroundColor Green
} else {
    Write-Host "ERROR: frontend folder not found!" -ForegroundColor Red
    Write-Host "Make sure you're running this from the project root directory." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Step 4: Installing dependencies..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Cyan

Write-Host ""
Write-Host "Installing root dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install root dependencies" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "OK - Root dependencies installed" -ForegroundColor Green

Write-Host ""
Write-Host "Installing API dependencies..." -ForegroundColor Yellow
Set-Location "api"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install API dependencies" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "OK - API dependencies installed" -ForegroundColor Green
Set-Location ".."

Write-Host ""
Write-Host "Installing Frontend dependencies..." -ForegroundColor Yellow
Set-Location "frontend"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install Frontend dependencies" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "OK - Frontend dependencies installed" -ForegroundColor Green
Set-Location ".."

Write-Host ""
Write-Host "Step 5: Checking environment file..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "OK - .env file found" -ForegroundColor Green
} else {
    Write-Host "WARNING: .env file not found!" -ForegroundColor Yellow
    Write-Host "Please copy env.example to .env and add your API tokens" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 6: Starting servers..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Opening API server window..." -ForegroundColor Cyan
Start-Process cmd -ArgumentList "/k", "cd api && echo API Server Starting... && npm run dev"

Write-Host "Waiting 3 seconds before starting frontend..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

Write-Host "Opening Frontend server window..." -ForegroundColor Cyan
Start-Process cmd -ArgumentList "/k", "cd frontend && echo Frontend Server Starting... && npm run dev"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "   SERVERS STARTED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "API Server: http://localhost:3001" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Two new windows have opened with the servers." -ForegroundColor Green
Write-Host "You can close this window now." -ForegroundColor Green
Write-Host ""
Write-Host "To stop the servers, close the individual server windows." -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter to close this launcher"
