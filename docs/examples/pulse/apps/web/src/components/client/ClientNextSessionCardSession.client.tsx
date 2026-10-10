"use client";

import { useState } from "react";
import { VideoIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { ContentText, Heading } from "@/components/atoms";
import { ClientBookingCancelDialog } from "@/components/client/ClientBookingCancelDialog.client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PulseCard } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/SectionHeader";

import type { ClientBookingListEntry } from "@/data/client/get-client-bookings.server";
import {
  useLocale,
  useMessages,
} from "@/components/i18n/LocaleProvider.client";
import { formatBookingDateTimeLocal } from "@/lib/booking/format-booking-datetime-local";

import { PRODUCT_TOAST_DURATION_MS } from "@/lib/ui/product-toast";

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

export type ClientNextSessionCardSessionProps = {
  session: ClientBookingListEntry;
};

export function ClientNextSessionCardSession({  session,
}: ClientNextSessionCardSessionProps) {
  const messages = useMessages();
  const locale = useLocale();

  const [cancelOpen, setCancelOpen] = useState(false);

  const handleJoinClick = () => {
    toast.info(messages.placeholders.sessionVideo, {
      duration: PRODUCT_TOAST_DURATION_MS,
    });
  };

  return (
    <>
      <section>
        <SectionHeader title={messages.dashboard.client.nextSessionTitle} />
        <PulseCard className="overflow-hidden">
          <div className="flex items-center gap-3 p-4 md:gap-4 md:p-5">
            <Avatar size="lg" className="shrink-0">
              {session.trainerPhotoUrl ? (
                <AvatarImage
                  src={session.trainerPhotoUrl}
                  alt={session.trainerName}
                />
              ) : null}
              <AvatarFallback>{getInitials(session.trainerName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <ContentText
                variant="mutedMicro"
                as="p"
                className="font-medium uppercase tracking-wide text-primary"
                suppressHydrationWarning
              >
                {formatBookingDateTimeLocal(session.startsAtUtc, locale)}
              </ContentText>
              <Heading as="h3" visualLevel="h3" className="mt-0.5 md:text-[22px]">
                {session.trainerName}
              </Heading>
              <ContentText variant="mutedMicro" as="p" className="mt-0.5 truncate">
                {session.serviceNameSnapshot}
              </ContentText>
            </div>
          </div>
          <div className="flex gap-2 px-4 pb-4 md:px-5 md:pb-5">
            <Button
              type="button"
              variant="default"
              className="min-h-11 flex-1"
              onClick={handleJoinClick}
            >
              <VideoIcon aria-hidden />
              {messages.booking.actions.join}
            </Button>
            {session.canCancel ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="min-h-11 min-w-11 shrink-0"
                aria-label={messages.booking.cancel.button}
                onClick={() => setCancelOpen(true)}
              >
                <XIcon aria-hidden />
              </Button>
            ) : null}
          </div>
        </PulseCard>
      </section>

      <ClientBookingCancelDialog
        bookingId={session.id}
        open={cancelOpen}
        onOpenChange={setCancelOpen}
      />
    </>
  );
}
