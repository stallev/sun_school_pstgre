import "server-only";

import { BOOKING_STATUS } from "@pulse/domain";
import { getPrisma } from "@pulse/db";

import {
  countPendingTrainerApplications,
  getOldestPendingTrainerDays,
} from "@/data/admin/list-trainer-applications.server";
import {
  countOpenComplaints,
  hasHighPriorityOpenComplaint,
} from "@/data/admin/list-complaints.server";
import {
  countPendingRefunds,
  getPendingRefundsTotalCents,
} from "@/data/admin/list-refunds.server";

export type AdminDashboardKpiData = {
  signupsLast30Days: number;
  pendingTrainers: number;
  openComplaints: number;
  pendingRefunds: number;
  gmvLast30DaysCents: number;
  oldestPendingTrainerDays: number | null;
};

export type AdminNeedsAttentionData = {
  pendingTrainers: number;
  openComplaints: number;
  pendingRefunds: number;
  oldestPendingTrainerDays: number | null;
  hasHighPriorityComplaint: boolean;
  pendingRefundsTotalCents: number;
};

function daysAgo(days: number): Date {
  const since = new Date();
  since.setDate(since.getDate() - days);
  return since;
}

export async function getAdminDashboardKpiData(): Promise<AdminDashboardKpiData> {
  const since = daysAgo(30);
  const prisma = getPrisma();

  const [
    signupsLast30Days,
    pendingTrainers,
    openComplaints,
    pendingRefunds,
    gmvAggregate,
    oldestPendingTrainerDays,
  ] = await Promise.all([
    prisma.user.count({ where: { createdAt: { gte: since } } }),
    countPendingTrainerApplications(),
    countOpenComplaints(),
    countPendingRefunds(),
    prisma.booking.aggregate({
      where: {
        status: BOOKING_STATUS.COMPLETED,
        completedAt: { gte: since },
      },
      _sum: { priceCents: true },
    }),
    getOldestPendingTrainerDays(),
  ]);

  return {
    signupsLast30Days,
    pendingTrainers,
    openComplaints,
    pendingRefunds,
    gmvLast30DaysCents: gmvAggregate._sum.priceCents ?? 0,
    oldestPendingTrainerDays,
  };
}

export async function getAdminNeedsAttentionData(): Promise<AdminNeedsAttentionData> {
  const [
    pendingTrainers,
    openComplaints,
    pendingRefunds,
    oldestPendingTrainerDays,
    hasHighPriorityComplaint,
    pendingRefundsTotalCents,
  ] = await Promise.all([
    countPendingTrainerApplications(),
    countOpenComplaints(),
    countPendingRefunds(),
    getOldestPendingTrainerDays(),
    hasHighPriorityOpenComplaint(),
    getPendingRefundsTotalCents(),
  ]);

  return {
    pendingTrainers,
    openComplaints,
    pendingRefunds,
    oldestPendingTrainerDays,
    hasHighPriorityComplaint,
    pendingRefundsTotalCents,
  };
}

export async function hasAnyAdminQueueItems(): Promise<boolean> {
  const data = await getAdminNeedsAttentionData();

  return (
    data.pendingTrainers > 0 ||
    data.openComplaints > 0 ||
    data.pendingRefunds > 0
  );
}
