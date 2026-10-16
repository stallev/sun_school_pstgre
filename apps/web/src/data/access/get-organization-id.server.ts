import "server-only";
import type { PrismaClient } from "@sunschool/db";

export async function getDefaultOrganizationId(db: PrismaClient): Promise<string> {
  const organization = await db.organization.findFirst({ orderBy: { createdAt: "asc" }, select: { id: true } });
  if (!organization) throw new Error("run db:seed:reference first");
  return organization.id;
}
