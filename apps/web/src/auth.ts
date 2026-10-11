import "server-only";
import NextAuth from "next-auth";
import authConfig from "@/auth.config";

/**
 * Node-runtime Auth.js entry (auth_runtime_spec §3). Skeleton for P5:
 * the `signIn` callback (registration, first admin, link intent) and `redirect` callback are
 * implemented in P01-CU4 / P01-CU11 — until then the defaults of Auth.js apply.
 * No adapter, no Credentials (ADR-003).
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
});
