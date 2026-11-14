import { Cake } from "lucide-react";
import { cn } from "@/lib/utils";

type CalendarBirthdayRowProps = {
  label: string;
  compact?: boolean;
};

export const CalendarBirthdayRow = ({ label, compact = false }: CalendarBirthdayRowProps) => (
  <span className="flex min-w-0 items-center gap-label text-amber-ink">
    <Cake className="size-4 shrink-0" aria-hidden />
    <span className={cn("text-sm", compact && "hidden truncate sm:inline")}>{label}</span>
  </span>
);
