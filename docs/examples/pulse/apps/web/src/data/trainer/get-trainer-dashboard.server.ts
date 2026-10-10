import "server-only";

import { redirect } from "next/navigation";

import { BOOKING_STATUS, TRAINER_STATUS } from "@pulse/domain";
import { getPrisma } from "@pulse/db";

import { formatBookingDateTimeLocal } from "@/lib/booking/format-booking-datetime-local";
import { formatServicePrice } from "@/lib/trainer/format-service-price";
import { getLocale } from "@/lib/messages/server";
import { getPolicySessionContext } from "@/server/auth/session-to-policy-context";

import { getTrainerProfileOwnershipFacts } from "./get-trainer-schedule-for-edit.server";

export type TrainerDashboardSession = {
  id: string;
  startsAtLabel: string;
  clientName: string;
  serviceName: string;
};

export type TrainerDashboardReview = {
  id: string;
  clientName: string;
  rating: number;
  bodyPreview: string;
};

export type TrainerDashboardSnapshot = {
  todayCount: number;
  weekCount: number;
  ratingLabel: string;
  monthIncomeLabel: string;
  todaySessions: TrainerDashboardSession[];
  recentReviews: TrainerDashboardReview[];
  isApproved: boolean;
};

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function startOfUtcWeek(date: Date): Date {
  const day = startOfUtcDay(date);
  const weekday = day.getUTCDay();
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  day.setUTCDate(day.getUTCDate() + mondayOffset);
  return day;
}

function startOfUtcMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export async function getTrainerDashboardSnapshot(): Promise<TrainerDashboardSnapshot> {
  const ctx = await getPolicySessionContext();
  if (!ctx) {
    redirect("/auth/login");
  }

  const ownership = await getTrainerProfileOwnershipFacts(ctx.userId);
  if (!ownership) {
    redirect("/auth/register/trainer");
  }

  const now = new Date();
  const todayStart = startOfUtcDay(now);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1);
  const weekStart = startOfUtcWeek(now);
  const monthStart = startOfUtcMonth(now);

  const prisma = getPrisma();
  const profile = await prisma.trainerProfile.findUnique({
    where: { id: ownership.profileId },
    select: {
      status: true,
      ratingAvg: true,
      ratingCount: true,
    },
  });

  if (!profile) {
    redirect("/auth/register/trainer");
  }

  const [activeBookings, monthCompleted, recentReviews] = await Promise.all([
    prisma.booking.findMany({
      where: {
        trainerProfileId: ownership.profileId,
        status: { in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED] },
        startsAt: { gte: weekStart },
      },
      orderBy: { startsAt: "asc" },
      select: {
        id: true,
        startsAt: true,
        serviceNameSnapshot: true,
        client: { select: { fullName: true } },
      },
    }),
    prisma.booking.findMany({
      where: {
        trainerProfileId: ownership.profileId,
        status: BOOKING_STATUS.COMPLETED,
        startsAt: { gte: monthStart },
      },
      select: { priceCents: true, currency: true },
    }),
    prisma.review.findMany({
      where: { trainerProfileId: ownership.profileId, isHidden: false },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        rating: true,
        body: true,
        client: { select: { fullName: true } },
      },
    }),
  ]);

  const todaySessions = activeBookings.filter(
    (booking) =>
      booking.startsAt.getTime() >= todayStart.getTime() &&
      booking.startsAt.getTime() < tomorrowStart.getTime(),
  );

  const monthTotalCents = monthCompleted.reduce(
    (sum, booking) => sum + booking.priceCents,
    0,
  );
  const currency = monthCompleted[0]?.currency ?? "USD";
  const locale = await getLocale();

  return {
    todayCount: todaySessions.length,
    weekCount: activeBookings.length,
    ratingLabel:
      profile.ratingCount > 0 ? profile.ratingAvg.toFixed(1) : "—",
    monthIncomeLabel: formatServicePrice(monthTotalCents, currency, locale),
    todaySessions: todaySessions.map((booking) => ({
      id: booking.id,
      startsAtLabel: formatBookingDateTimeLocal(
        booking.startsAt.toISOString(),
        locale,
      ),
      clientName: booking.client.fullName,
      serviceName: booking.serviceNameSnapshot,
    })),
    recentReviews: recentReviews.map((review) => ({
      id: review.id,
      clientName: review.client.fullName,
      rating: review.rating,
      bodyPreview: review.body.slice(0, 120),
    })),
    isApproved: profile.status === TRAINER_STATUS.APPROVED,
  };
}
