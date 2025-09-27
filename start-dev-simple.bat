@echo off
title Contract Sender - Development Launcher
color 0A

echo.
echo ==========================================
echo   Contract Sender Development Launcher
echo ==========================================
echo.

echo Step 1: Checking if Node.js is installed...
node --version
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    echo.
    echo Press any key to exit...
    pause
    exit /b 1
)
echo OK - Node.js is installed
echo.

echo Step 2: Checking if npm is installed...
npm --version
if %errorlevel% neq 0 (
    echo.
    echo ERROR: npm is not installed!
    echo.
    echo Press any key to exit...
    pause
    exit /b 1
)
echo OK - npm is installed
echo.

echo Step 3: Checking project structure...
if not exist "api" (
    echo ERROR: api folder not found!
    echo Make sure you're running this from the project root directory.
    echo.
    echo Press any key to exit...
    pause
    exit /b 1
)
echo OK - api folder found

if not exist "frontend" (
    echo ERROR: frontend folder not found!
    echo Make sure you're running this from the project root directory.
    echo.
    echo Press any key to exit...
    pause
    exit /b 1
)
echo OK - frontend folder found
echo.

echo Step 4: Installing dependencies (this may take a few minutes)...
echo.

echo Installing root dependencies...
npm install
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to install root dependencies
    echo.
    echo Press any key to exit...
    pause
    exit /b 1
)
echo OK - Root dependencies installed
echo.

echo Installing API dependencies...
cd api
npm install
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to install API dependencies
    echo.
    echo Press any key to exit...
    pause
    exit /b 1
)
echo OK - API dependencies installed
cd ..
echo.

echo Installing Frontend dependencies...
cd frontend
npm install
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to install Frontend dependencies
    echo.
    echo Press any key to exit...
    pause
    exit /b 1
)
echo OK - Frontend dependencies installed
cd ..
echo.

echo Step 5: Checking environment file...
if not exist ".env" (
    echo WARNING: .env file not found!
    echo Please copy env.example to .env and add your API tokens
    echo.
) else (
    echo OK - .env file found
)
echo.

echo Step 6: Starting servers...
echo.
echo Opening API server window...
start "API Server" cmd /k "cd api && echo API Server Starting... && npm run dev"

echo Waiting 3 seconds before starting frontend...
timeout /t 3 /nobreak

echo Opening Frontend server window...
start "Frontend Server" cmd /k "cd frontend && echo Frontend Server Starting... && npm run dev"

echo.
echo ==========================================
echo   SERVERS STARTED SUCCESSFULLY!
echo ==========================================
echo.
echo API Server: http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo Two new windows have opened with the servers.
echo You can close this window now.
echo.
echo To stop the servers, close the individual server windows.
echo.
echo Press any key to close this launcher...
pause
