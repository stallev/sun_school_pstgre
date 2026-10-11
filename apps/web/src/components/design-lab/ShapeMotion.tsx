import { MOTION, SHAPES } from "@/lib/design-lab/tokens";
import { cn } from "@/lib/utils";

export const ShapeMotion = () => (
  <div className="grid gap-4 lg:grid-cols-2">
    <ul className="grid grid-cols-2 gap-3">
      {SHAPES.map((shape) => (
        <li key={shape.name} className="space-y-2">
          <div className={cn("h-16 border border-line-strong bg-surface", shape.classes)} aria-hidden="true" />
          <p className="text-sm font-medium text-ink">{shape.name}</p>
          <p className="text-sm text-muted">{shape.spec}</p>
        </li>
      ))}
    </ul>
    <ul className="space-y-2">
      {MOTION.map((item) => (
        <li key={item.name} className="rounded-xl border border-line bg-surface p-3">
          <p className="text-sm font-medium text-ink">{item.name}</p>
          <p className="text-sm text-muted tabular-nums">
            {item.spec} · {item.duration}
          </p>
        </li>
      ))}
    </ul>
  </div>
);
