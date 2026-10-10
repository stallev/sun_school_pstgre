import "server-only";

import { notFound } from "next/navigation";

import { COMPLAINT_STATUS } from "@pulse/domain";
import { getPrisma } from "@pulse/db";

export type ComplaintBookingContext = {
  id: string;
  status: string;
  serviceName: string;
  startsAt: string;
  priceCents: number;
  currency: string;
};

export type ComplaintRefundContext = {
  id: string;
  status: string;
  amountCents: number;
  currency: string;
};

export type ComplaintAuditEntry = {
  id: string;
  action: string;
  actorName: string | null;
  createdAt: string;
  resolution: string | null;
};

export type ComplaintDetail = {
  id: string;
  status: string;
  priority: string;
  reason: string;
  resolution: string | null;
  adminNotes: string | null;
  createdAt: string;
  resolvedAt: string | null;
  resolvedByName: string | null;
  assigneeName: string | null;
  reporterName: string;
  trainerName: string | null;
  trainerProfileId: string | null;
  bookingId: string | null;
  booking: ComplaintBookingContext | null;
  relatedRefund: ComplaintRefundContext | null;
  auditTimeline: ComplaintAuditEntry[];
  canStartReview: boolean;
  canClose: boolean;
};

const REVIEW_STARTED_ACTION = "complaint.review_started";

function mapAuditEntry(entry: {
  id: string;
  action: string;
  createdAt: Date;
  metadataJson: unknown;
  actor: { fullName: string } | null;
}): ComplaintAuditEntry {
  const metadata =
    entry.metadataJson &&
    typeof entry.metadataJson === "object" &&
    !Array.isArray(entry.metadataJson)
      ? (entry.metadataJson as Record<string, unknown>)
      : null;

  const resolution =
    typeof metadata?.resolution === "string" ? metadata.resolution : null;

  return {
    id: entry.id,
    action: entry.action,
    actorName: entry.actor?.fullName ?? null,
    createdAt: entry.createdAt.toISOString(),
    resolution,
  };
}

export async function getComplaintDetail(
  complaintId: string,
): Promise<ComplaintDetail | null> {
  const complaint = await getPrisma().complaint.findFirst({
    where: { id: complaintId },
    select: {
      id: true,
      status: true,
      priority: true,
      reason: true,
      resolution: true,
      adminNotes: true,
      createdAt: true,
      resolvedAt: true,
      targetBookingId: true,
      reporter: { select: { fullName: true } },
      targetTrainer: {
        select: {
          id: true,
          user: { select: { fullName: true } },
        },
      },
      resolvedBy: { select: { fullName: true } },
      targetBooking: {
        select: {
          id: true,
          status: true,
          serviceNameSnapshot: true,
          startsAt: true,
          priceCents: true,
          currency: true,
        },
      },
    },
  });

  if (!complaint) {
    return null;
  }

  const [auditLogs, relatedRefund] = await Promise.all([
    getPrisma().auditLog.findMany({
      where: { targetType: "complaint", targetId: complaintId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        action: true,
        createdAt: true,
        metadataJson: true,
        actor: { select: { fullName: true } },
      },
    }),
    complaint.targetBookingId
      ? getPrisma().refundRequest.findFirst({
          where: { bookingId: complaint.targetBookingId },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            status: true,
            amountCents: true,
            currency: true,
          },
        })
      : Promise.resolve(null),
  ]);

  const reviewStartedEntries = auditLogs.filter(
    (entry) => entry.action === REVIEW_STARTED_ACTION,
  );
  const latestReviewStarted =
    reviewStartedEntries[reviewStartedEntries.length - 1];

  return {
    id: complaint.id,
    status: complaint.status,
    priority: complaint.priority,
    reason: complaint.reason,
    resolution: complaint.resolution,
    adminNotes: complaint.adminNotes,
    createdAt: complaint.createdAt.toISOString(),
    resolvedAt: complaint.resolvedAt?.toISOString() ?? null,
    resolvedByName: complaint.resolvedBy?.fullName ?? null,
    assigneeName: latestReviewStarted?.actor?.fullName ?? null,
    reporterName: complaint.reporter.fullName,
    trainerName: complaint.targetTrainer?.user.fullName ?? null,
    trainerProfileId: complaint.targetTrainer?.id ?? null,
    bookingId: complaint.targetBookingId,
    booking: complaint.targetBooking
      ? {
          id: complaint.targetBooking.id,
          status: complaint.targetBooking.status,
          serviceName: complaint.targetBooking.serviceNameSnapshot,
          startsAt: complaint.targetBooking.startsAt.toISOString(),
          priceCents: complaint.targetBooking.priceCents,
          currency: complaint.targetBooking.currency,
        }
      : null,
    relatedRefund: relatedRefund
      ? {
          id: relatedRefund.id,
          status: relatedRefund.status,
          amountCents: relatedRefund.amountCents,
          currency: relatedRefund.currency,
        }
      : null,
    auditTimeline: auditLogs.map(mapAuditEntry),
    canStartReview: complaint.status === COMPLAINT_STATUS.OPEN,
    canClose: complaint.status !== COMPLAINT_STATUS.CLOSED,
  };
}

export async function requireComplaintDetail(
  complaintId: string,
): Promise<ComplaintDetail> {
  const complaint = await getComplaintDetail(complaintId);

  if (!complaint) {
    notFound();
  }

  return complaint;
}
