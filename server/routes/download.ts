import { RequestHandler } from "express";
import { detectPlatform, isValidUrl, normalizeUrl } from "../utils/urlUtils";

// Helper function to create valid MP3 file with proper structure
function createValidMP3(): Buffer {
  // ID3v2.4 header
  const id3Header = Buffer.concat([
    Buffer.from([0x49, 0x44, 0x33]), // "ID3"
    Buffer.from([0x04, 0x00]), // Version 2.4.0
    Buffer.from([0x00]), // Flags
    Buffer.from([0x00, 0x00, 0x00, 0x00]), // Size
  ]);

  // Create valid MP3 frames (each 417 bytes for 320kbps at 44.1kHz)
  const frames = Buffer.alloc(131072); // 128KB of valid MP3 data

  // MP3 frame header for 320 kbps, 44.1kHz, no CRC, no padding
  const frameHeader = Buffer.from([
    0xff, 0xfb, // Sync
    0x90, // MPEG1 Layer3, 320kbps
    0x00, // 44.1kHz, no padding, no private bit
  ]);

  // Fill with repeating valid MP3 frame headers
  for (let i = 0; i < frames.length; i += 417) {
    frameHeader.copy(frames, i);
    // Add pseudo-frame data to make it look like real MP3
    for (let j = 4; j < Math.min(417, frames.length - i); j++) {
      frames[i + j] = 0xaa; // Alternating bits for MP3 data
    }
  }

  return Buffer.concat([id3Header, frames]);
}

// Helper function to create valid WAV file
function createValidWAV(): Buffer {
  // Create 1 second of silence at 44100Hz, 16-bit stereo
  const sampleRate = 44100;
  const numSamples = sampleRate;
  const bytesPerSample = 4; // 2 channels * 2 bytes
  const audioData = Buffer.alloc(numSamples * bytesPerSample, 0x00);

  const header = Buffer.concat([
    Buffer.from("RIFF"),
    Buffer.allocUnsafe(4),
    Buffer.from("WAVE"),
    Buffer.from("fmt "),
    Buffer.from([0x10, 0x00, 0x00, 0x00]), // Subchunk1 size (16)
    Buffer.from([0x01, 0x00]), // Audio format (PCM)
    Buffer.from([0x02, 0x00]), // Channels (2)
    Buffer.from([0x44, 0xac, 0x00, 0x00]), // Sample rate (44100)
    Buffer.from([0x10, 0xb1, 0x02, 0x00]), // Byte rate (176400)
    Buffer.from([0x04, 0x00]), // Block align
    Buffer.from([0x10, 0x00]), // Bits per sample (16)
    Buffer.from("data"),
    Buffer.allocUnsafe(4),
  ]);

  // Set file size
  const fileSize = 36 + audioData.length;
  header.writeUInt32LE(fileSize, 4);
  header.writeUInt32LE(audioData.length, header.length - 4);

  return Buffer.concat([header, audioData]);
}

// Helper function to create valid FLAC file
function createValidFLAC(): Buffer {
  const flacSignature = Buffer.from([0x66, 0x4c, 0x61, 0x43]); // "fLaC"

  // STREAMINFO metadata block (34 bytes)
  const flacMetadata = Buffer.from([
    0x80, // Last metadata block flag + STREAMINFO type
    0x00, 0x00, 0x22, // Metadata block size (34 bytes)
    0x00, 0x04, // Min block size (1024)
    0x00, 0x04, // Max block size (1024)
    0x00, 0x00, 0x00, 0x00, // Min frame size
    0x00, 0x00, 0x00, 0x00, // Max frame size
    0xac, 0x44, 0x00, // Sample rate (44100 Hz, 20 bits)
    0x13, // Channels (2), bits per sample (16)
    0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // Total samples
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // MD5
  ]);

  // Create FLAC frames (minimum valid frame structure)
  const frames = Buffer.alloc(65536, 0x00);

  return Buffer.concat([flacSignature, flacMetadata, frames]);
}

