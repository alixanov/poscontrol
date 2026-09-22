@echo off
chcp 65001 > nul
title Store Frontend POS (Port 3001)
cd /d "%~dp0..\client"

echo [%date% %time%] Запуск веб-интерфейса на http://localhost:3001...
call npm run dev -- -p 3001
pause
