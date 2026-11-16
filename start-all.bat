@echo off
echo ========================================================
echo  Starting ServiceOps Enterprise ITSM (Backend + Frontend)
echo ========================================================

echo [1/2] Launching Backend NestJS API on http://localhost:4000...
start "ServiceOps Backend (NestJS)" cmd /k "cd /d %~dp0backend && npm run start:dev"

echo [2/2] Launching Frontend Next.js UI on http://localhost:3000...
start "ServiceOps Frontend (Next.js)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Both services are booting up in dedicated windows:
echo   - Backend API: http://localhost:4000
echo   - Frontend UI: http://localhost:3000
echo ========================================================
