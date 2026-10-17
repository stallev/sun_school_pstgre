import { ContentText } from "@/components/atoms";

type CheckProgressProps = {
  checked: number;
  total: number;
  label: string;
};

export const CheckProgress = ({ checked, total, label }: CheckProgressProps) => {
  const ratio = total > 0 ? Math.round((checked / total) * 100) : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <ContentText className="text-sm text-ink-2">{label}</ContentText>
        <ContentText className="shrink-0 text-sm tabular-nums text-ink-2">
          {checked} / {total}
        </ContentText>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuenow={checked}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={label}
      >
        <div className="h-full bg-cobalt-ink transition-[width] duration-200 ease-out-soft" style={{ width: `${ratio}%` }} />
      </div>
    </div>
  );
};
