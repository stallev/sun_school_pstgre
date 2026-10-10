"use server";

import { getBookingWizardSlots } from "@/data/booking/get-booking-wizard-slots.server";

export async function fetchBookingWizardSlotsAction(
  trainerProfileId: string,
  slotDurationMinutes: number,
) {
  return getBookingWizardSlots(trainerProfileId, slotDurationMinutes);
}
