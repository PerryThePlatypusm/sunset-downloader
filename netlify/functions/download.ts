import { Handler } from "@netlify/functions";

/**
 * Netlify Function for downloading media
 * Uses reliable external APIs with FastSaver as primary
 */

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 15000
): Promise<Response> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<Response>((_, reject) =>
    (timeoutId = setTimeout(
      () => reject(new Error("Request timeout")),
      timeoutMs
    ))
  );

  try {
    const response = await Promise.race([fetch(url, options), timeoutPromise]);
    if (timeoutId) clearTimeout(timeoutId);
    return response as Response;
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Try Cobalt API (Primary)
 * Supports 1000+ platforms
 */
async function tryDownloadWithCobalt(
  url: string,
  audioOnly: boolean,
  quality: string
): Promise<{ url?: string; error?: string }> {
  try {
    console.log("[Cobalt] Attempting download with URL:", url);

    const response = await fetchWithTimeout(
      "https://api.cobalt.tools/api/json",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        body: JSON.stringify({
          url: url.trim(),
          videoAudio: audioOnly ? "audio" : "video",
          audioFormat: audioOnly ? "mp3" : "mp4",
          vQuality: audioOnly ? "audio" : quality,
          aFormat: "mp3",
        }),
      },
      20000
    );

    if (!response.ok) {
      const statusMsg = `HTTP ${response.status}`;
      console.log(`[Cobalt] Failed with ${statusMsg}`);

      if (response.status === 400) {
        return { error: "Invalid URL or unsupported platform" };
      } else if (response.status === 404) {
        return { error: "Video not found or has been removed" };
      } else if (response.status === 429) {
        return { error: "Rate limited - service overloaded" };
      } else if (response.status >= 500) {
        return { error: "Service temporarily unavailable" };
      }

      return { error: `Service error: ${statusMsg}` };
    }

    const data = await response.json();
    console.log("[Cobalt] Got response");

    if (data.error) {
      console.log(`[Cobalt] API returned error: ${data.error}`);
      return { error: data.error };
    }

    if (!data.url) {
      console.log("[Cobalt] No download URL in response");
      return { error: "Could not generate download link" };
    }

    console.log("[Cobalt] Success!");
    return { url: data.url };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.log(`[Cobalt] Error: ${msg}`);
    return { error: msg };
  }
}

/**
 * Try Cobalt API
 */
async function tryDownloadWithCobalt(
  url: string,
  audioOnly: boolean,
  quality: string
): Promise<{ url?: string; error?: string }> {
  try {
    console.log("[Cobalt] Attempting download...");

    const response = await fetchWithTimeout(
      "https://api.cobalt.tools/api/json",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: url.trim(),
          videoAudio: audioOnly ? "audio" : "video",
          audioFormat: audioOnly ? "mp3" : "mp4",
        }),
      }
    );

    if (!response.ok) {
      const statusMsg = `HTTP ${response.status}`;
      console.log(`[Cobalt] Failed with ${statusMsg}`);

      // More specific error messages based on status code
      if (response.status === 400) {
        return { error: "Invalid URL or unsupported platform" };
      } else if (response.status === 404) {
        return { error: "Video not found or has been removed" };
      } else if (response.status === 429) {
        return { error: "Rate limited - service overloaded" };
      } else if (response.status >= 500) {
        return { error: "Service temporarily unavailable" };
      }

      return { error: `Service error: ${statusMsg}` };
    }

    const data = await response.json();

    if (data.error) {
      console.log(`[Cobalt] API returned error: ${data.error}`);
      return { error: data.error };
    }

    if (!data.url) {
      console.log("[Cobalt] No download URL in response");
      return { error: "Could not generate download link" };
    }

    console.log("[Cobalt] Success!");
    return { url: data.url };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.log(`[Cobalt] Failed: ${msg}`);
    return { error: msg };
  }
}

/**
 * Try Y2Mate API
 */
