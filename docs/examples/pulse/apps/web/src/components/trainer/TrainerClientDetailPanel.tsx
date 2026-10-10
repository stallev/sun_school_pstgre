import { Heading, SectionTitle } from "@/components/atoms";
import { Badge } from "@/components/ui/badge";
import { KeyValueRow } from "@/components/ui/KeyValueRow";
import { PulseCard } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { CompleteBookingButton } from "@/components/trainer/CompleteBookingButton.client";
import { TrainerClientNotesField } from "@/components/trainer/TrainerClientNotesField.client";
import type { TrainerClientDetail } from "@/data/trainer/get-trainer-client-detail.server";
import { BOOKING_STATUS } from "@pulse/domain";

import { formatBookingDateTimeLocal } from "@/lib/booking/format-booking-datetime-local";
import { formatServicePrice } from "@/lib/trainer/format-service-price";
import { getLocale, getMessages } from "@/lib/messages/server";


export type TrainerClientDetailPanelProps = {
  detail: TrainerClientDetail;
};

export async function TrainerClientDetailPanel({ detail }: TrainerClientDetailPanelProps) {
  const [messages, locale] = await Promise.all([getMessages(), getLocale()]);
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <UserAvatar name={detail.displayName} src={detail.avatarUrl} size="lg" />
        <div>
          <Heading as="h1" visualLevel="h3">
            {detail.displayName}
          </Heading>
          <Badge variant="secondary">
            {messages.trainer.clients.sessionsCount.replace(
              "{count}",
              String(detail.sessionCount),
            )}
          </Badge>
        </div>
      </div>

      <section className="space-y-3">
        <SectionTitle>{messages.trainer.clients.sessionHistory}</SectionTitle>
        <div className="space-y-2">
          {detail.bookings.map((booking) => (
            <PulseCard key={booking.id} className="space-y-2 p-4">
              <KeyValueRow
                label={formatBookingDateTimeLocal(booking.startsAtUtc, locale)}
                value={booking.serviceName}
              />
              <KeyValueRow
                label={messages.common.durationMinutes.replace(
                  "{minutes}",
                  String(booking.durationMinutes),
                )}
                value={formatServicePrice(
                  booking.priceCents,
                  booking.currency,
                  locale,
                )}
              />
              {booking.status === BOOKING_STATUS.CONFIRMED ? (
                <CompleteBookingButton bookingId={booking.id} />
              ) : null}
            </PulseCard>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <SectionTitle>{messages.trainer.clients.privateNotes}</SectionTitle>
        <TrainerClientNotesField
          clientId={detail.clientId}
          initialNotes={detail.notes}
        />
      </section>
    </div>
  );
}
