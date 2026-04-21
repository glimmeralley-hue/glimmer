@echo off
echo Starting Glimmer Backend Server...
start "Backend Server" cmd /k "python app.py"

echo Waiting for backend to start...
timeout /t 3 /nobreak >nul

echo Starting Glimmer Frontend...
start "Frontend" cmd /k "npm start"

echo Both servers should be starting now...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
pause
