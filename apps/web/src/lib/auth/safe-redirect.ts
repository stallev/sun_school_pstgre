/**
 * Auth.js `redirect` callback core (auth_runtime_spec §5.4): only relative paths and same-origin
 * URLs are followed; everything else (an external `callbackUrl`) falls back to `baseUrl`.
 * Matching the path against the canonical routes and the per-status home route is added in CU5.
 */
export const safeRedirect = (url: string, baseUrl: string): string => {
  if (url.startsWith("/") && !url.startsWith("//") && !url.startsWith("/\\")) {
    return `${baseUrl}${url}`;
  }
  try {
    return new URL(url).origin === new URL(baseUrl).origin ? url : baseUrl;
  } catch {
    return baseUrl;
  }
};
