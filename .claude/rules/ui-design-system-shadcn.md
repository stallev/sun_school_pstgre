---
description: Design system tokens, shadcn primitives and the Design Lab catalog for product UI
---
# UI: Slate Cobalt + shadcn + Tailwind v4

**Source of truth:** [`docs/design/visual_identity_contract.md`](docs/design/visual_identity_contract.md) (UX-03); interim reference [`docs/prototypes/sunday_school_prototype.html`](docs/prototypes/sunday_school_prototype.html)
**Typography:** [`docs/guidelines/typography_text_guidelines.md`](docs/guidelines/typography_text_guidelines.md)
**Methodology:** [`docs/meta/ai_first_project_methodology.md`](docs/meta/ai_first_project_methodology.md)

**Theme:** light only (UX-03 D-4). Hex values live **only** in `:root` of `apps/web/src/app/globals.css`; `@theme inline` maps them to Tailwind utilities. **No `.dark`, no `next-themes`, no theme switch.**

## Principles

- **Character:** Slate Cobalt palette, border-first depth (shadow only on floating panels), `rounded-lg` controls / `rounded-xl` cards — from UX-03, not shadcn defaults or generic SaaS gray.
- **Typography (UX-03 v2.0, ADR-014):** Alegreya (`font-display`: titles, big numbers, verse text) and **Source Sans 3** (`font-sans`/`font-body`) via `next/font` (latin + cyrillic) in the root layout; base **18 px** (`html { font-size: 112.5% }`), sizes in `rem`. No third font. Body content in `<main>` is `text-base` (18 px); `text-sm` (15.75 px) is the floor for metadata only; `text-xs` only in `Badge` / `CountBadge`; no `text-[0.9375rem]`.
- **Controls (UX-03 D-9, D-10, D-13):** heights from the scale `h-10` default / `h-9` compact (tables only) / `h-11` touch; one selected-chip style (`border-cobalt-ink bg-cobalt-soft font-bold text-cobalt-ink`, `SegmentedControl`); **no native `<select>`, `type="checkbox"`, `type="date"`** — use `Select`, `Checkbox`, `DateField`.
- **Layout (UX-02 v2.0):** left sidebar on `lg+`, drawer below; page container `max-w-[1400px]`, left-aligned, narrow pages only via `PageSection` (`form` / `wide`); no `max-w-*` / `mx-auto` on a page.
- **Mobile-first:** contract in **ui-mobile-first**; touch targets ≥ 44 px where the control is a primary action.
- **Prototype fidelity:** fonts, sizes, weights, colors from prototype + UX-03 — **ui-prototype-fidelity**.

## Tokens

- Semantic classes: `bg-background`, `text-foreground`, `border-border`, `bg-card`, `text-muted-foreground`, `bg-primary` / `text-primary-foreground`, `border-input` (= `muted`, UX-03 D-7), `ring-ring`, `bg-accent` / `text-accent-foreground`, `text-destructive`.
- Palette utilities from UX-03 §4: `bg-paper`, `bg-surface`, `text-ink`, `text-ink-2`, `text-muted`, `border-line`, `border-line-strong`, `bg-cobalt-ink`, `hover:bg-cobalt-deep`, `bg-cobalt-soft`, `text-ok` / `bg-ok-soft`, `text-warn` / `bg-warn-soft`, `text-danger` / `bg-danger-soft`. Reserved (post-MVP, unused): `penalty*`, `tier-1..3`.
- **`muted` is a palette slate (text/border), not a shadcn fill:** there is no `bg-muted`; use `bg-paper` / `bg-line` for fills.
- `text-cobalt` and `bg-cobalt` + white text are forbidden (contrast 4.28) — links and accents use `cobalt-ink`. Red is only for errors and deletion.
- **MUST NOT:** hex / `rgb()` / `oklch()` literals, `bg-[#…]`, inline colour `style` (ESLint `no-restricted-syntax` enforces it).
- New colour: add the raw value to `:root`, map it in `@theme inline`, add the row to `lib/design-lab/tokens.ts` and the Lab, and keep the UX-03 §5 contrast table in step.
- Depth: border; `shadow-float` (single shadow) only for dropdown / toast. Motion: 100–300 ms, `ease-out-soft`; honour `motion-reduce:` and `reduce-transparency:`.

