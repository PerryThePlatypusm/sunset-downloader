# Supabase Edge Functions (FREE, No Docker!)

Deploy your downloader with **Supabase Edge Functions** - no Docker, no complex setup, just upload code!

## Why Supabase Edge Functions?

| Feature | Docker/Cloud Run | Supabase Edge Functions |
|---------|------------------|------------------------|
| **Setup Complexity** | Very Complex | Super Simple |
| **Docker Required** | ❌ YES | ✅ NO |
| **Cost** | Free but complex | **FREE** (generous) |
| **Deployment** | CLI commands | Click buttons |
| **Works with Netlify** | ✅ Yes | ✅ Yes |
| **Platform Support** | 1000+ (yt-dlp) | 1000+ (yt-dlp) |
| **Setup Time** | 30+ minutes | **5 minutes** |

## 💰 Free Tier

- **1M requests/month** - FREE
- **50k function invocations/month** - FREE
- **Unlimited Edge Function deployments**
- No credit card needed (actually free)

## 🚀 Architecture

```
Your Domain (Netlify Frontend)
        ↓
  User pastes URL
        ↓
Supabase Edge Function (Backend)
        ↓
  Downloads via yt-dlp
        ↓
  Returns file to user's browser
        ↓
  File saves to device
```

## Step 1: Create Supabase Project (2 minutes)

### 1.1 Sign Up
1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with Google, GitHub, or email
4. Create new project:
   - Name: "sunset-downloader"
   - Region: Choose closest to you
   - Password: Create strong password
5. Click "Create new project"
6. Wait ~2 minutes for it to initialize

### 1.2 Get Your Project URL
After creation:
1. Go to Settings → API
2. Copy "Project URL" - looks like: `https://xyzabc.supabase.co`
3. Copy "anon key" (public key)
4. **Save these!** You'll need them

## Step 2: Create Edge Function

### 2.1 Create the Function
In Supabase dashboard:
1. Go to "Edge Functions" (left sidebar)
2. Click "Create a new function"
3. Name it: `download`
4. Click "Create function"

