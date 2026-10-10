import type { Metadata } from "next";
import { Suspense } from "react";

import { BookingListSkeleton } from "@/components/booking/BookingListSkeleton";
import { ClientBookingsPanel } from "@/components/client/ClientBookingsPanel.client";
import { ClientBookingsTabSection } from "@/components/client/ClientBookingsTabSection.server";
import { Heading } from "@/components/atoms";
import { getMessages } from "@/lib/messages/server";

export async function generateMetadata(): Promise<Metadata> {
  const messages = await getMessages();
  return {
    title: messages.booking.list.metaTitle,
  };
}

export default async function ClientBookingsPage() {
  const messages = await getMessages();

  return (
    <div className="space-y-4 pb-6 md:max-w-5xl">
      <Heading as="h1" visualLevel="h2">
        {messages.booking.list.title}
      </Heading>
      <ClientBookingsPanel
        upcoming={
          <Suspense fallback={<BookingListSkeleton />}>
            <ClientBookingsTabSection tab="upcoming" />
          </Suspense>
        }
        past={
          <Suspense fallback={<BookingListSkeleton />}>
            <ClientBookingsTabSection tab="past" />
          </Suspense>
        }
        cancelled={
          <Suspense fallback={<BookingListSkeleton />}>
            <ClientBookingsTabSection tab="cancelled" />
          </Suspense>
        }
      />
    </div>
  );
}
