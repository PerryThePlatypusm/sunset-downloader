import { detectPlatform } from "../../server/utils/urlUtils";

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

// Use FastSaverAPI for reliable multi-platform downloading
async function downloadViaFastSaver(
  url: string,
  audioOnly: boolean,
): Promise<{ buffer: Buffer; filename: string }> {
  console.log(`[FastSaver] Starting download for: ${url}`);
  console.log(`[FastSaver] Audio only: ${audioOnly}`);

  const fastSaverUrl = "https://api.fastsaverapi.com/download";
  const token = process.env.FASTSAVER_API_TOKEN;

  if (!token) {
    throw new Error("FastSaverAPI token not configured");
  }

  try {
    const requestPayload = {
      url: url,
      token: token,
    };

    console.log(`[FastSaver] Sending URL:`, url);
    console.log(`[FastSaver] Request payload:`, JSON.stringify(requestPayload));

    const response = await fetch(fastSaverUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
      signal: AbortSignal.timeout(60000),
    });

    console.log(`[FastSaver] Response status: ${response.status}`);

    const responseText = await response.text();
    console.log(
      `[FastSaver] Response (first 500 chars):`,
      responseText.substring(0, 500),
    );

    if (!response.ok) {
      console.error(`[FastSaver] HTTP ${response.status} Error`);
      console.error(`[FastSaver] Full response:`, responseText);
      throw new Error(`HTTP ${response.status}`);
    }

    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error(`[FastSaver] JSON parse error:`, e);
      console.error(`[FastSaver] Response was:`, responseText);
      throw new Error("Invalid API response");
    }

    console.log(
      `[FastSaver] Parsed data:`,
      JSON.stringify(data).substring(0, 300),
    );

    // Check for errors
    if (data.error) {
      const msg = data.error || "API error";
      console.error(`[FastSaver] API error:`, msg);
      throw new Error(msg);
    }

    // Get download URL
    if (!data.url) {
      console.error(
        `[FastSaver] Missing URL in response. Data:`,
        JSON.stringify(data),
      );
      throw new Error("No download URL returned");
    }

    console.log(`[FastSaver] Got download URL, fetching file...`);

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

    const trimmedUrl = url.trim();

    // Detect platform using RAW URL (no normalization for Cobalt)
    let detectedPlatform = platform || detectPlatform(trimmedUrl);
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

    // Download using FastSaverAPI
    const { buffer, filename } = await downloadViaFastSaver(
      trimmedUrl,
      audioOnly || false,
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
