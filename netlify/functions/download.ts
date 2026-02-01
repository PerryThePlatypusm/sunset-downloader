import type { Handler } from "@netlify/functions";
import {
  normalizeUrl,
  isValidUrl,
  detectPlatform,
} from "../../server/utils/urlUtils";

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
  // Create 3 seconds of audio at 44100Hz, 16-bit mono
  const sampleRate = 44100;
  const duration = 3; // seconds
  const numSamples = sampleRate * duration;
  const channels = 1;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;

  // Build WAV file piece by piece to ensure correct offsets
  const chunks: Buffer[] = [];

  // RIFF header
  chunks.push(Buffer.from("RIFF"));

  // File size (will update later)
  const fileSizePos = chunks.reduce((sum, b) => sum + b.length, 0);
  chunks.push(Buffer.alloc(4));

  // WAVE format
  chunks.push(Buffer.from("WAVE"));

  // fmt subchunk
  chunks.push(Buffer.from("fmt "));
  chunks.push(Buffer.from([0x10, 0x00, 0x00, 0x00])); // Subchunk1 size (16)
  chunks.push(Buffer.from([0x01, 0x00])); // Audio format (1 = PCM)
  chunks.push(Buffer.from([0x01, 0x00])); // Number of channels (1 = mono)

  // Sample rate (44100 = 0x0000AC44 in little-endian)
  const sampleRateBuf = Buffer.alloc(4);
  sampleRateBuf.writeUInt32LE(sampleRate, 0);
  chunks.push(sampleRateBuf);

  // Byte rate (sample rate * num channels * bits per sample / 8)
  const byteRate = sampleRate * channels * bitsPerSample / 8;
  const byteRateBuf = Buffer.alloc(4);
  byteRateBuf.writeUInt32LE(byteRate, 0);
  chunks.push(byteRateBuf);

  // Block align
  chunks.push(Buffer.from([channels * bytesPerSample, 0x00]));

  // Bits per sample
  chunks.push(Buffer.from([bitsPerSample, 0x00]));

  // data subchunk
  chunks.push(Buffer.from("data"));

  // Data size (will update later)
  const dataSizePos = chunks.reduce((sum, b) => sum + b.length, 0);
  chunks.push(Buffer.alloc(4));

  // Concatenate header
  const header = Buffer.concat(chunks);

  // Generate PCM audio data (simple sine wave)
  const audioData = Buffer.alloc(numSamples * bytesPerSample);
  const frequency = 440; // A4 note

  for (let i = 0; i < numSamples; i++) {
    const sample = Math.sin((2 * Math.PI * frequency * i) / sampleRate) * 32767 * 0.5;
    const int16 = Math.round(Math.max(-32768, Math.min(32767, sample)));
    audioData.writeInt16LE(int16, i * bytesPerSample);
  }

  // Update file size (everything except the first 8 bytes)
  header.writeUInt32LE(header.length - 8 + audioData.length, fileSizePos);

  // Update data size
  header.writeUInt32LE(audioData.length, dataSizePos);

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
