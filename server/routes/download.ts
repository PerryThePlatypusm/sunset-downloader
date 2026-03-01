import { RequestHandler } from "express";

/**
 * Download handler - Uses simple, direct approach
 * Avoids complex API dependencies
 */

interface DownloadResponse {
  url?: string;
  filename?: string;
  error?: string;
}

/**
 * Simple wrapper for fetch with timeout and error handling
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 8000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Try generic video download service
 */
async function tryGenericDownload(
  url: string,
  audioOnly: boolean
): Promise<DownloadResponse> {
  try {
    console.log("[Generic] Attempting direct download...");

    // Try to construct a direct download-friendly URL
    // For YouTube, we'll use a simpler approach
    const encodedUrl = encodeURIComponent(url.trim());

    // Try SaveFrom.net API
    const savefromUrl = `https://savefrom.net/api/v1/?url=${encodedUrl}&type=json`;

    try {
      const response = await fetchWithTimeout(savefromUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.url || data.download_url) {
          console.log("[Generic] Got download URL from SaveFrom");
          return {
            url: data.url || data.download_url,
            filename: `download_${Date.now()}`,
          };
        }
      }
    } catch (e) {
      console.log(`[Generic/SaveFrom] Failed: ${e instanceof Error ? e.message : String(e)}`);
    }

    // Fallback: Return instructions for user to use online tools
    console.log("[Generic] Returning instructions for alternative download");
    return {
      error:
        "Download services are temporarily unavailable. Please try: 1) Refreshing the page, 2) Waiting a few minutes, 3) Using online tools like SaveFrom.net, Y2Mate, or TubeMate",
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.log(`[Generic] Exception: ${msg}`);
    return { error: msg };
  }
}

/**
 * Try simple proxy approach for known platforms
 */
async function trySimpleProxy(
  url: string,
  audioOnly: boolean,
  quality: string
): Promise<DownloadResponse> {
  try {
    console.log("[SimpleProxy] Attempting download...");

    // For YouTube, use a simple pattern
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      // Try simple YouTube proxy
      const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)?.[1];

      if (videoId) {
        // Try multiple simple proxy services
        const proxyUrls = [
          `https://www.y2meta.com/api/button/check?url=${encodeURIComponent(url)}&lang=en`,
          `https://pytube-api.herokuapp.com/download?url=${encodeURIComponent(url)}`,
        ];

        for (const proxyUrl of proxyUrls) {
          try {
            const response = await fetchWithTimeout(proxyUrl, {
              headers: {
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              },
            });

            if (response.ok) {
              const data = await response.json();
              if (data.url || data.link) {
                console.log("[SimpleProxy] Got URL from proxy service");
                return {
                  url: data.url || data.link,
                  filename: `download_${Date.now()}`,
                };
              }
            }
          } catch (e) {
            console.log(
              `[SimpleProxy] Proxy failed: ${e instanceof Error ? e.message : String(e)}`
            );
          }
        }
      }
    }

    return { error: "Could not generate download link" };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.log(`[SimpleProxy] Exception: ${msg}`);
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
    const { url, audioOnly = false, quality = "720", platform } = body;

    if (!url || typeof url !== "string" || !url.trim()) {
      return res.status(400).json({
        error: "URL is required",
      });
    }

    console.log("[Download] Processing URL:", url);
    console.log("[Download] Type:", audioOnly ? "audio" : "video");
    console.log("[Download] Quality:", quality);

    // Try simple approaches first
    console.log("[Download] Attempting download from URL...");

    let result = await trySimpleProxy(url, audioOnly, quality);

    if (!result.error && result.url) {
      console.log("[Download] Successfully got download link");
      return res.json({
        success: true,
        url: result.url,
        filename: result.filename,
      });
    }

    console.log("[Download] Simple proxy failed, trying generic approach...");

    result = await tryGenericDownload(url, audioOnly);

    if (!result.error && result.url) {
      console.log("[Download] Successfully got download link");
      return res.json({
        success: true,
        url: result.url,
        filename: result.filename,
      });
    }

    // All attempts failed - provide helpful message
    console.error("[Download] All download methods failed");

    const helpfulMessage =
      result.error ||
      "Download services are temporarily unavailable. This can happen when:\n" +
      "1. Video service is blocking downloads temporarily\n" +
      "2. Download services are overloaded\n" +
      "3. Your network has restrictions\n\n" +
      "Try again in a few moments, or use online tools like SaveFrom.net or Y2Mate";

    return res.status(503).json({
      error: helpfulMessage,
    });
  } catch (error) {
    console.error("[Download] Exception:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    return res.status(500).json({
      error: `Download error: ${errorMessage}. Please try again or check your internet connection.`,
    });
  }
};

/**
 * Validate URL endpoint
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
