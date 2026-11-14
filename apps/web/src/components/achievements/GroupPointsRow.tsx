"use client";

import { Fragment, useId, useState } from "react";
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

type GroupPointsRowProps = {
  row: GroupPointsTableRowDto;
  draftValue: string;
  fieldError?: string;
  canEdit: boolean;
  differs: boolean;
  messages: GroupPointsMessages;
  onDraftChange: (value: string) => void;
  onReset: () => void;
};

export const GroupPointsRow = ({
  row,
  draftValue,
  fieldError,
  canEdit,
  differs,
  messages,
  onDraftChange,
  onReset,
}: GroupPointsRowProps) => {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const detailsId = useId();

  return (
    <Fragment>
      <tr className="border-b border-line">
        <td className="px-4 py-3 align-top">
          <ContentText className="font-medium">{row.achievementName}</ContentText>
          {!row.isActive ? <StatusText className="mt-1">{messages.inactiveBadge}</StatusText> : null}
          <button
            type="button"
            aria-expanded={detailsOpen}
            aria-controls={detailsId}
            onClick={() => setDetailsOpen((open) => !open)}
            className="mt-1 flex min-h-11 items-center gap-1 text-sm font-medium text-cobalt-ink"
          >
            <ChevronDownIcon className={detailsOpen ? "size-4 rotate-180" : "size-4"} aria-hidden />
            {detailsOpen ? messages.detailsHide : messages.detailsShow}
          </button>
        </td>
        <td className="px-4 py-3 align-top text-sm text-ink-2">{row.tierLabel}</td>
        <td className="px-4 py-3 align-top text-sm text-ink-2">
          {formatGroupPointsCondition(row, messages)}
        </td>
        <td className="px-4 py-3 align-top text-sm tabular-nums">{formatGlobalPoints(row)}</td>
        <td className="min-w-28 px-4 py-3 align-top">
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
        </td>
      </tr>
      {detailsOpen ? (
        <tr id={detailsId} className="border-b border-line bg-paper">
          <td colSpan={5} className="px-4 py-3">
            <ContentText tone="secondary">{row.description ?? messages.noDescription}</ContentText>
          </td>
        </tr>
      ) : null}
    </Fragment>
  );
};
