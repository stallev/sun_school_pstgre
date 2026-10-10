import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import {
  CATALOG_SORT,
  TRAINER_STATUS,
  type CatalogTrainersQuery,
} from "@pulse/domain";
import { getPrisma, type Prisma } from "@pulse/db";

import { CACHE_TAGS } from "@/lib/cache/tags";
import {
  mapTrainerRow,
  TRAINER_CARD_SELECT,
  type CatalogTrainerCard,
} from "@/lib/catalog/catalog-trainer-card";

export type CatalogTrainersResult = {
  items: CatalogTrainerCard[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  appliedQuery: CatalogTrainersQuery;
};

function buildCatalogWhere(query: CatalogTrainersQuery): Prisma.TrainerProfileWhereInput {
  const trimmedQuery = query.q.trim();

  return {
    status: TRAINER_STATUS.APPROVED,
    ...(trimmedQuery && {
      OR: [
        {
          user: {
            fullName: { contains: trimmedQuery, mode: "insensitive" },
          },
        },
        { bio: { contains: trimmedQuery, mode: "insensitive" } },
        {
          specializations: {
            some: {
              specialization: {
                name: { contains: trimmedQuery, mode: "insensitive" },
              },
            },
          },
        },
      ],
    }),
    ...(query.minRating !== undefined && {
      ratingAvg: { gte: query.minRating },
    }),
    ...(query.specializations.length > 0 && {
      specializations: {
        some: {
          specialization: { slug: { in: query.specializations } },
        },
      },
    }),
    ...(query.maxPriceCents !== undefined && {
      services: {
        some: {
          isActive: true,
          priceCents: { lte: query.maxPriceCents },
        },
      },
    }),
  };
}

function buildPagination(
  query: CatalogTrainersQuery,
  totalCount: number,
): CatalogTrainersResult["pagination"] {
  const totalPages = Math.max(1, Math.ceil(totalCount / query.pageSize));
  const page = Math.min(query.page, totalPages);

  return {
    page,
    pageSize: query.pageSize,
    totalCount,
    totalPages,
  };
}

async function fetchCatalogTrainersByPriceSort(
  query: CatalogTrainersQuery,
): Promise<CatalogTrainersResult> {
  const where = buildCatalogWhere(query);
  const rows = await getPrisma().trainerProfile.findMany({
    where,
    select: TRAINER_CARD_SELECT,
  });

  const sorted = rows
    .map(mapTrainerRow)
    .sort((left, right) => {
      const leftPrice = left.fromPriceCents ?? Number.MAX_SAFE_INTEGER;
      const rightPrice = right.fromPriceCents ?? Number.MAX_SAFE_INTEGER;
      return leftPrice - rightPrice;
    });

  const totalCount = sorted.length;
  const pagination = buildPagination(query, totalCount);
  const skip = (pagination.page - 1) * pagination.pageSize;

  return {
    items: sorted.slice(skip, skip + pagination.pageSize),
    pagination,
    appliedQuery: { ...query, page: pagination.page },
  };
}

async function fetchCatalogTrainersByDbSort(
  query: CatalogTrainersQuery,
): Promise<CatalogTrainersResult> {
  const where = buildCatalogWhere(query);
  const orderBy: Prisma.TrainerProfileOrderByWithRelationInput[] =
    query.sort === CATALOG_SORT.NEWEST
      ? [{ createdAt: "desc" }]
      : [{ ratingAvg: "desc" }, { ratingCount: "desc" }];

  const skip = (query.page - 1) * query.pageSize;
  const prisma = getPrisma();

  // Read-only catalog: no $transaction — Prisma 7 + adapter-pg parallelizes join
  // fetches on one pg Client inside transactions (pg@9 will hard-fail).
  const [rows, totalCount] = await Promise.all([
    prisma.trainerProfile.findMany({
      where,
      orderBy,
      skip,
      take: query.pageSize,
      select: TRAINER_CARD_SELECT,
    }),
    prisma.trainerProfile.count({ where }),
  ]);

  const pagination = buildPagination(query, totalCount);

  return {
    items: rows.map(mapTrainerRow),
    pagination,
    appliedQuery: { ...query, page: pagination.page },
  };
}

async function fetchCatalogTrainers(
  query: CatalogTrainersQuery,
): Promise<CatalogTrainersResult> {
  if (query.sort === CATALOG_SORT.PRICE) {
    return fetchCatalogTrainersByPriceSort(query);
  }

  return fetchCatalogTrainersByDbSort(query);
}

export async function getCatalogTrainers(
  query: CatalogTrainersQuery,
): Promise<CatalogTrainersResult> {
  "use cache";
  cacheTag(CACHE_TAGS.trainersCatalog);
  cacheLife("minutes");

  return fetchCatalogTrainers(query);
}
