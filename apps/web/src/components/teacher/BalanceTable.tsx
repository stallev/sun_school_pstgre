"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BricksLedgerPanel } from "@/components/teacher/BricksLedgerPanel";
import { StatusText } from "@/components/ui/status-text";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CompensateBricksDialog } from "@/components/teacher/CompensateBricksDialog";
import { IssueBricksDialog } from "@/components/teacher/IssueBricksDialog";
import { BalanceCards } from "@/components/teacher/BalanceCards";
import type { BricksBalanceRow } from "@/data/bricks/load-bricks-page.server";
import type { BrickLedgerEntryDto } from "@/data/bricks/bricks-shared.server";
import type { Dictionary } from "@/lib/messages/get-dictionary";
import type { TeacherBricksMessages } from "@/lib/messages/teacher-bricks-messages";
import { cn } from "@/lib/utils";

type BalanceTableProps = {
  gradeId: string;
  yearId: string;
  rows: readonly BricksBalanceRow[];
  selectedPupilId: string | null;
  ledger: readonly BrickLedgerEntryDto[];
  defaultDate: string;
  messages: TeacherBricksMessages;
  dictionaries: Record<string, Dictionary>;
  formError: string;
};

type DialogState = {
  kind: "issue" | "compensate";
  pupilId: string;
  requestId: string;
};

export const BalanceTable = ({
  gradeId,
  yearId,
  rows,
  selectedPupilId,
  ledger,
  defaultDate,
  messages,
  dictionaries,
  formError,
}: BalanceTableProps) => {
  const router = useRouter();
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const selectedRow = rows.find((row) => row.pupilId === selectedPupilId) ?? null;
  const dialogRow = dialog ? rows.find((row) => row.pupilId === dialog.pupilId) : null;

  const openDialog = (kind: DialogState["kind"], pupilId: string) => {
    setDialog({ kind, pupilId, requestId: crypto.randomUUID() });
  };

  const selectPupil = (pupilId: string) => {
    const params = new URLSearchParams({ gradeId, pupilId });
    router.push(`/bricks?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <BalanceCards
        rows={rows}
        selectedPupilId={selectedPupilId}
        messages={messages}
        onSelectPupil={selectPupil}
        onIssue={(pupilId) => openDialog("issue", pupilId)}
        onCompensate={(pupilId) => openDialog("compensate", pupilId)}
      />
      <div className="hidden overflow-hidden rounded-xl border border-line bg-surface lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">{messages.columnPupil}</TableHead>
              <TableHead scope="col" className="text-right">{messages.columnEarned}</TableHead>
              <TableHead scope="col" className="text-right">{messages.columnIssued}</TableHead>
              <TableHead scope="col" className="text-right">{messages.columnBalance}</TableHead>
              <TableHead scope="col">{messages.columnActions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const isSelected = row.pupilId === selectedPupilId;
              return (
                <TableRow
                  key={row.pupilId}
                  className={cn(
                    isSelected && "bg-cobalt-soft/40",
                    row.balance < 0 && "ring-1 ring-inset ring-danger/40",
                  )}
                >
                  <TableCell>
                    <button
                      type="button"
                      className="min-h-11 w-full text-left font-medium text-cobalt-ink underline-offset-2 hover:underline"
                      aria-current={isSelected ? "true" : undefined}
                      onClick={() => selectPupil(row.pupilId)}
                    >
                      {row.displayName}
                    </button>
                    {row.needsAttention ? (
                      <StatusText tone="warn" className="mt-1 block text-xs">
                        {messages.needsAttention}
                      </StatusText>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right font-bold tabular-nums">{row.earned}</TableCell>
                  <TableCell className="text-right font-bold tabular-nums">{row.issued}</TableCell>
                  <TableCell
                    className={cn("text-right font-bold tabular-nums", row.balance < 0 && "text-danger")}
                  >
                    {row.balance}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation();
                          openDialog("issue", row.pupilId);
                        }}
                      >
                        {messages.actionIssue}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={(event) => {
                          event.stopPropagation();
                          openDialog("compensate", row.pupilId);
                        }}
                      >
                        {messages.actionCompensate}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <BricksLedgerPanel
        pupilName={selectedRow?.displayName ?? null}
        ledger={ledger}
        messages={messages}
      />

      {dialogRow && dialog?.kind === "issue" ? (
        <IssueBricksDialog
          open
          onOpenChange={(open) => {
            if (!open) setDialog(null);
          }}
          pupilId={dialogRow.pupilId}
          pupilName={dialogRow.displayName}
          yearId={yearId}
          balance={dialogRow.balance}
          defaultDate={defaultDate}
          requestId={dialog.requestId}
          messages={messages}
          dictionaries={dictionaries}
          formError={formError}
        />
      ) : null}
      {dialogRow && dialog?.kind === "compensate" ? (
        <CompensateBricksDialog
          open
          onOpenChange={(open) => {
            if (!open) setDialog(null);
          }}
          pupilId={dialogRow.pupilId}
          pupilName={dialogRow.displayName}
          yearId={yearId}
          issued={dialogRow.issued}
          defaultDate={defaultDate}
          requestId={dialog.requestId}
          messages={messages}
          dictionaries={dictionaries}
          formError={formError}
        />
      ) : null}
    </div>
  );
};
