import { useEffect } from "react";

export function useTypingTitle(
  fullTitle: string = "Sunset Downloader",
  speed: number = 50,
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
        // Typing phase - smooth with variable speed
        if (currentIndex < fullTitle.length) {
          currentIndex++;
          // Speed accelerates slightly toward the end
          const adaptiveSpeed =
            speed * (0.7 + (currentIndex / fullTitle.length) * 0.3);
          typingTimer = setTimeout(typeTitle, adaptiveSpeed);
        } else {
          // Pause before deleting
          typingTimer = setTimeout(() => {
            isDeleting = true;
            typeTitle();
          }, 2500);
        }
      } else {
        // Deleting phase - smooth fade out
        if (currentIndex > 0) {
          currentIndex--;
          // Delete faster with smooth fade
          const deleteSpeed =
            (speed / 2.5) * (0.8 + (currentIndex / fullTitle.length) * 0.2);
          typingTimer = setTimeout(typeTitle, deleteSpeed);
        } else {
          // Pause before typing again
          isDeleting = false;
          typingTimer = setTimeout(typeTitle, 800);
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
