import { ContentText, SectionTitle } from "@/components/atoms";
import { PulseCard, PulseCardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { ComplaintAuditEntry } from "@/data/admin/get-complaint-detail.server";
import { getComplaintResolutionBadge } from "@/lib/admin/complaint-badges";
import { formatAdminRelativeDate } from "@/lib/date/format-admin-relative";
import { getLocale, getMessages } from "@/lib/messages/server";


import type { Messages } from "@/lib/messages/types";

export type ComplaintAuditTimelineProps = {
  entries: ComplaintAuditEntry[];
};

function getAuditActionLabel(action: string, messages: Messages): string {
  if (action === "complaint.review_started") {
    return messages.admin.complaints.auditReviewStarted;
  }

  if (action === "complaint.closed") {
    return messages.admin.complaints.auditClosed;
  }

  return action;
}

export async function ComplaintAuditTimeline({ entries }: ComplaintAuditTimelineProps) {
  const [messages, locale] = await Promise.all([getMessages(), getLocale()]);
  if (entries.length === 0) {
    return null;
  }

  return (
    <PulseCard variant="base" className="rounded-2xl">
      <PulseCardContent density="sm" className="space-y-3">
        <SectionTitle>{messages.admin.complaints.auditTitle}</SectionTitle>
        <ul className="space-y-3">
          {entries.map((entry) => {
            const resolutionBadge = entry.resolution
              ? getComplaintResolutionBadge(entry.resolution, messages)
              : null;

            return (
              <li
                key={entry.id}
                className="flex flex-wrap items-start justify-between gap-2 border-b border-border pb-3 last:border-0 last:pb-0"
              >
                <div className="space-y-1">
                  <ContentText as="p" className="text-sm font-medium">
                    {getAuditActionLabel(entry.action, messages)}
                  </ContentText>
                  {entry.actorName ? (
                    <ContentText as="p" className="text-sm text-muted-foreground">
                      {entry.actorName}
                    </ContentText>
                  ) : null}
                  {resolutionBadge ? (
                    <StatusBadge status={resolutionBadge.variant}>
                      {resolutionBadge.label}
                    </StatusBadge>
                  ) : null}
                </div>
                <ContentText
                  as="span"
                  className="text-[11.5px] text-muted-foreground"
                >
                  {formatAdminRelativeDate(entry.createdAt, locale)}
                </ContentText>
              </li>
            );
          })}
        </ul>
      </PulseCardContent>
    </PulseCard>
  );
}
