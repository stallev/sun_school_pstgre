import type { Metadata } from "next";
import { Suspense } from "react";

import { ClientBookingDetail } from "@/components/client/ClientBookingDetail.server";
import { Skeleton } from "@/components/ui/skeleton";
import { getMessages } from "@/lib/messages/server";

type ClientBookingDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const messages = await getMessages();
  return {
    title: messages.booking.detail.metaTitle,
  };
}

export default function ClientBookingDetailPage({
  params,
}: ClientBookingDetailPageProps) {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 py-4">
          <div className="flex items-start justify-between gap-3">
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <Skeleton className="h-56 w-full rounded-2xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      }
    >
      <ClientBookingDetail params={params} />
    </Suspense>
  );
}
