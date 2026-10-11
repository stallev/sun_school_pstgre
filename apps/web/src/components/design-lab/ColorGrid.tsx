import { COLOR_TOKENS } from "@/lib/design-lab/tokens";
import { cn } from "@/lib/utils";

export const ColorGrid = () => (
  <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
    {COLOR_TOKENS.map((token) => (
      <li key={token.name} className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className={cn("h-14 border-b border-line", token.swatch)} aria-hidden="true" />
        <div className="space-y-0.5 p-3">
          <p className="text-sm font-medium text-ink">{token.name}</p>
          <p className="text-sm text-muted tabular-nums">{token.hex}</p>
          <p className="text-sm text-ink-2">{token.role}</p>
          {token.note ? <p className="text-sm font-medium text-danger">{token.note}</p> : null}
        </div>
      </li>
    ))}
  </ul>
);
