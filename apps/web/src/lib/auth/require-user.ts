import "server-only";
import type { PolicySessionContext } from "@sunschool/policy-server";

/**
 * Server-side checks (auth_runtime_spec §10). Signatures are fixed here; implementations arrive in
 * P01-CU5. Until then the functions fail loudly, so that no route can silently skip the check.
 */
const NOT_IMPLEMENTED = "requireActiveUser is implemented in P01-CU5";

export async function requireActiveUser(): Promise<PolicySessionContext> {
  throw new Error(NOT_IMPLEMENTED);
}
