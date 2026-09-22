@echo off
chcp 65001 > nul
title Store & POS Control Launcher
echo =========================================================
echo   Склад & Магазин — Автоматизация торговли и кассы
echo =========================================================
echo.
echo 1. Запуск Backend API (порт 4000)...
start "Store Backend API" cmd /c "%~dp0scripts\start_backend.bat"

timeout /t 3 /nobreak > nul

echo 2. Запуск Frontend POS & Admin (порт 3001)...
start "Store Frontend POS" cmd /c "%~dp0scripts\start_frontend.bat"

echo.
echo =========================================================
echo   Сервисы запущены:
echo   - Веб-интерфейс:     http://localhost:3001
echo   - Swagger API Docs:  http://localhost:4000/api/docs
echo.
echo   Тестовые доступы:
echo   - Администратор: admin@store.local / admin123 (PIN: 1111)
echo   - Кассир:        cashier1@store.local / cashier123 (PIN: 2222)
echo =========================================================
echo.
pause
