@echo off
REM Start Bakery Backend Server

echo ========================================
echo Starting Bakery Backend Server
echo ========================================
echo.

cd /d "%~dp0backend"

REM Check for .env file and create a template if it doesn't exist
if not exist ".env" (
    echo.
    echo WARNING: .env file not found in backend directory.
    echo Creating a default .env file. Please fill in your credentials.
    (
        echo SECRET_KEY=your-super-secret-key-that-is-long-and-random
        echo MAIL_USERNAME=your-gmail-username@gmail.com
        echo MAIL_PASSWORD=your-gmail-app-password
        echo GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
        echo GOOGLE_CLIENT_SECRET=your-google-client-secret
    ) > .env
    echo IMPORTANT: Edit the .env file with your actual credentials for email and Google OAuth to work.
)

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

echo Starting uvicorn server on http://0.0.0.0:8001...
echo Backend will be available at:
echo   - http://localhost:8001
echo   - http://127.0.0.1:8001
echo.
echo Press Ctrl+C to stop the server.
echo.

python -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload --log-level info

pause
