# Testing Your Local Setup

This guide helps you verify that everything is installed correctly and ready to download from all platforms.

## Quick Verification

### 1. Check Node.js
```bash
node --version
npm --version
```
Should show versions like `v18.0.0` or higher.

### 2. Check Python
```bash
python --version
# or
python3 --version
```
Should show `Python 3.9` or higher.

### 3. Check yt-dlp
```bash
yt-dlp --version
```
Should show something like `2024.12.xx`

**If yt-dlp is missing:**
```bash
pip install yt-dlp
# or
python3 -m pip install yt-dlp
```

## Running the App

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **You should see:**
   ```
   ➜  Local:   http://localhost:8080/
   ➜  press h + enter to show help
   [Download] yt-dlp is available for multi-platform downloads
   ```

3. **Open in browser:**
   - Go to `http://localhost:8080`

## Testing Downloads

### Test 1: YouTube (Always Works)
- Paste: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
- Format: Video (MP4)
- Click Download
- File should save to Downloads folder

### Test 2: Spotify (If yt-dlp installed)
- Paste: `https://open.spotify.com/track/...` (replace with a real track)
- Format: Audio (MP3)
- Click Download
- Should work if yt-dlp says it's available

### Test 3: Instagram (If yt-dlp installed)
- Paste: `https://www.instagram.com/p/...` (replace with a real post)
- Format: Video (MP4)
- Click Download
- Should work if yt-dlp says it's available

### Test 4: TikTok (If yt-dlp installed)
- Paste: `https://www.tiktok.com/@.../video/...` (replace with a real video)
- Format: Video (MP4)
- Click Download
- Should work if yt-dlp says it's available

## Checking System Status

When you open the app at `http://localhost:8080`:

### ✅ You should see GREEN message if:
- yt-dlp is installed
- Python is installed
- All 1000+ platforms are available

### ⚠️ You might see YELLOW message if:
- yt-dlp is not installed
- Only YouTube is available
- Instructions on how to install yt-dlp

### No message = Everything is working perfectly

## Troubleshooting

### "yt-dlp not available" message
1. Install yt-dlp:
   ```bash
   pip install yt-dlp
   ```
2. Restart the app:
   ```bash
   npm run dev
   ```
3. Refresh your browser
4. Status should change to green

### "Download failed" error
1. Make sure the URL is correct and accessible
2. Check your internet connection
3. Large videos might timeout (they take several minutes)
4. Try a different URL

### Port 8080 in use
```bash
PORT=3000 npm run dev
```
Then go to `http://localhost:3000`

## What You Can Download

Once yt-dlp is installed, you can download from:
- ✅ YouTube videos
- ✅ Spotify tracks and playlists
- ✅ Instagram reels and posts
- ✅ TikTok videos
- ✅ Twitter/X videos
- ✅ SoundCloud tracks
- ✅ Facebook videos
- ✅ Twitch clips
- ✅ Crunchyroll episodes
- ✅ HiAnime episodes
- ✅ Reddit videos
- ✅ Pinterest videos
- ✅ And 1000+ other platforms!

## Success Indicators

✅ **Setup is working if:**
- App opens at http://localhost:8080
- Status shows "All Features Enabled" (green)
- You can paste a YouTube URL and download
- Downloaded file plays on your device

❌ **Something is wrong if:**
- Fetch error in console
- Can't see the status message
- Error when trying to download
- Downloaded file won't play

## Still Having Issues?

1. Check the browser console (F12 → Console tab) for error messages
2. Check the terminal for download logs
3. Try running `./setup.sh` or `setup.bat` again
4. Make sure Python and yt-dlp are properly installed
5. Restart your terminal and app

## Success! 🎉

If you see the app running at http://localhost:8080 with a status message showing what's available, you're all set!

Start downloading from your favorite platforms!
