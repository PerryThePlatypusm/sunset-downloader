import { RequestHandler } from "express";

/**
 * Download handler using multiple fallback services
 * Note: Many video platforms actively block automated downloads
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
 * Try VidNET API endpoint
 */
async function downloadWithVidNET(
  url: string,
  audioOnly: boolean,
  quality: string
): Promise<DownloadResponse> {
  try {
    console.log("[VidNET] Attempting download...");

    const response = await fetchWithTimeout(
      "https://api.vidnet.in/api/download",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: url.trim(),
          audioOnly,
        }),
      },
      20000
    );

    console.log(`[VidNET] Status: ${response.status}`);

    if (!response.ok) {
      const text = await response.text();
      console.log(`[VidNET] Error: ${text.substring(0, 150)}`);
      return { error: `VidNET returned ${response.status}` };
    }

    const data = await response.json();

    if (data.error) {
      console.log(`[VidNET] Error: ${data.error}`);
      return { error: data.error };
    }

    if (data.url || data.data?.url) {
      const downloadUrl = data.url || data.data.url;
      console.log("[VidNET] ✓ Success!");
      return {
        url: downloadUrl,
        filename: `download_${Date.now()}`,
      };
    }

    console.log("[VidNET] No URL in response");
    return { error: "No download link generated" };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.log(`[VidNET] Error: ${msg}`);
    return { error: msg };
  }
}

/**
 * Try API.save-video.com endpoint
 */
async function downloadWithSaveVideo(
  url: string,
  audioOnly: boolean,
  quality: string
): Promise<DownloadResponse> {
  try {
    console.log("[SaveVideo] Attempting download...");

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

    console.log(`[SaveVideo] Status: ${response.status}`);

    if (!response.ok) {
      console.log(`[SaveVideo] HTTP ${response.status}`);
      return { error: `SaveVideo returned ${response.status}` };
    }

    const data = await response.json();

    if (data.error) {
      console.log(`[SaveVideo] Error: ${data.error}`);
      return { error: data.error };
    }

    if (data.url || data.download_link) {
      const downloadUrl = data.url || data.download_link;
      console.log("[SaveVideo] ✓ Success!");
      return {
        url: downloadUrl,
        filename: `download_${Date.now()}`,
      };
    }

    console.log("[SaveVideo] No URL in response");
    return { error: "No download link generated" };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.log(`[SaveVideo] Error: ${msg}`);
    return { error: msg };
  }
}

/**
 * Try RConverter.co endpoint (known to work with many platforms)
 */
async function downloadWithRConverter(
  url: string,
  audioOnly: boolean,
  quality: string
): Promise<DownloadResponse> {
  try {
    console.log("[RConverter] Attempting download...");

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

    console.log(`[RConverter] Status: ${response.status}`);

    if (!response.ok) {
      console.log(`[RConverter] HTTP ${response.status}`);
      return { error: `RConverter returned ${response.status}` };
    }

    const data = await response.json();

    if (data.error || data.errors) {
      const error = data.error || data.errors;
      console.log(`[RConverter] Error: ${error}`);
      return { error: String(error) };
    }

    if (data.downloadUrl) {
      console.log("[RConverter] ✓ Success!");
      return {
        url: data.downloadUrl,
        filename: `download_${Date.now()}`,
      };
    }

    console.log("[RConverter] No URL in response");
    return { error: "No download link generated" };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.log(`[RConverter] Error: ${msg}`);
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

    // Try multiple services in order
    const services = [
      { name: "VidNET", fn: downloadWithVidNET },
      { name: "SaveVideo", fn: downloadWithSaveVideo },
      { name: "RConverter", fn: downloadWithRConverter },
    ];

    for (const service of services) {
      console.log(`[Download] Trying ${service.name}...`);
      const result = await service.fn(url, audioOnly, quality);

      if (result.url && !result.error) {
        console.log(`[Download] ✓ Success with ${service.name}!`);
        return res.json({
          success: true,
          url: result.url,
          filename: result.filename,
        });
      }

      console.log(`[Download] ${service.name} failed: ${result.error}`);
    }

    // All services failed
    console.error("[Download] All download services failed");

    const helpMessage =
      "All download services are currently unavailable. This can happen because:\n\n" +
      "1. Video platforms block automated downloads\n" +
      "2. Download services may be temporarily overloaded\n" +
      "3. The video might be private or restricted\n\n" +
      "Recommended alternatives:\n" +
      "- Use browser extensions like VideoDownloadHelper\n" +
      "- Try online services like savefrom.net or y2mate.com directly\n" +
      "- Use dedicated apps like 4K Video Downloader or VidMate\n\n" +
      "Please verify:\n" +
      "1. The URL is correct and the video is public\n" +
      "2. The video is not age-restricted\n" +
      "3. Your internet connection is working";

    return res.status(503).json({
      error: helpMessage,
    });
  } catch (error) {
    console.error("[Download] Exception:", error);
    const msg = error instanceof Error ? error.message : String(error);

    return res.status(500).json({
      error: `Server error: ${msg}`,
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
