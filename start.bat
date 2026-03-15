@echo off
title Find My Pet - Dev Server
echo.
echo  ===========================================
echo   Find My Pet - Iniciando servidor local...
echo   http://localhost:5174
echo  ===========================================
echo.
cd /d "%~dp0"
npm run dev
pause
