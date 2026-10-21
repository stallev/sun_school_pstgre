"use client";

import { cn } from "@/lib/utils";

type LessonCheckTableFiltersProps = {
  filterPresent: boolean;
  filterUnchecked: boolean;
  allLabel: string;
  presentLabel: string;
  uncheckedLabel: string;
  pending: boolean;
  onAll: () => void;
  onPresent: (value: boolean) => void;
  onUnchecked: (value: boolean) => void;
};

const chipClass = (pressed: boolean) =>
  cn(
    "inline-flex h-9 items-center rounded-full border px-3 text-sm",
    pressed
      ? "border-ink bg-ink font-medium text-surface"
      : "border-line bg-surface text-ink hover:bg-paper",
  );

export const LessonCheckTableFilters = ({
  filterPresent,
  filterUnchecked,
  allLabel,
  presentLabel,
  uncheckedLabel,
  pending,
  onAll,
  onPresent,
  onUnchecked,
}: LessonCheckTableFiltersProps) => {
  const allOn = !filterPresent && !filterUnchecked;
  return (
    <div
      className="sticky top-0 z-20 -mx-1 bg-background px-1 pb-2 pt-1"
      aria-busy={pending}
    >
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button type="button" aria-pressed={allOn} className={chipClass(allOn)} onClick={onAll}>
          {allLabel}
        </button>
        <button
          type="button"
          aria-pressed={filterUnchecked}
          className={chipClass(filterUnchecked)}
          onClick={() => onUnchecked(!filterUnchecked)}
        >
          {uncheckedLabel}
        </button>
        <button
          type="button"
          aria-pressed={filterPresent}
          className={chipClass(filterPresent)}
          onClick={() => onPresent(!filterPresent)}
        >
          {presentLabel}
        </button>
      </div>
    </div>
  );
};
