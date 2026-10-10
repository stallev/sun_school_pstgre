import { ContentText } from "@/components/atoms";
import { cn } from "@/lib/utils";

export type DarkStatTileProps = {
  value: React.ReactNode;
  label: React.ReactNode;
  className?: string;
};

export function DarkStatTile({ value, label, className }: DarkStatTileProps) {
  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-[18px] border border-[hsl(var(--color-on-brand-band)/0.12)] bg-[hsl(var(--color-on-brand-band)/0.06)] p-7",
        className,
      )}
    >
      <ContentText
        as="p"
        variant="statValue"
        className="mb-2 font-heading text-[40px] leading-none tracking-tight text-on-brand-band"
      >
        {value}
      </ContentText>
      <ContentText as="p" variant="small" className="leading-snug text-brand-band-muted">
        {label}
      </ContentText>
    </div>
  );
}
