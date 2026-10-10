# Styleguide — Pulse MVP

**Тип:** UX Contract / Spec  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-05-23  
**Волна:** W7  
**Зависит от:** [`visual_identity_contract.md`](./visual_identity_contract.md), [`fitness-platform-design-system.md`](../default_docs/fitness-platform-design-system.md)  
**Связанные документы:** [`responsive_navigation_contract.md`](./responsive_navigation_contract.md), [`ux_ui_principles.md`](./ux_ui_principles.md)

**Migrated from:** `docs/default_docs/fitness-platform-design-system.md` §5–9 (spacing, components, navigation recipes)

**Technical refs:** shadcn/ui — install via shadcn MCP; Tailwind v4 — `@theme inline` per visual identity contract

---

## Purpose

Канон **комponent recipes** Pulse MVP: как собирать UI из shadcn primitives + Warm Forest tokens. Дополняет [`visual_identity_contract.md`](./visual_identity_contract.md) (tokens) практическими паттернами для feature code и wireframes W10.

**Аудитория:** design, AI-агенты при scaffold UI в `apps/web/src/components/`.

---

## Scope / Out of scope

**In scope:** Button, Card, Badge, Input, Tabs, Switch, KPI, Sheet/Dialog, Avatar, RatingStars, SectionHeader, PhotoSlot, SpecChip, shell chrome (top bar, nav item patterns).

**Out of scope:** raw hex tables (→ visual identity); nav route lists (→ [`responsive_navigation_contract.md`](./responsive_navigation_contract.md)); interaction behavior (→ W7 interaction/ui states contracts).

---

## Implementation rules

| ID | Rule |
|----|------|
| SG-MUST-1 | Feature components use **semantic** classes: `bg-card`, `text-muted-foreground`, `bg-primary` — no raw `#2D5A40` |
| SG-MUST-2 | Install/maintain shadcn in `components/ui/`; customize via CSS vars in `globals.css` |
| SG-MUST-3 | Icons — `lucide-react` only; tree-shake per-icon imports |
| SG-MUST-4 | One primary `Button variant="default"` per view (P4) |
| SG-SHOULD-1 | Extract repeated compositions to `components/pulse/` when used 2+ routes |

---

## Spacing (canonical)

Base unit **4px**. Prefer Tailwind scale from interim design system:

| Usage | Class | px |
|-------|-------|-----|
| Small inner padding | `p-3` | 12 |
| Card mobile | `p-4` | 16 |
| Card desktop | `md:p-5` / `md:p-6` | 20–24 |
| Card grid gap | `gap-2.5` | 10 |
| Section vertical | `space-y-5` / `space-y-6` | 20–24 |
| Page bottom (above nav) | `pb-6` | 24 |
| Max content width | `max-w-[1400px] mx-auto` | — |

---

## Elevation

Use shared constants (migrate to `@/lib/ui/elevation.ts` on scaffold):

| Level | Usage | Semantic |
|-------|-------|----------|
| 1 | Card at rest | `shadow-sm` or design-system level 1 |
| 2 | Card hover | transition on interactive cards |
| 3 | Popover, Bottom Nav | Sheet, dropdown |
| 4 | Bottom sheet upward | Mobile sheet |

Details: [`visual_identity_contract.md`](./visual_identity_contract.md) § Radius & elevation.

---

## Button

**shadcn:** `Button` with `cva` variants tokenized to Warm Forest.

| Product variant | shadcn mapping | Usage |
|-----------------|----------------|-------|
| Primary CTA | `variant="default"` | Book, Confirm, Approve |
| Secondary | `variant="secondary"` or `outline` | Leave review, + New |
| Tertiary | `variant="ghost"` or `outline` | Back, Cancel, All → |
| Destructive | `variant="destructive"` | Reject, Delete (with confirm) |

**Sizes:** `sm` h-9 · `default` h-11 · `lg` h-12 · `icon` h-10 w-10

**Classes (prototype fidelity):**

```
rounded-full font-medium
transition-[transform,background-color,box-shadow] duration-200
active:scale-[0.97]
disabled:opacity-40 disabled:pointer-events-none
focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
```

