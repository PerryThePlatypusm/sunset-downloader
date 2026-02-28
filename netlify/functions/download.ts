import ytdl from "ytdl-core";

// Platform detection patterns
const PLATFORM_PATTERNS: Record<string, RegExp> = {
  youtube: /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/|youtu\.be\/)[\w-]+/i,
  spotify: /(?:https?:\/\/)?(?:www\.)?spotify\.com\/(?:track|album|playlist)\/[\w]+/i,
  instagram: /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel|stories)\/[\w-]+/i,
  twitter: /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/\w+\/status\/\d+/i,
  tiktok: /(?:https?:\/\/)?(?:www\.)?(?:tiktok\.com\/@[\w.]+\/video\/|vm\.tiktok\.com\/)[\w]+/i,
  soundcloud: /(?:https?:\/\/)?(?:www\.)?soundcloud\.com\/[\w-]+\/[\w-]+/i,
  facebook: /(?:https?:\/\/)?(?:www\.)?facebook\.com\/(?:watch\?v=|video\.php\?v=)[\w]+/i,
  twitch: /(?:https?:\/\/)?(?:www\.)?twitch\.tv\/(?:videos\/|[\w]+\/)/i,
  crunchyroll: /(?:https?:\/\/)?(?:www\.)?crunchyroll\.com\/(?:series|watch)\/[\w-]+/i,
  hianime: /(?:https?:\/\/)?(?:www\.)?hianime\.to\/(?:anime|watch)\/[\w-]+/i,
  reddit: /(?:https?:\/\/)?(?:www\.)?reddit\.com\/r\/\w+\/comments\/[\w]+/i,
  pinterest: /(?:https?:\/\/)?(?:www\.)?pinterest\.com\/(?:pin|user)\/[\w]+/i,
};

function detectPlatform(url: string): string | null {
  const trimmedUrl = url.trim();
  for (const [platform, pattern] of Object.entries(PLATFORM_PATTERNS)) {
    if (pattern.test(trimmedUrl)) {
      return platform;
    }
  }
  return null;
}

const SUPPORTED_PLATFORMS = [
  "youtube",
  "spotify",
  "instagram",
  "twitter",
  "tiktok",
  "soundcloud",
  "facebook",
  "twitch",
  "crunchyroll",
  "hianime",
  "reddit",
  "pinterest",
];

interface DownloadRequest {
  url: string;
  platform?: string;
  quality?: string;
  audioOnly?: boolean;
  episodes?: number[];
}

// YouTube downloads using ytdl-core
async function downloadViaYtdl(
  url: string,
  audioOnly: boolean,
): Promise<{ buffer: Buffer; filename: string }> {
  console.log(`[ytdl] Starting download for: ${url}`);
  console.log(`[ytdl] Audio only: ${audioOnly}`);

  try {
    const info = await ytdl.getInfo(url);
    console.log(`[ytdl] Got video info:`, info.videoDetails.title);

    const formats = info.formats;
    if (!formats || formats.length === 0) {
      throw new Error("No downloadable formats found. This video may not be available for download.");
    }

    // For audio: prefer MP4 container with audio codec for compatibility
    // For video: prefer MP4 with both video and audio
    let format;
    if (audioOnly) {
      // Choose audio with mp4 container for maximum compatibility
      format = ytdl.chooseFormat(formats, {
        quality: "highestaudio",
        filter: (f) => {
          return (
            f.hasAudio &&
            !f.hasVideo &&
            (f.container === "mp4" || f.mimeType?.includes("audio"))
          );
        },
      });

      // Fallback to any audio if mp4 not available
      if (!format) {
        format = ytdl.chooseFormat(formats, { quality: "highestaudio" });
      }
    } else {
      // Choose video with audio in mp4 container for maximum compatibility
      format = ytdl.chooseFormat(formats, {
        quality: "highest",
        filter: (f) => {
          return f.container === "mp4" && f.hasVideo && f.hasAudio;
        },
      });

      // Fallback to highest quality if mp4 not available
      if (!format) {
        format = ytdl.chooseFormat(formats, { quality: "highest" });
      }
    }

    if (!format) {
      throw new Error(
        audioOnly
          ? "No audio format available for this video."
          : "No video format available for this video."
      );
    }

    console.log(`[ytdl] Format:`, {
      qualityLabel: format.qualityLabel || "audio",
      container: format.container,
      hasAudio: format.hasAudio,
      hasVideo: format.hasVideo,
      mimeType: format.mimeType,
    });

    const stream = ytdl.downloadFromInfo(info, { format });
    const chunks: Buffer[] = [];

    const buffer = await new Promise<Buffer>((resolve, reject) => {
      let dataReceived = false;
      stream.on("data", (chunk: Buffer) => {
        dataReceived = true;
        if (chunk.length > 0) {
          chunks.push(chunk);
        }
      });
      stream.on("end", () => {
        if (!dataReceived) {
          reject(new Error("No data received from stream"));
        } else {
          resolve(Buffer.concat(chunks));
        }
      });
      stream.on("error", (err) => {
        console.error(`[ytdl] Stream error:`, err);
        reject(err);
      });
    });

    // Validate file size - should be at least a few KB
    const minFileSize = 10000; // 10KB minimum
    if (buffer.byteLength < minFileSize) {
      console.warn(`[ytdl] File too small: ${buffer.byteLength} bytes`);
      throw new Error("Downloaded file is too small or corrupt. Please try another video.");
    }

    console.log(`[ytdl] Downloaded: ${buffer.byteLength} bytes`);

    // Validate file header for MP3 or MP4
    const fileHeader = buffer.slice(0, 4).toString("hex");
    if (audioOnly) {
      // MP3 files start with FFE or ID3
      if (!fileHeader.startsWith("ffe") && !fileHeader.startsWith("4944")) {
        console.warn(`[ytdl] Invalid MP3 header: ${fileHeader}`);
        throw new Error("Downloaded audio file appears to be corrupt. Please try again.");
      }
    } else {
      // MP4 files have ftyp at offset 4
      const mp4Header = buffer.slice(4, 8).toString("ascii");
      if (mp4Header !== "ftyp") {
        console.warn(`[ytdl] Invalid MP4 header: ${fileHeader}, ${mp4Header}`);
        throw new Error("Downloaded video file appears to be corrupt. Please try again.");
      }
    }

    // Get filename from video title
    const title = info.videoDetails.title
      .replace(/[^\w\s-]/g, "")
      .slice(0, 100)
      .trim();
    const ext = audioOnly ? "mp3" : "mp4";
    const filename = `${title || "download"}.${ext}`;

    return {
      buffer,
      filename,
    };
  } catch (error) {
    console.error(`[ytdl] Error:`, error);
    throw error;
  }
}

