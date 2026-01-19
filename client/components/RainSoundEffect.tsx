import { useEffect, useRef } from "react";

export default function RainSoundEffect() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);

  useEffect(() => {
    // Initialize Web Audio API for rain sounds
    const initAudio = () => {
      if (audioContextRef.current) return;

      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0.05; // Very low volume for rain effect
      gainNode.connect(audioContext.destination);
      gainNodeRef.current = gainNode;

      // Create multiple layered oscillators for rain-like effect
      const createRainLayer = () => {
        for (let i = 0; i < 3; i++) {
          const osc = audioContext.createOscillator();
          const noise = audioContext.createBufferSource();
          const filter = audioContext.createBiquadFilter();

          osc.type = "sine";
          osc.frequency.value = 50 + Math.random() * 100;
          osc.start();

          // Create white noise effect
          const bufferSize = audioContext.sampleRate * 2;
          const buffer = audioContext.createBuffer(
            1,
            bufferSize,
            audioContext.sampleRate
          );
          const data = buffer.getChannelData(0);
          for (let j = 0; j < bufferSize; j++) {
            data[j] = Math.random() * 2 - 1;
          }

          const gainControl = audioContext.createGain();
          gainControl.gain.value = 0.02;

          filter.type = "highpass";
          filter.frequency.value = 1000;
          filter.Q.value = 1;

          gainControl.connect(filter);
          filter.connect(gainNode);

          oscillatorsRef.current.push(osc);
        }
      };

      // Create initial rain layers
      createRainLayer();
    };

    // Try to initialize on first user interaction
    const handleInteraction = () => {
      initAudio();
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("touchstart", handleInteraction);
    };

    document.addEventListener("click", handleInteraction);
    document.addEventListener("touchstart", handleInteraction);

    return () => {
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("touchstart", handleInteraction);

      if (audioContextRef.current) {
        oscillatorsRef.current.forEach((osc) => {
          try {
            osc.stop();
          } catch {
            // Already stopped
          }
        });
      }
    };
  }, []);

  return null;
}
