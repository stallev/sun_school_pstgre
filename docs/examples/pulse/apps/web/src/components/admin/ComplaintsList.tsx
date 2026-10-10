import { CheckCircleIcon } from "lucide-react";

import { ComplaintQueueCard } from "@/components/admin/ComplaintQueueCard";
import { ComplaintRowActions } from "@/components/admin/ComplaintRowActions.client";
import { AdminQueueEmptyState } from "@/components/admin/AdminQueueEmptyState";
import type { ComplaintListItem } from "@/data/admin/list-complaints.server";
import { getMessages } from "@/lib/messages/server";


export type ComplaintsListProps = {
  items: ComplaintListItem[];
  emptyMessage: string;
};

export async function ComplaintsList({ items, emptyMessage }: ComplaintsListProps) {
  const messages = await getMessages();
  if (items.length === 0) {
    return (
      <AdminQueueEmptyState
        icon={CheckCircleIcon}
        variant="success"
        title={emptyMessage}
        description={messages.admin.complaints.emptyAllClearDescription}
        className="md:col-span-2"
      />
    );
  }

  return (
    <ul className="mt-6 grid grid-cols-1 items-stretch gap-2.5 md:grid-cols-2">
      {items.map((item) => (
        <li key={item.id} className="h-full min-w-0">
          <ComplaintQueueCard
            item={item}
            actions={<ComplaintRowActions item={item} />}
          />
        </li>
      ))}
    </ul>
  );
}
