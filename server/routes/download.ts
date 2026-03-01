import { RequestHandler } from "express";

/**
 * Download handler using cobalt.tools API
 * Reliable, well-documented video/audio download service
 */

interface DownloadResponse {
  url?: string;
  filename?: string;
  error?: string;
}

/**
 * Fetch with proper error handling and timeout
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
 * Use cobalt.tools API (most reliable)
 */
async function downloadWithCobalt(
  url: string,
  audioOnly: boolean,
  quality: string
): Promise<DownloadResponse> {
  try {
    console.log("[Cobalt] Attempting download...");

    const response = await fetchWithTimeout(
      "https://api.cobalt.tools/api/json",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          url: url.trim(),
          videoAudio: audioOnly ? "audio" : "video",
          audioFormat: audioOnly ? "mp3" : "mp4",
          vQuality: audioOnly ? "audio" : quality,
        }),
      },
      15000
    );

    if (!response.ok) {
      console.log(`[Cobalt] HTTP ${response.status}`);
      return { error: `Service error: ${response.status}` };
    }

    const data = await response.json();

    if (data.error) {
      console.log(`[Cobalt] API error: ${data.error}`);
      return { error: `Video not available: ${data.error}` };
    }

    if (!data.url) {
      console.log("[Cobalt] No URL in response");
      return { error: "No download URL generated" };
    }

    console.log("[Cobalt] Success!");
    return {
      url: data.url,
      filename: data.filename || `download_${Date.now()}`,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.log(`[Cobalt] Error: ${msg}`);
    return { error: msg };
  }
}

/**
 * Try direct y2mate endpoint as fallback
 */
async function downloadWithY2mate(
  url: string,
  audioOnly: boolean,
  quality: string
): Promise<DownloadResponse> {
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
      15000
    );

    if (!response.ok) {
      console.log(`[Y2mate] HTTP ${response.status}`);
      return { error: `Service error: ${response.status}` };
    }

    const data = await response.json();

    if (data.error) {
      console.log(`[Y2mate] API error: ${data.error}`);
      return { error: data.error };
    }

    if (!data.url) {
      console.log("[Y2mate] No URL in response");
      return { error: "No download link" };
    }

    console.log("[Y2mate] Success!");
    return {
      url: data.url,
      filename: data.filename || `download_${Date.now()}`,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.log(`[Y2mate] Error: ${msg}`);
    return { error: msg };
  }
}

export const handleDownload: RequestHandler = async (req, res) => {
  try {
    const body = req.body as {
      url: string;
      audioOnly?: boolean;
      quality?: string;
      platform?: string;
    };
    const { url, audioOnly = false, quality = "720" } = body;

    if (!url || typeof url !== "string" || !url.trim()) {
      return res.status(400).json({
        error: "URL is required",
      });
    }

    console.log("[Download] Processing:", url);
    console.log("[Download] Format:", audioOnly ? "audio" : "video");
    console.log("[Download] Quality:", quality);

    // Try Cobalt first (most reliable)
    console.log("[Download] Trying Cobalt API...");
    let result = await downloadWithCobalt(url, audioOnly, quality);

    if (!result.error && result.url) {
      console.log("[Download] Success with Cobalt!");
      return res.json({
        success: true,
        url: result.url,
        filename: result.filename,
      });
    }

    console.log("[Download] Cobalt failed, trying Y2mate...");

    // Try Y2mate as fallback
    result = await downloadWithY2mate(url, audioOnly, quality);

    if (!result.error && result.url) {
      console.log("[Download] Success with Y2mate!");
      return res.json({
        success: true,
        url: result.url,
        filename: result.filename,
      });
    }

    // Both failed - provide helpful error
    console.error("[Download] All services failed");
    const errorMsg = result.error || "Unable to download from this URL";

    return res.status(503).json({
      error: `Download Failed: ${errorMsg}\n\nPlease check:\n1. URL is correct\n2. Video is public and not age-restricted\n3. Try again in a moment - services may be temporarily overloaded`,
    });
  } catch (error) {
    console.error("[Download] Exception:", error);
    const msg = error instanceof Error ? error.message : String(error);

    return res.status(500).json({
      error: `Server error: ${msg}\n\nPlease check your internet connection and try again.`,
    });
  }
};

/**
 * Validate URL
 */
export const validateUrl: RequestHandler = (req, res) => {
  try {
    const { url } = req.body as { url?: string };

    if (!url || typeof url !== "string" || !url.trim()) {
      return res.status(400).json({
        valid: false,
        error: "URL is required",
      });
    }

    try {
      new URL(url.startsWith("http") ? url : `https://${url}`);
      res.json({
        valid: true,
        url: url,
      });
    } catch {
      res.json({
        valid: false,
        error: "Invalid URL format",
      });
    }
  } catch (error) {
    console.error("[Validation] Error:", error);
    res.status(500).json({
      valid: false,
      error: "Validation failed",
    });
  }
};
