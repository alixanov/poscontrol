@echo off
chcp 65001 > nul
title Store and POS Launcher

echo =========================================================
echo   Склад и Магазин — Автоматизация торговли и кассы
echo =========================================================
echo.
echo [1/2] Запуск Backend API сервера (порт 4000)...
start "" "%~dp0scripts\start_backend.bat"

rem Небольшая пауза перед запуском фронтенда
ping 127.0.0.1 -n 3 > nul

echo [2/2] Запуск Frontend POS и Admin (порт 3001)...
start "" "%~dp0scripts\start_frontend.bat"

echo.
echo =========================================================
echo   Оба сервиса запущены в отдельных окнах!
echo.
echo   Веб-интерфейс:     http://localhost:3001
echo   Swagger API:       http://localhost:4000/api/docs
echo.
echo   Данные для входа:
echo   - Администратор: admin@store.local / admin123 (PIN: 1111)
echo   - Кассир:        cashier1@store.local / cashier123 (PIN: 2222)
echo =========================================================
echo.
echo Окно можно закрыть или свернуть. Сервисы продолжат работу.
pause
