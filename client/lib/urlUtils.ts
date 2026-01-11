export const PLATFORM_PATTERNS: Record<string, RegExp> = {
  youtube:
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)[\w-]{10,}/i,
  spotify:
    /(?:https?:\/\/)?(?:www\.)?spotify\.com\/(?:track|album|playlist)\/[\w]+/i,
  instagram:
    /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel|stories|tv)\/[\w-]+/i,
  twitter:
    /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/[\w]+\/status\/\d+/i,
  tiktok:
    /(?:https?:\/\/)?(?:www\.)?(?:tiktok\.com\/@[\w.]+\/video\/|vm\.tiktok\.com\/)[\w]+/i,
  soundcloud: /(?:https?:\/\/)?(?:www\.)?soundcloud\.com\/[\w-]+\/[\w-]+/i,
  facebook:
    /(?:https?:\/\/)?(?:www\.)?facebook\.com\/(?:watch\?v=|video\.php\?v=|watch\/\?v=)[\w]+/i,
  twitch:
    /(?:https?:\/\/)?(?:www\.)?twitch\.tv\/(?:videos\/|[\w]+\/clip\/|[\w]+\/clips\/)?[\w-]+/i,
  crunchyroll:
    /(?:https?:\/\/)?(?:www\.)?crunchyroll\.com\/(?:series|watch)\/[\w-]+/i,
  hianime: /(?:https?:\/\/)?(?:www\.)?hianime\.to\/(?:anime|watch)\/[\w-]+/i,
  reddit: /(?:https?:\/\/)?(?:www\.)?reddit\.com\/r\/\w+\/comments\/[\w]+/i,
  pinterest: /(?:https?:\/\/)?(?:www\.)?pinterest\.com\/(?:pin|user)\/[\w-]+/i,
};

export function detectPlatform(url: string): string | null {
  const trimmedUrl = url.trim();

  for (const [platform, pattern] of Object.entries(PLATFORM_PATTERNS)) {
    if (pattern.test(trimmedUrl)) {
      return platform;
    }
  }

  return null;
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url.startsWith("http") ? url : `https://${url}`);
    return true;
  } catch {
    return false;
  }
}

export function normalizeUrl(url: string): string {
  let normalized = url.trim();

  if (!normalized.startsWith("http")) {
    normalized = `https://${normalized}`;
  }

  return normalized;
}

export const QUALITY_LABELS: Record<string, string> = {
  "240": "240p",
  "360": "360p",
  "480": "480p",
  "720": "720p",
  "1080": "1080p",
  "1440": "1440p",
  "2160": "2160p",
  "4320": "4320p",
  "128": "128 kbps",
  "192": "192 kbps",
  "256": "256 kbps",
  "320": "320 kbps",
  lossless: "Lossless FLAC",
  aac: "AAC Premium",
  opus: "Opus 128",
  opus192: "Opus 192",
};
