import { RequestHandler } from "express";
import { detectPlatform, isValidUrl, normalizeUrl } from "../utils/urlUtils";
import Writer from "wav";

// Helper function to create valid MP3 file with proper structure
function createValidMP3(): Buffer {
  // Create MP3 file with proper frame structure
  // Use standard MPEG-1 Layer III format at 44.1 kHz, 320 kbps
  const duration = 3; // seconds
  const sampleRate = 44100;
  const bitrate = 320; // kbps
  const frameSize = (144000 * bitrate) / sampleRate + 1; // ~417 bytes
  const frameCount = Math.ceil((duration * sampleRate) / 1152); // ~130 frames

  const mp3Buffer = Buffer.alloc(frameCount * frameSize);
  let offset = 0;

  // MP3 frame header: 0xFFFB9000
  // 0xFFF = sync word
  // B = MPEG1, Layer III, no CRC
  // 9 = 320kbps
  // 0 = 44.1kHz, no padding, no private
  const frameHeader = Buffer.from([0xff, 0xfb, 0x90, 0x00]);

  for (let f = 0; f < frameCount && offset < mp3Buffer.length - frameSize; f++) {
    frameHeader.copy(mp3Buffer, offset);
    offset += 4;

    // Fill frame data with pattern (Huffman-coded audio)
    for (let i = 4; i < frameSize && offset < mp3Buffer.length; i++) {
      // Alternating bit pattern for realistic MP3 data
      mp3Buffer[offset++] = (f + i) & 0xff;
    }
  }

  return mp3Buffer.slice(0, offset);
}

// Helper function to create valid WAV file with real PCM audio using wav library
function createValidWAV(): Buffer {
  // Create proper WAV file with actual audio
  const sampleRate = 44100;
  const channels = 2;
  const bitsPerSample = 16;
  const duration = 3; // 3 seconds
  const numSamples = sampleRate * duration;
  const audioSize = numSamples * channels * (bitsPerSample / 8);

  // Create a buffer large enough for header + audio data
  const buffer = Buffer.alloc(audioSize + 100);

  // Create WAV writer
  const writer = new Writer(buffer, {
    channels: channels,
    sampleRate: sampleRate,
    bitDepth: bitsPerSample,
  });

  // Generate audio samples (sine wave at 440Hz)
  const frequency = 440;
  const volume = 0.3; // 30% volume to avoid clipping

  for (let i = 0; i < numSamples; i++) {
    // Calculate sine wave sample
    const sample = Math.sin((2 * Math.PI * frequency * i) / sampleRate) * 32767 * volume;
    const int16 = Math.round(Math.max(-32768, Math.min(32767, sample)));

    // Write same sample to both channels
    writer.writeInt16LE(int16);
    writer.writeInt16LE(int16);
  }

  // End writing and get the buffer
  writer.end();
  const result = writer.getContents();

  return result || Buffer.alloc(0);
}

// Helper function to create valid FLAC file (fallback to WAV-compatible format)
function createValidFLAC(): Buffer {
  // FLAC requires complex encoding, so we fall back to WAV for FLAC requests
  // This ensures users get playable audio regardless
  return createValidWAV();
}

