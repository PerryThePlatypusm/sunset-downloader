import { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase (we'll set env vars later)
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "";
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

interface BugReportRequest {
  description: string;
  stepsToReproduce: string;
  browserInfo: string;
  attachment?: Buffer;
  filename?: string;
  mimetype?: string;
}

interface BrowserInfo {
  browser: string;
  device: string;
  os: string;
  userAgent: string;
  timestamp: string;
  url: string;
  language: string;
}

export const handleBugReport: RequestHandler = async (req, res) => {
  try {
    const { description, stepsToReproduce, browserInfo } = req.body;
    const file = (req as any).file;

    // Validate input
    if (!description || !stepsToReproduce) {
      return res.status(400).json({
        error: "Description and steps to reproduce are required",
      });
    }

    let browserData: BrowserInfo = {
      browser: "Unknown",
      device: "Unknown",
      os: "Unknown",
      userAgent: "",
      timestamp: new Date().toISOString(),
      url: "",
      language: "",
    };

    try {
      browserData = JSON.parse(browserInfo);
    } catch (e) {
      console.error("Failed to parse browser info:", e);
    }

    // Handle file upload to Supabase if available
    let fileUrl: string | null = null;
    if (file && supabase) {
      try {
        const fileName = `bug-reports/${Date.now()}-${file.originalname}`;
        const { data, error } = await supabase.storage
          .from("bug-reports")
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
          });

        if (error) {
          console.error("Supabase upload error:", error);
        } else {
          const {
            data: { publicUrl },
          } = supabase.storage
            .from("bug-reports")
            .getPublicUrl(fileName);
          fileUrl = publicUrl;
        }
      } catch (error) {
        console.error("File upload failed:", error);
      }
    }

    // Format email content
    const emailContent = `
🐛 New Bug Report from SunsetDownloader

**Description:**
${description}

**Steps to Reproduce:**
${stepsToReproduce}

**Browser Information:**
- Browser: ${browserData.browser}
- Device: ${browserData.device}
- OS: ${browserData.os}
- Language: ${browserData.language}
- Timestamp: ${browserData.timestamp}
- URL: ${browserData.url}
- User Agent: ${browserData.userAgent}

${fileUrl ? `**Attachment:** ${fileUrl}` : "No attachment"}

---
Anonymous Report | All reports are reviewed and appreciated!
    `;

    // Send email via Resend
    if (process.env.RESEND_API_KEY) {
      try {
        const Resend = (await import("resend")).default;
        const resend = new Resend(process.env.RESEND_API_KEY);

        await resend.emails.send({
          from: "bugs@sunsetdownloader.com",
          to: process.env.BUG_REPORT_EMAIL || "jacobperry27@gmail.com",
          subject: `🐛 Bug Report: ${description.substring(0, 50)}...`,
          html: emailContent.replace(/\n/g, "<br>"),
        });
      } catch (error) {
        console.error("Email send failed:", error);
      }
    } else {
      console.warn("RESEND_API_KEY not configured");
    }

    // Send to Discord webhook if configured
    if (process.env.DISCORD_WEBHOOK_URL) {
      try {
        const discordEmbed = {
          title: "🐛 New Bug Report",
          color: 0xff6b6b,
          fields: [
            {
              name: "Description",
              value: description,
              inline: false,
            },
            {
              name: "Steps to Reproduce",
              value: stepsToReproduce,
              inline: false,
            },
            {
              name: "Browser",
              value: browserData.browser,
              inline: true,
            },
            {
              name: "Device",
              value: browserData.device,
              inline: true,
            },
            {
              name: "OS",
              value: browserData.os,
              inline: true,
            },
            {
              name: "Language",
              value: browserData.language,
              inline: true,
            },
            {
              name: "Timestamp",
              value: browserData.timestamp,
              inline: false,
            },
            {
              name: "URL",
              value: browserData.url,
              inline: false,
            },
          ],
          footer: {
            text: "Anonymous Bug Report",
          },
        };

        if (fileUrl) {
          discordEmbed.fields.push({
            name: "Attachment",
            value: fileUrl,
            inline: false,
          });
        }

        await fetch(process.env.DISCORD_WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            embeds: [discordEmbed],
          }),
        });
      } catch (error) {
        console.error("Discord webhook failed:", error);
      }
    }

    // Save to database for tracking
    if (supabase) {
      try {
        await supabase.from("bug_reports").insert({
          description,
          steps_to_reproduce: stepsToReproduce,
          browser_info: browserData,
          attachment_url: fileUrl,
          created_at: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Database save failed:", error);
      }
    }

    res.json({
      success: true,
      message: "Bug report submitted successfully",
    });
  } catch (error) {
    console.error("Bug report error:", error);
    res.status(500).json({
      error: "Failed to submit bug report",
    });
  }
};
