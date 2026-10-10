import "server-only";

const LOCAL_DEV_URL = "http://localhost:3000";

function normalizeSiteUrl(value: string): URL {
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  return new URL(withProtocol);
}

/** Canonical origin for metadata, Open Graph and JSON-LD absolute URLs. */
export function getSiteUrl(): URL {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    return normalizeSiteUrl(configured);
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return normalizeSiteUrl(vercelUrl);
  }

  return new URL(LOCAL_DEV_URL);
}