async function tryDownloadWithY2mate(
  url: string,
  audioOnly: boolean,
  quality: string
): Promise<{ url?: string; error?: string }> {
  try {
    console.log("[Y2mate] Attempting download...");

    const params = new URLSearchParams();
    params.append("url", url.trim());
    params.append("type", audioOnly ? "audio" : "video");
    params.append("quality", quality);

    const response = await fetchWithTimeout(
      "https://www.y2mate.com/mates/api/fetch",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        body: params.toString(),
      }
    );

    if (!response.ok) {
      const statusMsg = `HTTP ${response.status}`;
      console.log(`[Y2mate] Failed with ${statusMsg}`);

      // More specific error messages based on status code
      if (response.status === 400) {
        return { error: "Invalid URL or unsupported platform" };
      } else if (response.status === 404) {
        return { error: "Video not found or has been removed" };
      } else if (response.status === 429) {
        return { error: "Rate limited - service overloaded" };
      } else if (response.status >= 500) {
        return { error: "Service temporarily unavailable" };
      }

      return { error: `Service error: ${statusMsg}` };
    }

    const data = await response.json();

    if (data.error) {
      console.log(`[Y2mate] API returned error: ${data.error}`);
      return { error: data.error };
    }

    if (!data.url) {
      console.log("[Y2mate] No download URL in response");
      return { error: "Could not generate download link" };
    }

    console.log("[Y2mate] Success!");
    return { url: data.url };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.log(`[Y2mate] Failed: ${msg}`);
    return { error: msg };
  }
}

const handler: Handler = async (event) => {
  try {
    // Only accept POST requests
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method not allowed" }),
      };
    }

    // Parse request body
    let body;
    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid JSON" }),
      };
    }

    const { url, audioOnly = false, quality = "720" } = body;

    if (!url || typeof url !== "string") {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "URL is required" }),
      };
    }

    console.log("[Download] Processing:", url);
    console.log("[Download] Type:", audioOnly ? "audio" : "video");
    console.log("[Download] Quality:", quality);

    // Try Cobalt first (primary API - supports 1000+ platforms)
    console.log("[Download] Trying Cobalt API...");
    let result = await tryDownloadWithCobalt(url, audioOnly, quality);

    if (result.url) {
      console.log("[Download] Success with Cobalt!");
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          url: result.url,
          filename: `download_${Date.now()}`,
        }),
      };
    }

    // Try Y2mate as fallback
    console.log("[Download] Cobalt failed, trying Y2mate API...");
    result = await tryDownloadWithY2mate(url, audioOnly, quality);

    if (result.url) {
      console.log("[Download] Success with Y2mate!");
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          url: result.url,
          filename: `download_${Date.now()}`,
        }),
      };
    }

    // All services failed - provide helpful message
    console.error("[Download] All services failed. Last error:", result.error);

    const errorMsg = result.error || "Unable to download from this URL";
    let helpMessage = `Download Failed: ${errorMsg}`;

    if (errorMsg.includes("404")) {
      helpMessage = `Video Not Found\n\nThis usually means:\n1. Video URL is incorrect or broken\n2. Video has been removed or deleted\n3. Video is private\n\nPlease verify the URL and try again`;
    } else if (errorMsg.includes("400") || errorMsg.includes("Invalid")) {
      helpMessage = `Invalid URL or Unsupported Platform\n\nTry:\n1. Copy the full URL from your browser\n2. Make sure it's from a supported platform\n3. Ensure no extra spaces or characters`;
    } else if (errorMsg.includes("timeout") || errorMsg.includes("fetch failed")) {
      helpMessage = `Connection Issue\n\nTry:\n1. Check your internet connection\n2. Wait a moment and try again\n3. Use a shorter video\n4. Try a different video`;
    } else if (errorMsg.includes("Rate limited") || errorMsg.includes("overloaded")) {
      helpMessage = `Services Overloaded\n\nOur download services are temporarily busy.\n\nTry:\n1. Wait 30 seconds\n2. Try again\n3. Use a different video`;
    }

    return {
      statusCode: 503,
      body: JSON.stringify({
        error: helpMessage,
      }),
    };
  } catch (error) {
    console.error("[Download] Exception:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: `Server error: ${msg}`,
      }),
    };
  }
};

export { handler };
