"use client";

import { ContentText } from "@/components/atoms/ContentText";
import { LessonTableFinishCheckButton } from "@/components/teacher/LessonTableFinishCheckButton";
import { TermLabel, nonEmptyTerm } from "@/components/ui/term-label";

type LessonTableFinishCheckProps = {
  label: string;
  pendingLabel: string;
  finishing: boolean;
  disabled: boolean;
  onFinish: () => void;
  note: string;
  hintTerm: string;
  hint: string;
  hintAriaLabel: string;
};

export const LessonTableFinishCheck = ({
  label,
  pendingLabel,
  finishing,
  disabled,
  onFinish,
  note,
  hintTerm,
  hint,
  hintAriaLabel,
}: LessonTableFinishCheckProps) => (
  <div className="flex min-w-0 flex-wrap items-center gap-chip">
    <LessonTableFinishCheckButton
      label={label}
      pendingLabel={pendingLabel}
      finishing={finishing}
      disabled={disabled}
      onFinish={onFinish}
    />
    <ContentText tone="muted">
      <TermLabel term={nonEmptyTerm(hintTerm)} hint={hint} ariaLabel={hintAriaLabel} /> {note}
    </ContentText>
  </div>
);
