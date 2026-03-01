# 🌅 Sunset Downloader

A fast, easy-to-use media downloader that supports **1000+ platforms** including YouTube, Spotify, Instagram, TikTok, Twitter, SoundCloud, and more. Download as MP3 or MP4 from anywhere - directly to your computer.

## ✨ Features

- ✅ **1000+ Platform Support** - YouTube, Spotify, Instagram, TikTok, Twitter, SoundCloud, Facebook, Twitch, Reddit, Pinterest, Crunchyroll, HiAnime, and more
- ✅ **Audio + Video** - Download as MP3 (audio only) or MP4 (video with sound)
- ✅ **Works Locally** - Run on your own computer without needing Railway or external services
- ✅ **No Setup Required** - Just run `npm run dev` (or use the setup script)
- ✅ **Cross-Platform** - Works on Windows, Mac, and Linux
- ✅ **Works on Mobile** - Download on your phone using the web app

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

**On Mac/Linux:**
```bash
chmod +x setup.sh
./setup.sh
```

**On Windows:**
```bash
setup.bat
```

Then:
```bash
npm run dev
```

### Option 2: Manual Setup

1. **Install Prerequisites:**
   - Node.js: https://nodejs.org/ (version 18+)
   - Python: https://python.org (version 3.9+)
   - FFmpeg (optional): `brew install ffmpeg` (Mac) or `apt install ffmpeg` (Linux)

2. **Install Dependencies:**
   ```bash
   npm install
   pip install yt-dlp
   ```

3. **Run the App:**
   ```bash
   npm run dev
   ```

4. **Open in Browser:**
   - Go to `http://localhost:8080`

## 📖 How to Use

1. **Paste a link** to any video or audio you want to download
2. **Choose format:**
   - Audio Only (MP3) - Just the audio
   - Video + Audio (MP4) - Full video with sound
3. **Click Download**
4. **Done!** File automatically downloads to your Downloads folder

## 🎯 Supported Platforms

| Category | Platforms |
|----------|-----------|
| **Video** | YouTube, TikTok, Instagram, Twitter/X, Facebook, Twitch, Reddit, Pinterest |
| **Music** | Spotify, SoundCloud, YouTube Music, Apple Music |
| **Anime** | Crunchyroll, HiAnime |
| **And More** | 1000+ sites supported by yt-dlp |

## 🔧 Troubleshooting

### "Only YouTube is supported"
**Solution:** Install yt-dlp to unlock all platforms
```bash
pip install yt-dlp
```
Then restart the app and refresh your browser.

### "Command not found: yt-dlp"
**Solution:** Make sure yt-dlp is installed:
```bash
pip install yt-dlp
```

### "Python not found"
**Solution:** Install Python from https://python.org
Make sure to check "Add Python to PATH" during installation.

### Download takes a long time
This is normal! Large videos can take several minutes. The app will timeout after 5 minutes if it's taking too long.

### Port 8080 already in use
```bash
PORT=3000 npm run dev
```
Then open `http://localhost:3000`

## 📂 Project Structure

```
code/
├── client/          # Frontend (React)
│   ├── pages/       # Main UI pages
│   ├── components/  # React components
│   └── lib/         # Utilities
├── server/          # Backend (Node.js + Express)
│   ├── routes/      # API endpoints
│   └── utils/       # Server utilities
├── LOCAL_SETUP.md   # Detailed local setup guide
├── setup.sh         # Mac/Linux setup script
├── setup.bat        # Windows setup script
└── package.json     # Dependencies
```

## 🏗️ Architecture

```
Your Computer
├── Frontend (React) on http://localhost:8080
├── Backend (Node.js) on http://localhost:8080/api
│   ├── Uses yt-dlp for downloads
│   ├── Handles multiple platforms
│   └── Manages file conversion
└── All communication is local (no internet required)
```

## 🚀 Deployment

### Local Use (No Deployment Needed)
Just run `npm run dev` and it works!

### Deploy to Netlify (Free)
1. Push code to GitHub
2. Connect GitHub to Netlify
3. Set build command: `npm run build`
4. Set publish directory: `dist/spa`
5. Done!

**Note:** Netlify supports YouTube only. For multi-platform support in production, you need to deploy backend to Railway.

### Deploy Backend to Railway (Multi-Platform)
See [RAILWAY_SETUP.md](RAILWAY_SETUP.md) for detailed instructions.

## 📋 Requirements

### Minimum (YouTube Only)
- Node.js 18+
- npm or pnpm

### Full Support (All Platforms)
- Node.js 18+
- Python 3.9+
- yt-dlp (`pip install yt-dlp`)
- FFmpeg (optional, for MP3 conversion)

## ⚙️ How It Works

1. **You paste a URL** in the app
2. **Frontend validates** the URL format
3. **Backend detects** which platform it is
4. **yt-dlp downloads** the media
5. **Files are sent** to your browser
6. **Browser downloads** the file to your Downloads folder

All of this happens locally on your computer!

## 🔒 Privacy

- No tracking
- No analytics
- No ads
- Everything runs locally on your machine
- Downloads go directly to your computer

## 📝 License

MIT License - Feel free to use, modify, and share!

## 🤝 Contributing

Found a bug or want to improve something? Feel free to:
1. Check [LOCAL_SETUP.md](LOCAL_SETUP.md) for setup instructions
2. Make your changes
3. Test locally: `npm run dev`
4. Submit feedback via the app

## 🆘 Getting Help

1. **Check [LOCAL_SETUP.md](LOCAL_SETUP.md)** - Has detailed troubleshooting
2. **Look at error messages** - They usually tell you what's wrong
3. **Check platform status** - The app shows what features are available when you open it
4. **Reinstall yt-dlp:** `pip install --upgrade yt-dlp`

## 🎉 That's It!

You now have a powerful media downloader that works on your own computer, supports 1000+ platforms, and requires no external services. Enjoy!

---

**Happy downloading! 🌅**
