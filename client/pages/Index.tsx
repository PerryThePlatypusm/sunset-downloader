import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DownloadProgress from "@/components/DownloadProgress";
import TOSNotification from "@/components/TOSNotification";
import { usePixelAnimation } from "@/hooks/use-pixel-animation";
import { useConfetti } from "@/hooks/use-confetti";
import { Download, Music, Video, Zap, Check, AlertCircle } from "lucide-react";
import { downloadMediaAPI, downloadFile } from "@/lib/mediaapi";

export default function Index() {
  const createPixels = usePixelAnimation();
  const createConfetti = useConfetti();
  const [url, setUrl] = useState("");
  const [downloadType, setDownloadType] = useState<"video" | "audio">("video");
  const [quality, setQuality] = useState("720");
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState<
    "idle" | "validating" | "downloading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [downloadedFile, setDownloadedFile] = useState<string | null>(null);

  useEffect(() => {
    if (downloadStatus === "success") {
      createConfetti();
    }
  }, [downloadStatus, createConfetti]);

  const handleDownload = async () => {
    const trimmedUrl = url.trim();

    // Clear previous error immediately when starting a new download attempt
    setErrorMessage("");
    setIsDownloading(true);
    setDownloadStatus("validating");
    setDownloadProgress(10);

    // Validate URL is not empty
    if (!trimmedUrl) {
      setErrorMessage("Please enter a URL");
      setDownloadStatus("error");
      setIsDownloading(false);
      return;
    }

    // Validate URL length
    if (trimmedUrl.length > 2048) {
      setErrorMessage("URL is too long");
      setDownloadStatus("error");
      setIsDownloading(false);
      return;
    }

    // Basic URL format validation
    try {
      new URL(trimmedUrl.startsWith("http") ? trimmedUrl : `https://${trimmedUrl}`);
    } catch {
      setErrorMessage("Please enter a valid URL (e.g., https://youtube.com/watch?v=...)");
      setDownloadStatus("error");
      setIsDownloading(false);
      return;
    }

    // URL is valid - proceed with download
    try {
      // Use MediaAPI for the download
      setDownloadStatus("downloading");
      setDownloadProgress(30);

      console.log("[Download] Calling MediaAPI for URL:", trimmedUrl);

      // Get download link from MediaAPI
      const mediaApiResult = await downloadMediaAPI(
        trimmedUrl,
        downloadType === "audio",
        quality
      );

      if (!mediaApiResult.success || !mediaApiResult.url) {
        throw new Error(
          mediaApiResult.error || "Failed to get download link"
        );
      }

      console.log("[Download] Got download link, starting file download");
      setDownloadProgress(60);

      // Download the actual file
      await downloadFile(mediaApiResult.url, mediaApiResult.filename || "download");

      setDownloadProgress(100);
      setDownloadStatus("success");
      setDownloadedFile(mediaApiResult.filename || "download");

      // Reset after success
      setTimeout(() => {
        setUrl("");
        setDownloadStatus("idle");
        setDownloadProgress(0);
        setDownloadedFile(null);
        setIsDownloading(false);
      }, 3000);
    } catch (error) {
      console.error("Download error:", error);
      const errorMsg = error instanceof Error ? error.message : "An error occurred";

      // Provide helpful error message
      let displayError = errorMsg;
      if (errorMsg.includes("API key")) {
        displayError = "MediaAPI not configured. Please contact support.";
      } else if (errorMsg.includes("quota")) {
        displayError = "API quota exceeded. Please try again later.";
      } else if (errorMsg.includes("Invalid URL")) {
        displayError = "URL not supported or invalid. Please check the link.";
      }

      setErrorMessage(displayError);
      setDownloadStatus("error");
      setIsDownloading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <TOSNotification />
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-sunset-700/50 backdrop-blur-md bg-sunset-900/50 sticky top-0 z-20">
          <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 sm:w-10 h-8 sm:h-10 bg-gradient-to-br from-sunset-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg shadow-sunset-500/50">
                  <Download className="w-5 sm:w-6 h-5 sm:h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-sunset-400 via-pink-400 to-orange-400 bg-clip-text text-transparent truncate">
                    SunsetDownloader
                  </h1>
                  <p className="text-sunset-300 text-xs hidden sm:block">
                    Multi-Platform Media Downloader
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-sunset-300 text-sm whitespace-nowrap">
                <Zap className="w-4 h-4" />
                <span>Instant Downloads</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="w-full max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-12">
          {/* Hero Section */}
          <div className="text-center mb-6 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              <span className="bg-gradient-to-r from-sunset-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                Sunset Downloader
              </span>
            </h2>
            <p className="text-sunset-300 text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-2">
              Download media from 1000+ platforms. We support YouTube, Spotify,
              Instagram, Twitter, TikTok, and many more!
            </p>
          </div>

          {/* Download Card */}
          <div className="bg-gradient-to-br from-sunset-800/50 to-sunset-800/30 backdrop-blur-xl border border-sunset-700/50 rounded-2xl p-4 sm:p-6 md:p-8 shadow-2xl shadow-sunset-900/50">
            {/* URL Input */}
            <div className="mb-6">
              <label className="block text-sunset-200 font-semibold mb-2">
                Enter Media Link
              </label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Paste your video/music link here..."
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setErrorMessage("");
                  }}
                  onKeyPress={(e) => e.key === "Enter" && handleDownload()}
                  onClick={createPixels}
                  className="bg-sunset-900/50 border-sunset-700 text-white placeholder:text-sunset-500 focus:border-sunset-500 focus:ring-sunset-500"
                  disabled={isDownloading}
                />
              </div>
            </div>

            {/* Download Type Selector */}
            <div className="mb-6">
              <label className="block text-sunset-200 font-semibold mb-3">
                Download Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={(e) => {
                    createPixels(e);
                    setDownloadType("video");
                  }}
                  className={`p-4 rounded-lg border-2 transition-all flex items-center justify-center gap-2 font-semibold ${
                    downloadType === "video"
                      ? "border-sunset-500 bg-sunset-500/20 text-sunset-200"
                      : "border-sunset-700/50 bg-sunset-900/30 text-sunset-400 hover:border-sunset-600"
                  }`}
                >
                  <Video className="w-5 h-5" />
                  Video
                </button>
                <button
                  onClick={(e) => {
                    createPixels(e);
                    setDownloadType("audio");
                  }}
                  className={`p-4 rounded-lg border-2 transition-all flex items-center justify-center gap-2 font-semibold ${
                    downloadType === "audio"
                      ? "border-sunset-500 bg-sunset-500/20 text-sunset-200"
                      : "border-sunset-700/50 bg-sunset-900/30 text-sunset-400 hover:border-sunset-600"
                  }`}
                >
                  <Music className="w-5 h-5" />
                  Audio (MP3)
                </button>
              </div>
            </div>

            {/* Quality Selector */}
            <div className="mb-6">
              <label className="block text-sunset-200 font-semibold mb-3">
                Quality
              </label>
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
                disabled={isDownloading}
                className="w-full p-3 rounded-lg bg-sunset-900/50 border border-sunset-700 text-sunset-200 focus:border-sunset-500 focus:outline-none cursor-pointer"
              >
                {downloadType === "video" ? (
                  <>
                    <option value="360">360p (Low Quality, Faster)</option>
                    <option value="480">480p (Medium Quality)</option>
                    <option value="720">720p (High Quality - Recommended)</option>
                    <option value="1080">1080p (Very High Quality)</option>
                  </>
                ) : (
                  <>
                    <option value="128">128 kbps (Low Quality, Fast)</option>
                    <option value="192">192 kbps (Good Quality - Recommended)</option>
                    <option value="256">256 kbps (High Quality)</option>
                    <option value="320">320 kbps (Highest Quality)</option>
                  </>
                )}
              </select>
            </div>

            {/* Error Message */}
            {downloadStatus === "error" && errorMessage && (
              <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/50 flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-red-200 font-semibold">Error</p>
                  <p className="text-red-300 text-sm">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Download Progress */}
            {(isDownloading || downloadStatus !== "idle") && (
              <div className="mb-6">
                <DownloadProgress
                  status={downloadStatus}
                  progress={downloadProgress}
                  fileName={downloadedFile}
                />
              </div>
            )}

            {/* Download Button */}
            <Button
              onClick={(e) => {
                createPixels(e);
                handleDownload();
              }}
              disabled={isDownloading || !url.trim()}
              className={`w-full py-6 font-semibold text-lg rounded-lg transition-all flex items-center justify-center gap-2 ${
                downloadStatus === "success"
                  ? "bg-green-500/50 hover:bg-green-500/60 text-green-100"
                  : downloadStatus === "downloading"
                    ? "bg-sunset-600 text-white cursor-wait"
                    : downloadStatus === "error"
                      ? "bg-sunset-600 hover:bg-sunset-700 text-white"
                      : "bg-gradient-to-r from-sunset-500 to-pink-500 hover:from-sunset-600 hover:to-pink-600 text-white shadow-lg shadow-sunset-500/50"
              }`}
            >
              {downloadStatus === "success" && <Check className="w-5 h-5" />}
              {downloadStatus === "success"
                ? "Downloaded!"
                : downloadStatus === "downloading"
                  ? "Downloading..."
                  : downloadStatus === "validating"
                    ? "Validating..."
                    : "Download Now"}
            </Button>

            {/* Info Section */}
            <div className="mt-8 pt-6 border-t border-sunset-700/50 grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sunset-500 font-bold text-lg sm:text-xl">
                  1000+
                </p>
                <p className="text-sunset-400 text-xs sm:text-sm">
                  Supported Platforms
                </p>
              </div>
              <div>
                <p className="text-sunset-500 font-bold text-lg sm:text-xl">
                  4K
                </p>
                <p className="text-sunset-400 text-xs sm:text-sm">
                  Max Quality
                </p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-sunset-500 font-bold text-lg sm:text-xl">
                  Free
                </p>
                <p className="text-sunset-400 text-xs sm:text-sm">No Account</p>
              </div>
            </div>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-12">
            <div className="bg-gradient-to-br from-sunset-800/30 to-transparent border border-sunset-700/30 rounded-lg p-4 sm:p-6 backdrop-blur-sm">
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-sunset-500/20 rounded-lg flex items-center justify-center mb-3">
                <Zap className="w-5 sm:w-6 h-5 sm:h-6 text-sunset-400" />
              </div>
              <h3 className="text-white font-bold mb-2 text-sm sm:text-base">
                Lightning Fast
              </h3>
              <p className="text-sunset-300 text-xs sm:text-sm">
                Download your media in seconds with optimized servers
              </p>
            </div>

            <div className="bg-gradient-to-br from-sunset-800/30 to-transparent border border-sunset-700/30 rounded-lg p-4 sm:p-6 backdrop-blur-sm">
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-pink-500/20 rounded-lg flex items-center justify-center mb-3">
                <Video className="w-5 sm:w-6 h-5 sm:h-6 text-pink-400" />
              </div>
              <h3 className="text-white font-bold mb-2 text-sm sm:text-base">
                Any Quality
              </h3>
              <p className="text-sunset-300 text-xs sm:text-sm">
                From 240p all the way up to 4K for maximum clarity
              </p>
            </div>

            <div className="bg-gradient-to-br from-sunset-800/30 to-transparent border border-sunset-700/30 rounded-lg p-4 sm:p-6 backdrop-blur-sm sm:col-span-2 lg:col-span-1">
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mb-3">
                <Music className="w-5 sm:w-6 h-5 sm:h-6 text-orange-400" />
              </div>
              <h3 className="text-white font-bold mb-2 text-sm sm:text-base">
                Audio Conversion
              </h3>
              <p className="text-sunset-300 text-xs sm:text-sm">
                Extract MP3 from any video in your preferred quality
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-sunset-700/50 backdrop-blur-md bg-sunset-900/50 mt-16">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {/* Links Column */}
              <div>
                <h4 className="text-sunset-200 font-semibold mb-3">
                  Navigation
                </h4>
                <div className="flex flex-col gap-2 text-sm">
                  <Link
                    to="/"
                    className="text-sunset-400 hover:text-sunset-300 transition-colors"
                  >
                    Home
                  </Link>
                  <Link
                    to="/credits"
                    className="text-sunset-400 hover:text-sunset-300 transition-colors"
                  >
                    Credits
                  </Link>
                  <Link
                    to="/terms-of-service"
                    className="text-sunset-400 hover:text-sunset-300 transition-colors"
                  >
                    Terms of Service
                  </Link>
                </div>
              </div>

              {/* Formats Column */}
              <div>
                <h4 className="text-sunset-200 font-semibold mb-3">
                  Supported Formats
                </h4>
                <div className="text-xs text-sunset-400 space-y-1">
                  <p>🎵 Audio: MP3, FLAC, AAC, ALAC</p>
                  <p>🎵 Audio: OGG, WAV, Opus</p>
                  <p>🎬 Video: MP4 (All Resolutions)</p>
                  <p className="text-sunset-300 mt-3 font-semibold">Desktop</p>
                  <p className="text-sunset-300">✓ VLC • Windows Media</p>
                  <p className="text-sunset-300 mt-3 font-semibold">Mobile</p>
                  <p className="text-sunset-300">✓ iOS • Android</p>
                </div>
              </div>

              {/* Social Column */}
              <div>
                <h4 className="text-sunset-200 font-semibold mb-3">Follow</h4>
                <div className="flex flex-col gap-2 text-sm">
                  <a
                    href="https://guns.lol/clover."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sunset-400 hover:text-sunset-300 transition-colors"
                  >
                    Creator
                  </a>
                  <a
                    href="#"
                    className="text-sunset-500 text-xs opacity-50 cursor-default"
                  >
                    More Coming Soon...
                  </a>
                </div>
              </div>
            </div>

            <div className="border-t border-sunset-700/30 pt-6">
              <p className="text-sunset-400 text-sm text-center">
                © 2026 SunsetDownloader. Download responsibly and respect
                copyright laws. All formats fully compatible with VLC and
                Windows Media Player.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
