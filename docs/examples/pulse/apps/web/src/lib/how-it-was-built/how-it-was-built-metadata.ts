import type { Metadata } from "next";

import { getOgLocale } from "@/lib/i18n/format";
import { getLocale, getMessages } from "@/lib/messages/server";
import { getSiteUrl } from "@/lib/site/site-url";

const PATH = "/how-it-was-built";

export async function buildHowItWasBuiltMetadata(): Promise<Metadata> {
  const [messages, locale] = await Promise.all([getMessages(), getLocale()]);
  const siteUrl = getSiteUrl();
  const { title, description, ogImageAlt, keywords } = messages.howItWasBuilt.meta;

  return {
    title,
    description,
    keywords: [...keywords],
    alternates: {
      canonical: PATH,
    },
    openGraph: {
      type: "article",
      locale: getOgLocale(locale),
      url: `${siteUrl.origin}${PATH}`,
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
