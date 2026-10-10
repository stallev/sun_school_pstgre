import { ClientNextSessionCardEmpty } from "@/components/client/ClientNextSessionCardEmpty";
import { ClientNextSessionCardSession } from "@/components/client/ClientNextSessionCardSession.client";

import type { ClientBookingListEntry } from "@/data/client/get-client-bookings.server";

export type ClientNextSessionCardProps = {
  session: ClientBookingListEntry | null;
};

export function ClientNextSessionCard({ session }: ClientNextSessionCardProps) {
  if (!session) {
    return <ClientNextSessionCardEmpty />;
  }

  return <ClientNextSessionCardSession session={session} />;
}

export { ClientDashboardSearchEntry } from "./ClientDashboardSearchEntry";
