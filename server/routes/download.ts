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

// Try importing ytdl-core - it may or may not be available
let ytdl: any;
try {
  ytdl = require("ytdl-core");
  console.log("[Init] ytdl-core loaded successfully");
} catch (e) {
  console.log("[Init] ytdl-core not available, will use Cobalt only");
}

// Download via Cobalt API
async function downloadViaCobalt(
  url: string,
  audioOnly: boolean,
): Promise<{ buffer: Buffer; filename: string }> {
  const cobaltUrl = "https://api.cobalt.tools/api/json";

  console.log("[Cobalt] Input URL:", url);

  const requestPayload = {
    url: url,
    downloadMode: audioOnly ? "audio" : "video",
  };

  console.log("[Cobalt] Request payload:", JSON.stringify(requestPayload));

  try {
    const response = await fetch(cobaltUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
      signal: AbortSignal.timeout(60000),
    });

    console.log("[Cobalt] Response status:", response.status);

    const responseText = await response.text();
    console.log(
      "[Cobalt] Response text (first 500 chars):",
      responseText.substring(0, 500),
    );

    if (!response.ok) {
      console.error("[Cobalt] HTTP Error:", response.status);
      throw new Error(`HTTP ${response.status}`);
    }

    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("[Cobalt] JSON parse failed:", e);
      throw new Error("Invalid response");
    }

    console.log(
      "[Cobalt] Parsed response:",
      JSON.stringify(data).substring(0, 400),
    );

    if (data.status === "error" || data.error) {
      const errorMsg = data.error?.message || data.error || "Unknown error";
      console.error("[Cobalt] API error:", errorMsg);
      throw new Error(errorMsg);
    }

    if (!data.url) {
      console.error("[Cobalt] No URL in response:", JSON.stringify(data));
      throw new Error("No URL");
    }

    console.log("[Cobalt] Got download URL");

    const fileResponse = await fetch(data.url, {
      signal: AbortSignal.timeout(60000),
    });

    console.log("[Cobalt] File response:", fileResponse.status);

    if (!fileResponse.ok) {
      throw new Error(`File ${fileResponse.status}`);
    }

    const buffer = await fileResponse.arrayBuffer();

    if (buffer.byteLength === 0) {
      throw new Error("Empty");
    }

    console.log("[Cobalt] Downloaded:", buffer.byteLength, "bytes");

    let filename = data.filename || `download_${Date.now()}`;
    const ext = audioOnly ? "mp3" : "mp4";
    if (!filename.includes(`.${ext}`)) {
      filename = `${filename}.${ext}`;
    }

    return {
      buffer: Buffer.from(buffer),
      filename,
    };
  } catch (error) {
    console.error("[Cobalt] Error:", error);
    throw error;
  }
}

// Download YouTube via ytdl-core
async function downloadViaYtdl(
  url: string,
  audioOnly: boolean,
): Promise<{ buffer: Buffer; filename: string }> {
  if (!ytdl) {
    throw new Error("YouTube downloader not available");
  }

  console.log("[YtDL] Downloading:", url);

  try {
    const info = await ytdl.getInfo(url);
    const title = (info.videoDetails.title || "video")
      .replace(/[<>:"/\\|?*]/g, "")
      .substring(0, 100);

    let format;
    if (audioOnly) {
      format = ytdl.chooseFormat(info.formats, {
        quality: "highestaudio",
      });
    } else {
      format = ytdl.chooseFormat(info.formats, {
        quality: "best",
      });
    }

    if (!format) {
      throw new Error("No format found");
    }

    console.log("[YtDL] Format selected:", format.qualityLabel || "audio");

    const stream = ytdl(url, { format });
    const chunks: Buffer[] = [];

    for await (const chunk of stream) {
      chunks.push(chunk as Buffer);
    }

    const buffer = Buffer.concat(chunks);
    console.log("[YtDL] Downloaded:", buffer.byteLength, "bytes");

    const filename = `${title}.${audioOnly ? "mp3" : "mp4"}`;

    return {
      buffer,
      filename,
    };
  } catch (error) {
    console.error("[YtDL] Error:", error);
    throw error;
  }
}

export const handleDownload: RequestHandler = async (req, res) => {
  try {
    const body = req.body as DownloadRequest;
    let { url, platform, quality, audioOnly } = body;

    console.log("[Download] ===== REQUEST =====");
    console.log("[Download] URL:", url);
    console.log("[Download] Platform:", platform);
    console.log("[Download] AudioOnly:", audioOnly);

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
      console.log("[Download] Normalized URL:", normalizedUrl);
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

    console.log("[Download] Detected platform:", detectedPlatform);

    if (!detectedPlatform || !SUPPORTED_PLATFORMS.includes(detectedPlatform)) {
      return res.status(400).json({
        error: `Unsupported platform`,
      });
    }

    console.log("[Download] Starting download...");

    let buffer: Buffer;
    let filename: string;

    // Use ytdl-core for YouTube if available
    if (detectedPlatform === "youtube" && ytdl) {
      console.log("[Download] Using ytdl-core for YouTube");
      const result = await downloadViaYtdl(normalizedUrl, audioOnly || false);
      buffer = result.buffer;
      filename = result.filename;
    } else {
      console.log("[Download] Using Cobalt API");
      const result = await downloadViaCobalt(
        normalizedUrl,
        audioOnly || false,
      );
      buffer = result.buffer;
      filename = result.filename;
    }

    console.log("[Download] Success! Sending file:", filename);

    res.setHeader("Content-Type", audioOnly ? "audio/mpeg" : "video/mp4");
    res.setHeader("Content-Length", buffer.length.toString());
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Access-Control-Allow-Origin", "*");

    res.send(buffer);
  } catch (error) {
    console.error("[Download] ERROR:", error);

    let errorMsg = "Failed to download";

    if (error instanceof Error) {
      const msg = error.message;
      if (msg.includes("timeout")) {
        errorMsg = "Download took too long";
      } else if (msg.includes("private")) {
        errorMsg = "Content is private";
      } else if (msg.includes("unavailable")) {
        errorMsg = "Content unavailable";
      } else if (msg.includes("not found") || msg.includes("404")) {
        errorMsg = "Content not found";
      } else if (msg.includes("No")) {
        errorMsg = "Could not process URL";
      } else {
        errorMsg = msg;
      }
    }

    return res.status(400).json({ error: errorMsg });
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
