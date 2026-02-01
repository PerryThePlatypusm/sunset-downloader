import {
  normalizeUrl,
  isValidUrl,
  detectPlatform,
} from "../../server/utils/urlUtils";

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

interface DownloadRequest {
  url: string;
  platform?: string;
  quality?: string;
  audioOnly?: boolean;
  episodes?: number[];
}

// Use Cobalt API for reliable multi-platform downloading
async function downloadViaCobalt(
  url: string,
  audioOnly: boolean,
  quality?: string,
): Promise<{ buffer: Buffer; filename: string }> {
  console.log(`[Cobalt] Starting download for: ${url}`);

  const cobaltUrl = "https://api.cobalt.tools/api/json";

  try {
    // Build request payload - keep it simple for better compatibility
    const requestPayload: any = {
      url: url,
      downloadMode: audioOnly ? "audio" : "video",
      isAudioOnly: audioOnly,
    };

    // Only add optional fields if they have values
    if (audioOnly && quality) {
      requestPayload.audioQuality = parseInt(quality) || 320;
    }

    console.log(`[Cobalt] Sending request to ${cobaltUrl}`);

    const response = await fetch(cobaltUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "SunsetDownloader/1.0",
      },
      body: JSON.stringify(requestPayload),
      signal: AbortSignal.timeout(45000), // 45 second timeout
    });

    console.log(`[Cobalt] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "No error text");
      console.error(`[Cobalt] HTTP Error: ${response.status} - ${errorText}`);
      throw new Error(
        `API returned ${response.status}. This platform might be temporarily unavailable.`,
      );
    }

    const data = (await response.json()) as any;

    // Check for API-level errors
    if (data.status === "error" || data.error) {
      const errorMsg =
        data.error?.message ||
        data.error ||
        JSON.stringify(data.error) ||
        "Unknown API error";
      console.error(`[Cobalt] API error: ${errorMsg}`);
      throw new Error(`Platform error: ${errorMsg}`);
    }

    // Check if we got a URL back
    if (!data.url) {
      console.error(`[Cobalt] No URL in response. Full response:`, data);
      throw new Error(
        "Could not get download link. The content might be unavailable or private.",
      );
    }

    console.log(`[Cobalt] Got download URL, fetching file...`);

    // Fetch the actual media file
    const fileResponse = await fetch(data.url, {
      headers: {
        "User-Agent": "SunsetDownloader/1.0",
      },
      signal: AbortSignal.timeout(45000),
    });

    console.log(`[Cobalt] File response status: ${fileResponse.status}`);

    if (!fileResponse.ok) {
      throw new Error(
        `Failed to download file: ${fileResponse.status}. Try again in a moment.`,
      );
    }

    const contentType = fileResponse.headers.get("content-type");
    console.log(`[Cobalt] Content-Type: ${contentType}`);

    const buffer = await fileResponse.arrayBuffer();

    if (buffer.byteLength === 0) {
      throw new Error("Downloaded file is empty. Please try again.");
    }

    console.log(
      `[Cobalt] File downloaded successfully: ${buffer.byteLength} bytes`,
    );

    // Generate filename - use provided filename or create one
    let filename = data.filename || `media_${Date.now()}`;

    // Ensure it has the right extension
    const extension = audioOnly ? "mp3" : "mp4";
    if (!filename.endsWith(`.${extension}`)) {
      filename = `${filename}.${extension}`;
    }

    return {
      buffer: Buffer.from(buffer),
      filename: filename,
    };
  } catch (error) {
    console.error(`[Cobalt] Exception:`, error);
    throw error;
  }
}

export async function handler(event: any) {
  console.log("[Handler] Download request received");

  try {
    // Parse request
    let body: DownloadRequest;
    try {
      body = JSON.parse(event.body || "{}") as DownloadRequest;
    } catch (e) {
      console.error("[Handler] Failed to parse request body:", e);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid request format" }),
      };
    }

    const { url, platform, quality, audioOnly } = body;

    console.log(`[Handler] URL: ${url}`);
    console.log(
      `[Handler] Platform: ${platform}, Quality: ${quality}, AudioOnly: ${audioOnly}`,
    );

    // Validate URL
    if (!url || typeof url !== "string" || !url.trim()) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "URL is required" }),
      };
    }

    // Normalize URL
    let normalizedUrl: string;
    try {
      normalizedUrl = normalizeUrl(url);
      console.log(`[Handler] Normalized URL: ${normalizedUrl}`);
    } catch (e) {
      console.error(`[Handler] URL normalization failed:`, e);
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Invalid URL format. Please check and try again.",
        }),
      };
    }

    // Validate URL
    if (!isValidUrl(normalizedUrl)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "URL is not valid. Please check and try again.",
        }),
      };
    }

    // Detect platform
    let detectedPlatform = platform;
    if (!detectedPlatform) {
      detectedPlatform = detectPlatform(normalizedUrl);
    }

    console.log(`[Handler] Detected platform: ${detectedPlatform}`);

    if (!detectedPlatform || !SUPPORTED_PLATFORMS.includes(detectedPlatform)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: `Platform not supported. Supported: ${SUPPORTED_PLATFORMS.join(", ")}`,
        }),
      };
    }

    console.log(`[Handler] Starting Cobalt download...`);

    // Download via Cobalt
    const { buffer, filename } = await downloadViaCobalt(
      normalizedUrl,
      audioOnly || false,
      quality,
    );

    // Convert to base64
    const base64 = buffer.toString("base64");

    console.log(
      `[Handler] Download successful! File: ${filename}, Size: ${buffer.length}`,
    );

    return {
      statusCode: 200,
      headers: {
        "Content-Type": audioOnly ? "audio/mpeg" : "video/mp4",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
      body: base64,
      isBase64Encoded: true,
    };
  } catch (error: any) {
    console.error("[Handler] Download failed:", error);

    let userMessage =
      error.message || "Failed to download. Please try again in a moment.";

    // Provide more specific error messages
    if (userMessage.includes("timeout")) {
      userMessage = "Download took too long. Please try again.";
    } else if (userMessage.includes("empty")) {
      userMessage = "The content appears to be empty or unavailable.";
    } else if (userMessage.includes("private")) {
      userMessage = "This content is private or requires authentication.";
    } else if (userMessage.includes("404")) {
      userMessage = "Content not found. Check the URL and try again.";
    } else if (userMessage.includes("403")) {
      userMessage = "Access denied. This content may be restricted.";
    }

    return {
      statusCode: 400,
      body: JSON.stringify({
        error: userMessage,
      }),
    };
  }
}
