"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import { setLocaleFromQueryAction } from "@/actions/i18n/set-locale";
import { isAppLocale } from "@/lib/i18n/constants";

export function LocaleQueryHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const handledRef = useRef<string | null>(null);

  useEffect(() => {
    const lang = searchParams.get("lang");

    if (!lang) {
      return;
    }

    const cacheKey = `${lang}:${searchParams.toString()}`;
    if (handledRef.current === cacheKey) {
      return;
    }
    handledRef.current = cacheKey;

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("lang");
    const query = nextParams.toString();
    const nextUrl = query ? `?${query}` : ".";

    if (!isAppLocale(lang)) {
      router.replace(nextUrl, { scroll: false });
      return;
    }

    void setLocaleFromQueryAction(lang).then(() => {
      router.replace(nextUrl, { scroll: false });
      router.refresh();
    });
  }, [router, searchParams]);

  return null;
}
