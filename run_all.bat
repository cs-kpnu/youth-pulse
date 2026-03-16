@echo off
setlocal

echo [1/4] Checking environment...

:: Check for .env file
if not exist .env (
    echo [WARNING] .env file not found in root directory!
    echo Please copy .env.example to .env and fill in your keys.
    pause
    exit /b 1
)

:: Check for python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found! Please install Python.
    pause
    exit /b 1
)

:: Check for node
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found! Please install Node.js.
    pause
    exit /b 1
)

echo [2/4] Starting Backend (FastAPI)...
cd backend
if not exist venv (
    echo [INFO] Creating virtual environment...
    python -m venv venv
)
echo [INFO] Installing backend dependencies...
call venv\Scripts\activate
pip install -r requirements.txt
start "YouthPulse Backend" cmd /c "venv\Scripts\activate && uvicorn main:app --reload --host 127.0.0.1 --port 8000"
cd ..

echo [3/4] Starting Frontend (React)...
cd frontend
if not exist node_modules (
    echo [INFO] Installing frontend dependencies...
    npm install
)
echo [INFO] Starting Vite dev server...
start "YouthPulse Frontend" cmd /c "npm run dev"
cd ..

echo ======================================================
echo [4/4] YouthPulse v2.0 is starting!
echo.
echo Backend API: http://127.0.0.1:8000
echo Frontend UI: http://localhost:5173
echo.
echo (Make sure MongoDB is running locally or via Atlas)
echo ======================================================
echo Processes are running in separate windows.
pause
