import { Handler } from "@netlify/functions";

/**
 * Netlify Function for downloading media
 * Uses Cobalt API (primary) with Y2mate fallback
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
 * Try Cobalt API (primary)
 * Using minimal JSON format
 */
async function tryDownloadWithCobalt(
  url: string,
  audioOnly: boolean,
  quality: string
): Promise<{ url?: string; error?: string }> {
  try {
    console.log("[Cobalt] Attempting with minimal request format...");

    const response = await fetchWithTimeout(
      "https://api.cobalt.tools/api/json",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: url.trim(),
        }),
      },
      20000
    );

    console.log(`[Cobalt] Response status: ${response.status}`);

    if (!response.ok) {
      const text = await response.text();
      console.log(`[Cobalt] Error: ${text.substring(0, 100)}`);
      return { error: `HTTP ${response.status}` };
    }

    const data = await response.json();
    console.log("[Cobalt] Parsed response");

    if (data.error) {
      console.log(`[Cobalt] API error: ${data.error}`);
      return { error: data.error };
    }

    if (!data.url) {
      console.log("[Cobalt] No download URL");
      return { error: "No URL in response" };
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
 * Try Y2mate API (fallback)
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
      },
      20000
    );

    console.log(`[Y2mate] Response status: ${response.status}`);

    if (!response.ok) {
      const text = await response.text();
      console.log(`[Y2mate] Error: ${text.substring(0, 100)}`);
      return { error: `HTTP ${response.status}` };
    }

    const data = await response.json();
    console.log("[Y2mate] Parsed response");

    if (data.error) {
      console.log(`[Y2mate] API error: ${data.error}`);
      return { error: data.error };
    }

    if (!data.url) {
      console.log("[Y2mate] No download URL");
      return { error: "No URL in response" };
    }

    console.log("[Y2mate] Success!");
    return { url: data.url };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.log(`[Y2mate] Error: ${msg}`);
    return { error: msg };
  }
}

const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method not allowed" }),
      };
    }

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
      console.log("[Download] ✓ Success with Cobalt!");
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          url: result.url,
          filename: `download_${Date.now()}`,
        }),
      };
    }

    console.log("[Download] Cobalt failed:", result.error);

    // Try Y2mate as fallback
    console.log("[Download] Trying Y2mate as fallback...");
    result = await tryDownloadWithY2mate(url, audioOnly, quality);

    if (result.url) {
      console.log("[Download] ✓ Success with Y2mate!");
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          url: result.url,
          filename: `download_${Date.now()}`,
        }),
      };
    }

    // All failed
    console.error("[Download] All services failed");
    const errorMsg = result.error || "Unable to download";

    let helpMessage = `Download Failed: ${errorMsg}`;

    if (errorMsg.includes("404") || errorMsg.includes("not found")) {
      helpMessage =
        "Video Not Found\n\nThis usually means:\n1. Video URL is incorrect\n2. Video has been removed\n3. Video is private\n\nPlease verify the URL and try again";
    } else if (errorMsg.includes("400") || errorMsg.includes("Invalid")) {
      helpMessage =
        "Invalid URL or Unsupported Platform\n\nMake sure:\n1. You copied the full URL from your browser\n2. It's from a supported platform\n3. There are no extra spaces";
    } else if (
      errorMsg.includes("timeout") ||
      errorMsg.includes("fetch failed")
    ) {
      helpMessage =
        "Connection Issue\n\nTry:\n1. Check your internet connection\n2. Wait a moment and try again\n3. Try a different video";
    }

    return {
      statusCode: 503,
      body: JSON.stringify({ error: helpMessage }),
    };
  } catch (error) {
    console.error("[Download] Exception:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";

    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Server error: ${msg}` }),
    };
  }
};

export { handler };
