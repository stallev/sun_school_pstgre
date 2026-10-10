"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { useMessages } from "@/components/i18n/LocaleProvider.client";
import { Button } from "@/components/ui/button";

type ThemeToggleProps = {
  showLabel?: boolean;
  size?: "default" | "sm" | "icon";
};

export function ThemeToggle({
  showLabel = false,
  size = "icon",
}: ThemeToggleProps) {
  const { setTheme, resolvedTheme } = useTheme();
  const messages = useMessages();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";
  const toggleLabel = isDark
    ? messages.shell.themeToggleLight
    : messages.shell.themeToggleDark;

  if (!isMounted) {
    return (
      <Button
        type="button"
        variant="ghost"
        size={size}
        aria-label={messages.shell.themeToggleDark}
      >
        <MoonIcon aria-hidden className="size-4" />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size={size}
      aria-label={toggleLabel}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? (
        <SunIcon aria-hidden className="size-4" />
      ) : (
        <MoonIcon aria-hidden className="size-4" />
      )}
      {showLabel ? (isDark ? "Light" : "Dark") : null}
    </Button>
  );
}
