export function formatBookingReference(bookingId: string): string {
  return bookingId.replace(/-/g, "").slice(-8).toUpperCase();
}
