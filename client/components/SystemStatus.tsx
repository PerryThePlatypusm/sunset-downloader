import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { getApiEndpoint } from "@/lib/api-config";

interface Status {
  ytdlpAvailable: boolean;
  pythonAvailable: boolean;
  ffmpegAvailable: boolean;
  supportedPlatforms: string[];
  message: string;
  instructions?: string;
}

export default function SystemStatus() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        // Only check status when running locally (localhost)
        // Status endpoint doesn't exist on deployed versions (like Fly.io, Netlify)
        const isLocal = window.location.hostname === "localhost" ||
                        window.location.hostname === "127.0.0.1";

        if (!isLocal) {
          // Don't try to fetch status on deployed versions
          setLoading(false);
          return;
        }

        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), 5000)
        );

        const fetchPromise = fetch(getApiEndpoint("/api/status"));
        const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;

        if (!response.ok) {
          throw new Error("Failed to check system status");
        }
        const data = await response.json();
        setStatus(data);
      } catch (err) {
        // Silently fail - status endpoint is optional for deployed versions
        // Just log at debug level, don't spam the console
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, []);

  if (loading) {
    return null;
  }

  if (!status) {
    return null;
  }

  // If everything is available, don't show anything
  if (status.ytdlpAvailable && status.pythonAvailable) {
    return null;
  }

  // Show warning if yt-dlp is not available
  if (!status.ytdlpAvailable) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-amber-900 mb-1">
              Multi-Platform Support Not Available
            </h3>
            <p className="text-sm text-amber-800 mb-3">
              Currently supports: <strong>YouTube only</strong>
            </p>
            <p className="text-sm text-amber-800 mb-3">
              To download from Spotify, Instagram, TikTok, Twitter, and 1000+ other
              platforms, install yt-dlp:
            </p>
            <div className="bg-amber-100 rounded p-3 text-xs font-mono space-y-1 mb-3">
              <div className="text-amber-900">
                <span className="text-amber-600"># Step 1: Install Python</span>
                <br />
                Visit: https://python.org
              </div>
              <div className="text-amber-900 mt-2">
                <span className="text-amber-600"># Step 2: Install yt-dlp</span>
                <br />
                pip install yt-dlp
              </div>
              <div className="text-amber-900 mt-2">
                <span className="text-amber-600"># Step 3: Restart this app</span>
              </div>
            </div>
            <p className="text-xs text-amber-700">
              After installing, refresh this page and all platforms will be available.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show info if everything is available
  if (status.ytdlpAvailable && status.pythonAvailable && status.ffmpegAvailable) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-green-900">
              ✅ All Features Enabled
            </h3>
            <p className="text-sm text-green-800">
              You can download from {status.supportedPlatforms.length}+ platforms
              including YouTube, Spotify, Instagram, TikTok, Twitter, and more.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
