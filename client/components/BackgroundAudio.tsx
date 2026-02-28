import { useEffect, useRef } from "react";
import { useAudio } from "@/context/AudioContext";

export default function BackgroundAudio() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasSetupInteractionRef = useRef(false);
  const { isMuted } = useAudio();

  // Handle mute state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.pause();
    } else {
      // Try to play if not muted
      const playAudio = async () => {
        try {
          await audio.play();
        } catch (error) {
          console.log("Audio play failed (expected on first interaction):", error);
        }
      };
      playAudio();
    }
  }, [isMuted]);

  // Initialize audio and set up interaction handler
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Set audio properties
    audio.volume = 0.3; // Set volume to 30%
    audio.loop = true;

    // Function to attempt playing audio
    const attemptPlay = async () => {
      if (isMuted) return;
      try {
        await audio.play();
        console.log("✓ Audio started playing");
      } catch (error) {
        console.log("Audio autoplay blocked, waiting for user interaction");
      }
    };

    // Try to play immediately (might be blocked)
    attemptPlay();

    // Set up user interaction handler for browsers that block autoplay
    const handleInteraction = async () => {
      if (hasSetupInteractionRef.current) return;
      hasSetupInteractionRef.current = true;

      try {
        if (!isMuted) {
          await audio.play();
          console.log("✓ Audio started after user interaction");
        }
      } catch (error) {
        // Silently fail - audio is optional background ambience
        // Don't report errors since audio may not be available
        console.log("Audio unavailable - continuing without background audio");
      }

      // Remove listeners after first interaction
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("touchstart", handleInteraction);
    };

    document.addEventListener("click", handleInteraction);
    document.addEventListener("touchstart", handleInteraction);

    return () => {
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("touchstart", handleInteraction);
      if (audio) {
        audio.pause();
      }
    };
  }, [isMuted]);

  const handleAudioError = () => {
    console.warn("Background audio failed to load - falling back gracefully");
  };

  return (
    <audio
      ref={audioRef}
      crossOrigin="anonymous"
      preload="auto"
      playsInline
      controls={false}
      onError={handleAudioError}
    >
      {/* Primary audio source */}
      <source
        src="https://cdn.builder.io/o/assets%2F4b378ef2d6a74fe5a3255c22037cbe5f%2F93eb007787e546abaac3f37dbd052b98?alt=media&token=b6282761-4629-437d-8525-33e931d99bcf&apiKey=4b378ef2d6a74fe5a3255c22037cbe5f"
        type="audio/mpeg"
      />
      Your browser does not support the audio element.
    </audio>
  );
}
