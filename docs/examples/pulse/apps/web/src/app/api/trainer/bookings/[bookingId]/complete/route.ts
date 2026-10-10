import { NextResponse } from "next/server";

import { BOOKING_MUTATION_ERROR_CODES } from "@pulse/domain";

import { completeBookingWithCacheInvalidation } from "@/data/trainer/complete-booking.server";
import { getMessages } from "@/lib/messages/server";


export async function POST(
  _request: Request,
  context: { params: Promise<{ bookingId: string }> },
) {
  const messages = await getMessages();
  const { bookingId } = await context.params;
  const result = await completeBookingWithCacheInvalidation({ bookingId });

  if (!result.ok) {
    const message =
      result.code === BOOKING_MUTATION_ERROR_CODES.UNAUTHORIZED
        ? messages.booking.errors.unauthorized
        : result.code === BOOKING_MUTATION_ERROR_CODES.FORBIDDEN
          ? messages.booking.errors.forbidden
          : messages.trainer.clients.errors.generic;

    return NextResponse.json(
      { ...result, message },
      {
        status:
          result.code === BOOKING_MUTATION_ERROR_CODES.UNAUTHORIZED ? 401 : 400,
      },
    );
  }

  return NextResponse.json(result, { status: 200 });
}