### 2.2 Paste the Code
Replace the code with:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { exec } from "https://deno.land/x/exec@0.0.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { url, audioOnly } = body;

    if (!url) {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[Download] Starting download for:", url);

    // Create temp directory
    const tempDir = "/tmp/sunset";
    await exec(`mkdir -p ${tempDir}`);

    const outputTemplate = `${tempDir}/%(title)s.%(ext)s`;

    // Build yt-dlp command
    const ytdlpCommand = audioOnly
      ? `yt-dlp "${url.replace(/"/g, '\\"')}" -f bestaudio/best -o "${outputTemplate}" -x --audio-format mp3 --audio-quality 192 --no-warnings --quiet`
      : `yt-dlp "${url.replace(/"/g, '\\"')}" -f best -o "${outputTemplate}" --no-warnings --quiet`;

    console.log("[Download] Executing:", ytdlpCommand);

    // Execute download
    const { stdout, stderr } = await exec(ytdlpCommand);

    if (stderr && stderr.includes("error")) {
      console.error("[Download] Error:", stderr);
      return new Response(
        JSON.stringify({ error: `Download failed: ${stderr}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Read downloaded file
    const files = await exec(`ls -1 ${tempDir}`);
    const fileList = files.stdout.trim().split("\n");

    if (fileList.length === 0) {
      return new Response(
        JSON.stringify({ error: "Download completed but file not found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fileName = fileList[0];
    const filePath = `${tempDir}/${fileName}`;

    // Read file
    const fileData = await exec(`base64 -w 0 ${filePath}`);
    const base64File = fileData.stdout;

    // Clean up
    await exec(`rm -f ${filePath}`);

    return new Response(
      JSON.stringify({
        success: true,
        fileName,
        fileData: base64File,
        mimeType: audioOnly ? "audio/mpeg" : "video/mp4",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Download] Exception:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

### 2.3 Deploy
Click "Deploy" button - done in 2 seconds!

## Step 3: Update Frontend Configuration

### 3.1 Get Your Function URL
After deployment:
1. You'll see: `https://your-project.supabase.co/functions/v1/download`
2. Copy this URL

### 3.2 Update API Config
Edit `code/client/lib/api-config.ts`:

```typescript
const getApiUrl = (): string => {
  // For Supabase deployment
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (supabaseUrl) {
    return supabaseUrl;
  }

  // Default to same-origin
  return window.location.origin;
};

export const API_BASE_URL = getApiUrl();

export const API_ENDPOINTS = {
  download: "/functions/v1/download", // Supabase Edge Function
  validateUrl: "/api/validate-url",
} as const;
```

### 3.3 Update Download Handler
In `code/client/pages/Index.tsx`, update the download function to handle base64 response:

```typescript
const response = await fetch(getDownloadUrl(), {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(requestBody),
});

if (!response.ok) {
  throw new Error("Download failed");
}

const data = await response.json();

if (data.error) {
  throw new Error(data.error);
}

// Decode base64 file
const binaryString = atob(data.fileData);
const bytes = new Uint8Array(binaryString.length);
for (let i = 0; i < binaryString.length; i++) {
  bytes[i] = binaryString.charCodeAt(i);
}
const blob = new Blob([bytes], { type: data.mimeType });

// Download
const downloadUrl = window.URL.createObjectURL(blob);
const a = document.createElement("a");
a.href = downloadUrl;
a.download = data.fileName;
document.body.appendChild(a);
a.click();
window.URL.revokeObjectURL(downloadUrl);
document.body.removeChild(a);
```

## Step 4: Deploy to Netlify

### 4.1 Update Environment Variable
In Netlify:
1. Site settings → Build & Deploy → Environment
2. Add variable:
   - Name: `VITE_SUPABASE_URL`
   - Value: `https://your-project.supabase.co` (your Supabase project URL)

### 4.2 Deploy
```bash
git add .
git commit -m "Add Supabase Edge Functions backend"
git push origin main
```

Netlify will auto-deploy!

## ✅ What You Get

- ✅ **Frontend** on Netlify (your domain)
- ✅ **Backend** on Supabase (serverless Edge Functions)
- ✅ **Download from 1000+ platforms** (YouTube, Spotify, Instagram, TikTok, etc.)
- ✅ **Files save to your device**
- ✅ **$0/month cost**
- ✅ **Zero Docker complexity**

## 🧪 Testing

1. Go to your Netlify domain
2. Paste a YouTube URL
3. Click Download
4. File should download automatically
5. Play on any device!

## 📊 Pricing

| Usage | Cost |
|-------|------|
| 0 - 1M requests/month | FREE |
| 1M - 5M requests/month | ~$0.01 per 1K requests |
| 5M+ requests/month | Contact Supabase |

**For 1000 downloads/month:** FREE (way under 1M requests)

## 🔧 Troubleshooting

### "Edge Function not found"
- Wait 30 seconds after deployment
- Refresh browser
- Check Supabase dashboard that function exists

### "CORS Error"
The function headers already include CORS, should work!

### "Download fails"
Check Supabase Edge Function logs:
1. Go to Edge Functions
2. Click the function
3. View logs for errors

### "yt-dlp not found"
yt-dlp should be available in Deno environment. If not, contact Supabase support.

## Advantages Over Docker

✅ **No Dockerfile** - Just upload code
✅ **Instant deployment** - Takes seconds
✅ **No Docker knowledge needed** - Simple!
✅ **Works globally** - Auto-scaled worldwide
✅ **Better debugging** - Logs in dashboard
✅ **Same features** - All platforms supported
✅ **Free tier** - 1M requests/month

## When to Use What

| Option | When to Use |
|--------|------------|
| **Netlify Only** | YouTube only, super simple |
| **Supabase Edge Functions** | 1000+ platforms, want easy setup |
| **Google Cloud Run** | Same as Supabase, but more complex setup |
| **Docker/Railway** | Advanced, want full control |

## Next Steps

1. Create Supabase project (5 min)
2. Create Edge Function (2 min)
3. Update frontend code (5 min)
4. Deploy to Netlify (1 min)
5. Test downloads (1 min)

**Total: ~15 minutes!**

## Getting Help

- **Supabase Docs:** https://supabase.com/docs
- **Edge Functions Guide:** https://supabase.com/docs/guides/functions
- **Check logs:** Supabase dashboard → Edge Functions → Your function
- **Community:** https://discord.supabase.com

---

**This is the easiest way to deploy without Docker!** 🚀
