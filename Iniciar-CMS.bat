@echo off
title Servidor Local - CMS Portafolio Pepe Cárdenas
echo ==========================================
echo   Iniciando Servidor Local para el CMS
echo   Acceso: http://localhost:3000/cms.html
echo ==========================================
start "" "http://localhost:3000/cms.html"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1"
pause
