import { DollarSignIcon } from "lucide-react";
import { connection } from "next/server";

import { Heading } from "@/components/atoms";
import { TrainerIncomeSummary } from "@/components/trainer/TrainerIncomeSummary";
import { TrainerIncomeTransactions } from "@/components/trainer/TrainerIncomeTransactions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { getTrainerIncomeSnapshot } from "@/data/trainer/get-trainer-income.server";
import { getMessages } from "@/lib/messages/server";

export default async function TrainerIncomePage() {
  // Month window uses `new Date()` — mark request-bound before DAL.
  await connection();
  const messages = await getMessages();
  const snapshot = await getTrainerIncomeSnapshot();

  return (
    <>
      <Heading as="h1" visualLevel="h3">
        {messages.trainer.income.title}
      </Heading>
      <Alert className="mt-4">
        <AlertDescription>{messages.trainer.income.stripeBanner}</AlertDescription>
      </Alert>
      <div className="mt-6 space-y-6">
        <TrainerIncomeSummary snapshot={snapshot} />
        {snapshot.transactions.length === 0 ? (
          <Empty className="border-border bg-card">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <DollarSignIcon aria-hidden />
              </EmptyMedia>
              <EmptyTitle>{messages.trainer.income.emptyTitle}</EmptyTitle>
              <EmptyDescription>
                {messages.trainer.income.emptyDescription}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <TrainerIncomeTransactions transactions={snapshot.transactions} />
        )}
      </div>
    </>
  );
}
