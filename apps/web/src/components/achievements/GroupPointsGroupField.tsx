"use client";

import { SlidersHorizontalIcon } from "lucide-react";
import { AlertText, ContentText } from "@/components/atoms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { GroupPointsTableRowDto } from "@/data/achievements/load-group-points-page.server";
import { formatGroupPointsDisplay } from "@/lib/achievements/group-points-display";
import type { GroupPointsMessages } from "@/lib/messages/group-points-messages";

type GroupPointsGroupFieldProps = {
  row: GroupPointsTableRowDto;
  draftValue: string;
  fieldError?: string;
  canEdit: boolean;
  differs: boolean;
  messages: GroupPointsMessages;
  onDraftChange: (value: string) => void;
  onReset: () => void;
};

export const GroupPointsGroupField = ({
  row,
  draftValue,
  fieldError,
  canEdit,
  differs,
  messages,
  onDraftChange,
  onReset,
}: GroupPointsGroupFieldProps) => {
  if (row.readOnly || !canEdit) {
    return (
      <ContentText tone="secondary" className="text-sm">
        {row.readOnly ? messages.practiceReadOnly : formatGroupPointsDisplay(row)}
      </ContentText>
    );
  }

  return (
    <div className="flex flex-col gap-chip">
      <div className="flex flex-wrap items-center gap-chip">
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
          className="w-28 min-w-28"
        />
        {differs ? (
          <span className="inline-flex items-center gap-hint text-sm font-medium text-cobalt-ink">
            <SlidersHorizontalIcon className="size-4" aria-hidden />
            {messages.differsLabel}
          </span>
        ) : null}
        {differs ? (
          <Button type="button" variant="outline" onClick={onReset}>
            {messages.resetRow}
          </Button>
        ) : null}
      </div>
      {fieldError ? <AlertText>{fieldError}</AlertText> : null}
    </div>
  );
};
