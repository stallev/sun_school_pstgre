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
  /** Analytics screens (P11 §4.1) — enlarged card type; default keeps Lab density. */
  cardType?: "default" | "analytics";
  className?: string;
};

export const RecordCard = ({
  title,
  fields = [],
  actions,
  note,
  selected = false,
  cardType = "default",
  className,
}: RecordCardProps) => {
  const isAnalytics = cardType === "analytics";

  return (
    <li
      className={cn(
        "rounded-xl border border-line bg-card",
        isAnalytics ? "p-3" : "p-4",
        selected && "bg-paper",
        className,
      )}
    >
      <div
        className={cn(
          "min-w-0 font-medium text-ink",
          isAnalytics && "text-[1.25rem] leading-snug",
        )}
      >
        {title}
      </div>
      {note ? (
        <p
          className={cn(
            "text-muted-foreground",
            isAnalytics ? "mt-1 text-base" : "mt-2 text-sm",
          )}
        >
          {note}
        </p>
      ) : null}
      {fields.length > 0 ? (
        <dl
          className={cn(
            "grid grid-cols-2 gap-x-3 gap-y-2",
            isAnalytics
              ? "mt-2 text-[1.25rem] leading-snug"
              : "mt-3 text-sm",
          )}
        >
          {fields.map((field, index) => (
            <div key={`${field.label}-${index}`} className={cn("min-w-0", field.wide && "col-span-2")}>
              <dt className={cn("text-muted", isAnalytics && "text-base")}>{field.label}</dt>
              <dd className={cn("break-words text-ink", isAnalytics ? "mt-1" : "mt-0.5")}>
                {field.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      {actions ? (
        <div className={cn("flex flex-wrap gap-2", isAnalytics ? "mt-2" : "mt-3")}>{actions}</div>
      ) : null}
    </li>
  );
};
