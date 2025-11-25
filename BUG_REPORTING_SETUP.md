# Bug Reporting System Setup Guide

The bug reporting system is now integrated into SunsetDownloader! Users can click "Report a Bug" in the footer to submit bug reports with descriptions, reproduction steps, browser info, and screenshots/videos.

## Setup Instructions

### 1. Resend (Email Service) - REQUIRED ✅
Resend will send bug reports to your email.

**Steps:**
1. Go to https://resend.com
2. Sign up for free (no credit card needed)
3. Create a new API key from the dashboard
4. Add to your `.env` file:
   ```
   RESEND_API_KEY=your_api_key_here
   BUG_REPORT_EMAIL=jacobperry27@gmail.com
   ```

### 2. Supabase (File Storage) - OPTIONAL
Supabase stores screenshots and videos from bug reports.

**Steps:**
1. Go to https://supabase.com
2. Create a new project (free tier)
3. Go to **Storage** and create a new bucket named `bug-reports`
4. Get your credentials from **Settings → API**:
   - Copy your `Project URL` 
   - Copy your `Anon Key`
5. Add to your `.env` file:
   ```
   SUPABASE_URL=your_project_url
   SUPABASE_ANON_KEY=your_anon_key
   ```

### 3. Discord Webhook (Optional - For Discord Notifications)
Get bug reports sent to your Discord server instantly.

**Steps:**
1. Go to your Discord server
2. Right-click the channel → **Edit Channel**
3. Go to **Integrations → Webhooks**
4. Click **New Webhook**
5. Name it "SunsetDownloader" and click **Copy Webhook URL**
6. Add to your `.env` file:
   ```
   DISCORD_WEBHOOK_URL=your_webhook_url
   ```

## Testing the Bug Reporting System

1. Click the **"Report a Bug"** button in the footer
2. Fill in:
   - **Bug Description**: What went wrong?
   - **Steps to Reproduce**: How to recreate the issue
   - **Screenshot/Video** (optional): Upload evidence
3. Click **Submit Bug Report**

The report will be:
- ✅ Sent to `jacobperry27@gmail.com` via Resend
- ✅ Posted to Discord (if webhook configured)
- ✅ Stored in Supabase (if configured)
- ✅ Completely anonymous (no user tracking)
- ✅ Include automatic browser, OS, and device info

## What Gets Captured Automatically

- Browser type and version
- Device type (Mobile/Desktop)
- Operating System
- Browser language
- Page URL
- Timestamp
- File uploads (if provided)

## Environment Variables Summary

Create a `.env` file in the root with:

```env
# Required
RESEND_API_KEY=your_api_key_here
BUG_REPORT_EMAIL=jacobperry27@gmail.com

# Optional
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
DISCORD_WEBHOOK_URL=your_webhook_url
```

## Receiving and Responding to Bug Reports

### Email Notifications
- Check `jacobperry27@gmail.com` for bug reports
- Each report includes full context and reproduction steps
- File attachments (if uploaded) are linked in the email

### Discord Notifications
- Real-time alerts in your Discord channel
- Embed with all bug details
- Easy to discuss with team

### Manual Check
- Go to Supabase → `bug_reports` table to see all submitted reports
- All reports are stored with full metadata

## Next Steps

1. **Configure at least Resend** (for emails)
2. Set environment variables in your deployment platform
3. Test the bug reporting system
4. Start collecting bug reports from your users!

---

**Need Help?**
- Resend docs: https://resend.com/docs
- Supabase docs: https://supabase.com/docs
- Discord webhooks: https://discord.com/developers/docs/resources/webhook
