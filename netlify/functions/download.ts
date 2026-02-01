import { detectPlatform } from "../../server/utils/urlUtils";
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

    const format = ytdl.chooseFormat(info.formats, {
      quality: audioOnly ? "highestaudio" : "highest",
    });

    console.log(`[ytdl] Format:`, format.qualityLabel || "audio");

    const stream = ytdl.downloadFromInfo(info, { format });
    const chunks: Buffer[] = [];

    const buffer = await new Promise<Buffer>((resolve, reject) => {
      stream.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
      });
      stream.on("end", () => {
        resolve(Buffer.concat(chunks));
      });
      stream.on("error", reject);
    });

    console.log(`[ytdl] Downloaded: ${buffer.byteLength} bytes`);

    if (buffer.byteLength === 0) {
      throw new Error("Empty file");
    }

    // Get filename from video title
    const title = info.videoDetails.title
      .replace(/[^\w\s-]/g, "")
      .slice(0, 100);
    const ext = audioOnly ? "mp3" : "mp4";
    const filename = `${title}.${ext}`;

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
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
      body: base64,
      isBase64Encoded: true,
    };
  } catch (error: any) {
    console.error("[Handler] Error:", error);

    let msg = error.message || "Download failed";

    // Friendly errors
    if (msg.includes("unavailable") || msg.includes("ENOTFOUND")) {
      msg = "Video not available. Please try a different link.";
    } else if (msg.includes("timeout")) {
      msg = "Download timed out. Please try again.";
    } else if (msg.includes("Empty")) {
      msg = "No content found.";
    } else if (msg.includes("privat")) {
      msg = "This video is private.";
    }

    return {
      statusCode: 400,
      body: JSON.stringify({ error: msg }),
    };
  }
}
