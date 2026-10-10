export type SlotDto = {
  startsAtUtc: string;
  durationMinutes: number;
  localLabel: string;
};

export type DateRange = {
  fromLocalDate: string;
  toLocalDate: string;
};

export type WeeklyIntervalInput = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

export type ScheduleExceptionInput = {
  exceptionDate: string;
  isBlocked: boolean;
  reason?: string;
};

export type BookingOverlapInput = {
  startsAtUtc: string;
  durationMinutes: number;
};

export type GenerateAvailableSlotsInput = {
  timezone: string;
  intervals: WeeklyIntervalInput[];
  exceptions: ScheduleExceptionInput[];
  bookings: BookingOverlapInput[];
  range: DateRange;
  slotDurationMinutes: number;
  now?: Date;
};
