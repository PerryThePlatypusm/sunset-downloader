import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Upload, Loader } from "lucide-react";

interface BugReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function BugReportModal({
  open,
  onOpenChange,
}: BugReportModalProps) {
  const [description, setDescription] = useState("");
  const [stepsToReproduce, setStepsToReproduce] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getBrowserInfo = () => {
    const ua = navigator.userAgent;
    const browserMatch = ua.match(/(Chrome|Firefox|Safari|Edge)\/[\d.]+/);
    const browser = browserMatch ? browserMatch[0] : "Unknown";
    const device = /Mobile|Android|iPhone|iPad|iPod/.test(ua)
      ? "Mobile"
      : "Desktop";
    const os = /Windows|Mac|Linux|iPhone|iPad|Android/.exec(ua)?.[0] || "Unknown";

    return {
      browser,
      device,
      os,
      userAgent: ua,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      language: navigator.language,
    };
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        setError("File size must be less than 50MB");
        return;
      }

      const allowedTypes = [
        "image/png",
        "image/jpeg",
        "image/gif",
        "video/mp4",
        "video/webm",
      ];
      if (!allowedTypes.includes(file.type)) {
        setError("Only images (PNG, JPG, GIF) and videos (MP4, WebM) allowed");
        return;
      }

      setAttachment(file);
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      setError("Please describe the bug");
      return;
    }

    if (!stepsToReproduce.trim()) {
      setError("Please provide steps to reproduce");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const browserInfo = getBrowserInfo();
      const formData = new FormData();

      formData.append("description", description);
      formData.append("stepsToReproduce", stepsToReproduce);
      formData.append("browserInfo", JSON.stringify(browserInfo));

      if (attachment) {
        formData.append("attachment", attachment);
      }

      const response = await fetch("/api/bug-report", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errorMsg = "Failed to submit bug report";
        try {
          const error = await response.json();
          errorMsg = error.error || errorMsg;
        } catch {
          errorMsg = `Server error: ${response.statusText}`;
        }
        throw new Error(errorMsg);
      }

      setSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
        setDescription("");
        setStepsToReproduce("");
        setAttachment(null);
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit bug report");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-sunset-900 border border-sunset-700 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-sunset-100">Report a Bug</DialogTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 text-sunset-400 hover:text-sunset-200"
          >
            <X className="w-5 h-5" />
          </button>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Bug Description */}
          <div>
            <label className="block text-sunset-200 font-semibold mb-2">
              Bug Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setError("");
              }}
              placeholder="What's the issue you encountered?"
              className="w-full p-3 rounded-lg bg-sunset-900/50 border border-sunset-700 text-white placeholder:text-sunset-500 focus:border-sunset-500 focus:ring-1 focus:ring-sunset-500 resize-none h-24"
            />
          </div>

          {/* Steps to Reproduce */}
          <div>
            <label className="block text-sunset-200 font-semibold mb-2">
              Steps to Reproduce *
            </label>
            <textarea
              value={stepsToReproduce}
              onChange={(e) => {
                setStepsToReproduce(e.target.value);
                setError("");
              }}
              placeholder="1. Click...&#10;2. Enter...&#10;3. Observe..."
              className="w-full p-3 rounded-lg bg-sunset-900/50 border border-sunset-700 text-white placeholder:text-sunset-500 focus:border-sunset-500 focus:ring-1 focus:ring-sunset-500 resize-none h-24"
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sunset-200 font-semibold mb-2">
              Screenshot or Video (Optional)
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-sunset-700/50 rounded-lg p-6 text-center cursor-pointer hover:border-sunset-500 transition-colors"
            >
              <Upload className="w-6 h-6 mx-auto mb-2 text-sunset-400" />
              <p className="text-sunset-300 text-sm">
                {attachment
                  ? `Selected: ${attachment.name}`
                  : "Click to upload or drag and drop"}
              </p>
              <p className="text-sunset-500 text-xs">
                PNG, JPG, GIF, MP4 or WebM (max 50MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept="image/*,video/*"
                className="hidden"
              />
            </div>
          </div>

          {/* Browser Info Display */}
          <div className="p-3 rounded-lg bg-sunset-500/10 border border-sunset-500/30">
            <p className="text-sunset-300 text-sm">
              <span className="font-semibold">Captured Info:</span> {navigator.userAgent.split(" ").slice(-2).join(" ")} on{" "}
              {/Windows|Mac|Linux|iPhone|iPad|Android/.exec(navigator.userAgent)?.[0] ||
                "Unknown"}{" "}
              • Anonymous
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="p-3 rounded-lg bg-green-500/20 border border-green-500/50">
              <p className="text-green-300 text-sm">
                ✓ Bug report submitted! Thanks for helping improve SunsetDownloader.
              </p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting || success}
            className="w-full bg-gradient-to-r from-sunset-500 to-pink-500 hover:from-sunset-600 hover:to-pink-600 text-white font-semibold py-2"
          >
            {isSubmitting ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : success ? (
              "✓ Submitted"
            ) : (
              "Submit Bug Report"
            )}
          </Button>

          <p className="text-sunset-400 text-xs text-center">
            Your report is anonymous and helps us make SunsetDownloader better.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
