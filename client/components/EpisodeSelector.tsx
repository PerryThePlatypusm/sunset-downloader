import React, { useState } from "react";
import { ChevronDown, Check } from "lucide-react";

interface EpisodeSelectorProps {
  platform: string | null;
  onSelect: (episodes: number[]) => void;
}

export default function EpisodeSelector({
  platform,
  onSelect,
}: EpisodeSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedEpisodes, setSelectedEpisodes] = useState<number[]>([]);
  const [rangeStart, setRangeStart] = useState(1);
  const [rangeEnd, setRangeEnd] = useState(12);

  const isAnimePlatform = platform === "crunchyroll" || platform === "hianime";

  if (!isAnimePlatform) {
    return null;
  }

  const handleSelectEpisode = (episode: number) => {
    const updated = selectedEpisodes.includes(episode)
      ? selectedEpisodes.filter((e) => e !== episode)
      : [...selectedEpisodes, episode].sort((a, b) => a - b);

    setSelectedEpisodes(updated);
    onSelect(updated);
  };

  const handleSelectRange = () => {
    const episodes: number[] = [];
    for (let i = rangeStart; i <= rangeEnd; i++) {
      episodes.push(i);
    }

    const merged = Array.from(
      new Set([...selectedEpisodes, ...episodes])
    ).sort((a, b) => a - b);

    setSelectedEpisodes(merged);
    onSelect(merged);
  };

  const handleSelectAll = () => {
    const allEpisodes = Array.from({ length: 100 }, (_, i) => i + 1);
    setSelectedEpisodes(allEpisodes);
    onSelect(allEpisodes);
  };

  const handleClearAll = () => {
    setSelectedEpisodes([]);
    onSelect([]);
  };

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 rounded-lg border-2 border-sunset-700/50 bg-sunset-900/30 hover:border-sunset-600 transition-all flex items-center justify-between"
      >
        <span className="text-sunset-200 font-semibold">
          Bulk Episode Download{" "}
          {selectedEpisodes.length > 0 && (
            <span className="text-sunset-400">
              ({selectedEpisodes.length} selected)
            </span>
          )}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-sunset-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
        />
      </button>

      {isExpanded && (
        <div className="mt-3 p-4 rounded-lg border border-sunset-700/50 bg-sunset-900/20 backdrop-blur-sm space-y-4">
          {/* Quick Actions */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleSelectAll}
              className="px-3 py-1 text-sm rounded bg-sunset-500/30 hover:bg-sunset-500/50 text-sunset-200 font-medium transition-colors"
            >
              Select All
            </button>
            <button
              onClick={handleClearAll}
              className="px-3 py-1 text-sm rounded bg-sunset-500/30 hover:bg-sunset-500/50 text-sunset-200 font-medium transition-colors"
            >
              Clear All
            </button>
          </div>

          {/* Range Selector */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-sunset-300 font-semibold">
                From
              </label>
              <input
                type="number"
                min="1"
                value={rangeStart}
                onChange={(e) => setRangeStart(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full p-2 rounded bg-sunset-900/50 border border-sunset-700/50 text-white text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-sunset-300 font-semibold">
                To
              </label>
              <input
                type="number"
                min="1"
                value={rangeEnd}
                onChange={(e) => setRangeEnd(Math.max(rangeStart, parseInt(e.target.value) || 12))}
                className="w-full p-2 rounded bg-sunset-900/50 border border-sunset-700/50 text-white text-sm"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleSelectRange}
                className="w-full px-3 py-2 rounded bg-sunset-500/50 hover:bg-sunset-500/70 text-sunset-100 font-semibold text-sm transition-colors"
              >
                Add Range
              </button>
            </div>
          </div>

          {/* Episode Grid */}
          <div className="grid grid-cols-6 sm:grid-cols-10 gap-1 max-h-60 overflow-y-auto p-2 bg-sunset-900/30 rounded">
            {Array.from({ length: 50 }, (_, i) => i + 1).map((ep) => (
              <button
                key={ep}
                onClick={() => handleSelectEpisode(ep)}
                className={`aspect-square rounded text-xs font-semibold transition-all flex items-center justify-center relative ${
                  selectedEpisodes.includes(ep)
                    ? "bg-sunset-500 text-white"
                    : "bg-sunset-900/50 text-sunset-300 hover:bg-sunset-700/50"
                }`}
              >
                {ep}
                {selectedEpisodes.includes(ep) && (
                  <Check className="w-3 h-3 absolute top-0.5 right-0.5" />
                )}
              </button>
            ))}
          </div>

          {selectedEpisodes.length > 0 && (
            <div className="p-3 rounded bg-sunset-500/10 border border-sunset-500/30">
              <p className="text-sunset-300 text-sm">
                <span className="font-semibold">Selected episodes:</span>{" "}
                {selectedEpisodes.slice(0, 10).join(", ")}
                {selectedEpisodes.length > 10 && `... and ${selectedEpisodes.length - 10} more`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
