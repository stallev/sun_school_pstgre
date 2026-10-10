import { ClockIcon, DollarSignIcon } from "lucide-react";

import { PulseCardKpi } from "@/components/ui/PulseCardKpi";
import type { AdminRefundsKpi } from "@/data/admin/list-refunds.server";
import { formatMoney } from "@/lib/format-money";
import { getLocale, getMessages } from "@/lib/messages/server";


export type AdminRefundsKpiGridProps = {
  kpi: AdminRefundsKpi;
};

export async function AdminRefundsKpiGrid({ kpi }: AdminRefundsKpiGridProps) {
  const [messages, locale] = await Promise.all([getMessages(), getLocale()]);
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-2">
      <PulseCardKpi
        icon={<ClockIcon className="size-4" aria-hidden />}
        tone="primary"
        value={kpi.pendingCount}
        label={messages.admin.refunds.kpi.inProgress}
      />
      <PulseCardKpi
        icon={<DollarSignIcon className="size-4" aria-hidden />}
        tone="secondary"
        value={formatMoney(kpi.pendingTotalCents, "USD", locale)}
        label={messages.admin.refunds.kpi.pendingAmount}
      />
    </div>
  );
}
