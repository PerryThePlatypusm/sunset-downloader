# Sunset Downloader

A self-hostable media downloader supporting YouTube, Spotify, Instagram, TikTok, and 1000+ platforms.

## Quick Start

### Option 1: Docker (Recommended)
```bash
docker-compose up
```

### Option 2: Node.js
```bash
npm install
npm run start:backend
```

See [QUICK_START_SELFHOST.md](./QUICK_START_SELFHOST.md) for detailed setup instructions.

## Deployment Options

- **Local Development**: Run on your computer with `npm run start:backend`
- **Docker**: Deploy using Docker/Docker Compose for any OS
- **VPS**: Deploy to your own server with Nginx/HTTPS support
- **Cloud**: Deploy to any cloud provider that supports Docker

See [SELF_HOST_SETUP.md](./SELF_HOST_SETUP.md) for complete deployment guide.

## Features

- ✅ YouTube, Spotify, Instagram, TikTok, Twitter, and 1000+ platforms
- ✅ Download as MP3 (audio) or MP4 (video)
- ✅ Configurable quality settings
- ✅ Fast, free, no API keys needed
- ✅ Self-hosted: you control the data
- ✅ Works on Windows Media Player, VLC, iOS, Android

## Configuration

Set the backend URL for the frontend:

```bash
export VITE_API_URL=http://localhost:3000    # Local
export VITE_API_URL=https://your-domain.com  # Production
```

Or create a `.env` file (see `.env.example`).

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
