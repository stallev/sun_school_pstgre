import { PulseCardKpi } from "@/components/ui/PulseCardKpi";
import { CalendarIcon, DollarSignIcon } from "lucide-react";

import type { TrainerIncomeSnapshot } from "@/data/trainer/get-trainer-income.server";
import { getMessages } from "@/lib/messages/server";


export type TrainerIncomeSummaryProps = {
  snapshot: TrainerIncomeSnapshot;
};

export async function TrainerIncomeSummary({ snapshot }: TrainerIncomeSummaryProps) {
  const messages = await getMessages();
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <PulseCardKpi
        icon={<DollarSignIcon className="size-4" aria-hidden />}
        tone="primary"
        value={snapshot.monthTotalLabel}
        label={messages.trainer.income.monthTotal}
      />
      <PulseCardKpi
        icon={<CalendarIcon className="size-4" aria-hidden />}
        tone="info"
        value={snapshot.sessionCount}
        label={messages.trainer.income.sessionCount}
      />
    </div>
  );
}
