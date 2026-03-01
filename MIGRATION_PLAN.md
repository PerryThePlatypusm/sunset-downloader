# Migration Plan: Google Cloud Run (Free Alternative)

## What Changed

### Undone ✅
- Removed `SystemStatus` component from Index.tsx
- Removed `/api/status` endpoint from backend
- Removed SystemStatus import and rendering
- Removed `server/routes/status.ts` file (no longer needed)

### Updated ✅
- `Dockerfile.railway` - Now works with Google Cloud Run (port 8080)
- `server/node-build.ts` - Default port changed to 8080
- Ready for Google Cloud Run deployment

### What Stayed the Same ✅
- All download functionality (yt-dlp, platform detection, etc.)
- Frontend code (React, UI, etc.)
- API endpoints (/api/download, /api/validate-url)
- Local development (`npm run dev` still works)

## Why Google Cloud Run?

| Feature | Railway | Google Cloud Run |
|---------|---------|------------------|
| **Cost** | $5-7/month | FREE (2M requests/month) |
| **Free Tier** | Limited | Very Generous |
| **Setup** | Simple | Simple (slightly more steps) |
| **yt-dlp Support** | ✅ Yes | ✅ Yes |
| **Auto-Scale** | ✅ Yes | ✅ Yes |
| **Netlify Integration** | ✅ Yes | ✅ Yes |

**Bottom Line:** Google Cloud Run is free, reliable, and perfect for downloads.

## Deployment Architecture

```
User's Browser
    ↓
Netlify (Frontend)
    ↓ VITE_API_URL
Google Cloud Run (Backend with yt-dlp)
    ↓
Downloads saved to user's device
```

## Your Next Steps

Follow the **GOOGLE_CLOUD_RUN_SETUP.md** guide:

1. Create Google Cloud Project (~5 min)
2. Enable APIs (~2 min)
3. Install Google Cloud CLI (~5 min)
4. Deploy backend to Google Cloud Run (~10 min)
5. Deploy frontend to Netlify (~5 min)
6. Connect frontend to backend (~2 min)

**Total time: ~30 minutes**

## Files Ready for Deployment

✅ `Dockerfile.railway` - Works on Google Cloud Run
✅ `server/` - Download handler with yt-dlp
✅ `client/` - React frontend with API config
✅ `package.json` - All dependencies
✅ `vite.config.ts` - Build config

## Local Development

Everything still works locally:
```bash
npm run dev
# Go to http://localhost:8080
# Download from all platforms
```

## Before You Deploy

1. Make sure you have:
   - Google Account (free)
   - Netlify Account (free)
   - Git account (GitHub, GitLab, Bitbucket)

2. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "Prepare for Google Cloud Run deployment"
   git push origin main
   ```

3. Then follow GOOGLE_CLOUD_RUN_SETUP.md step by step

## Success Criteria

After deployment, you should have:

✅ Frontend at: `https://your-domain.netlify.app`
✅ Backend at: `https://sunset-downloader-xxxxx.run.app`
✅ Can download from YouTube, Spotify, Instagram, TikTok, etc.
✅ Files save to your device
✅ No monthly cost

## Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| "Port already in use" | `PORT=3000 npm run dev` |
| "Deploy fails" | Check `gcloud run logs read sunset-downloader --limit 50` |
| "Can't connect to backend" | Verify `VITE_API_URL` in Netlify env vars |
| "Download fails" | Check Cloud Run logs and ensure yt-dlp is installed |

## Questions?

See:
- `GOOGLE_CLOUD_RUN_SETUP.md` - Step-by-step deployment
- `README.md` - General info
- `LOCAL_SETUP.md` - Local development
- Browser console - Errors during download

## Ready?

When you're ready to deploy:

1. Follow GOOGLE_CLOUD_RUN_SETUP.md
2. It will guide you through everything
3. Most steps are just clicking buttons
4. No coding required!

Good luck! 🚀
