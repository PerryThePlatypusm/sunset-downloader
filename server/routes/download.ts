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

export const handleDownload: RequestHandler = async (req, res) => {
  try {
    const { url, platform, quality, audioOnly, episodes } =
      req.body as DownloadRequest;

    // Validate URL presence
    if (!url || typeof url !== "string" || !url.trim()) {
      return res.status(400).json({ error: "URL is required" });
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
    const selectedQuality =
      quality || DEFAULT_QUALITY[audioOnly ? "audio" : "video"];

    // Special validation for Spotify
    if (detectedPlatform === "spotify" && !audioOnly) {
      return res.status(400).json({
        error: "Spotify requires audio-only download",
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

    // Simulate download processing
    const downloadType = audioOnly ? "mp3" : "mp4";
    const episodeInfo =
      episodes && episodes.length > 0
        ? `_eps_${episodes.slice(0, 5).join("-")}`
        : "";
    const fileName = `media_${Date.now()}${episodeInfo}.${downloadType}`;

    // Create mock binary content for file download
    const mockContent = Buffer.from(
      audioOnly
        ? "ID3\x04\x00\x00\x00\x00\x00\x00"
        : "\x00\x00\x00\x20ftypisom"
    );

    res.setHeader("Content-Type", audioOnly ? "audio/mpeg" : "video/mp4");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Length", mockContent.length);

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
