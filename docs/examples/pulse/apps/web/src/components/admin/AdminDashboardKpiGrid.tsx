import {
  DollarSignIcon,
  FlagIcon,
  ShieldIcon,
  UsersIcon,
} from "lucide-react";

import { PulseCardKpi } from "@/components/ui/PulseCardKpi";
import type { AdminDashboardKpiData } from "@/data/admin/get-admin-dashboard.server";
import { formatMoney } from "@/lib/format-money";
import { getLocale, getMessages } from "@/lib/messages/server";

export type AdminDashboardKpiGridProps = {
  data: AdminDashboardKpiData;
};

export async function AdminDashboardKpiGrid({ data }: AdminDashboardKpiGridProps) {
  const [messages, locale] = await Promise.all([getMessages(), getLocale()]);
  const oldestTrainerSub =
    data.oldestPendingTrainerDays !== null
      ? messages.dashboard.adminNeedsAttention.oldestWaiting.replace(
          "{days}",
          String(data.oldestPendingTrainerDays),
        )
      : undefined;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <PulseCardKpi
        icon={<UsersIcon className="size-4" aria-hidden />}
        tone="info"
        value={data.signupsLast30Days}
        label={messages.dashboard.adminKpi.signups}
      />
      <PulseCardKpi
        icon={<ShieldIcon className="size-4" aria-hidden />}
        tone="primary"
        value={data.pendingTrainers}
        label={messages.dashboard.adminKpi.pendingTrainers}
        sub={oldestTrainerSub}
      />
      <PulseCardKpi
        icon={<FlagIcon className="size-4" aria-hidden />}
        tone="secondary"
        value={data.openComplaints}
        label={messages.dashboard.adminKpi.openComplaints}
      />
      <PulseCardKpi
        icon={<DollarSignIcon className="size-4" aria-hidden />}
        tone="success"
        value={formatMoney(data.gmvLast30DaysCents, "USD", locale)}
        label={messages.dashboard.adminKpi.gmv}
      />
    </div>
  );
}
