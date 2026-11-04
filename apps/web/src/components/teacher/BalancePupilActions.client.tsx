"use client";

import { Button } from "@/components/ui/button";
import { RowActionsMenu, RowActionsMenuItem } from "@/components/ui/row-actions-menu";
import type { TeacherBricksMessages } from "@/lib/messages/teacher-bricks-messages";

type BalancePupilActionsProps = {
  messages: TeacherBricksMessages;
  onIssue: () => void;
  onCompensate: () => void;
};

export const BalancePupilActions = ({
  messages,
  onIssue,
  onCompensate,
}: BalancePupilActionsProps) => (
  <div className="flex flex-wrap items-center gap-2">
    <Button type="button" onClick={onIssue}>
      {messages.actionIssue}
    </Button>
    <RowActionsMenu triggerLabel={messages.rowActionsMenuLabel}>
      <RowActionsMenuItem onClick={onCompensate}>{messages.actionCompensate}</RowActionsMenuItem>
    </RowActionsMenu>
  </div>
);