**Primary filled:** `bg-primary text-primary-foreground hover:bg-primary/90`

---

## Card

**shadcn:** `Card`, `CardHeader`, `CardContent`, `CardFooter`

| Variant | Classes |
|---------|---------|
| Elevated (default) | `bg-card rounded-2xl border border-border shadow-sm` |
| Filled | `bg-muted rounded-2xl` |
| Outlined | `bg-card rounded-2xl border border-border` |
| Interactive | add `hover:shadow-md transition-shadow cursor-pointer active:scale-[0.99]` |

Trainer cards, KPI wrappers, admin queue rows — elevated + interactive where clickable.

---

## Badge / status chip

Map booking/trainer statuses to semantic container colors (see visual identity status semantic):

| Status | Classes pattern |
|--------|-----------------|
| `confirmed` | success container tones |
| `pending` | warning container |
| `cancelled` | destructive/error container |
| `verified` | primary container |
| `completed` | muted |

```
inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium
```

Labels from `@/lib/messages` — [`content_and_microcopy_contract.md`](./content_and_microcopy_contract.md).

---

## Input / Textarea / Field

**shadcn:** `Input`, `Textarea`, `Field`, `FieldLabel`, `FieldError`

| State | Classes |
|-------|---------|
| Default | `h-12 rounded-lg border-border bg-card` |
| Focus | `focus-visible:ring-ring/30 focus-visible:border-primary` |
| Error | `border-destructive` + `FieldError` |
| Disabled | `opacity-40` with pending lock |

Placeholder: `placeholder:text-muted-foreground`

---

## Tabs (pill)

**shadcn:** `Tabs`, `TabsList`, `TabsTrigger`

```
TabsList: inline-flex rounded-full bg-muted p-1
TabsTrigger active: bg-card text-foreground shadow-sm rounded-full
TabsTrigger inactive: text-muted-foreground
```

Mobile overflow: `overflow-x-auto -mx-4 px-4 no-scrollbar` on trainer profile tabs.

---

## Switch

**shadcn:** `Switch` — trainer service active toggle (optimistic).

Touch target: wrap in min `h-10` hit area. ON: primary track; OFF: muted track.

---

## Avatar

**shadcn:** `Avatar`, `AvatarImage`, `AvatarFallback`

Sizes: `xs` 24 · `sm` 32 · `md` 40 · `lg` 56 · `xl` 80 · `2xl` 112 (px heights)

Fallback: `bg-primary/15 text-primary font-semibold rounded-full`

---

## KPI card

Composition (not separate shadcn primitive):

```
flex row gap-3 p-3.5 rounded-2xl
[icon 36px rounded-xl in tonal container]
[value: font-heading text-xl]
[label: text-xs text-muted-foreground]
[sub: text-[11px] text-muted-foreground optional]
```

Tones: primary / secondary(gold) / success / info — map to CSS container vars.

Dashboard grids: `grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-3`

---

## RatingStars

Readonly: `text-secondary` filled, `text-muted` empty — **gold, not primary green**.

Interactive (review form): button per star, `hover:scale-110`, keyboard navigable.

Sizes: 12 / 14 / 16 px — context per prototype.

---

## Section header

```
flex items-center justify-between gap-3 mb-3
Title: font-heading text-[22px] tracking-tight
Action: text-sm font-medium text-primary inline-flex gap-0.5
  «Все» + ChevronRight size={14}
```

---

## SpecChip

```
inline-flex rounded-full bg-muted text-muted-foreground px-2.5 py-1 text-xs font-medium
```

Trainer specializations, filter chips.

---

## PhotoSlot (placeholder)

Before real Blob assets:

```
relative overflow-hidden rounded-2xl bg-muted
diagonal hatch pattern (subtle primary/5)
centered Camera icon + mono uppercase label
```

Aspects: `1/1` card · `4/3` mobile cover · `16/6` desktop cover

---

## Sheet / Dialog

**shadcn:** `Sheet` (mobile bottom), `Dialog` (desktop centered)

| Viewport | Pattern |
|----------|---------|
| `< sm` | Sheet `side="bottom"`, `rounded-t-3xl`, drag handle |
| `≥ sm` | Dialog centered `rounded-3xl sm:max-w-md` |

