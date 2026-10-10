import type { BookingStatus, PrismaClient } from "../../src/generated/client";
import { SEED_IDS } from "./fixtures";
import type { SeededServices } from "./services";
import type { SeededTrainerProfiles } from "./trainers";
import type { SeededUsers } from "./users";

type BookingFixture = {
  id: string;
  status: BookingStatus;
  trainerKey: keyof Pick<
    SeededTrainerProfiles,
    "anna" | "dmitry" | "maria" | "ivan" | "elena"
  >;
  serviceKey: string;
  daysOffset: number;
  cancelledAt?: Date;
  completedAt?: Date;
};

const BOOKING_FIXTURES: BookingFixture[] = [
  {
    id: SEED_IDS.bookingPending,
    status: "pending",
    trainerKey: "anna",
    serviceKey: "anna:Cardio Endurance 60",
    daysOffset: 3,
  },
  {
    id: SEED_IDS.bookingConfirmed,
    status: "confirmed",
    trainerKey: "dmitry",
    serviceKey: "dmitry:Strength Basics 60",
    daysOffset: 5,
  },
  {
    id: SEED_IDS.bookingCompleted,
    status: "completed",
    trainerKey: "maria",
    serviceKey: "maria:Pilates 50",
    daysOffset: -7,
    completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
  },
  {
    id: SEED_IDS.bookingCompletedNoReview,
    status: "completed",
    trainerKey: "anna",
    serviceKey: "anna:Cardio Endurance 60",
    daysOffset: -10,
    completedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
  },
  {
    id: SEED_IDS.bookingCompletedNoReviewDmitry,
    status: "completed",
    trainerKey: "dmitry",
    serviceKey: "dmitry:HIIT 30",
    daysOffset: -14,
    completedAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
  },
  {
    id: SEED_IDS.bookingCompletedNoReviewElena,
    status: "completed",
    trainerKey: "elena",
    serviceKey: "elena:Morning Cardio 60",
    daysOffset: -12,
    completedAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
  },
  {
    id: SEED_IDS.bookingCompletedReviewedIvan,
    status: "completed",
    trainerKey: "ivan",
    serviceKey: "ivan:HIIT Blast 30",
    daysOffset: -18,
    completedAt: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000),
  },
  {
    id: SEED_IDS.bookingCancelled,
    status: "cancelled",
    trainerKey: "anna",
    serviceKey: "anna:Cardio Endurance 60",
    daysOffset: -3,
    cancelledAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
  },
];

type ReviewFixture = {
  id: string;
  bookingId: string;
  trainerKey: keyof Pick<SeededTrainerProfiles, "maria" | "ivan">;
  rating: number;
  body: string;
};

const REVIEW_FIXTURES: ReviewFixture[] = [
  {
    id: SEED_IDS.reviewMaria,
    bookingId: SEED_IDS.bookingCompleted,
    trainerKey: "maria",
    rating: 5,
    body: "Excellent session — very attentive and professional throughout.",
  },
  {
    id: SEED_IDS.reviewIvan,
    bookingId: SEED_IDS.bookingCompletedReviewedIvan,
    trainerKey: "ivan",
    rating: 4,
    body: "Great HIIT workout — challenging but well structured for my level.",
  },
];

export type SeededBookings = Record<string, { id: string }>;

function bookingStartsAt(daysOffset: number): Date {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysOffset);
  date.setUTCHours(10, 0, 0, 0);
  return date;
}

