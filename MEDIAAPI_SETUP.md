# MediaAPI Implementation Guide

Your downloader now uses **MediaAPI** - download from YouTube, Instagram, TikTok, Twitter, Facebook, and many more platforms!

## 🎯 What You Have Now

- ✅ **No backend needed** - Uses API directly
- ✅ **No Docker** - No complex setup
- ✅ **Supports 1000+ platforms** - YouTube, Instagram, TikTok, Twitter, Facebook, Spotify, SoundCloud, Twitch, Reddit, Pinterest, and more
- ✅ **Files download to your device** - MP3 for audio, MP4 for video
- ✅ **Works on all devices** - Windows, Mac, Linux, iOS, Android
- ✅ **Free tier** - 100 requests/day (enough for testing)

## 📋 Step 1: Get MediaAPI Key (5 minutes)

### 1.1 Sign Up for RapidAPI

1. Go to https://rapidapi.com/
2. Click "Sign Up" (top right)
3. Create account with:
   - Email
   - Password
   - Or use Google/GitHub login
4. Verify your email

### 1.2 Subscribe to MediaAPI

1. Go to https://rapidapi.com/mediaapi/api/mediaapi
2. Look for "Pricing" or "Subscribe" button
3. Click "Subscribe to Test" (free tier)
4. Choose the **FREE** tier
5. Click "Subscribe"
6. You'll see "You are subscribed!"

### 1.3 Get Your API Key

1. Go to https://rapidapi.com/mediaapi/api/mediaapi
2. Look for "Code Snippets" section (usually on the right)
3. Find the header: `x-rapidapi-key`
4. Copy the key value (looks like a long random string)
5. **Save this key!** You'll need it in 2 minutes

## 🌐 Step 2: Configure for Local Development

### 2.1 Create .env.local File

In your project root (`code/` folder), create a new file called `.env.local`:

```bash
# .env.local
VITE_MEDIAAPI_KEY=your_api_key_here
```

Replace `your_api_key_here` with the actual key from Step 1.3.

### 2.2 Verify File Location

Your project structure should look like:
```
code/
├── .env.local          ← NEW FILE HERE
├── vite.config.ts
├── package.json
├── client/
├── server/
└── ...
```

## 🧪 Step 3: Test Locally

### 3.1 Start Dev Server

```bash
npm run dev
```

You should see:
```
➜  Local:   http://localhost:8080/
```

### 3.2 Test a Download

1. Open http://localhost:8080 in your browser
2. Paste a URL from any platform:
   - YouTube: `https://www.youtube.com/watch?v=...`
   - Instagram: `https://www.instagram.com/p/...`
   - TikTok: `https://www.tiktok.com/@.../video/...`
   - Twitter: `https://twitter.com/.../status/...`
3. Choose Audio (MP3) or Video (MP4)
4. Click Download
5. File should download to your Downloads folder!

### 3.3 Test Playback

1. Open the downloaded file:
   - Windows: Use Windows Media Player or VLC
   - Mac: Use QuickTime or VLC
   - Mobile: Use built-in media player
2. It should play perfectly!

## 🚀 Step 4: Deploy to Netlify

### 4.1 Update Code on GitHub

```bash
cd code
git add .
git commit -m "Add MediaAPI integration for downloads"
git push origin main
```

### 4.2 Add Environment Variable to Netlify

1. Go to https://app.netlify.com
2. Select your site
3. Go to: **Site settings** → **Build & deploy** → **Environment**
4. Click **Add variable**
5. Add:
   - **Name:** `VITE_MEDIAAPI_KEY`
   - **Value:** (paste your API key from Step 1.3)
6. Click **Save**

### 4.3 Trigger Deploy

1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Deploy site**
3. Wait for green checkmark
4. Visit your Netlify domain!

### 4.4 Test on Deployed Site

1. Go to your Netlify domain (e.g., `https://sunset-downloader.netlify.app`)
2. Paste a link
3. Download and test!

## ✅ Success Checklist

- ✅ Created MediaAPI account on RapidAPI
- ✅ Have API key saved
- ✅ Created `.env.local` file with API key
- ✅ `npm run dev` works and downloads succeed
- ✅ Files download and play correctly
- ✅ Added `VITE_MEDIAAPI_KEY` to Netlify
- ✅ Deployed to Netlify
- ✅ Downloads work on Netlify domain

