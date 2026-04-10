@echo off
echo ========================================
echo GLIMMER APP SETUP AND STARTUP
echo ========================================
echo.

echo Step 1: Installing Python dependencies...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: Failed to install Python dependencies
    pause
    exit /b 1
)

echo.
echo Step 2: Running database migration...
python migrate_db.py
if %errorlevel% neq 0 (
    echo ERROR: Database migration failed
    pause
    exit /b 1
)

echo.
echo Step 3: Starting backend server...
start "Backend Server" cmd /k "python app.py"

echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo.
echo Step 4: Starting frontend...
echo Make sure you have run 'npm install' in the project directory first
start "Frontend" cmd /k "npm start"

echo.
echo ========================================
echo SETUP COMPLETE!
echo ========================================
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Both servers should be starting now...
echo You can close this window.
pause
