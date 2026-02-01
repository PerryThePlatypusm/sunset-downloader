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
): Promise<{ buffer: Buffer; filename: string }> {
  console.log(`[Cobalt] Starting download for: ${url}`);
  console.log(`[Cobalt] Audio only: ${audioOnly}`);

  const cobaltUrl = "https://api.cobalt.tools/api/json";

  try {
    // Minimal Cobalt API request - only essential fields
    const requestPayload = {
      url: url,
      downloadMode: audioOnly ? "audio" : "video",
    };

    console.log(`[Cobalt] Request payload:`, JSON.stringify(requestPayload));

    const response = await fetch(cobaltUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
      signal: AbortSignal.timeout(60000),
    });

    console.log(`[Cobalt] Response status: ${response.status}`);

    const responseText = await response.text();
    console.log(`[Cobalt] Response (first 500 chars):`, responseText.substring(0, 500));

    if (!response.ok) {
      console.error(`[Cobalt] HTTP ${response.status} Error`);
      console.error(`[Cobalt] Full response:`, responseText);
      throw new Error(`HTTP ${response.status}`);
    }

    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error(`[Cobalt] JSON parse error:`, e);
      console.error(`[Cobalt] Response was:`, responseText);
      throw new Error("Invalid API response");
    }

    console.log(`[Cobalt] Parsed data:`, JSON.stringify(data).substring(0, 300));

    // Check for errors
    if (data.status === "error" || data.error) {
      const msg = data.error?.message || data.error || "API error";
      console.error(`[Cobalt] API error:`, msg);
      throw new Error(msg);
    }

    // Get download URL
    if (!data.url) {
      console.error(`[Cobalt] Missing URL in response. Data:`, JSON.stringify(data));
      throw new Error("No download URL returned");
    }

    console.log(`[Cobalt] Got download URL, fetching file...`);

    // Fetch the media file
    const fileResponse = await fetch(data.url, {
      signal: AbortSignal.timeout(60000),
    });

    console.log(`[Cobalt] File response status: ${fileResponse.status}`);

    if (!fileResponse.ok) {
      throw new Error(`File fetch failed: ${fileResponse.status}`);
    }

    const buffer = await fileResponse.arrayBuffer();
    console.log(`[Cobalt] Downloaded: ${buffer.byteLength} bytes`);

    if (buffer.byteLength === 0) {
      throw new Error("Empty file");
    }

    // Get filename
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
    console.error(`[Cobalt] Error:`, error);
    throw error;
  }
}

export async function handler(event: any) {
  console.log("[Handler] Request received");

  try {
    let body: DownloadRequest;
    try {
      body = JSON.parse(event.body || "{}") as DownloadRequest;
    } catch (e) {
      console.error("[Handler] Parse error:", e);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid request" }),
      };
    }

    const { url, platform, quality, audioOnly } = body;
    console.log("[Handler] URL:", url);
    console.log("[Handler] Platform:", platform);
    console.log("[Handler] AudioOnly:", audioOnly);

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
    } catch (e) {
      console.error("[Handler] Normalization error:", e);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid URL" }),
      };
    }

    // Validate URL
    if (!isValidUrl(normalizedUrl)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "URL is not valid" }),
      };
    }

    // Detect platform
    let detectedPlatform = platform || detectPlatform(normalizedUrl);
    console.log("[Handler] Detected platform:", detectedPlatform);

    if (!detectedPlatform || !SUPPORTED_PLATFORMS.includes(detectedPlatform)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: `Unsupported platform`,
        }),
      };
    }

    console.log("[Handler] Starting download...");

    // Download
    const { buffer, filename } = await downloadViaCobalt(
      normalizedUrl,
      audioOnly || false
    );

    const base64 = buffer.toString("base64");

    console.log("[Handler] Success:", filename);

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

    let msg = error.message || "Download failed";

    // Friendly errors
    if (msg.includes("400")) {
      msg = "URL not recognized. Please try a direct link.";
    } else if (msg.includes("timeout")) {
      msg = "Download timed out. Please try again.";
    } else if (msg.includes("Empty")) {
      msg = "No content found.";
    }

    return {
      statusCode: 400,
      body: JSON.stringify({ error: msg }),
    };
  }
}
