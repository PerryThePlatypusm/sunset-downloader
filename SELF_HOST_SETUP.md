# Self-Hosting Sunset Downloader

This guide explains how to self-host the Sunset Downloader backend on your own infrastructure.

## Overview

Sunset Downloader supports three deployment modes:

1. **Same-Origin (Default)** - Backend and frontend on same domain (Netlify Functions)
2. **Self-Hosted** - Backend runs on your own server/VPS
3. **Docker** - Containerized backend for easy deployment anywhere

## Prerequisites

### For Local Development
- Node.js 20+ and npm/pnpm
- Git
- Python 3.8+ (for yt-dlp)
- FFmpeg (for video processing)

### For Docker
- Docker Desktop or Docker Engine
- Docker Compose (optional, for easier management)

## Option 1: Local Development Setup

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd sunset-downloader
npm install
```

### 2. Build the Backend

```bash
npm run build:server
```

### 3. Run Backend Locally

```bash
npm run start:backend
```

The backend will start on `http://localhost:3000`

### 4. Configure Frontend (Development)

Create a `.env` file in the project root:

```env
VITE_API_URL=http://localhost:3000
```

### 5. Run Frontend (in another terminal)

```bash
npm run dev
```

Visit `http://localhost:5173` and the app will connect to your local backend at `http://localhost:3000`.

## Option 2: Docker Setup

### 1. Build Docker Image

```bash
npm run docker:build
```

Or with docker-compose:

```bash
npm run docker:build-dev
```

### 2. Run with Docker

Single container:
```bash
npm run docker:run
```

With docker-compose (includes health checks):
```bash
npm run docker:dev
```

The backend will be available at `http://localhost:3000`

### 3. Stop Container

```bash
# For single container
docker stop <container-id>

# For docker-compose
docker-compose down
```

## Option 3: Production Deployment

### Deploy to VPS (Ubuntu/Debian)

#### Step 1: Setup Server

```bash
# SSH into your server
ssh user@your-vps-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### Step 2: Clone Repository

```bash
git clone <your-repo-url> sunset-downloader
cd sunset-downloader
```

#### Step 3: Build and Run

```bash
docker build -t sunset-downloader .
docker run -d \
  --name sunset-backend \
  -p 3000:3000 \
  --restart unless-stopped \
  sunset-downloader
```

#### Step 4: Setup Reverse Proxy (Nginx)

```bash
sudo apt install nginx -y

# Create nginx config
sudo nano /etc/nginx/sites-available/sunset
```

Paste this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/sunset /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 5: Setup HTTPS (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

### Configure Frontend for Self-Hosted Backend

When deploying the frontend, set the environment variable:

```bash
export VITE_API_URL=https://your-domain.com
npm run build
```

Or create a `.env.production` file:

```env
VITE_API_URL=https://your-domain.com
```

## Environment Variables

### Backend (Optional)

```env
NODE_ENV=production           # Set to production for deployment
PORT=3000                     # Server port (default: 3000)
PING_MESSAGE=Backend online   # Custom ping response
```

### Frontend

```env
VITE_API_URL=http://localhost:3000    # Backend URL (default: same origin)
```

## Troubleshooting

### Backend won't start

```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill process using port 3000
kill -9 <PID>
```

### Docker build fails

```bash
# Clean docker cache
docker system prune -a

# Rebuild
npm run docker:build
```

### Connection refused error

Make sure:
1. Backend is running on the correct port
2. Firewall allows traffic on that port
3. `VITE_API_URL` points to correct backend URL
4. No CORS issues (backend should have CORS enabled)

### yt-dlp not working

```bash
# In Docker, yt-dlp should be installed automatically
# For local machine, install it:
pip3 install yt-dlp
ffmpeg --version  # Should be available
```

## Architecture

```
┌─────────────────────────────────────────┐
│         Sunset Downloader Frontend       │
│        (React + Vite + TailwindCSS)     │
└─────────────────────────────────────────┘
                    │
                    │ HTTP/HTTPS
                    │
┌─────────────────────────────────────────┐
│      Sunset Downloader Backend           │
│    (Express + yt-dlp + FFmpeg)          │
│   Running in Docker or Node.js          │
└─────────────────────────────────────────┘
                    │
                    │ CLI
                    │
┌─────────────────────────────────────────┐
│         yt-dlp + FFmpeg                  │
│  (Downloads media from 1000+ platforms) │
└─────────────────────────────────────────┘
```

## Performance Tips

1. **Use SSD Storage** - Faster downloads and processing
2. **Allocate Adequate RAM** - FFmpeg can be memory-intensive
3. **Set Resource Limits** - Prevent runaway processes
4. **Enable Caching** - Nginx can cache common requests
5. **Monitor Logs** - Watch for errors and optimize

## Security Considerations

1. **Use HTTPS** - Always encrypt traffic
2. **Set Firewall Rules** - Restrict access if needed
3. **Use Reverse Proxy** - Nginx provides additional security
4. **Regular Updates** - Keep Docker images updated
5. **Monitor Disk Space** - Download cache can grow large
6. **Rate Limiting** - Consider adding rate limits to prevent abuse

## Next Steps

Once your backend is running:

1. Update your frontend's `VITE_API_URL` to point to your backend
2. Test downloads to ensure everything works
3. Monitor logs for any issues
4. Set up backups and monitoring
5. Consider load balancing for high traffic

## Support

For issues or questions:
1. Check Docker logs: `docker logs sunset-backend`
2. Check server logs in your VPS
3. Ensure all prerequisites are installed
4. Review troubleshooting section above
