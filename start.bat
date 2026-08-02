@echo off
title Sistem Manajemen Kosan Fio - Launcher
color 0A

echo =======================================================
echo    Sistem Manajemen Kosan Fio - Auto Setup & Start
echo =======================================================
echo.

:: 1. Periksa apakah Node.js terinstall
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js tidak ditemukan!
    echo Harap install Node.js terlebih dahulu sebelum menjalankan aplikasi ini.
    pause
    exit /b
)

:: 2. Setup Backend (jika node_modules belum ada)
if not exist "backend\node_modules\" (
    echo [INFO] First-Time Setup: Menginstal dependencies Backend...
    cd backend
    call npm install
    cd ..
    echo [INFO] Backend dependencies berhasil diinstal!
    echo.
) else (
    echo [INFO] Backend dependencies sudah terinstal.
)

:: 3. Setup Frontend (jika node_modules belum ada)
if not exist "frontend\node_modules\" (
    echo [INFO] First-Time Setup: Menginstal dependencies Frontend...
    cd frontend
    call npm install
    cd ..
    echo [INFO] Frontend dependencies berhasil diinstal!
    echo.
) else (
    echo [INFO] Frontend dependencies sudah terinstal.
)

:: 4. Jalankan Server
echo [INFO] Memulai Backend Server di background (Port 3011)...
start "Sistem Room - Backend" cmd /k "cd backend && npm run dev"

echo [INFO] Memulai Frontend Server di background (Port 3010)...
start "Sistem Room - Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo =======================================================
echo SETUP SELESAI!
echo Jendela terminal baru telah dibuka untuk menjalankan server.
echo.
echo Silakan buka browser Anda dan akses:
echo Frontend: http://localhost:3010
echo Backend:  http://localhost:3011
echo =======================================================
echo Membuka browser...
start http://localhost:3010
pause
