import "server-only";
import { cache } from "react";
import type { PolicySessionContext } from "@sunschool/policy-server";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/db.server";

/** Authoritative session context for auth screens (status/roles from DB, not JWT). */
export const loadSessionPolicyContext = cache(async (): Promise<PolicySessionContext | null> => {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const db = await getPrisma();
  const user = await db.appUser.findUnique({
    where: { id: userId },
    select: { id: true, status: true, roles: { select: { role: true } } },
  });
  if (!user) return null;
  return { userId: user.id, status: user.status, roles: user.roles.map((entry) => entry.role) };
});
