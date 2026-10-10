# Design System Lab Spec — Pulse MVP

**Тип:** Spec  
**Статус:** Canonical  
**Версия:** 1.2  
**Дата:** 2026-05-23  
**Волна:** W15  
**Фаза:** P01 (scaffold) — блокирует P02 UI  
**Зависит от:** [`visual_identity_contract.md`](../../../design/visual_identity_contract.md), [`styleguide.md`](../../../design/styleguide.md), [`typography_text_guidelines.md`](../../../guidelines/typography_text_guidelines.md), [`example_components/README.md`](../../../example_components/README.md)  
**Связанные документы:** [`global_shell_spec.md`](./global_shell_spec.md), [`prototype_route_mapping.md`](../../../design/prototype_route_mapping.md), [`ux_ui_principles.md`](../../../design/ux_ui_principles.md), [`accessibility_requirements.md`](../../../design/accessibility_requirements.md)

**Context7 verified:** Next.js 16.2 — route groups `(folder)` не попадают в URL; nested `layout.tsx` через `children` (`/vercel/next.js/v16.2.2`).

---

## Purpose

Implementation-spec для AI-агента: перенос **shared UI primitives** (typography atoms, tokenized Button/Link/Card) из [`docs/example_components/`](../../../example_components/) в `apps/web`, дополнение **design tokens** в `globals.css`, и создание **Design Lab page** — dev-only маршрута для визуальной сверки всех вариантов компонентов с HTML-прототипом.

**Аудитория:** AI-агенты фазы P01; frontend implementers; design QA.

**Цель продукта:** единый визуальный фундамент Warm Forest **до** массовой реализации экранов P02–P05; снижение drift между generic shadcn и прототипом.

---

## Agent execution cycle (обязательно)

Следовать [`ai_first_project_methodology.md`](../../../meta/ai_first_project_methodology.md) §2:

```text
КОНТЕКСТ → ФАЗА → КОНТРАКТ → ЗАДАЧИ → ВЕРИФИКАЦИЯ
```

| Шаг | Действие агента |
|-----|-----------------|
| **КОНТЕКСТ** | Прочитать этот spec + `visual_identity_contract.md` + открыть соответствующий экран в [`Fitness_Platform_Prototype_v1.html`](../../../prototypes/Fitness_Platform_Prototype_v1.html); для новых primitives — **Context7** (§ Component catalog placement) |
| **ФАЗА** | P01 — не расширять scope за пределы spec без ADR/contract |
| **КОНТРАКТ** | Этот документ + Cursor Rules (§ Enforcement ниже) |
| **ЗАДАЧИ** | Чеклист § Implementation tasks (ordered) |
| **ВЕРИФИКАЦИЯ** | § Acceptance criteria + `npm run lint` + ручная сверка Design Lab на 390px и `md` |

---

## Source-of-truth hierarchy

При конфликте — порядок из [`pulse-project-context.mdc`](../../../../.cursor/rules/pulse-project-context.mdc):

1. **Cursor Rules** (`.cursor/rules/*.mdc`)
2. **`AGENTS.md`** / [`apps/web/AGENTS.md`](../../../../apps/web/AGENTS.md)
3. **Contracts** → **PRD** → **Design contracts** → **Guidelines** → **HTML prototype**

**Visual parity:** прототип subordinate к Cursor Rules и PRD. Если прототип противоречит PRD — побеждает PRD; зафиксировать drift в commit/PR comment.

---

## Scope / Out of scope

### In scope (Phase 1 — этот spec)

| Область | Deliverable |
|---------|-------------|
| CSS tokens | Дополнительные card/elevation/shadow tokens в `globals.css` |
| Typography atoms | `Heading`, `SectionTitle`, `ContentText`, `AlertText` |
| Actions | Tokenized `Button` (replace shadcn default) |
| Navigation primitive | `CustomLink` |
| Surfaces | shadcn `Card*` + **`PulseCard`** (CVA; rename from design kit `BsfyCard`) |
| Design Lab | `/design-system` dev-only page, L1 Tokens + L2 Primitives + L3 Patterns (minimal) |
| Docs sync | `canonical_routes.md`, `P01_tasks.md` — см. § Documentation updates |

### Out of scope (Phase 2 — отдельные задачи P02+)

- Tokenization всех 55 shadcn primitives в `components/ui/`
- Storybook / Chromatic
- Playwright visual regression CI
- Side-by-side iframe прототипа (optional post-MVP lab v2)
- Domain/feature molecules (`TrainerCard`, `BookingRow` — в specs фаз P02–P05)
- `@/lib/messages` для lab placeholder copy (допустим dev-only literal strings с пометкой `// design-lab-only`)

---

## Mandatory enforcement — Cursor Rules

Агент **MUST** соблюдать следующие правила при реализации. Нарушение = reject на verification.

### Always applied (весь `apps/web`)

| Rule file | Что проверять при реализации |
|-----------|------------------------------|
| [`pulse-project-context.mdc`](../../../../.cursor/rules/pulse-project-context.mdc) | Next.js **16.2.6**, Warm Forest, не расширять beyond P01 без фазы |
| [`product-docs-alignment.mdc`](../../../../.cursor/rules/product-docs-alignment.mdc) | Обновить `canonical_routes.md` при добавлении `/design-system` |
| [`typescript-monorepo-types.mdc`](../../../../.cursor/rules/typescript-monorepo-types.mdc) | `npm run typecheck` после scaffold packages; no ad-hoc types in atoms |
| [`ai-dry-deduplication.mdc`](../../../../.cursor/rules/ai-dry-deduplication.mdc) | Один CVA source (`buttonVariants`, `contentTextVariants`); matrix in `lib/design-lab/` |
| [`react-one-component-per-file.mdc`](../../../../.cursor/rules/react-one-component-per-file.mdc) | Один named export на `*.tsx`; target ≤ **140 lines** per feature UI file |
| [`react-naming-conventions.mdc`](../../../../.cursor/rules/react-naming-conventions.mdc) | PascalCase components; kebab-case util files; `SCREAMING_SNAKE` constants |

### UI & design system (shared components + Design Lab)

