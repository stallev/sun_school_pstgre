import "server-only";

import { cacheLife, cacheTag } from "next/cache";

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
} from "@/data/trainer/load-trainer-schedule-facts.server";
import { CACHE_TAGS } from "@/lib/cache/tags";

const PREVIEW_DAY_COUNT = 7;

export type TrainerSchedulePreview = {
  timezone: string;
  timezoneLabel: string;
  slots: SlotDto[];
  slotDurationMinutes: number;
};

export async function getTrainerSchedulePreview(
  trainerProfileId: string,
  slotDurationMinutes: number,
): Promise<TrainerSchedulePreview | null> {
  "use cache";
  cacheTag(CACHE_TAGS.trainer(trainerProfileId));
  cacheLife("minutes");

  const facts = await loadTrainerScheduleFacts(trainerProfileId);

  if (!facts) {
    return null;
  }

  const range = getLocalDateRangeFromToday(facts.timezone, PREVIEW_DAY_COUNT);
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
    PREVIEW_DAY_COUNT,
  );

  return {
    timezone: facts.timezone,
    timezoneLabel: formatTrainerTimezoneLabel(facts.timezone),
    slots,
    slotDurationMinutes,
  };
}
