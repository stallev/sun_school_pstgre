# Visual Identity Contract — Pulse MVP

**Тип:** UX Contract  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-05-23  
**Волна:** W2  
**Зависит от:** [`ux_ui_principles.md`](./ux_ui_principles.md), [`fitness-platform-design-system.md`](../default_docs/fitness-platform-design-system.md), [`typography_text_guidelines.md`](../guidelines/typography_text_guidelines.md)  
**Связанные документы:** [`responsive_navigation_contract.md`](./responsive_navigation_contract.md), [`accessibility_requirements.md`](./accessibility_requirements.md)

**Migrated from:** `docs/default_docs/fitness-platform-design-system.md` — tokens, typography, elevation (component recipes → W7 `styleguide.md`)

**Technical refs (Context7):** Tailwind v4 `@theme inline` — `/websites/tailwindcss`; shadcn semantic CSS vars — `/websites/ui_shadcn`

---

## Purpose

Канон **визуальной идентичности Warm Forest** для Pulse: семантические токены, маппинг на shadcn/Tailwind v4, типографика, elevation, dark mode. Wireframes и UI-код **MUST** ссылаться на этот файл вместо копирования hex из interim design system.

---

## Scope / Out of scope

**In scope:** color roles, fonts, radius, elevation, shadcn token mapping, `globals.css` structure, component variant names.

**Out of scope:** полные TSX recipes каждого компонента (→ W7 `styleguide.md`); spacing tables in full (→ interim §5); infrastructure (→ ADR-001).

---

## Brand direction

| Pillar | Expression |
|--------|------------|
| Trust | Forest greens, cream surfaces — not cold SaaS gray |
| Energy | Gold secondary — ratings, highlights, KPI accents |
| Material You | Rounded corners (pill buttons, `rounded-2xl` cards), elevation layers |
| Dark mode | Independent `.dark` CSS variable scheme — not inverted light only |

**Philosophy:** semantic tokens in UI (`bg-primary`, `text-muted-foreground`) — **never** hardcoded `#2D5A40` in feature components.

---

## Font stack

| Role | Font | Tailwind / CSS | Usage |
|------|------|----------------|-------|
| Display / headings | Source Serif 4 | `font-heading` / `--font-display` | Page titles, trainer names, KPI headlines |
| UI / body | Manrope | `font-sans` / `--font-sans` | Buttons, labels, body copy |
| Mono | JetBrains Mono | `font-mono` / `--font-mono` | Times, booking IDs, badges «camera on» |

**MUST** — load via `next/font/google` in root `layout.tsx`; map in `@theme inline`. Subsets **MUST** include `latin` and `cyrillic` for EN/RU UI (P17).

**Historical note:** HTML prototype and early design docs referenced DM Serif Display + DM Sans (latin-only). Runtime stack post-P17 uses Manrope + Source Serif 4 for unified EN/RU typography; prototype remains visual reference only.

**Typography atoms (on scaffold):** `Heading`, `SectionTitle`, `ContentText`, `AlertText` — see [`typography_text_guidelines.md`](../guidelines/typography_text_guidelines.md).

### Responsive type scale (canonical)

| Context | Mobile | md+ | Class pattern |
|---------|--------|-----|---------------|
| Page title | 26–30px | 36–44px | `font-heading text-[26px] md:text-[36px]` |
| Dashboard greeting | 28–30px | 40–44px | `font-heading` |
| Section title | 22px | 22px | `font-heading text-[22px]` |
| Card title | 17–19px | 19–22px | `font-heading` |
| Body | 13–14px | 14px | default sans |
| Caption | 11–12px | 11–12px | `text-muted-foreground` |

---

## Color tokens — Warm Forest palette

### Brand & surface (design system source)

| Semantic role | Light (hex) | Dark (hex) | UI usage |
|---------------|-------------|------------|----------|
| Primary | `#2D5A40` | `#6EA886` | CTAs, active nav, links |
| Primary hover | `#1A3028` | `#87C09F` | Button hover |
| Primary container | `#E4F0E8` | `#1F3A2A` | Nav active bg, chips |
| Secondary (gold) | `#C4973A` | `#E8C070` | Stars, secondary accents |
| Background (cream) | `#F5F0E8` | `#0E1814` | Page bg |
| Surface (card) | `#FFFFFF` | `#1A2820` | Cards, inputs |
| Surface variant | `#EDE5D4` | `#243329` | Sidebar, tab bars |
| Ink / foreground | `#1A3028` | `#F0EAD8` | Headings, body |
| Muted text | `#4A5A50` / `#8A8578` | `#B5C2B9` / `#7A857E` | Secondary, placeholder |

### Status semantic

| Token | Usage |
|-------|-------|
| Success | Confirmed, verified, paid KPI |
| Warning | Pending, under review |
| Error / destructive | Cancelled, validation, reject |
| Info | Neutral notices |

---

## shadcn semantic mapping

Pulse **MUST** map Warm Forest → shadcn CSS variables in `apps/web/src/app/globals.css`:

