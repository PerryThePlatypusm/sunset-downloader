import React, { useState } from "react";
import { Music, Zap } from "lucide-react";

interface SpotifyQualitySelectorProps {
  quality: string;
  onQualityChange: (quality: string) => void;
}

export default function SpotifyQualitySelector({
  quality,
  onQualityChange,
}: SpotifyQualitySelectorProps) {
  const [animate, setAnimate] = useState(false);

  const handleQualityChange = (newQuality: string) => {
    setAnimate(true);
    onQualityChange(newQuality);
    setTimeout(() => setAnimate(false), 400);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {/* Quality Toggle */}
        <div
          className={`p-4 rounded-lg border-2 transition-all cursor-pointer group ${
            quality === "standard"
              ? "border-sunset-500 bg-sunset-500/20"
              : "border-sunset-700/50 bg-sunset-900/30 hover:border-sunset-600"
          }`}
          onClick={() => handleQualityChange("standard")}
        >
          <div className="flex items-center gap-2 mb-2">
            <Music className="w-5 h-5 text-sunset-400 group-hover:text-sunset-300" />
            <span className="font-semibold text-sunset-200">Standard</span>
          </div>
          <p className="text-xs text-sunset-400">320 kbps MP3</p>
          <p className="text-xs text-sunset-500 mt-1">High quality</p>
        </div>

        <div
          className={`p-4 rounded-lg border-2 transition-all cursor-pointer group ${
            quality === "lossless"
              ? "border-pink-500 bg-pink-500/20"
              : "border-sunset-700/50 bg-sunset-900/30 hover:border-sunset-600"
          }`}
          onClick={() => handleQualityChange("lossless")}
        >
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-pink-400 group-hover:text-pink-300" />
            <span className="font-semibold text-sunset-200">Lossless</span>
          </div>
          <p className="text-xs text-sunset-400">FLAC 44.1 kHz</p>
          <p className="text-xs text-pink-400 mt-1">Studio quality</p>
        </div>
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
      <div className="p-3 rounded-lg bg-sunset-500/10 border border-sunset-500/30">
        <p className="text-sunset-300 text-sm">
          {quality === "lossless"
            ? "📊 Lossless downloads capture every detail with FLAC format. Perfect for audiophiles!"
            : "🎵 Standard 320 kbps MP3 provides excellent quality for most listening devices."}
        </p>
      </div>
    </div>
  );
}
