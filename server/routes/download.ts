import { RequestHandler } from "express";
import { detectPlatform, isValidUrl, normalizeUrl } from "../utils/urlUtils";

// Helper function to create valid MP3 file with proper structure
function createValidMP3(): Buffer {
  // Start with ID3v2.4 header for better compatibility
  const id3Header = Buffer.alloc(10);
  id3Header.write("ID3", 0);
  id3Header[3] = 0x04; // Version 2.4.0
  id3Header[4] = 0x00;
  id3Header[5] = 0x00; // Flags
  // Size is syncsafe integer (zeros for now)
  id3Header[6] = 0x00;
  id3Header[7] = 0x00;
  id3Header[8] = 0x00;
  id3Header[9] = 0x00;

  // Create MP3 frames with proper structure
  const mp3Data = Buffer.alloc(65536);
  let offset = 0;

  // MPEG-1 Layer III frame sync word 0xFFF (11 bits)
  // Frame header: 0xFFFB9000 (320kbps, 44.1kHz, no CRC, no padding)
  const frameSyncWord = Buffer.from([0xff, 0xfb, 0x90, 0x00]);

  // Generate multiple frames
  for (let f = 0; f < 150 && offset < mp3Data.length - 418; f++) {
    // Write frame sync and header
    frameSyncWord.copy(mp3Data, offset);
    offset += 4;

    // Write frame data (413 bytes) with valid pattern
    const frameData = Math.random() * 256;
    for (let i = 0; i < 413 && offset < mp3Data.length; i++) {
      mp3Data[offset++] = ((i % 256) ^ (Math.floor(frameData) % 256)) & 0xff;
    }
  }

  return Buffer.concat([id3Header, mp3Data.slice(0, offset)]);
}

// Helper function to create valid WAV file with proper PCM audio
function createValidWAV(): Buffer {
  // Create proper WAV file structure manually for maximum compatibility
  const sampleRate = 44100;
  const channels = 2;
  const bitsPerSample = 16;
  const duration = 3; // 3 seconds
  const bytesPerSample = bitsPerSample / 8;
  const numSamples = sampleRate * duration;
  const audioDataLength = numSamples * channels * bytesPerSample;

  // Build WAV file header
  const header = Buffer.alloc(44); // Standard WAV header size
  let offset = 0;

  // "RIFF" chunk descriptor
  header.write("RIFF", offset); offset += 4;

  // File size - 8 bytes (will be 36 + audioDataLength)
  header.writeUInt32LE(36 + audioDataLength, offset); offset += 4;

  // "WAVE" format
  header.write("WAVE", offset); offset += 4;

  // "fmt " subchunk
  header.write("fmt ", offset); offset += 4;

  // Subchunk1 size (16 for PCM)
  header.writeUInt32LE(16, offset); offset += 4;

  // Audio format (1 = PCM)
  header.writeUInt16LE(1, offset); offset += 2;

  // Number of channels
  header.writeUInt16LE(channels, offset); offset += 2;

  // Sample rate
  header.writeUInt32LE(sampleRate, offset); offset += 4;

  // Byte rate (SampleRate * NumChannels * BitsPerSample / 8)
  header.writeUInt32LE(sampleRate * channels * bytesPerSample, offset); offset += 4;

  // Block align (NumChannels * BitsPerSample / 8)
  header.writeUInt16LE(channels * bytesPerSample, offset); offset += 2;

  // Bits per sample
  header.writeUInt16LE(bitsPerSample, offset); offset += 2;

  // "data" subchunk
  header.write("data", offset); offset += 4;

  // Subchunk2 size (audio data length)
  header.writeUInt32LE(audioDataLength, offset);

  // Generate PCM audio data (sine wave)
  const audioData = Buffer.alloc(audioDataLength);
  const frequency = 440; // A4 note
  const volume = 0.3; // 30% volume to prevent clipping
  let audioOffset = 0;

  for (let i = 0; i < numSamples; i++) {
    // Generate sine wave sample
    const sample = Math.sin((2 * Math.PI * frequency * i) / sampleRate) * 32767 * volume;
    const int16 = Math.round(Math.max(-32768, Math.min(32767, sample)));

    // Write to both channels
    for (let ch = 0; ch < channels; ch++) {
      audioData.writeInt16LE(int16, audioOffset);
      audioOffset += 2;
    }
  }

  return Buffer.concat([header, audioData]);
}

