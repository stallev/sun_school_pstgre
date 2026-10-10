"use client";

import { useEffect, useRef, useState } from "react";

export function useRevealOnScroll(options?: {
  threshold?: number;
  rootMargin?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (revealed) {
      return;
    }

    const element = ref.current;
    if (!element) {
      return;
    }

    const reveal = () => {
      requestAnimationFrame(() => setRevealed(true));
    };

    const rect = element.getBoundingClientRect();
    if (rect.top < window.innerHeight * 1.05) {
      reveal();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            reveal();
            observer.disconnect();
          }
        });
      },
      {
        threshold: options?.threshold ?? 0.08,
        rootMargin: options?.rootMargin ?? "0px 0px -40px 0px",
      },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [options?.rootMargin, options?.threshold, revealed]);

  return { ref, revealed };
}
