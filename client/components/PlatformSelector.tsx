import React from "react";
import {
  Youtube,
  Music,
  Instagram,
  Twitter,
  Zap,
  Radio,
  Video,
  Play,
  BookOpen,
  Globe,
} from "lucide-react";

interface Platform {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const platforms: Platform[] = [
  {
    id: "youtube",
    name: "YouTube",
    icon: <Youtube className="w-5 h-5" />,
    color: "text-red-400",
    bgColor: "hover:bg-red-500/20",
  },
  {
    id: "spotify",
    name: "Spotify",
    icon: <Music className="w-5 h-5" />,
    color: "text-green-400",
    bgColor: "hover:bg-green-500/20",
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: <Instagram className="w-5 h-5" />,
    color: "text-pink-400",
    bgColor: "hover:bg-pink-500/20",
  },
  {
    id: "twitter",
    name: "Twitter/X",
    icon: <Twitter className="w-5 h-5" />,
    color: "text-blue-400",
    bgColor: "hover:bg-blue-500/20",
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: <Zap className="w-5 h-5" />,
    color: "text-cyan-400",
    bgColor: "hover:bg-cyan-500/20",
  },
  {
    id: "soundcloud",
    name: "SoundCloud",
    icon: <Radio className="w-5 h-5" />,
    color: "text-orange-400",
    bgColor: "hover:bg-orange-500/20",
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: <Globe className="w-5 h-5" />,
    color: "text-blue-500",
    bgColor: "hover:bg-blue-600/20",
  },
  {
    id: "twitch",
    name: "Twitch",
    icon: <Play className="w-5 h-5" />,
    color: "text-purple-400",
    bgColor: "hover:bg-purple-500/20",
  },
  {
    id: "crunchyroll",
    name: "Crunchyroll",
    icon: <Video className="w-5 h-5" />,
    color: "text-yellow-400",
    bgColor: "hover:bg-yellow-500/20",
  },
  {
    id: "hianime",
    name: "HiAnime",
    icon: <BookOpen className="w-5 h-5" />,
    color: "text-indigo-400",
    bgColor: "hover:bg-indigo-500/20",
  },
  {
    id: "reddit",
    name: "Reddit",
    icon: <Globe className="w-5 h-5" />,
    color: "text-orange-500",
    bgColor: "hover:bg-orange-600/20",
  },
  {
    id: "pinterest",
    name: "Pinterest",
    icon: <Zap className="w-5 h-5" />,
    color: "text-red-500",
    bgColor: "hover:bg-red-600/20",
  },
];

interface PlatformSelectorProps {
  selectedPlatform: string | null;
  onSelectPlatform: (platform: string | null) => void;
}

export default function PlatformSelector({
  selectedPlatform,
  onSelectPlatform,
}: PlatformSelectorProps) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
      {platforms.map((platform) => (
        <button
          key={platform.id}
          onClick={() =>
            onSelectPlatform(
              selectedPlatform === platform.id ? null : platform.id,
            )
          }
          className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-2 ${
            selectedPlatform === platform.id
              ? "border-sunset-500 bg-sunset-500/20"
              : "border-sunset-700/50 bg-sunset-900/30 hover:border-sunset-600"
          }`}
          title={platform.name}
        >
          <span className={`${platform.color}`}>{platform.icon}</span>
          <span className="text-xs text-sunset-300 text-center font-medium">
            {platform.name}
          </span>
        </button>
      ))}
    </div>
  );
}
