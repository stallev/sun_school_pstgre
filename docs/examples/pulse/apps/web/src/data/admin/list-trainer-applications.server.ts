import "server-only";

import { TRAINER_STATUS, type TrainerStatus } from "@pulse/domain";
import { getPrisma } from "@pulse/db";

import { computeWaitingDays } from "@/lib/admin/compute-waiting-days";

export type TrainerApplicationListItem = {
  id: string;
  fullName: string;
  email: string;
  photoUrl: string | null;
  specializationNames: string[];
  submittedAt: string | null;
  status: TrainerStatus;
  waitingDays: number;
};

export async function listTrainerApplications(
  status: TrainerStatus,
): Promise<TrainerApplicationListItem[]> {
  const profiles = await getPrisma().trainerProfile.findMany({
    where: { status },
    orderBy: [{ submittedAt: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      photoUrl: true,
      submittedAt: true,
      status: true,
      user: { select: { fullName: true, email: true } },
      specializations: {
        select: { specialization: { select: { name: true } } },
      },
    },
  });

  return profiles.map((profile) => ({
    id: profile.id,
    fullName: profile.user.fullName,
    email: profile.user.email,
    photoUrl: profile.photoUrl,
    specializationNames: profile.specializations.map(
      (entry) => entry.specialization.name,
    ),
    submittedAt: profile.submittedAt?.toISOString() ?? null,
    status: profile.status,
    waitingDays: computeWaitingDays(profile.submittedAt),
  }));
}

export async function countPendingTrainerApplications(): Promise<number> {
  return getTrainerApplicationCounts().then((counts) => counts[TRAINER_STATUS.PENDING]);
}

export async function getTrainerApplicationCounts(): Promise<
  Record<TrainerStatus, number>
> {
  const prisma = getPrisma();
  const [pending, approved, rejected] = await Promise.all([
    prisma.trainerProfile.count({ where: { status: TRAINER_STATUS.PENDING } }),
    prisma.trainerProfile.count({ where: { status: TRAINER_STATUS.APPROVED } }),
    prisma.trainerProfile.count({ where: { status: TRAINER_STATUS.REJECTED } }),
  ]);

  return {
    [TRAINER_STATUS.PENDING]: pending,
    [TRAINER_STATUS.APPROVED]: approved,
    [TRAINER_STATUS.REJECTED]: rejected,
  };
}

export async function getOldestPendingTrainerDays(): Promise<number | null> {
  const oldest = await getPrisma().trainerProfile.findFirst({
    where: { status: TRAINER_STATUS.PENDING },
    orderBy: { submittedAt: "asc" },
    select: { submittedAt: true },
  });

  if (!oldest?.submittedAt) {
    return null;
  }

  return computeWaitingDays(oldest.submittedAt);
}
