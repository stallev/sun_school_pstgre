import {
  CalendarIcon,
  DollarSignIcon,
  StarIcon,
  UsersIcon,
} from "lucide-react";

import { PulseCardKpi } from "@/components/ui/PulseCardKpi";
import type { TrainerDashboardSnapshot } from "@/data/trainer/get-trainer-dashboard.server";
import { getMessages } from "@/lib/messages/server";


export type TrainerDashboardKpiGridProps = {
  snapshot: TrainerDashboardSnapshot;
};

export async function TrainerDashboardKpiGrid({ snapshot }: TrainerDashboardKpiGridProps) {
  const messages = await getMessages();
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <PulseCardKpi
        icon={<CalendarIcon className="size-4" aria-hidden />}
        tone="primary"
        value={snapshot.todayCount}
        label={messages.trainer.dashboardOps.todaySessions}
      />
      <PulseCardKpi
        icon={<UsersIcon className="size-4" aria-hidden />}
        tone="info"
        value={snapshot.weekCount}
        label={messages.trainer.dashboardOps.weekBookings}
      />
      <PulseCardKpi
        icon={<StarIcon className="size-4" aria-hidden />}
        tone="success"
        value={snapshot.ratingLabel}
        label={messages.trainer.dashboardOps.rating}
      />
      <PulseCardKpi
        icon={<DollarSignIcon className="size-4" aria-hidden />}
        tone="secondary"
        value={snapshot.monthIncomeLabel}
        label={messages.trainer.dashboardOps.monthIncome}
      />
    </div>
  );
}
