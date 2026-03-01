import { RequestHandler } from "express";
import { detectPlatform } from "../utils/urlUtils";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";

const execAsync = promisify(exec);

// Check if yt-dlp is available
let YT_DLP_AVAILABLE = false;

function checkYtdlp() {
  exec("yt-dlp --version", (error, stdout) => {
    if (!error && stdout) {
      YT_DLP_AVAILABLE = true;
      console.log("[Download] yt-dlp is available for multi-platform downloads");
    } else {
      console.warn("[Download] yt-dlp not available - will use fallback");
    }
  });
}

// Check on startup
checkYtdlp();

interface DownloadRequest {
  url: string;
  platform?: string;
  quality?: string;
  audioOnly?: boolean;
  episodes?: number[];
}

const SUPPORTED_PLATFORMS = [
  "youtube",
  "spotify",
  "instagram",
  "twitter",
  "tiktok",
  "soundcloud",
  "facebook",
  "twitch",
  "crunchyroll",
  "hianime",
  "reddit",
  "pinterest",
];

export const handleDownload: RequestHandler = async (req, res) => {
  try {
    const body = req.body as DownloadRequest;
    let { url, platform, audioOnly } = body;

    console.log("[Download] Request received");
    console.log("[Download] Raw URL:", url);

    if (!url || typeof url !== "string" || !url.trim()) {
      console.warn("[Download] Validation failed: URL is empty or invalid");
      return res.status(400).json({
        error: "URL is required. Please paste a YouTube link (e.g., https://youtube.com/watch?v=...)"
      });
    }

    url = url.trim();

    if (url.length > 2048) {
      return res.status(400).json({ error: "URL is too long" });
    }

    // Try to validate, but don't normalize for Cobalt (it needs the original URL)
    let detectedPlatform = platform;
    try {
      if (!detectedPlatform) {
        // Use the raw URL for platform detection
        detectedPlatform = detectPlatform(url);
      }
    } catch (e) {
      console.error("[Download] Platform detection error:", e);
    }

    console.log("[Download] Platform:", detectedPlatform);

    // If we have yt-dlp, we support many platforms
    // If not, at least validate it looks like a URL
    if (YT_DLP_AVAILABLE) {
      // With yt-dlp, we can try almost any URL
      console.log("[Download] Attempting download with yt-dlp");
    } else {
      // Without yt-dlp, do basic validation
      if (!detectedPlatform || !["youtube"].includes(detectedPlatform)) {
        let errorMsg = "Multi-platform downloads are not available right now.\n\n";
        errorMsg += "✅ YouTube downloads: Available\n";
        errorMsg += "❌ Other platforms (Spotify, Instagram, TikTok, etc.): Requires setup\n\n";
        errorMsg += "To enable all platforms, install yt-dlp:\n";
        errorMsg += "1. Install Python: https://python.org\n";
        errorMsg += "2. Run: pip install yt-dlp\n";
        errorMsg += "3. Restart this app\n\n";
        errorMsg += "For now, try a YouTube URL or follow the setup above.";

        return res.status(503).json({ error: errorMsg });
      }
    }

    if (YT_DLP_AVAILABLE) {
      console.log("[Download] Using yt-dlp for", detectedPlatform);
    } else {
      console.log("[Download] Using YouTube fallback for", detectedPlatform);
    }

    // If yt-dlp is not available, return error for non-YouTube
    if (!YT_DLP_AVAILABLE && detectedPlatform !== "youtube") {
      return res.status(503).json({
        error: "Multi-platform support requires yt-dlp installation.\n\n" +
               "To enable all platforms:\n" +
               "1. Install Python: https://python.org\n" +
               "2. Run: pip install yt-dlp\n" +
               "3. Restart this app\n\n" +
               "YouTube downloads work without yt-dlp.",
      });
    }

    try {
      // Create temp directory for downloads
      const tempDir = "/tmp/downloads";
      try {
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
      } catch (mkdirError) {
        console.warn("[Download] Could not create temp dir, using current dir");
      }

      const outputTemplate = path.join(tempDir, "%(title)s.%(ext)s");

      // Build yt-dlp command safely
      const ytdlpCommand = YT_DLP_AVAILABLE
        ? `yt-dlp "${url.replace(/"/g, '\\"')}" -f ${audioOnly ? "bestaudio/best" : "best"} -o "${outputTemplate}"${audioOnly ? " -x --audio-format mp3 --audio-quality 192" : ""} --no-warnings --quiet 2>/dev/null`
        : null;

      if (!ytdlpCommand) {
        throw new Error("yt-dlp not available and YouTube URL required");
      }

      console.log("[Download] Executing download...");

      const { stdout } = await execAsync(ytdlpCommand, {
        timeout: 300000, // 5 minute timeout
        maxBuffer: 50 * 1024 * 1024, // 50MB buffer
      });

      // Find the downloaded file
      const files = fs.readdirSync(tempDir).filter((f) => !f.startsWith("."));

      if (files.length === 0) {
        throw new Error("Download completed but no file found");
      }

      const downloadedFile = files[0];
      const filePath = path.join(tempDir, downloadedFile);

      // Read file
      const buffer = fs.readFileSync(filePath);

      // Validate file size
      if (buffer.byteLength < 5000) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          // ignore cleanup errors
        }
        throw new Error("Downloaded file is too small or empty");
      }

      console.log("[Download] Downloaded:", buffer.byteLength, "bytes, filename:", downloadedFile);

      // Set response headers
      res.setHeader("Content-Type", audioOnly ? "audio/mpeg" : "video/mp4");
      res.setHeader("Content-Length", buffer.byteLength.toString());
      res.setHeader("Content-Disposition", `attachment; filename="${downloadedFile}"`);
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Access-Control-Allow-Origin", "*");

      // Clean up temp file
      try {
        fs.unlinkSync(filePath);
      } catch (cleanupError) {
        console.warn("[Download] Cleanup failed:", cleanupError);
      }

      res.send(buffer);
    } catch (downloadError) {
      throw downloadError;
    }
  } catch (error) {
    console.error("[Download] Exception:", error);

    let errorMessage = "Download failed. Please try again.";

    // Handle specific errors
    if (error instanceof Error) {
      const err = error as any;
      const msg = error.message.toLowerCase();

      // HTTP Status Code Errors
      if (err.statusCode === 410 || msg.includes("410")) {
        errorMessage = "Video is not available. It may be deleted, private, or age-restricted.";
      }
      else if (err.statusCode === 403 || msg.includes("403")) {
        errorMessage = "Access denied. This video may be restricted in your region or requires payment.";
      }
      else if (err.statusCode === 404 || msg.includes("404")) {
        errorMessage = "Video not found. Please check the URL is correct.";
      }
      else if (err.statusCode === 429 || msg.includes("429")) {
        errorMessage = "Rate limited. Please wait a moment and try again.";
      }
      // Network and Availability
      else if (msg.includes("unavailable")) {
        errorMessage = "Video is unavailable. It may have been removed or restricted.";
      }
      else if (msg.includes("enotfound") || msg.includes("network")) {
        errorMessage = "Network error. Please check your connection and try again.";
      }
      else if (msg.includes("econnrefused")) {
        errorMessage = "Could not connect to video service. Please try again.";
      }
      // Content Restrictions
      else if (msg.includes("age") || msg.includes("restricted")) {
        errorMessage = "This video is age-restricted and cannot be downloaded.";
      }
      else if (msg.includes("private")) {
        errorMessage = "This video is private and cannot be downloaded.";
      }
      else if (msg.includes("copyrighted") || msg.includes("copyright")) {
        errorMessage = "This video has copyright protection and cannot be downloaded.";
      }
      else if (msg.includes("blocked") || msg.includes("not allowed")) {
        errorMessage = "This video is blocked from downloading in your region.";
      }
      // Format Issues
      else if (msg.includes("no formats") || msg.includes("no suitable")) {
        errorMessage = "No downloadable formats available for this video.";
      }
      else if (msg.includes("empty")) {
        errorMessage = "Download resulted in empty file. Please try another video.";
      }
      else if (msg.includes("timeout")) {
        errorMessage = "Download timed out. The video may be very large. Please try again.";
      }
      // Invalid Input
      else if (msg.includes("invalid") || msg.includes("not a youtube")) {
        errorMessage = "Invalid URL. Please check it's a correct YouTube link.";
      }
      else if (msg.includes("extracted")) {
        errorMessage = "Could not extract video information. The link may be invalid.";
      }
      // Fallback with error message
      else {
        errorMessage = error.message || "Download failed. Please try again.";
      }
    }

    return res.status(400).json({ error: errorMessage });
  }
};

export const validateUrl: RequestHandler = (req, res) => {
  try {
    const { url } = req.body as { url?: string };

    if (!url || typeof url !== "string" || !url.trim()) {
      return res.status(400).json({
        valid: false,
        error: "URL is required",
      });
    }

    const detectedPlatform = detectPlatform(url);

    if (!detectedPlatform || !SUPPORTED_PLATFORMS.includes(detectedPlatform)) {
      return res.json({
        valid: false,
        detected: detectedPlatform,
        error: "Platform not supported",
      });
    }

    res.json({
      valid: true,
      platform: detectedPlatform,
      url: url,
    });
  } catch (error) {
    console.error("[Validation] Error:", error);
    res.status(500).json({
      valid: false,
      error: "Validation failed",
    });
  }
};
