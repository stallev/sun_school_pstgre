import "server-only";

import {
  BOOKING_STATUS,
  canClientCancelBooking,
  type BookingStatus,
} from "@pulse/domain";
import { getPrisma } from "@pulse/db";

import { getPolicySessionContext } from "@/server/auth/session-to-policy-context";
import {
  type ClientBookingTab,
} from "@/lib/booking/booking-tab-utils";

export type ClientBookingListEntry = {
  id: string;
  status: BookingStatus;
  serviceNameSnapshot: string;
  startsAtUtc: string;
  trainerName: string;
  trainerPhotoUrl: string | null;
  canCancel: boolean;
  hasReview: boolean;
  reviewRating: number | null;
};

const BOOKING_LIST_SELECT = {
  id: true,
  status: true,
  serviceNameSnapshot: true,
  startsAt: true,
  review: { select: { id: true, rating: true } },
  trainerProfile: {
    select: {
      photoUrl: true,
      user: { select: { fullName: true } },
    },
  },
} as const;

function mapBookingRow(booking: {
  id: string;
  status: BookingStatus;
  serviceNameSnapshot: string;
  startsAt: Date;
  review: { id: string; rating: number } | null;
  trainerProfile: {
    photoUrl: string | null;
    user: { fullName: string };
  };
}): ClientBookingListEntry {
  return {
    id: booking.id,
    status: booking.status,
    serviceNameSnapshot: booking.serviceNameSnapshot,
    startsAtUtc: booking.startsAt.toISOString(),
    trainerName: booking.trainerProfile.user.fullName,
    trainerPhotoUrl: booking.trainerProfile.photoUrl,
    canCancel: canClientCancelBooking({
      status: booking.status,
      startsAtUtc: booking.startsAt.toISOString(),
    }),
    hasReview: booking.review !== null,
    reviewRating: booking.review?.rating ?? null,
  };
}

/** Status filter per list tab — independent queries so Suspense regions fail separately. */
function statusFilterForTab(tab: ClientBookingTab): { status: { in: BookingStatus[] } } | { status: BookingStatus } {
  if (tab === "cancelled") {
    return { status: BOOKING_STATUS.CANCELLED };
  }
  if (tab === "past") {
    return { status: BOOKING_STATUS.COMPLETED };
  }
  return {
    status: {
      in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED],
    },
  };
}

export async function getClientBookingsForTab(
  tab: ClientBookingTab,
): Promise<ClientBookingListEntry[]> {
  const ctx = await getPolicySessionContext();
  if (!ctx) {
    return [];
  }

  const prisma = getPrisma();
  const bookings = await prisma.booking.findMany({
    where: {
      clientId: ctx.userId,
      ...statusFilterForTab(tab),
    },
    orderBy: { startsAt: "desc" },
    select: BOOKING_LIST_SELECT,
  });

  return bookings.map(mapBookingRow);
}

export async function getClientNextSession(): Promise<ClientBookingListEntry | null> {
  const ctx = await getPolicySessionContext();
  if (!ctx) {
    return null;
  }

  const prisma = getPrisma();
  const booking = await prisma.booking.findFirst({
    where: {
      clientId: ctx.userId,
      status: { in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED] },
      startsAt: { gte: new Date() },
    },
    orderBy: { startsAt: "asc" },
    select: BOOKING_LIST_SELECT,
  });

  if (!booking) {
    return null;
  }

  return mapBookingRow(booking);
}
