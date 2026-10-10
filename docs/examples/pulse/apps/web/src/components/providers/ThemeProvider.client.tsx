"use client";

import { useEffect, useState } from "react";
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from "next-themes";

/**
 * Defer next-themes until after mount so Cache Components / Instant Navigations
 * shell prerender does not hit sync `crypto.getRandomValues()` (blocking-prerender-crypto).
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return children;
  }

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