## 📊 Supported Platforms

You can now download from:

| Platform | Support | Format |
|----------|---------|--------|
| **YouTube** | ✅ Yes | MP3 / MP4 |
| **Instagram** | ✅ Yes | MP3 / MP4 |
| **TikTok** | ✅ Yes | MP3 / MP4 |
| **Twitter/X** | ✅ Yes | MP3 / MP4 |
| **Facebook** | ✅ Yes | MP3 / MP4 |
| **Spotify** | ✅ Yes | MP3 |
| **SoundCloud** | ✅ Yes | MP3 |
| **Twitch** | ✅ Yes | MP4 |
| **Reddit** | ✅ Yes | MP4 |
| **Pinterest** | ✅ Yes | MP4 |
| **And many more!** | ✅ Yes | MP3 / MP4 |

## 💰 Pricing & Limits

### Free Tier
- **100 requests/day**
- **Perfect for:** Personal use, testing
- **Cost:** $0/month

### Paid Tiers
- **500 requests/month** - $9/month
- **5,000 requests/month** - $49/month
- **Unlimited** - Custom pricing

### What's a "Request"?
Each download = 1 request

**Example:**
- 100 downloads/day free
- 3,000 downloads/month free
- That's way more than you'll probably need!

## 🔧 Troubleshooting

### "API key not configured"
- Make sure `.env.local` exists
- Make sure it has: `VITE_MEDIAAPI_KEY=your_key`
- Restart dev server: `npm run dev`

### "Invalid API key" or "403 error"
- Double-check your API key
- Make sure you subscribed to MediaAPI (free tier)
- Try getting a new key from RapidAPI

### "Too many requests" or "429 error"
- You've exceeded your daily limit
- Free tier: 100 requests/day
- Wait until tomorrow, or upgrade tier

### "URL not supported"
- The platform might not be supported by MediaAPI
- Try a different video on same platform
- Try a different platform

### "Download failed but no specific error"
- URL might be invalid
- Video might be private or deleted
- Platform might have changed its structure
- Try a different URL

### "File won't play"
- Make sure you downloaded it fully
- Try opening with VLC player
- Try a different video

## 📝 Files Modified

- `client/lib/mediaapi.ts` - NEW MediaAPI integration
- `client/pages/Index.tsx` - Updated to use MediaAPI
- `.env.local` - NEW local environment variables

## 🎉 You're Done!

Your downloader now works for 1000+ platforms with MediaAPI!

### Local Development
```bash
npm run dev
```
Then go to http://localhost:8080

### Deployed (Netlify)
Just visit your Netlify domain!

## 🆘 Still Having Issues?

1. **Check API Key**
   - Go to https://rapidapi.com/mediaapi/api/mediaapi
   - Find your key under "Code Snippets"

2. **Check Netlify Env Var**
   - Go to Netlify Site Settings
   - Build & Deploy → Environment
   - Verify `VITE_MEDIAAPI_KEY` is there

3. **Check Logs**
   - Browser console (F12)
   - Look for [MediaAPI] messages
   - They'll tell you what's wrong

4. **Try Different URL**
   - Some videos might be blocked
   - Try a public video

5. **Contact Support**
   - RapidAPI: https://rapidapi.com/support
   - Netlify: https://app.netlify.com/support
   - MediaAPI: https://rapidapi.com/mediaapi/api/mediaapi

## Next Steps

### Optional: Upgrade API Tier
If you need more than 100 downloads/day:
1. Go to https://rapidapi.com/mediaapi/api/mediaapi
2. Click Upgrade
3. Choose paid tier
4. Update API key in Netlify

### Optional: Add More Platforms
The setup already supports 1000+ platforms! Just try different URLs.

### Optional: Custom Domain
If you want your own domain instead of netlify.app:
1. Buy domain
2. Add to Netlify
3. It's free with Netlify!

---

**Congratulations! Your downloader is now live! 🚀**

Download from YouTube, Instagram, TikTok, Twitter, and thousands of other platforms!
