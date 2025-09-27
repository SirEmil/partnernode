@echo off
title Contract Sender - Start Servers
echo.
echo ==========================================
echo   Starting Contract Sender Servers
echo ==========================================
echo.
echo Opening API server...
start "API Server" cmd /k "cd api && echo API Server Starting on http://localhost:3001 && npm run dev"
echo.
echo Waiting 2 seconds...
timeout /t 2 /nobreak >nul
echo.
echo Opening Frontend server...
start "Frontend Server" cmd /k "cd frontend && set NEXT_PUBLIC_API_URL=http://localhost:3001 && echo Frontend Server Starting on http://localhost:3000 && npm run dev"
echo.
echo ==========================================
echo   SERVERS STARTED!
echo ==========================================
echo.
echo API Server: http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo Two windows have opened with the servers.
echo You can close this window now.
echo.
echo Press any key to close this launcher...
pause >nul
