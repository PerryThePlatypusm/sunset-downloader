import { RequestHandler } from "express";
import { detectPlatform, isValidUrl, normalizeUrl } from "../utils/urlUtils";

interface DownloadRequest {
  url: string;
  platform?: string;
  quality?: string;
  audioOnly?: boolean;
  episodes?: number[];
}

interface DownloadResponse {
  error?: string;
  success?: boolean;
  file?: string;
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

const DEFAULT_QUALITY: Record<string, string> = {
  video: "1080",
  audio: "320",
};

const QUALITY_FORMATS: Record<string, string> = {
  "128": "mp3",
  "192": "mp3",
  "256": "mp3",
  "320": "mp3",
  lossless: "flac",
  aac: "m4a",
  opus: "opus",
  opus192: "opus",
};

const MIME_TYPES: Record<string, string> = {
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  flac: "audio/flac",
  opus: "audio/opus",
  mp4: "video/mp4",
};

export const handleDownload: RequestHandler = async (req, res) => {
  try {
    const body = req.body as DownloadRequest;
    const { url, platform, quality, audioOnly, episodes } = body;

    // Validate URL presence
    if (!url || typeof url !== "string" || !url.trim()) {
      return res.status(400).json({ error: "URL is required" });
    }

    if (url.length > 2048) {
      return res.status(400).json({ error: "URL is too long" });
    }

    // Normalize and validate URL format
    let normalizedUrl: string;
    try {
      normalizedUrl = normalizeUrl(url);
    } catch (error) {
      return res.status(400).json({ error: "Invalid URL format" });
    }

    if (!isValidUrl(normalizedUrl)) {
      return res.status(400).json({ error: "Invalid URL format" });
    }

    // Detect platform if not provided
    let detectedPlatform = platform;
    if (!detectedPlatform) {
      detectedPlatform = detectPlatform(normalizedUrl);
    }

    // Validate platform
    if (!detectedPlatform || !SUPPORTED_PLATFORMS.includes(detectedPlatform)) {
      return res.status(400).json({
        error: `Unsupported platform. Supported: ${SUPPORTED_PLATFORMS.join(", ")}`,
      });
    }

    // Validate quality
    const qualityType = audioOnly ? "audio" : "video";
    const selectedQuality = quality || DEFAULT_QUALITY[qualityType];

    // Validate quality format
    if (!selectedQuality) {
      return res.status(400).json({
        error: `Invalid quality specified for ${qualityType}`,
      });
    }

    // Special validation for Spotify
    if (detectedPlatform === "spotify" && !audioOnly) {
      return res.status(400).json({
        error: "Spotify only supports audio downloads (not video)",
      });
    }

    // Validate episodes for anime platforms
    const isAnimePlatform =
      detectedPlatform === "crunchyroll" || detectedPlatform === "hianime";

    if (isAnimePlatform) {
      if (!episodes || episodes.length === 0) {
        return res.status(400).json({
          error: "Please select at least one episode to download",
        });
      }

      // Validate episode numbers
      const validEpisodes = episodes.filter(
        (ep) => Number.isInteger(ep) && ep > 0 && ep <= 1000,
      );

      if (validEpisodes.length === 0) {
        return res.status(400).json({
          error: "Invalid episode numbers provided",
        });
      }
    }

    // Generate downloadable mock content
    const downloadType = audioOnly ? "mp3" : "mp4";
    const episodeInfo =
      episodes && episodes.length > 0
        ? `_eps_${episodes.slice(0, 5).join("-")}`
        : "";
    const fileName = `media_${Date.now()}${episodeInfo}.${downloadType}`;

    // Create proper mock file content (larger so it's noticeable)
    let mockContent: Buffer;

    if (audioOnly) {
      // MP3 header + some mock data (about 10KB)
      const mp3Header = Buffer.from([
        0xff, 0xfb, 0x10, 0x00, 0x00, 0x00, 0x00, 0x00,
      ]);
      const mockData = Buffer.alloc(10240, 0x00);
      mockContent = Buffer.concat([mp3Header, mockData]);
    } else {
      // MP4 header + mock data (about 50KB)
      const mp4Header = Buffer.from([
        0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d,
        0x00, 0x00, 0x00, 0x00,
      ]);
      const mockData = Buffer.alloc(51200, 0x00);
      mockContent = Buffer.concat([mp4Header, mockData]);
    }

    res.setHeader("Content-Type", audioOnly ? "audio/mpeg" : "video/mp4");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Length", mockContent.length.toString());
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    return res.send(mockContent);
  } catch (error) {
    console.error("Download error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
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
