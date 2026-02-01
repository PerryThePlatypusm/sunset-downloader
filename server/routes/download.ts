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

    // YouTube downloads using ytdl-core
    console.log("[Download] Using ytdl-core for YouTube");

    const info = await ytdl.getInfo(url);
    console.log("[Download] Got video info:", info.videoDetails.title);

    const format = ytdl.chooseFormat(info.formats, {
      quality: audioOnly ? "highestaudio" : "highest",
    });

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
      stream.on("error", reject);
    });

    if (buffer.byteLength === 0) {
      return res.status(400).json({ error: "No content to download" });
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
  } catch (error) {
    console.error("[Download] Exception:", error);
    return res.status(400).json({ error: "Download failed. Please try again." });
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
