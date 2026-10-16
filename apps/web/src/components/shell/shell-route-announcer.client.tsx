"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

type ShellRouteAnnouncerProps = {
  /** Visually hidden live region for screen readers after navigation. */
  pageTitle?: string;
};

export const ShellRouteAnnouncer = ({ pageTitle }: ShellRouteAnnouncerProps) => {
  const pathname = usePathname();
  const liveRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const main = document.getElementById("main");
    main?.focus({ preventScroll: true });
    if (pageTitle && liveRef.current) {
      liveRef.current.textContent = pageTitle;
    }
  }, [pathname, pageTitle]);

  return (
    <div ref={liveRef} className="sr-only" aria-live="polite" aria-atomic="true" />
  );
};
