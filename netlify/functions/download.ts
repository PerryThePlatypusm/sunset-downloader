import { Handler } from "@netlify/functions";

/**
 * Netlify Function for downloading media
 * Uses multiple fallback services as primary APIs are shutting down
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
 * Try VidNET API
 */
async function tryVidNET(
  url: string,
  audioOnly: boolean
): Promise<{ url?: string; error?: string }> {
  try {
    console.log("[VidNET] Attempting...");
    const response = await fetchWithTimeout(
      "https://api.vidnet.in/api/download",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), audioOnly }),
      },
      20000
    );

    if (!response.ok) {
      console.log(`[VidNET] HTTP ${response.status}`);
      return { error: `VidNET ${response.status}` };
    }

    const data = await response.json();
    if (data.url || data.data?.url) {
      console.log("[VidNET] ✓ Success!");
      return { url: data.url || data.data.url };
    }

    return { error: "No URL from VidNET" };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.log(`[VidNET] Error: ${msg}`);
    return { error: msg };
  }
}

/**
 * Try SaveVideo API
 */
async function trySaveVideo(
  url: string,
  audioOnly: boolean
): Promise<{ url?: string; error?: string }> {
  try {
    console.log("[SaveVideo] Attempting...");
    const params = new URLSearchParams();
    params.append("url", url.trim());
    params.append("type", audioOnly ? "audio" : "video");

    const response = await fetchWithTimeout(
      "https://api.save-video.com/download",
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

    if (!response.ok) {
      console.log(`[SaveVideo] HTTP ${response.status}`);
      return { error: `SaveVideo ${response.status}` };
    }

    const data = await response.json();
    if (data.url || data.download_link) {
      console.log("[SaveVideo] ✓ Success!");
      return { url: data.url || data.download_link };
    }

    return { error: "No URL from SaveVideo" };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.log(`[SaveVideo] Error: ${msg}`);
    return { error: msg };
  }
}

/**
 * Try RConverter API
 */
async function tryRConverter(
  url: string,
  audioOnly: boolean
): Promise<{ url?: string; error?: string }> {
  try {
    console.log("[RConverter] Attempting...");
    const response = await fetchWithTimeout(
      "https://converter.rConverter.co/api/v2/download",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://rconverter.co",
          Referer: "https://rconverter.co/",
        },
        body: JSON.stringify({
          url: url.trim(),
          format: audioOnly ? "mp3" : "mp4",
        }),
      },
      20000
    );

    if (!response.ok) {
      console.log(`[RConverter] HTTP ${response.status}`);
      return { error: `RConverter ${response.status}` };
    }

    const data = await response.json();
    if (data.downloadUrl) {
      console.log("[RConverter] ✓ Success!");
      return { url: data.downloadUrl };
    }

    return { error: "No URL from RConverter" };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.log(`[RConverter] Error: ${msg}`);
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

    const { url, audioOnly = false } = body;

    if (!url || typeof url !== "string") {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "URL is required" }),
      };
    }

    console.log("[Download] Processing:", url);

    // Try multiple services
    for (const [name, fn] of [
      ["VidNET", tryVidNET],
      ["SaveVideo", trySaveVideo],
      ["RConverter", tryRConverter],
    ]) {
      console.log(`[Download] Trying ${name}...`);
      const result = await (fn as any)(url, audioOnly);

      if (result.url) {
        console.log(`[Download] ✓ Success with ${name}!`);
        return {
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            url: result.url,
            filename: `download_${Date.now()}`,
          }),
        };
      }
      console.log(`[Download] ${name} failed: ${result.error}`);
    }

    // All failed
    const helpMessage =
      "All download services are currently unavailable. This can happen because:\n\n" +
      "1. Video platforms block automated downloads\n" +
      "2. Download services may be temporarily overloaded\n" +
      "3. The video might be private or restricted\n\n" +
      "Recommended alternatives:\n" +
      "- Use browser extensions like VideoDownloadHelper\n" +
      "- Try online services like savefrom.net or y2mate.com directly\n" +
      "- Use dedicated apps like 4K Video Downloader or VidMate";

    return {
      statusCode: 503,
      body: JSON.stringify({ error: helpMessage }),
    };
  } catch (error) {
    console.error("[Download] Exception:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Server error. Please try again.",
      }),
    };
  }
};

export { handler };
