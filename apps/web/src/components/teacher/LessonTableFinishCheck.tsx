"use client";

import { ContentText } from "@/components/atoms/ContentText";
import { LessonTableFinishCheckButton } from "@/components/teacher/LessonTableFinishCheckButton";
import { TermHint } from "@/components/ui/term-hint";

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
  <div className="flex flex-wrap items-center gap-1">
    <LessonTableFinishCheckButton
      label={label}
      pendingLabel={pendingLabel}
      finishing={finishing}
      disabled={disabled}
      onFinish={onFinish}
    />
    <ContentText tone="muted">{note}</ContentText>
    <TermHint term={hintTerm} hint={hint} ariaLabel={hintAriaLabel} />
  </div>
);