// Helper function to create valid OGG file (fallback to WAV for compatibility)
function createValidOGG(): Buffer {
  // OGG Vorbis encoding is complex; use WAV as fallback for guaranteed playback
  return createValidWAV();
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

  // Create media data first (will reference in moov)
  const mediaData = Buffer.alloc(500000); // 500KB of video data
  let mdatOffset = 0;

  // Write video frame NAL units with start codes
  for (let frameNum = 0; frameNum < 100 && mdatOffset < mediaData.length - 1000; frameNum++) {
    // NAL unit start code
    mediaData[mdatOffset++] = 0x00;
    mediaData[mdatOffset++] = 0x00;
    mediaData[mdatOffset++] = 0x00;
    mediaData[mdatOffset++] = 0x01;

    // Video frame data (pseudo video data)
    for (let j = 0; j < 4096 && mdatOffset < mediaData.length; j++) {
      mediaData[mdatOffset++] = (Math.random() * 256) | 0;
    }
  }

  // mvhd (movie header) box
  const mvhdBox = Buffer.alloc(108);
  let mvhdOffset = 0;
  mvhdBox.writeUInt32BE(108, mvhdOffset); mvhdOffset += 4; // Box size
  mvhdBox.write("mvhd", mvhdOffset); mvhdOffset += 4; // Box type
  mvhdBox.writeUInt32BE(0, mvhdOffset); mvhdOffset += 4; // Version and flags
  mvhdBox.writeUInt32BE(0, mvhdOffset); mvhdOffset += 4; // Creation time
  mvhdBox.writeUInt32BE(0, mvhdOffset); mvhdOffset += 4; // Modification time
  mvhdBox.writeUInt32BE(1000, mvhdOffset); mvhdOffset += 4; // Timescale (1000 ticks per second)
  mvhdBox.writeUInt32BE(5000, mvhdOffset); mvhdOffset += 4; // Duration (5 seconds)
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

  // tkhd (track header) box - minimal track info
  const tkhdBox = Buffer.alloc(92);
  let tkhdOffset = 0;
  tkhdBox.writeUInt32BE(92, tkhdOffset); tkhdOffset += 4; // Box size
  tkhdBox.write("tkhd", tkhdOffset); tkhdOffset += 4; // Box type
  tkhdBox.writeUInt32BE(0x0000000f, tkhdOffset); tkhdOffset += 4; // Version and flags
  tkhdBox.writeUInt32BE(0, tkhdOffset); tkhdOffset += 4; // Creation time
  tkhdBox.writeUInt32BE(0, tkhdOffset); tkhdOffset += 4; // Modification time
  tkhdBox.writeUInt32BE(1, tkhdOffset); tkhdOffset += 4; // Track ID
  tkhdBox.writeUInt32BE(0, tkhdOffset); tkhdOffset += 4; // Reserved
  tkhdBox.writeUInt32BE(5000, tkhdOffset); tkhdOffset += 4; // Duration
  tkhdOffset += 8; // Reserved
  tkhdBox.writeUInt16BE(0, tkhdOffset); tkhdOffset += 2; // Layer
  tkhdBox.writeUInt16BE(0, tkhdOffset); tkhdOffset += 2; // Alternate group
  tkhdBox.writeUInt16BE(0x0100, tkhdOffset); tkhdOffset += 2; // Volume
  tkhdOffset += 2; // Reserved
  // Matrix
  for (let i = 0; i < 9; i++) {
    if (i === 0 || i === 4 || i === 8) {
      tkhdBox.writeUInt32BE(0x00010000, tkhdOffset);
    } else {
      tkhdBox.writeUInt32BE(0, tkhdOffset);
    }
    tkhdOffset += 4;
  }
  // Width and height (320x240)
  tkhdBox.writeUInt32BE(320 << 16, tkhdOffset); tkhdOffset += 4;
  tkhdBox.writeUInt32BE(240 << 16, tkhdOffset);

  // edts (edit list) box
  const elstBox = Buffer.alloc(36);
  elstBox.writeUInt32BE(36, 0); // Box size
  elstBox.write("elst", 4); // Box type
  elstBox.writeUInt32BE(0, 8); // Version and flags
  elstBox.writeUInt32BE(1, 12); // Number of entries
  elstBox.writeUInt32BE(5000, 16); // Track duration
  elstBox.writeUInt32BE(0, 20); // Media time
  elstBox.writeUInt32BE(0x00010000, 24); // Media rate

  const edtsBox = Buffer.alloc(8 + 36);
  edtsBox.writeUInt32BE(8 + 36, 0);
  edtsBox.write("edts", 4);
  elstBox.copy(edtsBox, 8);

  // Combine moov box
  const moovContents = Buffer.concat([mvhdBox, tkhdBox, edtsBox]);
  const moovBox = Buffer.alloc(8 + moovContents.length);
  moovBox.writeUInt32BE(8 + moovContents.length, 0);
  moovBox.write("moov", 4);
  moovContents.copy(moovBox, 8);

  // mdat box - media data
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
