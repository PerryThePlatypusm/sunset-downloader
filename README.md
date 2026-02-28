# Sunset Downloader

A media downloader supporting YouTube and 1000+ platforms. Download as MP3 (audio) or MP4 (video).

## Features

- ✅ YouTube support (fully working)
- ✅ Download as MP3 (audio) or MP4 (video)
- ✅ Configurable quality settings
- ✅ Fast, free, no API keys needed
- ✅ Works on Windows Media Player, VLC, iOS, Android
- ✅ Deployed on Netlify - live and ready to use

## Quick Start (Development)

```bash
npm install
npm run dev
```

Starts development server at `http://localhost:5173`

## Build for Production

```bash
npm run build
```

Creates optimized production build.

## Legal Notice

⚠️ **IMPORTANT**: By using this downloader, you agree that:

1. **Copyright**: Anything you download is subject to copyright laws. It is NOT our responsibility if you download copyrighted content and face legal consequences.

2. **Attribution**: If you fork this project, you must give credit to the original creator.

3. **AI-Generated**: This project was created with AI assistance. Credit goes to the AI and the creators of the underlying technologies (yt-dlp, FFmpeg, etc.).

**Use responsibly and respect copyright laws.**

## Support

- [Quick Start Guide](./QUICK_START_SELFHOST.md) - Get running in 5 minutes
- [Full Documentation](./SELF_HOST_SETUP.md) - Detailed setup for all platforms
- Check logs for troubleshooting: `docker logs <container-id>`

## Technologies

- Frontend: React, Vite, TailwindCSS
- Backend: Node.js, Express, yt-dlp, FFmpeg
- Deployment: Docker, Docker Compose
- Hosting: Self-hosted, VPS, or Cloud
