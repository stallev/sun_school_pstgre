import "server-only";

import { notFound } from "next/navigation";

import { BOOKING_STATUS } from "@pulse/domain";
import { getPrisma } from "@pulse/db";
import { assertCanReadBooking, PolicyError } from "@pulse/policy-server";

import { formatBookingDateTime } from "@/lib/booking/booking-wizard-utils";
import { type AppLocale } from "@/lib/i18n/constants";
import { getLocale } from "@/lib/messages/server";
import { getPolicySessionContext } from "@/server/auth/session-to-policy-context";

export type ClientReviewFormContext = {
  bookingId: string;
  trainerName: string;
  trainerPhotoUrl: string | null;
  serviceNameSnapshot: string;
  sessionDateLabel: string;
};

export type ClientReviewPageAccess =
  | { status: "form"; context: ClientReviewFormContext }
  | { status: "redirect"; bookingId: string }
  | { status: "not_found" };

function mapBookingToReviewFormContext(
  booking: {
    id: string;
    serviceNameSnapshot: string;
    startsAt: Date;
    trainerProfile: {
      photoUrl: string | null;
      timezone: string;
      user: { fullName: string };
    };
  },
  locale: AppLocale,
): ClientReviewFormContext {
  const startsAtUtc = booking.startsAt.toISOString();
  const timezone = booking.trainerProfile.timezone;

  return {
    bookingId: booking.id,
    trainerName: booking.trainerProfile.user.fullName,
    trainerPhotoUrl: booking.trainerProfile.photoUrl,
    serviceNameSnapshot: booking.serviceNameSnapshot,
    sessionDateLabel: formatBookingDateTime(startsAtUtc, timezone, locale),
  };
}

export async function resolveClientReviewPageAccess(
  bookingId: string,
): Promise<ClientReviewPageAccess> {
  const ctx = await getPolicySessionContext();
  if (!ctx) {
    return { status: "not_found" };
  }

  try {
    await assertCanReadBooking(ctx, bookingId);
  } catch (error) {
    if (error instanceof PolicyError) {
      return { status: "not_found" };
    }

    throw error;
  }

  const prisma = getPrisma();
  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      clientId: ctx.userId,
      status: BOOKING_STATUS.COMPLETED,
    },
    select: {
      id: true,
      serviceNameSnapshot: true,
      startsAt: true,
      review: { select: { id: true } },
      trainerProfile: {
        select: {
          photoUrl: true,
          timezone: true,
          user: { select: { fullName: true } },
        },
      },
    },
  });

  if (!booking) {
    return { status: "not_found" };
  }

  if (booking.review !== null) {
    return { status: "redirect", bookingId: booking.id };
  }

  const locale = await getLocale();

  return {
    status: "form",
    context: mapBookingToReviewFormContext(booking, locale),
  };
}

export async function getClientReviewFormContext(
  bookingId: string,
): Promise<ClientReviewFormContext | null> {
  const access = await resolveClientReviewPageAccess(bookingId);
  return access.status === "form" ? access.context : null;
}

export async function requireClientReviewFormContext(
  bookingId: string,
): Promise<ClientReviewFormContext> {
  const access = await resolveClientReviewPageAccess(bookingId);

  if (access.status !== "form") {
    notFound();
  }

  return access.context;
}
