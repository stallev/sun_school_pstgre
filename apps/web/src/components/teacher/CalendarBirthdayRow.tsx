import { Cake } from "lucide-react";
import { cn } from "@/lib/utils";

type CalendarBirthdayRowProps = {
  label: string;
  compact?: boolean;
};

export const CalendarBirthdayRow = ({ label, compact = false }: CalendarBirthdayRowProps) => (
  <span className="mt-0.5 flex min-w-0 items-center gap-1 text-amber-ink">
    <Cake className="size-4 shrink-0" aria-hidden />
    <span className={cn("text-sm", compact && "hidden truncate sm:inline")}>{label}</span>
  </span>
);