| shadcn variable | Warm Forest source | Tailwind utility |
|-----------------|-------------------|------------------|
| `--background` | `--color-bg` / cream | `bg-background` |
| `--foreground` | `--color-ink` | `text-foreground` |
| `--card` | `--color-surface` | `bg-card` |
| `--primary` | `--color-primary` | `bg-primary`, `text-primary` |
| `--primary-foreground` | white / on-primary | `text-primary-foreground` |
| `--secondary` | gold container tones | `bg-secondary` |
| `--muted` | surface-variant | `bg-muted` |
| `--muted-foreground` | ink-2 / ink-3 | `text-muted-foreground` |
| `--accent` | gold highlight | badges (not swap with primary CTA) |
| `--destructive` | error | `bg-destructive` |
| `--border` | surface-dim | `border-border` |
| `--ring` | primary @ 40% | focus rings |
| `--sidebar-*` | surface-variant nav | sidebar component (shadcn) |

### globals.css structure (MUST)

Per shadcn + Tailwind v4 (Context7):

1. `@import "tailwindcss"`
2. `:root` and `.dark` — HSL or OKLch values for shadcn vars
3. `@theme inline { --color-background: var(--background); … }` — bridge to utilities
4. `@custom-variant dark (&:is(.dark *));` if using shadcn dark variant
5. `prefers-reduced-motion` block — see accessibility contract

**Primary vs accent:** `primary` = main CTAs; `accent` = highlights/badges — **MUST NOT** swap roles.

---

## Radius & elevation

### Radius

| Token | px | Usage |
|-------|-----|-------|
| `--radius-sm` … `--radius-lg` | shadcn calc from `--radius` | Inputs, buttons |
| `rounded-2xl` | 16px | **Default card radius** (prototype) |
| `rounded-3xl` | 24px | Sheets, desktop cover |
| `rounded-full` | pill | Buttons, nav items, chips, avatars |

### Elevation (M3-inspired)

| Level | Shadow | Usage |
|-------|--------|-------|
| 1 | subtle 1–2px | Cards at rest |
| 2 | medium 4–16px | Card hover |
| 3 | large 8–32px | Popover, Bottom Nav |
| 4 | upward | Bottom sheet |

Use design system `elevation` constants — not arbitrary shadow strings in features.

---

## Component visual rules

| Component | Variant canon |
|-----------|---------------|
| Button primary | `default` — filled forest |
| Button secondary | `outline` / `secondary` |
| Destructive | `destructive` + confirm elsewhere |
| Card | `bg-card`, `rounded-2xl`, elevation 1 |
| Badge verified | `bg-primary-container`, `text-on-primary-container` |
| KPI card | tonal containers — success/warning/info containers |
| Input error | `border-destructive` + error text |

Full component TSX — [`styleguide.md`](./styleguide.md). Install primitives via shadcn MCP.

---

## Dark mode

| Rule | Detail |
|------|--------|
| Mechanism | `next-themes` on `<html class="dark">` |
| Tokens | All colors via CSS vars — no `dark:` hardcoded hex in features |
| Toggle | Top bar — prototype `ThemeToggle` pattern |
| Hydration | `suppressHydrationWarning` on `<html>` |

---

## Happy paths

1. Developer adds screen — uses `bg-background`, `font-heading`, `Button default` — matches prototype without raw hex.
2. Designer reviews wireframe — references this contract for token names only.
3. Dark mode toggle — all semantic surfaces flip via `.dark` vars.

---

## Negative paths

| Scenario | Visual response |
|----------|-----------------|
| Validation error | `border-destructive`, destructive text — not only red toast |
| Disabled control | `opacity-40`, `pointer-events-none` — prototype button pattern |
| Empty state | Muted illustration + `text-muted-foreground` |

---

## Security paths

N/A at visual layer — no security-specific color semantics beyond destructive for irreversible actions.

---

## Concurrency notes

N/A — static tokens.

---

## Drift risks & guards

| Risk | Guard |
|------|-------|
| Hex in feature TSX | ESLint/review — semantic classes only |
| Interim design system vs this file | This file + W7 styleguide win for canonical names |
| shadcn default theme unmodified | Warm Forest override required before UI phases |
| Prototype inline `@theme` in HTML | Production source: `globals.css` only |

---

## Acceptance criteria

- [ ] Font stack + responsive scale documented
- [ ] Warm Forest → shadcn mapping table complete
- [ ] `@theme inline` + dark mode approach documented (Context7 aligned)
- [ ] Primary vs accent role separation explicit
- [ ] No full component library duplicate of interim 900-line doc
- [ ] Backlinks in `guidelines/README.md`, `ux_ui_principles.md`

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`ux_ui_principles.md`](./ux_ui_principles.md) | P8 prototype fidelity |
| [`typography_text_guidelines.md`](../guidelines/typography_text_guidelines.md) | Atoms & heading hierarchy |
| [`accessibility_requirements.md`](./accessibility_requirements.md) | Contrast verification |
| [`fitness-platform-design-system.md`](../default_docs/fitness-platform-design-system.md) | Interim detail archive |
| [`Fitness_Platform_Prototype_v1.html`](../prototypes/Fitness_Platform_Prototype_v1.html) | Visual reference |
| [`styleguide.md`](./styleguide.md) | Component recipes (W7) |

**Registry:** [`documentation_creation_registry.md`](../meta/documentation_creation_registry.md) — wave W2-03

---

## Agent notes

- Wireframes: **no hex** — link here.
- Rating stars use **secondary/gold** — not primary green.
- `text-ink-3` in prototype maps to `text-muted-foreground` in production semantic layer.
- New colors: add to `:root` / `.dark` **and** `@theme inline` map.

---

## Change log

| Date | Change |
|------|--------|
| 2026-05-23 | v1.0 — visual identity contract (W2-03) |
