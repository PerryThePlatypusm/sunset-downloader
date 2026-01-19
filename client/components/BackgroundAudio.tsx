import { useEffect, useRef } from "react";

export default function BackgroundAudio() {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Set audio properties
    audio.volume = 0.3; // Set volume to 30%
    audio.loop = true;
    audio.play().catch(() => {
      // Autoplay might be blocked, that's okay
    });

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
    />
  );
}
