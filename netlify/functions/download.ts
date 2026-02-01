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
    // Build request payload with correct Cobalt API format
    const requestPayload = {
      url: url,
      downloadMode: audioOnly ? "audio" : "video",
      videoQuality: audioOnly
        ? undefined
        : parseInt(quality || "720") || "best",
      audioQuality: audioOnly
        ? parseInt(quality || "320") || "best"
        : undefined,
      audioFormat: audioOnly ? "mp3" : undefined,
      videoCodec: audioOnly ? undefined : "h264",
      videoRange: audioOnly ? undefined : "vp9",
      isAudioOnly: audioOnly,
      isTtsFetch: false,
      disableMetadata: false,
    };

    // Remove undefined values
    Object.keys(requestPayload).forEach(
      (key) =>
        requestPayload[key as keyof typeof requestPayload] === undefined &&
        delete requestPayload[key as keyof typeof requestPayload],
    );

    console.log(
      `[Cobalt] Sending request:`,
      JSON.stringify(requestPayload).substring(0, 200),
    );

    const response = await fetch(cobaltUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "SunsetDownloader/1.0",
      },
      body: JSON.stringify(requestPayload),
      signal: AbortSignal.timeout(60000), // 60 second timeout
    });

    console.log(`[Cobalt] Response status: ${response.status}`);

    const responseText = await response.text();
    console.log(`[Cobalt] Response text:`, responseText.substring(0, 500));

    if (!response.ok) {
      console.error(`[Cobalt] HTTP Error: ${response.status}`);
      console.error(`[Cobalt] Response body:`, responseText);
      throw new Error(
        `API error ${response.status}. The platform may be temporarily unavailable or the URL might be invalid.`,
      );
    }

    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error(`[Cobalt] Failed to parse JSON response:`, e);
      throw new Error("Invalid response from download service");
    }

    console.log(
      `[Cobalt] Parsed response:`,
      JSON.stringify(data).substring(0, 300),
    );

    // Check for API-level errors
    if (data.status === "error") {
      const errorMsg =
        data.error?.message || JSON.stringify(data.error) || "Unknown error";
      console.error(`[Cobalt] API returned error: ${errorMsg}`);
      throw new Error(`Download service error: ${errorMsg}`);
    }

    // Check if we got a URL back
    if (!data.url) {
      console.error(
        `[Cobalt] No URL in response. Full data:`,
        JSON.stringify(data),
      );
      throw new Error(
        "Could not generate download link. The content might be unavailable, private, or restricted.",
      );
    }

    console.log(`[Cobalt] Got download URL, fetching media file...`);

    // Fetch the actual media file with retry logic
    let fileResponse = await fetch(data.url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      signal: AbortSignal.timeout(60000),
    });

    console.log(`[Cobalt] File fetch status: ${fileResponse.status}`);

    if (!fileResponse.ok) {
      console.error(`[Cobalt] File fetch failed: ${fileResponse.status}`);
      throw new Error(
        `Failed to fetch media (${fileResponse.status}). Please try again.`,
      );
    }

    const buffer = await fileResponse.arrayBuffer();

    if (buffer.byteLength === 0) {
      throw new Error("Downloaded media is empty. Please try again.");
    }

    console.log(
      `[Cobalt] File downloaded successfully: ${buffer.byteLength} bytes`,
    );

    // Generate filename
    let filename = data.filename || `download_${Date.now()}`;

    // Ensure proper extension
    const extension = audioOnly ? "mp3" : "mp4";
    if (!filename.toLowerCase().endsWith(`.${extension}`)) {
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

    let userMessage = error.message || "Failed to download. Please try again.";

    // Improve error messages
    if (userMessage.includes("400")) {
      userMessage =
        "The URL format is not supported. Please try a different URL.";
    } else if (userMessage.includes("timeout")) {
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
