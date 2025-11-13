@echo off
:: --- Check if any Node or Python processes are running ---
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I "node.exe" >NUL
set NODE_RUNNING=%ERRORLEVEL%
tasklist /FI "IMAGENAME eq python.exe" 2>NUL | find /I "python.exe" >NUL
set PYTHON_RUNNING=%ERRORLEVEL%

:: --- If any process is running, stop all and exit ---
if %NODE_RUNNING%==0 (
    echo Node.js processes detected. Stopping all services...
    taskkill /F /IM node.exe >NUL
    taskkill /F /IM python.exe >NUL
    exit
)

if %PYTHON_RUNNING%==0 (
    echo Python processes detected. Stopping all services...
    taskkill /F /IM node.exe >NUL
    taskkill /F /IM python.exe >NUL
    exit
)

:: --- Otherwise, start all services ---
echo No services running. Starting all BananaEYE services...

:: --- Frontend Vite ---
start "Frontend Vite" cmd /k "cd /d C:\Users\Recap\OneDrive\Documents\Banana_Project\BananaEYE-main\frontend-input && npm run dev"

:: --- Frontend Craco ---
start "Frontend Craco" cmd /k "cd /d C:\Users\Recap\OneDrive\Documents\Banana_Project\BananaEYE-main\frontend-output && npm start"

:: --- Backend FastAPI ---
start "Backend FastAPI" cmd /k "cd /d C:\Users\Recap\OneDrive\Documents\Banana_Project\BananaEYE-main\backend && C:\Users\Recap\OneDrive\Documents\Banana_Project\BananaEYE-main\backend\venv\Scripts\python.exe -m uvicorn server:app --reload --host 0.0.0.0 --port 8000"

echo All services started!
pause
