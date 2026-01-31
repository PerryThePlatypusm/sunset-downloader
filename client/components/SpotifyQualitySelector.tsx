import React, { useState } from "react";
import { usePixelAnimation } from "@/hooks/use-pixel-animation";
import { Music, Zap, Smartphone } from "lucide-react";

interface SpotifyQualitySelectorProps {
  quality: string;
  onQualityChange: (quality: string) => void;
}

const spotifyQualities = [
  {
    id: "128",
    label: "128 kbps",
    format: "MP3",
    description: "Low",
    icon: Smartphone,
    info: "Compact, mobile-friendly",
    mobile: "iOS • Android",
  },
  {
    id: "192",
    label: "192 kbps",
    format: "MP3",
    description: "Medium",
    icon: Music,
    info: "Standard quality",
    mobile: "iOS • Android",
  },
  {
    id: "256",
    label: "256 kbps",
    format: "MP3",
    description: "High",
    icon: Music,
    info: "Good for most uses",
    mobile: "iOS • Android",
  },
  {
    id: "320",
    label: "320 kbps",
    format: "MP3",
    description: "Very High",
    icon: Music,
    info: "Excellent for everyday listening",
    mobile: "iOS • Android",
  },
  {
    id: "aac",
    label: "AAC",
    format: "M4A",
    description: "Premium",
    icon: Music,
    info: "Alternative format, smaller file",
    mobile: "iOS • Android",
  },
  {
    id: "ogg",
    label: "OGG",
    format: "OGG",
    description: "VLC Optimized",
    icon: Music,
    info: "Perfect for VLC, open-source format",
    mobile: "iOS • Android",
  },
  {
    id: "wav",
    label: "WAV",
    format: "WAV",
    description: "Uncompressed",
    icon: Zap,
    info: "Maximum compatibility with all players",
    mobile: "iOS • Android",
  },
  {
    id: "lossless",
    label: "FLAC",
    format: "FLAC",
    description: "Studio",
    icon: Zap,
    info: "Lossless compression, audiophile-grade",
    mobile: "Android",
  },
  {
    id: "alac",
    label: "ALAC",
    format: "M4A",
    description: "Apple Lossless",
    icon: Music,
    info: "Lossless format with excellent compatibility",
    mobile: "iOS",
  },
];

export default function SpotifyQualitySelector({
  quality,
  onQualityChange,
}: SpotifyQualitySelectorProps) {
  const createPixels = usePixelAnimation();
  const [animate, setAnimate] = useState(false);

  // Ensure quality has a valid default
  const effectiveQuality = quality || "320";

  const handleQualityChange = (newQuality: string, event: React.MouseEvent) => {
    createPixels(event);
    setAnimate(true);
    onQualityChange(newQuality);
    setTimeout(() => setAnimate(false), 400);
  };

  const selectedQuality = spotifyQualities.find(
    (q) => q.id === effectiveQuality,
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {spotifyQualities.map((q) => {
          const Icon = q.icon;
          return (
            <button
              key={q.id}
              type="button"
              onClick={(e) => handleQualityChange(q.id, e)}
              className={`p-3 rounded-lg border-2 transition-all cursor-pointer group text-left ${
                effectiveQuality === q.id
                  ? q.id === "lossless"
                    ? "border-pink-500 bg-pink-500/20"
                    : "border-sunset-500 bg-sunset-500/20"
                  : "border-sunset-700/50 bg-sunset-900/30 hover:border-sunset-600"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon
                  className={`w-4 h-4 ${
                    q.id === "lossless"
                      ? "text-pink-400 group-hover:text-pink-300"
                      : "text-sunset-400 group-hover:text-sunset-300"
                  }`}
                />
                <span className="font-semibold text-sunset-200 text-sm">
                  {q.label}
                </span>
              </div>
              <p className="text-xs text-sunset-500">{q.format}</p>
              <p className="text-xs text-sunset-400 mt-1">{q.description}</p>
            </button>
          );
        })}
      </div>

      {/* Pixel Animation */}
      {animate && (
        <div className="flex gap-1 justify-center">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="w-1 h-1 rounded-full bg-gradient-to-r from-sunset-500 to-pink-500 animate-pulse"
              style={{
                animationDelay: `${i * 0.05}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="p-3 rounded-lg bg-sunset-500/10 border border-sunset-500/30 space-y-2">
        {selectedQuality && (
          <>
            <p className="text-sunset-300 text-sm font-medium">
              {selectedQuality.id === "lossless"
                ? "📊 Studio-quality FLAC for audiophiles"
                : selectedQuality.id === "aac"
                  ? "🎵 AAC format - great alternative with excellent compatibility"
                  : selectedQuality.id === "alac"
                    ? "🎵 Apple Lossless - excellent compatibility with all players"
                    : selectedQuality.id === "ogg"
                      ? "🎵 OGG Vorbis - optimized for VLC media player"
                      : selectedQuality.id === "wav"
                        ? "🎵 WAV - uncompressed, maximum compatibility"
                        : `🎵 ${selectedQuality.info}`}
            </p>
            <p className="text-sunset-400 text-xs">
              ✓ VLC Media Player
              {selectedQuality.format === "MP3" &&
                " • Windows Media Player • Universal support"}
              {selectedQuality.format === "M4A" &&
                " • Windows Media Player • All devices"}
              {selectedQuality.format === "FLAC" &&
                " • Windows Media Player • Premium quality"}
              {selectedQuality.format === "WAV" &&
                " • Windows Media Player • Maximum compatibility"}
              {selectedQuality.format === "OGG" && " • Optimized format"}
              {selectedQuality.format === "ALAC" &&
                " • Windows Media Player • Lossless"}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
