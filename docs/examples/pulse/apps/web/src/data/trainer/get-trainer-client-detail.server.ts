import "server-only";

import { notFound, redirect } from "next/navigation";

import { BOOKING_STATUS, type BookingStatus } from "@pulse/domain";
import { getPrisma } from "@pulse/db";
import {
  assertCanAccessTrainerClient,
  PolicyError,
} from "@pulse/policy-server";

import { getPolicySessionContext } from "@/server/auth/session-to-policy-context";

import { getTrainerProfileOwnershipFacts } from "./get-trainer-schedule-for-edit.server";

export type TrainerClientBookingHistoryItem = {
  id: string;
  status: BookingStatus;
  startsAtUtc: string;
  serviceName: string;
  durationMinutes: number;
  priceCents: number;
  currency: string;
};

export type TrainerClientDetail = {
  clientId: string;
  displayName: string;
  avatarUrl: string | null;
  sessionCount: number;
  notes: string;
  bookings: TrainerClientBookingHistoryItem[];
};

async function trainerHasClientRelationship(
  trainerProfileId: string,
  clientId: string,
): Promise<boolean> {
  const booking = await getPrisma().booking.findFirst({
    where: {
      trainerProfileId,
      clientId,
      status: { not: BOOKING_STATUS.CANCELLED },
    },
    select: { id: true },
  });

  return Boolean(booking);
}

export async function getTrainerClientDetail(
  clientId: string,
): Promise<TrainerClientDetail> {
  const ctx = await getPolicySessionContext();
  if (!ctx) {
    redirect("/auth/login");
  }

  const ownership = await getTrainerProfileOwnershipFacts(ctx.userId);
  if (!ownership) {
    redirect("/auth/register/trainer");
  }

  try {
    assertCanAccessTrainerClient(ctx, {
      trainerOwnerUserId: ownership.ownerUserId,
    });
  } catch (error) {
    if (error instanceof PolicyError) {
      notFound();
    }

    throw error;
  }

  const hasRelationship = await trainerHasClientRelationship(
    ownership.profileId,
    clientId,
  );
  if (!hasRelationship) {
    notFound();
  }

  const prisma = getPrisma();
  const [client, bookings, note] = await Promise.all([
    prisma.user.findUnique({
      where: { id: clientId },
      select: { fullName: true, avatarUrl: true },
    }),
    prisma.booking.findMany({
      where: {
        trainerProfileId: ownership.profileId,
        clientId,
        status: { not: BOOKING_STATUS.CANCELLED },
      },
      orderBy: { startsAt: "desc" },
      select: {
        id: true,
        status: true,
        startsAt: true,
        serviceNameSnapshot: true,
        durationMinutes: true,
        priceCents: true,
        currency: true,
      },
    }),
    prisma.trainerClientNote.findUnique({
      where: {
        trainerProfileId_clientId: {
          trainerProfileId: ownership.profileId,
          clientId,
        },
      },
      select: { notes: true },
    }),
  ]);

  if (!client) {
    notFound();
  }

  return {
    clientId,
    displayName: client.fullName,
    avatarUrl: client.avatarUrl,
    sessionCount: bookings.length,
    notes: note?.notes ?? "",
    bookings: bookings.map((booking) => ({
      id: booking.id,
      status: booking.status as BookingStatus,
      startsAtUtc: booking.startsAt.toISOString(),
      serviceName: booking.serviceNameSnapshot,
      durationMinutes: booking.durationMinutes,
      priceCents: booking.priceCents,
      currency: booking.currency,
    })),
  };
}
