import { TYPE_SCALE } from "@/lib/design-lab/tokens";
import { cn } from "@/lib/utils";

export const TypeScale = () => (
  <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
    {TYPE_SCALE.map((row) => (
      <li key={row.role} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-baseline sm:gap-6">
        <div className="w-44 shrink-0 text-sm text-muted">
          {row.role}
          <span className="block tabular-nums">{row.spec}</span>
        </div>
        <p className={cn("min-w-0 text-ink", row.classes)}>{row.sample}</p>
      </li>
    ))}
  </ul>
);
