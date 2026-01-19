import { useEffect, useRef } from "react";

interface Raindrop {
  id: number;
  x: number;
  y: number;
  duration: number;
  delay: number;
  size: number;
  opacity: number;
}

export default function RainyBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const raindropsRef = useRef<Raindrop[]>([]);
  const nextIdRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create random raindrops continuously
    const createRaindrop = () => {
      const id = nextIdRef.current++;
      const raindrop: Raindrop = {
        id,
        x: Math.random() * 100,
        y: -10,
        duration: 2 + Math.random() * 2,
        delay: Math.random() * 0.5,
        size: 1 + Math.random() * 2,
        opacity: 0.3 + Math.random() * 0.5,
      };

      raindropsRef.current.push(raindrop);

      // Create the DOM element
      const drop = document.createElement("div");
      drop.className = "absolute rounded-full bg-white pointer-events-none animate-raindrop";
      drop.style.left = `${raindrop.x}%`;
      drop.style.top = `${raindrop.y}%`;
      drop.style.width = `${raindrop.size}px`;
      drop.style.height = `${raindrop.size}px`;
      drop.style.opacity = `${raindrop.opacity}`;
      drop.style.animation = `raindrop ${raindrop.duration}s linear ${raindrop.delay}s infinite`;
      drop.style.willChange = "transform";

      container.appendChild(drop);

      // Remove element after animation completes
      const timeout = setTimeout(() => {
        drop.remove();
        raindropsRef.current = raindropsRef.current.filter((r) => r.id !== id);
      }, (raindrop.duration + raindrop.delay + 0.1) * 1000);

      return () => clearTimeout(timeout);
    };

    // Create raindrops at regular intervals
    const interval = setInterval(createRaindrop, 100);

    return () => {
      clearInterval(interval);
      raindropsRef.current = [];
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{
        background: `linear-gradient(45deg, #4a148c, #6a1b9a, #7b1fa2, #4a148c)`,
        backgroundSize: "400% 400%",
        animation: "gradientShift 15s ease infinite",
        zIndex: 0,
      }}
    />
  );
}
