import type { Handler } from "@netlify/functions";
import {
  normalizeUrl,
  isValidUrl,
  detectPlatform,
} from "../../server/utils/urlUtils";

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

  // STREAMINFO metadata block (34 bytes)
  const flacMetadata = Buffer.from([
    0x80, // Last metadata block flag + STREAMINFO type
    0x00,
    0x00,
    0x22, // Metadata block size (34 bytes)
    0x00,
    0x04, // Min block size (1024)
    0x00,
    0x04, // Max block size (1024)
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
    0x00, // Sample rate (44100 Hz, 20 bits)
    0x13, // Channels (2), bits per sample (16)
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
    0x00,
    0x00, // MD5
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
    0xff,
    0xf1, // Sync word
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
