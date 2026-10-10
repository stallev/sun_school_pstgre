import "server-only";

import { redirect } from "next/navigation";

import {
  formatTrainerTimezoneLabel,
  type TrainerTimezone,
  type WeeklyIntervalInput,
} from "@pulse/domain";
import { getPrisma } from "@pulse/db";

import { formatPrismaDate, formatPrismaTime } from "@/lib/trainer/schedule-time";
import { getPolicySessionContext } from "@/server/auth/session-to-policy-context";

export type TrainerScheduleExceptionForEdit = {
  id: string;
  exceptionDate: string;
  isBlocked: boolean;
  reason: string | null;
};

export type TrainerScheduleForEdit = {
  profileId: string;
  timezone: TrainerTimezone;
  timezoneLabel: string;
  intervals: WeeklyIntervalInput[];
  exceptions: TrainerScheduleExceptionForEdit[];
};

export async function getTrainerScheduleForEdit(): Promise<TrainerScheduleForEdit> {
  const ctx = await getPolicySessionContext();
  if (!ctx) {
    redirect("/auth/login");
  }

  const profile = await getPrisma().trainerProfile.findUnique({
    where: { userId: ctx.userId },
    select: {
      id: true,
      timezone: true,
      weeklyIntervals: {
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
        select: {
          dayOfWeek: true,
          startTime: true,
          endTime: true,
        },
      },
      scheduleExceptions: {
        orderBy: { exceptionDate: "asc" },
        select: {
          id: true,
          exceptionDate: true,
          isBlocked: true,
          reason: true,
        },
      },
    },
  });

  if (!profile) {
    redirect("/auth/register/trainer");
  }

  return {
    profileId: profile.id,
    timezone: profile.timezone as TrainerTimezone,
    timezoneLabel: formatTrainerTimezoneLabel(profile.timezone),
    intervals: profile.weeklyIntervals.map((item) => ({
      dayOfWeek: item.dayOfWeek,
      startTime: formatPrismaTime(item.startTime),
      endTime: formatPrismaTime(item.endTime),
    })),
    exceptions: profile.scheduleExceptions.map((item) => ({
      id: item.id,
      exceptionDate: formatPrismaDate(item.exceptionDate),
      isBlocked: item.isBlocked,
      reason: item.reason,
    })),
  };
}

export async function getTrainerProfileOwnershipFacts(userId: string) {
  const profile = await getPrisma().trainerProfile.findUnique({
    where: { userId },
    select: { id: true, userId: true },
  });

  if (!profile) {
    return null;
  }

  return {
    profileId: profile.id,
    ownerUserId: profile.userId,
  };
}
