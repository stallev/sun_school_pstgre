"use client";

import { GroupPointsRow } from "@/components/achievements/GroupPointsRow";
import type { GroupPointsTableRowDto } from "@/data/achievements/load-group-points-page.server";
import type { GroupPointsMessages } from "@/lib/messages/group-points-messages";
import { rowDiffers } from "@/lib/achievements/group-points-drafts";

type GroupPointsTableGridProps = {
  rows: GroupPointsTableRowDto[];
  drafts: Record<string, string>;
  fieldErrors: Record<string, string>;
  canEdit: boolean;
  messages: GroupPointsMessages;
  onDraftChange: (rowKey: string, value: string) => void;
  onReset: (rowKey: string) => void;
};

export const GroupPointsTableGrid = ({
  rows,
  drafts,
  fieldErrors,
  canEdit,
  messages,
  onDraftChange,
  onReset,
}: GroupPointsTableGridProps) => (
  <div className="overflow-x-auto rounded-xl border border-line bg-card">
    <table className="w-full min-w-[640px] border-collapse text-left">
      <caption className="sr-only">{messages.tableCaption}</caption>
      <thead>
        <tr className="border-b border-line bg-paper text-sm font-medium text-ink-2">
          <th scope="col" className="px-4 py-3">{messages.columnAchievement}</th>
          <th scope="col" className="px-4 py-3">{messages.columnTier}</th>
          <th scope="col" className="px-4 py-3">{messages.columnCondition}</th>
          <th scope="col" className="px-4 py-3">{messages.columnGlobal}</th>
          <th scope="col" className="px-4 py-3">{messages.columnGroup}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <GroupPointsRow
            key={row.rowKey}
            row={row}
            draftValue={drafts[row.rowKey] ?? ""}
            fieldError={fieldErrors[row.rowKey]}
            canEdit={canEdit}
            differs={rowDiffers(row, drafts[row.rowKey] ?? "")}
            messages={messages}
            onDraftChange={(value) => onDraftChange(row.rowKey, value)}
            onReset={() => onReset(row.rowKey)}
          />
        ))}
      </tbody>
    </table>
  </div>
);
