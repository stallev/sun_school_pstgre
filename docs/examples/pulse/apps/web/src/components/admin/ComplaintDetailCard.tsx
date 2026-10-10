import { ContentText } from "@/components/atoms";
import { PulseCard, PulseCardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { ComplaintDetail } from "@/data/admin/get-complaint-detail.server";
import {
  getComplaintPriorityBadge,
  getComplaintStatusBadge,
} from "@/lib/admin/complaint-badges";
import { formatBookingReference } from "@/lib/admin/format-booking-reference";
import { formatAdminRelativeDate } from "@/lib/date/format-admin-relative";
import { getLocale, getMessages } from "@/lib/messages/server";


export type ComplaintDetailCardProps = {
  complaint: ComplaintDetail;
};

export async function ComplaintDetailCard({ complaint }: ComplaintDetailCardProps) {
  const [messages, locale] = await Promise.all([getMessages(), getLocale()]);
  const priorityBadge = getComplaintPriorityBadge(complaint.priority, messages);
  const statusBadge = getComplaintStatusBadge(complaint.status, messages);

  return (
    <PulseCard variant="base" className="rounded-2xl">
      <PulseCardContent density="sm" className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={priorityBadge.variant}>
            {priorityBadge.label}
          </StatusBadge>
          <StatusBadge status={statusBadge.variant}>
            {statusBadge.label}
          </StatusBadge>
          <ContentText as="span" className="text-[11.5px] text-muted-foreground">
            · {formatAdminRelativeDate(complaint.createdAt, locale)}
          </ContentText>
        </div>

        <div className="space-y-1 text-sm">
          <ContentText as="p">
            <span className="text-muted-foreground">
              {messages.admin.complaints.fromLabel}
            </span>{" "}
            {complaint.reporterName}
          </ContentText>
          {complaint.trainerName ? (
            <ContentText as="p">
              <span className="text-muted-foreground">
                {messages.admin.complaints.onLabel}
              </span>{" "}
              {complaint.trainerName}
            </ContentText>
          ) : null}
        </div>

        <ContentText as="p" className="text-sm font-medium">
          {complaint.reason}
        </ContentText>

        {complaint.bookingId ? (
          <dl className="grid gap-3 text-sm md:max-w-xl">
            <div>
              <dt className="text-muted-foreground">
                {messages.admin.complaints.booking}
              </dt>
              <dd
                title={complaint.bookingId}
                className="font-mono text-[13px]"
              >
                {messages.admin.complaints.bookingReference.replace(
                  "{ref}",
                  formatBookingReference(complaint.bookingId),
                )}
              </dd>
            </div>
          </dl>
        ) : null}
      </PulseCardContent>
    </PulseCard>
  );
}
