@echo off
echo Starting debug batch file...
echo.
echo Current directory: %CD%
echo.
echo Checking if we're in the right location...
dir
echo.
echo Press any key to continue...
pause
echo.
echo Checking Node.js...
node --version
echo.
echo Press any key to continue...
pause
echo.
echo Checking npm...
npm --version
echo.
echo Press any key to continue...
pause
echo.
echo Checking if api folder exists...
if exist "api" (
    echo api folder found
) else (
    echo api folder NOT found
)
echo.
echo Checking if frontend folder exists...
if exist "frontend" (
    echo frontend folder found
) else (
    echo frontend folder NOT found
)
echo.
echo Press any key to exit...
pause
