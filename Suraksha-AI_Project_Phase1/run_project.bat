@echo off
title Suraksha-AI Services Launcher
echo ========================================================
echo          LAUNCHING SURAKSHA-AI CORE SERVICES
echo ========================================================
echo.

:: Detect workspace root directory
set WORKSPACE_DIR=%~dp0
cd /d "%WORKSPACE_DIR%"

echo [1/3] Starting Flask Backend REST APIs...
:: Launch Flask dev server in a new window
start "Suraksha-AI Backend" cmd /k "cd Backend && .\venv\Scripts\python run.py"

echo.
echo [2/3] Starting React + Vite Frontend SPA...
:: Launch React dev server in a new window
start "Suraksha-AI Frontend" cmd /k "cd Frontend && npm run dev"

echo.
echo [3/3] Starting New1 Target Application...
:: Launch New1 Target App in a new window
start "New1 Target App" cmd /k "cd New1 && node server.js"

echo.
echo ========================================================
echo Services launched successfully in separate processes!
echo.
echo * Backend API:        http://localhost:5000/api
echo * Frontend Dashboard: http://localhost:5173
echo * New1 Target App:    http://localhost:3000
echo ========================================================
echo.
echo Press any key to exit this launcher terminal window.
pause > nul
