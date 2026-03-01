/**
 * MediaAPI Integration
 * Handles downloads from 1000+ platforms via RapidAPI MediaAPI
 */

export interface DownloadResult {
  success: boolean;
  url?: string;
  filename?: string;
  error?: string;
  mimeType?: string;
}

/**
 * No API key needed! Uses public download services
 */

/**
 * Detect platform from URL
 */
function detectPlatform(url: string): string {
  const lowerUrl = url.toLowerCase();
  
  if (lowerUrl.includes("youtube") || lowerUrl.includes("youtu.be")) {
    return "youtube";
  } else if (lowerUrl.includes("instagram")) {
    return "instagram";
  } else if (lowerUrl.includes("tiktok")) {
    return "tiktok";
  } else if (lowerUrl.includes("twitter") || lowerUrl.includes("x.com")) {
    return "twitter";
  } else if (lowerUrl.includes("facebook")) {
    return "facebook";
  } else if (lowerUrl.includes("spotify")) {
    return "spotify";
  } else if (lowerUrl.includes("soundcloud")) {
    return "soundcloud";
  } else if (lowerUrl.includes("twitch")) {
    return "twitch";
  } else if (lowerUrl.includes("reddit")) {
    return "reddit";
  } else if (lowerUrl.includes("pinterest")) {
    return "pinterest";
  }
  
  return "unknown";
}

/**
 * Download media using free public services (no API key needed!)
 */
export async function downloadMediaAPI(
  url: string,
  audioOnly: boolean = false
): Promise<DownloadResult> {
  try {
    const platform = detectPlatform(url);

    console.log(`[Download] Processing ${platform}: ${url}`);

    // Use y2mate API - works for YouTube and many platforms
    // No authentication needed!
    const y2mateUrl = new URL("https://www.y2mate.com/mates/api/fetch");

    // Build download parameters
    const params = new URLSearchParams();
    params.append("url", url);
    params.append("type", audioOnly ? "audio" : "video");
    params.append("quality", audioOnly ? "128" : "720");

    console.log(`[Download] Calling y2mate API...`);

    const response = await fetch(y2mateUrl.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    console.log(`[Download] Response status: ${response.status}`);

    if (!response.ok) {
      throw new Error(`Service returned status ${response.status}`);
    }

    const data = await response.json();

    console.log("[Download] Response data:", data);

    // Check for error in response
    if (data.error || !data.url) {
      const errorMsg = data.error || data.message || "Download failed";
      throw new Error(errorMsg);
    }

    // Determine MIME type based on format
    let mimeType = audioOnly ? "audio/mpeg" : "video/mp4";

    // Generate filename
    let filename = data.filename || data.title || `download_${Date.now()}`;
    if (!filename.includes(".")) {
      filename += audioOnly ? ".mp3" : ".mp4";
    }

    console.log(`[Download] Ready: ${filename}`);

    return {
      success: true,
      url: data.url,
      filename: filename,
      mimeType: mimeType,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[Download] Error:", errorMessage);

    // Provide helpful suggestions
    let helpfulMessage = errorMessage;
    if (errorMessage.includes("url") || errorMessage.includes("not found")) {
      helpfulMessage = "URL not found or not supported. Please try a different link.";
    } else if (errorMessage.includes("404")) {
      helpfulMessage = "Video not found or has been deleted.";
    }

    return {
      success: false,
      error: helpfulMessage,
    };
  }
}

/**
 * Download file from URL and trigger browser download
 */
export async function downloadFile(
  url: string,
  filename: string
): Promise<void> {
  try {
    console.log(`[Download] Starting file download: ${filename}`);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    const blob = await response.blob();

    if (blob.size === 0) {
      throw new Error("Downloaded file is empty");
    }

    // Create object URL and trigger download
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);

    console.log(`[Download] Triggering download for: ${filename}`);
    link.click();

    // Cleanup
    setTimeout(() => {
      window.URL.revokeObjectURL(objectUrl);
      document.body.removeChild(link);
    }, 100);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to download file: ${errorMessage}`);
  }
}

/**
 * Get list of supported platforms
 */
export function getSupportedPlatforms(): string[] {
  return [
    "YouTube",
    "Instagram",
    "TikTok",
    "Twitter/X",
    "Facebook",
    "Spotify",
    "SoundCloud",
    "Twitch",
    "Reddit",
    "Pinterest",
    "And many more...",
  ];
}

/**
 * Validate if URL is supported
 */
export function isUrlSupported(url: string): boolean {
  const platform = detectPlatform(url);
  return platform !== "unknown";
}
