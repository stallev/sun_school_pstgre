import type { PrismaClient } from "../../src/generated/client";
import { SPECIALIZATIONS } from "./fixtures";

const DEPRECATED_SPECIALIZATION_SLUGS = ["yoga"] as const;

export async function seedSpecializations(prisma: PrismaClient) {
  for (const spec of SPECIALIZATIONS) {
    await prisma.specialization.upsert({
      where: { slug: spec.slug },
      update: { name: spec.name },
      create: { slug: spec.slug, name: spec.name },
    });
  }

  await removeDeprecatedSpecializations(prisma);
}

export async function removeDeprecatedSpecializations(prisma: PrismaClient) {
  for (const slug of DEPRECATED_SPECIALIZATION_SLUGS) {
    const row = await prisma.specialization.findUnique({ where: { slug } });
    if (!row) {
      continue;
    }

    await prisma.trainerSpecialization.deleteMany({
      where: { specializationId: row.id },
    });

    await prisma.specialization.delete({ where: { id: row.id } });
  }
}

export async function getSpecializationMap(prisma: PrismaClient) {
  const rows = await prisma.specialization.findMany();
  return new Map(rows.map((row) => [row.slug, row.id]));
}
