import "server-only";
import { cache } from "react";
import type { PolicySessionContext } from "@sunschool/policy-server";
import { auth } from "@/auth";
import { loadPolicyContext } from "@/lib/auth/require-user";

/** Authoritative session context for auth screens (status/roles from DB, not JWT). */
export const loadSessionPolicyContext = cache(async (): Promise<PolicySessionContext | null> => {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;
  return loadPolicyContext(userId);
});
