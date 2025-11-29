import { useCallback } from "react";

export function usePixelAnimation() {
  const createPixelParticles = useCallback((event: React.MouseEvent) => {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Create 8-12 pixel particles
    const particleCount = Math.random() * 5 + 8;

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement("div");
      const size = Math.random() * 4 + 2; // 2-6px
      const color = ["#ff6b6b", "#ffd93d", "#6bcf7f", "#4d96ff", "#ff6b9d"][
        Math.floor(Math.random() * 5)
      ];

      particle.style.position = "fixed";
      particle.style.left = event.clientX + "px";
      particle.style.top = event.clientY + "px";
      particle.style.width = size + "px";
      particle.style.height = size + "px";
      particle.style.backgroundColor = color;
      particle.style.pointerEvents = "none";
      particle.style.borderRadius = "1px";
      particle.style.zIndex = "9999";

      document.body.appendChild(particle);

      const angle = (Math.PI * 2 * i) / particleCount;
      const velocity = 5 + Math.random() * 3;
      const vx = Math.cos(angle) * velocity;
      const vy = Math.sin(angle) * velocity;
      let px = event.clientX;
      let py = event.clientY;
      let life = 1;

      const animate = () => {
        life -= 0.05;
        px += vx;
        py += vy;

        particle.style.opacity = life.toString();
        particle.style.left = px + "px";
        particle.style.top = py + "px";
        particle.style.transform = `scale(${life})`;

        if (life > 0) {
          requestAnimationFrame(animate);
        } else {
          document.body.removeChild(particle);
        }
      };

      animate();
    }
  }, []);

  return createPixelParticles;
}
