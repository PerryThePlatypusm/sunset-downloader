# Railway + Netlify Setup Guide

This app uses a **two-service architecture**:
- **Netlify**: Frontend (where users visit)
- **Railway**: Backend (runs yt-dlp for downloads)

## Architecture

```
User Browser
    ↓
Netlify (https://yourapp.netlify.app) ← Frontend
    ↓ API Calls
Railway Backend (https://your-railway-app.up.railway.app) ← yt-dlp downloads
    ↓
User Downloads (MP3/MP4 files)
```

## Step-by-Step Setup

### Part 1: Deploy Backend to Railway

1. **Sign up for Railway**
   - Go to https://railway.app
   - Click "Start Project"
   - Sign in with GitHub

2. **Create a New Project**
   - Click "Create New"
   - Select "Deploy from GitHub repo"
   - Choose your `sunset-downloader` repository
   - Select branch `ai_main_1d510e53c013`

3. **Configure Railway**
   - Railway will auto-detect `Dockerfile.railway`
   - Environment variables are automatically set
   - Wait for build to complete (2-5 minutes)

4. **Get Your Railway Backend URL**
   - Once deployed, go to "Settings" in Railway
   - Copy the "Public Domain" URL
   - It looks like: `https://sunset-downloader-production.up.railway.app`
   - **Save this URL - you'll need it for Netlify**

### Part 2: Deploy Frontend to Netlify

1. **If you haven't connected Netlify yet**
   - Click [Connect to Netlify](#open-mcp-popover)
   - Sign in with GitHub
   - Authorize the connection

2. **Configure Environment Variables for Netlify**
   - Go to your Netlify project settings
   - Navigate to "Build & Deploy" → "Environment"
   - Add new variable:
     - **Key**: `VITE_API_URL`
     - **Value**: Your Railway URL (from Step 1.4)
     - Example: `https://sunset-downloader-production.up.railway.app`

3. **Trigger Netlify Deploy**
   - Push code to GitHub (already done)
   - Netlify automatically builds and deploys
   - Your app is now live!

## How It Works

1. User visits your Netlify domain (e.g., `https://yourapp.netlify.app`)
2. User pastes a link (YouTube, Spotify, TikTok, etc.)
3. Frontend sends request to Railway backend
4. Railway's yt-dlp downloads the media
5. File is sent to user's browser as MP3/MP4
6. User downloads the file locally

## Supported Platforms (with yt-dlp)

✅ YouTube
✅ Spotify
✅ Instagram
✅ TikTok
✅ Twitter/X
✅ Facebook
✅ SoundCloud
✅ Twitch
✅ Reddit
✅ Pinterest
✅ And 1000+ more!

## Troubleshooting

**"Could not connect to backend"**
- Verify Railway deployment is complete
- Check `VITE_API_URL` is set correctly in Netlify
- Ensure Railway app is running (check Railway dashboard)

**"Download failed"**
- The link may be private/restricted
- The platform may not support downloads
- Try a different video/song

**Railway deployment stuck**
- Check Railway logs in dashboard
- Ensure Dockerfile.railway is in the repository
- Try redeploying: Railway dashboard → Deploy

## Environment Variables

### Netlify (Frontend)
- `VITE_API_URL`: Railway backend URL

### Railway (Backend)
- `NODE_ENV`: Always set to `production`
- `PORT`: Automatically set by Railway (usually 3000+)

## File Structure

```
code/
├── Dockerfile.railway     ← Use this for Railway
├── railway.json           ← Railway configuration
├── client/               ← Frontend (deployed to Netlify)
├── server/               ← Backend (deployed to Railway)
└── package.json
```

## Deployment Summary

| Service | Domain | Purpose |
|---------|--------|---------|
| Netlify | yourapp.netlify.app | Frontend UI |
| Railway | your-app.up.railway.app | Download Backend |

## Support

If you encounter issues:
1. Check Railway dashboard logs
2. Check Netlify build logs
3. Verify environment variables are set
4. Ensure code is pushed to GitHub
