import { ClientBookingsTabList } from "@/components/client/ClientBookingsTabList.client";
import { getClientBookingsForTab } from "@/data/client/get-client-bookings.server";
import type { ClientBookingTab } from "@/lib/booking/booking-tab-utils";

export type ClientBookingsTabSectionProps = {
  tab: ClientBookingTab;
};

export async function ClientBookingsTabSection({
  tab,
}: ClientBookingsTabSectionProps) {
  const bookings = await getClientBookingsForTab(tab);

  return <ClientBookingsTabList bookings={bookings} tab={tab} />;
}
