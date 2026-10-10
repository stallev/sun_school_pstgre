# Pulse — FAANG-level UX/UI Best Practices (for AI agents)

**Тип:** Design / UX Guideline  
**Статус:** Canonical (agent reference)  
**Версия:** 1.0  
**Дата:** 2026-05-24  
**Аудитория:** AI-агенты и инженеры при проектировании и реализации UI в `apps/web`

**Methodology:** [`docs/meta/ai_first_project_methodology.md`](../meta/ai_first_project_methodology.md)

---

## Purpose

Единый **справочник UX/UI-норм уровня зрелых consumer/enterprise продуктов** (informally «FAANG-level») для Pulse. Документ дополняет продуктовые контракты поведением, состояниями, overlay-паттернами и чеклистами верификации — **не подменяя** Warm Forest tokens и HTML-прототип.

**Enforcement в коде:** Cursor Rules (`ui-mobile-first`, `ui-semantics-a11y`, `ui-prototype-fidelity`, …) + [`design_system_lab_spec.md`](../implementation/mvp/specs/design_system_lab_spec.md) § FAANG UX/UI contract **FX-1–FX-10**.

---

## Precedence (strict order)

При конфликте источников:

1. **Cursor Rules** (`.cursor/rules/*.mdc`)
2. **Product contracts** — [`ux_ui_principles.md`](./ux_ui_principles.md), [`interaction_design_contract.md`](./interaction_design_contract.md), [`forms_and_validation_ux.md`](./forms_and_validation_ux.md), [`styleguide.md`](./styleguide.md)
3. **PRD / user flows / implementation specs**
4. **Этот документ** — нормы мышления и чеклисты для агентов
5. **HTML-прототип** — visual reference (subordinate to routes и MVP scope)

**Visual canon:** [`fitness-platform-design-system.md`](../default_docs/fitness-platform-design-system.md) + [`Fitness_Platform_Prototype_v1.html`](../prototypes/Fitness_Platform_Prototype_v1.html).

---

## Context7 verification (MUST before implementation)

Перед реализацией overlay, форм или нового UI-компонента агент **MUST** сверить актуальные API через **Context7 MCP** — не полагаться только на training data.

| Задача | Context7 library ID | Query focus |
|--------|---------------------|-------------|
| Sheet / Dialog / Field | `/websites/ui_shadcn` | `Sheet` bottom vs `Dialog` centered; `Field`, `FieldLabel`, `FieldError`; `aria-invalid`; focus trap |
| Forms + validation | `/websites/ui_shadcn` | `FieldGroup`, submit/cancel footer, react-hook-form + Field |
| React optimistic / transitions | `/reactjs/react.dev` | `useTransition`, `useOptimistic`, Rules of Hooks |
| Next.js App Router | `/vercel/next.js/v16.2.2` | RSC boundary, `'use client'`, streaming |
| Time / date pickers (M3) | `/websites/m3_material_io` | Time picker modality, 48dp targets, docked vs modal input |
| Toast | `/emilkowalski/sonner` | `Toaster`, `duration`, `position` |

**SHOULD:** в PR comment — «Context7 verified: `{libraryId}` — {topic}».

**MUST NOT:** hand-roll Radix-поведение (focus trap, roving tabindex, dialog semantics) без сверки Context7.

---

## Synthesis: external agent skills (reference)

Skill **`ux_ui_frontend`** в локальной среде не найден как отдельный артефакт. Нормы ниже **синтезированы** из проверенных open-source agent skills и Pulse canon:

