import type { PrismaClient } from "../../src/generated/client";
import { APPROVED_TRAINER_KEYS, type ApprovedTrainerKey, type SeededTrainerProfiles } from "./trainers";

type ServiceFixture = {
  trainerKey: ApprovedTrainerKey;
  name: string;
  durationMinutes: number;
  priceCents: number;
  sortOrder: number;
};

const SERVICE_FIXTURES: ServiceFixture[] = [
  { trainerKey: "anna", name: "Cardio Endurance 60", durationMinutes: 60, priceCents: 3500, sortOrder: 0 },
  { trainerKey: "anna", name: "Pilates Core 45", durationMinutes: 45, priceCents: 4000, sortOrder: 1 },
  { trainerKey: "dmitry", name: "Strength Basics 60", durationMinutes: 60, priceCents: 4500, sortOrder: 0 },
  { trainerKey: "dmitry", name: "HIIT 30", durationMinutes: 30, priceCents: 3000, sortOrder: 1 },
  { trainerKey: "maria", name: "Pilates 50", durationMinutes: 50, priceCents: 3800, sortOrder: 0 },
  { trainerKey: "maria", name: "Stretch & Recover 40", durationMinutes: 40, priceCents: 3200, sortOrder: 1 },
  { trainerKey: "ivan", name: "CrossFit WOD 45", durationMinutes: 45, priceCents: 4200, sortOrder: 0 },
  { trainerKey: "ivan", name: "HIIT Blast 30", durationMinutes: 30, priceCents: 3100, sortOrder: 1 },
  { trainerKey: "elena", name: "Morning Cardio 60", durationMinutes: 60, priceCents: 3600, sortOrder: 0 },
  { trainerKey: "elena", name: "Mobility Flow 45", durationMinutes: 45, priceCents: 3300, sortOrder: 1 },
  { trainerKey: "sergey", name: "Powerlifting 90", durationMinutes: 90, priceCents: 5500, sortOrder: 0 },
  { trainerKey: "sergey", name: "Strength Fundamentals 60", durationMinutes: 60, priceCents: 4800, sortOrder: 1 },
];

const DEPRECATED_SERVICE_NAMES = ["Hatha Yoga 60", "Morning Yoga 60"] as const;

export async function deactivateDeprecatedServices(prisma: PrismaClient) {
  await prisma.trainerService.updateMany({
    where: { name: { in: [...DEPRECATED_SERVICE_NAMES] } },
    data: { isActive: false },
  });
}

export type SeededServices = Record<string, { id: string; name: string; durationMinutes: number; priceCents: number }>;

export async function seedServices(
  prisma: PrismaClient,
  trainers: SeededTrainerProfiles,
): Promise<SeededServices> {
  const result: SeededServices = {};

  for (const fixture of SERVICE_FIXTURES) {
    const trainerProfileId = trainers[fixture.trainerKey].id;
    const existing = await prisma.trainerService.findFirst({
      where: { trainerProfileId, name: fixture.name },
    });

    const service = existing
      ? await prisma.trainerService.update({
          where: { id: existing.id },
          data: {
            durationMinutes: fixture.durationMinutes,
            priceCents: fixture.priceCents,
            sortOrder: fixture.sortOrder,
            isActive: true,
            currency: "USD",
          },
        })
      : await prisma.trainerService.create({
          data: {
            trainerProfileId,
            name: fixture.name,
            durationMinutes: fixture.durationMinutes,
            priceCents: fixture.priceCents,
            sortOrder: fixture.sortOrder,
            isActive: true,
            currency: "USD",
          },
        });

    result[`${fixture.trainerKey}:${fixture.name}`] = {
      id: service.id,
      name: service.name,
      durationMinutes: service.durationMinutes,
      priceCents: service.priceCents,
    };
  }

  await deactivateDeprecatedServices(prisma);

  return result;
}

export async function seedWeeklySchedule(
  prisma: PrismaClient,
  trainers: SeededTrainerProfiles,
) {
  const approvedTrainerIds = APPROVED_TRAINER_KEYS.map((key) => trainers[key].id);

  for (const trainerProfileId of approvedTrainerIds) {
    for (let dayOfWeek = 0; dayOfWeek <= 4; dayOfWeek += 1) {
      const existing = await prisma.trainerWeeklyInterval.findFirst({
        where: { trainerProfileId, dayOfWeek },
      });

      if (existing) {
        await prisma.trainerWeeklyInterval.update({
          where: { id: existing.id },
          data: {
            startTime: new Date("1970-01-01T09:00:00.000Z"),
            endTime: new Date("1970-01-01T17:00:00.000Z"),
          },
        });
      } else {
        await prisma.trainerWeeklyInterval.create({
          data: {
            trainerProfileId,
            dayOfWeek,
            startTime: new Date("1970-01-01T09:00:00.000Z"),
            endTime: new Date("1970-01-01T17:00:00.000Z"),
          },
        });
      }
    }
  }
}

export async function seedScheduleExceptions(
  prisma: PrismaClient,
  trainers: SeededTrainerProfiles,
) {
  const exceptionDate = new Date();
  exceptionDate.setUTCDate(exceptionDate.getUTCDate() + 7);
  exceptionDate.setUTCHours(0, 0, 0, 0);

  for (const key of APPROVED_TRAINER_KEYS) {
    const trainerProfileId = trainers[key].id;
    await prisma.trainerScheduleException.upsert({
      where: {
        trainerProfileId_exceptionDate: {
          trainerProfileId,
          exceptionDate,
        },
      },
      update: { isBlocked: true, reason: "Seed blocked day" },
      create: {
        trainerProfileId,
        exceptionDate,
        isBlocked: true,
        reason: "Seed blocked day",
      },
    });
  }
}
