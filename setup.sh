#!/bin/bash

# Sunset Downloader - Setup Script
# This script helps you install all dependencies needed for multi-platform downloads

set -e

echo "🌅 Sunset Downloader - Setup Script"
echo "===================================="
echo ""

# Check if Node.js is installed
echo "Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "   Install from: https://nodejs.org/"
    exit 1
fi
echo "✅ Node.js $(node --version) is installed"

# Check if npm is installed
echo "Checking npm..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    echo "   It should come with Node.js. Try reinstalling Node.js"
    exit 1
fi
echo "✅ npm $(npm --version) is installed"

# Check if Python is installed
echo "Checking Python..."
if command -v python3 &> /dev/null; then
    echo "✅ Python 3 is installed ($(python3 --version))"
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    echo "✅ Python is installed ($(python --version))"
    PYTHON_CMD="python"
else
    echo "⚠️  Python is not installed (optional but recommended)"
    echo "   Install from: https://python.org"
    echo "   Then install yt-dlp: pip install yt-dlp"
    PYTHON_CMD=""
fi

# Check if FFmpeg is installed
echo "Checking FFmpeg..."
if command -v ffmpeg &> /dev/null; then
    echo "✅ FFmpeg is installed ($(ffmpeg -version | head -n1))"
else
    echo "⚠️  FFmpeg is not installed (optional, needed for MP3 conversion)"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "   Install with: brew install ffmpeg"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "   Install with: sudo apt-get install ffmpeg"
    fi
fi

# Install yt-dlp if Python is available
if [ ! -z "$PYTHON_CMD" ]; then
    echo ""
    echo "Checking yt-dlp..."
    if command -v yt-dlp &> /dev/null; then
        echo "✅ yt-dlp is already installed ($(yt-dlp --version))"
    else
        echo "📦 Installing yt-dlp..."
        $PYTHON_CMD -m pip install --upgrade yt-dlp
        if command -v yt-dlp &> /dev/null; then
            echo "✅ yt-dlp installed successfully ($(yt-dlp --version))"
        else
            echo "⚠️  yt-dlp installation may have failed"
            echo "   Try manually: pip install yt-dlp"
        fi
    fi
fi

# Install Node dependencies
echo ""
echo "📦 Installing Node dependencies..."
if [ -f "package-lock.json" ]; then
    npm install
elif [ -f "pnpm-lock.yaml" ]; then
    npm install -g pnpm
    pnpm install
else
    npm install
fi
echo "✅ Node dependencies installed"

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Available platforms:"
if command -v yt-dlp &> /dev/null; then
    echo "✅ All 1000+ platforms (YouTube, Spotify, Instagram, TikTok, etc.)"
else
    echo "⚠️  YouTube only (install yt-dlp for all platforms)"
fi

echo ""
echo "Next: Run 'npm run dev' to start the app"
echo ""
