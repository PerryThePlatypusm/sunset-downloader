# Cleanup Checklist - Delete These Files

**Total files to delete: 17**

Run these commands to delete unused files:

---

## Step 1: Delete Unused Backend Routes (4 files)

```bash
# Navigate to project
cd code

# Delete unused route files
rm server/routes/bug-report.ts
rm server/routes/demo.ts
rm server/routes/discord-greeting.ts
rm server/routes/test-webhook.ts
```

**Reason:** These routes aren't used anymore. MediaAPI handles everything.

---

## Step 2: Delete Unused Frontend Components (4 files)

```bash
rm client/components/PlatformSelector.tsx
rm client/components/QualitySelector.tsx
rm client/components/SpotifyQualitySelector.tsx
rm client/components/EpisodeSelector.tsx
```

**Reason:** MediaAPI auto-detects platforms and handles quality. These UI components are unnecessary.

---

## Step 3: Delete Old Documentation (8 files)

```bash
rm GOOGLE_CLOUD_RUN_SETUP.md
rm SUPABASE_SETUP.md
rm EASIEST_OPTION.md
rm MIGRATION_PLAN.md
rm LOCAL_SETUP.md
rm RAILWAY_SETUP.md
rm TEST_LOCAL_SETUP.md
rm CHANGES_SUMMARY.md
```

**Reason:** These were guides for old deployment approaches. No longer relevant since you're using MediaAPI.

---

## Step 4: Delete Old Setup Scripts (2 files)

```bash
rm setup.sh
rm setup.bat
```

**Reason:** These were for local yt-dlp setup. Not needed with MediaAPI.

---

## Step 5: Edit server/index.ts

Open `code/server/index.ts` and:

### Remove this import section:
```typescript
import { handleDemo } from "./routes/demo";
import { handleDownload, validateUrl } from "./routes/download";
import { handleBugReport } from "./routes/bug-report";
import { handleTestWebhook } from "./routes/test-webhook";
import { handleDiscordGreeting } from "./routes/discord-greeting";

const upload = multer({ storage: multer.memoryStorage() });
```

### Replace with:
```typescript
import { handleDownload, validateUrl } from "./routes/download";
```

### Remove this route section:
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

### Replace with:
```typescript
// Download routes (MediaAPI handles the actual downloading)
app.post("/api/download", handleDownload);
app.post("/api/validate-url", validateUrl);

// Health check
app.get("/api/ping", (_req, res) => {
  res.json({ message: "ok" });
});
```

---

## Step 6: Edit client/pages/Index.tsx

Open `code/client/pages/Index.tsx` and:

### Remove these imports:
```typescript
import PlatformSelector from "@/components/PlatformSelector";
import QualitySelector from "@/components/QualitySelector";
import SpotifyQualitySelector from "@/components/SpotifyQualitySelector";
import EpisodeSelector from "@/components/EpisodeSelector";
import { QUALITY_FORMATS } from "@/lib/urlUtils";
```

### Remove these state variables:
```typescript
const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
const [quality, setQuality] = useState("1080");
const [selectedEpisodes, setSelectedEpisodes] = useState<number[]>([]);
```

### Remove these effect hooks:
```typescript
// Reset quality to sensible default when download type changes
useEffect(() => {
  if (downloadType === "video") {
    setQuality("1080");
  } else {
    setQuality("320");
  }
}, [downloadType]);
```

### Remove/simplify JSX sections:
- Remove: Platform Selector component render
- Remove: Quality Selector component render
- Remove: Spotify Quality Selector component render
- Remove: Episode Selector component render
- Keep: Download Type buttons (Audio/Video)
- Keep: Download button
- Keep: Error/success messages

**Simplified download form should look like:**
```typescript
{/* URL Input */}
<div className="mb-6">
  <label className="block text-sunset-200 font-semibold mb-2">
    Paste Media Link
  </label>
  <Input
    type="text"
    placeholder="YouTube, Instagram, TikTok, Spotify, etc..."
    value={url}
    onChange={(e) => setUrl(e.target.value)}
    disabled={isDownloading}
  />
</div>

{/* Download Type Selector */}
<div className="mb-6">
  <label className="block text-sunset-200 font-semibold mb-3">
    Format
  </label>
  <div className="grid grid-cols-2 gap-3">
    <button
      onClick={() => setDownloadType("video")}
      className={`p-3 rounded-lg border-2 ${
        downloadType === "video" ? "border-sunset-400 bg-sunset-700" : "border-sunset-600"
      }`}
    >
      Video (MP4)
    </button>
    <button
      onClick={() => setDownloadType("audio")}
      className={`p-3 rounded-lg border-2 ${
        downloadType === "audio" ? "border-sunset-400 bg-sunset-700" : "border-sunset-600"
      }`}
    >
      Audio (MP3)
    </button>
  </div>
</div>

{/* Download Button */}
<Button
  onClick={handleDownload}
  disabled={isDownloading}
  size="lg"
  className="w-full"
>
  {isDownloading ? "Downloading..." : "Download"}
</Button>
```

### Remove validation code:
```typescript
// Remove this section (MediaAPI auto-detects platform):
const isAnimePlatform =
  selectedPlatform === "crunchyroll" || selectedPlatform === "hianime";
if (isAnimePlatform && selectedEpisodes.length === 0) {
  setErrorMessage("Please select at least one episode to download");
  setDownloadStatus("error");
  setIsDownloading(false);
  return;
}
```

---

## Verification Checklist

After cleanup, verify these files still exist:

- ✅ `client/pages/Index.tsx` (simplified)
- ✅ `client/lib/mediaapi.ts`
- ✅ `client/lib/api-config.ts`
- ✅ `client/components/DownloadProgress.tsx`
- ✅ `client/components/RainyBackground.tsx`
- ✅ `client/components/BackgroundAudio.tsx`
- ✅ `client/components/TOSNotification.tsx`
- ✅ `server/index.ts` (simplified)
- ✅ `server/node-build.ts`
- ✅ `server/routes/download.ts`
- ✅ `package.json`
- ✅ `vite.config.ts`
- ✅ `netlify.toml`

---

## Test After Cleanup

```bash
npm run dev
```

Then:
1. Go to http://localhost:8080
2. Paste YouTube URL
3. Choose Audio or Video
4. Click Download
5. File should download ✅

---

## Final Push

```bash
git add .
git commit -m "Clean up: remove unused code and old documentation"
git push origin main
```

Netlify will auto-deploy!

---

## What You're Left With

**Before Cleanup:**
- 17 unused files
- Complex project structure
- Multiple old documentation guides
- Confusing component imports

**After Cleanup:**
- Only essential files
- Simple, clean structure
- One clear guide (SIMPLE_FLOW.md)
- Easy to understand code

**Size difference:**
- Before: ~50 files
- After: ~30 files
- Reduction: 40% fewer files!

---

## File Count Summary

### Deleted Files (17 total)
- Backend routes: 4
- Frontend components: 4
- Documentation: 8
- Scripts: 2

### Kept Files (~35 total)
- Client code: 8
- Server code: 3
- Components: 10
- UI library: 5
- Config/build: 5
- Documentation: 4

---

## Done! 🎉

Your project is now clean and simple.

**From confused to focused:**
- Clear purpose: Download media
- Clear flow: Paste → Choose format → Download
- Clear code: Only what's needed

Let's go! 🚀