Overlay: `bg-black/40`. Elevation level 3–4.

Confirm destructive actions — [`interaction_design_contract.md`](./interaction_design_contract.md) I5.

---

## Shell components (visual)

Full behavior: [`responsive_navigation_contract.md`](./responsive_navigation_contract.md)

### Top bar

```
sticky top-0 z-40 h-14 md:h-16
bg-background/85 backdrop-blur-md border-b border-border
Logo: icon in bg-primary rounded-lg + font-heading «Pulse»
Utilities: lang (post-MVP), theme toggle, bell, avatar md+
```

### Sidebar item (md+)

```
h-11 px-3 rounded-full flex items-center gap-3 text-sm font-medium
active: bg-primary/15 text-primary
inactive: text-muted-foreground hover:bg-muted hover:text-foreground
badge: min-w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[11px]
```

### Bottom nav item (< md)

```
grid cols by role; sticky bottom-0 z-40
bg-card/95 backdrop-blur border-t
safe-area: pb env(safe-area-inset-bottom)
icon pill active: bg-primary/15 text-primary
label text-[10.5px]
```

---

## Skeleton

**shadcn:** `Skeleton`

Match final layout geometry per [`ui_states_contract.md`](./ui_states_contract.md):

- Trainer card: image block + 2 text lines + chip row
- Booking row: avatar + 3 lines + badge
- KPI: 2×2 grid of rounded rectangles

Use `animate-pulse` + `bg-muted`; respect `prefers-reduced-motion`.

---

## Happy paths

1. Agent adds trainer card using `Card` + semantic tokens → matches prototype without hex.
2. Wireframe references «KPI card» → links this § KPI card recipe.
3. Dark mode toggle → all components flip via CSS vars.

---

## Negative paths

| Scenario | Visual |
|----------|--------|
| Validation | Input destructive border + FieldError |
| Disabled submit | Button opacity-40 |
| Empty PhotoSlot | Hatch placeholder visible |

---

## Security paths

N/A — visual only. Destructive buttons still use destructive variant + confirm flow.

---

## Concurrency notes

N/A — static recipes. Optimistic Switch may show immediate ON state before server ack.

---

## Drift risks & guards

| Risk | Guard |
|------|-------|
| shadcn default zinc theme | Warm Forest override before P01 UI |
| Copying 900-line interim doc into features | Link styleguide + visual identity |
| Inline shadow strings | Use elevation constants |
| Prototype `@theme` in HTML | Production: `globals.css` only |

---

## Acceptance criteria

- [ ] Core MVP components documented with shadcn mapping
- [ ] Spacing + elevation summarized
- [ ] Shell visual patterns reference nav contract
- [ ] Status badge maps to domain statuses
- [ ] No duplicate hex palette (link visual identity)
- [ ] Happy / negative / drift sections
- [ ] Backlinks in `visual_identity_contract.md`, `design/README.md`

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`visual_identity_contract.md`](./visual_identity_contract.md) | Tokens & fonts |
| [`responsive_navigation_contract.md`](./responsive_navigation_contract.md) | Nav behavior |
| [`ui_states_contract.md`](./ui_states_contract.md) | Skeleton shapes |
| [`forms_and_validation_ux.md`](./forms_and_validation_ux.md) | Field/Input states |
| [`fitness-platform-design-system.md`](../default_docs/fitness-platform-design-system.md) | Interim archive |
| [`Fitness_Platform_Prototype_v1.html`](../prototypes/Fitness_Platform_Prototype_v1.html) | Visual reference |

**Registry:** [`documentation_creation_registry.md`](../meta/documentation_creation_registry.md) — wave W7-05

---

## Agent notes

- Install shadcn components via MCP before copying recipes into feature code.
- `components/ui/` — upstream shadcn; `components/pulse/` — product compositions.
- Rating uses **secondary/gold** — common agent mistake is primary green stars.
- Post-MVP Stripe/video UI — do not add components until scope opens.

---

## Change log

| Date | Change |
|------|--------|
| 2026-05-23 | v1.0 — canonical styleguide (W7-05) |
