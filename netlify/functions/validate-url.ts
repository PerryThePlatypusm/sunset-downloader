import type { Handler } from "@netlify/functions";
import {
  normalizeUrl,
  isValidUrl,
  detectPlatform,
} from "../../server/utils/urlUtils";

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

const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { url } = body;

    if (!url || typeof url !== "string" || !url.trim()) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          valid: false,
          error: "URL is required",
        }),
      };
    }

    const normalizedUrl = normalizeUrl(url);
    const valid = isValidUrl(normalizedUrl);
    const platform = detectPlatform(normalizedUrl);

    if (!valid) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          valid: false,
          error: "Invalid URL format",
        }),
      };
    }

    if (!platform || !SUPPORTED_PLATFORMS.includes(platform)) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          valid: false,
          detected: platform,
          error: "Platform not supported or invalid URL for that platform",
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        valid: true,
        platform,
        url: normalizedUrl,
      }),
    };
  } catch (error) {
    console.error("Validation error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        valid: false,
        error: "Validation failed",
      }),
    };
  }
};

export { handler };