| Rule file | Что проверять |
|-----------|---------------|
| [`ui-warm-forest-shadcn.mdc`](../../../../.cursor/rules/ui-warm-forest-shadcn.mdc) | Semantic tokens only (`bg-primary`, `text-muted-foreground`); Manrope/Source Serif 4/Mono; states empty/loading/error |
| [`ui-prototype-fidelity.mdc`](../../../../.cursor/rules/ui-prototype-fidelity.mdc) | Сверка каждого L2/L3 блока с прототипом: font, size, weight, radius, spacing |
| [`ui-mobile-first.mdc`](../../../../.cursor/rules/ui-mobile-first.mdc) | Base = mobile; touch targets ≥ **44×44px**; Design Lab viewport control 390px |
| [`ui-semantics-a11y.mdc`](../../../../.cursor/rules/ui-semantics-a11y.mdc) | Semantic HTML; icon-only `aria-label`; `AlertText role="alert"`; WCAG 2.1 AA contrast |
| [`ui-icons-lucide.mdc`](../../../../.cursor/rules/ui-icons-lucide.mdc) | Lab examples: `lucide-react` individual imports only |
| [`react-ui-components.mdc`](../../../../.cursor/rules/react-ui-components.mdc) | RSC default; `'use client'` only where needed; `cn()` + cva; no `React.FC` |
| [`react-logic-presentation.mdc`](../../../../.cursor/rules/react-logic-presentation.mdc) | Lab sections = presentational; no fetch/policy in showcase components |

### Next.js runtime (Design Lab route)

| Rule file | Что проверять |
|-----------|---------------|
| [`nextjs-vercel-app-router.mdc`](../../../../.cursor/rules/nextjs-vercel-app-router.mdc) | `next@16.2.6`; async `params`/`searchParams` if used; no Next 15 patterns |
| [`app-router-streaming-loading.mdc`](../../../../.cursor/rules/app-router-streaming-loading.mdc) | Design Lab — static page; `loading.tsx` optional (simple skeleton) |

### Не применяются к Design Lab (но применяются к Button в product forms)

| Rule file | Note |
|-----------|------|
| [`ui-toast-mutations.mdc`](../../../../.cursor/rules/ui-toast-mutations.mdc) | Lab demo buttons — no real mutations |
| [`ui-mutation-pending.mdc`](../../../../.cursor/rules/ui-mutation-pending.mdc) | Demo `loading` state on Button — visual only |
| [`ui-optimistic-mutations.mdc`](../../../../.cursor/rules/ui-optimistic-mutations.mdc) | N/A for lab |
| [`ui-messages-and-copy.mdc`](../../../../.cursor/rules/ui-messages-and-copy.mdc) | Product screens — `@/lib/messages`; lab may use literals |

---

## Mandatory enforcement — Guidelines

| Guideline | Применение |
|-----------|------------|
| [`typography_text_guidelines.md`](../../../guidelines/typography_text_guidelines.md) | Atoms policy; one `h1` per lab section page; `visualLevel` for hero scale |
| [`visual_identity_contract.md`](../../../design/visual_identity_contract.md) | Token names; primary vs accent; radius/elevation; dark via CSS vars |
| [`styleguide.md`](../../../design/styleguide.md) | Button/Card/Badge/KPI recipes for L3 patterns |
| [`ux_ui_principles.md`](../../../design/ux_ui_principles.md) | P4 One Primary Action per pattern demo |
| [`accessibility_requirements.md`](../../../design/accessibility_requirements.md) | Contrast verification light + dark |
| [`ai_component_guidelines.md`](../../../guidelines/react/ai_component_guidelines.md) | Component structure, props interfaces |
| [`ai_semantics_a11y_guidelines.md`](../../../guidelines/react/ai_semantics_a11y_guidelines.md) | Landmarks in lab layout (`main`, `nav`) |
| [`ai_react_utilities_guidelines.md`](../../../guidelines/react/ai_react_utilities_guidelines.md) | `cn()` from `@/lib/utils` |
| [`ai_react_hooks_guidelines.md`](../../../guidelines/react/ai_react_hooks_guidelines.md) | Client hooks only in `*.client.tsx` lab controls |

**shadcn MCP:** перед hand-roll primitives — проверить [`react-ui-components.mdc`](../../../../.cursor/rules/react-ui-components.mdc); Button/Card **customize** через tokens, не дублировать upstream файлы без причины.

---

## Design sources (read before coding)

| Source | Path | Role |
|--------|------|------|
| Design kit (copy source) | [`docs/example_components/`](../../../example_components/) | Reference implementation atoms + CVA |
| Prototype | [`docs/prototypes/Fitness_Platform_Prototype_v1.html`](../../../prototypes/Fitness_Platform_Prototype_v1.html) | Visual ground truth |
| Prototype mapping | [`prototype_route_mapping.md`](../../../design/prototype_route_mapping.md) | screen ID → L3 pattern anchor |
| Visual tokens | [`visual_identity_contract.md`](../../../design/visual_identity_contract.md) | Canonical token names |
| Interim DS archive | [`fitness-platform-design-system.md`](../../../default_docs/fitness-platform-design-system.md) | Detail when contract silent |
| Component recipes | [`styleguide.md`](../../../design/styleguide.md) | L3 composed patterns |

### Prototype fidelity workflow (MUST per component)

1. Открыть HTML-прототип → найти экран из § Prototype anchors.
2. Inspect: font family, size, weight, color role, padding, radius, shadow.
3. Map to semantic token / atom variant — **не** copy raw hex into JSX.
4. Реализовать через shared component + CVA variant.
5. Добавить секцию на Design Lab с label «Prototype: `{screenId}`».
6. Verify на **390px** и **≥768px**.

---

## Token migration — `globals.css`

Текущий `apps/web/src/app/globals.css` содержит Warm Forest shadcn mapping, но **не хватает** tokens для design kit Card/Button hover shadows.

**MUST add** to `:root` and `.dark` (values from [`example_components/README.md`](../../../example_components/README.md) § Token reference + prototype):

| Token | Purpose |
|-------|---------|
| `--forest`, `--forest-mid`, `--gold`, `--gold-light`, `--cream`, `--cream-border` | Brand refs for CVA |
| `--green-soft`, `--amber-soft` | PulseCard `state=active|warning` |
| `--shadow-card`, `--shadow-hover`, `--shadow-overlay` | Card elevation |
| `--card-radius-sm` … `--card-radius-xl` | PulseCard variants |
| `--card-p-sm`, `--card-p-md`, `--card-p-lg` | PulseCard padding |
| `--green-text` | Success text (stat labels) |

**MUST add** to `@theme inline` (if used as Tailwind colors):

| Utility | Source |
|---------|--------|
| `text-subtle-foreground` | Map to ink-3 / muted tertiary |
| `bg-primary-container`, `text-on-primary-container` | Already in design kit button tonal variant |

**MUST NOT:** hardcode `#2D5A40` etc. in component TSX — only semantic classes or `var(--token)`.

**SHOULD:** migrate elevation constants to `apps/web/src/lib/ui/elevation.ts` per styleguide note.

---

