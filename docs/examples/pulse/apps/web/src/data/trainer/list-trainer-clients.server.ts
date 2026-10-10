import "server-only";

import { redirect } from "next/navigation";

import { BOOKING_STATUS } from "@pulse/domain";
import { getPrisma } from "@pulse/db";

import { getPolicySessionContext } from "@/server/auth/session-to-policy-context";

import { getTrainerProfileOwnershipFacts } from "./get-trainer-schedule-for-edit.server";

export type TrainerClientListItem = {
  clientId: string;
  displayName: string;
  avatarUrl: string | null;
  sessionCount: number;
  lastSessionAt: string | null;
  notePreview: string | null;
};

export async function listTrainerClients(): Promise<TrainerClientListItem[]> {
  const ctx = await getPolicySessionContext();
  if (!ctx) {
    redirect("/auth/login");
  }

  const ownership = await getTrainerProfileOwnershipFacts(ctx.userId);
  if (!ownership) {
    redirect("/auth/register/trainer");
  }

  const prisma = getPrisma();
  const bookings = await prisma.booking.findMany({
    where: {
      trainerProfileId: ownership.profileId,
      status: { not: BOOKING_STATUS.CANCELLED },
    },
    select: {
      clientId: true,
      startsAt: true,
      client: {
        select: {
          fullName: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { startsAt: "desc" },
  });

  const aggregates = new Map<
    string,
    {
      displayName: string;
      avatarUrl: string | null;
      sessionCount: number;
      lastSessionAt: Date | null;
    }
  >();

  for (const booking of bookings) {
    const current = aggregates.get(booking.clientId);
    if (!current) {
      aggregates.set(booking.clientId, {
        displayName: booking.client.fullName,
        avatarUrl: booking.client.avatarUrl,
        sessionCount: 1,
        lastSessionAt: booking.startsAt,
      });
      continue;
    }

    current.sessionCount += 1;
    if (
      !current.lastSessionAt ||
      booking.startsAt.getTime() > current.lastSessionAt.getTime()
    ) {
      current.lastSessionAt = booking.startsAt;
    }
  }

  const clientIds = [...aggregates.keys()];
  const notes =
    clientIds.length === 0
      ? []
      : await prisma.trainerClientNote.findMany({
          where: {
            trainerProfileId: ownership.profileId,
            clientId: { in: clientIds },
          },
          select: {
            clientId: true,
            notes: true,
          },
        });

  const noteByClient = new Map(notes.map((item) => [item.clientId, item.notes]));

  return clientIds
    .map((clientId) => {
      const aggregate = aggregates.get(clientId)!;
      const note = noteByClient.get(clientId) ?? null;

      return {
        clientId,
        displayName: aggregate.displayName,
        avatarUrl: aggregate.avatarUrl,
        sessionCount: aggregate.sessionCount,
        lastSessionAt: aggregate.lastSessionAt
          ? aggregate.lastSessionAt.toISOString()
          : null,
        notePreview: note?.trim() ? note.trim().slice(0, 80) : null,
      };
    })
    .sort((left, right) =>
      (right.lastSessionAt ?? "").localeCompare(left.lastSessionAt ?? ""),
    );
}
