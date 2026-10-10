"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { setLocaleAction } from "@/actions/i18n/set-locale";
import { useLocale, useMessages } from "@/components/i18n/LocaleProvider.client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  PRODUCT_TOAST_DURATION_MS,
} from "@/lib/ui/product-toast";
import { type AppLocale, SUPPORTED_LOCALES } from "@/lib/i18n/constants";

type LocaleSwitcherVariant = "compact" | "footer" | "settingsRow";

export type LocaleSwitcherProps = {
  variant?: LocaleSwitcherVariant;
  className?: string;
};

function getLocaleLabel(locale: AppLocale, messages: ReturnType<typeof useMessages>) {
  return locale === "en" ? messages.locale.enShort : messages.locale.ruShort;
}

export function LocaleSwitcher({
  variant = "compact",
  className,
}: LocaleSwitcherProps) {
  const activeLocale = useLocale();
  const messages = useMessages();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleSelect = (locale: AppLocale) => {
    if (locale === activeLocale || pending) {
      return;
    }

    startTransition(() => {
      void setLocaleAction(locale).then((result) => {
        if (!result.ok) {
          toast.error(result.message, {
            duration: PRODUCT_TOAST_DURATION_MS,
          });
          return;
        }
        router.refresh();
      });
    });
  };

  return (
    <div
      role="group"
      aria-label={messages.locale.switcherLabel}
      aria-busy={pending}
      className={cn(
        "inline-flex rounded-full border border-border bg-muted/40 p-0.5",
        variant === "footer" && "bg-background/80",
        className,
      )}
    >
      {SUPPORTED_LOCALES.map((locale) => {
        const isActive = locale === activeLocale;
        return (
          <Button
            key={locale}
            type="button"
            size="sm"
            variant={isActive ? "default" : "ghost"}
            className={cn(
              "min-h-9 min-w-11 rounded-full px-3 text-xs font-semibold",
              !isActive && "text-muted-foreground hover:text-foreground",
            )}
            disabled={pending}
            aria-pressed={isActive}
            onClick={() => handleSelect(locale)}
          >
            {getLocaleLabel(locale, messages)}
          </Button>
        );
      })}
    </div>
  );
}
