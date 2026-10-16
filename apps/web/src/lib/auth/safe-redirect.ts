/**
 * Auth.js `redirect` callback core (auth_runtime_spec §5.4): only relative paths and same-origin
 * URLs are followed, and only when the path is a canonical route (`isAllowedPath`, from
 * policy-edge). Anything else — an external `callbackUrl`, an unknown path — lands on `baseUrl`,
 * where the proxy sends the user to the home route of their status.
 */
export const safeRedirect = (url: string, baseUrl: string, isAllowedPath: (pathname: string) => boolean): string => {
  if (url.startsWith("/") && !url.startsWith("//") && !url.startsWith("/\\")) {
    return isAllowedPath(url) ? `${baseUrl}${url}` : baseUrl;
  }
  try {
    const target = new URL(url);
    if (target.origin !== new URL(baseUrl).origin) return baseUrl;
    return isAllowedPath(target.pathname) ? url : baseUrl;
  } catch {
    return baseUrl;
  }
};
