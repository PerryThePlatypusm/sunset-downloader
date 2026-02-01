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

// Download via Cobalt API
async function downloadViaCobalt(
  url: string,
  audioOnly: boolean,
): Promise<{ buffer: Buffer; filename: string }> {
  const cobaltUrl = "https://api.cobalt.tools/api/json";

  const requestPayload = {
    url: url,
    downloadMode: audioOnly ? "audio" : "video",
  };

  console.log("[Cobalt] Requesting:", url);

  const response = await fetch(cobaltUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestPayload),
    signal: AbortSignal.timeout(60000),
  });

  console.log("[Cobalt] Response status:", response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Cobalt] Error response:", errorText);
    throw new Error(`API error ${response.status}`);
  }

  const data = (await response.json()) as any;

  if (data.status === "error" || data.error) {
    throw new Error(data.error?.message || "Download failed");
  }

  if (!data.url) {
    throw new Error("No download URL returned");
  }

  console.log("[Cobalt] Got download URL, fetching file");

  // Fetch the media file
  const fileResponse = await fetch(data.url, {
    signal: AbortSignal.timeout(60000),
  });

  if (!fileResponse.ok) {
    throw new Error(`File fetch failed: ${fileResponse.status}`);
  }

  const buffer = await fileResponse.arrayBuffer();

  if (buffer.byteLength === 0) {
    throw new Error("Empty file");
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
}

export const handleDownload: RequestHandler = async (req, res) => {
  try {
    const body = req.body as DownloadRequest;
    const { url, platform, quality, audioOnly } = body;

    console.log("[Download] Request received");
    console.log("[Download] URL:", url);

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

    console.log("[Download] Platform:", detectedPlatform);

    if (!detectedPlatform || !SUPPORTED_PLATFORMS.includes(detectedPlatform)) {
      return res.status(400).json({
        error: `Unsupported platform. Supported: ${SUPPORTED_PLATFORMS.join(", ")}`,
      });
    }

    console.log("[Download] Starting Cobalt download");

    // Download via Cobalt
    const { buffer, filename } = await downloadViaCobalt(
      normalizedUrl,
      audioOnly || false
    );

    console.log("[Download] Download successful");

    // Set headers
    res.setHeader(
      "Content-Type",
      audioOnly ? "audio/mpeg" : "video/mp4"
    );
    res.setHeader("Content-Length", buffer.length.toString());
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Access-Control-Allow-Origin", "*");

    // Send file
    res.send(buffer);
  } catch (error) {
    console.error("[Download] Error:", error);

    let errorMsg = "Failed to download media";

    if (error instanceof Error) {
      if (error.message.includes("timeout")) {
        errorMsg = "Download timed out. Please try again.";
      } else if (error.message.includes("404")) {
        errorMsg = "Content not found.";
      } else if (error.message.includes("Empty")) {
        errorMsg = "No content found.";
      } else if (error.message.includes("400")) {
        errorMsg = "URL not recognized.";
      } else {
        errorMsg = error.message;
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
        error: "Platform not supported or invalid URL for that platform",
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
