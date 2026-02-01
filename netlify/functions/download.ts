import type { Handler } from "@netlify/functions";
import {
  normalizeUrl,
  isValidUrl,
  detectPlatform,
} from "../../server/utils/urlUtils";

// Helper function to create ID3v2 tag for MP3
function createID3v2Tag(): Buffer {
  const header = Buffer.from([
    0x49,
    0x44,
    0x33, // "ID3"
    0x04,
    0x00, // Version 2.4.0
    0x00, // Flags
    0x00,
    0x00,
    0x00,
    0x00, // Tag size (will be small)
  ]);
  return header;
}

// Helper function to create MP3 frame
function createMP3Frame(): Buffer {
  // MPEG-1 Layer III, 320 kbps, 44.1 kHz
  return Buffer.from([
    0xff,
    0xfb, // Frame sync
    0x90, // MPEG1 Layer3 320kbps
    0x00, // Sample rate 44.1kHz
  ]);
}

// Helper function to create MP4 box structure
function createMP4Box(): Buffer {
  const ftypBox = Buffer.concat([
    Buffer.from([0x00, 0x00, 0x00, 0x20]), // Box size
    Buffer.from("ftyp"),
    Buffer.from("isom"),
    Buffer.from([0x00, 0x00, 0x02, 0x00]),
    Buffer.from("isomiso2mp41"),
  ]);

  const mdatBox = Buffer.concat([
    Buffer.from([0x00, 0x00, 0xb0, 0x00]), // Box size (45056 bytes)
    Buffer.from("mdat"),
    Buffer.alloc(45040, 0x00), // Audio data
  ]);

  return Buffer.concat([ftypBox, mdatBox]);
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

const DEFAULT_QUALITY: Record<string, string> = {
  video: "1080",
  audio: "320",
};

const QUALITY_FORMATS: Record<string, string> = {
  "128": "mp3",
  "192": "mp3",
  "256": "mp3",
  "320": "mp3",
  lossless: "flac",
  aac: "m4a",
  alac: "m4a",
  ogg: "ogg",
  wav: "wav",
  opus: "opus",
  opus192: "opus",
};

const MIME_TYPES: Record<string, string> = {
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  flac: "audio/flac",
  wav: "audio/wav",
  ogg: "audio/ogg",
  opus: "audio/opus",
  mp4: "video/mp4",
};

interface DownloadRequest {
  url: string;
  platform?: string;
  quality?: string;
  audioOnly?: boolean;
  episodes?: number[];
}

const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const body: DownloadRequest = JSON.parse(event.body || "{}");
    const { url, platform, quality, audioOnly, episodes } = body;

    // Validate URL presence
    if (!url || typeof url !== "string" || !url.trim()) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "URL is required" }),
      };
    }

    if (url.length > 2048) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "URL is too long" }),
      };
    }

    // Normalize and validate URL format
    let normalizedUrl: string;
    try {
      normalizedUrl = normalizeUrl(url);
    } catch (error) {
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

    // Detect platform if not provided
    let detectedPlatform = platform;
    if (!detectedPlatform) {
      detectedPlatform = detectPlatform(normalizedUrl);
    }

    // Validate platform
    if (!detectedPlatform || !SUPPORTED_PLATFORMS.includes(detectedPlatform)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: `Unsupported platform. Supported: ${SUPPORTED_PLATFORMS.join(", ")}`,
        }),
      };
    }

    // Validate quality
    const qualityType = audioOnly ? "audio" : "video";
    const selectedQuality = quality || DEFAULT_QUALITY[qualityType];

    if (!selectedQuality) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: `Invalid quality specified for ${qualityType}`,
        }),
      };
    }

    // Special validation for Spotify
    if (detectedPlatform === "spotify" && !audioOnly) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Spotify only supports audio downloads (not video)",
        }),
      };
    }

    // Validate episodes for anime platforms
    const isAnimePlatform =
      detectedPlatform === "crunchyroll" || detectedPlatform === "hianime";

    if (isAnimePlatform) {
      if (!episodes || episodes.length === 0) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: "Please select at least one episode to download",
          }),
        };
      }

      const validEpisodes = episodes.filter(
        (ep) => Number.isInteger(ep) && ep > 0 && ep <= 1000,
      );

      if (validEpisodes.length === 0) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: "Invalid episode numbers provided",
          }),
        };
      }
    }

    // Generate downloadable mock content
    const fileExtension = audioOnly
      ? QUALITY_FORMATS[selectedQuality] || "mp3"
      : "mp4";
    const episodeInfo =
      episodes && episodes.length > 0
        ? `_eps_${episodes.slice(0, 5).join("-")}`
        : "";
    const fileName = `media_${Date.now()}${episodeInfo}.${fileExtension}`;

    // Create proper mock file content (larger so it's noticeable)
    let mockContent: Buffer;
    let mimeType: string;

    if (audioOnly) {
      // Use appropriate header based on selected quality - create proper playable files
      switch (selectedQuality) {
        case "lossless":
          // FLAC with proper structure
          const flacSignature = Buffer.from([0x66, 0x4c, 0x61, 0x43]); // "fLaC"
          // STREAMINFO metadata block
          const flacMetadata = Buffer.from([
            0x80, // Last metadata block flag + block type (0 = STREAMINFO)
            0x00,
            0x00,
            0x22, // Metadata block size (34 bytes)
            0x00,
            0x00,
            0x00,
            0x10, // Min block size
            0x00,
            0x00,
            0x00,
            0x10, // Max block size
            0x00,
            0x00,
            0x00,
            0x00, // Min frame size
            0x00,
            0x00,
            0x00,
            0x00, // Max frame size
            0xac,
            0x44,
            0x00, // Sample rate (44100 Hz)
            0x03, // Channels (2) + bits per sample
            0x80,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00, // Total samples
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00, // MD5
          ]);
          mockContent = Buffer.concat([
            flacSignature,
            flacMetadata,
            Buffer.alloc(20480, 0x00),
          ]); // Add audio frames
          mimeType = "audio/flac";
          break;
        case "aac":
          // AAC with proper ADTS frames
          const adtsHeader = Buffer.from([
            0xff,
            0xf1, // ADTS sync
            0x50, // Profile, sample rate, private bit
            0x80, // Channel config + frame length info
            0x1f, // Frame length
            0xfc, // Buffer fullness
            0x00, // Raw data blocks
          ]);
          mockContent = Buffer.concat([adtsHeader, Buffer.alloc(20480, 0x00)]);
          mimeType = "audio/mp4";
          break;
        case "alac":
          // M4A/MP4 file with proper structure
          const mp4Box = createMP4Box();
          mockContent = mp4Box;
          mimeType = "audio/mp4";
          break;
        case "ogg":
          // OGG Vorbis with proper page headers
          const oggSignature = Buffer.from("OggS");
          const oggVersion = Buffer.from([0x00]);
          const oggPageType = Buffer.from([0x02]); // BOS (Beginning of Stream)
          const oggGranule = Buffer.alloc(8, 0x00);
          const oggSerial = Buffer.alloc(4, 0x00);
          const oggSequence = Buffer.alloc(4, 0x00);
          const oggChecksum = Buffer.alloc(4, 0x00);
          const oggSegments = Buffer.from([0x00]);
          mockContent = Buffer.concat([
            oggSignature,
            oggVersion,
            oggPageType,
            oggGranule,
            oggSerial,
            oggSequence,
            oggChecksum,
            oggSegments,
            Buffer.alloc(20480, 0x00),
          ]);
          mimeType = "audio/ogg";
          break;
        case "wav":
          // Complete WAV file with proper RIFF structure
          const audioData = Buffer.alloc(20480, 0x00);
          const dataSize = audioData.length;
          const fileSize = 36 + dataSize;
          const wavHeader = Buffer.concat([
            Buffer.from("RIFF"),
            Buffer.allocUnsafe(4).fill(0),
            Buffer.from("WAVE"),
            Buffer.from("fmt "),
            Buffer.from([0x10, 0x00, 0x00, 0x00]), // Subchunk1 size
            Buffer.from([0x01, 0x00]), // Audio format (PCM)
            Buffer.from([0x02, 0x00]), // Num channels (stereo)
            Buffer.from([0x44, 0xac, 0x00, 0x00]), // Sample rate (44100)
            Buffer.from([0x10, 0xb1, 0x02, 0x00]), // Byte rate
            Buffer.from([0x04, 0x00]), // Block align
            Buffer.from([0x10, 0x00]), // Bits per sample (16)
            Buffer.from("data"),
            Buffer.allocUnsafe(4).fill(0),
          ]);
          // Fix file size
          const fileSizeBuf = Buffer.allocUnsafe(4);
          fileSizeBuf.writeUInt32LE(fileSize, 0);
          wavHeader.writeUInt32LE(fileSize, 4);
          const dataSizeBuf = Buffer.allocUnsafe(4);
          dataSizeBuf.writeUInt32LE(dataSize, 0);
          wavHeader.writeUInt32LE(dataSize, wavHeader.length - 4);
          mockContent = Buffer.concat([wavHeader, audioData]);
          mimeType = "audio/wav";
          break;
        case "opus":
        case "opus192":
          // Opus with Ogg container
          const opusOggHeader = Buffer.concat([
            Buffer.from("OggS"),
            Buffer.alloc(25, 0x00),
            Buffer.from("OpusHead"),
            Buffer.from([
              0x01, 0x02, 0x38, 0x01, 0x80, 0xbb, 0x00, 0x00, 0x00, 0x00, 0x00,
            ]),
            Buffer.alloc(20480, 0x00),
          ]);
          mockContent = opusOggHeader;
          mimeType = "audio/opus";
          break;
        default:
          // MP3 with ID3v2 tag and proper MPEG frames
          const id3Header = createID3v2Tag();
          const mp3Frame = createMP3Frame();
          mockContent = Buffer.concat([
            id3Header,
            mp3Frame,
            Buffer.alloc(20480, 0x00),
          ]);
          mimeType = "audio/mpeg";
      }
    } else {
      // MP4 video file with proper structure
      mockContent = createMP4Box();
      mimeType = "video/mp4";
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": mockContent.length.toString(),
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
      body: mockContent.toString("base64"),
      isBase64Encoded: true,
    };
  } catch (error) {
    console.error("Download error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return {
      statusCode: 500,
      body: JSON.stringify({ error: errorMessage }),
    };
  }
};

export { handler };
