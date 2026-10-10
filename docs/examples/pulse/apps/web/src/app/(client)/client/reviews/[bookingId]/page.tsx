import type { Metadata } from "next";
import { Suspense } from "react";

import { Heading } from "@/components/atoms";
import { ClientReviewFormSection } from "@/components/client/ClientReviewFormSection.server";
import { Skeleton } from "@/components/ui/skeleton";
import { getMessages } from "@/lib/messages/server";

type ClientReviewPageProps = {
  params: Promise<{ bookingId: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const messages = await getMessages();
  return {
    title: messages.review.metaTitle,
  };
}

export default async function ClientReviewPage({
  params,
}: ClientReviewPageProps) {
  const messages = await getMessages();

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 py-4 pb-6">
      <Heading as="h1" visualLevel="h2">
        {messages.review.heading}
      </Heading>
      <Suspense
        fallback={
          <>
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </>
        }
      >
        <ClientReviewFormSection params={params} />
      </Suspense>
    </div>
  );
}
