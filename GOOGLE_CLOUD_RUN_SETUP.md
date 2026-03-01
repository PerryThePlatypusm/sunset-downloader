# Deploy to Google Cloud Run (FREE) + Netlify

This guide shows how to deploy your downloader for free using Google Cloud Run for the backend and Netlify for the frontend. **Everything is free with generous limits!**

## 🎯 Architecture

```
Your Domain (Netlify)
├─ Frontend (React) - Hosted on Netlify
│  └─ Connects to Google Cloud Run backend
└─ Backend (Node.js + yt-dlp) - Runs on Google Cloud Run
   ├─ Downloads from 1000+ platforms
   ├─ Returns files to frontend
   └─ Auto-scales to zero cost when not in use
```

## 💰 Cost (FREE!)

- **Google Cloud Run:** 
  - 2 million requests per month FREE
  - Auto-scales to zero (no cost when idle)
  - Perfect for downloads
  
- **Netlify:**
  - Free tier includes React hosting
  - Supports environment variables

**Total Cost: $0/month** (unless you get massive traffic)

## 📋 Prerequisites

You'll need:
1. Google Account (free)
2. Netlify Account (free, already have?)
3. Git (for pushing code)
4. Google Cloud CLI (we'll install)

## Step 1: Set Up Google Cloud Project

### 1.1 Create Project
1. Go to https://console.cloud.google.com/
2. Click "Select a Project" → "New Project"
3. Name it "sunset-downloader"
4. Click "Create"
5. Wait for project to be created (1-2 minutes)

### 1.2 Enable Required APIs
1. Search for "Cloud Run API" in search bar
2. Click it and click "ENABLE"
3. Search for "Artifact Registry API"
4. Click it and click "ENABLE"
5. Search for "Cloud Build API"
6. Click it and click "ENABLE"

### 1.3 Set Up Authentication
1. Go to https://console.cloud.google.com/iam-admin/serviceaccounts
2. Click "Create Service Account"
3. Name: "sunset-downloader-deploy"
4. Click "Create and Continue"
5. Click "Continue" (skip the optional steps)
6. Click "Create Key" → "JSON"
7. Save the file to your computer (keep it safe!)

## Step 2: Install Google Cloud CLI

### Windows:
```bash
# Download installer from:
https://cloud.google.com/sdk/docs/install-sdk#windows

# Or use this command:
powershell -Command "(New-Object System.Net.ServicePointManager).SecurityProtocol = 3072; $ProgressPreference = 'SilentlyContinue'; Invoke-WebRequest -Uri https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe -OutFile GoogleCloudSDKInstaller.exe; & ./GoogleCloudSDKInstaller.exe
```

### Mac:
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init
```

### Linux:
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init
```

After installation, run:
```bash
gcloud init
```

Then select:
1. Your Google Cloud Project
2. The region closest to you

## Step 3: Create Dockerfile for Google Cloud Run

Your `Dockerfile.railway` already works! Google Cloud Run supports it. Just verify it's correct:

```dockerfile
FROM node:20 AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN npm run build

FROM node:20
WORKDIR /app

# Install yt-dlp dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN pip3 install --no-cache-dir yt-dlp

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --prod --frozen-lockfile

COPY --from=builder /app/dist ./dist
RUN mkdir -p /tmp/downloads && chmod 777 /tmp/downloads

EXPOSE 8080
ENV NODE_ENV=production
ENV PORT=8080

CMD ["node", "dist/server/node-build.mjs"]
```

**Make one change:** Update `EXPOSE 8080` and `ENV PORT=8080` (not 3000).

## Step 4: Deploy to Google Cloud Run

### 4.1 Authenticate
```bash
gcloud auth login
```

### 4.2 Set Project
```bash
gcloud config set project sunset-downloader
```
(Replace with your actual project ID)

### 4.3 Deploy
```bash
gcloud run deploy sunset-downloader \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production
```

### 4.4 Get Your Backend URL
The output will show:
```
Service [sunset-downloader] revision [sunset-downloader-00001]
url: https://sunset-downloader-xxxxx.run.app
Status: ✓ Active
```

**Save this URL!** Example: `https://sunset-downloader-abc123.run.app`

## Step 5: Deploy Frontend to Netlify

### 5.1 Build Your App
```bash
npm run build
```

### 5.2 Push to GitHub
```bash
git add .
git commit -m "Add Google Cloud Run deployment"
git push origin main
```

### 5.3 Deploy to Netlify
1. Go to https://netlify.com
2. Click "New site from Git"
3. Select your GitHub repository
4. Build command: `npm run build`
5. Publish directory: `dist/spa`
6. Click "Deploy"

### 5.4 Add Environment Variable
1. Go to Netlify site settings
2. Build & Deploy → Environment
3. Click "Add variable"
4. Name: `VITE_API_URL`
5. Value: `https://sunset-downloader-xxxxx.run.app` (your Cloud Run URL from Step 4.4)
6. Click "Save"

### 5.5 Trigger a Rebuild
1. Go to Netlify Deploys
2. Click "Trigger Deploy" → "Deploy Site"
3. Wait for deploy to complete
4. Visit your Netlify domain!

## ✅ Success! You Should Now Have:

- ✅ **Frontend** on Netlify (free)
- ✅ **Backend** on Google Cloud Run (free)
- ✅ **Download from 1000+ platforms**
- ✅ **Files save to your device**
- ✅ **$0/month cost**

## 🧪 Test It

1. Go to your Netlify domain (e.g., https://sunset-downloader.netlify.app)
2. Paste a YouTube, Spotify, Instagram, TikTok, or any supported URL
3. Click Download
4. File should save to your Downloads folder
5. Play it on any device!

## 📊 How Cloud Run Billing Works

You only pay for actual usage:
- **2 million requests/month** - FREE
- Each download = ~1 request
- When no one uses it = $0 cost
- Auto-scales from 0 to 100 instances

**Example costs:**
- 100 downloads/month: FREE (under 2M requests)
- 1000 downloads/month: FREE (under 2M requests)
- 50,000 downloads/month: ~$0.50 (still mostly free)

## 🔧 Troubleshooting

### "Deployment failed"
```bash
# Check logs:
gcloud run logs read sunset-downloader --limit 50
```

### "Cannot connect to backend"
1. Go to Cloud Run console
2. Click your service
3. Check if "Status" shows ✓ Active
4. Verify URL is correct in Netlify env vars
5. Try refreshing browser after 5 minutes

### "Download fails on deployed version"
1. Check Cloud Run logs (see above)
2. Make sure Dockerfile has yt-dlp installation
3. Redeploy: `gcloud run deploy ...` (same command as Step 4.3)

### "Port already in use locally"
```bash
PORT=3000 npm run dev
```

## 🚀 Next Steps

1. **Custom Domain (Optional)**
   - Buy domain from Google Domains, Namecheap, etc.
   - Update DNS in Netlify
   - Enable free SSL

2. **Monitoring**
   - Go to Cloud Run console
   - View request logs and metrics
   - See cost estimates

3. **Scaling**
   - Cloud Run auto-scales based on demand
   - No configuration needed
   - Handles thousands of concurrent downloads

## 📝 Key Files

- `Dockerfile.railway` - Used by Cloud Run to build your app
- `code/server/routes/download.ts` - Download handler
- `code/client/lib/api-config.ts` - Frontend API configuration
- `package.json` - Dependencies

## 🆘 Need Help?

Check these resources:
- Google Cloud Run docs: https://cloud.google.com/run/docs
- Netlify docs: https://docs.netlify.com
- Your Cloud Run logs: `gcloud run logs read sunset-downloader --limit 100`

## 🎉 Summary

**What you have:**
- Free video downloader on your own domain
- Downloads from 1000+ platforms (YouTube, Spotify, Instagram, TikTok, Twitter, SoundCloud, etc.)
- Files save to any device
- No monthly costs
- Auto-scales to handle traffic

**Total setup time:** ~30 minutes

Enjoy your free downloader! 🌅
