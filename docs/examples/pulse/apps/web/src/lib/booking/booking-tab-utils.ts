import {
  BOOKING_STATUS,
  type BookingStatus,
} from "@pulse/domain";

export type ClientBookingTab = "upcoming" | "past" | "cancelled";

export type ClientBookingListItem = {
  id: string;
  status: BookingStatus;
};

export function getBookingTab(status: BookingStatus): ClientBookingTab {
  if (status === BOOKING_STATUS.CANCELLED) {
    return "cancelled";
  }

  if (status === BOOKING_STATUS.COMPLETED) {
    return "past";
  }

  return "upcoming";
}

export function groupBookingsByTab<T extends ClientBookingListItem>(
  bookings: T[],
): Record<ClientBookingTab, T[]> {
  const grouped: Record<ClientBookingTab, T[]> = {
    upcoming: [],
    past: [],
    cancelled: [],
  };

  for (const booking of bookings) {
    grouped[getBookingTab(booking.status)].push(booking);
  }

  return grouped;
}

export const CLIENT_BOOKING_TABS: ClientBookingTab[] = [
  "upcoming",
  "past",
  "cancelled",
];
