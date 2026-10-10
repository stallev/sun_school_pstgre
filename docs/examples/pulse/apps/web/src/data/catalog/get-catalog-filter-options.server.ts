import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { TRAINER_STATUS } from "@pulse/domain";
import { getPrisma } from "@pulse/db";

import { CACHE_TAGS } from "@/lib/cache/tags";

export type CatalogFilterOptions = {
  specializations: { slug: string; name: string }[];
  maxPriceCeilingCents: number;
};

async function fetchCatalogFilterOptions(): Promise<CatalogFilterOptions> {
  const prisma = getPrisma();

  const [specializations, priceAggregate] = await Promise.all([
    prisma.specialization.findMany({
      orderBy: { name: "asc" },
      select: { slug: true, name: true },
    }),
    prisma.trainerService.aggregate({
      where: {
        isActive: true,
        trainerProfile: { status: TRAINER_STATUS.APPROVED },
      },
      _max: { priceCents: true },
    }),
  ]);

  return {
    specializations,
    maxPriceCeilingCents: priceAggregate._max.priceCents ?? 10000,
  };
}

export async function getCatalogFilterOptions(): Promise<CatalogFilterOptions> {
  "use cache";
  cacheTag(CACHE_TAGS.trainersCatalog);
  cacheLife("minutes");

  return fetchCatalogFilterOptions();
}
