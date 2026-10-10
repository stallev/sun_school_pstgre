import "server-only";

import { TRAINER_STATUSES } from "@pulse/domain";
import { getPrisma } from "@pulse/db";

const PENDING_TRAINER_STATUS = TRAINER_STATUSES[0];

export type TrainerShellContext = {
  showReviewBanner: boolean;
};

export async function getTrainerShellContext(
  userId: string,
): Promise<TrainerShellContext> {
  try {
    const profile = await getPrisma().trainerProfile.findUnique({
      where: { userId },
      select: { status: true },
    });

    return {
      showReviewBanner: profile?.status === PENDING_TRAINER_STATUS,
    };
  } catch {
    return { showReviewBanner: false };
  }
}
