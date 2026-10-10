import "server-only";

import {
  formatTrainerTimezoneLabel,
  getLocalDateRangeFromToday,
  type SlotDto,
} from "@pulse/domain";

import {
  generateSlotsForTrainer,
  getUtcRangeForLocalDates,
  loadTrainerBookingsForRange,
  loadTrainerScheduleFacts,
  WIZARD_SLOT_DAY_COUNT,
} from "@/data/trainer/load-trainer-schedule-facts.server";

export type BookingWizardSlots = {
  timezone: string;
  timezoneLabel: string;
  slots: SlotDto[];
  slotDurationMinutes: number;
};

export async function getBookingWizardSlots(
  trainerProfileId: string,
  slotDurationMinutes: number,
): Promise<BookingWizardSlots | null> {
  const facts = await loadTrainerScheduleFacts(trainerProfileId);

  if (!facts) {
    return null;
  }

  const range = getLocalDateRangeFromToday(
    facts.timezone,
    WIZARD_SLOT_DAY_COUNT,
  );
  const { rangeStart, rangeEnd } = getUtcRangeForLocalDates(
    range.fromLocalDate,
    range.toLocalDate,
  );

  const bookings = await loadTrainerBookingsForRange(
    trainerProfileId,
    rangeStart,
    rangeEnd,
  );

  const slots = generateSlotsForTrainer(
    facts,
    bookings,
    slotDurationMinutes,
    WIZARD_SLOT_DAY_COUNT,
  );

  return {
    timezone: facts.timezone,
    timezoneLabel: formatTrainerTimezoneLabel(facts.timezone),
    slots,
    slotDurationMinutes,
  };
}
