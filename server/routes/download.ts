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

  console.log("[Cobalt] Input URL:", url);

  // Make sure URL has protocol
  let finalUrl = url;
  if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
    finalUrl = "https://" + finalUrl;
  }

  console.log("[Cobalt] Final URL:", finalUrl);

  const requestPayload = {
    url: finalUrl,
    downloadMode: audioOnly ? "audio" : "video",
  };

  console.log(
    "[Cobalt] Sending request with payload:",
    JSON.stringify(requestPayload),
  );

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
    console.error("[Cobalt] Full response:", responseText);
    throw new Error(`API error ${response.status}: ${responseText}`);
  }

  let data: any;
  try {
    data = JSON.parse(responseText);
  } catch (e) {
    console.error("[Cobalt] JSON parse failed:", e);
    throw new Error("Invalid API response");
  }

  console.log(
    "[Cobalt] Parsed response:",
    JSON.stringify(data).substring(0, 400),
  );

  if (data.status === "error" || data.error) {
    const errorMsg = data.error?.message || data.error || "Unknown error";
    console.error("[Cobalt] API error:", errorMsg);
    throw new Error(`API: ${errorMsg}`);
  }

  if (!data.url) {
    console.error("[Cobalt] No URL in response:", JSON.stringify(data));
    throw new Error("No download link generated");
  }

  console.log("[Cobalt] Got download URL, fetching file");

  // Fetch the media file
  const fileResponse = await fetch(data.url, {
    signal: AbortSignal.timeout(60000),
  });

  console.log("[Cobalt] File response status:", fileResponse.status);

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
    let { url, platform, quality, audioOnly } = body;

    console.log("[Download] ========== NEW REQUEST ==========");
    console.log("[Download] Raw URL from client:", url);
    console.log("[Download] Platform:", platform);
    console.log("[Download] AudioOnly:", audioOnly);

    // Validate URL
    if (!url || typeof url !== "string" || !url.trim()) {
      console.error("[Download] URL missing or invalid type");
      return res.status(400).json({ error: "URL is required" });
    }

    url = url.trim();

    if (url.length > 2048) {
      return res.status(400).json({ error: "URL is too long" });
    }

    // Normalize URL - but be careful not to break it
    let normalizedUrl: string;
    try {
      normalizedUrl = normalizeUrl(url);
      console.log("[Download] Normalized URL:", normalizedUrl);
    } catch (error) {
      console.error("[Download] Normalization error:", error);
      // If normalization fails, just use the URL as-is
      normalizedUrl = url;
    }

    if (!isValidUrl(normalizedUrl)) {
      console.error("[Download] URL validation failed");
      return res.status(400).json({ error: "Invalid URL format" });
    }

    // Detect platform
    let detectedPlatform = platform;
    if (!detectedPlatform) {
      detectedPlatform = detectPlatform(normalizedUrl);
    }

    console.log("[Download] Detected platform:", detectedPlatform);

    if (!detectedPlatform || !SUPPORTED_PLATFORMS.includes(detectedPlatform)) {
      return res.status(400).json({
        error: `Unsupported platform. Supported: ${SUPPORTED_PLATFORMS.join(", ")}`,
      });
    }

    console.log("[Download] Starting Cobalt download...");

    // Download via Cobalt
    const { buffer, filename } = await downloadViaCobalt(
      normalizedUrl,
      audioOnly || false,
    );

    console.log("[Download] Download successful, sending file");

    // Set headers
    res.setHeader("Content-Type", audioOnly ? "audio/mpeg" : "video/mp4");
    res.setHeader("Content-Length", buffer.length.toString());
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Access-Control-Allow-Origin", "*");

    // Send file
    res.send(buffer);
    console.log("[Download] File sent successfully");
  } catch (error) {
    console.error("[Download] ========== ERROR ==========");
    console.error("[Download] Full error:", error);

    let errorMsg = "Failed to download media";

    if (error instanceof Error) {
      const msg = error.message;
      console.error("[Download] Error message:", msg);

      if (msg.includes("timeout")) {
        errorMsg = "Download took too long. Please try again.";
      } else if (msg.includes("404")) {
        errorMsg = "Content not found. Please check the URL.";
      } else if (msg.includes("Empty")) {
        errorMsg = "No content found.";
      } else if (msg.includes("API error")) {
        // Extract the actual API error
        if (msg.includes("400")) {
          errorMsg =
            "The URL format is not recognized. Please try a direct link to the content.";
        } else {
          errorMsg = msg;
        }
      } else if (msg.includes("Invalid")) {
        errorMsg = msg;
      } else {
        errorMsg = msg;
      }
    }

    console.error("[Download] Sending error response:", errorMsg);
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
