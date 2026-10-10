"use client";

import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";

import { BookingListItem } from "@/components/booking/BookingListItem.client";
import { ClientBookingCancelDialog } from "@/components/client/ClientBookingCancelDialog.client";
import { Button } from "@/components/ui/button";
import { CustomLink } from "@/components/ui/CustomLink";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

import type { ClientBookingListEntry } from "@/data/client/get-client-bookings.server";
import type { ClientBookingTab } from "@/lib/booking/booking-tab-utils";
import { useMessages } from "@/components/i18n/LocaleProvider.client";
import { PRODUCT_TOAST_DURATION_MS } from "@/lib/ui/product-toast";

export type ClientBookingsTabListProps = {
  bookings: ClientBookingListEntry[];
  tab: ClientBookingTab;
};

export function ClientBookingsTabList({
  bookings,
  tab,
}: ClientBookingsTabListProps) {
  const messages = useMessages();
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);

  const emptyCopy = {
    upcoming: messages.booking.list.empty.upcoming,
    past: messages.booking.list.empty.past,
    cancelled: messages.booking.list.empty.cancelled,
  }[tab];

  const handleCancelClick = (bookingId: string) => {
    setCancelBookingId(bookingId);
    setCancelOpen(true);
  };

  const handleJoinClick = () => {
    toast.info(messages.placeholders.sessionVideo, {
      duration: PRODUCT_TOAST_DURATION_MS,
    });
  };

  return (
    <>
      {bookings.length === 0 ? (
        <Empty className="border-border bg-card lg:col-span-2">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarIcon aria-hidden />
            </EmptyMedia>
            <EmptyTitle>{emptyCopy.title}</EmptyTitle>
            <EmptyDescription>{emptyCopy.description}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <CustomLink href="/trainers">
                {messages.booking.list.empty.cta}
              </CustomLink>
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 items-stretch gap-2.5 md:grid-cols-2">
          {bookings.map((booking) => (
            <BookingListItem
              key={booking.id}
              booking={booking}
              tab={tab}
              className="h-full"
              onCancelClick={() => handleCancelClick(booking.id)}
              onJoinClick={handleJoinClick}
            />
          ))}
        </div>
      )}

      <ClientBookingCancelDialog
        bookingId={cancelBookingId}
        open={cancelOpen}
        onOpenChange={setCancelOpen}
      />
    </>
  );
}
