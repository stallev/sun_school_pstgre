"use client";

import type { ReactNode } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  CLIENT_BOOKING_TABS,
  type ClientBookingTab,
} from "@/lib/booking/booking-tab-utils";
import { useMessages } from "@/components/i18n/LocaleProvider.client";

export type ClientBookingsPanelProps = {
  upcoming: ReactNode;
  past: ReactNode;
  cancelled: ReactNode;
};

export function ClientBookingsPanel({
  upcoming,
  past,
  cancelled,
}: ClientBookingsPanelProps) {
  const messages = useMessages();

  const tabLabels: Record<ClientBookingTab, string> = {
    upcoming: messages.booking.list.tabs.upcoming,
    past: messages.booking.list.tabs.past,
    cancelled: messages.booking.list.tabs.cancelled,
  };

  const slots: Record<ClientBookingTab, ReactNode> = {
    upcoming,
    past,
    cancelled,
  };

  return (
    <Tabs defaultValue="upcoming" className="space-y-4">
      <TabsList variant="pill" aria-label={messages.booking.list.title}>
        {CLIENT_BOOKING_TABS.map((tab) => (
          <TabsTrigger key={tab} value={tab}>
            {tabLabels[tab]}
          </TabsTrigger>
        ))}
      </TabsList>

      {CLIENT_BOOKING_TABS.map((tab) => (
        <TabsContent key={tab} value={tab} className="space-y-2.5">
          {slots[tab]}
        </TabsContent>
      ))}
    </Tabs>
  );
}
