import { useState, useEffect } from "react";
import { X, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function TOSNotification() {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    // Auto-hide after 7 seconds
    const hideTimer = setTimeout(() => {
      setIsAnimatingOut(true);
      setTimeout(() => setIsVisible(false), 400); // Wait for animation to complete
    }, 7000);

    return () => clearTimeout(hideTimer);
  }, []);

  const handleClose = () => {
    setIsAnimatingOut(true);
    setTimeout(() => setIsVisible(false), 400);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed bottom-6 left-6 right-6 md:right-auto md:w-96 z-40 transition-all duration-400 ease-in-out transform ${
        isAnimatingOut
          ? "translate-y-[120%] opacity-0"
          : "translate-y-0 opacity-100"
      }`}
    >
      <div className="bg-gradient-to-r from-orange-600 to-orange-500 border border-orange-400 rounded-lg p-4 shadow-xl shadow-orange-500/50 backdrop-blur-sm">
        <div className="flex gap-3 items-start">
          <AlertCircle className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white mb-1">
              Important: Check Terms of Service
            </p>
            <p className="text-sm text-orange-50 mb-3">
              Please review our Terms of Service before downloading to
              understand your legal responsibilities.
            </p>
            <Link
              to="/terms-of-service"
              className="inline-flex items-center text-sm font-semibold text-white hover:text-orange-100 transition-colors underline"
            >
              Read Terms of Service →
            </Link>
          </div>
          <button
            onClick={handleClose}
            className="text-white hover:text-orange-100 transition-colors flex-shrink-0 mt-1"
            aria-label="Close notification"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
