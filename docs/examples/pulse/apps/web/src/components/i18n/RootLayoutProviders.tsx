import { Suspense } from "react";

import { LocaleProvider } from "@/components/i18n/LocaleProvider.client";
import { LocaleQueryHandler } from "@/components/i18n/LocaleQueryHandler.client";
import { ThemeProvider } from "@/components/providers/ThemeProvider.client";
import { Toaster } from "@/components/ui/sonner";
import type { AppLocale } from "@/lib/i18n/constants";
import type { Messages } from "@/lib/messages/types";

type RootLayoutProvidersProps = {
  children: React.ReactNode;
  locale: AppLocale;
  messages: Messages;
};

export function RootLayoutProviders({
  children,
  locale,
  messages,
}: RootLayoutProvidersProps) {
  return (
    <LocaleProvider locale={locale} messages={messages}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <Suspense fallback={null}>
          <LocaleQueryHandler />
        </Suspense>
        {children}
        <Toaster />
      </ThemeProvider>
    </LocaleProvider>
  );
}