## States (first-class UX)

Design explicitly: **empty**, **loading**, **error**, **forbidden** — patterns `EmptyState`, `ErrorState`, `ForbiddenState`, skeletons; contract: [`ui_states_contract.md`](docs/design/ui_states_contract.md).

- Loading: skeletons / Suspense ([ai_loading_patterns.md](docs/guidelines/nextjs/ai_loading_patterns.md)).
- Field errors: `border-destructive` + `AlertText` (`text-danger`); error banner per UX-03 D-8 (`Banner tone="error"`).

## Agent checklist

- One **Primary CTA** per screen — `Button` `default` variant (`cobalt-ink`).
- Do not bypass PRD with client-side business logic.
- **Accessibility:** contrast, focus (`focus-visible` 2 px outline), labels, semantic HTML — **ui-semantics-a11y** (WCAG 2.1 AA).
- Status is never colour-only: text or icon next to the colour.

## Primitives

shadcn on **Base UI**: Card, Button, Dialog, Sheet, Table, Field/Label, Select, Skeleton, … — add via `shadcn add` (shadcn MCP/CLI), then **tokenize** (strip `dark:` variants, `bg-muted`, shadows; map to UX-03 §8 recipes).

- Init (done in P6): `shadcn init -b base -p vega` → `components.json` `"style": "base-vega"`. Fix-ups after any (re)init: `src/lib/utils.ts` is `clsx` + `tailwind-merge`; no `cn` npm package; keep the project `globals.css` / `layout.tsx` (CLI output is a starting point, not canon).
- Primitive package: `@base-ui/react` (exact pin). Compose with the Base UI `render` prop and pass a **real `<button>`** as a trigger element.
- Project controls on top: `SegmentedControl`, `ScoreSelector` (arrow / Home / End), `StatusText`, `CountBadge`, `CustomLink`.
- **MUST NOT:** `shadcn init -b radix`, a `radix-*` style, or `@radix-ui/*` (ESLint-enforced).
- Dialog / Sheet close labels are **props** (`closeLabel`), never hardcoded text — copy comes from `@/lib/messages`.

## Design Lab catalog (product UI — MUST)

Product screens **MUST** compose UI from the **canonical shared catalog** visualized on the dev-only **Design Lab** at `/design-system` (`apps/web/src/app/(dev)/design-system/`; 404 unless `APP_ENV=dev`). Spec: [`design_system_lab_spec.md`](docs/implementation/mvp/specs/design_system_lab_spec.md).

| Layer | Catalog path | Import alias | Examples |
|-------|--------------|--------------|----------|
| Typography atoms | `apps/web/src/components/atoms/` | `@/components/atoms` | `Heading`, `SectionTitle`, `ContentText`, `AlertText`, `NumberDisplay`, `Icon` |
| Tokenized primitives | `apps/web/src/components/ui/` | `@/components/ui/*` | `Button`, `CustomLink`, `Card`, `Input`, `Select`, `Dialog`, `Sheet`, `Table`, `SegmentedControl`, `ScoreSelector` |
| Design tokens | `apps/web/src/app/globals.css` | semantic Tailwind classes | `bg-primary`, `text-muted-foreground`, `shadow-float` |
| L3 composed patterns | `apps/web/src/components/patterns/` | `@/components/patterns/*` | `PageHeader`, `EmptyState`, `Banner`, `FormSection`, `ConfirmDialog`, `ScoreGroup`, `NavDrawer` |

**MUST NOT:** import `@/components/design-lab/**` or `@/lib/design-lab/**` in product routes (ESLint-enforced); duplicate primitive markup already in the Lab — extend CVA / the atom variant and add the Lab section first (spec §9, C-2).

**Workflow:** open `/design-system` locally → pick the catalog import → check 390 px and `md`.

Reference: Pulse (docs/examples/pulse) `ui-calm-editorial-shadcn.mdc` — structure only; palette and rules above are project canon.
