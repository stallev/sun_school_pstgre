import { cn } from "@/lib/utils";

export const segmentedChipClassName = (
  checked: boolean,
  options?: { size?: "default" | "compact"; invalid?: boolean },
): string => {
  const size = options?.size ?? "default";
  const invalid = options?.invalid ?? false;
  return cn(
    "inline-flex min-h-11 min-w-11 h-10 items-center justify-center rounded-lg border px-3 text-base font-medium no-underline transition-[background-color,border-color,color,transform] duration-100 ease-out-soft active:scale-[0.97] hover:no-underline disabled:pointer-events-none disabled:opacity-45 motion-reduce:transition-none motion-reduce:active:scale-100",
    size === "compact" && "h-9",
    checked
      ? "border-cobalt-ink bg-cobalt-soft font-bold text-cobalt-ink hover:bg-cobalt-soft"
      : invalid
        ? "border-danger"
        : "border-muted bg-surface text-ink hover:border-ink-2",
  );
};
