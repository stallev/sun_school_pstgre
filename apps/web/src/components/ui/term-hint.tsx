"use client";

import { Popover } from "@base-ui/react/popover";
import { CircleHelp } from "lucide-react";
import { useId, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const touchHitPadding =
  "relative after:absolute after:-inset-2";

/** D-08: a dictionary template that still holds «{term}» never reaches aria-label. */
export const resolveTermAriaLabel = (ariaLabel: string, term: string): string =>
  ariaLabel.includes("{term}") ? ariaLabel.split("{term}").join(term) : ariaLabel;

const POPUP_EDGE_THRESHOLD_PX = 160;

let activeDismiss: (() => void) | null = null;

const dismissOtherHints = (except: (() => void) | null) => {
  if (activeDismiss && activeDismiss !== except) activeDismiss();
};

export type TermHintSide = "top" | "bottom";

type TermHintProps = {
  term: string;
  hint: string;
  ariaLabel: string;
  className?: string;
  side?: TermHintSide;
};

/** UX-03 D-17 · ADR-018: «?» popover beside a domain term. */
export const TermHint = ({
  term,
  hint,
  ariaLabel,
  className,
  side = "bottom",
}: TermHintProps) => {
  const popupId = useId();
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [align, setAlign] = useState<"start" | "end">("start");

  const close = () => setOpen(false);

  const handleOpenChange = (next: boolean) => {
    if (next) {
      dismissOtherHints(close);
      activeDismiss = close;
    } else if (activeDismiss === close) {
      activeDismiss = null;
    }
    setOpen(next);
  };

  useLayoutEffect(() => {
    if (!open) return;
    const anchor = anchorRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const spaceRight = window.innerWidth - rect.right;
    setAlign(spaceRight < POPUP_EDGE_THRESHOLD_PX ? "end" : "start");
  }, [open]);

  return (
    <span ref={anchorRef} className="relative inline-flex h-[1em] align-middle">
      <Popover.Root open={open} onOpenChange={handleOpenChange}>
        <Popover.Trigger
          nativeButton
          type="button"
          aria-label={resolveTermAriaLabel(ariaLabel, term)}
          aria-expanded={open}
          aria-controls={open ? popupId : undefined}
          className={cn(
            "inline-flex size-[1em] shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 ease-out-soft hover:text-cobalt-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none",
            touchHitPadding,
            className,
          )}
        >
          <CircleHelp className="size-4" aria-hidden />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner
            side={side}
            align={align}
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
    </span>
  );
};
