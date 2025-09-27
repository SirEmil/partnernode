@echo off
title Contract Sender Development Environment
echo ========================================
echo Contract Sender Development Environment
echo ========================================
echo.

REM Check if Node.js is installed
echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
) else (
    echo [OK] Node.js is installed
)

REM Check if npm is installed
echo Checking npm installation...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed or not in PATH
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
) else (
    echo [OK] npm is installed
)

echo.
echo Checking dependencies...
echo.

REM Check if node_modules exist, if not install
if not exist "node_modules" (
    echo Installing root dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install root dependencies
        echo.
        echo Press any key to exit...
        pause >nul
        exit /b 1
    )
    echo [OK] Root dependencies installed
) else (
    echo [OK] Root dependencies already installed
)

REM Check API dependencies
if not exist "api\node_modules" (
    echo Installing API dependencies...
    cd api
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install API dependencies
        echo.
        echo Press any key to exit...
        pause >nul
        exit /b 1
    )
    cd ..
    echo [OK] API dependencies installed
) else (
    echo [OK] API dependencies already installed
)

REM Check Frontend dependencies
if not exist "frontend\node_modules" (
    echo Installing Frontend dependencies...
    cd frontend
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install Frontend dependencies
        echo.
        echo Press any key to exit...
        pause >nul
        exit /b 1
    )
    cd ..
    echo [OK] Frontend dependencies installed
) else (
    echo [OK] Frontend dependencies already installed
)

echo.
echo Checking environment configuration...
if not exist ".env" (
    echo [WARNING] .env file not found!
    echo Please copy env.example to .env and configure your environment variables
    echo.
) else (
    echo [OK] .env file found
)

echo.
echo ========================================
echo Starting Development Servers
echo ========================================
echo.
echo API Server: http://localhost:3001
echo Frontend Server: http://localhost:3000
echo.
echo Opening server windows...
echo.

REM Start both servers concurrently
start "Contract Sender - API Server" cmd /k "title API Server && cd api && echo Starting API Server... && npm run dev"
timeout /t 2 /nobreak >nul
start "Contract Sender - Frontend Server" cmd /k "title Frontend Server && cd frontend && echo Starting Frontend Server... && npm run dev"

echo [SUCCESS] Both servers are starting in separate windows!
echo.
echo Check the opened command windows for server logs.
echo You can close this window - the servers will continue running.
echo.
echo To stop the servers, close the individual server windows.
echo.
echo Press any key to close this launcher window...
pause >nul
