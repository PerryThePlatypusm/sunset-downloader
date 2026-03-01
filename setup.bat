@echo off
REM Sunset Downloader - Windows Setup Script

setlocal enabledelayedexpansion

echo.
echo 🌅 Sunset Downloader - Windows Setup Script
echo =============================================
echo.

REM Check if Node.js is installed
echo Checking Node.js...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed
    echo    Install from: https://nodejs.org/
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js %NODE_VERSION% is installed

REM Check if npm is installed
echo Checking npm...
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm is not installed
    echo    It should come with Node.js. Try reinstalling Node.js
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✅ npm %NPM_VERSION% is installed

REM Check if Python is installed
echo Checking Python...
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%i in ('python --version') do set PYTHON_VERSION=%%i
    echo ✅ Python is installed ^(!PYTHON_VERSION!^)
    set PYTHON_CMD=python
) else (
    echo ⚠️  Python is not installed (optional but recommended)
    echo    Install from: https://python.org
    echo    Then install yt-dlp: pip install yt-dlp
    set PYTHON_CMD=
)

REM Check if FFmpeg is installed
echo Checking FFmpeg...
where ffmpeg >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=1" %%i in ('ffmpeg -version ^| findstr /R "ffmpeg.*version"') do set FFMPEG_VERSION=%%i
    echo ✅ FFmpeg is installed
) else (
    echo ⚠️  FFmpeg is not installed (optional, needed for MP3 conversion)
    echo    Install with: https://ffmpeg.org/download.html
    echo    Or use: winget install ffmpeg
)

REM Install yt-dlp if Python is available
if not "!PYTHON_CMD!"=="" (
    echo.
    echo Checking yt-dlp...
    where yt-dlp >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        for /f "tokens=*" %%i in ('yt-dlp --version') do set YTDLP_VERSION=%%i
        echo ✅ yt-dlp is already installed ^(!YTDLP_VERSION!^)
    ) else (
        echo 📦 Installing yt-dlp...
        !PYTHON_CMD! -m pip install --upgrade yt-dlp
        where yt-dlp >nul 2>nul
        if %ERRORLEVEL% EQU 0 (
            for /f "tokens=*" %%i in ('yt-dlp --version') do set YTDLP_VERSION=%%i
            echo ✅ yt-dlp installed successfully ^(!YTDLP_VERSION!^)
        ) else (
            echo ⚠️  yt-dlp installation may have failed
            echo    Try manually: pip install yt-dlp
        )
    )
)

REM Install Node dependencies
echo.
echo 📦 Installing Node dependencies...
if exist "pnpm-lock.yaml" (
    npm install -g pnpm
    pnpm install
) else (
    npm install
)
echo ✅ Node dependencies installed

echo.
echo 🎉 Setup complete!
echo.
echo Available platforms:
where yt-dlp >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ All 1000+ platforms (YouTube, Spotify, Instagram, TikTok, etc.)
) else (
    echo ⚠️  YouTube only (install yt-dlp for all platforms)
)

echo.
echo Next: Run 'npm run dev' to start the app
echo.

pause
