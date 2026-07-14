@echo off
REM Start Bakery Frontend Server

echo ========================================
echo Starting Bakery Frontend Server
echo ========================================
echo.

cd /d "%~dp0frontend"

REM Create .env.local if it doesn't exist to ensure API communication
if not exist ".env.local" (
    echo Creating default frontend/.env.local file...
    echo REACT_APP_API_URL=http://localhost:8001/api > .env.local
)

echo Frontend directory: %cd%
echo.

echo Ensuring frontend dependencies are installed...
call npm install
echo.

echo Starting frontend development server on http://localhost:3001...
echo Frontend will be available at:
echo   - http://localhost:3001
echo   - http://127.0.0.1:3001
echo.
echo Ensure backend is running on http://localhost:8001
echo.
echo Press Ctrl+C to stop the server.
echo.

REM Set port to 3001 explicitly
npx react-scripts start --port 3001

pause