## Shared components — inventory & adaptation

### Product UI catalog contract (MUST for P02+)

Все product-экраны (`apps/web/src/app/**`, кроме `(dev)/design-system`) **MUST** строиться из **канонического каталога shared UI**, визуализированного на **Design Lab** `/design-system`.

| Роль | Путь в репозитории | Import в product code |
|------|--------------------|-----------------------|
| **Design Lab (индекс)** | `apps/web/src/app/(dev)/design-system/` | URL `/design-system` — dev-only showcase; **не импортировать** |
| **Typography atoms** | `apps/web/src/components/atoms/` | `@/components/atoms` |
| **Tokenized primitives** | `apps/web/src/components/ui/` | `@/components/ui/{Component}` |
| **App shell (layout chrome)** | `apps/web/src/components/shell/` | `@/components/shell/*` — см. [`global_shell_spec.md`](./global_shell_spec.md) |
| **Domain molecules** | `apps/web/src/components/{domain}/` | `@/components/catalog/*`, `booking/*`, `trainer/*`, `admin/*` |
| **Design tokens** | `apps/web/src/app/globals.css` | semantic Tailwind / CSS variables |
| **UI helpers (non-JSX)** | `apps/web/src/lib/ui/` | status maps, elevation — не product UI-import как компонент |
| **Variant matrices (reference)** | `apps/web/src/lib/design-lab/` | read-only для сверки; не UI-import |
| **Showcase sections (lab-only)** | `apps/web/src/components/design-lab/` | **MUST NOT** import в product routes |

**Контракт для агента:**

1. Перед новым UI — открыть `/design-system` локально (или прочитать L2/L3 секции spec + `matrices.ts`).
2. Импортировать только из `@/components/atoms` и `@/components/ui/*`.
3. L3 patterns (KPI card, empty state, section header) — **компоновать** из catalog primitives по [`styleguide.md`](../../../design/styleguide.md); не копировать разметку из `design-lab/` fixtures.
4. Новый повторяющийся primitive → добавить в `components/atoms/` или `components/ui/`, обновить Design Lab секцию, затем использовать на product routes.
5. Domain molecules (`TrainerCard`, `BookingRow`) — `components/{domain}/`; внутри **только** catalog imports (`atoms/`, `ui/`, при необходимости `shell/`).
6. Размещение каждого нового компонента — по § **Component catalog placement & Phase 2–3 inventory**; FAANG UX + prototype parity обязательны.

**Enforcement:** Cursor Rules **ui-warm-forest-shadcn** §Design Lab catalog, **react-logic-presentation**, **react-ui-components**, **ui-prototype-fidelity**.

