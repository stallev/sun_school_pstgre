"use client";

import { SlidersHorizontalIcon } from "lucide-react";
import { AlertText, ContentText } from "@/components/atoms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { GroupPointsTableRowDto } from "@/data/achievements/load-group-points-page.server";
import {
  formatGlobalPoints,
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

  return (
    <tr className="border-b border-line">
      <td className="px-4 py-3 align-top">
        <ContentText className="font-medium">{row.achievementName}</ContentText>
      </td>
      <td className="px-4 py-3 align-top text-sm text-ink-2">{row.tierLabel}</td>
      <td className="px-4 py-3 align-top text-sm text-ink-2">{row.conditionLabel}</td>
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
                <Button type="button" variant="outline" size="compact" onClick={onReset}>
                  {messages.resetRow}
                </Button>
              ) : null}
            </div>
            {fieldError ? <AlertText>{fieldError}</AlertText> : null}
          </div>
        )}
      </td>
    </tr>
  );
};
