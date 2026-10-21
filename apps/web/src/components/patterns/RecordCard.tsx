import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type RecordField = {
  label: string;
  value: ReactNode;
  wide?: boolean;
};

type RecordCardProps = {
  title: ReactNode;
  fields?: readonly RecordField[];
  actions?: ReactNode;
  note?: ReactNode;
  selected?: boolean;
  className?: string;
};

export const RecordCard = ({
  title,
  fields = [],
  actions,
  note,
  selected = false,
  className,
}: RecordCardProps) => (
  <li
    className={cn(
      "rounded-xl border border-line bg-card p-4",
      selected && "bg-paper",
      className,
    )}
  >
    <div className="min-w-0 font-medium text-ink">{title}</div>
    {note ? <p className="mt-2 text-sm text-muted-foreground">{note}</p> : null}
    {fields.length > 0 ? (
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
        {fields.map((field, index) => (
          <div key={`${field.label}-${index}`} className={cn("min-w-0", field.wide && "col-span-2")}>
            <dt className="text-muted">{field.label}</dt>
            <dd className="mt-0.5 break-words text-ink">{field.value}</dd>
          </div>
        ))}
      </dl>
    ) : null}
    {actions ? <div className="mt-3 flex flex-wrap gap-2">{actions}</div> : null}
  </li>
);
