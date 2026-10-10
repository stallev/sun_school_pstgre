import { PulseGoogleAnalytics } from "@/components/analytics/PulseGoogleAnalytics";
import { LocaleProvider } from "@/components/i18n/LocaleProvider.client";
import { DEFAULT_LOCALE } from "@/lib/i18n/constants";
import { getMessagesForLocale } from "@/lib/messages";
import { cn } from "@/lib/utils";

type RootLayoutFallbackProps = {
  children: React.ReactNode;
  fontClassName: string;
};

/**
 * Deterministic App Shell fallback — no ThemeProvider / Toaster (crypto / theme
 * APIs must not run in Instant Navigations prerender shell).
 */
export function RootLayoutFallback({
  children,
  fontClassName,
}: RootLayoutFallbackProps) {
  const messages = getMessagesForLocale(DEFAULT_LOCALE);

  return (
    <html
      lang={DEFAULT_LOCALE}
      suppressHydrationWarning
      className={cn(fontClassName, "h-full antialiased")}
    >
      <body className="min-h-full flex flex-col">
        <LocaleProvider locale={DEFAULT_LOCALE} messages={messages}>
          {children}
        </LocaleProvider>
      </body>
      <PulseGoogleAnalytics />
    </html>
  );
}
