import React from "react";
import { Check, Loader, AlertCircle } from "lucide-react";

interface DownloadProgressProps {
  status: "idle" | "validating" | "downloading" | "success" | "error";
  progress: number;
  fileName?: string | null;
}

export default function DownloadProgress({
  status,
  progress,
  fileName,
}: DownloadProgressProps) {
  const getStatusMessage = () => {
    switch (status) {
      case "validating":
        return "Validating URL and checking availability...";
      case "downloading":
        return "Downloading your media...";
      case "success":
        return `Downloaded successfully: ${fileName}`;
      case "error":
        return "Download failed. Please try again.";
      default:
        return "";
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "downloading":
        return "text-sunset-300";
      case "success":
        return "text-green-300";
      case "error":
        return "text-red-300";
      default:
        return "text-sunset-400";
    }
  };

  const getProgressColor = () => {
    switch (status) {
      case "success":
        return "bg-gradient-to-r from-green-500 to-green-600";
      case "error":
        return "bg-gradient-to-r from-red-500 to-red-600";
      default:
        return "bg-gradient-to-r from-sunset-500 to-pink-500";
    }
  };

  const getProgressBarColor = () => {
    switch (status) {
      case "success":
        return "bg-green-500/20";
      case "error":
        return "bg-red-500/20";
      default:
        return "bg-sunset-900/50";
    }
  };

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Status Message */}
      <div className="flex items-center gap-3">
        {(status === "validating" || status === "downloading") && (
          <Loader className="w-5 h-5 text-sunset-400 animate-spin" />
        )}
        {status === "success" && <Check className="w-5 h-5 text-green-400" />}
        {status === "error" && <AlertCircle className="w-5 h-5 text-red-400" />}
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusMessage()}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full">
        <div
          className={`w-full h-2 rounded-full overflow-hidden ${getProgressBarColor()}`}
        >
          <div
            className={`h-full transition-all duration-300 ease-out ${getProgressColor()}`}
            style={{
              width: `${Math.min(progress, 100)}%`,
              boxShadow:
                status === "success"
                  ? "0 0 10px rgba(34, 197, 94, 0.5)"
                  : status === "error"
                    ? "0 0 10px rgba(239, 68, 68, 0.5)"
                    : "0 0 10px rgba(234, 88, 12, 0.5)",
            }}
          />
        </div>
        {(status === "downloading" || status === "validating") && (
          <p className="text-xs text-sunset-400 mt-2">{progress}%</p>
        )}
      </div>

      {/* Pixel Animation */}
      {status === "downloading" && (
        <div className="flex gap-1 justify-center mt-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-gradient-to-r from-sunset-500 to-pink-500 animate-bounce"
              style={{
                animationDelay: `${i * 0.1}s`,
                animationDuration: "1s",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
