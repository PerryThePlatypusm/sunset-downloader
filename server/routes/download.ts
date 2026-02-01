import { RequestHandler } from "express";
import { detectPlatform, isValidUrl, normalizeUrl } from "../utils/urlUtils";

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
    console.log("[Download] URL:", url);

    if (!url || typeof url !== "string" || !url.trim()) {
      return res.status(400).json({ error: "URL is required" });
    }

    url = url.trim();

    if (url.length > 2048) {
      return res.status(400).json({ error: "URL is too long" });
    }

    let normalizedUrl: string;
    try {
      normalizedUrl = normalizeUrl(url);
    } catch (error) {
      normalizedUrl = url;
    }

    if (!isValidUrl(normalizedUrl)) {
      return res.status(400).json({ error: "Invalid URL format" });
    }

    let detectedPlatform = platform;
    if (!detectedPlatform) {
      detectedPlatform = detectPlatform(normalizedUrl);
    }

    console.log("[Download] Platform:", detectedPlatform);

    if (!detectedPlatform || !SUPPORTED_PLATFORMS.includes(detectedPlatform)) {
      return res.status(400).json({
        error: "Unsupported platform",
      });
    }

    // For local development, use Cobalt API
    const cobaltUrl = "https://api.cobalt.tools/api/json";

    const requestPayload = {
      url: normalizedUrl,
      downloadMode: audioOnly ? "audio" : "video",
    };

    console.log("[Download] Calling Cobalt API");

    const response = await fetch(cobaltUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
      signal: AbortSignal.timeout(60000),
    });

    console.log("[Download] Cobalt response:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Download] Cobalt error:", errorText);
      return res.status(400).json({ error: "Failed to process URL" });
    }

    const data = (await response.json()) as any;

    if (data.status === "error" || !data.url) {
      console.error("[Download] API error:", data);
      return res
        .status(400)
        .json({ error: "Could not generate download link" });
    }

    // Fetch the media file
    const fileResponse = await fetch(data.url, {
      signal: AbortSignal.timeout(60000),
    });

    if (!fileResponse.ok) {
      return res.status(400).json({ error: "Failed to download media" });
    }

    const buffer = await fileResponse.arrayBuffer();

    if (buffer.byteLength === 0) {
      return res.status(400).json({ error: "No content found" });
    }

    let filename = data.filename || `download_${Date.now()}`;
    const ext = audioOnly ? "mp3" : "mp4";
    if (!filename.includes(`.${ext}`)) {
      filename = `${filename}.${ext}`;
    }

    console.log("[Download] Success! File:", filename);

    res.setHeader("Content-Type", audioOnly ? "audio/mpeg" : "video/mp4");
    res.setHeader("Content-Length", buffer.byteLength.toString());
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Access-Control-Allow-Origin", "*");

    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error("[Download] Error:", error);
    return res.status(400).json({ error: "Download failed" });
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
        error: "Platform not supported",
      });
    }

    res.json({
      valid: true,
      platform,
      url: normalizedUrl,
    });
  } catch (error) {
    console.error("[Validation] Error:", error);
    res.status(500).json({
      valid: false,
      error: "Validation failed",
    });
  }
};
