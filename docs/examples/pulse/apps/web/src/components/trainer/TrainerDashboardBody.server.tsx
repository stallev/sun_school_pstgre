import { connection } from "next/server";

import { TrainerDashboardKpiGrid } from "@/components/trainer/TrainerDashboardKpiGrid";
import { TrainerRecentReviews } from "@/components/trainer/TrainerRecentReviews";
import { TrainerTodaySessionsList } from "@/components/trainer/TrainerTodaySessionsList";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getTrainerDashboardSnapshot } from "@/data/trainer/get-trainer-dashboard.server";
import { getMessages } from "@/lib/messages/server";

export async function TrainerDashboardBody() {
  // Today/week/month windows use `new Date()` — mark request-bound before DAL.
  await connection();
  const messages = await getMessages();
  const snapshot = await getTrainerDashboardSnapshot();

  return (
    <>
      {!snapshot.isApproved ? (
        <Alert className="mt-4">
          <AlertTitle>{messages.trainerReviewBanner.title}</AlertTitle>
          <AlertDescription>
            {messages.trainerReviewBanner.description}
          </AlertDescription>
        </Alert>
      ) : null}
      <div className="mt-6 space-y-6">
        <TrainerDashboardKpiGrid snapshot={snapshot} />
        <div className="grid gap-6 md:grid-cols-2">
          <TrainerTodaySessionsList sessions={snapshot.todaySessions} />
          <TrainerRecentReviews reviews={snapshot.recentReviews} />
        </div>
      </div>
    </>
  );
}