export async function seedBookings(
  prisma: PrismaClient,
  users: SeededUsers,
  trainers: SeededTrainerProfiles,
  services: SeededServices,
): Promise<SeededBookings> {
  const clientId = users.client.id;
  const result: SeededBookings = {};

  for (const fixture of BOOKING_FIXTURES) {
    const service = services[fixture.serviceKey];
    if (!service) {
      throw new Error(`Missing seed service: ${fixture.serviceKey}`);
    }

    const booking = await prisma.booking.upsert({
      where: { id: fixture.id },
      update: {
        status: fixture.status,
        startsAt: bookingStartsAt(fixture.daysOffset),
        durationMinutes: service.durationMinutes,
        priceCents: service.priceCents,
        currency: "USD",
        serviceNameSnapshot: service.name,
        cancelledAt: fixture.cancelledAt ?? null,
        completedAt: fixture.completedAt ?? null,
      },
      create: {
        id: fixture.id,
        clientId,
        trainerProfileId: trainers[fixture.trainerKey].id,
        trainerServiceId: service.id,
        status: fixture.status,
        startsAt: bookingStartsAt(fixture.daysOffset),
        durationMinutes: service.durationMinutes,
        priceCents: service.priceCents,
        currency: "USD",
        serviceNameSnapshot: service.name,
        cancelledAt: fixture.cancelledAt ?? null,
        completedAt: fixture.completedAt ?? null,
      },
    });

    result[fixture.id] = { id: booking.id };
  }

  return result;
}

async function recalcTrainerRatings(
  prisma: PrismaClient,
  trainerProfileIds: string[],
) {
  for (const trainerProfileId of trainerProfileIds) {
    const aggregate = await prisma.review.aggregate({
      where: { trainerProfileId, isHidden: false },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.trainerProfile.update({
      where: { id: trainerProfileId },
      data: {
        ratingAvg: aggregate._avg.rating ?? 0,
        ratingCount: aggregate._count.rating,
      },
    });
  }
}

export async function seedReview(
  prisma: PrismaClient,
  users: SeededUsers,
  trainers: SeededTrainerProfiles,
) {
  const clientId = users.client.id;
  const trainerIds = new Set<string>();

  for (const fixture of REVIEW_FIXTURES) {
    const trainerProfileId = trainers[fixture.trainerKey].id;
    trainerIds.add(trainerProfileId);

    await prisma.review.upsert({
      where: { bookingId: fixture.bookingId },
      update: {
        rating: fixture.rating,
        body: fixture.body,
        isHidden: false,
      },
      create: {
        id: fixture.id,
        bookingId: fixture.bookingId,
        clientId,
        trainerProfileId,
        rating: fixture.rating,
        body: fixture.body,
      },
    });
  }

  await recalcTrainerRatings(prisma, [...trainerIds]);
}

export async function seedWishlist(
  prisma: PrismaClient,
  users: SeededUsers,
  trainers: SeededTrainerProfiles,
) {
  for (const trainerProfileId of [trainers.anna.id, trainers.maria.id]) {
    await prisma.wishlist.upsert({
      where: {
        clientId_trainerProfileId: {
          clientId: users.client.id,
          trainerProfileId,
        },
      },
      update: {},
      create: {
        clientId: users.client.id,
        trainerProfileId,
      },
    });
  }
}

export async function seedAdminSamples(
  prisma: PrismaClient,
  users: SeededUsers,
  trainers: SeededTrainerProfiles,
) {
  await prisma.complaint.upsert({
    where: { id: SEED_IDS.complaintOpen },
    update: {
      status: "open",
      priority: "medium",
      reason: "Seed complaint for admin moderation smoke.",
    },
    create: {
      id: SEED_IDS.complaintOpen,
      reporterId: users.client.id,
      targetTrainerId: trainers.dmitry.id,
      priority: "medium",
      status: "open",
      reason: "Seed complaint for admin moderation smoke.",
    },
  });

  await prisma.refundRequest.upsert({
    where: { id: SEED_IDS.refundPending },
    update: {
      status: "pending",
      amountCents: 3500,
      currency: "USD",
      reason: "Seed refund linked to cancelled booking.",
    },
    create: {
      id: SEED_IDS.refundPending,
      bookingId: SEED_IDS.bookingCancelled,
      clientId: users.client.id,
      amountCents: 3500,
      currency: "USD",
      status: "pending",
      reason: "Seed refund linked to cancelled booking.",
    },
  });
}
