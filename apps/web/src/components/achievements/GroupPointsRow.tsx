"use client";

import { Fragment, useId, useState } from "react";
import { ChevronDownIcon, SlidersHorizontalIcon } from "lucide-react";
import { AlertText, ContentText } from "@/components/atoms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusText } from "@/components/ui/status-text";
import type { GroupPointsTableRowDto } from "@/data/achievements/load-group-points-page.server";
import {
  formatGlobalPoints,
  formatGroupPointsCondition,
  formatGroupPointsDisplay,
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

const readOnlyGroupLabel = (
  row: GroupPointsTableRowDto,
  messages: GroupPointsMessages,
): string => {
  if (row.readOnly) return messages.practiceReadOnly;
  return formatGroupPointsDisplay(row);
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
  const readOnly = row.readOnly || !canEdit;
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
          <ChevronDownIcon
            className={detailsOpen ? "size-4 rotate-180" : "size-4"}
            aria-hidden
          />
          {detailsOpen ? messages.detailsHide : messages.detailsShow}
        </button>
      </td>
      <td className="px-4 py-3 align-top text-sm text-ink-2">{row.tierLabel}</td>
      <td className="px-4 py-3 align-top text-sm text-ink-2">
        {formatGroupPointsCondition(row, messages)}
      </td>
      <td className="px-4 py-3 align-top text-sm tabular-nums">{formatGlobalPoints(row)}</td>
      <td className="px-4 py-3 align-top">
        {readOnly ? (
          <ContentText tone="secondary" className="text-sm">
            {readOnlyGroupLabel(row, messages)}
          </ContentText>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {row.isPenalty ? (
                <span className="text-sm font-medium tabular-nums text-penalty" aria-hidden>
                  −
                </span>
              ) : null}
              <Input
                type="text"
                inputMode="numeric"
                value={draftValue}
                onChange={(event) => onDraftChange(event.target.value)}
                placeholder={messages.placeholderInherit}
                aria-invalid={fieldError ? true : undefined}
                className="h-10 max-w-[8rem]"
                disabled={!canEdit}
              />
              {differs ? (
                <span className="inline-flex items-center gap-1 text-sm font-medium text-cobalt-ink">
                  <SlidersHorizontalIcon className="size-4" aria-hidden />
                  {messages.differsLabel}
                </span>
              ) : null}
              {differs && canEdit ? (
                <Button type="button" variant="outline" onClick={onReset}>
                  {messages.resetRow}
                </Button>
              ) : null}
            </div>
            {fieldError ? <AlertText>{fieldError}</AlertText> : null}
          </div>
        )}
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
