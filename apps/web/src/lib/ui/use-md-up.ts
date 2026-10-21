"use client";

import { useEffect, useState } from "react";

const MD_UP_QUERY = "(min-width: 768px)";

/** Tailwind `md` breakpoint — false until mounted (mobile-first). */
export const useMdUp = () => {
  const [mdUp, setMdUp] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(MD_UP_QUERY);
    const sync = () => setMdUp(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return mdUp;
};
