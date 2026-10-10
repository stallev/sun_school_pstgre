import { PulseGoogleAnalytics } from "@/components/analytics/PulseGoogleAnalytics";
import { RootLayoutProviders } from "@/components/i18n/RootLayoutProviders";
import { resolveLocale } from "@/lib/i18n/resolve-locale";
import { getMessages } from "@/lib/messages/server";
import { cn } from "@/lib/utils";

type RootLayoutContentProps = {
  children: React.ReactNode;
  fontClassName: string;
};

/**
 * Cookie/header locale only — no `auth()` here. Auth.js uses sync
 * `crypto.getRandomValues` and blocks Instant Navigations shell prerender
 * (blocking-prerender-crypto) when called in the root layout content.
 */
export async function RootLayoutContent({
  children,
  fontClassName,
}: RootLayoutContentProps) {
  const locale = await resolveLocale();
  const messages = await getMessages(locale);

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={cn(fontClassName, "h-full antialiased")}
    >
      <body className="min-h-full flex flex-col">
        <RootLayoutProviders locale={locale} messages={messages}>
          {children}
        </RootLayoutProviders>
      </body>
      <PulseGoogleAnalytics />
    </html>
  );
}