| Источник | Что заимствовано |
|----------|------------------|
| lampto [`ux_ui_faang_principles_for_agents.md`](../examples/lampto/docs/design/ux_ui_faang_principles_for_agents.md) | 10 cross-cutting principles, screen states table |
| [ux-audit](https://github.com/narenkatakam/ux-audit) skill | Task-first UX, overlay checklists, non-negotiables (a11y, no decoration without purpose) |
| [anthropics/claude-code frontend-design](https://github.com/anthropics/claude-code/tree/main/plugins/frontend-design/skills/frontend-design) | Design thinking: purpose → constraints → intentional aesthetic; избегать generic «AI slop» |
| Pulse [`design_system_lab_spec.md`](../implementation/mvp/specs/design_system_lab_spec.md) | FX-1–FX-10 contract, Design Lab catalog |
| Material Design 3 (Context7) | Touch targets 48dp, modality for pickers, bottom sheet on mobile |

---

## Core principles (FAANG-adapted for Pulse)

### FX-1 — Predictability & consistency

- Одинаковые паттерны на sibling routes: placement primary CTA, labels из `@/lib/messages`, overlay type (Sheet vs Dialog).
- **Anti-pattern:** на `/trainer/services` — Dialog + Cancel/Save; на `/trainer/schedule` — только Sheet с одной кнопкой.

**Agent checklist:**
- [ ] Primary action совпадает с sibling экранами той же роли
- [ ] Терминология = PRD / messages, не ad hoc copy

### FX-2 — Hierarchy & scannability

- **Один** primary focus на view; secondary не конкурирует (`Button variant="default"` — один на экран/view).
- Modal/sheet **может** иметь свой primary без нарушения parent screen (см. [`ux_ui_principles.md`](./ux_ui_principles.md) P4).

**Agent checklist:**
- [ ] Заголовок overlay описывает задачу («Новый интервал»), не generic «Действие»
- [ ] В footer overlay — **один** primary + **один** dismiss (Cancel / Close)

### FX-3 — Progressive disclosure

- Сложность по шагам: wizard, tabs, sheet/dialog — не перегружать первый экран.
- Редкие действия — за явным entry point (menu, secondary button).

### FX-4 — Production states (first-class)

Каждый интерактивный компонент **MUST** явно проектировать:

| State | UX expectation |
|-------|----------------|
| `default` | Baseline affordance |
| `hover` / `focus` | Visible focus ring (`focus-visible:ring-ring`) |
| `disabled` | `opacity` + `pointer-events-none`; не только цвет |
| `pending` | `disabled` + `aria-busy` + gerund label |
| `error` | Inline field error + `aria-invalid`; не только toast |
| `empty` | Zero dead end — CTA или next step |
| `loading` | Skeleton matching layout — не opaque spinner |

**Mutation loading ≠ route loading:** busy на trigger control, не full-page skeleton (см. [`ai_form_handling_pattern.md`](../guidelines/react/ai_form_handling_pattern.md) §4).

### FX-5 — Accessibility (WCAG 2.1 AA)

| Area | MUST |
|------|------|
| Names | Visible label или `aria-label` на каждом control |
| Forms | `htmlFor` + `id`; ошибки через `FieldError` + `aria-describedby` |
| Overlays | Focus trap; Escape closes; focus return to trigger |
| Touch | Targets ≥ **44×44 CSS px** на mobile |
| Color | Status/error — не только цвет (icon + text) |

**Prefer:** shadcn/Radix primitives → native HTML → custom ARIA.

### FX-6 — Mobile-first & responsive overlays

Канон Pulse ([`styleguide.md`](./styleguide.md) § Sheet / Dialog):

| Viewport | Pattern |
|----------|---------|
| `< md` (mobile) | `Sheet` `side="bottom"`, `rounded-t-3xl`, drag handle |
| `≥ md` (tablet/desktop) | **Centered `Dialog`**, `rounded-3xl`, `sm:max-w-md` |

**Anti-pattern:** bottom Sheet на desktop viewport (кроме documented exception).

**Material Design 3:** на mobile — bottom sheet для actions/filters; на desktop — modal/docked input для форм.

### FX-7 — Immediate feedback

- Mutations: pending UI + Sonner toast (см. **ui-toast-mutations**, **ui-mutation-pending**).
- Optimistic toggles: `useOptimistic` + **обязательный** `toast.error` при откате.
- Локальные правки (add chip) до Save — без success toast spam; ошибка save — `toast.error`.

### FX-8 — Zero dead ends

Empty/error **MUST** содержать следующий шаг: Retry, CTA, link.

### FX-9 — Prototype fidelity

- Шрифты, размеры, radius, spacing — Warm Forest + прототип.
- Прототип **не** product law для post-MVP и **не** override PRD.

### FX-10 — Trust, privacy, error prevention

- Destructive — confirm **до** мутации.
- Dismiss overlay на backdrop — OK для informational; для форм с несохранёнными данными — confirm или явный Cancel.
- Не показывать лишние PII.

---

## Overlay decision tree (modals, sheets, dialogs)

Адаптация ux-audit `checklists/modals.md` + Pulse styleguide:

```text
Focused task / form / confirmation?
  ├─ Mobile (< md)     → Sheet bottom
  ├─ Desktop (≥ md)    → Dialog centered
  └─ Destructive       → AlertDialog (never optimistic)

Secondary filters / quick actions on mobile?
  └─ Sheet bottom, single primary «Apply» + dismiss

Contextual hint, 1–2 controls?
  └─ Popover (not modal)

NEVER: nested modals. NEVER: modal opening another modal.
```

### Overlay checklist (ship gate)

1. **Правильный тип** — Sheet mobile / Dialog desktop (FX-6).
2. **Title** — описывает задачу («Новый интервал», не «Подтвердите»).
3. **Description** — `SheetDescription` / `DialogDescription` когда задача неочевидна.
4. **Actions** — один primary + один dismiss (Cancel / Close).
5. **Focus trap** — Tab не уходит на страницу за overlay.
6. **Focus return** — при закрытии focus → trigger button.
7. **Escape** — закрывает overlay.
8. **Max width** — simple form: `max-w-md` (~448px); complex: `max-w-lg`.
9. **Scroll** — body overlay scrolls; page scroll locked.
10. **Semantics** — Radix/shadcn: `role="dialog"`, `aria-modal`, labelled title.
11. **Animation** — entrance ~200ms; exit не блокирует interaction.
12. **No nested modals.**

---

## Forms in overlays (FAANG + Pulse)

Сверка: shadcn Context7 (`Field`, `FieldGroup`, `SheetDemo`, checkout form) + [`forms_and_validation_ux.md`](./forms_and_validation_ux.md).

| ID | Rule |
|----|------|
| FO-MUST-1 | Overlay form — semantic `<form>` с `onSubmit`; Enter submits |
| FO-MUST-2 | `Field` + `FieldLabel` + `FieldError` — не голый `Label` + `AlertText` |
| FO-MUST-3 | Field error → `aria-invalid="true"` на control + `border-destructive` |
| FO-MUST-4 | Footer: `Cancel` (`variant="outline"`) + primary submit; на mobile — `flex gap-2`, equal width optional |
| FO-MUST-5 | Pending submit: `disabled` + `aria-busy` + gerund из `@/lib/messages` |
| FO-SHOULD-1 | Related fields (start/end time) — `grid grid-cols-2 gap-3` на `≥ sm` |
| FO-SHOULD-2 | Helper text — `FieldDescription`, muted, не путать с error |
| FO-SHOULD-3 | First invalid field receives focus on submit fail |

### Time inputs (schedule domain)

| ID | Rule |
|----|------|
| TM-MUST-1 | Display format **24-hour** (`HH:mm`) — consistent with interval chips and booking UI |
| TM-MUST-2 | **Anti-pattern:** native `type="time"` без контроля locale → 12h AM/PM на en-US системах при 24h chips |
| TM-SHOULD-1 | Prefer catalog control (`TimeSlotButton` pattern) или masked input / Select columns — verify Context7 + prototype |
| TM-SHOULD-2 | Validate `end > start` inline before close; message from `@/lib/messages` |

---

## Design thinking workflow (before coding UI)

Адаптация **frontend-design** skill + Pulse methodology:

1. **Purpose** — какую задачу решает экран/overlay? Кто пользователь?
2. **Primary task** — сформулировать за <3 секунд должно быть понятно.
3. **Constraints** — RSC/client boundary, ADR, domain invariants (timezone!).
4. **Catalog first** — открыть `/design-system` → найти Sheet/Dialog/Field recipe.
5. **Prototype anchor** — сверить HTML-прототип + wireframe (W10).
6. **Context7** — verify API примitives.
7. **States matrix** — default, pending, error, empty (FX-4).
8. **Ship gate** — overlay checklist + FX-1–FX-10 spot-check.

**Non-negotiables (ux-audit):**
- No emoji as icons
- One icon family (`lucide-react`)
- Accessible by default — не «potom»
- No decoration without purpose

---

## Screen states → implementation map

| State | UX | Pulse implementation |
|-------|-----|----------------------|
| `happy` | Primary task complete | Default page content |
| `empty` | Why empty + CTA | Conditional + messages |
| `loading` | Layout-preserving skeleton | `loading.tsx`, Suspense, Skeleton |
| `error` | Actionable message + retry | `error.tsx`, toast.error, inline FieldError |
| `forbidden` | Clear 403, no leak | Server redirect / forbidden shell |
| `mutation pending` | Busy on trigger | `aria-busy`, disabled, gerund |

---

## Pulse enforcement matrix

| Principle | Product contract | Cursor Rule | Design Lab |
|-----------|------------------|-------------|------------|
| FX-1 Predictability | `ux_ui_principles.md` P4 | `ui-messages-and-copy` | L3 recipes |
| FX-2 Hierarchy | P4 One Primary Action | `ui-warm-forest-shadcn` | Button variants |
| FX-3 Disclosure | P1 | — | Tabs, WizardHeader |
| FX-4 States | `ui_states_contract.md` | `app-router-streaming-loading` | Skeleton, Empty |
| FX-5 A11y | `accessibility_requirements.md` | `ui-semantics-a11y` | — |
| FX-6 Mobile overlays | `styleguide.md` § Sheet/Dialog | `ui-mobile-first` | DesignLabModals |
| FX-7 Feedback | `interaction_design_contract.md` | `ui-toast-mutations`, `ui-mutation-pending` | — |
| FX-8 Dead ends | P2 | — | Empty L3 |
| FX-9 Prototype | P8 | `ui-prototype-fidelity` | `/design-system` |
| FX-10 Trust | `forms_and_validation_ux.md` F6 | — | AlertDialog |

---

## Component checklists (quick reference)

Перед ship конкретного surface — пройти релевантный чеклист:

| Surface | Checklist items (summary) |
|---------|---------------------------|
| **Buttons** | One primary; loading state; min touch 44px; focus visible |
| **Forms** | Labels; FieldError; pending; no placeholder-only labels |
| **Modals/Sheets** | § Overlay checklist (12 items) |
| **Cards/Lists** | Scannable hierarchy; empty CTA |
| **Navigation** | Consistent labels per role; safe-area |

Full modals checklist source: [ux-audit checklists/modals.md](https://github.com/narenkatakam/ux-audit/blob/main/skills/ux-audit/checklists/modals.md).

---

## Agent pre-merge checklist (UI tasks)

- [ ] Context7 verified for touched primitives
- [ ] Design Lab catalog import — не one-off markup
- [ ] Overlay: Sheet `< md`, Dialog `≥ md` (unless documented exception)
- [ ] Form: Field + FieldError + aria-invalid
- [ ] Overlay footer: primary + cancel
- [ ] Mutation: pending + toast policy
- [ ] Prototype/wireframe parity checked on **390px** and **md**
- [ ] `npm run lint` + typecheck for touched workspaces
- [ ] Product docs updated if behavior changed (**product-docs-alignment**)

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`ux_ui_principles.md`](./ux_ui_principles.md) | Pulse MVP UX principles P1–P8 |
| [`styleguide.md`](./styleguide.md) | Component recipes, Sheet/Dialog breakpoints |
| [`forms_and_validation_ux.md`](./forms_and_validation_ux.md) | Field-level validation UX |
| [`interaction_design_contract.md`](./interaction_design_contract.md) | Toast, confirm, optimistic |
| [`accessibility_requirements.md`](./accessibility_requirements.md) | WCAG 2.1 AA product contract |
| [`design_system_lab_spec.md`](../implementation/mvp/specs/design_system_lab_spec.md) | FX-1–FX-10, catalog inventory |
| [`ai_semantics_a11y_guidelines.md`](../guidelines/react/ai_semantics_a11y_guidelines.md) | Implementation a11y |
| lampto [`ux_ui_faang_principles_for_agents.md`](../examples/lampto/docs/design/ux_ui_faang_principles_for_agents.md) | Reference adaptation source |

---

## Change log

| Date | Change |
|------|--------|
| 2026-05-24 | v1.0 — initial FAANG-level agent reference; Context7 table; overlay/form/time checklists; skill synthesis note |
