# Quick Start: Self-Hosting Sunset Downloader

Choose your method:

## 🚀 Fastest: Docker Compose (Recommended)

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd sunset-downloader

# 2. Start everything
npm install
docker-compose up

# 3. Done! Backend runs on http://localhost:3000
```

Then configure your frontend:
```bash
export VITE_API_URL=http://localhost:3000
npm run dev
```

## 📦 Option 2: Direct Node.js

```bash
# 1. Install dependencies
npm install

# 2. Build server
npm run build:server

# 3. Start backend
npm run start:backend

# 4. In another terminal, start frontend
npm run dev
```

Backend runs on `http://localhost:3000`

## ☁️ Option 3: Deploy to VPS

### Using Docker (Easiest)

On your VPS:
```bash
git clone <your-repo-url>
cd sunset-downloader
docker build -t sunset-downloader .
docker run -d -p 3000:3000 --restart unless-stopped sunset-downloader
```

Then set your frontend's `VITE_API_URL=https://your-vps-ip:3000` or `https://your-domain.com` (with Nginx reverse proxy)

See [SELF_HOST_SETUP.md](./SELF_HOST_SETUP.md) for detailed VPS setup with Nginx and HTTPS.

## 🔧 Configuration

Create a `.env` file:

```env
VITE_API_URL=http://localhost:3000    # Point to your backend
NODE_ENV=development                   # Or 'production'
PORT=3000                              # Backend port
```

## ✅ Test It Works

1. Start your backend
2. Go to `http://localhost:5173` (or wherever frontend runs)
3. Try downloading a YouTube video
4. Check the browser console for any errors
5. Check backend logs if something fails

## 📝 What You Get

✅ Full YouTube support (ytdl-core)  
✅ Works offline after deployment  
✅ No API keys needed  
✅ Free to run  
✅ Can be deployed anywhere  

## 🎯 For Multi-Platform Support (Spotify, TikTok, etc)

You'll need to extend the backend with yt-dlp. Replace ytdl-core with a yt-dlp wrapper in `code/server/routes/download.ts`.

See [SELF_HOST_SETUP.md](./SELF_HOST_SETUP.md) for details.

## ❓ Troubleshooting

**"Cannot connect to backend"**
- Make sure backend is running on the port you configured
- Check `VITE_API_URL` environment variable is set correctly
- Check firewall isn't blocking the port

**"Downloads not working"**
- Check backend logs: `docker logs <container-id>`
- Make sure FFmpeg is installed (Docker image includes it)
- Try downloading from YouTube first to test basic functionality

**"Need help?"**
- Check [SELF_HOST_SETUP.md](./SELF_HOST_SETUP.md) for detailed docs
- Review the Docker logs for error messages
- Ensure Node.js 20+ is installed

That's it! You now have a self-hosted media downloader. 🎉
