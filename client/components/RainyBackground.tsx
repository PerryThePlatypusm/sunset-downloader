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
        duration: 3 + Math.random() * 2,
        delay: Math.random() * 0.5,
        size: 1.5 + Math.random() * 2.5,
        opacity: 0.4 + Math.random() * 0.4,
      };

      raindropsRef.current.push(raindrop);

      // Create the DOM element
      const drop = document.createElement("div");
      drop.className = "absolute rounded-full bg-white pointer-events-none";
      drop.style.left = `${raindrop.x}%`;
      drop.style.top = `${raindrop.y}%`;
      drop.style.width = `${raindrop.size}px`;
      drop.style.height = `${raindrop.size}px`;
      drop.style.opacity = `${raindrop.opacity}`;
      drop.style.animation = `raindrop ${raindrop.duration}s linear ${raindrop.delay}s forwards`;
      drop.style.willChange = "transform";
      drop.style.boxShadow = `0 0 ${raindrop.size * 0.5}px rgba(255, 255, 255, 0.8)`;

      container.appendChild(drop);

      // Remove element after animation completes
      const timeout = setTimeout(() => {
        if (drop.parentNode) {
          drop.remove();
        }
        raindropsRef.current = raindropsRef.current.filter((r) => r.id !== id);
      }, (raindrop.duration + raindrop.delay) * 1000);

      return () => clearTimeout(timeout);
    };

    // Create raindrops at regular intervals
    const interval = setInterval(createRaindrop, 80);

    return () => {
      clearInterval(interval);
      container.innerHTML = "";
      raindropsRef.current = [];
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none overflow-hidden gradient-animated"
      style={{
        background: `linear-gradient(135deg, #4a148c 0%, #6a1b9a 25%, #7b1fa2 50%, #6a1b9a 75%, #4a148c 100%)`,
        backgroundSize: "200% 200%",
        animation: "gradientShift 20s ease infinite",
        zIndex: 0,
      }}
    />
  );
}
