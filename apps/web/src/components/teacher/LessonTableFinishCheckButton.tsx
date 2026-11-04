"use client";

import { CircleCheckIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";

type LessonTableFinishCheckButtonProps = {
  label: string;
  pendingLabel: string;
  finishing: boolean;
  disabled: boolean;
  onFinish: () => void;
};

export const LessonTableFinishCheckButton = ({
  label,
  pendingLabel,
  finishing,
  disabled,
  onFinish,
}: LessonTableFinishCheckButtonProps) => (
  <Button type="button" disabled={disabled || finishing} aria-busy={finishing} onClick={onFinish}>
    {finishing ? (
      <Loader2Icon className="size-4 animate-spin" aria-hidden />
    ) : (
      <CircleCheckIcon className="size-4" aria-hidden />
    )}
    {finishing ? pendingLabel : label}
  </Button>
);
