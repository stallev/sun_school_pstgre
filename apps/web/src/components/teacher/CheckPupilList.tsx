"use client";

import { CheckIcon, CircleIcon } from "lucide-react";
import { LateBadge } from "@/components/teacher/LateBadge";
import { LessonLeaderMark } from "@/components/teacher/LessonLeaderMark";
import { pupilCheckListStatus } from "@/components/teacher/check-filled-count";
import { cn } from "@/lib/utils";

export type CheckPupilListItem = {
  pupilId: string;
  displayName: string;
  homeworkChecked: boolean;
  late: boolean;
  pointsTotal: number | null;
  verseScores: Record<string, number | null>;
  testScore: number | null;
  notebookScore: number | null;
};

type CheckPupilListProps = {
  pupils: CheckPupilListItem[];
  activePupilId: string;
  lateLabel: string;
  listLabel: string;
  statusChecked: string;
  statusUnchecked: string;
  statusPartial: string;
  /** Pupils with the lesson's best total (check flow spec §5.2в). */
  topScorerIds: ReadonlySet<string>;
  topScorerLabel: string;
  onSelect: (pupilId: string) => void;
};

export const CheckPupilList = ({
  pupils,
  activePupilId,
  lateLabel,
  listLabel,
  statusChecked,
  statusUnchecked,
  statusPartial,
  topScorerIds,
  topScorerLabel,
  onSelect,
}: CheckPupilListProps) => (
  <ul className="space-y-0.5" aria-label={listLabel}>
    {pupils.map((pupil) => {
      const active = pupil.pupilId === activePupilId;
      const leader = topScorerIds.has(pupil.pupilId);
      const status = pupilCheckListStatus(pupil);
      const statusLabel = status === "checked" ? statusChecked : status === "partial" ? statusPartial : statusUnchecked;
      return (
        <li key={pupil.pupilId}>
          <button
            type="button"
            onClick={() => onSelect(pupil.pupilId)}
            aria-current={active ? "true" : undefined}
            className={cn(
              "flex min-h-11 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[0.9375rem] transition-colors duration-100",
              leader
                ? cn(
                    "border-l-4 border-gold bg-gold-soft text-ink",
                    active ? "font-bold ring-2 ring-inset ring-cobalt-ink" : "hover:brightness-95",
                  )
                : active
                  ? "bg-cobalt-soft font-bold text-cobalt-ink"
                  : "hover:bg-paper",
            )}
          >
            <span className={pupil.homeworkChecked ? "text-ok" : "text-line-strong"} aria-hidden>
              {pupil.homeworkChecked ? <CheckIcon className="size-4" /> : <CircleIcon className="size-4" />}
            </span>
            <span className={cn("text-xs", leader ? "text-ink-2" : pupil.homeworkChecked ? "text-ok" : "text-muted")}>
              {statusLabel}
            </span>
            <span className="min-w-0 flex-1 truncate">{pupil.displayName}</span>
            {leader ? <LessonLeaderMark label={topScorerLabel} /> : null}
            {pupil.late ? <LateBadge label={lateLabel} plain={leader} /> : null}
            {pupil.homeworkChecked && pupil.pointsTotal !== null ? (
              <span className={cn("text-sm tabular-nums", leader ? "text-ink-2" : "text-muted")}>{pupil.pointsTotal}</span>
            ) : null}
          </button>
        </li>
      );
    })}
  </ul>
);
