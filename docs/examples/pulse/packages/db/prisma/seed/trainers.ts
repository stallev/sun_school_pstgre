import type { PrismaClient } from "../../src/generated/client";
import { SEED_PHOTO_URLS } from "./fixtures";
import type { SeededUsers } from "./users";

export const APPROVED_TRAINER_KEYS = [
  "anna",
  "dmitry",
  "maria",
  "ivan",
  "elena",
  "sergey",
] as const;

export type ApprovedTrainerKey = (typeof APPROVED_TRAINER_KEYS)[number];

export type SeededTrainerProfiles = Record<
  ApprovedTrainerKey | "pending",
  { id: string }
>;

type ApprovedTrainerFixture = {
  key: ApprovedTrainerKey;
  timezone: string;
  bio: string;
  experienceYears: number;
  ratingAvg: number;
  ratingCount: number;
  photoUrl: string | null;
  specializationSlugs: readonly string[];
};

const APPROVED_TRAINER_FIXTURES: ApprovedTrainerFixture[] = [
  {
    key: "anna",
    timezone: "Europe/Berlin",
    bio: "Certified cardio and pilates instructor with 8 years of experience.",
    experienceYears: 8,
    ratingAvg: 4.8,
    ratingCount: 32,
    photoUrl: SEED_PHOTO_URLS.anna,
    specializationSlugs: ["cardio", "pilates"],
  },
  {
    key: "dmitry",
    timezone: "America/Chicago",
    bio: "Strength and HIIT coach focused on progressive overload and form.",
    experienceYears: 10,
    ratingAvg: 4.7,
    ratingCount: 24,
    photoUrl: null,
    specializationSlugs: ["strength", "hiit"],
  },
  {
    key: "maria",
    timezone: "America/New_York",
    bio: "Pilates and stretching specialist for recovery and mobility.",
    experienceYears: 6,
    ratingAvg: 4.9,
    ratingCount: 18,
    photoUrl: SEED_PHOTO_URLS.maria,
    specializationSlugs: ["pilates", "stretching"],
  },
  {
    key: "ivan",
    timezone: "Europe/London",
    bio: "HIIT and strength trainer for busy professionals.",
    experienceYears: 7,
    ratingAvg: 4.6,
    ratingCount: 21,
    photoUrl: null,
    specializationSlugs: ["hiit", "strength"],
  },
  {
    key: "elena",
    timezone: "Europe/Berlin",
    bio: "Mobility and cardio instructor helping clients restore balance and endurance.",
    experienceYears: 5,
    ratingAvg: 4.8,
    ratingCount: 15,
    photoUrl: SEED_PHOTO_URLS.elena,
    specializationSlugs: ["cardio", "stretching"],
  },
  {
    key: "sergey",
    timezone: "America/Los_Angeles",
    bio: "Powerlifting specialist with twelve years of competitive coaching.",
    experienceYears: 12,
    ratingAvg: 4.9,
    ratingCount: 28,
    photoUrl: null,
    specializationSlugs: ["strength"],
  },
];

const PENDING_TRAINER_FIXTURE = {
  key: "pending" as const,
  timezone: "Europe/Paris",
  bio: "New trainer awaiting verification.",
  experienceYears: 3,
  specializationSlugs: ["cardio"],
} as const;

async function syncTrainerSpecializations(
  prisma: PrismaClient,
  trainerProfileId: string,
  slugs: readonly string[],
  specializationMap: Map<string, string>,
) {
  const targetIds = slugs
    .map((slug) => specializationMap.get(slug))
    .filter((id): id is string => Boolean(id));

  await prisma.trainerSpecialization.deleteMany({
    where: {
      trainerProfileId,
      ...(targetIds.length > 0
        ? { specializationId: { notIn: targetIds } }
        : {}),
    },
  });

  for (const specializationId of targetIds) {
    await prisma.trainerSpecialization.upsert({
      where: {
        trainerProfileId_specializationId: {
          trainerProfileId,
          specializationId,
        },
      },
      update: {},
      create: {
        trainerProfileId,
        specializationId,
      },
    });
  }
}

export async function seedTrainerProfiles(
  prisma: PrismaClient,
  users: SeededUsers,
  specializationMap: Map<string, string>,
): Promise<SeededTrainerProfiles> {
  const submittedAt = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const result = {} as SeededTrainerProfiles;

  for (const fixture of APPROVED_TRAINER_FIXTURES) {
    const user = users[fixture.key];
    const profile = await prisma.trainerProfile.upsert({
      where: { userId: user.id },
      update: {
        status: "approved",
        timezone: fixture.timezone,
        bio: fixture.bio,
        experienceYears: fixture.experienceYears,
        ratingAvg: fixture.ratingAvg,
        ratingCount: fixture.ratingCount,
        photoUrl: fixture.photoUrl,
        submittedAt,
        reviewedAt: submittedAt,
      },
      create: {
        userId: user.id,
        status: "approved",
        timezone: fixture.timezone,
        bio: fixture.bio,
        experienceYears: fixture.experienceYears,
        ratingAvg: fixture.ratingAvg,
        ratingCount: fixture.ratingCount,
        photoUrl: fixture.photoUrl,
        submittedAt,
        reviewedAt: submittedAt,
      },
    });

    await syncTrainerSpecializations(
      prisma,
      profile.id,
      fixture.specializationSlugs,
      specializationMap,
    );

    result[fixture.key] = { id: profile.id };
  }

  const pendingUser = users[PENDING_TRAINER_FIXTURE.key];
  const pendingProfile = await prisma.trainerProfile.upsert({
    where: { userId: pendingUser.id },
    update: {
      status: "pending",
      timezone: PENDING_TRAINER_FIXTURE.timezone,
      bio: PENDING_TRAINER_FIXTURE.bio,
      experienceYears: PENDING_TRAINER_FIXTURE.experienceYears,
      photoUrl: null,
      submittedAt,
      reviewedAt: null,
      rejectionReason: null,
    },
    create: {
      userId: pendingUser.id,
      status: "pending",
      timezone: PENDING_TRAINER_FIXTURE.timezone,
      bio: PENDING_TRAINER_FIXTURE.bio,
      experienceYears: PENDING_TRAINER_FIXTURE.experienceYears,
      submittedAt,
    },
  });

  await syncTrainerSpecializations(
    prisma,
    pendingProfile.id,
    PENDING_TRAINER_FIXTURE.specializationSlugs,
    specializationMap,
  );

  result.pending = { id: pendingProfile.id };
  return result;
}

export async function seedVerificationDocument(
  prisma: PrismaClient,
  users: SeededUsers,
  trainers: SeededTrainerProfiles,
) {
  const { SEED_IDS } = await import("./fixtures");

  await prisma.fileAsset.upsert({
    where: { id: SEED_IDS.pendingFileAsset },
    update: {
      uploadStatus: "ready",
      blobPathname: "seed/pending-trainer/certificate.pdf",
      mimeType: "application/pdf",
    },
    create: {
      id: SEED_IDS.pendingFileAsset,
      ownerUserId: users.pending.id,
      blobPathname: "seed/pending-trainer/certificate.pdf",
      mimeType: "application/pdf",
      uploadStatus: "ready",
    },
  });

  await prisma.verificationDocument.upsert({
    where: { id: SEED_IDS.pendingVerificationDoc },
    update: {
      docType: "certificate",
      fileAssetId: SEED_IDS.pendingFileAsset,
    },
    create: {
      id: SEED_IDS.pendingVerificationDoc,
      trainerProfileId: trainers.pending.id,
      docType: "certificate",
      fileAssetId: SEED_IDS.pendingFileAsset,
    },
  });
}
