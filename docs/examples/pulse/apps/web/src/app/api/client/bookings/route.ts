import { NextResponse } from "next/server";

import {
  BOOKING_MUTATION_ERROR_CODES,
  createBookingInputSchema,
} from "@pulse/domain";

import { createBookingWithCacheInvalidation } from "@/data/client/create-booking.server";
import { getMessages } from "@/lib/messages/server";


export async function POST(request: Request) {
  const messages = await getMessages();
  const body = await request.json().catch(() => null);
  const parsed = createBookingInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        code: BOOKING_MUTATION_ERROR_CODES.VALIDATION,
        message: messages.booking.errors.validation,
      },
      { status: 400 },
    );
  }

  const result = await createBookingWithCacheInvalidation(parsed.data);
  const status = result.ok
    ? 200
    : result.code === BOOKING_MUTATION_ERROR_CODES.UNAUTHORIZED
      ? 401
      : 400;

  return NextResponse.json(result, { status });
}
