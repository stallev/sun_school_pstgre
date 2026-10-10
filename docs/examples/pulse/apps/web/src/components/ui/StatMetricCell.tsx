import { ContentText } from "@/components/atoms";
import { cn } from "@/lib/utils";

export type StatMetricCellProps = {
  value: React.ReactNode;
  label: React.ReactNode;
  className?: string;
};

export function StatMetricCell({ value, label, className }: StatMetricCellProps) {
  return (
    <div
      className={cn(
        "border-r border-[hsl(var(--color-on-brand-band)/0.12)] px-5 py-9 text-center last:border-r-0",
        className,
      )}
    >
      <ContentText
        as="p"
        variant="statValue"
        className="mb-1.5 block font-heading text-[46px] leading-none tracking-tight text-on-brand-band"
      >
        {value}
      </ContentText>
      <ContentText as="p" variant="small" className="text-[13px] text-brand-band-muted">
        {label}
      </ContentText>
    </div>
  );
}
