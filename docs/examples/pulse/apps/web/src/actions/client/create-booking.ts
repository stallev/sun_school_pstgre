"use server";

import { redirect } from "next/navigation";

import type { MutationResult } from "@pulse/domain";

import { createBookingWithCacheInvalidation } from "@/data/client/create-booking.server";

function parseCreateBookingFormData(formData: FormData) {
  const clientMessage = formData.get("clientMessage");
  return {
    trainerProfileId: String(formData.get("trainerProfileId") ?? "").trim(),
    trainerServiceId: String(formData.get("trainerServiceId") ?? "").trim(),
    startsAtUtc: String(formData.get("startsAtUtc") ?? "").trim(),
    clientMessage:
      typeof clientMessage === "string" && clientMessage.trim()
        ? clientMessage.trim()
        : undefined,
  };
}

export async function createBookingAction(
  _prev: MutationResult<{ id: string }> | null,
  formData: FormData,
): Promise<MutationResult<{ id: string }>> {
  const result = await createBookingWithCacheInvalidation(
    parseCreateBookingFormData(formData),
  );

  if (!result.ok) {
    return result;
  }

  redirect(`/client/bookings/${result.data.id}?booked=1`);
}
