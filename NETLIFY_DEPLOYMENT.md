# Deploy to Netlify (Easiest!)

This is the **simplest way** to deploy your downloader - no Docker, no Railway, no complex setup!

## ✨ What You Get

- ✅ Frontend hosted on Netlify (FREE)
- ✅ Backend (Netlify Functions) on Netlify (FREE)
- ✅ No separate services needed
- ✅ Downloads work from your domain
- ✅ Auto-deploys when you push code

## 🚀 Deployment Steps

### Step 1: Push Code to GitHub

```bash
cd code
git add .
git commit -m "Ready for Netlify deployment"
git push origin main
```

### Step 2: Connect to Netlify

1. Go to https://netlify.com
2. Click **"Add new site"** → **"Import an existing project"**
3. Select **GitHub** as provider
4. Choose your repository
5. Click **Deploy**

That's it! Netlify will automatically:
- Build your app (`npm run build`)
- Deploy to their servers
- Set up Netlify Functions for your backend

### Step 3: Test Your Site

After deployment completes:
1. Visit your Netlify domain (e.g., `https://sunset-downloader.netlify.app`)
2. Paste a YouTube URL
3. Click Download
4. Should work! 🎉

## 🔧 Configuration

Everything is already configured in `netlify.toml`:

```toml
[build]
command = "npm run build"
functions = "netlify/functions"
publish = "dist/spa"

[[redirects]]
from = "/api/*"
to = "/.netlify/functions/:splat"
status = 200
```

This tells Netlify:
- Build with: `npm run build`
- Backend functions in: `netlify/functions/`
- Frontend files in: `dist/spa/`
- Route `/api/*` to Netlify Functions

## 📋 How It Works

```
User's Browser
    ↓
Netlify (Frontend + Functions)
    ├─ Frontend: React app
    └─ Backend: Download functions
        ├─ Try Cobalt API
        ├─ Try Y2mate API
        └─ Return download link
    ↓
User's Computer (downloads file)
```

Everything runs on Netlify - no separate backend needed!

## ✅ What's Included

- **Frontend:** React app at `client/`
- **Backend:** Netlify Functions at `netlify/functions/`
  - `download.ts` - Handles downloads
  - `validate-url.ts` - Validates URLs
  - `ping.ts` - Health check

## 🌐 Custom Domain (Optional)

Once deployed to Netlify, you can add a custom domain:

1. Go to Site Settings → Domain Management
2. Click "Add custom domain"
3. Enter your domain (e.g., `sunset-downloader.com`)
4. Update DNS records at your domain registrar
5. Netlify gives SSL for free!

## 🆘 Troubleshooting

### Downloads not working?
- The external download APIs might be temporarily blocked
- Wait a few minutes and try again
- Check browser console (F12) for error messages

### "Function not found" error?
- Make sure all files pushed to GitHub
- Rebuild: Go to Netlify dashboard → trigger redeploy
- Check that `netlify/functions/download.ts` exists

### "Build failed" error?
- Check build logs in Netlify dashboard
- Usually means `npm run build` is failing
- Run locally first: `npm run build` to test

## 📊 Limits

Netlify Free tier includes:
- ✅ Unlimited sites
- ✅ Unlimited bandwidth
- ✅ 125,000 function calls/month
- ✅ Free SSL/HTTPS
- ✅ Auto-deployed on git push

## 🎯 Next Steps

After deployment:

### Option 1: Custom Domain
- Buy domain from GoDaddy, Namecheap, or Google Domains
- Add to Netlify (see section above)
- Get free HTTPS

### Option 2: Share Your Site
- Share the Netlify URL with friends/users
- Works on desktop, mobile, tablet
- No installation needed

### Option 3: Keep Developing
- Make changes locally with `npm run dev`
- Push to GitHub
- Netlify auto-deploys!

## 💡 Key Advantages

✅ **Super simple** - Just connect GitHub
✅ **Free** - No monthly costs
✅ **Fast** - CDN makes it blazing fast
✅ **Reliable** - Managed by Netlify team
✅ **Professional** - Custom domain support
✅ **Auto-deploy** - Push to GitHub = instant deploy

## 🚀 Summary

1. Push code to GitHub ✓ (you'll do this)
2. Connect to Netlify ✓ (step 2 above)
3. Done! ✓ (auto-builds and deploys)

No Docker, no Railway, no setup. Just GitHub → Netlify!

---

**Happy deploying! 🌅**
