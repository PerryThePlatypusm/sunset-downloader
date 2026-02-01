import { RequestHandler } from "express";
import { detectPlatform, isValidUrl, normalizeUrl } from "../utils/urlUtils";

interface DownloadRequest {
  url: string;
  platform?: string;
  quality?: string;
  audioOnly?: boolean;
  episodes?: number[];
}

interface DownloadResponse {
  error?: string;
  success?: boolean;
  file?: string;
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

export const handleDownload: RequestHandler = async (req, res) => {
  try {
    const body = req.body as DownloadRequest;
    const { url, platform, quality, audioOnly, episodes } = body;

    // Validate URL presence
    if (!url || typeof url !== "string" || !url.trim()) {
      return res.status(400).json({ error: "URL is required" });
    }

    if (url.length > 2048) {
      return res.status(400).json({ error: "URL is too long" });
    }

    // Normalize and validate URL format
    let normalizedUrl: string;
    try {
      normalizedUrl = normalizeUrl(url);
    } catch (error) {
      return res.status(400).json({ error: "Invalid URL format" });
    }

    if (!isValidUrl(normalizedUrl)) {
      return res.status(400).json({ error: "Invalid URL format" });
    }

    // Detect platform if not provided
    let detectedPlatform = platform;
    if (!detectedPlatform) {
      detectedPlatform = detectPlatform(normalizedUrl);
    }

    // Validate platform
    if (!detectedPlatform || !SUPPORTED_PLATFORMS.includes(detectedPlatform)) {
      return res.status(400).json({
        error: `Unsupported platform. Supported: ${SUPPORTED_PLATFORMS.join(", ")}`,
      });
    }

    // Validate quality
    const qualityType = audioOnly ? "audio" : "video";
    const selectedQuality = quality || DEFAULT_QUALITY[qualityType];

    // Validate quality format
    if (!selectedQuality) {
      return res.status(400).json({
        error: `Invalid quality specified for ${qualityType}`,
      });
    }

    // Special validation for Spotify
    if (detectedPlatform === "spotify" && !audioOnly) {
      return res.status(400).json({
        error: "Spotify only supports audio downloads (not video)",
      });
    }

    // Validate episodes for anime platforms
    const isAnimePlatform =
      detectedPlatform === "crunchyroll" || detectedPlatform === "hianime";

    if (isAnimePlatform) {
      if (!episodes || episodes.length === 0) {
        return res.status(400).json({
          error: "Please select at least one episode to download",
        });
      }

      // Validate episode numbers
      const validEpisodes = episodes.filter(
        (ep) => Number.isInteger(ep) && ep > 0 && ep <= 1000,
      );

      if (validEpisodes.length === 0) {
        return res.status(400).json({
          error: "Invalid episode numbers provided",
        });
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
            0x00, 0x00, 0x22, // Metadata block size (34 bytes)
            0x00, 0x00, 0x00, 0x10, // Min block size
            0x00, 0x00, 0x00, 0x10, // Max block size
            0x00, 0x00, 0x00, 0x00, // Min frame size
            0x00, 0x00, 0x00, 0x00, // Max frame size
            0xac, 0x44, 0x00, // Sample rate (44100 Hz)
            0x03, // Channels (2) + bits per sample
            0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // Total samples
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // MD5
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
            0xff, 0xf1, // ADTS sync
            0x50, // Profile, sample rate, private bit
            0x80, // Channel config + frame length info
            0x1f, // Frame length
            0xfc, // Buffer fullness
            0x00, // Raw data blocks
          ]);
          mockContent = Buffer.concat([
            adtsHeader,
            Buffer.alloc(20480, 0x00),
          ]);
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
            Buffer.from([0x01, 0x02, 0x38, 0x01, 0x80, 0xbb, 0x00, 0x00, 0x00, 0x00, 0x00]),
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
      // MP4 header + mock data (about 50KB)
      const mp4Header = Buffer.from([
        0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d,
        0x00, 0x00, 0x00, 0x00,
      ]);
      const mockData = Buffer.alloc(51200, 0x00);
      mockContent = Buffer.concat([mp4Header, mockData]);
      mimeType = "video/mp4";
    }

    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Length", mockContent.length.toString());
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    return res.send(mockContent);
  } catch (error) {
    console.error("Download error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return res.status(500).json({ error: errorMessage });
  }
};

export const validateUrl: RequestHandler = (req, res) => {
  try {
    const { url } = req.body as { url?: string };

    if (!url || typeof url !== "string" || !url.trim()) {
      return res.status(400).json({
        valid: false,
        error: "URL is required",
      });
    }

    const normalizedUrl = normalizeUrl(url);
    const valid = isValidUrl(normalizedUrl);
    const platform = detectPlatform(normalizedUrl);

    if (!valid) {
      return res.json({
        valid: false,
        error: "Invalid URL format",
      });
    }

    if (!platform || !SUPPORTED_PLATFORMS.includes(platform)) {
      return res.json({
        valid: false,
        detected: platform,
        error: "Platform not supported or invalid URL for that platform",
      });
    }

    res.json({
      valid: true,
      platform,
      url: normalizedUrl,
    });
  } catch (error) {
    console.error("Validation error:", error);
    res.status(500).json({
      valid: false,
      error: "Validation failed",
    });
  }
};
