import { RequestHandler } from "express";

/**
 * Download handler - proxies requests to y2mate API
 * Avoids CORS issues by handling API call on the backend
 */
export const handleDownload: RequestHandler = async (req, res) => {
  try {
    const body = req.body as {
      url: string;
      audioOnly?: boolean;
      quality?: string;
      platform?: string;
    };
    const { url, audioOnly, quality, platform } = body;

    if (!url || typeof url !== "string" || !url.trim()) {
      return res.status(400).json({
        error: "URL is required",
      });
    }

    console.log("[Download Proxy] Processing URL:", url);
    console.log("[Download Proxy] Platform:", platform);
    console.log("[Download Proxy] Audio only:", audioOnly);
    console.log("[Download Proxy] Quality:", quality);

    // Call y2mate API from the backend (no CORS issues)
    const y2mateUrl = "https://www.y2mate.com/mates/api/fetch";
    const params = new URLSearchParams();
    params.append("url", url.trim());
    params.append("type", audioOnly ? "audio" : "video");

    // Handle quality parameter - map lossless to highest quality
    let qualityParam = quality || (audioOnly ? "128" : "720");
    if (qualityParam.toLowerCase() === "flac") {
      qualityParam = "320"; // Use highest quality as fallback for lossless
    }
    params.append("quality", qualityParam);

    console.log("[Download Proxy] Calling y2mate API...");

    const response = await fetch(y2mateUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      body: params.toString(),
    });

    console.log("[Download Proxy] Response status:", response.status);

    if (!response.ok) {
      console.error("[Download Proxy] API error:", response.status);
      return res.status(response.status).json({
        error: `Download service returned error: ${response.status}`,
      });
    }

    const data = await response.json();

    console.log("[Download Proxy] Response data:", {
      hasUrl: !!data.url,
      hasError: !!data.error,
    });

    if (data.error) {
      console.error("[Download Proxy] API error message:", data.error);
      return res.status(400).json({
        error: data.error || "Download failed",
      });
    }

    if (!data.url) {
      console.error("[Download Proxy] No download URL in response");
      return res.status(400).json({
        error: "Could not get download link",
      });
    }

    console.log("[Download Proxy] Success, returning download link");

    // Return the download data to frontend
    res.json({
      success: true,
      url: data.url,
      filename: data.filename || `download_${Date.now()}`,
    });
  } catch (error) {
    console.error("[Download Proxy] Exception:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    return res.status(500).json({
      error: `Download failed: ${errorMessage}`,
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

    // Basic validation - just check if it's a valid URL
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
