import { CheckCircleIcon, ShieldIcon } from "lucide-react";
import { TRAINER_STATUS, type TrainerStatus } from "@pulse/domain";

import { ModerationQueueRow } from "@/components/admin/ModerationQueueRow";
import { Button } from "@/components/ui/button";
import { CustomLink } from "@/components/ui/CustomLink";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { TrainerApplicationListItem } from "@/data/admin/list-trainer-applications.server";
import { getMessages } from "@/lib/messages/server";


import type { Messages } from "@/lib/messages/types";

export type TrainerApplicationsListProps = {
  items: TrainerApplicationListItem[];
  emptyMessage: string;
  status: TrainerStatus;
};

function TrainerApplicationsEmptyState({
  emptyMessage,
  status,
  messages,
}: Pick<TrainerApplicationsListProps, "emptyMessage" | "status"> & {
  messages: Messages;
}) {
  const isPending = status === TRAINER_STATUS.PENDING;

  return (
    <Empty className="mt-6 border-border bg-card md:col-span-2 xl:col-span-3">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          {isPending ? (
            <CheckCircleIcon aria-hidden />
          ) : (
            <ShieldIcon aria-hidden />
          )}
        </EmptyMedia>
        <EmptyTitle>{emptyMessage}</EmptyTitle>
        {isPending ? (
          <EmptyDescription>
            {messages.dashboard.adminNeedsAttention.allClear}
          </EmptyDescription>
        ) : null}
      </EmptyHeader>
      {!isPending ? (
        <EmptyContent>
          <Button asChild variant="outline">
            <CustomLink href="/admin/trainers">
              {messages.admin.moderation.viewPendingQueue}
            </CustomLink>
          </Button>
        </EmptyContent>
      ) : null}
    </Empty>
  );
}

export async function TrainerApplicationsList({  items,
  emptyMessage,
  status,
}: TrainerApplicationsListProps) {
  const messages = await getMessages();

  if (items.length === 0) {
    return (
      <TrainerApplicationsEmptyState
        emptyMessage={emptyMessage}
        status={status}
        messages={messages}
      />
    );
  }

  return (
    <ul className="mt-6 grid grid-cols-1 items-stretch gap-2.5 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <li key={item.id} className="h-full min-w-0">
          <ModerationQueueRow
            item={item}
            href={`/admin/trainers/${item.id}`}
          />
        </li>
      ))}
    </ul>
  );
}
