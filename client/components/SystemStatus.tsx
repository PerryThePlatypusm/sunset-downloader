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
        const response = await fetch(getApiEndpoint("/api/status"));
        if (!response.ok) {
          throw new Error("Failed to check system status");
        }
        const data = await response.json();
        setStatus(data);
      } catch (err) {
        console.error("[SystemStatus] Error:", err);
        setError("Could not check system status");
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
