# Local Setup Guide - Run Sunset Downloader Locally

This guide shows you how to run the entire Sunset Downloader app locally on your machine without needing Railway, Netlify, or any external services.

## What You Get

When you follow this guide, you'll have:
- ✅ Frontend (React app) running on `http://localhost:8080`
- ✅ Backend (Node.js server with yt-dlp) running on the same `http://localhost:8080`
- ✅ Full support for YouTube, Spotify, Instagram, TikTok, and 1000+ other platforms
- ✅ Download as MP3 or MP4 directly to your computer
- ✅ Works on Windows, Mac, and Linux

## Prerequisites

You need to install these on your computer:

### 1. Node.js (Required)
Download and install from: https://nodejs.org/
- **Recommended**: Version 18 or higher
- **Includes**: npm (Node Package Manager)

Verify installation:
```bash
node --version
npm --version
```

### 2. Python 3 (Required)
Download and install from: https://www.python.org/
- **Required for yt-dlp to work**
- **Recommended**: Python 3.9 or higher

Verify installation:
```bash
python --version
# or on Mac/Linux
python3 --version
```

### 3. FFmpeg (Recommended for Audio Conversion)
This is needed if you want to download as MP3. Video downloads don't need it.

**Windows:**
- Download from: https://ffmpeg.org/download.html
- Or use: `winget install ffmpeg`
- Or use: `choco install ffmpeg` (if you have Chocolatey)

**Mac:**
```bash
brew install ffmpeg
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install ffmpeg
```

Verify installation:
```bash
ffmpeg -version
```

## Installation Steps

### Quick Setup (Automated)

We've created setup scripts that automatically install everything for you:

**On Mac/Linux:**
```bash
chmod +x setup.sh  # Make script executable (one time only)
./setup.sh
```

**On Windows:**
```bash
setup.bat
```

These scripts will check for Node.js, Python, FFmpeg, and install yt-dlp automatically.

---

### Manual Setup (If Scripts Don't Work)

#### Step 1: Clone or Navigate to Project
```bash
cd sunset-downloader
```

#### Step 2: Install Node Dependencies
```bash
npm install
# or if you use pnpm:
pnpm install
```

#### Step 3: Install yt-dlp
This is the tool that actually downloads from YouTube, Spotify, Instagram, TikTok, etc.

**Windows:**
```bash
pip install yt-dlp
# or if pip is not recognized:
python -m pip install yt-dlp
```

**Mac/Linux:**
```bash
pip3 install yt-dlp
# or
python3 -m pip install yt-dlp
```

Verify installation:
```bash
yt-dlp --version
```

You should see something like: `2024.12.xx`

### Step 4: Run the App

```bash
npm run dev
```

This command:
1. Starts the Node.js backend server with yt-dlp integration
2. Starts the Vite frontend dev server
3. Opens the app at `http://localhost:8080`

**You should see in the terminal:**
```
  ➜  Local:   http://localhost:8080/
  ➜  press h + enter to show help
  [Download] yt-dlp is available for multi-platform downloads
```

## Using the App

1. Open `http://localhost:8080` in your browser
2. Paste a link to any video/audio you want to download:
   - YouTube videos
   - Spotify playlists
   - Instagram reels
   - TikTok videos
   - Twitter/X videos
   - Facebook videos
   - Twitch clips
   - SoundCloud tracks
   - And 1000+ other platforms
3. Choose:
   - **Audio Only** (MP3) - Just the audio
   - **Video + Audio** (MP4) - Full video with sound
4. Click **Download**
5. The file downloads to your Downloads folder

## Troubleshooting

### "Command not found: yt-dlp"
**Solution:** yt-dlp is not installed. Run:
```bash
pip install yt-dlp
# or on Mac/Linux:
pip3 install yt-dlp
```

### "Error: Python not found"
**Solution:** Install Python from https://www.python.org/
Make sure to check "Add Python to PATH" during installation.

### "Download failed" with no audio
**Solution:** Install FFmpeg (see Prerequisites section above).
Without FFmpeg, MP3 conversion won't work, but MP4 videos should still work.

### Download starts but takes a long time
This is normal! Large videos can take a few minutes to download.
The download will timeout after 5 minutes if it's taking too long.

### Port 8080 already in use
If something is already using port 8080, you can change it:
```bash
PORT=3000 npm run dev
```
Then access the app at `http://localhost:3000`

## Next Steps

Once everything is working locally:

### Option 1: Keep Running Locally
You can keep running `npm run dev` whenever you want to use the downloader.
Perfect for personal use or testing!

### Option 2: Deploy to Netlify (Free)
When you're ready to share the app online:
1. Push your code to GitHub
2. Connect GitHub to Netlify
3. Netlify will build and deploy automatically
4. Your friends can access it at `https://your-domain.netlify.app`
5. Note: Multi-platform downloads (Spotify, Instagram, etc.) won't work on Netlify without a separate backend. Use only YouTube on Netlify, or deploy backend to Railway.

### Option 3: Deploy Backend to Railway (Free)
For multi-platform support in production:
1. Deploy the backend to Railway (see RAILWAY_SETUP.md)
2. Deploy the frontend to Netlify
3. Connect them via `VITE_API_URL` environment variable

## Files You're Using

- `code/vite.config.ts` - Integrates Express backend with Vite frontend
- `code/server/routes/download.ts` - Downloads using yt-dlp
- `code/client/pages/Index.tsx` - Main download UI
- `code/server/utils/urlUtils.ts` - Detects which platform a URL is from

## Architecture

```
Your Computer
├── Node.js Server (Backend)
│   ├── Express.js
│   ├── yt-dlp (downloads videos/audio)
│   └── Routes: /api/download, /api/validate-url
└── Vite Dev Server (Frontend)
    ├── React UI
    └── Makes requests to backend
```

Everything runs on your local machine. No cloud services needed!

## Questions?

If something doesn't work:
1. Make sure all prerequisites are installed (Node.js, Python, FFmpeg)
2. Make sure yt-dlp is installed: `yt-dlp --version`
3. Check that no other app is using port 8080
4. Restart: Kill the terminal and run `npm run dev` again
5. Check the terminal for error messages - they'll tell you what's wrong

Enjoy downloading!
