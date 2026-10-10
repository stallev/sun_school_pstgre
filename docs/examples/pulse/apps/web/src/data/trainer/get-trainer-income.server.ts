import "server-only";

import { redirect } from "next/navigation";

import { BOOKING_STATUS } from "@pulse/domain";
import { getPrisma } from "@pulse/db";

import { formatBookingDateTimeLocal } from "@/lib/booking/format-booking-datetime-local";
import { formatServicePrice } from "@/lib/trainer/format-service-price";
import { getLocale } from "@/lib/messages/server";
import { getPolicySessionContext } from "@/server/auth/session-to-policy-context";

import { getTrainerProfileOwnershipFacts } from "./get-trainer-schedule-for-edit.server";

export type TrainerIncomeTransaction = {
  id: string;
  dateLabel: string;
  clientName: string;
  serviceName: string;
  amountLabel: string;
  status: typeof BOOKING_STATUS.COMPLETED;
};

export type TrainerIncomeSnapshot = {
  monthTotalLabel: string;
  sessionCount: number;
  transactions: TrainerIncomeTransaction[];
};

function getMonthStart(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export async function getTrainerIncomeSnapshot(): Promise<TrainerIncomeSnapshot> {
  const ctx = await getPolicySessionContext();
  if (!ctx) {
    redirect("/auth/login");
  }

  const ownership = await getTrainerProfileOwnershipFacts(ctx.userId);
  if (!ownership) {
    redirect("/auth/register/trainer");
  }

  const monthStart = getMonthStart();
  const prisma = getPrisma();

  const bookings = await prisma.booking.findMany({
    where: {
      trainerProfileId: ownership.profileId,
      status: BOOKING_STATUS.COMPLETED,
    },
    orderBy: { startsAt: "desc" },
    select: {
      id: true,
      startsAt: true,
      serviceNameSnapshot: true,
      priceCents: true,
      currency: true,
      client: { select: { fullName: true } },
    },
  });

  const monthBookings = bookings.filter(
    (booking) => booking.startsAt.getTime() >= monthStart.getTime(),
  );

  const monthTotalCents = monthBookings.reduce(
    (sum, booking) => sum + booking.priceCents,
    0,
  );

  const currency = monthBookings[0]?.currency ?? bookings[0]?.currency ?? "USD";
  const locale = await getLocale();

  return {
    monthTotalLabel: formatServicePrice(monthTotalCents, currency, locale),
    sessionCount: monthBookings.length,
    transactions: bookings.map((booking) => ({
      id: booking.id,
      dateLabel: formatBookingDateTimeLocal(
        booking.startsAt.toISOString(),
        locale,
      ),
      clientName: booking.client.fullName,
      serviceName: booking.serviceNameSnapshot,
      amountLabel: formatServicePrice(
        booking.priceCents,
        booking.currency,
        locale,
      ),
      status: BOOKING_STATUS.COMPLETED,
    })),
  };
}
