import type { ReactNode } from "react";

import { ContentText, Heading } from "@/components/atoms";
import { ClientBookingReviewSubmitted } from "@/components/client/ClientBookingReviewSubmitted";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PulseCard } from "@/components/ui/card";
import { KeyValueRow } from "@/components/ui/KeyValueRow";
import { CustomLink } from "@/components/ui/CustomLink";

import {
  formatBookingDateTime,
  formatBookingPrice,
} from "@/lib/booking/booking-wizard-utils";
import {
  getBookingStatusBadgeVariant,
  getBookingStatusLabel,
} from "@/lib/booking/booking-status-ui";
import type { ClientBookingDetail } from "@/data/client/get-client-booking-detail.server";
import { isPendingBookingStatus } from "@/data/client/get-client-booking-detail.server";
import { isBookingStatus } from "@pulse/domain";
import { getLocale, getMessages } from "@/lib/messages/server";


export type ClientBookingDetailPanelProps = {
  booking: ClientBookingDetail;
  actions?: ReactNode;
};

export async function ClientBookingDetailPanel({  booking,
  actions,
}: ClientBookingDetailPanelProps) {
  const [messages, locale] = await Promise.all([getMessages(), getLocale()]);

  const statusLabel = isBookingStatus(booking.status)
    ? getBookingStatusLabel(booking.status, messages)
    : booking.status;
  const statusVariant = isBookingStatus(booking.status)
    ? getBookingStatusBadgeVariant(booking.status)
    : "neutral";

  return (
    <div className="space-y-6 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Heading as="h1" visualLevel="h2">
            {messages.booking.detail.title}
          </Heading>
          {isPendingBookingStatus(booking.status) ? (
            <ContentText variant="mutedMicro" as="p" className="mt-1">
              {messages.booking.detail.statusPending}
            </ContentText>
          ) : null}
        </div>
        <StatusBadge status={statusVariant}>{statusLabel}</StatusBadge>
      </div>

      <PulseCard className="space-y-3 rounded-2xl p-5">
        <KeyValueRow
          label={messages.booking.detail.trainerLabel}
          value={booking.trainerName}
        />
        <KeyValueRow
          label={messages.booking.detail.serviceLabel}
          value={booking.serviceNameSnapshot}
        />
        <KeyValueRow
          label={messages.booking.detail.timeLabel}
          value={formatBookingDateTime(
            booking.startsAtUtc,
            booking.trainerTimezone,
            locale,
          )}
        />
        <ContentText variant="mutedMicro" as="p">
          {messages.booking.detail.timezoneHint}
        </ContentText>
        <KeyValueRow
          label={messages.booking.detail.priceLabel}
          value={formatBookingPrice(booking.priceCents, booking.currency, locale)}
        />
        {booking.clientMessage ? (
          <KeyValueRow
            label={messages.booking.detail.messageLabel}
            value={booking.clientMessage}
          />
        ) : null}
      </PulseCard>

      {booking.review ? (
        <ClientBookingReviewSubmitted review={booking.review} />
      ) : null}

      {actions}

      <CustomLink href="/client/bookings" variant="quiet">
        {messages.booking.detail.backToBookings}
      </CustomLink>
    </div>
  );
}
