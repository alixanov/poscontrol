@echo off
chcp 65001 > nul
title Store Backend API (Port 4000)
cd /d "%~dp0..\server"

echo ========================================================
echo   Store Backend API: http://localhost:4000/api
echo   Swagger Docs:      http://localhost:4000/api/docs
echo ========================================================
echo.
node dist\src\main.js
if %errorlevel% neq 0 (
    echo.
    echo [ОШИБКА] Сервер завершился с кодом ошибки %errorlevel%
)
echo.
pause
