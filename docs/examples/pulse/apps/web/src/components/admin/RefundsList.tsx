import { CheckCircleIcon } from "lucide-react";

import { AdminQueueEmptyState } from "@/components/admin/AdminQueueEmptyState";
import { RefundQueueCard } from "@/components/admin/RefundQueueCard";
import type { RefundListItem } from "@/data/admin/list-refunds.server";
import { getMessages } from "@/lib/messages/server";


export type RefundsListProps = {
  refunds: RefundListItem[];
};

export async function RefundsList({ refunds }: RefundsListProps) {
  const messages = await getMessages();
  if (refunds.length === 0) {
    return (
      <AdminQueueEmptyState
        icon={CheckCircleIcon}
        variant="success"
        title={messages.admin.refunds.empty}
        description={messages.dashboard.adminNeedsAttention.allClear}
        className="md:col-span-2"
      />
    );
  }

  return (
    <ul className="mt-6 grid grid-cols-1 items-stretch gap-2.5 md:grid-cols-2">
      {refunds.map((refund) => (
        <li key={refund.id} className="h-full min-w-0">
          <RefundQueueCard refund={refund} />
        </li>
      ))}
    </ul>
  );
}
