import { RequestHandler } from "express";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

interface SystemStatus {
  ytdlpAvailable: boolean;
  pythonAvailable: boolean;
  ffmpegAvailable: boolean;
  supportedPlatforms: string[];
  message: string;
  instructions?: string;
}

let cachedStatus: SystemStatus | null = null;
let lastStatusCheck = 0;

async function checkDependencies(): Promise<SystemStatus> {
  try {
    // Check if we have a recent cache (5 minutes)
    if (cachedStatus && Date.now() - lastStatusCheck < 5 * 60 * 1000) {
      return cachedStatus;
    }

    let ytdlpAvailable = false;
    let pythonAvailable = false;
    let ffmpegAvailable = false;

    // Check yt-dlp
    try {
      await execAsync("yt-dlp --version");
      ytdlpAvailable = true;
    } catch {
      // yt-dlp not available
    }

    // Check Python
    try {
      await execAsync("python3 --version || python --version");
      pythonAvailable = true;
    } catch {
      // Python not available
    }

    // Check FFmpeg
    try {
      await execAsync("ffmpeg -version");
      ffmpegAvailable = true;
    } catch {
      // FFmpeg not available
    }

    let supportedPlatforms: string[] = ["youtube"];
    let message = "";
    let instructions = "";

    if (ytdlpAvailable) {
      supportedPlatforms = [
        "youtube",
        "spotify",
        "instagram",
        "tiktok",
        "twitter",
        "soundcloud",
        "facebook",
        "twitch",
        "reddit",
        "pinterest",
        "crunchyroll",
        "hianime",
      ];
      message = "✅ Full multi-platform support enabled (yt-dlp available)";
    } else if (pythonAvailable) {
      message = "⚠️ Python available but yt-dlp not installed";
      instructions =
        "To enable multi-platform downloads, install yt-dlp: pip install yt-dlp";
    } else {
      message = "⚠️ Limited to YouTube only (yt-dlp and Python not available)";
      instructions =
        "To enable multi-platform downloads:\n1. Install Python from https://python.org\n2. Install yt-dlp: pip install yt-dlp\n3. Restart this app";
    }

    const status: SystemStatus = {
      ytdlpAvailable,
      pythonAvailable,
      ffmpegAvailable,
      supportedPlatforms,
      message,
      instructions,
    };

    cachedStatus = status;
    lastStatusCheck = Date.now();

    return status;
  } catch (error) {
    console.error("[Status] Error checking dependencies:", error);
    return {
      ytdlpAvailable: false,
      pythonAvailable: false,
      ffmpegAvailable: false,
      supportedPlatforms: ["youtube"],
      message: "⚠️ Could not determine system status",
    };
  }
}

export const handleStatus: RequestHandler = async (req, res) => {
  try {
    const status = await checkDependencies();
    res.json(status);
  } catch (error) {
    console.error("[Status] Error:", error);
    res.status(500).json({
      ytdlpAvailable: false,
      pythonAvailable: false,
      ffmpegAvailable: false,
      supportedPlatforms: ["youtube"],
      message: "Error checking system status",
    });
  }
};
