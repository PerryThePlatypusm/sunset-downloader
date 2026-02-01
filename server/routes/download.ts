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

    // Send RAW URL directly to Cobalt - don't normalize it
    const cobaltUrl = "https://api.cobalt.tools/api/json";

    const requestPayload = {
      url: url, // Use raw URL
      downloadMode: audioOnly ? "audio" : "video",
    };

    console.log("[Download] Sending to Cobalt");
    console.log("[Download] URL being sent:", requestPayload.url);

    const response = await fetch(cobaltUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
      signal: AbortSignal.timeout(60000),
    });

    console.log("[Download] Cobalt response status:", response.status);

    const responseText = await response.text();
    console.log(
      "[Download] Cobalt response (first 300 chars):",
      responseText.substring(0, 300)
    );

    if (!response.ok) {
      console.error("[Download] Cobalt HTTP error:", response.status);
      console.error("[Download] Cobalt error response:", responseText);
      
      // Try to parse error from response
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.error?.message) {
          return res.status(400).json({ error: errorData.error.message });
        }
      } catch (e) {
        // Ignore parse errors
      }
      
      return res.status(400).json({
        error: "URL not recognized by download service",
      });
    }

    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("[Download] JSON parse error:", e);
      return res.status(400).json({ error: "Invalid response from service" });
    }

    console.log(
      "[Download] Parsed response:",
      JSON.stringify(data).substring(0, 300)
    );

    // Check for API errors
    if (data.status === "error") {
      const errorMsg = data.error?.message || "Download failed";
      console.error("[Download] API error:", errorMsg);
      return res.status(400).json({ error: errorMsg });
    }

    if (data.error) {
      console.error("[Download] Error in response:", data.error);
      return res
        .status(400)
        .json({ error: data.error.message || "Download failed" });
    }

    // Get download URL
    if (!data.url) {
      console.error("[Download] No URL in response. Full response:", data);
      return res.status(400).json({
        error: "Could not process this content",
      });
    }

    console.log("[Download] Got media URL from Cobalt");

    // Fetch the actual media file
    const fileResponse = await fetch(data.url, {
      signal: AbortSignal.timeout(60000),
    });

    console.log("[Download] Media file response:", fileResponse.status);

    if (!fileResponse.ok) {
      return res.status(400).json({ error: "Failed to download media file" });
    }

    const buffer = await fileResponse.arrayBuffer();

    if (buffer.byteLength === 0) {
      return res.status(400).json({ error: "No content to download" });
    }

    console.log("[Download] Downloaded:", buffer.byteLength, "bytes");

    // Generate filename
    let filename = data.filename || `download_${Date.now()}`;
    const ext = audioOnly ? "mp3" : "mp4";
    if (!filename.includes(`.${ext}`)) {
      filename = `${filename}.${ext}`;
    }

    console.log("[Download] Success! Filename:", filename);

    res.setHeader("Content-Type", audioOnly ? "audio/mpeg" : "video/mp4");
    res.setHeader("Content-Length", buffer.byteLength.toString());
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Access-Control-Allow-Origin", "*");

    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error("[Download] Exception:", error);
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
