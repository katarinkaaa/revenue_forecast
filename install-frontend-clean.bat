@echo off
setlocal
cd /d %~dp0\frontend

echo [1/4] Cleaning old frontend install...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del /q package-lock.json

echo [2/4] Cleaning npm cache...
call npm cache clean --force
if errorlevel 1 goto error

echo [3/4] Installing frontend dependencies...
call npm install --legacy-peer-deps --no-audit --no-fund
if errorlevel 1 goto error

echo [4/4] Checking Vite...
if exist node_modules\.bin\vite.cmd (
  echo OK: Vite installed.
) else (
  echo ERROR: Vite was not installed.
  goto error
)

echo Done. Now run: cd frontend && npm run dev
pause
exit /b 0

:error
echo.
echo Installation failed. Try updating npm: npm install -g npm@latest
pause
exit /b 1
