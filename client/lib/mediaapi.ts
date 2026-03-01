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
 * Get the API key from environment variables
 */
function getApiKey(): string {
  const key = import.meta.env.VITE_MEDIAAPI_KEY;
  if (!key) {
    throw new Error(
      "MediaAPI key not configured. Please set VITE_MEDIAAPI_KEY environment variable."
    );
  }
  return key;
}

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
 * Download media using MediaAPI
 */
export async function downloadMediaAPI(
  url: string,
  audioOnly: boolean = false
): Promise<DownloadResult> {
  try {
    const apiKey = getApiKey();
    const platform = detectPlatform(url);

    console.log(`[MediaAPI] Downloading from ${platform}: ${url}`);

    // Call MediaAPI endpoint
    const mediaApiUrl = new URL("https://mediaapi.p.rapidapi.com/api/downloader");
    mediaApiUrl.searchParams.append("url", url);
    if (audioOnly) {
      mediaApiUrl.searchParams.append("format", "audio");
    }

    const response = await fetch(mediaApiUrl.toString(), {
      method: "GET",
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": "mediaapi.p.rapidapi.com",
      },
    });

    console.log(`[MediaAPI] Response status: ${response.status}`);

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`[MediaAPI] API Error:`, errorData);
      
      if (response.status === 403) {
        throw new Error(
          "API key invalid or quota exceeded. Please check your RapidAPI key."
        );
      } else if (response.status === 429) {
        throw new Error(
          "Too many requests. Please wait a moment and try again."
        );
      } else if (response.status === 400) {
        throw new Error(
          "Invalid URL. Please make sure the link is valid and supported."
        );
      }
      
      throw new Error(`API returned status ${response.status}`);
    }

    const data = await response.json();

    console.log("[MediaAPI] Response data:", data);

    // Check for error in response
    if (data.error || !data.url) {
      const errorMsg = data.error || data.message || "Download failed";
      throw new Error(errorMsg);
    }

    // Determine MIME type based on format
    let mimeType = "video/mp4";
    if (audioOnly || data.format === "mp3" || data.type === "audio") {
      mimeType = "audio/mpeg";
    } else if (data.format === "mp4" || data.type === "video") {
      mimeType = "video/mp4";
    }

    // Generate filename
    let filename = data.filename || `download_${Date.now()}`;
    if (!filename.includes(".")) {
      filename += audioOnly ? ".mp3" : ".mp4";
    }

    console.log(`[MediaAPI] Download ready: ${filename}`);

    return {
      success: true,
      url: data.url,
      filename: filename,
      mimeType: mimeType,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[MediaAPI] Error:", errorMessage);

    return {
      success: false,
      error: errorMessage,
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
