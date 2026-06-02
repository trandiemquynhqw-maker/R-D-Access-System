@echo off
echo Starting R^&D Access System...
echo.

:: Start Backend
echo Starting Backend Server on port 5000...
start "Backend Server" cmd /k "cd backend && npm run dev"

:: Start Frontend
echo Starting Frontend Application on port 3000...
start "Frontend Application" cmd /k "cd frontend && npm start"

echo.
echo Both services are starting up in separate windows.
echo Please keep those windows open while using the system.
echo.
exit
