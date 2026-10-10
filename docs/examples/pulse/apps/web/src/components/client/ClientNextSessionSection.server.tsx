import { connection } from "next/server";

import { ClientNextSessionCard } from "@/components/client/ClientNextSessionCard";
import { getClientNextSession } from "@/data/client/get-client-bookings.server";

export async function ClientNextSessionSection() {
  // Next-session filter uses `new Date()` — mark request-bound before DAL.
  await connection();
  const nextSession = await getClientNextSession();
  return <ClientNextSessionCard session={nextSession} />;
}
