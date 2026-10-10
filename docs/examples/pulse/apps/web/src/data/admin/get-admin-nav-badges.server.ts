import "server-only";

import { COMPLAINT_STATUS, REFUND_STATUS, TRAINER_STATUS } from "@pulse/domain";
import { getPrisma } from "@pulse/db";

import type { AdminNavBadges } from "@/lib/nav/nav-config";

export async function getAdminNavBadges(): Promise<AdminNavBadges> {
  try {
    const prisma = getPrisma();
    const [pendingTrainers, openComplaints, pendingRefunds] = await Promise.all([
      prisma.trainerProfile.count({
        where: { status: TRAINER_STATUS.PENDING },
      }),
      prisma.complaint.count({
        where: { status: COMPLAINT_STATUS.OPEN },
      }),
      prisma.refundRequest.count({
        where: { status: REFUND_STATUS.PENDING },
      }),
    ]);

    return {
      pendingTrainers,
      openComplaints,
      pendingRefunds,
    };
  } catch {
    return {};
  }
}
