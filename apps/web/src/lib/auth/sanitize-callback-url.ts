import { isCanonicalRoute } from "@sunschool/policy-edge";

/** Keeps only relative canonical paths for Telegram `callbackUrl` (auth_runtime_spec §5.4, S-2). */
export const sanitizeCallbackUrl = (raw: string | undefined | null): string => {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  const path = (raw.split(/[?#]/, 1)[0] ?? "/").replace(/\/+$/, "") || "/";
  return isCanonicalRoute(path) ? path : "/";
};
