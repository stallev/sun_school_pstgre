import type { Prisma } from "@pulse/db";

export type TrainerServiceItem = {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  priceCents: number;
  currency: string;
};

export type TrainerCertificateItem = {
  id: string;
  title: string;
};

export type PublicTrainerProfile = {
  id: string;
  fullName: string;
  bio: string | null;
  photoUrl: string | null;
  timezone: string;
  ratingAvg: number;
  ratingCount: number;
  experienceYears: number | null;
  specializations: { slug: string; name: string }[];
  services: TrainerServiceItem[];
  certificates: TrainerCertificateItem[];
  fromPriceCents: number | null;
  currency: string | null;
  defaultServiceId: string | null;
};

export const PUBLIC_TRAINER_PROFILE_SELECT = {
  id: true,
  bio: true,
  photoUrl: true,
  timezone: true,
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
    orderBy: [{ sortOrder: "asc" as const }, { priceCents: "asc" as const }],
    select: {
      id: true,
      name: true,
      description: true,
      durationMinutes: true,
      priceCents: true,
      currency: true,
    },
  },
  certificates: {
    orderBy: { sortOrder: "asc" as const },
    select: {
      id: true,
      title: true,
    },
  },
} satisfies Prisma.TrainerProfileSelect;

export type PublicTrainerProfileRow = Prisma.TrainerProfileGetPayload<{
  select: typeof PUBLIC_TRAINER_PROFILE_SELECT;
}>;

export function mapPublicTrainerProfileRow(
  row: PublicTrainerProfileRow,
): PublicTrainerProfile {
  const cheapestService = row.services[0] ?? null;

  return {
    id: row.id,
    fullName: row.user.fullName,
    bio: row.bio,
    photoUrl: row.photoUrl,
    timezone: row.timezone,
    ratingAvg: Number(row.ratingAvg),
    ratingCount: row.ratingCount,
    experienceYears: row.experienceYears,
    specializations: row.specializations.map((item) => item.specialization),
    services: row.services,
    certificates: row.certificates,
    fromPriceCents: cheapestService?.priceCents ?? null,
    currency: cheapestService?.currency ?? null,
    defaultServiceId: cheapestService?.id ?? null,
  };
}
