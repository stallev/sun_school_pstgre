"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type CheckBottomBarProps = {
  previousLabel: string;
  primaryLabel: string;
  nextLabel: string;
  showNext: boolean;
  pending: boolean;
  canPrevious: boolean;
  onPrevious: () => void;
  onPrimary: () => void;
  onNext: () => void;
  keyboardHint?: string;
  saveStatusLabel?: string;
  variant: "inline" | "fixed";
};

export const CheckBottomBar = ({
  previousLabel,
  primaryLabel,
  nextLabel,
  showNext,
  pending,
  canPrevious,
  onPrevious,
  onPrimary,
  onNext,
  keyboardHint,
  saveStatusLabel,
  variant,
}: CheckBottomBarProps) => {
  const barClass =
    variant === "fixed"
      ? "fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/90 px-4 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] backdrop-blur-md reduce-transparency:bg-surface lg:hidden"
      : "hidden items-center justify-between gap-2 border-t border-line py-3 lg:flex";

  return (
    <div className={barClass}>
      {variant === "fixed" ? (
        <>
          {saveStatusLabel ? (
            <p className="mb-1.5 text-center text-sm tabular-nums text-ink-2">{saveStatusLabel}</p>
          ) : null}
          <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon-touch"
            className="shrink-0 px-0"
            disabled={!canPrevious || pending}
            aria-label={previousLabel}
            onClick={onPrevious}
          >
            <ChevronLeftIcon className="size-4" aria-hidden />
          </Button>
          <Button
            type="button"
            size="touch"
            className="min-w-0 flex-1"
            disabled={pending}
            aria-busy={pending}
            onClick={onPrimary}
          >
            {primaryLabel}
          </Button>
          {showNext ? (
            <Button
              type="button"
              variant="outline"
              size="icon-touch"
              className="shrink-0 px-0"
              disabled={pending}
              aria-label={nextLabel}
              onClick={onNext}
            >
              <ChevronRightIcon className="size-4" aria-hidden />
            </Button>
          ) : null}
        </div>
        </>
      ) : (
        <>
          <Button type="button" variant="ghost" disabled={!canPrevious || pending} onClick={onPrevious}>
            <ChevronLeftIcon className="size-4" aria-hidden />
            {previousLabel}
          </Button>
          {keyboardHint ? (
            <span className="hidden text-sm text-muted xl:inline">{keyboardHint}</span>
          ) : null}
          <div className="flex items-center gap-3">
            {saveStatusLabel ? (
              <span className="text-sm tabular-nums text-ink-2">{saveStatusLabel}</span>
            ) : null}
            <Button type="button" disabled={pending} aria-busy={pending} onClick={onPrimary}>
              {primaryLabel}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
