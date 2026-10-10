import { ContentText, SectionTitle } from "@/components/atoms";
import { PulseCard, PulseCardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CustomLink } from "@/components/ui/CustomLink";
import type { ComplaintDetail } from "@/data/admin/get-complaint-detail.server";
import { formatBookingReference } from "@/lib/admin/format-booking-reference";
import { formatBookingDateTimeLocal } from "@/lib/booking/format-booking-datetime-local";
import {
  getBookingStatusBadgeVariant,
  getBookingStatusLabel,
} from "@/lib/booking/booking-status-ui";
import { formatMoney } from "@/lib/format-money";
import { getLocale, getMessages } from "@/lib/messages/server";

import type { BookingStatus } from "@pulse/domain";

import type { Messages } from "@/lib/messages/types";

export type ComplaintContextPanelProps = {
  complaint: ComplaintDetail;
};

function getRefundStatusLabel(status: string, messages: Messages): string {
  if (status === "pending") {
    return messages.admin.refunds.pendingStatus;
  }

  if (status === "approved") {
    return messages.admin.refunds.approveSuccess;
  }

  if (status === "rejected") {
    return messages.admin.refunds.rejectSuccess;
  }

  return status;
}

export async function ComplaintContextPanel({ complaint }: ComplaintContextPanelProps) {
  const [messages, locale] = await Promise.all([getMessages(), getLocale()]);
  return (
    <PulseCard variant="base" className="rounded-2xl">
      <PulseCardContent density="sm" className="space-y-4">
        <SectionTitle>{messages.admin.complaints.contextTitle}</SectionTitle>

        {complaint.booking ? (
          <dl className="grid gap-2 text-sm">
            <div>
              <dt className="text-muted-foreground">
                {messages.admin.complaints.booking}
              </dt>
              <dd className="space-y-1">
                <ContentText as="p" className="font-mono text-[13px]">
                  {messages.admin.complaints.bookingReference.replace(
                    "{ref}",
                    formatBookingReference(complaint.booking.id),
                  )}
                </ContentText>
                <ContentText as="p">
                  {complaint.booking.serviceName} ·{" "}
                  {formatBookingDateTimeLocal(complaint.booking.startsAt, locale)}
                </ContentText>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge
                    status={getBookingStatusBadgeVariant(
                      complaint.booking.status as BookingStatus,
                    )}
                  >
                    {getBookingStatusLabel(
                      complaint.booking.status as BookingStatus,
                      messages,
                    )}
                  </StatusBadge>
                  <ContentText as="span" className="text-muted-foreground">
                    {formatMoney(
                      complaint.booking.priceCents,
                      complaint.booking.currency,
                      locale,
                    )}
                  </ContentText>
                </div>
              </dd>
            </div>
          </dl>
        ) : (
          <ContentText as="p" className="text-sm text-muted-foreground">
            {messages.admin.complaints.noBooking}
          </ContentText>
        )}

        <div className="space-y-1 text-sm">
          <ContentText as="p" className="text-muted-foreground">
            {messages.admin.complaints.relatedRefund}
          </ContentText>
          {complaint.relatedRefund ? (
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status="pending">
                {getRefundStatusLabel(complaint.relatedRefund.status, messages)}
              </StatusBadge>
              <ContentText as="span">
                {formatMoney(
                  complaint.relatedRefund.amountCents,
                  complaint.relatedRefund.currency,
                  locale,
                )}
              </ContentText>
              <CustomLink
                href="/admin/refunds"
                className="text-sm font-medium text-primary"
              >
                {messages.admin.complaints.viewRefunds}
              </CustomLink>
            </div>
          ) : (
            <ContentText as="p" className="text-muted-foreground">
              {messages.admin.complaints.noRefund}
            </ContentText>
          )}
        </div>
      </PulseCardContent>
    </PulseCard>
  );
}
