@echo off
echo ========================================
echo Arduino Emulator - Starting Backend
echo ========================================
echo.

cd backend
echo Activating virtual environment...
call venv\Scripts\activate

echo.
echo Starting FastAPI server on http://localhost:8001
echo API Documentation: http://localhost:8001/docs
echo.

uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
