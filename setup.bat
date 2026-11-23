@echo off
REM ==============================================================================
REM ServiceOps Enterprise ITSM Platform — Windows 1-Click Setup Script
REM ==============================================================================
title ServiceOps Local Setup

echo ==============================================================================
echo            ServiceOps Enterprise ITSM Platform — Windows Quickstart
echo ==============================================================================

echo [1/3] Checking Docker installation...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed or not running.
    echo Please install Docker Desktop for Windows: https://docs.docker.com/desktop/install/windows-install/
    pause
    exit /b 1
)

echo [2/3] Checking environment configuration...
if not exist .env (
    echo Creating .env from .env.example...
    copy .env.example .env >nul
    echo .env created successfully.
) else (
    echo Existing .env detected.
)

echo [3/3] Building and starting ServiceOps containers...
docker compose up -d --build

echo ==============================================================================
echo              ServiceOps is starting up in the background!
echo ==============================================================================
echo   Web Dashboard:     http://localhost:3000
echo   API Documentation: http://localhost:4000/docs
echo.
echo   Default Credentials:
echo     Admin:    admin@serviceops.com    ^| Password: Admin@123
echo     Manager:  manager@serviceops.com  ^| Password: Manager@123
echo     Agent:    agent@serviceops.com    ^| Password: Agent@123
echo     Employee: employee@serviceops.com ^| Password: Employee@123
echo.
echo   To follow logs, run: docker compose logs -f
echo   To stop, run:        docker compose down
echo ==============================================================================
pause
