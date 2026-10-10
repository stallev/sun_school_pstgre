import type { Prisma } from "@pulse/db";

export type CatalogTrainerCard = {
  id: string;
  fullName: string;
  bio: string | null;
  photoUrl: string | null;
  ratingAvg: number;
  ratingCount: number;
  experienceYears: number | null;
  specializations: { slug: string; name: string }[];
  fromPriceCents: number | null;
  currency: string | null;
};

export const TRAINER_CARD_SELECT = {
  id: true,
  bio: true,
  photoUrl: true,
  ratingAvg: true,
  ratingCount: true,
  experienceYears: true,
  user: { select: { fullName: true } },
  specializations: {
    select: {
      specialization: { select: { slug: true, name: true } },
    },
  },
  services: {
    where: { isActive: true },
    orderBy: { priceCents: "asc" as const },
    take: 1,
    select: { priceCents: true, currency: true },
  },
} satisfies Prisma.TrainerProfileSelect;

export type TrainerCardRow = Prisma.TrainerProfileGetPayload<{
  select: typeof TRAINER_CARD_SELECT;
}>;

export function mapTrainerRow(row: TrainerCardRow): CatalogTrainerCard {
  const cheapestService = row.services[0];

  return {
    id: row.id,
    fullName: row.user.fullName,
    bio: row.bio,
    photoUrl: row.photoUrl,
    ratingAvg: Number(row.ratingAvg),
    ratingCount: row.ratingCount,
    experienceYears: row.experienceYears,
    specializations: row.specializations.map((item) => item.specialization),
    fromPriceCents: cheapestService?.priceCents ?? null,
    currency: cheapestService?.currency ?? null,
  };
}

/** @deprecated Use CatalogTrainerCard */
export type FeaturedTrainerCard = CatalogTrainerCard;
