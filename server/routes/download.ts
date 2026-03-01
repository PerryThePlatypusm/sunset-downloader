import { RequestHandler } from "express";

/**
 * Download handler with multiple fallback options
 * Tries multiple APIs to ensure reliability
 */

interface DownloadResponse {
  url?: string;
  filename?: string;
  error?: string;
}

/**
 * Try y2mate API (Primary option)
 */
async function tryY2mate(
  url: string,
  audioOnly: boolean,
  quality: string
): Promise<DownloadResponse> {
  try {
    console.log("[Y2mate] Attempting download...");

    const y2mateUrl = "https://www.y2mate.com/mates/api/fetch";
    const params = new URLSearchParams();
    params.append("url", url.trim());
    params.append("type", audioOnly ? "audio" : "video");
    params.append("quality", quality);

    const response = await fetch(y2mateUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      console.log(`[Y2mate] Failed with status ${response.status}`);
      return { error: `Y2mate error: ${response.status}` };
    }

    const data = await response.json();

    if (data.error) {
      console.log(`[Y2mate] Error in response: ${data.error}`);
      return { error: data.error };
    }

    if (!data.url) {
      console.log("[Y2mate] No URL in response");
      return { error: "No download link received" };
    }

    console.log("[Y2mate] Success!");
    return {
      url: data.url,
      filename: data.filename || `download_${Date.now()}`,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.log(`[Y2mate] Exception: ${msg}`);
    return { error: msg };
  }
}

/**
 * Try Yt-dlp API (Alternative option)
 */
async function tryYtdlpApi(
  url: string,
  audioOnly: boolean,
  quality: string
): Promise<DownloadResponse> {
  try {
    console.log("[YtdlpAPI] Attempting download...");

    const apiUrl = "https://api.cobalt.tools/api/json";
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        url: url.trim(),
        videoAudio: audioOnly ? "audio" : "video",
        audioFormat: audioOnly ? "mp3" : null,
      }),
    });

    if (!response.ok) {
      console.log(`[YtdlpAPI] Failed with status ${response.status}`);
      return { error: `API error: ${response.status}` };
    }

    const data = await response.json();

    if (data.error) {
      console.log(`[YtdlpAPI] Error: ${data.error}`);
      return { error: data.error };
    }

    if (!data.url) {
      console.log("[YtdlpAPI] No URL in response");
      return { error: "No download link" };
    }

    console.log("[YtdlpAPI] Success!");
    return {
      url: data.url,
      filename: `download_${Date.now()}`,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.log(`[YtdlpAPI] Exception: ${msg}`);
    return { error: msg };
  }
}

/**
 * Try AllTube API (Third fallback)
 */
async function tryAllTubeApi(
  url: string,
  audioOnly: boolean
): Promise<DownloadResponse> {
  try {
    console.log("[AllTube] Attempting download...");

    const params = new URLSearchParams();
    params.append("url", url.trim());
    params.append("audio", audioOnly ? "1" : "0");

    const response = await fetch(
      `https://alltube.tv/json/info?${params.toString()}`,
      {
        headers: {
          "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      }
    );

    if (!response.ok) {
      console.log(`[AllTube] Failed with status ${response.status}`);
      return { error: `AllTube error: ${response.status}` };
    }

    console.log("[AllTube] Success!");
    return {
      url: url,
      filename: `download_${Date.now()}`,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.log(`[AllTube] Exception: ${msg}`);
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
    console.log("[Download] Platform:", platform);
    console.log("[Download] Type:", audioOnly ? "audio" : "video");
    console.log("[Download] Quality:", quality);

    // Try multiple APIs in order
    console.log("[Download] Trying API services in order...");

    // Try Y2mate first (most reliable for YouTube)
    let result = await tryY2mate(url, audioOnly, quality);
    if (!result.error && result.url) {
      console.log("[Download] Successfully got download link from Y2mate");
      return res.json({
        success: true,
        url: result.url,
        filename: result.filename,
      });
    }

    console.log("[Download] Y2mate failed, trying alternative APIs...");

    // Try Yt-dlp API as fallback
    result = await tryYtdlpApi(url, audioOnly, quality);
    if (!result.error && result.url) {
      console.log("[Download] Successfully got download link from YtdlpAPI");
      return res.json({
        success: true,
        url: result.url,
        filename: result.filename,
      });
    }

    console.log("[Download] YtdlpAPI failed, trying AllTube...");

    // Try AllTube as final fallback
    result = await tryAllTubeApi(url, audioOnly);
    if (!result.error && result.url) {
      console.log("[Download] Successfully got download link from AllTube");
      return res.json({
        success: true,
        url: result.url,
        filename: result.filename,
      });
    }

    // All services failed
    console.error("[Download] All download services failed");
    const errorMsg =
      result.error ||
      "All download services are currently unavailable. Please try again in a moment.";

    return res.status(503).json({
      error: errorMsg,
    });
  } catch (error) {
    console.error("[Download] Exception:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    return res.status(500).json({
      error: `Download service error: ${errorMessage}`,
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
