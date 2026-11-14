import { MatrixCell } from "@/components/design-lab/MatrixCell";
import { SPACE_TOKENS, type SpaceToken } from "@/lib/design-lab/tokens";

const formatSteps = (values: SpaceToken["rem"], unit: string) =>
  [...new Set(values)].map((value) => `${value}${unit}`).join(" / ");

const Swatch = ({ token }: { token: SpaceToken }) => (
  <li className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface p-3">
    <span
      aria-hidden="true"
      className="h-4 shrink-0 rounded-sm bg-cobalt-ink"
      style={{ width: `var(${token.variable})` }}
    />
    <code className="text-sm text-ink">{token.utility}</code>
    <span className="text-sm text-muted tabular-nums">
      {token.variable} · {formatSteps(token.rem, "rem")} · {formatSteps(token.px, " px")}
    </span>
    <span className="text-sm text-ink-2">{token.role}</span>
  </li>
);

/** Design Lab «Spacing scale» (design_system_lab_spec §5.3а, ADR-022 §4.2). */
export const SpacingScale = () => (
  <div className="space-y-4">
    <ul className="space-y-2">
      {SPACE_TOKENS.map((token) => (
        <Swatch key={token.variable} token={token} />
      ))}
    </ul>
    <div className="grid gap-3 md:grid-cols-3">
      <MatrixCell label="Chain of chips · gap-chip (≥ 8 px, both axes)">
        <div className="flex flex-wrap gap-chip">
          {["Пн", "Вт", "Ср", "Чт"].map((day) => (
            <span key={day} className="rounded-lg border border-muted bg-surface px-3 py-1 text-base">
              {day}
            </span>
          ))}
        </div>
      </MatrixCell>
      <MatrixCell label="Label → field · mb-label">
        <span className="mb-label block min-h-5 text-base font-medium leading-5">Подпись</span>
        <div className="h-9 rounded-lg border border-muted bg-surface" aria-hidden="true" />
      </MatrixCell>
      <MatrixCell label="Card → card · gap-card">
        <div className="grid gap-card">
          <div className="rounded-xl border border-line bg-surface p-card text-base">Карточка</div>
          <div className="rounded-xl border border-line bg-surface p-card text-base">Карточка</div>
        </div>
      </MatrixCell>
    </div>
    <MatrixCell label="Anti-example · forbidden: raw gap-1.5 / p-4 / space-y-3 in product code (ESLint no-raw-spacing)">
      <div className="flex gap-1.5 opacity-60" aria-hidden="true">
        <span className="rounded-lg border border-danger/60 px-3 py-1 text-base text-danger line-through">gap-1.5</span>
        <span className="rounded-lg border border-danger/60 px-3 py-1 text-base text-danger line-through">p-4</span>
      </div>
    </MatrixCell>
  </div>
);
