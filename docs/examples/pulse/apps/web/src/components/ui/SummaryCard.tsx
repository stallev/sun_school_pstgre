import { Heading } from "@/components/atoms";
import { PulseCard } from "@/components/ui/card";
import { KeyValueRow } from "@/components/ui/KeyValueRow";
import { cn } from "@/lib/utils";

export type SummaryCardRow = {
  label: React.ReactNode;
  value: React.ReactNode;
};

export type SummaryCardProps = {
  title?: React.ReactNode;
  header?: React.ReactNode;
  rows: SummaryCardRow[];
  footer?: React.ReactNode;
  totals?: SummaryCardRow[];
  className?: string;
};

export function SummaryCard({
  title = "Summary",
  header,
  rows,
  footer,
  totals,
  className,
}: SummaryCardProps) {
  return (
    <PulseCard variant="elevated" className={cn("sticky top-32 space-y-4 p-5", className)}>
      <Heading as="h3" visualLevel="h3">
        {title}
      </Heading>
      {header ? (
        <div className="border-b border-border/60 pb-3">{header}</div>
      ) : null}
      <div className="space-y-2.5">
        {rows.map((row, index) => (
          <KeyValueRow key={index} label={row.label} value={row.value} />
        ))}
      </div>
      {totals?.length ? (
        <div className="space-y-1.5 border-t border-border/60 pt-3">
          {totals.map((row, index) => (
            <KeyValueRow key={index} label={row.label} value={row.value} />
          ))}
        </div>
      ) : null}
      {footer ? (
        <div className="border-t border-border/60 pt-2">{footer}</div>
      ) : null}
    </PulseCard>
  );
}
