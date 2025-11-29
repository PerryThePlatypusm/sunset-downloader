import React from "react";
import { usePixelAnimation } from "@/hooks/use-pixel-animation";

interface QualitySelectorProps {
  quality: string;
  onQualityChange: (quality: string) => void;
  type: "video" | "audio";
}

const videoQualities = [
  { id: "240", label: "240p", description: "Low" },
  { id: "360", label: "360p", description: "Low-Mid" },
  { id: "480", label: "480p", description: "Medium" },
  { id: "720", label: "720p (HD)", description: "High" },
  { id: "1080", label: "1080p (Full HD)", description: "Very High" },
  { id: "1440", label: "1440p (2K)", description: "Ultra" },
  { id: "2160", label: "2160p (4K)", description: "Ultra+" },
  { id: "4320", label: "4320p (8K)", description: "Maximum" },
];

const audioQualities = [
  { id: "128", label: "128 kbps", description: "Low" },
  { id: "192", label: "192 kbps", description: "Medium" },
  { id: "256", label: "256 kbps", description: "High" },
  { id: "320", label: "320 kbps", description: "Very High" },
  { id: "lossless", label: "Lossless FLAC", description: "Highest" },
  { id: "aac", label: "AAC (Premium)", description: "Optimized" },
  { id: "opus", label: "Opus 128", description: "Efficient" },
  { id: "opus192", label: "Opus 192", description: "Balanced" },
];

export default function QualitySelector({
  quality,
  onQualityChange,
  type,
}: QualitySelectorProps) {
  const qualities = type === "video" ? videoQualities : audioQualities;
  const createPixels = usePixelAnimation();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {qualities.map((q) => (
        <button
          key={q.id}
          onClick={(e) => {
            createPixels(e);
            onQualityChange(q.id);
          }}
          className={`p-3 rounded-lg border-2 transition-all text-left group ${
            quality === q.id
              ? "border-sunset-500 bg-gradient-to-br from-sunset-500/30 to-sunset-500/10"
              : "border-sunset-700/50 bg-sunset-900/30 hover:border-sunset-600/70"
          }`}
        >
          <div className="font-semibold text-sunset-200 text-sm group-hover:text-sunset-100">
            {q.label}
          </div>
          <div className="text-xs text-sunset-400 group-hover:text-sunset-300">
            {q.description}
          </div>
        </button>
      ))}
    </div>
  );
}
