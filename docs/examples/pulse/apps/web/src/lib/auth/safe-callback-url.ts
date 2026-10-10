import type { UserRole } from "@pulse/domain";
import { getRoleHome } from "@pulse/policy-edge";

const BLOCKED_PREFIXES = ["//", "http:", "https:", "javascript:", "data:"];

export function resolveSafeCallbackUrl(
  callbackUrl: string | null | undefined,
  role: UserRole,
): string {
  if (!callbackUrl) {
    return getRoleHome(role);
  }

  const trimmed = callbackUrl.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return getRoleHome(role);
  }

  for (const prefix of BLOCKED_PREFIXES) {
    if (trimmed.toLowerCase().startsWith(prefix)) {
      return getRoleHome(role);
    }
  }

  return trimmed;
}
