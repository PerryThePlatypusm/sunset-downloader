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

export async function handler(event: any) {
  try {
    const body = JSON.parse(event.body || "{}") as DownloadRequest;
    const { url, platform, quality, audioOnly } = body;

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
    } catch {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid URL format" }),
      };
    }

    if (!isValidUrl(normalizedUrl)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid URL format" }),
      };
    }

    // Detect platform
    let detectedPlatform = platform;
    if (!detectedPlatform) {
      detectedPlatform = detectPlatform(normalizedUrl);
    }

    if (!detectedPlatform || !SUPPORTED_PLATFORMS.includes(detectedPlatform)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: `Unsupported platform. Supported: ${SUPPORTED_PLATFORMS.join(", ")}`,
        }),
      };
    }

    // Try to proxy to backend service
    const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";
    const apiEndpoint = `${backendUrl}/api/download`;

    try {
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: normalizedUrl,
          platform: detectedPlatform,
          quality: quality || (audioOnly ? "320" : "720"),
          audioOnly: audioOnly || false,
          episodes: event.body?.episodes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          statusCode: response.status,
          body: JSON.stringify(
            errorData || {
              error: `Download service returned ${response.status}`,
            },
          ),
        };
      }

      // Get the file blob
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");

      // Get headers from backend response
      const contentType =
        response.headers.get("content-type") || "application/octet-stream";
      const contentDisposition =
        response.headers.get("content-disposition") || "";

      return {
        statusCode: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": contentDisposition,
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
        body: base64,
        isBase64Encoded: true,
      };
    } catch (proxyError) {
      console.error("Backend proxy error:", proxyError);

      // If backend is unavailable, provide helpful error
      return {
        statusCode: 503,
        body: JSON.stringify({
          error: "Download service temporarily unavailable",
          details:
            "The download backend is not accessible. Please ensure the backend service is running.",
          instruction:
            "If running locally, start the development server with 'npm run dev'",
        }),
      };
    }
  } catch (error) {
    console.error("Download error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return {
      statusCode: 500,
      body: JSON.stringify({ error: errorMessage }),
    };
  }
}
