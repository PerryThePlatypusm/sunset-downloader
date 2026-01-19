import { useEffect, useRef } from "react";

export default function RainSoundEffect() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const filtersRef = useRef<BiquadFilterNode[]>([]);

  useEffect(() => {
    // Initialize Web Audio API for rain sounds
    const initAudio = () => {
      if (audioContextRef.current) return;

      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0.03; // Very low volume for rain effect
      gainNode.connect(audioContext.destination);
      gainNodeRef.current = gainNode;

      // Create multiple layered oscillators for rain-like effect
      const createRainLayer = () => {
        for (let i = 0; i < 4; i++) {
          const osc = audioContext.createOscillator();
          const filter = audioContext.createBiquadFilter();
          const gainControl = audioContext.createGain();

          // Set oscillator properties
          osc.type = "sine";
          osc.frequency.value = 30 + Math.random() * 80;

          // Set filter properties
          filter.type = "highpass";
          filter.frequency.value = 800 + Math.random() * 800;
          filter.Q.value = 1;

          // Set gain properties
          gainControl.gain.value = 0.01 + Math.random() * 0.02;

          // Connect the nodes
          osc.connect(filter);
          filter.connect(gainControl);
          gainControl.connect(gainNode);

          // Start oscillator
          osc.start();

          // Store references for cleanup
          oscillatorsRef.current.push(osc);
          filtersRef.current.push(filter);
        }
      };

      // Create initial rain layers
      createRainLayer();
    };

    // Try to initialize on first user interaction
    const handleInteraction = () => {
      try {
        initAudio();
      } catch {
        // Audio context initialization failed
      }
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
