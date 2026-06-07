@echo off
title Servidor Local - Portafolio Pepe Cárdenas
echo ==========================================
echo   Iniciando Servidor Local de Desarrollo
echo   Acceso: http://localhost:3000/
echo ==========================================
start "" "http://localhost:3000/"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1"
pause
