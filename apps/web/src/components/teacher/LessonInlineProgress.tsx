type LessonInlineProgressProps = {
  checked: number;
  total: number;
  label: string;
};

export const LessonInlineProgress = ({ checked, total, label }: LessonInlineProgressProps) => {
  const ratio = total > 0 ? Math.round((checked / total) * 100) : 0;
  return (
    <div className="space-y-2">
      <p className="text-sm tabular-nums text-ink-2">{label}</p>
      <div
        className="h-2 overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuenow={checked}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={label}
      >
        <div
          className="h-full bg-cobalt-ink transition-[width] duration-200 ease-out-soft"
          style={{ width: `${ratio}%` }}
        />
      </div>
    </div>
  );
};
