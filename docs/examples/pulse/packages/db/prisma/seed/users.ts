import bcrypt from "bcryptjs";
import type { PrismaClient, UserRole } from "../../src/generated/client";
import { BCRYPT_COST, FIXTURE_USERS } from "./fixtures";

export type SeededUsers = Record<keyof typeof FIXTURE_USERS, { id: string; email: string }>;

export async function seedUsers(prisma: PrismaClient): Promise<SeededUsers> {
  const result = {} as SeededUsers;

  for (const [key, fixture] of Object.entries(FIXTURE_USERS)) {
    const passwordHash = await bcrypt.hash(fixture.password, BCRYPT_COST);
    const user = await prisma.user.upsert({
      where: { email: fixture.email },
      update: {
        fullName: fixture.fullName,
        role: fixture.role as UserRole,
        passwordHash,
        avatarUrl: fixture.avatarUrl,
      },
      create: {
        email: fixture.email,
        fullName: fixture.fullName,
        role: fixture.role as UserRole,
        passwordHash,
        avatarUrl: fixture.avatarUrl,
      },
    });
    result[key as keyof typeof FIXTURE_USERS] = { id: user.id, email: user.email };
  }

  return result;
}
