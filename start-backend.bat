@echo off
REM Start Bakery Backend Server

echo ========================================
echo Starting Bakery Backend Server
echo ========================================
echo.

cd /d "%~dp0backend"

echo Backend directory: %cd%
echo.

REM Check if .venv-1 exists
if not exist ".venv-1" (
    echo ERROR: Virtual environment not found at .venv-1
    echo Please run: python -m venv .venv-1
    pause
    exit /b 1
)

REM Activate venv and start backend
call .venv-1\Scripts\activate.bat

echo Activating virtual environment...
echo.

echo Starting uvicorn server on http://0.0.0.0:8000...
echo Backend will be available at:
echo   - http://localhost:8000
echo   - http://127.0.0.1:8000
echo.
echo Press Ctrl+C to stop the server.
echo.

python -m uvicorn server:app --host 0.0.0.0 --port 8000 --reload --log-level info

pause
