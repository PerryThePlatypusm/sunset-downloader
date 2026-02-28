import { RequestHandler } from "express";
import { detectPlatform, isValidUrl, normalizeUrl } from "../utils/urlUtils";
import ytdl from "ytdl-core";

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
      return res.status(400).json({ error: "URL is required" });
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

    if (!detectedPlatform || !SUPPORTED_PLATFORMS.includes(detectedPlatform)) {
      return res.status(400).json({
        error: "Unsupported platform",
      });
    }

    // Only YouTube is fully supported with ytdl-core
    if (detectedPlatform !== "youtube") {
      return res.status(400).json({
        error: `${detectedPlatform.charAt(0).toUpperCase() + detectedPlatform.slice(1)} downloads coming soon! Currently only YouTube is supported.`,
      });
    }

    // YouTube downloads using ytdl-core
    console.log("[Download] Using ytdl-core for YouTube");

    try {
      const info = await ytdl.getInfo(url);
      console.log("[Download] Got video info:", info.videoDetails.title);

      const formats = info.formats;

      // Check if video is actually downloadable
      if (!formats || formats.length === 0) {
        return res.status(400).json({
          error: "No downloadable formats found. This video may not be available for download.",
        });
      }

      const format = ytdl.chooseFormat(formats, {
        quality: audioOnly ? "highestaudio" : "highest",
      });

      if (!format) {
        return res.status(400).json({
          error: audioOnly
            ? "No audio format available for this video."
            : "No video format available for this video.",
        });
      }

      console.log("[Download] Downloading:", format.qualityLabel || "audio");

      const stream = ytdl.downloadFromInfo(info, { format });
      const chunks: Buffer[] = [];

      const buffer = await new Promise<Buffer>((resolve, reject) => {
        stream.on("data", (chunk: Buffer) => {
          chunks.push(chunk);
        });
        stream.on("end", () => {
          resolve(Buffer.concat(chunks));
        });
        stream.on("error", (err) => {
          console.error("[Download] Stream error:", err);
          reject(err);
        });
      });

      if (buffer.byteLength === 0) {
        return res.status(400).json({
          error: "Download resulted in empty file. Please try another video.",
        });
      }

      console.log("[Download] Downloaded:", buffer.byteLength, "bytes");

      // Generate filename from video title
      const title = info.videoDetails.title
        .replace(/[^\w\s-]/g, "")
        .slice(0, 100);
      const ext = audioOnly ? "mp3" : "mp4";
      const filename = `${title}.${ext}`;

      console.log("[Download] Success! Filename:", filename);

      res.setHeader("Content-Type", audioOnly ? "audio/mpeg" : "video/mp4");
      res.setHeader("Content-Length", buffer.byteLength.toString());
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Access-Control-Allow-Origin", "*");

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
