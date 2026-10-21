"use client";

import { CheckIcon, CircleIcon } from "lucide-react";
import { LateBadge } from "@/components/teacher/LateBadge";
import { pupilCheckListStatus } from "@/components/teacher/check-filled-count";

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
  onSelect,
}: CheckPupilListProps) => (
  <ul className="space-y-0.5" aria-label={listLabel}>
    {pupils.map((pupil) => {
      const active = pupil.pupilId === activePupilId;
      const status = pupilCheckListStatus(pupil);
      const statusLabel = status === "checked" ? statusChecked : status === "partial" ? statusPartial : statusUnchecked;
      return (
        <li key={pupil.pupilId}>
          <button
            type="button"
            onClick={() => onSelect(pupil.pupilId)}
            aria-current={active ? "true" : undefined}
            className={`flex min-h-11 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[0.9375rem] transition-colors duration-100 ${
              active ? "bg-cobalt-soft font-bold text-cobalt-ink" : "hover:bg-paper"
            }`}
          >
            <span className={pupil.homeworkChecked ? "text-ok" : "text-line-strong"} aria-hidden>
              {pupil.homeworkChecked ? <CheckIcon className="size-4" /> : <CircleIcon className="size-4" />}
            </span>
            <span className={`text-xs ${pupil.homeworkChecked ? "text-ok" : "text-muted"}`}>{statusLabel}</span>
            <span className="min-w-0 flex-1 truncate">{pupil.displayName}</span>
            {pupil.late ? <LateBadge label={lateLabel} /> : null}
            {pupil.homeworkChecked && pupil.pointsTotal !== null ? (
              <span className="text-sm tabular-nums text-muted">{pupil.pointsTotal}</span>
            ) : null}
          </button>
        </li>
      );
    })}
  </ul>
);
