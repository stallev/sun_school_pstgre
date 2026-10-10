"use client";

import { createContext, useContext } from "react";

import { type AppLocale } from "@/lib/i18n/constants";
import type { Messages } from "@/lib/messages/types";

type LocaleContextValue = {
  locale: AppLocale;
  messages: Messages;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export type LocaleProviderProps = {
  locale: AppLocale;
  messages: Messages;
  children: React.ReactNode;
};

export function LocaleProvider({
  locale,
  messages,
  children,
}: LocaleProviderProps) {
  return (
    <LocaleContext.Provider value={{ locale, messages }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): AppLocale {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return context.locale;
}

export function useMessages(): Messages {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useMessages must be used within LocaleProvider");
  }
  return context.messages;
}