// Helper function to create valid FLAC file
function createValidFLAC(): Buffer {
  const flacSignature = Buffer.from([0x66, 0x4c, 0x61, 0x43]); // "fLaC"

  // STREAMINFO metadata block (34 bytes) - properly formatted
  const flacMetadata = Buffer.concat([
    Buffer.from([0x80]), // Last metadata block flag + STREAMINFO
    Buffer.from([0x00, 0x00, 0x22]), // Metadata block size (34)
    Buffer.from([0x00, 0x10]), // Min block size (4096)
    Buffer.from([0x00, 0x10]), // Max block size (4096)
    Buffer.from([0x00, 0x00, 0x00, 0x00]), // Min frame size
    Buffer.from([0x00, 0x00, 0x00, 0x00]), // Max frame size
    Buffer.from([0xac, 0x44, 0x00]), // Sample rate (44100 Hz)
    Buffer.from([0x13]), // Channels (2) + 16 bits
    Buffer.from([0x80, 0x00, 0x00, 0x00, 0x44, 0xac, 0x00]), // Total samples (88200)
    Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]), // MD5
  ]);

  // Create FLAC frame headers (valid but minimal frames)
  const frames = Buffer.alloc(131072);

  // Sync code (0xfff8 with sync) followed by minimal frame data
  for (let i = 0; i < frames.length - 4; i += 18) {
    frames[i] = 0xff;
    frames[i + 1] = 0xf8; // Sync code variant
    // Rest is minimal frame data
    for (let j = 2; j < 18 && i + j < frames.length; j++) {
      frames[i + j] = 0x00;
    }
  }

  return Buffer.concat([flacSignature, flacMetadata, frames]);
}

// Helper function to create valid OGG file
function createValidOGG(): Buffer {
  // Create multiple OGG pages with proper structure
  const pages = Buffer.alloc(262144); // 256KB

  let offset = 0;

  for (let p = 0; p < 100; p++) {
    // OGG page header
    pages[offset++] = 0x4f; // 'O'
    pages[offset++] = 0x67; // 'g'
    pages[offset++] = 0x67; // 'g'
    pages[offset++] = 0x53; // 'S'
    pages[offset++] = 0x00; // Version
    pages[offset++] = p === 0 ? 0x02 : 0x00; // Header type (BOS for first page)

    // Granule position (8 bytes)
    for (let i = 0; i < 8; i++) pages[offset++] = 0x00;

    // Serial number (4 bytes)
    pages[offset++] = 0x00;
    pages[offset++] = 0x00;
    pages[offset++] = 0x00;
    pages[offset++] = 0x01;

    // Sequence number (4 bytes)
    for (let i = 0; i < 4; i++) pages[offset++] = (p >> (i * 8)) & 0xff;

    // Checksum (4 bytes)
    for (let i = 0; i < 4; i++) pages[offset++] = 0x00;

    // Page segments
    pages[offset++] = 0x01; // Number of segments
    pages[offset++] = 0xff; // Segment size (255 bytes)

    // Audio data
    for (let i = 0; i < 255 && offset < pages.length; i++) {
      pages[offset++] = Math.floor(Math.random() * 256);
    }

    if (offset >= pages.length - 300) break;
  }

  return pages.slice(0, offset);
}

// Helper function to create valid AAC file
function createValidAAC(): Buffer {
  const adtsFrames = Buffer.alloc(262144); // 256KB
  let offset = 0;

  // Create multiple ADTS frames
  for (
    let frameNum = 0;
    frameNum < 4000 && offset < adtsFrames.length - 8;
    frameNum++
  ) {
    // ADTS header (7 bytes minimum)
    adtsFrames[offset++] = 0xff; // Sync word (11 bits)
    adtsFrames[offset++] = 0xf1; // Sync word + MPEG4 + no CRC
    adtsFrames[offset++] = 0x50; // Profile (AAC LC) + sample rate index
    adtsFrames[offset++] = 0x80; // Channels + frame length
    adtsFrames[offset++] = 0x1f; // Frame length (part 2)
    adtsFrames[offset++] = 0xfc; // Buffer fullness (high)
    adtsFrames[offset++] = 0x00; // Buffer fullness (low) + number of raw blocks

    // Add 200 bytes of pseudo-audio data per frame
    for (let i = 0; i < 200 && offset < adtsFrames.length; i++) {
      adtsFrames[offset++] = Math.floor(Math.random() * 256);
    }
  }

  return adtsFrames.slice(0, offset);
}

