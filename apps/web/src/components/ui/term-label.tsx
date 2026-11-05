"use client";

import { Popover } from "@base-ui/react/popover";
import { useId, useState } from "react";
import { type NonEmptyTerm } from "@/components/ui/non-empty-term";
import { TermHint, type TermHintSide } from "@/components/ui/term-hint";
import { cn } from "@/lib/utils";

export { nonEmptyTerm, type NonEmptyTerm } from "@/components/ui/non-empty-term";

type TermLabelBaseProps = {
  term: NonEmptyTerm;
  hint: string;
  ariaLabel: string;
  className?: string;
  popoverSide?: TermHintSide;
};

type TermLabelDefaultProps = TermLabelBaseProps & {
  variant?: "default";
};

type TermLabelReasonProps = TermLabelBaseProps & {
  variant: "reason";
};

export type TermLabelProps = TermLabelDefaultProps | TermLabelReasonProps;

const renderTermLabelDefault = ({
  term,
  hint,
  ariaLabel,
  className,
  popoverSide = "bottom",
}: TermLabelDefaultProps) => (
  <span className={cn("inline-flex flex-wrap items-center gap-1", className)}>
    <span>{term}</span>
    <TermHint term={term} hint={hint} ariaLabel={ariaLabel} side={popoverSide} />
  </span>
);

const TermLabelReason = ({ term, hint, ariaLabel, className }: TermLabelReasonProps) => {
  const popupId = useId();
  const [open, setOpen] = useState(false);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        nativeButton
        type="button"
        aria-disabled="true"
        aria-describedby={open ? popupId : undefined}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={open ? popupId : undefined}
        className={cn(
          "inline-flex cursor-default items-center gap-1 rounded-md text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          className,
        )}
      >
        {term}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          side="bottom"
          align="start"
          sideOffset={8}
          collisionAvoidance={{ side: "flip", align: "shift" }}
        >
          <Popover.Popup
            id={popupId}
            role="note"
            className="z-50 w-[min(20rem,calc(100vw-2rem))] rounded-lg border border-line bg-surface p-3 text-left text-base font-normal normal-case text-ink shadow-float outline-none motion-reduce:transition-none"
          >
            {hint}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
};

/** UX-03 D-17 · ADR-020: visible term + «?» popover (or reason on inactive control). */
export const TermLabel = (props: TermLabelProps) =>
  props.variant === "reason" ? <TermLabelReason {...props} /> : renderTermLabelDefault(props);
