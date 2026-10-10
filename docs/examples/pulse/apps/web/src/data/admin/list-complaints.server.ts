import "server-only";

import {
  COMPLAINT_PRIORITY,
  COMPLAINT_STATUS,
  type ComplaintPriority,
  type ComplaintStatus,
} from "@pulse/domain";
import { getPrisma } from "@pulse/db";

export type ComplaintListItem = {
  id: string;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  reason: string;
  createdAt: string;
  reporterName: string;
  trainerName: string | null;
  bookingId: string | null;
  assigneeName: string | null;
  reviewStartedAt: string | null;
};

export async function listComplaints(
  status: ComplaintStatus | ComplaintStatus[],
): Promise<ComplaintListItem[]> {
  const statuses = Array.isArray(status) ? status : [status];

  const complaints = await getPrisma().complaint.findMany({
    where: { status: { in: statuses } },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      status: true,
      priority: true,
      reason: true,
      createdAt: true,
      targetBookingId: true,
      reporter: { select: { fullName: true } },
      targetTrainer: {
        select: { user: { select: { fullName: true } } },
      },
    },
  });

  return complaints.map((complaint) => ({
    id: complaint.id,
    status: complaint.status,
    priority: complaint.priority,
    reason: complaint.reason,
    createdAt: complaint.createdAt.toISOString(),
    reporterName: complaint.reporter.fullName,
    trainerName: complaint.targetTrainer?.user.fullName ?? null,
    bookingId: complaint.targetBookingId,
    assigneeName: null,
    reviewStartedAt: null,
  }));
}

async function loadInReviewAssignees(
  complaintIds: string[],
): Promise<Map<string, { assigneeName: string; reviewStartedAt: string }>> {
  if (complaintIds.length === 0) {
    return new Map();
  }

  const auditLogs = await getPrisma().auditLog.findMany({
    where: {
      targetType: "complaint",
      targetId: { in: complaintIds },
      action: "complaint.review_started",
    },
    orderBy: { createdAt: "asc" },
    select: {
      targetId: true,
      createdAt: true,
      actor: { select: { fullName: true } },
    },
  });

  const assignees = new Map<
    string,
    { assigneeName: string; reviewStartedAt: string }
  >();

  for (const entry of auditLogs) {
    if (!entry.actor?.fullName) {
      continue;
    }

    assignees.set(entry.targetId, {
      assigneeName: entry.actor.fullName,
      reviewStartedAt: entry.createdAt.toISOString(),
    });
  }

  return assignees;
}

export async function listComplaintsWithAssignees(
  status: ComplaintStatus | ComplaintStatus[],
): Promise<ComplaintListItem[]> {
  const items = await listComplaints(status);
  const inReviewIds = items
    .filter((item) => item.status === COMPLAINT_STATUS.IN_REVIEW)
    .map((item) => item.id);

  const assignees = await loadInReviewAssignees(inReviewIds);

  return items.map((item) => {
    const assignee = assignees.get(item.id);
    if (!assignee) {
      return item;
    }

    return {
      ...item,
      assigneeName: assignee.assigneeName,
      reviewStartedAt: assignee.reviewStartedAt,
    };
  });
}

export async function getComplaintCounts(): Promise<
  Record<ComplaintStatus, number>
> {
  const prisma = getPrisma();

  const [open, inReview] = await Promise.all([
    prisma.complaint.count({
      where: { status: COMPLAINT_STATUS.OPEN },
    }),
    prisma.complaint.count({
      where: { status: COMPLAINT_STATUS.IN_REVIEW },
    }),
  ]);

  return {
    [COMPLAINT_STATUS.OPEN]: open,
    [COMPLAINT_STATUS.IN_REVIEW]: inReview,
    [COMPLAINT_STATUS.CLOSED]: 0,
  };
}

export async function countOpenComplaints(): Promise<number> {
  return getPrisma().complaint.count({
    where: { status: COMPLAINT_STATUS.OPEN },
  });
}

export async function hasHighPriorityOpenComplaint(): Promise<boolean> {
  const count = await getPrisma().complaint.count({
    where: { status: COMPLAINT_STATUS.OPEN, priority: COMPLAINT_PRIORITY.HIGH },
  });

  return count > 0;
}
