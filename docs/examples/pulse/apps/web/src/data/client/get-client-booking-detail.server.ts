import "server-only";

import { notFound } from "next/navigation";

import {
  BOOKING_STATUS,
  COMPLAINT_STATUS,
  REFUND_STATUS,
  canClientCancelBooking,
  type BookingStatus,
} from "@pulse/domain";
import { getPrisma } from "@pulse/db";
import { assertCanReadBooking, PolicyError } from "@pulse/policy-server";

import { getPolicySessionContext } from "@/server/auth/session-to-policy-context";

export type ClientBookingReviewSummary = {
  id: string;
  rating: number;
  body: string;
  createdAtUtc: string;
};

export type ClientBookingDetail = {
  id: string;
  status: string;
  serviceNameSnapshot: string;
  startsAtUtc: string;
  durationMinutes: number;
  priceCents: number;
  currency: string;
  clientMessage: string | null;
  trainerName: string;
  trainerPhotoUrl: string | null;
  trainerTimezone: string;
  canCancel: boolean;
  canLeaveReview: boolean;
  canFileComplaint: boolean;
  canRequestRefund: boolean;
  review: ClientBookingReviewSummary | null;
};

export type ClientBookingAccessResult =
  | { status: "ok"; booking: ClientBookingDetail }
  | { status: "forbidden" }
  | { status: "not_found" };

function mapBookingRow(
  booking: {
    id: string;
    status: BookingStatus;
    serviceNameSnapshot: string;
    startsAt: Date;
    durationMinutes: number;
    priceCents: number;
    currency: string;
    clientMessage: string | null;
    review: {
      id: string;
      rating: number;
      body: string;
      createdAt: Date;
    } | null;
    complaints: { id: string }[];
    refundRequests: { id: string }[];
    trainerProfile: {
      timezone: string;
      photoUrl: string | null;
      user: { fullName: string };
    };
  },
): ClientBookingDetail {
  const startsAtUtc = booking.startsAt.toISOString();

  const isEligibleForSupport =
    booking.status === BOOKING_STATUS.COMPLETED ||
    booking.status === BOOKING_STATUS.CANCELLED ||
    booking.status === BOOKING_STATUS.CONFIRMED;

  const isEligibleForRefund =
    booking.status === BOOKING_STATUS.COMPLETED ||
    booking.status === BOOKING_STATUS.CANCELLED;

  return {
    id: booking.id,
    status: booking.status,
    serviceNameSnapshot: booking.serviceNameSnapshot,
    startsAtUtc,
    durationMinutes: booking.durationMinutes,
    priceCents: booking.priceCents,
    currency: booking.currency,
    clientMessage: booking.clientMessage,
    trainerName: booking.trainerProfile.user.fullName,
    trainerPhotoUrl: booking.trainerProfile.photoUrl,
    trainerTimezone: booking.trainerProfile.timezone,
    canCancel: canClientCancelBooking({
      status: booking.status,
      startsAtUtc,
    }),
    canLeaveReview:
      booking.status === BOOKING_STATUS.COMPLETED && booking.review === null,
    canFileComplaint:
      isEligibleForSupport && booking.complaints.length === 0,
    canRequestRefund:
      isEligibleForRefund && booking.refundRequests.length === 0,
    review: booking.review
      ? {
          id: booking.review.id,
          rating: booking.review.rating,
          body: booking.review.body,
          createdAtUtc: booking.review.createdAt.toISOString(),
        }
      : null,
  };
}

export async function resolveClientBookingAccess(
  bookingId: string,
): Promise<ClientBookingAccessResult> {
  const ctx = await getPolicySessionContext();
  if (!ctx) {
    return { status: "forbidden" };
  }

  try {
    await assertCanReadBooking(ctx, bookingId);
  } catch (error) {
    if (error instanceof PolicyError) {
      return { status: "forbidden" };
    }

    throw error;
  }

  const prisma = getPrisma();
  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      clientId: ctx.userId,
    },
    select: {
      id: true,
      status: true,
      serviceNameSnapshot: true,
      startsAt: true,
      durationMinutes: true,
      priceCents: true,
      currency: true,
      clientMessage: true,
      review: {
        select: { id: true, rating: true, body: true, createdAt: true },
      },
      complaints: {
        where: {
          status: { in: [COMPLAINT_STATUS.OPEN, COMPLAINT_STATUS.IN_REVIEW] },
        },
        select: { id: true },
        take: 1,
      },
      refundRequests: {
        where: { status: REFUND_STATUS.PENDING },
        select: { id: true },
        take: 1,
      },
      trainerProfile: {
        select: {
          timezone: true,
          photoUrl: true,
          user: { select: { fullName: true } },
        },
      },
    },
  });

  if (!booking) {
    return { status: "not_found" };
  }

  return { status: "ok", booking: mapBookingRow(booking) };
}

export async function getClientBookingDetail(
  bookingId: string,
): Promise<ClientBookingDetail | null> {
  const result = await resolveClientBookingAccess(bookingId);
  if (result.status !== "ok") {
    return null;
  }

  return result.booking;
}

export async function requireClientBookingDetail(
  bookingId: string,
): Promise<ClientBookingDetail> {
  const result = await resolveClientBookingAccess(bookingId);

  if (result.status === "not_found") {
    notFound();
  }

  if (result.status === "forbidden") {
    notFound();
  }

  return result.booking;
}

export function isPendingBookingStatus(status: string): boolean {
  return status === BOOKING_STATUS.PENDING;
}
