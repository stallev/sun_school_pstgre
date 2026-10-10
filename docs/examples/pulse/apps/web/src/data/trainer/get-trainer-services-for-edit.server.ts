import "server-only";

import { redirect } from "next/navigation";

import { getPrisma } from "@pulse/db";

import { getPolicySessionContext } from "@/server/auth/session-to-policy-context";

export type TrainerServiceForEdit = {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  priceCents: number;
  currency: string;
  isActive: boolean;
  sortOrder: number;
};

export type TrainerServicesEditContext = {
  profileId: string;
  services: TrainerServiceForEdit[];
};

export async function getTrainerServicesForEdit(): Promise<TrainerServicesEditContext> {
  const ctx = await getPolicySessionContext();
  if (!ctx) {
    redirect("/auth/login");
  }

  const profile = await getPrisma().trainerProfile.findUnique({
    where: { userId: ctx.userId },
    select: {
      id: true,
      services: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          name: true,
          description: true,
          durationMinutes: true,
          priceCents: true,
          currency: true,
          isActive: true,
          sortOrder: true,
        },
      },
    },
  });

  if (!profile) {
    redirect("/auth/register/trainer");
  }

  return {
    profileId: profile.id,
    services: profile.services,
  };
}
