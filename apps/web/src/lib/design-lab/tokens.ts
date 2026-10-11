/**
 * Design Lab L1 data — UX-03 `visual_identity_contract.md` §4–§7.
 * Hex literals are allowed ONLY in this file (documentation data for the Lab); components render
 * colours through the `swatch` utility classes. The lint rule for hex excludes `lib/design-lab/**`.
 */

export type ColorToken = {
  name: string;
  hex: string;
  role: string;
  /** Static utility class — written out in full so Tailwind can see it. */
  swatch: string;
  note?: string;
};

export const COLOR_TOKENS: readonly ColorToken[] = [
  { name: "paper", hex: "#F8FAFC", role: "background", swatch: "bg-paper" },
  { name: "surface", hex: "#FFFFFF", role: "card, popover, primary-foreground", swatch: "bg-surface" },
  { name: "ink", hex: "#0F172A", role: "foreground", swatch: "bg-ink" },
  { name: "ink-2", hex: "#475569", role: "secondary-foreground", swatch: "bg-ink-2" },
  { name: "muted", hex: "#64748B", role: "muted-foreground, input border", swatch: "bg-muted" },
  { name: "line", hex: "#E2E8F0", role: "border", swatch: "bg-line" },
  { name: "line-strong", hex: "#CBD5E1", role: "outline buttons, dividers", swatch: "bg-line-strong" },
  { name: "cobalt", hex: "#3370FF", role: "ring, accents, charts", swatch: "bg-cobalt", note: "not for text" },
  { name: "cobalt-ink", hex: "#1D4ED8", role: "primary, links", swatch: "bg-cobalt-ink" },
  { name: "cobalt-deep", hex: "#1E40AF", role: "primary hover", swatch: "bg-cobalt-deep" },
  { name: "cobalt-soft", hex: "#EBF1FF", role: "accent", swatch: "bg-cobalt-soft" },
  { name: "amber-ink", hex: "#B45309", role: "warning text", swatch: "bg-amber-ink" },
  { name: "amber-soft", hex: "#FEF3C7", role: "warning fill", swatch: "bg-amber-soft" },
  { name: "ok", hex: "#15803D", role: "success", swatch: "bg-ok" },
  { name: "ok-soft", hex: "#DCFCE7", role: "success fill", swatch: "bg-ok-soft" },
  { name: "warn", hex: "#B45309", role: "warning", swatch: "bg-warn" },
  { name: "warn-soft", hex: "#FEF9C3", role: "warning fill", swatch: "bg-warn-soft" },
  { name: "danger", hex: "#DC2626", role: "destructive", swatch: "bg-danger" },
  { name: "danger-soft", hex: "#FEE2E2", role: "error fill", swatch: "bg-danger-soft" },
  { name: "penalty", hex: "#1E3A8A", role: "post-MVP, reserved", swatch: "bg-penalty" },
  { name: "penalty-soft", hex: "#E0E7FF", role: "post-MVP, reserved", swatch: "bg-penalty-soft" },
  { name: "tier-1", hex: "#EA580C", role: "post-MVP, reserved", swatch: "bg-tier-1" },
  { name: "tier-2", hex: "#94A3B8", role: "post-MVP, reserved", swatch: "bg-tier-2" },
  { name: "tier-3", hex: "#EAB308", role: "post-MVP, reserved", swatch: "bg-tier-3" },
];

export type ContrastPair = {
  /** Foreground (text / icon) token and hex. */
  fg: { name: string; hex: string };
  bg: { name: string; hex: string };
  /** Ratio documented in UX-03 §5 — the Lab recomputes it and flags drift. */
  documented: number;
  /** Required minimum for the pair's use (4.5 text, 3 non-text / large). */
  required: 4.5 | 3;
  usage: string;
};

const H = Object.fromEntries(COLOR_TOKENS.map((token) => [token.name, token.hex]));
const pick = (name: string) => ({ name, hex: H[name] ?? "#000000" });

export const CONTRAST_PAIRS: readonly ContrastPair[] = [
  { fg: pick("ink"), bg: pick("paper"), documented: 17.06, required: 4.5, usage: "body text on page" },
  { fg: pick("ink"), bg: pick("surface"), documented: 17.85, required: 4.5, usage: "body text on card" },
  { fg: pick("ink-2"), bg: pick("surface"), documented: 7.58, required: 4.5, usage: "secondary text" },
  { fg: pick("muted"), bg: pick("surface"), documented: 4.76, required: 4.5, usage: "captions; field border (3:1)" },
  { fg: pick("muted"), bg: pick("paper"), documented: 4.55, required: 4.5, usage: "captions on page" },
  { fg: pick("cobalt-ink"), bg: pick("cobalt-soft"), documented: 5.92, required: 4.5, usage: "active item" },
  { fg: pick("surface"), bg: pick("cobalt-ink"), documented: 6.7, required: 4.5, usage: "primary button" },
  { fg: pick("surface"), bg: pick("cobalt-deep"), documented: 8.72, required: 4.5, usage: "primary button hover" },
  { fg: pick("ok"), bg: pick("surface"), documented: 5.02, required: 4.5, usage: "success text" },
  { fg: pick("danger"), bg: pick("surface"), documented: 4.83, required: 4.5, usage: "field error" },
  { fg: pick("ink"), bg: pick("danger-soft"), documented: 14.61, required: 4.5, usage: "error banner text (D-8)" },
  { fg: pick("surface"), bg: pick("penalty"), documented: 10.36, required: 4.5, usage: "penalty button (reserved)" },
];

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const n = Number.parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

/** WCAG 2.1 contrast ratio of two `#RRGGBB` colours. */
export function contrastRatio(fgHex: string, bgHex: string): number {
  const [a, b] = [luminance(fgHex), luminance(bgHex)];
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

export const TYPE_SCALE = [
  { role: "Page title (h1)", classes: "font-display text-[1.75rem] sm:text-[2.125rem] font-medium leading-[1.1]", spec: "28 → 34 px", sample: "Домашнее задание" },
  { role: "Section title (h2)", classes: "font-display text-xl font-medium leading-snug", spec: "20 px", sample: "Проверка работ" },
  { role: "Large number", classes: "font-display text-3xl tabular-nums", spec: "30 px", sample: "128" },
  { role: "Body", classes: "text-base", spec: "17 px", sample: "Ученик сдал работу вовремя." },
  { role: "Caption", classes: "text-sm text-muted", spec: "~15 px", sample: "Группа «Ковчег», 12 ноября" },
  { role: "Button", classes: "text-[0.9375rem] font-medium", spec: "16 px", sample: "Сохранить" },
] as const;

export const SHAPES = [
  { name: "Field / button", classes: "rounded-lg h-10", spec: "rounded-lg · h-10" },
  { name: "Card", classes: "rounded-xl border border-line bg-surface", spec: "rounded-xl · border line · no shadow" },
  { name: "Bottom sheet", classes: "rounded-t-2xl", spec: "rounded-t-2xl · max-h-[92dvh]" },
  { name: "Floating panel", classes: "rounded-xl border border-line bg-surface shadow-float", spec: "border + single shadow" },
] as const;

export const MOTION = [
  { name: "ease-out-soft", spec: "cubic-bezier(0.22, 1, 0.36, 1)", duration: "100–300 ms" },
  { name: "motion-reduce", spec: "no scale / panel transitions", duration: "—" },
  { name: "reduce-transparency", spec: "no backdrop blur", duration: "—" },
] as const;
