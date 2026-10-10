"use client";

import { SummaryCard, type SummaryCardRow } from "@/components/ui/SummaryCard";
import { UserAvatar } from "@/components/ui/UserAvatar";
import {
  useLocale,
  useMessages,
} from "@/components/i18n/LocaleProvider.client";

import {
  formatBookingDateTime,
  formatBookingPrice,
} from "@/lib/booking/booking-wizard-utils";
import type { TrainerServiceItem } from "@/lib/trainer/trainer-profile";

export type BookingWizardSidebarProps = {
  trainerName: string;
  trainerPhotoUrl: string | null;
  service: TrainerServiceItem | null;
  startsAtUtc: string | null;
  timezone: string;
  className?: string;
};

export function BookingWizardSidebar({
  trainerName,
  trainerPhotoUrl,
  service,
  startsAtUtc,
  timezone,
  className,
}: BookingWizardSidebarProps) {
  const messages = useMessages();
  const locale = useLocale();

  if (!service) {
    return null;
  }

  const rows: SummaryCardRow[] = [
    {
      label: messages.booking.detail.trainerLabel,
      value: trainerName,
    },
    {
      label: messages.booking.detail.serviceLabel,
      value: service.name,
    },
  ];

  if (startsAtUtc) {
    rows.push({
      label: messages.booking.detail.timeLabel,
      value: formatBookingDateTime(startsAtUtc, timezone, locale),
    });
  }

  return (
    <SummaryCard
      title={messages.booking.wizard.summaryTitle}
      className={className}
      header={
        <div className="flex items-center gap-3">
          <UserAvatar name={trainerName} src={trainerPhotoUrl} size="md" />
          <span className="font-medium">{trainerName}</span>
        </div>
      }
      rows={rows}
      totals={[
        {
          label: messages.booking.detail.priceLabel,
          value: formatBookingPrice(service.priceCents, service.currency, locale),
        },
      ]}
    />
  );
}
