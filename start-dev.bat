@echo off
start "RZD backend" cmd /k "%~dp0start-backend.bat"
start "RZD frontend" cmd /k "%~dp0start-frontend.bat"
