import type { Metadata } from "next";

import { getOgLocale } from "@/lib/i18n/format";
import { getLocale, getMessages } from "@/lib/messages/server";
import { getSiteUrl } from "@/lib/site/site-url";

export async function buildLandingMetadata(): Promise<Metadata> {
  const [messages, locale] = await Promise.all([getMessages(), getLocale()]);
  const siteUrl = getSiteUrl();
  const { title, description, ogImageAlt } = messages.landing.meta;

  return {
    title,
    description,
    keywords: [...messages.landing.meta.keywords],
    alternates: {
      canonical: "/",
    },
    openGraph: {
      type: "website",
      locale: getOgLocale(locale),
      url: siteUrl.origin,
      siteName: messages.site.logoLabel,
      title,
      description,
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: ogImageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/opengraph-image"],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}
