# Project Cleanup & Step-by-Step Guide

## What Your Project Actually Does

**Simple: Download media from any platform and save it to your device.**

That's it! Everything else can be removed.

---

## Files to REMOVE (Not Used)

### Backend Routes (Can Delete)
These are old routes that aren't used anymore:

1. **`code/server/routes/bug-report.ts`** - Bug reporting system (UNUSED)
2. **`code/server/routes/demo.ts`** - Demo data (UNUSED)
3. **`code/server/routes/discord-greeting.ts`** - Discord integration (UNUSED)
4. **`code/server/routes/test-webhook.ts`** - Test webhook (UNUSED)

### Frontend Components (Can Simplify)
These UI elements aren't needed with MediaAPI:

1. **`code/client/components/PlatformSelector.tsx`** - Not needed (MediaAPI auto-detects)
2. **`code/client/components/QualitySelector.tsx`** - Not needed (MediaAPI handles quality)
3. **`code/client/components/SpotifyQualitySelector.tsx`** - Not needed (Spotify is handled)
4. **`code/client/components/EpisodeSelector.tsx`** - Not needed (Anime platforms via API)

### Config/Documentation Files (Can Remove)
These are old setup guides:

1. **`code/GOOGLE_CLOUD_RUN_SETUP.md`** - Old Docker approach
2. **`code/SUPABASE_SETUP.md`** - Old Supabase approach
3. **`code/EASIEST_OPTION.md`** - Outdated comparison
4. **`code/MIGRATION_PLAN.md`** - Migration instructions (no longer needed)
5. **`code/LOCAL_SETUP.md`** - Local yt-dlp setup (outdated)
6. **`code/RAILWAY_SETUP.md`** - Railway deployment (outdated)
7. **`code/TEST_LOCAL_SETUP.md`** - Testing guide (outdated)
8. **`code/CHANGES_SUMMARY.md`** - Old changes summary

### Utility Files (Can Remove)
1. **`code/setup.sh`** - Local setup script (not needed with MediaAPI)
2. **`code/setup.bat`** - Windows setup script (not needed with MediaAPI)

---

## Files to KEEP (Core Functionality)

### Essential Backend
- ✅ `code/server/index.ts` - Main server (remove old routes)
- ✅ `code/server/routes/download.ts` - Download handler (keep but simplify)
- ✅ `code/server/node-build.ts` - Production build

### Essential Frontend
- ✅ `code/client/pages/Index.tsx` - Main download page (remove unused code)
- ✅ `code/client/lib/mediaapi.ts` - MediaAPI integration (CORE)
- ✅ `code/client/lib/api-config.ts` - API configuration
- ✅ `code/client/components/DownloadProgress.tsx` - Progress bar
- ✅ `code/client/components/RainyBackground.tsx` - UI styling
- ✅ `code/client/components/TOSNotification.tsx` - Terms notification
- ✅ `code/client/components/BackgroundAudio.tsx` - Rain sounds

### Configuration Files
- ✅ `code/vite.config.ts` - Build config
- ✅ `code/package.json` - Dependencies
- ✅ `code/tsconfig.json` - TypeScript config

### Deployment Files
- ✅ `code/Dockerfile.railway` - Can be removed (not using Docker)
- ✅ `code/netlify.toml` - Netlify config (keep for deployment)

---

## Step-by-Step What Your App Does

### 1. User Opens App
- Browser goes to your Netlify domain
- Sees download form with one text input box

### 2. User Pastes URL
- Pastes any link from any platform
- Examples: YouTube, Instagram, TikTok, Twitter, Spotify, etc.

### 3. User Chooses Format
- Click: "Audio Only (MP3)" or "Video + Audio (MP4)"

### 4. User Clicks Download
- App calls MediaAPI with the URL
- MediaAPI downloads the media
- Browser downloads file to user's device

### 5. User Plays File
- Opens file on their device
- Can play on:
  - Windows Media Player
  - VLC
  - iOS (iPhone/iPad)
  - Android
  - Any device

**That's it! Simple.**

---

## Cleanup Steps

### Step 1: Delete Unused Backend Routes

```bash
# Remove unused route files
rm code/server/routes/bug-report.ts
rm code/server/routes/demo.ts
rm code/server/routes/discord-greeting.ts
rm code/server/routes/test-webhook.ts
```

### Step 2: Remove Imports from server/index.ts

Edit `code/server/index.ts`:

Replace this:
```typescript
import { handleDemo } from "./routes/demo";
import { handleDownload, validateUrl } from "./routes/download";
import { handleBugReport } from "./routes/bug-report";
import { handleTestWebhook } from "./routes/test-webhook";
import { handleDiscordGreeting } from "./routes/discord-greeting";

const upload = multer({ storage: multer.memoryStorage() });
```

With this:
```typescript
import { handleDownload, validateUrl } from "./routes/download";
```

### Step 3: Remove Unused Routes from server/index.ts

Replace this:
```typescript
// Bug report route with multer for file upload
app.post("/api/bug-report", upload.single("attachment"), handleBugReport);

// Example API routes
app.get("/api/ping", (_req, res) => {
  const ping = process.env.PING_MESSAGE ?? "ping";
  res.json({ message: ping });
});

app.get("/api/demo", handleDemo);

// Download routes
app.post("/api/download", handleDownload);
app.post("/api/validate-url", validateUrl);

// Test webhook
app.get("/api/test-webhook", handleTestWebhook);

// Discord greeting
app.get("/api/discord-greeting", handleDiscordGreeting);
```

