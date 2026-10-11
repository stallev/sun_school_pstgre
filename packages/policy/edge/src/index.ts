import type { AccountStatus, UserRole } from "@sunschool/domain";

/**
 * JWT-only view of the session for proxy.ts (no DB). Built from the token claims
 * `uid` / `status` / `roles` — see docs/prds/05_runtime/auth_runtime_spec.md §5.2.
 * The decision here is optimistic: the authoritative check is requireActiveUser() on the server.
 */
export type EdgeSession = {
  userId: string;
  status: AccountStatus;
  roles: readonly UserRole[];
};

export type EdgeDecision =
  | { kind: "allow" }
  | { kind: "redirect"; to: string };

/**
 * Stub — the status × route table (authorization_matrix.md §6) is implemented in P01-CU5.
 * Until then every path is allowed so that the scaffold stays runnable.
 */
export function canVisitRoutePrefix(_session: EdgeSession | null, _pathname: string): EdgeDecision {
  return { kind: "allow" };
}
