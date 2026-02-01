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
  console.log(`[Cobalt] Requesting: ${url} (audioOnly: ${audioOnly})`);

  const cobaltUrl = "https://api.cobalt.tools/api/json";

  try {
    const requestPayload = {
      url: url,
      downloadMode: audioOnly ? "audio" : "video",
      audioFormat: audioOnly ? "mp3" : "mp4",
      audioQuality: audioOnly ? parseInt(quality || "320") : undefined,
      videoQuality: !audioOnly ? parseInt(quality || "720") : undefined,
      isAudioOnly: audioOnly,
    };

    console.log("[Cobalt] Payload:", JSON.stringify(requestPayload));

    const response = await fetch(cobaltUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      body: JSON.stringify(requestPayload),
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    console.log("[Cobalt] Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Cobalt] Error response:", errorText);
      throw new Error(`Cobalt API error: ${response.status} - ${errorText}`);
    }

    const data = (await response.json()) as any;
    console.log(
      "[Cobalt] Response data:",
      JSON.stringify(data).substring(0, 200),
    );

    if (data.status === "error") {
      const errorMsg =
        data.error?.message || JSON.stringify(data.error) || "Unknown error";
      console.error("[Cobalt] API error:", errorMsg);
      throw new Error(`Cobalt error: ${errorMsg}`);
    }

    if (!data.url) {
      console.error("[Cobalt] No URL in response:", JSON.stringify(data));
      throw new Error("No download URL returned from Cobalt API");
    }

    console.log("[Cobalt] Download URL received, fetching file...");

    // Download the file from the URL provided by Cobalt
    const fileResponse = await fetch(data.url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      signal: AbortSignal.timeout(30000),
    });

    console.log("[Cobalt] File response status:", fileResponse.status);

    if (!fileResponse.ok) {
      throw new Error(`Failed to download file: ${fileResponse.status}`);
    }

    const buffer = await fileResponse.arrayBuffer();
    console.log("[Cobalt] File downloaded, size:", buffer.byteLength);

    if (buffer.byteLength === 0) {
      throw new Error("Downloaded file is empty");
    }

    const filename =
      data.filename || `media_${Date.now()}.${audioOnly ? "mp3" : "mp4"}`;

    return {
      buffer: Buffer.from(buffer),
      filename: filename,
    };
  } catch (error) {
    console.error("[Cobalt] Error details:", error);
    throw error;
  }
}

export async function handler(event: any) {
  console.log("[Handler] Request received");

  try {
    const body = JSON.parse(event.body || "{}") as DownloadRequest;
    const { url, platform, quality, audioOnly } = body;

    console.log("[Handler] Parsed request:", {
      url,
      platform,
      quality,
      audioOnly,
    });

    // Validate URL
    if (!url || typeof url !== "string" || !url.trim()) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "URL is required" }),
      };
    }

    // Normalize and validate URL
    let normalizedUrl: string;
    try {
      normalizedUrl = normalizeUrl(url);
      console.log("[Handler] Normalized URL:", normalizedUrl);
    } catch (e) {
      console.error("[Handler] URL normalization error:", e);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid URL format" }),
      };
    }

    if (!isValidUrl(normalizedUrl)) {
      console.error("[Handler] URL validation failed");
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid URL format" }),
      };
    }

    // Detect platform
    let detectedPlatform = platform;
    if (!detectedPlatform) {
      detectedPlatform = detectPlatform(normalizedUrl);
      console.log("[Handler] Detected platform:", detectedPlatform);
    }

    if (!detectedPlatform || !SUPPORTED_PLATFORMS.includes(detectedPlatform)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: `Unsupported platform. Supported: ${SUPPORTED_PLATFORMS.join(", ")}`,
        }),
      };
    }

    console.log("[Handler] Starting download via Cobalt...");

    // Use Cobalt API for all platforms
    const { buffer, filename } = await downloadViaCobalt(
      normalizedUrl,
      audioOnly || false,
      quality,
    );

    const base64 = buffer.toString("base64");

    console.log("[Handler] Download successful, returning file");

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
    console.error("[Handler] Error:", error);

    let errorMessage = "Failed to download media";
    const errorStr = (error.message || "").toLowerCase();

    if (errorStr.includes("private") || errorStr.includes("authentication")) {
      errorMessage =
        "This content requires authentication or is not publicly available.";
    } else if (
      errorStr.includes("unavailable") ||
      errorStr.includes("removed")
    ) {
      errorMessage =
        "This content is unavailable or has been removed. Please check the link.";
    } else if (errorStr.includes("404")) {
      errorMessage = "The content could not be found. Please check the URL.";
    } else if (errorStr.includes("age")) {
      errorMessage = "This content is age-restricted. Please verify access.";
    } else if (errorStr.includes("timeout")) {
      errorMessage = "Download timed out. Please try again.";
    } else if (errorStr.includes("empty")) {
      errorMessage = "No content found to download.";
    }

    return {
      statusCode: 400,
      body: JSON.stringify({
        error: errorMessage,
        details: error.message,
      }),
    };
  }
}
