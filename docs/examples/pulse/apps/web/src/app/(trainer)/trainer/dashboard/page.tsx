import { Suspense } from "react";

import { Heading } from "@/components/atoms";
import { TrainerDashboardSubmittedToast } from "@/components/trainer/TrainerDashboardSubmittedToast.client";
import { TrainerDashboardBody } from "@/components/trainer/TrainerDashboardBody.server";
import { TrainerDashboardBodySkeleton } from "@/components/trainer/TrainerDashboardBodySkeleton";
import { getMessages } from "@/lib/messages/server";

export default async function TrainerDashboardPage() {
  const messages = await getMessages();

  return (
    <>
      <Suspense fallback={null}>
        <TrainerDashboardSubmittedToast />
      </Suspense>
      <Heading as="h1" visualLevel="h3">
        {messages.dashboard.trainerTitle}
      </Heading>
      <Suspense fallback={<TrainerDashboardBodySkeleton />}>
        <TrainerDashboardBody />
      </Suspense>
    </>
  );
}
