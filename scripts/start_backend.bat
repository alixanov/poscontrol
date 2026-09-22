@echo off
chcp 65001 > nul
title Store Backend API (Port 4000)
cd /d "%~dp0..\server"

echo [%date% %time%] Запуск API сервера на http://localhost:4000/api...
node dist/src/main.js
pause
