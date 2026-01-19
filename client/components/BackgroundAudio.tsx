import { useEffect, useRef } from "react";
import { useAudio } from "@/context/AudioContext";

export default function BackgroundAudio() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasAttemptedPlayRef = useRef(false);
  const { isMuted } = useAudio();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Handle mute state
    if (isMuted) {
      audio.pause();
    } else {
      // Try to play if not muted
      const playAudio = async () => {
        try {
          await audio.play();
        } catch {
          // Autoplay might be blocked, that's okay
        }
      };
      playAudio();
    }
  }, [isMuted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Set audio properties
    audio.volume = 0.3; // Set volume to 30%
    audio.loop = true;

    // Attempt to play audio on first load
    const playAudio = async () => {
      if (hasAttemptedPlayRef.current || isMuted) return;
      hasAttemptedPlayRef.current = true;

      try {
        await audio.play();
      } catch {
        // Autoplay might be blocked by browser policy, that's expected
        // Listen for user interaction to play
        const handleInteraction = async () => {
          try {
            if (!isMuted) {
              await audio.play();
            }
          } catch {
            // Still blocked
          }
          document.removeEventListener("click", handleInteraction);
          document.removeEventListener("touchstart", handleInteraction);
        };

        document.addEventListener("click", handleInteraction);
        document.addEventListener("touchstart", handleInteraction);

        return () => {
          document.removeEventListener("click", handleInteraction);
          document.removeEventListener("touchstart", handleInteraction);
        };
      }
    };

    playAudio();

    return () => {
      if (audio) {
        audio.pause();
      }
    };
  }, [isMuted]);

  return (
    <audio
      ref={audioRef}
      src="https://cdn.builder.io/o/assets%2F4b378ef2d6a74fe5a3255c22037cbe5f%2F93eb007787e546abaac3f37dbd052b98?alt=media&token=b6282761-4629-437d-8525-33e931d99bcf&apiKey=4b378ef2d6a74fe5a3255c22037cbe5f"
      preload="auto"
      playsInline
    />
  );
}
