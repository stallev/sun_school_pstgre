import { ContentText } from "@/components/atoms";
import { cn } from "@/lib/utils";

export type KeyValueRowProps = {
  label: React.ReactNode;
  value: React.ReactNode;
  className?: string;
};

export function KeyValueRow({ label, value, className }: KeyValueRowProps) {
  return (
    <div className={cn("flex justify-between gap-3 text-sm", className)}>
      <ContentText variant="muted" as="span">
        {label}
      </ContentText>
      <ContentText variant="smallEmphasis" as="span" className="max-w-[60%] truncate text-right">
        {value}
      </ContentText>
    </div>
  );
}
