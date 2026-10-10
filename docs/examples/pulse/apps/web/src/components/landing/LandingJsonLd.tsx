import { buildLandingJsonLd } from "@/lib/landing/landing-json-ld";
import { serializeJsonLd } from "@/lib/landing/serialize-json-ld";

export function LandingJsonLd() {
  const jsonLd = buildLandingJsonLd();

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
    />
  );
}
