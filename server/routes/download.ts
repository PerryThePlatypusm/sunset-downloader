import { RequestHandler } from "express";
import { detectPlatform, isValidUrl, normalizeUrl } from "../utils/urlUtils";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const execAsync = promisify(exec);

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

const QUALITY_MAP: Record<string, string> = {
  // Video qualities
  "240": "worst",
  "360": "worse",
  "480": "worseaudio/worst",
  "720": "best[height<=720]",
  "1080": "best[height<=1080]",
  "2160": "best[height<=2160]",
  "4k": "best[height<=2160]",
  // Audio qualities (bitrates)
  "128": "worst",
  "192": "worseaudio",
  "256": "worseaudio",
  "320": "bestaudio",
  // Lossless audio
  flac: "bestaudio",
  alac: "bestaudio",
  lossless: "bestaudio",
  highest: "bestaudio",
};

// Temporary directory for downloads (cross-platform)
const TEMP_DIR = path.join(os.tmpdir(), "sunset-downloads");
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

export const handleDownload: RequestHandler = async (req, res) => {
  let tempFile: string | null = null;

  try {
    const body = req.body as DownloadRequest;
    const { url, platform, quality, audioOnly } = body;

    // Validate URL
    if (!url || typeof url !== "string" || !url.trim()) {
      return res.status(400).json({ error: "URL is required" });
    }

    if (url.length > 2048) {
      return res.status(400).json({ error: "URL is too long" });
    }

    // Normalize and validate URL
    let normalizedUrl: string;
    try {
      normalizedUrl = normalizeUrl(url);
    } catch (error) {
      return res.status(400).json({ error: "Invalid URL format" });
    }

    if (!isValidUrl(normalizedUrl)) {
      return res.status(400).json({ error: "Invalid URL format" });
    }

    // Detect platform
    let detectedPlatform = platform;
    if (!detectedPlatform) {
      detectedPlatform = detectPlatform(normalizedUrl);
    }

    if (!detectedPlatform || !SUPPORTED_PLATFORMS.includes(detectedPlatform)) {
      return res.status(400).json({
        error: `Unsupported platform. Supported: ${SUPPORTED_PLATFORMS.join(", ")}`,
      });
    }

    // Determine output format and quality
    let outputFormat = "mp4";
    let qualityFormat = "best";

    if (audioOnly) {
      outputFormat = "mp3";
      qualityFormat = QUALITY_MAP[quality || "320"] || "bestaudio";
    } else {
      qualityFormat = QUALITY_MAP[quality || "720"] || "best";
    }

    // Generate temp filename
    const timestamp = Date.now();
    const outputTemplate = path.join(
      TEMP_DIR,
      `download_${timestamp}_%(title)s.%(ext)s`,
    );

    // Build yt-dlp command
    let command = `yt-dlp`;
    command += ` -f "${qualityFormat}"`;

    if (audioOnly) {
      command += ` -x --audio-format mp3 --audio-quality 192K`;
    } else {
      command += ` -f "best[ext=mp4]"`;
    }

    command += ` -o "${outputTemplate}"`;
    command += ` "${normalizedUrl}"`;
    command += ` --quiet --no-warnings`;

    console.log(`Starting download: ${detectedPlatform} (${audioOnly ? "audio" : "video"})`);
    console.log(`Command: ${command.substring(0, 100)}...`);

    // Execute download with better error handling
    let downloadError: string | null = null;
    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: 120000,
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      });
      if (stderr) {
        console.warn("yt-dlp warnings:", stderr);
      }
    } catch (error: any) {
      console.error("yt-dlp error:", error);
      downloadError = error.message || String(error);

      // Check if yt-dlp is installed
      if (
        downloadError.includes("not found") ||
        downloadError.includes("ENOENT") ||
        downloadError.includes("command not found")
      ) {
        return res.status(503).json({
          error: "yt-dlp is not installed on this server",
          details: "yt-dlp binary not found in system PATH",
          instruction: "Run: pip install yt-dlp (then ensure it's in your PATH)",
          platform: process.platform,
        });
      }

      // Network or URL-related errors
      if (
        downloadError.includes("404") ||
        downloadError.includes("unavailable") ||
        downloadError.includes("private")
      ) {
        return res.status(400).json({
          error: "The video/audio is not available or the URL is invalid",
          details: downloadError,
        });
      }

      return res.status(400).json({
        error: "Failed to download. Please check the URL and try again.",
        details: downloadError,
      });
    }

    // Find the downloaded file
    const files = fs.readdirSync(TEMP_DIR);
    const downloadedFile = files.find(
      (f) => f.startsWith(`download_${timestamp}_`) && !f.startsWith("."),
    );

    if (!downloadedFile) {
      return res.status(500).json({
        error: "Download completed but file not found",
      });
    }

    tempFile = path.join(TEMP_DIR, downloadedFile);
    const fileStats = fs.statSync(tempFile);

    if (fileStats.size === 0) {
      fs.unlinkSync(tempFile);
      return res.status(400).json({
        error: "Downloaded file is empty",
      });
    }

    // Determine MIME type
    const mimeType = audioOnly ? "audio/mpeg" : "video/mp4";
    const fileName = downloadedFile
      .replace(`download_${timestamp}_`, "")
      .replace(/\.\w+$/, `.${outputFormat}`);

    // Stream file
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Length", fileStats.size.toString());
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Access-Control-Allow-Origin", "*");

    // Stream the file and cleanup after
    const fileStream = fs.createReadStream(tempFile);
    fileStream.pipe(res);

    fileStream.on("end", () => {
      try {
        fs.unlinkSync(tempFile!);
      } catch {
        // Ignore cleanup errors
      }
    });

    fileStream.on("error", (error) => {
      console.error("Stream error:", error);
      try {
        fs.unlinkSync(tempFile!);
      } catch {
        // Ignore cleanup errors
      }
    });
  } catch (error) {
    console.error("Download error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";

    // Cleanup temp file if it exists
    if (tempFile && fs.existsSync(tempFile)) {
      try {
        fs.unlinkSync(tempFile);
      } catch {
        // Ignore cleanup errors
      }
    }

    return res.status(500).json({ error: errorMessage });
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

    const normalizedUrl = normalizeUrl(url);
    const valid = isValidUrl(normalizedUrl);
    const platform = detectPlatform(normalizedUrl);

    if (!valid) {
      return res.json({
        valid: false,
        error: "Invalid URL format",
      });
    }

    if (!platform || !SUPPORTED_PLATFORMS.includes(platform)) {
      return res.json({
        valid: false,
        detected: platform,
        error: "Platform not supported or invalid URL for that platform",
      });
    }

    res.json({
      valid: true,
      platform,
      url: normalizedUrl,
    });
  } catch (error) {
    console.error("Validation error:", error);
    res.status(500).json({
      valid: false,
      error: "Validation failed",
    });
  }
};
