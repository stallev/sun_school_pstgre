"use client";

import { ChevronLeftIcon } from "lucide-react";

import { ContentText } from "@/components/atoms";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export type WizardHeaderProps = {
  step: number;
  totalSteps: number;
  stepLabel: string;
  stepCaption?: React.ReactNode;
  backAriaLabel?: string;
  totalLabel?: React.ReactNode;
  onBack?: () => void;
  className?: string;
};

export function WizardHeader({
  step,
  totalSteps,
  stepLabel,
  stepCaption,
  backAriaLabel = "Go back",
  totalLabel,
  onBack,
  className,
}: WizardHeaderProps) {
  const progress = Math.round((step / totalSteps) * 100);
  const caption =
    stepCaption ?? (
      <>
        Step {step} of {totalSteps}
      </>
    );

  return (
    <div className={cn("border-b border-border bg-background/95 backdrop-blur-md", className)}>
      <div className="flex h-12 items-center gap-2 px-3 md:h-14 md:px-4">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={backAriaLabel}
          onClick={onBack}
        >
          <ChevronLeftIcon aria-hidden className="size-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <ContentText variant="mutedMicro" as="p" className="font-mono uppercase">
            {caption}
          </ContentText>
          <ContentText variant="smallEmphasis" as="p">
            {stepLabel}
          </ContentText>
        </div>
        {totalLabel ? (
          <ContentText variant="statValue" as="p" className="text-base md:text-lg">
            {totalLabel}
          </ContentText>
        ) : null}
      </div>
      <Progress value={progress} className="h-1 rounded-none" aria-hidden />
    </div>
  );
}
