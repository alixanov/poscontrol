@echo off
chcp 65001 > nul
title Store Frontend POS (Port 3001)
cd /d "%~dp0..\client"

echo ========================================================
echo   Store Frontend Web: http://localhost:3001
echo ========================================================
echo.
call npm run dev
if %errorlevel% neq 0 (
    echo.
    echo [ОШИБКА] Frontend завершился с кодом ошибки %errorlevel%
)
echo.
pause