**Context7 verified:** route group `(dev)` не попадает в URL — `/design-system` maps to `app/(dev)/design-system/page.tsx` ([Next.js v16.2 route groups](https://github.com/vercel/next.js/blob/v16.2.2/docs/01-app/03-api-reference/03-file-conventions/route-groups.mdx)).

### Copy map (design kit → apps/web)

| From (`docs/example_components/`) | To (`apps/web/src/`) | Action |
|-------------------------------------|----------------------|--------|
| `components/atoms/**` | `components/atoms/**` | Copy + adapt variants |
| `components/ui/button.tsx` | `components/ui/button.tsx` | **Replace** current shadcn default |
| `components/ui/CustomLink.tsx` | `components/ui/CustomLink.tsx` | **Add** |
| `components/ui/card.tsx` | `components/ui/card.tsx` | **Merge**: keep shadcn `Card*` slots + add `PulseCard` |
| `lib/utils.ts` | `lib/utils.ts` | Skip if identical `cn()` exists |

### Rename: `BsfyCard` → `PulseCard`

Design kit uses `BsfyCard` / `bsfyCardVariants` (lampto legacy).

**MUST:**

- Export `PulseCard`, `pulseCardVariants`, `PulseCardProps`
- `bsfyCardVariants` → `pulseCardVariants` internally
- Update all lab section imports
- **MUST NOT** leave `Bsfy` prefix in production `apps/web` code

### Lampto domain cleanup (MUST remove on copy)

**Button** — удалить variants без Pulse MVP reference:

- `leaderPrimaryCta`, `editorSave`, `submitDay`

**ContentText** — удалить variants:

- `passageTriggerTitle`, `verseReading`, `streakSecondary`

**Add later (Phase 2)** only when wireframe requires: gold accent CTA, domain-specific labels.

---

## Component specifications

### Typography atoms (`components/atoms/`)

| Component | Key props | Variants / notes |
|-----------|-----------|------------------|
| `Heading` | `as`, `visualLevel?`, `variant?` | `visualLevel`: display, h1–h6; `variant`: default, brand |
| `SectionEyebrow` | `tone?` | Outline pill for marketing section labels (P16 landing); `components/atoms/SectionEyebrow/` |
| `SectionTitle` | `as?`, `variant?` | Composes Heading; centered marketing titles |
| `ContentText` | `as?`, `variant?` | See § ContentText variants (Pulse MVP set) |
| `AlertText` | — | Fixed `role="alert"`; form-level errors |

**Barrel:** `components/atoms/index.ts` — `export { Heading, … } from …`

**Golden rule:** new repeating text role → add variant in `content-text-variants.ts`; **never** override `text-*` from product `className` (layout only).

#### ContentText variants — Pulse MVP canonical set

| Variant | Usage in Pulse |
|---------|----------------|
| `body` | Primary paragraph |
| `bodyMuted` | Default secondary body |
| `subtitleLg`, `lead` | Hero / landing intros |
| `small`, `smallEmphasis`, `muted`, `subtle` | Card meta, descriptions |
| `mutedMicro`, `hint`, `subtleFine` | Fine print, timestamps |
| `blockLabel`, `statusLabel`, `caption` | Section labels, uppercase captions |
| `smallEmphasisPrimary`, `eyebrowOnBrand` | Links emphasis, brand eyebrows |
| `statValue` | KPI numbers (trainer/admin dashboard) |

### Button (`components/ui/button.tsx`)

| Dimension | Values |
|-----------|--------|
| **variant** | `default`, `outline`, `secondary`, `ghost`, `tonal`, `destructive`, `link` |
| **size** | `xs`, `sm`, `default`, `lg`, `icon`, `icon-xs`, `icon-sm`, `icon-lg` |
| **state** | default, disabled, `loading` (spinner + `data-loading`) |
| **composition** | `asChild` + Radix Slot for Next.js `<Link>` |

**Visual canon (prototype):** `rounded-full`, h-11 default, `active:scale-[0.97]`, forest primary hover.

**Hierarchy (P4):** one `default` per pattern demo block.

**Dev a11y:** warn in console when icon-only without `aria-label` (keep from design kit).

### CustomLink (`components/ui/CustomLink.tsx`)

| `as` mode | Usage |
|-----------|--------|
| `text` | In-content links; `variant="quiet"` for footer |
| `button` | `<a>` styled via `buttonVariants` |
| `icon` | Icon-only; **requires** `aria-label` |

**App Router pattern:**

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

<Button asChild>
  <Link href="/trainers">Browse trainers</Link>
</Button>
```

**MUST NOT** use `legacyBehavior` / `passHref`.

### Card system (`components/ui/card.tsx`)

**Keep** shadcn primitives: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`, `CardAction` — used by Dialog, Sheet, forms.

**Add** `PulseCard`:

| variant | Usage |
|---------|--------|
| `base` | Dashboard blocks, forms |
| `elevated` | Hero / today session panel |
| `compact` | List items (bookings, queue rows) |
| `row` | Horizontal task/diary rows |

| Modifier | Values |
|----------|--------|
| `interactive` | boolean — hover/focus affordances |
| `state` | `default`, `active`, `warning`, `muted` |

**Compound rule:** `interactive + state="muted"` → no pointer events (from design kit).

### Form controls (`components/ui/` — Phase 2)

Tokenize shadcn primitives to Warm Forest / prototype parity. Composition via `Field` + `FieldLabel` + `FieldError` per [`forms_and_validation_ux.md`](../../../design/forms_and_validation_ux.md).

| Component | Key props | Variants / notes |
|-----------|-----------|------------------|
| `Input` | `size?` | `default` (h-12), `compact` (admin h-10), `search` (rounded-full) |
| `Textarea` | `size?` | `default`, `compact`; counter pattern in product via sibling text |
| `Checkbox` | `size?` | `default` (20px), `sm`; touch padding via `after` pseudo |
| `RadioGroupItem` | `variant?` | `default`, `tile` (role/filter), `card` (label wrap) |
| `Switch` | `size?` | `default` (h-7 w-12 per prototype), `sm` |
| `Field*` | `orientation?` | Vertical gap `1.5`; label `13px`, hint/error `12px` |

**Lab section:** `DesignLabForms.client.tsx` + `DesignLabInputFixture.tsx` — matrix size × state; role tiles; terms checkbox; switch row; payment 2-col.

---

## Component catalog placement & Phase 2–3 inventory

**Статус:** Canonical (расширение catalog contract)  
**Применяется:** Phase 2–3 Design Lab + **P03–P13** product UI  
**Связанные UX-контракты:** [`ux_ui_principles.md`](../../../design/ux_ui_principles.md), [`forms_and_validation_ux.md`](../../../design/forms_and_validation_ux.md), [`accessibility_requirements.md`](../../../design/accessibility_requirements.md), [`styleguide.md`](../../../design/styleguide.md)

Нормы зрелых consumer/enterprise продуктов (informally «FAANG-level») адаптированы для Pulse из [`ux_ui_principles.md`](../../../design/ux_ui_principles.md) и lampto [`ux_ui_faang_principles_for_agents.md`](../../../examples/lampto/docs/design/ux_ui_faang_principles_for_agents.md). **Visual canon** — Warm Forest + HTML-прототип; FAANG-контракт задаёт **поведение, состояния и a11y**, не подменяя токены прототипа.

### Agent prerequisites — Context7 (MUST)

Перед реализацией **любого** компонента из inventory ниже агент **MUST**:

1. **`resolve-library-id`** → **`query-docs`** (Context7 MCP) для актуальных API — не полагаться только на training data.
2. Сверить визуал с [`Fitness_Platform_Prototype_v1.html`](../../../prototypes/Fitness_Platform_Prototype_v1.html) (§ Prototype column) + [`fitness-platform-design-system.md`](../../../default_docs/fitness-platform-design-system.md).
3. Пройти § **FAANG UX/UI contract** и § **Per-component verification** для строки inventory.

| Задача | Context7 library (приоритет) | Query focus |
|--------|------------------------------|-------------|
| shadcn/Radix primitives | `/websites/ui_shadcn` | Component API, `Field`/`aria-invalid`, Dialog/Sheet focus trap, Tabs |
| Next.js App Router / RSC | `/vercel/next.js/v16.2.2` | `'use client'` boundary, route groups, Server Components |
| Forms + a11y | `/websites/ui_shadcn` + [`ai_semantics_a11y_guidelines.md`](../../../guidelines/react/ai_semantics_a11y_guidelines.md) | labels, `aria-describedby`, keyboard |
| Calendar / date UI | `/websites/ui_shadcn` | `Calendar`, selection, disabled dates |

**MUST NOT:** hand-roll Radix behavior (focus trap, roving tabindex, switch/checkbox semantics) без сверки Context7.

**SHOULD:** зафиксировать в PR comment «Context7 verified: `{libraryId}` — {topic}».

### Catalog layers — decision tree

```text
Typography text role only?           → components/atoms/
shadcn/Radix or tokenized control?   → components/ui/ (tokenize in place if exists)
Cross-role composed block (≥2 roles)? → components/ui/ (catalog L3) OR styleguide recipe
Global nav / top bar / app chrome?   → components/shell/
Domain-specific card/row/wizard?     → components/{catalog|booking|trainer|admin}/
Design Lab matrix / fixtures only?   → components/design-lab/ (never product import)
Status/domain maps, elevation?       → lib/ui/ or @pulse/domain (no JSX)
```

**MUST NOT** создавать `components/patterns/` — cross-role L3 живёт в `ui/` (прецедент: `PulseCardKpi`) или в domain folder.

**MUST NOT** класть в `atoms/`: chips, badges, stars, inputs — только typography atoms.

### FAANG UX/UI contract (MUST — каждый компонент inventory)

Каждый компонент из таблиц ниже **MUST** удовлетворять **все** применимые строки:

| ID | Принцип | Требование | Pulse enforcement |
|----|---------|------------|-------------------|
| **FX-1** | Predictability | Одинаковые паттерны на sibling routes (CTA placement, labels) | [`ux_ui_principles.md`](../../../design/ux_ui_principles.md) P4; `@/lib/messages` |
| **FX-2** | Hierarchy | Один primary focus; secondary не конкурирует | P4 One Primary Action; `Button` variant `default` |
| **FX-3** | Progressive disclosure | Сложность по шагам (wizard, tabs, sheet) | P1; booking 3 steps, onboarding ~5 |
| **FX-4** | Production states | `default`, `hover`, `focus`, `disabled`, `error`, `empty`, `loading` — где применимо | [`ui_states_contract.md`](../../../design/ui_states_contract.md); Lab matrix |
| **FX-5** | Accessibility | WCAG 2.1 AA: names, contrast, keyboard, focus visible | **ui-semantics-a11y**; Radix/shadcn first |
| **FX-6** | Mobile-first | Base = 390px; touch ≥ **44×44px**; thumb-zone CTAs | **ui-mobile-first** |
| **FX-7** | Immediate feedback | Mutations: pending + toast; toggles: optimistic optional | **ui-mutation-pending**, **ui-toast-mutations** |
| **FX-8** | Zero dead ends | Empty/error с CTA | P2 Zero Dead Ends |
| **FX-9** | Prototype fidelity | Font, size, weight, radius, spacing, semantic colors из прототипа | **ui-prototype-fidelity**; § Prototype fidelity workflow |
| **FX-10** | Trust & privacy | Не показывать лишние PII; destructive → confirm | user flows + **forms_and_validation_ux** F6 |

### Component inventory — `components/atoms/`

| Component | Status | Prototype / styleguide | FAANG UX notes |
|-----------|--------|------------------------|----------------|
| `Heading` | ✅ Phase 1 | Hero, page titles | One `h1` per view; visualLevel for scale |
| `SectionTitle` | ✅ Phase 1 | Marketing sections | Scannability; centered variant documented |
| `ContentText` | ✅ Phase 1 | Body, meta, KPI numbers | No ad-hoc `text-*` in product routes |
| `AlertText` | ✅ Phase 1 | Form-level errors | `role="alert"`; not sole error channel on forms (F2-MUST-4) |

### Component inventory — `components/ui/` (L2 primitives)

| Component | Target file | Phase | Prototype anchor | FAANG UX notes |
|-----------|-------------|-------|------------------|----------------|
| `Button` | `button.tsx` | ✅ 1 | `c.book`, CTAs | FX-2, FX-6; loading + `aria-busy` |
| `CustomLink` | `CustomLink.tsx` | ✅ 1 | `c.home` «All →» | FX-5; icon `aria-label` |
| `PulseCard`, `Card*` | `card.tsx` | ✅ 1 | `c.bookings`, cards | FX-4 interactive/hover; keyboard if clickable |
| `Container` | `container.tsx` | ✅ 1 | page width | Responsive padding mobile-first |
| `Input`, `Textarea`, `Field*` | `input.tsx`, etc. | ✅ 2a | `c.book` payment, catalog search | FX-5 labels; FX-4 error/disabled; Context7 Field pattern |
| `Checkbox`, `RadioGroup`, `Switch` | respective | ✅ 2a | onboarding terms, filters, `t.services` | FX-6 touch; FX-5 fieldset/legend for groups |
| `RatingStars` | `RatingStars.tsx` | 2b | TrainerCard, reviews | **Gold** `text-secondary`; interactive: keyboard stars |
| `SpecChip` | `SpecChip.tsx` | 2b | Trainer specializations | Display-only; not interactive filter |
| `FilterChip` | `FilterChip.tsx` | 2c | `c.catalog` mobile chips | FX-7 instant filter response; selected state clear |
| `PhotoSlot` | `PhotoSlot.tsx` | 2b | TrainerCard, onboarding photo | Empty/upload states; meaningful `alt` when image |
| `Tabs` (pill) | `tabs.tsx` | 2b | Trainer profile, schedule | FX-3; mobile `overflow-x-auto`; Context7 Tabs |
| `Badge` / `StatusBadge` | `badge.tsx` or `StatusBadge.tsx` | 2b | `c.bookings`, admin queue | Domain status from `@pulse/domain`; labels `@/lib/messages` |
| `Avatar` | `avatar.tsx` | 2b | everywhere | Size matrix xs→2xl; fallback initials |
| `VerifiedBadge` | `VerifiedBadge.tsx` | 2b | TrainerCard check | Decorative icon `aria-hidden`; trust signal in text nearby |
| `Sheet`, `Dialog` | `sheet.tsx`, `dialog.tsx` | 2c | filters mobile, new service | FX-6 bottom sheet `< md`; focus trap; Escape |
| `Progress` | `progress.tsx` | 2c | booking/onboarding wizard | Visible step label + bar; FX-3 |
| `Slider` | `slider.tsx` | 2c | catalog max price | FX-5 label + value; `accent-primary` |
| `Skeleton` | `skeleton.tsx` | 2c | async lists | FX-4; shape matches final layout (P6) |
| `Empty` | `empty.tsx` | ✅ L3 demo | empty lists | FX-8 mandatory CTA |
| `FileUploadZone` | `FileUploadZone.client.tsx` | 3 | cert upload P04 | FX-4 uploading/error; per-file errors |
| `Calendar` | `calendar.tsx` | 3 | schedule exceptions | FX-6 day cells ≥44px; blocked/today states |
| `DatePickerField` | `DatePickerField.client.tsx` | 3 | onboarding birth date, booking | Popover + grid month/year dropdown; hidden ISO input; `disableFuture` / `disablePast` |
| `DayPill` | `DayPill.tsx` | 2c | `ScheduleGrid` | Horizontal scroll; selected primary |
| `TimeSlotButton` | `TimeSlotButton.tsx` | 2c | booking step 2 | Disabled + line-through; FX-6 h-11 |
| `SchedulePicker` | `SchedulePicker.client.tsx` | 2c | `c.book` step 2 | Compose DayPill + TimeSlot; timezone label |
| `SearchTrigger` | `SearchTrigger.tsx` | 2c | `c.home` search affordance | Navigational button, not fake input without action |
| `IconBadge` | `IconBadge.tsx` | 2c | admin nav counts | FX-5; not color-alone (pair with number) |

**Radio `tile` / `card` variants** — остаются в `radio-group.tsx`; отдельный `FilterTile` **не** создавать.

### Component inventory — `components/ui/` (cross-role L3 catalog)

| Component | Target file | Phase | Prototype anchor | FAANG UX notes |
|-----------|-------------|-------|------------------|----------------|
| `PulseCardKpi` | `PulseCardKpi.tsx` | ✅ L3 | `t.home`, `a.home` | Scannable stat; tone semantic |
| `SectionHeader` | `SectionHeader.tsx` | 2c | `c.home` sections | Title + optional `CustomLink`; FX-2 |
| `PageHeader` | `PageHeader.tsx` | 2c | list pages | h1 + secondary action; admin max-width inputs |
| `KeyValueRow` | `KeyValueRow.tsx` | 2c | booking confirm, payment | Scannable pairs; truncate long values |
| `ChoiceCard` | `ChoiceCard.tsx` | 2c | booking service pick | Selected border primary; FX-6 full-width tap |
| `WizardHeader` | `WizardHeader.tsx` | 2c | `c.book` | Back + step + price; progress sibling |
| `SummaryCard` | `SummaryCard.tsx` | 2c | booking sidebar md+ | Sticky; FX-2 no competing CTA inside |
| `MetaRow` | `MetaRow.tsx` | 2c | service duration/price | Icon `aria-hidden`; text from messages |

### Component inventory — `components/shell/`

| Component | Target file | Phase | Prototype anchor | FAANG UX notes |
|-----------|-------------|-------|------------------|----------------|
| `AppTopBar` | `shell/AppTopBar.tsx` | P03 | RoleSwitcher area | Sticky; safe-area; FX-1 |
| `BottomNav` | `shell/BottomNav.client.tsx` | P03 | `BottomNav` | FX-6; `aria-current`; safe-area inset |
| `SideNav` | `shell/SideNav.client.tsx` | P03 | `SideNav` | Distinct `aria-label`; badge counts |
| `NavItem` | `shell/NavItem.tsx` | P03 | nav items | 44px touch; active state container |
| `AppShell` | `shell/AppShell.tsx` | P03 | layout compose | Landmarks: `nav`, `main` |

Spec: [`global_shell_spec.md`](./global_shell_spec.md). Shell **MUST NOT** import domain molecules.

### Component inventory — `components/{domain}/` (L4 molecules)

Domain folders **MUST** compose only from `atoms/`, `ui/`, `shell/`. Lab показывает **fixture import**, не копию JSX.

| Component | Folder | Phase | Prototype anchor | FAANG UX notes |
|-----------|--------|-------|------------------|----------------|
| `TrainerCard` | `catalog/` | P05 | `c.catalog`, `c.home` | Whole card one focus target + wishlist separate; FX-8 |
| `BookingListItem` | `booking/` | P08 | `c.bookings` | StatusBadge + compact PulseCard |
| `BookingWizard` | `booking/` | P07 | `c.book` | P1 wizard; FX-3; sticky footer CTA P3 |
| `ReviewForm` | `booking/` | P09 | reviews | Interactive RatingStars required |
| `ServiceCard` | `trainer/` | P11 | `t.services` | Switch optimistic optional; FX-7 |
| `ClientListCard` | `trainer/` | P12 | `t.clients` | Search + empty state |
| `ModerationQueueRow` | `admin/` | P13 | `a.trainers` | Approve/Reject hierarchy P4; confirm reject |

### `lib/ui/` helpers (non-components)

| Module | Purpose |
|--------|---------|
| `lib/ui/elevation.ts` | Shadow/radius constants |
| `lib/ui/status-badge.ts` | Map domain status → Badge variant (types from `@pulse/domain`) |

### Phase roadmap (Design Lab sections)

| Phase | Deliverables | New Lab section |
|-------|--------------|-----------------|
| **2b** | RatingStars, SpecChip, PhotoSlot, Tabs; tokenize Avatar, StatusBadge | `DesignLabMedia.tsx` or extend existing L2 |
| **2c** | SectionHeader, ChoiceCard, FilterChip, SchedulePicker, WizardHeader, Progress | `DesignLabPatterns` + dedicated subsections |
| **3** | Shell fixtures (optional dev), FileUploadZone, Calendar; domain fixtures import | Link from Lab to molecule fixture |

Обновлять `lib/design-lab/matrices.ts`, `prototype-refs.ts`, `LAB_SECTIONS` при каждом новом L2 блоке.

### Per-component verification (agent checklist)

Для **каждой** строки inventory перед merge:

- [ ] **Context7** queried (library + topic recorded in PR or task comment)
- [ ] Prototype screen opened; visual params mapped to semantic tokens (FX-9)
- [ ] Design Lab section with `Prototype: {screenId}` label
- [ ] Matrix: default + error/disabled/loading/empty where applicable (FX-4)
- [ ] Verified **390px** + **≥768px** + light + dark
- [ ] FX-5: keyboard, labels, contrast; FX-6: touch targets
- [ ] Product import path matches § Catalog layers (no `design-lab/` import)
- [ ] `npm run lint` + typecheck pass

### Anti-patterns (MUST NOT)

| Anti-pattern | Correct approach |
|--------------|------------------|
| Duplicate `FilterTile` component | `RadioGroupItem variant="tile"` |
| Typography chip in `atoms/` | `ui/SpecChip` |
| Copy JSX from `design-lab/` into routes | Import catalog + compose |
| Generic shadcn look without prototype pass | Tokenize per § Prototype fidelity workflow |
| Checkbox for catalog filter chips | `FilterChip` / tile pattern per prototype |
| Skip Context7 for Radix/shadcn | MUST query before implement |

---

## Design Lab page

### Route & layout

```text
apps/web/src/app/
  (dev)/
    design-system/
      layout.tsx      # dev guard; minimal chrome; ThemeProvider if not inherited
      page.tsx        # thin compose — L1/L2/L3 sections
```

| Property | Value |
|----------|-------|
| **URL** | `/design-system` |
| **Route group** | `(dev)` — не в URL ([Next.js route groups](https://github.com/vercel/next.js/blob/v16.2.2/docs/01-app/03-api-reference/03-file-conventions/route-groups.md)) |
| **Auth** | Public locally; **blocked in production** |
| **App shell** | **MUST NOT** wrap in `(client)`/`(admin)` AppShell — standalone minimal layout |

### Production guard (MUST)

In `layout.tsx` or `page.tsx`:

```tsx
import { notFound } from "next/navigation";

if (
  process.env.NODE_ENV === "production" &&
  process.env.ALLOW_DESIGN_LAB !== "1"
) {
  notFound();
}
```

**SHOULD:** exclude `/design-system` from sitemap/robots if sitemap exists.

**MUST:** add route to [`canonical_routes.md`](../../../design/canonical_routes.md) with flag **dev-only**.

### Page structure — three levels

#### L1 — Tokens

Swatches / tables:

- Brand colors (primary, secondary/gold, surfaces, ink, status)
- Radius scale (`--radius-sm` … `--card-radius-xl`)
- Elevation samples (`--shadow-card`, hover, overlay)
- Type scale samples (`font-heading`, `font-sans`, `font-mono` at canonical sizes)

#### L2 — Primitives (full variant matrix)

Data-driven from `lib/design-lab/matrices.ts`:

| Section | Matrix dimensions |
|---------|-------------------|
| Typography | All Heading visualLevels; all ContentText variants; SectionTitle; AlertText |
| Button | variants × sizes × states (default, disabled, loading) |
| CustomLink | as × variant combinations |
| PulseCard | variant × interactive × state grid |
| shadcn Card | Card + Header + Title + Description + Content + Footer example |

Each L2 block **MUST** include:

- Section heading (`Heading as="h2"`)
- Grid of examples with **variant label** (mono caption)
- Prototype anchor comment when applicable

#### L3 — Patterns (minimal Phase 1 set)

Composed blocks from [`styleguide.md`](../../../design/styleguide.md) — **not** new primitives:

| Pattern | Prototype screen | Styleguide § |
|---------|------------------|--------------|
| Primary CTA row | `c.book` | Button |
| KPI card (4-up grid) | `t.home`, `a.home` | KPI card |
| Booking list item (compact card) | `c.bookings` | Card interactive |
| Status badge row | `c.bookings`, `a.trainers` | Badge |
| Section header + «Все →» | `c.home` | Section header |
| Empty state block | any list empty | ui_states + `Empty` shadcn |

#### L3 — Marketing / Landing (P16, `#marketing`)

**Showcase:** `/design-system` → `DesignLabMarketing` (`id="marketing"`). **Product import:** `@/components/atoms`, `@/components/ui/*`, `@/components/catalog/*` only — **MUST NOT** import `@/components/design-lab/**` on product routes.

| Wave | Components | Path |
|------|------------|------|
| **Wave A** | `SectionEyebrow`, `Container` (`variant="marketing"`), `MarketingSectionHeader`, `TrustFeaturePill`, `StepCard`, `DiscoveryPill`, `TestimonialCard`, `StatMetricCell`, `StatsBar`, `BenefitRow`, `DarkStatTile`, `BrandSection`, `CtaBand`, `Reveal`, `MarketingAccordion` | `components/atoms/`, `components/ui/` |
| **L3 patterns** | `FeaturedTrainerCard` (vertical marketing card) | `components/catalog/FeaturedTrainerCard.tsx` |
| **Hooks** | `use-reveal-on-scroll`, `use-count-up`, `use-landing-scrolled`, `use-prefers-reduced-motion` | `lib/ui/` |
| **Fixtures (showcase)** | `marketing-fixtures.ts` | `lib/design-lab/` (dev-only) |

**Prototype:** [`Pulse Landing Page -Standalone-.html`](../../../prototypes/Pulse Landing Page -Standalone-.html) · **Spec:** [`public_landing_spec.md`](./public_landing_spec.md)

Phase 2 (partial — Forms L2): Input/Field/Textarea/Checkbox/Radio/Switch tokenization + `DesignLabForms` section.

Phase 2 (remaining — см. § Component catalog placement): RatingStars, SpecChip, PhotoSlot, Tabs pill; Phase 2c L3 catalog; Phase 3 shell + domain fixtures.

### Lab controls (client component)

File: `components/design-lab/DesignLabControls.client.tsx`

| Control | Behavior |
|---------|----------|
| Theme toggle | Light / Dark via `next-themes` |
| Viewport | CSS container widths: **390px**, 768px, 1280px |
| Section nav | Sticky anchor links to L1/L2/L3 |

**MUST:** verify all L2/L3 blocks at **390px** before marking done.

### Supporting modules

```text
apps/web/src/lib/design-lab/
  matrices.ts           # CVA keys → lab renderer input
  prototype-refs.ts     # sectionId → { screenId, wireframePath, note }
  types.ts              # shared lab types (optional)

apps/web/src/components/design-lab/
  DesignLabControls.client.tsx
  DesignLabSection.tsx          # presentational wrapper
  DesignLabTokenSwatches.tsx
  DesignLabTypography.tsx
  DesignLabButtons.tsx
  DesignLabLinks.tsx
  DesignLabCards.tsx
  DesignLabForms.client.tsx
  DesignLabInputFixture.tsx
  DesignLabPatterns.tsx
```

**One component per file** — each `DesignLab*.tsx` ≤ 140 lines; split if larger.

---

## Prototype anchors (L2/L3)

| Lab section | Prototype `screen` | Wireframe |
|-------------|-------------------|-----------|
| Button primary | `c.book` | [`booking_wizard.md`](../../../design/wireframes/mvp/booking_wizard.md) |
| PulseCard compact interactive | `c.bookings` | [`client_bookings_list.md`](../../../design/wireframes/mvp/client_bookings_list.md) |
| KPI pattern | `t.home` | [`trainer_dashboard.md`](../../../design/wireframes/mvp/trainer_dashboard.md) |
| Admin queue row | `a.trainers` | [`admin_trainers_queue.md`](../../../design/wireframes/mvp/admin_trainers_queue.md) |
| Hero typography | `/` P16 landing | [`public_landing.md`](../../../design/wireframes/mvp/public_landing.md), [`public_landing_spec.md`](../public_landing_spec.md) |
| SectionTitle | marketing blocks (P16) | [`public_landing.md`](../../../design/wireframes/mvp/public_landing.md) |

---

## Implementation tasks (ordered checklist for agent)

### Step 0 — Preflight

- [ ] Read this spec + `visual_identity_contract.md` + `styleguide.md` §Button, §Card
- [ ] Read § **Component catalog placement & Phase 2–3 inventory** for target paths + FAANG contract
- [ ] Open prototype screens listed in § Prototype anchors + inventory Prototype column
- [ ] **Context7:** resolve + query docs for components in scope (§ Agent prerequisites — Context7)
- [ ] Confirm `apps/web` on Next **16.2.6** per `package.json`

### Step 1 — Tokens

- [ ] Add missing CSS variables to `globals.css` (`:root`, `.dark`, `@theme inline`)
- [ ] Verify fonts wired in root `layout.tsx` (Source Serif 4, Manrope, JetBrains Mono; `latin` + `cyrillic` subsets)
- [ ] Optional: `lib/ui/elevation.ts`

### Step 2 — Atoms

- [ ] Create `components/atoms/` from design kit (with lampto cleanup)
- [ ] `content-text-variants.ts` — Pulse MVP set only
- [ ] `components/atoms/index.ts` barrel

### Step 3 — UI primitives

- [ ] Replace `components/ui/button.tsx` with tokenized version
- [ ] Add `components/ui/CustomLink.tsx`
- [ ] Merge `components/ui/card.tsx` — shadcn slots + `PulseCard`
- [ ] Fix any broken imports from button/card API change across `apps/web` (grep `Button`, `Card`)

### Step 4 — Design Lab route

- [ ] Create `(dev)/design-system/layout.tsx` with production guard
- [ ] Create `page.tsx` + lab section components
- [ ] Create `lib/design-lab/matrices.ts` + `prototype-refs.ts`
- [ ] Implement L1 + L2 full matrices
- [ ] Implement L3 minimal patterns (§ L3 table)

### Step 5 — Documentation sync

- [ ] Add `/design-system` to [`canonical_routes.md`](../../../design/canonical_routes.md) (dev-only)
- [ ] Add checklist items to [`P01_tasks.md`](../tasks/P01_tasks.md) § Design System Lab (or link this spec)
- [ ] Update [`implementation/mvp/README.md`](../README.md) specs table

### Step 6 — Verification

- [ ] `npm run lint`
- [ ] `npm run typecheck` (root, when packages exist) or `npx tsc --noEmit` in `apps/web`
- [ ] `npm run build -w web`
- [ ] Manual: `/design-system` loads locally; `notFound` in production build (or with guard)
- [ ] Manual: light + dark; 390px viewport; compare Button/Card/KPI to prototype
- [ ] Manual: icon-only Button/Llink warns without `aria-label` in dev console

---

## Acceptance criteria

### Tokens & components

- [ ] No raw hex/rgba in new component TSX (semantic tokens only)
- [ ] `components/atoms/` exports all four typography atoms
- [ ] `Button` matches prototype: pill, h-11 default, loading state, Warm Forest hover
- [ ] `PulseCard` replaces `BsfyCard` naming; all CVA variants render on lab page
- [ ] `CustomLink` three modes demonstrated
- [ ] Lampto-only variants removed from Button and ContentText
- [ ] shadcn `Card*` primitives still exported for Dialog/Sheet compatibility

### Design Lab

- [ ] Route `/design-system` accessible in development
- [ ] Production guard returns 404 (unless `ALLOW_DESIGN_LAB=1`)
- [ ] L1 token swatches for brand, radius, elevation, typography
- [ ] L2 exhaustive matrix for atoms, Button, CustomLink, PulseCard
- [ ] L3 at least 5 composed patterns with prototype anchors labeled
- [ ] Theme toggle + 390px viewport control functional
- [ ] Page uses semantic landmarks (`main`, `nav` for section index)
- [ ] No AppShell / role nav on lab page

### Process & docs

- [ ] Cursor Rules § enforced (spot-check ui-prototype-fidelity, ui-mobile-first, react-one-component-per-file)
- [ ] New components placed per § Component catalog placement; FAANG contract FX-1–FX-10 spot-check
- [ ] Context7 verification noted for Radix/shadcn/Next patterns where applicable
- [ ] `canonical_routes.md` updated
- [ ] Lint + typecheck pass

---

## Negative paths & edge cases

| Scenario | Expected behavior |
|----------|-------------------|
| Production deploy without env flag | `/design-system` → 404 |
| Missing `--shadow-card` token | PulseCard falls back visibly wrong — fix tokens, not component hacks |
| Icon Button without label | Dev console warning; lab demo includes good/bad example in comments only |
| shadcn CLI overwrites `button.tsx` | Re-apply tokenized version; document in PR — prefer manual merge |
| Prototype vs contract color mismatch | Follow contract; note in lab section «Known drift» |

---

## Drift risks & guards

| Risk | Guard |
|------|-------|
| Generic shadcn re-install overwrites tokens | PR review + pin customized files |
| Two Button implementations | **Replace**, never duplicate |
| Lab not updated when CVA changes | `matrices.ts` must import variant keys from CVA or duplicate const with comment «sync with buttonVariants» |
| `docs/example_components` diverges from web | After merge, design kit README notes «implemented in apps/web» |
| Lab strings bypass `@/lib/messages` | Allowed only in `components/design-lab/**` |
| Agent skips Context7 for shadcn/Radix | Reject on verification; § Agent prerequisites — Context7 |
| Component in wrong folder (`patterns/`, duplicate tile) | § Catalog layers decision tree |

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`global_shell_spec.md`](./global_shell_spec.md) | Root layout; `components/shell/` inventory |
| [`typography_text_guidelines.md`](../../../guidelines/typography_text_guidelines.md) | Atoms policy |
| [`styleguide.md`](../../../design/styleguide.md) | L3 pattern recipes |
| [`ui_states_contract.md`](../../../design/ui_states_contract.md) | Empty/loading/error demos Phase 2 |
| [`example_components/README.md`](../../../example_components/README.md) | Copy source & token reference |
| [`P01_tasks.md`](../tasks/P01_tasks.md) | Phase checklist (W16 P03 for Lab QA) |
| [`forms_and_validation_ux.md`](../../../design/forms_and_validation_ux.md) | Form controls UX (Phase 2a+) |
| [`ux_ui_principles.md`](../../../design/ux_ui_principles.md) | FAANG-adapted Pulse UX (FX contract) |
| [`ai_component_guidelines.md`](../../../guidelines/react/ai_component_guidelines.md) | Folder layout §6; catalog imports |
| [`guidelines/README.md`](../../../guidelines/README.md) | Full rules index | [`documentation_creation_registry.md`](../../../meta/documentation_creation_registry.md) — wave W15-01

---

## Agent notes

- **Do not** add Storybook in this task.
- **Do not** tokenize all shadcn components — only inventory in § Shared components and § Component catalog placement.
- **Do not** use `BsfyCard` naming in production code.
- **MUST** use **Context7** before implementing inventory components (§ Agent prerequisites — Context7).
- **MUST** satisfy FAANG UX contract FX-1–FX-10 per component where applicable.
- **MUST** match prototype visual params via semantic tokens (§ Prototype fidelity workflow) — prototype wins for look; PRD wins for behavior.
- **Prefer** Server Components for lab sections; client only for `DesignLabControls` and interactive demos.
- When copying from lampto reference — **Pulse Cursor Rules win** over reference code.
- Rating stars use **`text-secondary` (gold)** — not primary green ([`visual_identity_contract.md`](../../../design/visual_identity_contract.md)).
- After implementation, feature routes P02+ **must import** atoms/Button/PulseCard from catalog paths — no one-off typography strings. See §Product UI catalog contract.
- Domain molecules: `components/{domain}/` only; Lab imports fixtures — never duplicate markup in product from `design-lab/`.

---

## Change log

| Date | Change |
|------|--------|
| 2026-05-23 | v1.2 — §Component catalog placement & Phase 2–3 inventory: folder map, FAANG UX contract (FX-1–FX-10), Context7 MUST, per-component verification |
| 2026-05-23 | v1.1 — §Product UI catalog contract: mandatory catalog imports for P02+ |
| 2026-05-23 | v1.0 — Design System Lab + shared UI primitives spec (W15-01) |
