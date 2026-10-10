import { BOOKING_STATUSES, type BookingStatus } from "../types/booking-status";

export function isBookingStatus(value: string): value is BookingStatus {
  return (BOOKING_STATUSES as readonly string[]).includes(value);
}
