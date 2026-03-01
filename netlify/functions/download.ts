import { Handler } from "@netlify/functions";

/**
 * Netlify Function for downloading media
 * Uses reliable external APIs
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

    // Try Cobalt first
    console.log("[Download] Trying Cobalt API...");
    let result = await tryDownloadWithCobalt(url, audioOnly, quality);

    if (result.url) {
      console.log("[Download] Success!");
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
    console.log("[Download] Trying Y2mate API...");
    result = await tryDownloadWithY2mate(url, audioOnly, quality);

    if (result.url) {
      console.log("[Download] Success!");
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          url: result.url,
          filename: `download_${Date.now()}`,
        }),
      };
    }

    // Both failed - provide helpful message
    console.error("[Download] All services failed:", result.error);

    // Generate helpful error message based on the error
    let userMessage = `Download Failed: ${result.error}`;

    if (result.error?.includes("404") || result.error?.includes("not found")) {
      userMessage = "Video not found. Please check:\n1. URL is correct and current\n2. Video is public (not private)\n3. Content hasn't been removed";
    } else if (result.error?.includes("400") || result.error?.includes("Invalid URL")) {
      userMessage = "Invalid URL or unsupported platform. Check the link format.";
    } else if (result.error?.includes("429") || result.error?.includes("Rate limited")) {
      userMessage = "Services are overloaded. Please try again in a moment.";
    } else if (result.error?.includes("timeout") || result.error?.includes("timeout")) {
      userMessage = "Connection timeout. Check your internet and try again.";
    }

    return {
      statusCode: 503,
      body: JSON.stringify({
        error: userMessage,
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
