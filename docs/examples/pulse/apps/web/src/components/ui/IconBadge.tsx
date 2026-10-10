import { cn } from "@/lib/utils";

export type IconBadgeProps = React.ComponentProps<"span"> & {
  count: number;
  max?: number;
};

export function IconBadge({
  count,
  max = 99,
  className,
  ...props
}: IconBadgeProps) {
  const label = count > max ? `${max}+` : String(count);

  return (
    <span
      aria-label={`${count} notifications`}
      className={cn(
        "inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[11px] font-semibold leading-none text-destructive-foreground",
        className,
      )}
      {...props}
    >
      {label}
    </span>
  );
}
