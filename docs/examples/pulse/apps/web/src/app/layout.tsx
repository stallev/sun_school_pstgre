import type { Metadata } from "next";
import { JetBrains_Mono, Manrope, Source_Serif_4 } from "next/font/google";
import { Suspense } from "react";

import { RootLayoutContent } from "@/components/i18n/RootLayoutContent.server";
import { RootLayoutFallback } from "@/components/i18n/RootLayoutFallback.server";
import { readLocaleCookie } from "@/lib/i18n/cookie";
import { DEFAULT_LOCALE } from "@/lib/i18n/constants";
import { getMessages } from "@/lib/messages/server";
import { getSiteUrl } from "@/lib/site/site-url";

import "./globals.css";

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600", "700"],
});

const sourceSerif4 = Source_Serif_4({
  variable: "--font-display",
  subsets: ["latin", "cyrillic"],
  weight: ["400"],
  style: ["normal", "italic"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500"],
});

const fontClassName = [
  manrope.variable,
  sourceSerif4.variable,
  jetbrainsMono.variable,
].join(" ");

export async function generateMetadata(): Promise<Metadata> {
  const cookieLocale = await readLocaleCookie();
  const messages = await getMessages(cookieLocale ?? DEFAULT_LOCALE);
  return {
    metadataBase: getSiteUrl(),
    title: messages.site.title,
    description: messages.site.description,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Suspense
      fallback={
        <RootLayoutFallback fontClassName={fontClassName}>
          {children}
        </RootLayoutFallback>
      }
    >
      <RootLayoutContent fontClassName={fontClassName}>
        {children}
      </RootLayoutContent>
    </Suspense>
  );
}
