@echo off
setlocal
cd /d "%~dp0"

:: If --show-args is passed, skip the hidden VBS wrapper
if /I "%~1"=="--show-args" goto :START_SYSTEM

:: If not hidden yet, launch silently via VBS and exit
if /I not "%~1"=="--hidden" (
    echo Set wshShell = CreateObject("WScript.Shell"^) > "%temp%\kosan_launcher.vbs"
    echo wshShell.Run "cmd /c """"%~f0"""" --hidden", 0, False >> "%temp%\kosan_launcher.vbs"
    cscript //nologo "%temp%\kosan_launcher.vbs"
    del "%temp%\kosan_launcher.vbs"
    exit /b
)

:START_SYSTEM

:: 1. Auto Update dari GitHub
where git >nul 2>nul
if %errorlevel% equ 0 (
    echo [INFO] Memeriksa pembaruan sistem dari GitHub...
    git pull origin Develop
)

:: 2. Setup Node.js Check
where node >nul 2>nul
if %errorlevel% neq 0 (
    powershell -Command "[System.Windows.Forms.MessageBox]::Show('Node.js tidak ditemukan! Harap install Node.js terlebih dahulu.', 'Error', 0, 16)"
    exit /b
)

:: 3. Setup .env Security
if not exist "backend\.env" (
    powershell -Command "[IO.File]::WriteAllBytes('backend\.env', [Convert]::FromBase64String('UE9SVD0zMDExDQpNT05HT0RCX1VSST1tb25nb2RiOi8vbG9jYWxob3N0OjI3MDE3L2tvc2FuLWZpbw0KTUFTVEVSX1BJTj04ODg4ODgNClJFU0VUX1BJTj05OTk5OTk='))"
)
if not exist "frontend\.env" (
    powershell -Command "[IO.File]::WriteAllBytes('frontend\.env', [Convert]::FromBase64String('TlVYVF9CQUNLRU5EX1VSTD1odHRwOi8vbG9jYWxob3N0OjMwMTENClBPUlQ9MzAxMA=='))"
)

:: 4. Install Dependencies if Missing
if not exist "backend\node_modules\" (
    cd backend && call npm install && cd ..
)
if not exist "frontend\node_modules\" (
    cd frontend && call npm install && cd ..
)

:: 5. Jalankan Server
if /I "%~1"=="--show-args" (
    :: Mode debug: Munculkan jendela console
    start "Kosan - Backend" cmd /k "cd backend && npm run dev"
    start "Kosan - Frontend" cmd /k "cd frontend && npm run dev"
) else (
    :: Mode normal: Sembunyikan console sepenuhnya
    start /b cmd /c "cd backend && npm run dev"
    start /b cmd /c "cd frontend && npm run dev"
)

:: 6. Buat dan Tampilkan GUI Control Panel menggunakan PowerShell
echo Add-Type -AssemblyName System.Windows.Forms > "%temp%\kosan_gui.ps1"
echo $form = New-Object System.Windows.Forms.Form >> "%temp%\kosan_gui.ps1"
echo $form.Text = 'Sistem Manajemen Kosan Fio' >> "%temp%\kosan_gui.ps1"
echo $form.Size = New-Object System.Drawing.Size(320,240) >> "%temp%\kosan_gui.ps1"
echo $form.StartPosition = 'CenterScreen' >> "%temp%\kosan_gui.ps1"
echo $form.FormBorderStyle = 'FixedDialog' >> "%temp%\kosan_gui.ps1"
echo $form.MaximizeBox = $false >> "%temp%\kosan_gui.ps1"
echo $lbl = New-Object System.Windows.Forms.Label >> "%temp%\kosan_gui.ps1"
echo $lbl.Text = 'Server sedang menyala di background.' >> "%temp%\kosan_gui.ps1"
echo $lbl.Location = New-Object System.Drawing.Point(20,15) >> "%temp%\kosan_gui.ps1"
echo $lbl.AutoSize = $true >> "%temp%\kosan_gui.ps1"
echo $form.Controls.Add($lbl) >> "%temp%\kosan_gui.ps1"
echo $b1 = New-Object System.Windows.Forms.Button >> "%temp%\kosan_gui.ps1"
echo $b1.Text = 'Buka Aplikasi (Browser)' >> "%temp%\kosan_gui.ps1"
echo $b1.Location = New-Object System.Drawing.Point(50,50) >> "%temp%\kosan_gui.ps1"
echo $b1.Size = New-Object System.Drawing.Size(200,35) >> "%temp%\kosan_gui.ps1"
echo $b1.Add_Click({ Start-Process 'http://localhost:3010' }) >> "%temp%\kosan_gui.ps1"
echo $form.Controls.Add($b1) >> "%temp%\kosan_gui.ps1"
echo $b2 = New-Object System.Windows.Forms.Button >> "%temp%\kosan_gui.ps1"
echo $b2.Text = 'Biarkan Menyala (Minimize)' >> "%temp%\kosan_gui.ps1"
echo $b2.Location = New-Object System.Drawing.Point(50,95) >> "%temp%\kosan_gui.ps1"
echo $b2.Size = New-Object System.Drawing.Size(200,35) >> "%temp%\kosan_gui.ps1"
echo $b2.Add_Click({ $form.WindowState = 'Minimized' }) >> "%temp%\kosan_gui.ps1"
echo $form.Controls.Add($b2) >> "%temp%\kosan_gui.ps1"
echo $b3 = New-Object System.Windows.Forms.Button >> "%temp%\kosan_gui.ps1"
echo $b3.Text = 'Matikan Semua Server' >> "%temp%\kosan_gui.ps1"
echo $b3.Location = New-Object System.Drawing.Point(50,140) >> "%temp%\kosan_gui.ps1"
echo $b3.Size = New-Object System.Drawing.Size(200,35) >> "%temp%\kosan_gui.ps1"
echo $b3.BackColor = 'LightCoral' >> "%temp%\kosan_gui.ps1"
echo $b3.Add_Click({ Stop-Process -Name 'node' -Force -ErrorAction SilentlyContinue; $form.Close() }) >> "%temp%\kosan_gui.ps1"
echo $form.Controls.Add($b3) >> "%temp%\kosan_gui.ps1"
echo $form.Add_FormClosed({ Stop-Process -Name 'node' -Force -ErrorAction SilentlyContinue }) >> "%temp%\kosan_gui.ps1"
echo $form.ShowDialog() ^| Out-Null >> "%temp%\kosan_gui.ps1"

powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%temp%\kosan_gui.ps1"
del "%temp%\kosan_gui.ps1"

exit /b
