import {
  normalizeUrl,
  isValidUrl,
  detectPlatform,
} from "../../server/utils/urlUtils";
import ytdl from "ytdl-core";

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

export async function handler(event: any) {
  try {
    const body = JSON.parse(event.body || "{}") as DownloadRequest;
    const { url, platform, quality, audioOnly } = body;

    // Validate URL
    if (!url || typeof url !== "string" || !url.trim()) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "URL is required" }),
      };
    }

    // Normalize and validate URL
    let normalizedUrl: string;
    try {
      normalizedUrl = normalizeUrl(url);
    } catch {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid URL format" }),
      };
    }

    if (!isValidUrl(normalizedUrl)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid URL format" }),
      };
    }

    // Detect platform
    let detectedPlatform = platform;
    if (!detectedPlatform) {
      detectedPlatform = detectPlatform(normalizedUrl);
    }

    if (!detectedPlatform || !SUPPORTED_PLATFORMS.includes(detectedPlatform)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: `Unsupported platform. Supported: ${SUPPORTED_PLATFORMS.join(", ")}`,
        }),
      };
    }

    // Only YouTube works directly with ytdl-core
    if (detectedPlatform !== "youtube") {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: `${detectedPlatform} is not yet supported. Currently only YouTube is supported.`,
          info: "Check back soon for more platform support!",
        }),
      };
    }

    try {
      // Get video info
      const videoInfo = await ytdl.getInfo(normalizedUrl);
      const title = videoInfo.videoDetails.title
        .replace(/[<>:"/\\|?*]/g, "")
        .substring(0, 100);

      let format;
      if (audioOnly) {
        // Get best audio format
        format = ytdl.chooseFormat(videoInfo.formats, {
          quality: "highestaudio",
        });
      } else {
        // Get best video format based on quality selection
        let qualityNumber = parseInt(quality || "720");
        format = ytdl.chooseFormat(videoInfo.formats, {
          quality: qualityNumber,
        });
      }

      if (!format) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: "No suitable format found for this video",
          }),
        };
      }

      // Download the stream
      const stream = ytdl(normalizedUrl, { format });

      // Collect chunks
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk as Buffer);
      }

      const fileBuffer = Buffer.concat(chunks);
      const base64 = fileBuffer.toString("base64");
      const extension = audioOnly ? "mp3" : "mp4";
      const fileName = `${title}.${extension}`;

      return {
        statusCode: 200,
        headers: {
          "Content-Type": audioOnly ? "audio/mpeg" : "video/mp4",
          "Content-Disposition": `attachment; filename="${fileName}"`,
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
        body: base64,
        isBase64Encoded: true,
      };
    } catch (downloadError: any) {
      console.error("Download error:", downloadError);

      // Friendly error messages
      let errorMessage = "Failed to download video";
      if (downloadError.message?.includes("Sign in")) {
        errorMessage =
          "This video requires authentication. Please check if it's publicly available.";
      } else if (downloadError.message?.includes("unavailable")) {
        errorMessage =
          "This video is unavailable or has been removed. Please try a different video.";
      } else if (downloadError.message?.includes("private")) {
        errorMessage =
          "This is a private video. Please check the link and permissions.";
      }

      return {
        statusCode: 400,
        body: JSON.stringify({
          error: errorMessage,
          details: downloadError.message,
        }),
      };
    }
  } catch (error) {
    console.error("Download error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return {
      statusCode: 500,
      body: JSON.stringify({ error: errorMessage }),
    };
  }
}
