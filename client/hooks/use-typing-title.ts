import { useEffect } from "react";

export function useTypingTitle(
  fullTitle: string = "Sunset Downloader",
  speed: number = 120,
) {
  useEffect(() => {
    let currentIndex = 0;
    let isDeleting = false;
    let typingTimer: NodeJS.Timeout;

    const typeTitle = () => {
      const displayText = fullTitle.substring(0, currentIndex);

      // Add cursor blink for fade effect
      const fadeText =
        displayText +
        (currentIndex < fullTitle.length && !isDeleting ? "█" : "");
      document.title = fadeText || "Sunset Downloader";

      if (!isDeleting) {
        // Typing phase - smooth with minimal speed variation
        if (currentIndex < fullTitle.length) {
          currentIndex++;
          // Very subtle speed adjustment for ultra-smooth effect
          const adaptiveSpeed =
            speed * (0.95 + (currentIndex / fullTitle.length) * 0.1);
          typingTimer = setTimeout(typeTitle, adaptiveSpeed);
        } else {
          // Pause before deleting
          typingTimer = setTimeout(() => {
            isDeleting = true;
            typeTitle();
          }, 3000);
        }
      } else {
        // Deleting phase - smooth fade out
        if (currentIndex > 0) {
          currentIndex--;
          // Slower delete speed for smooth fade
          const deleteSpeed =
            (speed / 2) * (0.9 + (currentIndex / fullTitle.length) * 0.1);
          typingTimer = setTimeout(typeTitle, deleteSpeed);
        } else {
          // Pause before typing again
          isDeleting = false;
          typingTimer = setTimeout(typeTitle, 1000);
        }
      }
    };

    typeTitle();

    return () => {
      clearTimeout(typingTimer);
      document.title = fullTitle;
    };
  }, [fullTitle, speed]);
}