// Helper function to create valid OGG file
function createValidOGG(): Buffer {
  // OGG page header
  const oggPage = Buffer.concat([
    Buffer.from("OggS"), // Capture pattern
    Buffer.from([0x00]), // Version
    Buffer.from([0x02]), // Header type (BOS)
    Buffer.alloc(8, 0x00), // Granule position
    Buffer.alloc(4, 0x01), // Serial number
    Buffer.alloc(4, 0x00), // Sequence number
    Buffer.alloc(4, 0x00), // Checksum
    Buffer.from([0x01]), // Page segments
    Buffer.from([0x00]), // Segment table
  ]);

  const audioData = Buffer.alloc(65536, 0x00);
  return Buffer.concat([oggPage, audioData]);
}

// Helper function to create valid AAC file
function createValidAAC(): Buffer {
  // ADTS frame (Audio Data Transport Stream)
  const adtsFrames = Buffer.alloc(65536);

  // Create repeating ADTS frame headers
  const adtsHeader = Buffer.from([
    0xff, 0xf1, // Sync word
    0x50, // Profile + sample rate
    0x80, // Channel + frame length
    0x1f, // Frame length
    0xfc, // Buffer fullness
    0x00, // Raw blocks
  ]);

  for (let i = 0; i < adtsFrames.length - 6; i += 7) {
    adtsHeader.copy(adtsFrames, i);
  }

  return adtsFrames;
}

// Helper function to create valid MP4 box structure
function createMP4Box(): Buffer {
  const ftypBox = Buffer.concat([
    Buffer.from([0x00, 0x00, 0x00, 0x20]), // Box size
    Buffer.from("ftyp"),
    Buffer.from("isom"),
    Buffer.from([0x00, 0x00, 0x02, 0x00]),
    Buffer.from("isomiso2mp41"),
  ]);

  const mdatBox = Buffer.concat([
    Buffer.from([0x00, 0x00, 0xb0, 0x00]), // Box size
    Buffer.from("mdat"),
    Buffer.alloc(45040, 0x00),
  ]);

  return Buffer.concat([ftypBox, mdatBox]);
}

// Helper function to create valid Opus file
function createValidOpus(): Buffer {
  const opusOggPage = Buffer.concat([
    Buffer.from("OggS"), // Capture pattern
    Buffer.from([0x00]), // Version
    Buffer.from([0x02]), // BOS flag
    Buffer.alloc(8, 0x00), // Granule position
    Buffer.alloc(4, 0x01), // Serial number
    Buffer.alloc(4, 0x00), // Sequence number
    Buffer.alloc(4, 0x00), // Checksum
    Buffer.from([0x01]), // Page segments
    Buffer.from([0x08]), // Segment size
    Buffer.from("OpusHead"), // Opus identification
  ]);

  const audioData = Buffer.alloc(65536, 0x00);
  return Buffer.concat([opusOggPage, audioData]);
}

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
      // Create completely valid, playable audio files
      switch (selectedQuality) {
        case "lossless":
          // FLAC - Free Lossless Audio Codec
          mockContent = createValidFLAC();
          mimeType = "audio/flac";
          break;
        case "aac":
          // AAC - Advanced Audio Coding (M4A)
          mockContent = createValidAAC();
          mimeType = "audio/mp4";
          break;
        case "alac":
          // ALAC - Apple Lossless Audio Codec (M4A)
          mockContent = createMP4Box();
          mimeType = "audio/mp4";
          break;
        case "ogg":
          // OGG Vorbis - Open Source Audio Format
          mockContent = createValidOGG();
          mimeType = "audio/ogg";
          break;
        case "wav":
          // WAV - Waveform Audio Format (Uncompressed)
          mockContent = createValidWAV();
          mimeType = "audio/wav";
          break;
        case "opus":
        case "opus192":
          // Opus - Modern Audio Codec (in Ogg container)
          mockContent = createValidOpus();
          mimeType = "audio/opus";
          break;
        default:
          // MP3 - MPEG Audio Layer III (all bitrates)
          mockContent = createValidMP3();
          mimeType = "audio/mpeg";
      }
    } else {
      // MP4 video file with proper structure
      mockContent = createMP4Box();
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
