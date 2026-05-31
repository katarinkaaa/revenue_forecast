@echo off
cd /d %~dp0\frontend
if not exist node_modules\.bin\vite.cmd (
  echo Frontend dependencies are missing. Running npm install...
  call npm install --legacy-peer-deps --no-audit --no-fund
)
call npm run dev
pause
