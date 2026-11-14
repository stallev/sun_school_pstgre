/** Design Lab metadata for L2 term hints (P25 TermHint, P27 TermLabel / TermHeader). */
export const termHintLabSection = {
  id: "term-hint",
  anchorLabel: "Term hints",
  title: "L2 · TermLabel / TermHeader / TermHint",
  hint: "UX-03 D-17 · ADR-020 — visible term, «?» popover, table header, reason variant",
} as const;

export const rowActionsMenuLabSection = {
  id: "row-actions-menu",
  anchorLabel: "RowActionsMenu",
  title: "L2 · Row actions menu",
  hint: "P25 — ⋯ menu for table/list row actions, destructive tone",
} as const;

/** Design Lab metadata for the spacing scale (P29, UX-03 §7а, ADR-022 §4.2). */
export const spacingScaleLabSection = {
  id: "spacing-scale",
  anchorLabel: "Spacing scale",
  title: "L1 · Spacing scale",
  hint: "UX-03 §7а · ADR-022 — tokens --space-hint|label|chip|stack|card|section|page-x; raw gap-1.5, p-4 are forbidden",
} as const;

/** Design Lab metadata for field heights (P29, UX-03 D-9, D-14, ADR-022 §4.3). */
export const fieldHeightsLabSection = {
  id: "field-heights",
  anchorLabel: "Field heights",
  title: "L2 · Field heights",
  hint: "h-9 (40,5 px) and compact h-8 (36 px); a button next to a field inherits its height",
} as const;
