"use server";

import type { MutationResult } from "@pulse/domain";

import { cancelBookingWithCacheInvalidation } from "@/data/client/cancel-booking.server";

export async function cancelBookingAction(
  _prev: MutationResult<{ id: string; status: string }> | null,
  formData: FormData,
): Promise<MutationResult<{ id: string; status: string }>> {
  const bookingId = String(formData.get("bookingId") ?? "").trim();

  return cancelBookingWithCacheInvalidation({ bookingId });
}
