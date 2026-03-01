/**
 * Download API Integration
 * Uses backend proxy to avoid CORS issues
 */

export interface DownloadResult {
  success: boolean;
  url?: string;
  filename?: string;
  error?: string;
}

/**
 * Detect platform from URL
 */
export function detectPlatform(url: string): string {
  const lowerUrl = url.toLowerCase();

  if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) {
    return "youtube";
  } else if (lowerUrl.includes("instagram.com")) {
    return "instagram";
  } else if (lowerUrl.includes("tiktok.com")) {
    return "tiktok";
  } else if (lowerUrl.includes("twitter.com") || lowerUrl.includes("x.com")) {
    return "twitter";
  } else if (lowerUrl.includes("facebook.com")) {
    return "facebook";
  } else if (lowerUrl.includes("spotify.com")) {
    return "spotify";
  } else if (lowerUrl.includes("soundcloud.com")) {
    return "soundcloud";
  } else if (lowerUrl.includes("twitch.tv")) {
    return "twitch";
  } else if (lowerUrl.includes("reddit.com")) {
    return "reddit";
  } else if (lowerUrl.includes("pinterest.com")) {
    return "pinterest";
  }

  return "unknown";
}

export const SUPPORTED_PLATFORMS = [
  { value: "youtube", label: "YouTube" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "twitter", label: "Twitter/X" },
  { value: "facebook", label: "Facebook" },
  { value: "spotify", label: "Spotify" },
  { value: "soundcloud", label: "SoundCloud" },
  { value: "twitch", label: "Twitch" },
  { value: "reddit", label: "Reddit" },
  { value: "pinterest", label: "Pinterest" },
];

/**
 * Download media - calls backend proxy endpoint
 * Backend handles the API call to avoid CORS issues
 */
export async function downloadMediaAPI(
  url: string,
  audioOnly: boolean = false,
  quality: string = "720",
  platform?: string
): Promise<DownloadResult> {
  try {
    // Auto-detect platform if not provided
    const detectedPlatform = platform || detectPlatform(url);

    console.log(`[Download] Calling backend proxy for: ${url}`);
    console.log(`[Download] Platform: ${detectedPlatform}`);
    console.log(`[Download] Quality: ${quality}, Audio only: ${audioOnly}`);

    const response = await fetch("/api/download", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: url.trim(),
        audioOnly: audioOnly,
        quality: quality,
        platform: detectedPlatform,
      }),
    });

    console.log(`[Download] Backend response status: ${response.status}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.error || `Error: ${response.status}`;
      console.error("[Download] Backend error:", errorMsg);
      throw new Error(errorMsg);
    }

    const data = await response.json();

    console.log("[Download] Got download link from backend");

    if (!data.url) {
      throw new Error("No download link received");
    }

    return {
      success: true,
      url: data.url,
      filename: data.filename || `download_${Date.now()}.${audioOnly ? "mp3" : "mp4"}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[Download] Error:", errorMessage);

    let helpfulMessage = errorMessage;
    if (errorMessage.includes("Failed to fetch")) {
      helpfulMessage = "Connection error. Please check your internet and try again.";
    } else if (errorMessage.includes("404")) {
      helpfulMessage = "Video not found. Please check the URL.";
    } else if (errorMessage.includes("not found") || errorMessage.includes("Invalid")) {
      helpfulMessage = "URL not supported or video not accessible.";
    }

    // Add helpful suggestions based on error
    if (helpfulMessage.includes("service") || helpfulMessage.includes("unavailable")) {
      helpfulMessage += " All download services are temporarily unavailable. This sometimes happens if servers are overloaded. Please try again in a few moments.";
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
      throw new Error(`Failed to download: ${response.statusText}`);
    }

    const blob = await response.blob();

    if (blob.size === 0) {
      throw new Error("Downloaded file is empty");
    }

    // Create download link
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);

    console.log(`[Download] Triggering download: ${filename}`);
    link.click();

    // Cleanup
    setTimeout(() => {
      window.URL.revokeObjectURL(objectUrl);
      document.body.removeChild(link);
    }, 100);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Download failed: ${errorMessage}`);
  }
}