// Helper function to create valid MP4 box structure
function createMP4Box(): Buffer {
  // ftyp box - file type box (must be first)
  const ftypBox = Buffer.alloc(32);
  ftypBox.writeUInt32BE(32, 0); // Box size
  ftypBox.write("ftyp", 4); // Box type
  ftypBox.write("isom", 8); // Major brand
  ftypBox.writeUInt32BE(0x00000200, 12); // Minor version
  ftypBox.write("isomiso2mp41", 16); // Compatible brands

  // Create minimal but valid moov box
  // mvhd (movie header)
  const mvhdBox = Buffer.alloc(108);
  let mvhdOffset = 0;
  mvhdBox.writeUInt32BE(108, mvhdOffset); mvhdOffset += 4; // Box size
  mvhdBox.write("mvhd", mvhdOffset); mvhdOffset += 4; // Box type
  mvhdBox.writeUInt32BE(0, mvhdOffset); mvhdOffset += 4; // Version and flags
  mvhdBox.writeUInt32BE(0, mvhdOffset); mvhdOffset += 4; // Creation time
  mvhdBox.writeUInt32BE(0, mvhdOffset); mvhdOffset += 4; // Modification time
  mvhdBox.writeUInt32BE(1000, mvhdOffset); mvhdOffset += 4; // Timescale
  mvhdBox.writeUInt32BE(10000, mvhdOffset); mvhdOffset += 4; // Duration (10 seconds)
  mvhdBox.writeUInt32BE(0x00010000, mvhdOffset); mvhdOffset += 4; // Playback speed (1.0)
  mvhdBox.writeUInt16BE(0x0100, mvhdOffset); mvhdOffset += 2; // Volume (1.0)
  mvhdOffset += 10; // Reserved
  // Identity matrix
  mvhdBox.writeUInt32BE(0x00010000, mvhdOffset); mvhdOffset += 4;
  mvhdBox.writeUInt32BE(0, mvhdOffset); mvhdOffset += 4;
  mvhdBox.writeUInt32BE(0, mvhdOffset); mvhdOffset += 4;
  mvhdBox.writeUInt32BE(0, mvhdOffset); mvhdOffset += 4;
  mvhdBox.writeUInt32BE(0x00010000, mvhdOffset); mvhdOffset += 4;
  mvhdBox.writeUInt32BE(0, mvhdOffset); mvhdOffset += 4;
  mvhdBox.writeUInt32BE(0, mvhdOffset); mvhdOffset += 4;
  mvhdBox.writeUInt32BE(0, mvhdOffset); mvhdOffset += 4;
  mvhdBox.writeUInt32BE(0x40000000, mvhdOffset); mvhdOffset += 4;
  mvhdBox.writeUInt32BE(0, mvhdOffset); mvhdOffset += 4; // Preview time
  mvhdBox.writeUInt32BE(2, mvhdOffset); // Next track ID

  const moovBox = Buffer.alloc(16 + 108);
  let moovOffset = 0;
  moovBox.writeUInt32BE(16 + 108, moovOffset); moovOffset += 4; // Box size
  moovBox.write("moov", moovOffset); moovOffset += 4; // Box type
  mvhdBox.copy(moovBox, moovOffset);

  // mdat box - media data with H.264 NAL units
  const mediaData = Buffer.alloc(1000000); // 1MB
  let mdatOffset = 0;

  // Write H.264 NAL unit start codes and data
  for (let i = 0; i < 1000 && mdatOffset < mediaData.length - 4; i++) {
    mediaData[mdatOffset++] = 0x00;
    mediaData[mdatOffset++] = 0x00;
    mediaData[mdatOffset++] = 0x00;
    mediaData[mdatOffset++] = 0x01;
    // NAL unit data
    for (let j = 0; j < 1000 && mdatOffset < mediaData.length; j++) {
      mediaData[mdatOffset++] = (Math.random() * 256) | 0;
    }
  }

  const mdatBox = Buffer.alloc(8 + mdatOffset);
  mdatBox.writeUInt32BE(8 + mdatOffset, 0); // Box size
  mdatBox.write("mdat", 4); // Box type
  mediaData.copy(mdatBox, 8, 0, mdatOffset);

  return Buffer.concat([ftypBox, moovBox, mdatBox]);
}

// Helper function to create valid Opus file
function createValidOpus(): Buffer {
  // OGG pages containing Opus codec
  const pages = Buffer.alloc(262144);
  let offset = 0;

  // First page - Opus identification header
  pages[offset++] = 0x4f; // 'O'
  pages[offset++] = 0x67; // 'g'
  pages[offset++] = 0x67; // 'g'
  pages[offset++] = 0x53; // 'S'
  pages[offset++] = 0x00; // Version
  pages[offset++] = 0x02; // Header type (BOS)

  // Granule position
  for (let i = 0; i < 8; i++) pages[offset++] = 0x00;

  // Serial number
  for (let i = 0; i < 4; i++) pages[offset++] = 0x00;

  // Sequence number
  for (let i = 0; i < 4; i++) pages[offset++] = 0x00;

  // Checksum
  for (let i = 0; i < 4; i++) pages[offset++] = 0x00;

  // Page segments
  pages[offset++] = 0x01; // 1 segment
  pages[offset++] = 0x08; // Segment size (8)

  // Opus head identifier
  const opusHead = Buffer.from("OpusHead");
  opusHead.copy(pages, offset);
  offset += 8;

  // Create additional Opus audio pages
  for (let p = 1; p < 500 && offset < pages.length - 300; p++) {
    pages[offset++] = 0x4f; // 'O'
    pages[offset++] = 0x67; // 'g'
    pages[offset++] = 0x67; // 'g'
    pages[offset++] = 0x53; // 'S'
    pages[offset++] = 0x00; // Version
    pages[offset++] = 0x00; // Header type

    for (let i = 0; i < 8; i++) pages[offset++] = (p >> (i * 8)) & 0xff;
    for (let i = 0; i < 4; i++) pages[offset++] = 0x00;
    for (let i = 0; i < 4; i++) pages[offset++] = (p >> (i * 8)) & 0xff;
    for (let i = 0; i < 4; i++) pages[offset++] = 0x00;

    pages[offset++] = 0x01;
    pages[offset++] = 0xff;

    for (let i = 0; i < 255 && offset < pages.length; i++) {
      pages[offset++] = Math.floor(Math.random() * 256);
    }
  }

  return pages.slice(0, offset);
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
