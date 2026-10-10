import "server-only";

import type { PolicySessionContext } from "@pulse/domain";

import { auth } from "@/auth";

export async function getPolicySessionContext(): Promise<PolicySessionContext | null> {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    return null;
  }

  return {
    userId: session.user.id,
    role: session.user.role,
  };
}
