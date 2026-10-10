import { COMPLAINT_STATUS } from "@pulse/domain";

import { ComplaintAuditTimeline } from "@/components/admin/ComplaintAuditTimeline";
import { ComplaintClosedSummary } from "@/components/admin/ComplaintClosedSummary";
import { ComplaintContextPanel } from "@/components/admin/ComplaintContextPanel";
import { ComplaintDetailActionsBar } from "@/components/admin/ComplaintDetailActionsBar.client";
import { ComplaintDetailCard } from "@/components/admin/ComplaintDetailCard";
import { ComplaintDetailHeader } from "@/components/admin/ComplaintDetailHeader";
import { ComplaintProcessedBanner } from "@/components/admin/ComplaintProcessedBanner";
import { requireComplaintDetail } from "@/data/admin/get-complaint-detail.server";
import { cn } from "@/lib/utils";

export type ComplaintDetailProps = {
  params: Promise<{ id: string }>;
};

export async function ComplaintDetail({ params }: ComplaintDetailProps) {
  const { id } = await params;
  const complaint = await requireComplaintDetail(id);
  const hasActions = complaint.canStartReview || complaint.canClose;
  const showBanner =
    complaint.status === COMPLAINT_STATUS.CLOSED ||
    complaint.status === COMPLAINT_STATUS.IN_REVIEW;
  const isClosed = complaint.status === COMPLAINT_STATUS.CLOSED;

  return (
    <div className={cn("space-y-6", hasActions && "pb-24 md:pb-0")}>
      <ComplaintDetailHeader />

      {showBanner ? (
        <ComplaintProcessedBanner
          status={complaint.status}
          assigneeName={complaint.assigneeName}
        />
      ) : null}

      <ComplaintContextPanel complaint={complaint} />

      <ComplaintDetailCard complaint={complaint} />

      <ComplaintAuditTimeline entries={complaint.auditTimeline} />

      {isClosed ? <ComplaintClosedSummary complaint={complaint} /> : null}

      {hasActions ? (
        <ComplaintDetailActionsBar
          complaintId={complaint.id}
          status={complaint.status}
          canStartReview={complaint.canStartReview}
          canClose={complaint.canClose}
        />
      ) : null}
    </div>
  );
}
