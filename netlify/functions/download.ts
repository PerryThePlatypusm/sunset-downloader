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

// Cobalt API - Free multi-platform downloader
async function downloadViaCobalt(
  url: string,
  audioOnly: boolean
): Promise<Buffer> {
  const cobaltUrl = "https://api.cobalt.tools/api/json";

  const response = await fetch(cobaltUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: url,
      downloadMode: audioOnly ? "audio" : "video",
      audioFormat: audioOnly ? "mp3" : undefined,
      videoCodec: audioOnly ? undefined : "h264",
      quality: audioOnly ? "128" : "720",
      isAudioOnly: audioOnly,
      isTtsFetch: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Cobalt API error: ${response.status}`);
  }

  const data = (await response.json()) as any;

  if (data.status === "error") {
    throw new Error(data.error?.message || "Download failed via Cobalt");
  }

  if (!data.url) {
    throw new Error("No download URL returned from Cobalt API");
  }

  // Download the file from the URL provided by Cobalt
  const fileResponse = await fetch(data.url);
  if (!fileResponse.ok) {
    throw new Error(`Failed to download file: ${fileResponse.status}`);
  }

  const buffer = await fileResponse.arrayBuffer();
  return Buffer.from(buffer);
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

    let fileBuffer: Buffer;
    let fileName: string;
    const timestamp = new Date().toISOString().slice(0, 10);
    const extension = audioOnly ? "mp3" : "mp4";

    try {
      // Use ytdl-core for YouTube (best quality and speed)
      if (detectedPlatform === "youtube") {
        const videoInfo = await ytdl.getInfo(normalizedUrl);
        const title = videoInfo.videoDetails.title
          .replace(/[<>:"/\\|?*]/g, "")
          .substring(0, 100);

        let format;
        if (audioOnly) {
          format = ytdl.chooseFormat(videoInfo.formats, {
            quality: "highestaudio",
          });
        } else {
          const qualityNumber = parseInt(quality || "720");
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

        const stream = ytdl(normalizedUrl, { format });
        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
          chunks.push(chunk as Buffer);
        }

        fileBuffer = Buffer.concat(chunks);
        fileName = `${title}.${extension}`;
      } else {
        // Use Cobalt API for other platforms
        fileBuffer = await downloadViaCobalt(normalizedUrl, audioOnly || false);
        fileName = `media_${timestamp}.${extension}`;
      }

      const base64 = fileBuffer.toString("base64");

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

      let errorMessage = "Failed to download media";
      const errorStr = downloadError.message?.toLowerCase() || "";

      if (
        errorStr.includes("private") ||
        errorStr.includes("authentication")
      ) {
        errorMessage =
          "This content requires authentication or is not publicly available.";
      } else if (
        errorStr.includes("unavailable") ||
        errorStr.includes("removed")
      ) {
        errorMessage =
          "This content is unavailable or has been removed. Please check the link.";
      } else if (errorStr.includes("404")) {
        errorMessage = "The content could not be found. Please check the URL.";
      } else if (errorStr.includes("age")) {
        errorMessage =
          "This content is age-restricted. Please verify access.";
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
