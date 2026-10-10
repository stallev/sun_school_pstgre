import {
  BOOKING_STATUS,
  type BookingStatus,
} from "@pulse/domain";

import type { Messages } from "@/lib/messages/types";
import type { StatusBadgeVariant } from "@/lib/ui/status-badge";

const BOOKING_STATUS_BADGE_VARIANT: Record<BookingStatus, StatusBadgeVariant> = {
  pending: "pending",
  confirmed: "confirmed",
  completed: "completed",
  cancelled: "cancelled",
};

export function getBookingStatusBadgeVariant(
  status: BookingStatus,
): StatusBadgeVariant {
  return BOOKING_STATUS_BADGE_VARIANT[status];
}

export function getBookingStatusLabel(
  status: BookingStatus,
  messages: Messages,
): string {
  return messages.booking.status[status];
}

export function isUpcomingBookingStatus(status: BookingStatus): boolean {
  return (
    status === BOOKING_STATUS.PENDING || status === BOOKING_STATUS.CONFIRMED
  );
}

export function isPastBookingStatus(status: BookingStatus): boolean {
  return status === BOOKING_STATUS.COMPLETED;
}

export function isCancelledBookingStatus(status: BookingStatus): boolean {
  return status === BOOKING_STATUS.CANCELLED;
}
