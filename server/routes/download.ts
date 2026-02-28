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

    if (!detectedPlatform || !SUPPORTED_PLATFORMS.includes(detectedPlatform)) {
      // Helpful error message
      let errorMsg = "Could not detect the video platform. ";

      // Check if it looks like a URL at all
      if (!url.includes("://") && !url.includes(".")) {
        errorMsg += "Please enter a full URL (starting with https://)";
      } else if (url.includes("youtube") || url.includes("youtu.be")) {
        errorMsg += "This looks like a YouTube URL but couldn't be parsed. Please try the direct video page URL.";
      } else {
        errorMsg += "Currently, only YouTube is supported. Please paste a YouTube URL (youtube.com or youtu.be).";
      }

      return res.status(400).json({ error: errorMsg });
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

      // For audio: prefer MP4 container with audio codec for compatibility
      // For video: prefer MP4 with both video and audio
      let format;
      if (audioOnly) {
        // Choose audio with mp4 container for maximum compatibility (Windows Media Player, iOS, Android)
        format = ytdl.chooseFormat(formats, {
          quality: "highestaudio",
          filter: (f) => {
            return (
              f.hasAudio &&
              !f.hasVideo &&
              (f.container === "mp4" || f.mimeType?.includes("audio"))
            );
          },
        });

        // Fallback to any audio if mp4 not available
        if (!format) {
          format = ytdl.chooseFormat(formats, { quality: "highestaudio" });
        }
      } else {
        // Choose video with audio in mp4 container for maximum compatibility
        format = ytdl.chooseFormat(formats, {
          quality: "highest",
          filter: (f) => {
            return f.container === "mp4" && f.hasVideo && f.hasAudio;
          },
        });

        // Fallback to highest quality if mp4 not available
        if (!format) {
          format = ytdl.chooseFormat(formats, { quality: "highest" });
        }
      }

      if (!format) {
        return res.status(400).json({
          error: audioOnly
            ? "No audio format available for this video."
            : "No video format available for this video.",
        });
      }

      console.log("[Download] Format:", {
        qualityLabel: format.qualityLabel || "audio",
        container: format.container,
        hasAudio: format.hasAudio,
        hasVideo: format.hasVideo,
        mimeType: format.mimeType,
      });

      const stream = ytdl.downloadFromInfo(info, { format });
      const chunks: Buffer[] = [];

      const buffer = await new Promise<Buffer>((resolve, reject) => {
        let dataReceived = false;
        stream.on("data", (chunk: Buffer) => {
          dataReceived = true;
          if (chunk.length > 0) {
            chunks.push(chunk);
          }
        });
        stream.on("end", () => {
          if (!dataReceived) {
            reject(new Error("No data received from stream"));
          } else {
            resolve(Buffer.concat(chunks));
          }
        });
        stream.on("error", (err) => {
          console.error("[Download] Stream error:", err);
          reject(err);
        });
      });

      // Validate file size - should be at least a few KB
      const minFileSize = 10000; // 10KB minimum
      if (buffer.byteLength < minFileSize) {
        console.warn(`[Download] File too small: ${buffer.byteLength} bytes`);
        return res.status(400).json({
          error: "Downloaded file is too small or corrupt. Please try another video.",
        });
      }

      console.log("[Download] Downloaded:", buffer.byteLength, "bytes");

      // Validate file header for MP3 or MP4
      const fileHeader = buffer.slice(0, 4).toString("hex");
      if (audioOnly) {
        // MP3 files start with FFE or ID3
        if (!fileHeader.startsWith("ffe") && !fileHeader.startsWith("4944")) {
          console.warn(`[Download] Invalid MP3 header: ${fileHeader}`);
          return res.status(400).json({
            error: "Downloaded audio file appears to be corrupt. Please try again.",
          });
        }
      } else {
        // MP4 files have ftyp at offset 4 (00 00 00 20 66 74 79 70)
        const mp4Header = buffer.slice(4, 8).toString("ascii");
        if (mp4Header !== "ftyp") {
          console.warn(`[Download] Invalid MP4 header: ${fileHeader}, ${mp4Header}`);
          return res.status(400).json({
            error: "Downloaded video file appears to be corrupt. Please try again.",
          });
        }
      }

      // Generate filename from video title
      const title = info.videoDetails.title
        .replace(/[^\w\s-]/g, "")
        .slice(0, 100)
        .trim();
      const ext = audioOnly ? "mp3" : "mp4";
      const filename = `${title || "download"}.${ext}`;

      console.log("[Download] Success! Filename:", filename);

      res.setHeader("Content-Type", audioOnly ? "audio/mpeg" : "video/mp4");
      res.setHeader("Content-Length", buffer.byteLength.toString());
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
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
