import { useCallback } from "react";

export function useConfetti() {
  const createConfetti = useCallback(() => {
    const confettiCount = 50;
    const colors = [
      "#ff6b6b",
      "#ffd93d",
      "#6bcf7f",
      "#4d96ff",
      "#ff6b9d",
      "#a78bfa",
      "#34d399",
      "#f97316",
    ];

    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement("div");
      const size = Math.random() * 8 + 4; // 4-12px
      const color = colors[Math.floor(Math.random() * colors.length)];
      const startX = Math.random() * window.innerWidth;
      const startY = -10;

      confetti.style.position = "fixed";
      confetti.style.left = startX + "px";
      confetti.style.top = startY + "px";
      confetti.style.width = size + "px";
      confetti.style.height = size + "px";
      confetti.style.backgroundColor = color;
      confetti.style.pointerEvents = "none";
      confetti.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";
      confetti.style.zIndex = "9999";
      confetti.style.opacity = "1";

      document.body.appendChild(confetti);

      const xVelocity = (Math.random() - 0.5) * 8;
      const yVelocity = Math.random() * 5 + 4;
      const rotationVelocity = Math.random() * 10 - 5;
      let rotation = 0;
      let px = startX;
      let py = startY;
      let time = 0;
      const duration = 2000; // 2 seconds
      const startTime = Date.now();

      const animate = () => {
        time = Date.now() - startTime;
        const progress = time / duration;

        if (progress < 1) {
          px += xVelocity;
          py += yVelocity + progress * 3; // Accelerate downward
          rotation += rotationVelocity;

          confetti.style.left = px + "px";
          confetti.style.top = py + "px";
          confetti.style.transform = `rotate(${rotation}deg)`;
          confetti.style.opacity = (1 - progress).toString();

          requestAnimationFrame(animate);
        } else {
          document.body.removeChild(confetti);
        }
      };

      animate();
    }
  }, []);

  return createConfetti;
}
