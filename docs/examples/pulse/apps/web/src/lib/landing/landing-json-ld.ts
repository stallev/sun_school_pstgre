import "server-only";

import { getMessages, getLocale } from "@/lib/messages/server";
import { getIntlLocale } from "@/lib/i18n/format";

import { getSiteUrl } from "@/lib/site/site-url";

export async function buildLandingJsonLd() {
  const messages = await getMessages();
  const locale = await getLocale();
  const inLanguage = getIntlLocale(locale);
  const siteUrl = getSiteUrl();
  const origin = siteUrl.origin;
  const { title, description } = messages.landing.meta;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${origin}/#website`,
        url: origin,
        name: messages.site.logoLabel,
        description: messages.site.description,
        inLanguage,
        publisher: { "@id": `${origin}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${origin}/trainers?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": `${origin}/#organization`,
        name: messages.site.logoLabel,
        url: origin,
        description: messages.site.description,
        logo: {
          "@type": "ImageObject",
          url: `${origin}/opengraph-image`,
        },
      },
      {
        "@type": "WebPage",
        "@id": `${origin}/#webpage`,
        url: origin,
        name: title,
        description,
        isPartOf: { "@id": `${origin}/#website` },
        about: { "@id": `${origin}/#organization` },
        inLanguage,
      },
      {
        "@type": "FAQPage",
        "@id": `${origin}/#faq`,
        isPartOf: { "@id": `${origin}/#webpage` },
        mainEntity: messages.landing.faq.items.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
    ],
  };
}
