import { useEffect, useRef } from "react";

export default function BackgroundAudio() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasAttemptedPlayRef = useRef(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Set audio properties
    audio.volume = 0.3; // Set volume to 30%
    audio.loop = true;

    // Attempt to play audio
    const playAudio = async () => {
      if (hasAttemptedPlayRef.current) return;
      hasAttemptedPlayRef.current = true;

      try {
        await audio.play();
      } catch {
        // Autoplay might be blocked by browser policy, that's expected
        // Listen for user interaction to play
        const handleInteraction = async () => {
          try {
            await audio.play();
          } catch {
            // Still blocked
          }
          document.removeEventListener("click", handleInteraction);
          document.removeEventListener("touchstart", handleInteraction);
        };

        document.addEventListener("click", handleInteraction);
        document.addEventListener("touchstart", handleInteraction);
      }
    };

    playAudio();

    return () => {
      if (audio) {
        audio.pause();
      }
    };
  }, []);

  return (
    <audio
      ref={audioRef}
      src="https://cdn.builder.io/o/assets%2F4b378ef2d6a74fe5a3255c22037cbe5f%2Fbfebcc4a3b73470693a7528dd8044dcb?alt=media&token=81d4632b-49ee-4ea5-9383-b3953971b31f&apiKey=4b378ef2d6a74fe5a3255c22037cbe5f"
      preload="auto"
      playsInline
    />
  );
}
