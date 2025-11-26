import { useEffect } from "react";

export function useTypingTitle(
  fullTitle: string = "Sunset Downloader",
  speed: number = 100
) {
  useEffect(() => {
    let currentIndex = 0;
    let isDeleting = false;
    let typingTimer: NodeJS.Timeout;

    const typeTitle = () => {
      const displayText = fullTitle.substring(0, currentIndex);
      document.title = displayText || "Sunset Downloader";

      if (!isDeleting) {
        // Typing phase
        if (currentIndex < fullTitle.length) {
          currentIndex++;
          typingTimer = setTimeout(typeTitle, speed);
        } else {
          // Pause before deleting
          typingTimer = setTimeout(() => {
            isDeleting = true;
            typeTitle();
          }, 2000);
        }
      } else {
        // Deleting phase
        if (currentIndex > 0) {
          currentIndex--;
          typingTimer = setTimeout(typeTitle, speed / 2);
        } else {
          // Pause before typing again
          isDeleting = false;
          typingTimer = setTimeout(typeTitle, 500);
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