With this:
```typescript
// Download routes (uses MediaAPI - no backend processing needed)
app.post("/api/download", handleDownload);
app.post("/api/validate-url", validateUrl);

// Health check
app.get("/api/ping", (_req, res) => {
  res.json({ message: "ok" });
});
```

### Step 4: Delete Unused Frontend Components

```bash
# Remove unused selectors
rm code/client/components/PlatformSelector.tsx
rm code/client/components/QualitySelector.tsx
rm code/client/components/SpotifyQualitySelector.tsx
rm code/client/components/EpisodeSelector.tsx
```

### Step 5: Simplify Index.tsx

Remove these imports:
```typescript
// REMOVE THESE:
import PlatformSelector from "@/components/PlatformSelector";
import QualitySelector from "@/components/QualitySelector";
import SpotifyQualitySelector from "@/components/SpotifyQualitySelector";
import EpisodeSelector from "@/components/EpisodeSelector";
import { QUALITY_FORMATS } from "@/lib/urlUtils";
```

Remove these state variables (in Index component):
```typescript
// REMOVE THESE:
const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
const [quality, setQuality] = useState("1080");
const [selectedEpisodes, setSelectedEpisodes] = useState<number[]>([]);
```

Remove these JSX sections (from render):
```typescript
// REMOVE: PlatformSelector component
// REMOVE: Download Type Selector (audio only or video)
// REMOVE: QualitySelector component
// REMOVE: SpotifyQualitySelector component
// REMOVE: EpisodeSelector component
```

Simplify the download form to just:
```typescript
{/* URL Input */}
<div className="mb-6">
  <label className="block text-sunset-200 font-semibold mb-2">
    Enter Media Link
  </label>
  <Input
    type="text"
    placeholder="Paste your video/music link here..."
    value={url}
    onChange={(e) => setUrl(e.target.value)}
    onKeyPress={(e) => e.key === "Enter" && handleDownload()}
    disabled={isDownloading}
  />
</div>

{/* Download Button */}
<Button
  onClick={handleDownload}
  disabled={isDownloading}
  className="w-full..."
>
  {isDownloading ? "Downloading..." : "Download"}
</Button>
```

### Step 6: Delete Old Setup/Documentation Files

```bash
# Remove old deployment guides (no longer needed)
rm code/GOOGLE_CLOUD_RUN_SETUP.md
rm code/SUPABASE_SETUP.md
rm code/EASIEST_OPTION.md
rm code/MIGRATION_PLAN.md
rm code/LOCAL_SETUP.md
rm code/RAILWAY_SETUP.md
rm code/TEST_LOCAL_SETUP.md
rm code/CHANGES_SUMMARY.md

# Remove setup scripts (not needed with MediaAPI)
rm code/setup.sh
rm code/setup.bat
```

### Step 7: Keep Only Essential Documentation

Keep:
- ✅ `README.md` - Project overview
- ✅ `QUICK_START_MEDIAAPI.md` - How to get started
- ✅ `MEDIAAPI_SETUP.md` - Detailed setup guide

---

## Simplified Project Structure

After cleanup:

```
code/
├── client/
│   ├── pages/
│   │   └── Index.tsx                (simplified)
│   ├── components/
│   │   ├── RainyBackground.tsx       (keep)
│   │   ├── TOSNotification.tsx        (keep)
│   │   ├── BackgroundAudio.tsx        (keep)
│   │   ├── DownloadProgress.tsx       (keep)
│   │   └── ui/                       (keep UI library)
│   ├── hooks/                        (keep)
│   └── lib/
│       ├── mediaapi.ts               (CORE)
│       ├── api-config.ts             (keep)
│       └── urlUtils.ts               (can keep or remove)
├── server/
│   ├── index.ts                      (simplified)
│   ├── node-build.ts                 (keep)
│   └── routes/
│       └── download.ts               (keep)
├── README.md                         (keep)
├── QUICK_START_MEDIAAPI.md          (keep)
├── MEDIAAPI_SETUP.md                (keep)
├── package.json                      (keep)
├── vite.config.ts                   (keep)
├── netlify.toml                      (keep)
└── (no other files needed)
```

---

## What's Left: Simplified Version

After cleanup, your project is:

**Frontend:** Simple form → Paste link → Click download

**Backend:** Just forwards to MediaAPI (almost not needed)

**Files:** Only what's necessary to make it work

---

## Testing After Cleanup

```bash
npm run dev
```

Go to http://localhost:8080 and test:
1. Paste YouTube URL → Download works ✅
2. Paste Instagram URL → Download works ✅
3. Paste TikTok URL → Download works ✅

---

## Deployment After Cleanup

Everything works the same:

1. Push to GitHub
2. Netlify auto-deploys
3. Done!

---

## Summary

**Before Cleanup:**
- ❌ Many unused routes
- ❌ Many unused components
- ❌ Lots of old documentation
- ❌ Complex configuration files

**After Cleanup:**
- ✅ Only necessary files
- ✅ Simple codebase
- ✅ Easy to maintain
- ✅ Same functionality
- ✅ Same deployment

**Total files to delete: ~15 files**

**Time to delete: ~5 minutes**

---

## Ready?

Follow the cleanup steps above, then:

```bash
git add .
git commit -m "Clean up unused code and documentation"
git push origin main
```

Your app will be sleeker and easier to maintain! 🚀
