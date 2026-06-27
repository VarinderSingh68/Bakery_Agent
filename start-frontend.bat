@echo off
REM Start Bakery Frontend Server

echo ========================================
echo Starting Bakery Frontend Server
echo ========================================
echo.

cd /d "%~dp0frontend"

echo Frontend directory: %cd%
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo ERROR: node_modules not found
    echo Installing dependencies with npm...
    call npm install
)

echo Starting frontend development server on http://localhost:3001...
echo Frontend will be available at:
echo   - http://localhost:3001
echo   - http://127.0.0.1:3001
echo.
echo Ensure backend is running on http://localhost:8000
echo.
echo Press Ctrl+C to stop the server.
echo.

REM Set port to 3001 explicitly
set PORT=3001
call npm start

pause
