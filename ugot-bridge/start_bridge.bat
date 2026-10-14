@echo off
chcp 65001 >nul
title Cầu Nối Robot UGOT - CodeHiểu

echo =====================================================================
echo           🤖 KHỞI ĐỘNG CẦU NỐI ROBOT UGOT TRÊN WINDOWS 🤖
echo =====================================================================
echo.

cd /d "%~dp0"

:: 1. Kiểm tra Python
set "PY_CMD="
if exist "%LOCALAPPDATA%\Programs\Thonny\python.exe" (
    set "PY_CMD=%LOCALAPPDATA%\Programs\Thonny\python.exe"
    echo [OK] Tìm thấy Python của Thonny IDE.
) else (
    where python >nul 2>nul
    if %errorlevel% equ 0 (
        set "PY_CMD=python"
        echo [OK] Sử dụng Python từ hệ thống.
    ) else (
        where py >nul 2>nul
        if %errorlevel% equ 0 (
            set "PY_CMD=py"
            echo [OK] Sử dụng Python Launcher.
        )
    )
)

if "%PY_CMD%"=="" (
    echo [LỖI] Không tìm thấy Python trên máy tính của bạn!
    echo.
    echo Vui lòng cài đặt một trong các phần mềm sau:
    echo  1. Thonny Python (https://thonny.org)
    echo  2. Hoặc Python 3.8+ từ https://python.org (nhớ tích chọn "Add python.exe to PATH")
    echo.
    echo Sau khi cài đặt xong, hãy chạy lại tệp này.
    echo =====================================================================
    pause
    exit /b 1
)

:: 2. Kiểm tra thư viện websockets và requests
echo Đang kiểm tra thư viện kết nối...
"%PY_CMD%" -c "import websockets, requests" >nul 2>nul
if %errorlevel% neq 0 (
    echo [THÔNG BÁO] Đang cài đặt thư viện cần thiết (websockets, requests)...
    "%PY_CMD%" -m pip install -r requirements.txt
    if %errorlevel% neq 0 (
        echo.
        echo [LỖI] Không thể tự động cài đặt thư viện!
        echo Hãy mở Command Prompt và gõ thủ công:
        echo   "%PY_CMD%" -m pip install websockets requests
        echo.
        pause
        exit /b 1
    )
)

:: 3. Khởi chạy cầu nối bridge.py
echo.
echo =====================================================================
echo Đang chạy bridge.py với: "%PY_CMD%"
echo =====================================================================
echo.

"%PY_CMD%" "%~dp0bridge.py"

if %errorlevel% neq 0 (
    echo.
    echo =====================================================================
    echo [CẢNH BÁO] Cầu nối đã kết thúc với mã lỗi: %errorlevel%
    echo Vui lòng kiểm tra lại cấu hình hoặc đường dẫn mạng.
    echo =====================================================================
)

pause
