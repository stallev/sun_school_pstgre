"use client";

import { useId, useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import { ContentText } from "@/components/atoms";
import { GroupPointsGroupField } from "@/components/achievements/GroupPointsGroupField";
import { StatusText } from "@/components/ui/status-text";
import type { GroupPointsTableRowDto } from "@/data/achievements/load-group-points-page.server";
import {
  formatGlobalPoints,
  formatGroupPointsCondition,
} from "@/lib/achievements/group-points-display";
import type { GroupPointsMessages } from "@/lib/messages/group-points-messages";

type GroupPointsCardProps = {
  row: GroupPointsTableRowDto;
  draftValue: string;
  fieldError?: string;
  canEdit: boolean;
  differs: boolean;
  messages: GroupPointsMessages;
  onDraftChange: (value: string) => void;
  onReset: () => void;
};

export const GroupPointsCard = ({
  row,
  draftValue,
  fieldError,
  canEdit,
  differs,
  messages,
  onDraftChange,
  onReset,
}: GroupPointsCardProps) => {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const detailsId = useId();

  return (
    <li className="flex flex-col gap-stack p-card">
      <div>
        <ContentText className="font-medium">{row.achievementName}</ContentText>
        {!row.isActive ? <StatusText className="mt-1">{messages.inactiveBadge}</StatusText> : null}
        <p className="mt-1 text-sm text-ink-2">
          {row.tierLabel} · {formatGroupPointsCondition(row, messages)}
        </p>
      </div>
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-card gap-y-chip text-sm">
        <dt className="text-ink-2">{messages.columnGlobal}</dt>
        <dd className="tabular-nums">{formatGlobalPoints(row)}</dd>
        <dt className="text-ink-2">{messages.columnGroup}</dt>
        <dd>
          <GroupPointsGroupField
            row={row}
            draftValue={draftValue}
            fieldError={fieldError}
            canEdit={canEdit}
            differs={differs}
            messages={messages}
            onDraftChange={onDraftChange}
            onReset={onReset}
          />
        </dd>
      </dl>
      <button
        type="button"
        aria-expanded={detailsOpen}
        aria-controls={detailsId}
        onClick={() => setDetailsOpen((open) => !open)}
        className="flex min-h-11 items-center gap-hint self-start text-sm font-medium text-cobalt-ink"
      >
        <ChevronDownIcon className={detailsOpen ? "size-4 rotate-180" : "size-4"} aria-hidden />
        {detailsOpen ? messages.detailsHide : messages.detailsShow}
      </button>
      {detailsOpen ? (
        <div id={detailsId} className="bg-paper p-stack">
          <ContentText tone="secondary">{row.description ?? messages.noDescription}</ContentText>
        </div>
      ) : null}
    </li>
  );
};
