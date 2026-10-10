"use client";

import * as React from "react";
import type { DropdownOption, DropdownProps } from "react-day-picker";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const YEARS_PER_PAGE = 12;

const EMPTY_OPTIONS: DropdownOption[] = [];

function isMonthOptions(options: DropdownOption[] | undefined): boolean {
  if (!options?.length) return false;
  if (options.length > 12) return false;
  return options.every((option) => option.value >= 0 && option.value <= 11);
}

function emitSelectChange(
  onChange: DropdownProps["onChange"],
  numValue: number,
) {
  if (!onChange) return;
  const value = String(numValue);
  onChange({
    target: { value },
    currentTarget: { value },
  } as React.ChangeEvent<HTMLSelectElement>);
}

export function CalendarCaptionGridDropdown(props: DropdownProps) {
  const {
    options,
    value,
    onChange,
    className,
    disabled,
    id,
    name,
    "aria-label": ariaLabel,
  } = props;

  const [open, setOpen] = React.useState(false);
  const monthMode = isMonthOptions(options);
  const list = React.useMemo(() => options ?? EMPTY_OPTIONS, [options]);

  const selected = list.find((option) => option.value === value);
  const label = selected?.label ?? (value !== undefined ? String(value) : "");

  const pageCount = Math.max(1, Math.ceil(list.length / YEARS_PER_PAGE));
  const [yearPage, setYearPage] = React.useState(0);

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      setOpen(next);
      if (next && !monthMode && list.length) {
        const idx = list.findIndex((option) => option.value === value);
        if (idx >= 0) setYearPage(Math.floor(idx / YEARS_PER_PAGE));
      }
    },
    [list, monthMode, value],
  );

  const pageStart = yearPage * YEARS_PER_PAGE;
  const pageOptions = monthMode ? list : list.slice(pageStart, pageStart + YEARS_PER_PAGE);
  const rangeLabel =
    !monthMode && pageOptions.length
      ? `${pageOptions[0].value}–${pageOptions[pageOptions.length - 1].value}`
      : null;

  return (
    <div className={cn("relative inline-flex", className)}>
      <Popover open={open} onOpenChange={handleOpenChange} modal={false}>
        <PopoverTrigger
          type="button"
          id={id}
          name={name}
          disabled={disabled}
          aria-label={ariaLabel}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "h-(--cell-size) min-h-8 gap-1 rounded-(--cell-radius) px-2 text-sm font-medium has-[svg]:pr-1.5",
            "[&>svg]:size-3.5 [&>svg]:text-muted-foreground",
          )}
        >
          <span className="truncate">{label}</span>
          <ChevronDownIcon className="shrink-0" />
        </PopoverTrigger>
        <PopoverContent
          align="center"
          side="bottom"
          sideOffset={4}
          className="w-auto min-w-[11rem] gap-2 p-2"
        >
          {!monthMode ? (
            <div className="flex items-center justify-between gap-1 border-b border-border pb-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0"
                disabled={disabled || yearPage <= 0}
                onClick={() => setYearPage((page) => Math.max(0, page - 1))}
                aria-label="Previous years"
              >
                <ChevronLeftIcon className="size-4" />
              </Button>
              <span className="truncate text-center text-xs tabular-nums text-muted-foreground">
                {rangeLabel}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0"
                disabled={disabled || yearPage >= pageCount - 1}
                onClick={() =>
                  setYearPage((page) => Math.min(pageCount - 1, page + 1))
                }
                aria-label="Next years"
              >
                <ChevronRightIcon className="size-4" />
              </Button>
            </div>
          ) : null}
          <div className="grid grid-cols-3 gap-1">
            {pageOptions.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled || option.disabled}
                className={cn(
                  "h-9 min-w-0 px-1.5 text-xs font-normal",
                  option.value === value &&
                    "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                )}
                onClick={() => {
                  emitSelectChange(onChange, option.value);
                  setOpen(false);
                }}
              >
                <span className="truncate">{option.label}</span>
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
