# MediaAPI Quick Start (3 Minutes)

## 🎯 What You're About to Do

Turn your downloader into a multi-platform downloader that works with YouTube, Instagram, TikTok, Twitter, and more!

## ⏱️ Timeline

- **Minute 1:** Get your free MediaAPI key
- **Minute 2:** Add key to your project
- **Minute 3:** Test it works!

## 🚀 Step 1: Get Free API Key (1 minute)

### Go Here:
https://rapidapi.com/mediaapi/api/mediaapi

### Click "Subscribe to Test"

(It's free! You get 100 requests/day)

### Find This Section:

Look for "Code Snippets" or similar (usually on the right side). Find the header that looks like:

```
x-rapidapi-key: xxxxxxxxxxxxxxxxxxxxxxxx
```

Copy the value (the long string of characters).

### Done! You have your key! ✅

## 🔑 Step 2: Add Key to Project (1 minute)

### Create a File

In the `code/` folder (your project root), create a new file called:

```
.env.local
```

### Paste This:

```
VITE_MEDIAAPI_KEY=your_key_here
```

Replace `your_key_here` with the actual key you copied above.

### Save the File ✅

That's it! Your project now has the API key.

## 🧪 Step 3: Test It (1 minute)

### Start Dev Server (if not already running):

```bash
npm run dev
```

### Go To:

http://localhost:8080

### Paste a Link:

Try any of these:
- YouTube: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
- Instagram: `https://www.instagram.com/p/CxxxxxxxxA/`
- TikTok: `https://www.tiktok.com/@username/video/123456789`
- Twitter: `https://twitter.com/user/status/123456789`

### Click Download

File should download to your Downloads folder!

### Test Playback

Open the file on your device - it should play perfectly!

## ✅ Done!

Your downloader now works with 1000+ platforms!

## 🚀 To Deploy to Netlify

See `MEDIAAPI_SETUP.md` for full deployment guide.

Or quick version:

1. Push code to GitHub:
   ```bash
   git add .
   git commit -m "Add MediaAPI"
   git push origin main
   ```

2. Go to Netlify Settings
3. Add environment variable: `VITE_MEDIAAPI_KEY` = your_key
4. Trigger deploy
5. Done!

## ❓ Not Working?

1. **Check your API key** - Make sure you copied it correctly
2. **Check `.env.local` exists** - Should be in `code/` folder
3. **Restart dev server** - Kill terminal and run `npm run dev` again
4. **Check browser console** (F12) for error messages

## 💡 Common Issues

**"API key not configured"**
- Your `.env.local` file doesn't exist or is named wrong
- Must be in `code/` folder
- Must be exactly `.env.local` (not `.env`)

**"Download failed"**
- API key might be wrong - double-check it
- URL might be invalid - try a different video
- You might have hit your 100/day limit - wait until tomorrow

**File won't play**
- Download failed silently - check console (F12)
- Try a different URL
- Try opening with VLC player

## 📞 Support

- **RapidAPI Help:** https://rapidapi.com/support
- **Check your key:** https://rapidapi.com/mediaapi/api/mediaapi

## 🎉 You're Done!

Your downloader now supports:
- ✅ YouTube
- ✅ Instagram
- ✅ TikTok
- ✅ Twitter/X
- ✅ Facebook
- ✅ Spotify
- ✅ SoundCloud
- ✅ Twitch
- ✅ Reddit
- ✅ Pinterest
- ✅ And 1000+ more!

Enjoy! 🌅
