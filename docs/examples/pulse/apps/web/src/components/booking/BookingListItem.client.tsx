"use client";

import { ContentText } from "@/components/atoms";
import { ClientBookingReviewListAction } from "@/components/client/ClientBookingReviewListAction.client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CustomLink } from "@/components/ui/CustomLink";
import { PulseCard } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  useLocale,
  useMessages,
} from "@/components/i18n/LocaleProvider.client";

import type { ClientBookingListEntry } from "@/data/client/get-client-bookings.server";
import { formatBookingDateTimeLocal } from "@/lib/booking/format-booking-datetime-local";
import {
  getBookingStatusBadgeVariant,
  getBookingStatusLabel,
} from "@/lib/booking/booking-status-ui";
import type { ClientBookingTab } from "@/lib/booking/booking-tab-utils";
import { cn } from "@/lib/utils";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export type BookingListItemProps = {
  booking: ClientBookingListEntry;
  tab: ClientBookingTab;
  onCancelClick?: () => void;
  onJoinClick?: () => void;
  className?: string;
};

export function BookingListItem({
  booking,
  tab,
  onCancelClick,
  onJoinClick,
  className,
}: BookingListItemProps) {
  const messages = useMessages();
  const locale = useLocale();

  const status = booking.status;
  const showUpcomingActions = tab === "upcoming" && booking.canCancel;
  const showPastReviewActions = tab === "past";

  return (
    <PulseCard
      className={cn(
        "flex h-full flex-col rounded-2xl p-4 shadow-[var(--shadow-card)]",
        className,
      )}
    >
      <CustomLink
        href={`/client/bookings/${booking.id}`}
        className="flex items-start gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Avatar size="md" className="shrink-0">
          {booking.trainerPhotoUrl ? (
            <AvatarImage
              src={booking.trainerPhotoUrl}
              alt={booking.trainerName}
            />
          ) : null}
          <AvatarFallback>{getInitials(booking.trainerName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <ContentText
              variant="smallEmphasis"
              as="p"
              className="min-w-0 flex-1 truncate"
            >
              {booking.trainerName}
            </ContentText>
            <StatusBadge
              status={getBookingStatusBadgeVariant(status)}
              className="shrink-0"
            >
              {getBookingStatusLabel(status, messages)}
            </StatusBadge>
          </div>
          <ContentText variant="metaSecondary" as="p" className="mt-0.5 line-clamp-1">
            {booking.serviceNameSnapshot}
          </ContentText>
          <ContentText variant="metaPrimary" as="p" className="mt-1.5">
            {formatBookingDateTimeLocal(booking.startsAtUtc, locale)}
          </ContentText>
        </div>
      </CustomLink>

      {showUpcomingActions ? (
        <div className="mt-auto flex gap-2 pt-3">
          <Button
            type="button"
            size="sm"
            variant="default"
            className="min-h-11 flex-1"
            onClick={onJoinClick}
          >
            {messages.booking.actions.join}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="min-h-11 shrink-0"
            onClick={onCancelClick}
          >
            {messages.booking.cancel.button}
          </Button>
        </div>
      ) : null}

      {showPastReviewActions ? (
        <ClientBookingReviewListAction
          bookingId={booking.id}
          hasReview={booking.hasReview}
          reviewRating={booking.reviewRating}
        />
      ) : null}
    </PulseCard>
  );
}
