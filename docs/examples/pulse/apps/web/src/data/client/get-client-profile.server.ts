import "server-only";

import { getPrisma } from "@pulse/db";

import { getPolicySessionContext } from "@/server/auth/session-to-policy-context";

export type ClientProfile = {
  fullName: string;
  email: string;
  avatarUrl: string | null;
};

export async function getClientProfile(): Promise<ClientProfile | null> {
  const ctx = await getPolicySessionContext();
  if (!ctx) {
    return null;
  }

  const prisma = getPrisma();
  const user = await prisma.user.findFirst({
    where: { id: ctx.userId },
    select: {
      fullName: true,
      email: true,
      avatarUrl: true,
    },
  });

  if (!user) {
    return null;
  }

  return {
    fullName: user.fullName,
    email: user.email,
    avatarUrl: user.avatarUrl,
  };
}