export async function handler(event: any) {
  console.log("[Handler] Request received");

  try {
    let body: DownloadRequest;
    try {
      body = JSON.parse(event.body || "{}") as DownloadRequest;
    } catch (e) {
      console.error("[Handler] Parse error:", e);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid request" }),
      };
    }

    const { url, platform, quality, audioOnly } = body;
    console.log("[Handler] URL:", url);
    console.log("[Handler] Platform:", platform);
    console.log("[Handler] AudioOnly:", audioOnly);

    // Validate URL
    if (!url || typeof url !== "string" || !url.trim()) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "URL is required" }),
      };
    }

    const trimmedUrl = url.trim();

    // Detect platform
    let detectedPlatform = platform || detectPlatform(trimmedUrl);
    console.log("[Handler] Detected platform:", detectedPlatform);

    if (!detectedPlatform || !SUPPORTED_PLATFORMS.includes(detectedPlatform)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: `Unsupported platform`,
        }),
      };
    }

    console.log("[Handler] Starting download...");

    // Only YouTube is fully supported with ytdl-core
    if (detectedPlatform !== "youtube") {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: `${detectedPlatform.charAt(0).toUpperCase() + detectedPlatform.slice(1)} downloads coming soon! Currently only YouTube is supported.`,
        }),
      };
    }

    // Download using ytdl-core
    const { buffer, filename } = await downloadViaYtdl(
      trimmedUrl,
      audioOnly || false,
    );

    const base64 = buffer.toString("base64");

    console.log("[Handler] Success:", filename);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": audioOnly ? "audio/mpeg" : "video/mp4",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buffer.byteLength.toString(),
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
      body: base64,
      isBase64Encoded: true,
    };
  } catch (error: any) {
    console.error("[Handler] Error:", error);

    let msg = error.message || "Download failed. Please try again.";
    const msgLower = msg.toLowerCase();

    // Comprehensive error message handling
    if (error.statusCode === 410 || msgLower.includes("410")) {
      msg = "Video is not available. It may be deleted, private, or age-restricted.";
    } else if (error.statusCode === 403 || msgLower.includes("403")) {
      msg = "Access denied. This video may be restricted in your region or requires payment.";
    } else if (error.statusCode === 404 || msgLower.includes("404")) {
      msg = "Video not found. Please check the URL is correct.";
    } else if (error.statusCode === 429 || msgLower.includes("429")) {
      msg = "Rate limited. Please wait a moment and try again.";
    } else if (msgLower.includes("unavailable")) {
      msg = "Video is unavailable. It may have been removed or restricted.";
    } else if (msgLower.includes("enotfound") || msgLower.includes("network")) {
      msg = "Network error. Please check your connection and try again.";
    } else if (msgLower.includes("econnrefused")) {
      msg = "Could not connect to video service. Please try again.";
    } else if (msgLower.includes("age") || msgLower.includes("restricted")) {
      msg = "This video is age-restricted and cannot be downloaded.";
    } else if (msgLower.includes("private")) {
      msg = "This video is private and cannot be downloaded.";
    } else if (msgLower.includes("copyrighted") || msgLower.includes("copyright")) {
      msg = "This video has copyright protection and cannot be downloaded.";
    } else if (msgLower.includes("blocked") || msgLower.includes("not allowed")) {
      msg = "This video is blocked from downloading in your region.";
    } else if (msgLower.includes("no formats") || msgLower.includes("no suitable")) {
      msg = "No downloadable formats available for this video.";
    } else if (msgLower.includes("empty")) {
      msg = "Download resulted in empty file. Please try another video.";
    } else if (msgLower.includes("timeout")) {
      msg = "Download timed out. The video may be very large. Please try again.";
    } else if (msgLower.includes("invalid") || msgLower.includes("not a youtube")) {
      msg = "Invalid URL. Please check it's a correct YouTube link.";
    } else if (msgLower.includes("extracted")) {
      msg = "Could not extract video information. The link may be invalid.";
    }

    return {
      statusCode: 400,
      body: JSON.stringify({ error: msg }),
    };
  }
}
