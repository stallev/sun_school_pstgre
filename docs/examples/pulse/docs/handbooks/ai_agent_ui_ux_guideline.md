# AI Agent UI/UX Guideline

**Тип:** Agent Instruction / Cursor Rule Reference  
**Аудитория:** Cursor AI Agents при проектировании и реализации UI  
**Стек:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui (Radix UI)  
**Версия:** 2.0  
**Дата:** 2026-05-28

---

## Цель документа

Этот файл — **основной операционный справочник** для агента при создании любого UI. Он синтезирует:
- Принципы FAANG-level UX/UI (предсказуемость, иерархия, состояния, доступность)
- Принципы дизайн-мышления из `frontend-design` skill (purpose → constraints → intentional aesthetic)
- Конкретные технические правила для Next.js 16 / React 19 / shadcn

**Логика работы:** сначала думай как дизайнер → потом реализуй как инженер → потом верифицируй по чеклисту.

---

## Precedence (иерархия источников истины)

При конфликте источников — строгий порядок:

1. **Cursor Rules** (`.cursor/rules/*.mdc`)
2. **Product contracts** — `ux_ui_principles.md`, `interaction_design_contract.md`, `forms_and_validation_ux.md`, `styleguide.md`
3. **PRD / user flows / implementation specs**
4. **Этот документ** — нормы мышления и операционные чеклисты для агентов
5. **HTML-прототип** — visual reference (подчинён routes и MVP scope)

**Visual canon:** `fitness-platform-design-system.md` + `Fitness_Platform_Prototype_v1.html`.

---

## Context7 Verification (MUST before implementation)

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

## Synthesis: sources

| Источник | Что заимствовано |
|----------|------------------|
| lampto `ux_ui_faang_principles_for_agents.md` | 10 cross-cutting principles, screen states table |
| [ux-audit](https://github.com/narenkatakam/ux-audit) skill | Task-first UX, overlay checklists, non-negotiables |
| [anthropics/claude-code frontend-design](https://github.com/anthropics/claude-code/tree/main/plugins/frontend-design/skills/frontend-design) | Design thinking: purpose → constraints → intentional aesthetic |
| Pulse `design_system_lab_spec.md` | FX-1–FX-10 contract, Design Lab catalog |
| Material Design 3 (Context7) | Touch targets 48dp, modality for pickers, bottom sheet on mobile |

---

## §1 — Design Thinking: ОБЯЗАТЕЛЬНО до кода

Перед реализацией любого экрана или компонента агент **MUST** пройти 8 шагов:

### Шаг 1 — Purpose: Для чего и для кого?
- Какую задачу решает этот экран/компонент?
- Кто пользователь, в каком контексте он это видит?
- За &lt;3 секунды должно быть понятно — что делать дальше.

### Шаг 2 — Primary Task: Один фокус
- Один главный action на экран. Один primary `Button` на view.
- Всё остальное — вторично. Если не можешь сформулировать главное действие одним глаголом — экран перегружен.

### Шаг 3 — Constraints: Ограничения
- RSC/client boundary: нужен ли `'use client'`?
- ADR и domain invariants (например, timezone, валюта, locale).
- Performance: что рендерится на сервере, что — на клиенте?
- A11y: keyboard, скринридеры, touch targets.

### Шаг 4 — Catalog First: Design Lab
- Открыть `/design-system` → найти Sheet/Dialog/Field recipe.
- Использовать canonical shared catalog: `@/components/atoms/`, `@/components/ui/`.
- **MUST NOT:** дублировать примитив из Design Lab — расширить CVA/atom variant и добавить Lab-секцию.

### Шаг 5 — Prototype Anchor
- Сверить HTML-прототип и wireframe для данного экрана.
- Прототип — visual reference, не product law; не переопределяет PRD.

### Шаг 6 — Context7 Verify
- Проверить API примитивов по таблице Context7 Verification выше.

### Шаг 7 — States Matrix
- Явно запланировать: default, pending, error, empty, loading, forbidden (FX-4).

### Шаг 8 — Aesthetic Direction: Намеренный стиль

**Pulse default (MUST):** Warm Forest tokens из `globals.css` + Source Serif 4 (`font-heading`) / Manrope (UI) / JetBrains Mono (code/times).

Дополнительная таблица для расширений и custom поверхностей:

| Тип продукта | Примеры направлений |
|---|---|
| B2C / consumer | Warm, playful, organic; мягкие тени, rounded-3xl, живые цвета |
| Enterprise / SaaS | Refined minimal; строгая сетка, нейтральные токены, плотная типографика |
| Health / Fitness | Energetic; bold typography, contrast CTAs, mobile-first bottom sheets |
| Fintech | Trust-first; чёткие границы, статусные иконки, консервативная палитра |

**Non-negotiable:**
- Никогда не используй generic AI-стетику: Inter/Roboto/Arial по умолчанию, purple-gradient-on-white, cookie-cutter layouts
- Каждый дизайн должен быть **intentional** — не случайный набор компонентов
- No emoji как иконки. Одна иконочная библиотека (`lucide-react`)
- No decoration without purpose

---

## §2 — Принципы (FX-1 — FX-10)

### FX-1 — Предсказуемость и консистентность

Одинаковые паттерны на родственных экранах одной роли:
- Placement primary CTA одинаков
- Labels берутся из `@/lib/messages`, не ad hoc copy
- Overlay type (Sheet vs Dialog) не меняется от экрана к экрану без причины

**Anti-pattern:** на `/services` — Dialog + Cancel/Save; на `/schedule` — Sheet с одной кнопкой.

**Agent checklist:**
- [ ] Primary action совпадает с sibling экранами той же роли
- [ ] Терминология = PRD / messages, не ad hoc copy

### FX-2 — Иерархия и сканируемость

- Один `Button variant="default"` на экран/view
- Modal/sheet может иметь свой primary — это не нарушение (у overlay свой контекст)
- Заголовок overlay описывает задачу: «Новый интервал», а не «Действие» или «Подтвердите»
- В footer overlay: **один primary** + **один dismiss** (Cancel / Close)

**Agent checklist:**
- [ ] Заголовок overlay описывает задачу («Новый интервал»), не generic «Действие»
- [ ] В footer overlay — **один** primary + **один** dismiss (Cancel / Close)

### FX-3 — Прогрессивное раскрытие

- Сложность — по шагам: wizard, tabs, sheet/dialog
- Не перегружать первый экран — редкие действия за явным entry point (menu, secondary button)
- Первый экран показывает primary task, остальное — по требованию

### FX-4 — Production States (обязательные состояния)

Каждый интерактивный компонент **MUST** реализовывать все состояния:

| State | UX expectation | Реализация |
|---|---|---|
| `default` | Baseline affordance | Штатный рендер |
| `hover` / `focus` | Видимый focus ring | `focus-visible:ring-ring` |
| `disabled` | Opacity + pointer-events-none | Не только цвет |
| `pending` | disabled + aria-busy + gerund label | `useTransition` / Server Action |
| `error` | Inline field error + aria-invalid | `FieldError` + `border-destructive` |
| `empty` | Zero dead end — CTA или next step | Empty state компонент |
| `loading` | Skeleton matching layout | `Skeleton`, `loading.tsx`, `Suspense` |

**Критически важно:** Mutation loading ≠ route loading.
- Mutation → `aria-busy` + `disabled` на кнопке-триггере, не full-page skeleton
- Route → `loading.tsx` + `Suspense` boundary

### FX-5 — Доступность (WCAG 2.1 AA, обязательно)

| Область | MUST |
|---|---|
| Labels | Visible label или `aria-label` на каждом control |
| Forms | `htmlFor` + `id`; ошибки через `FieldError` + `aria-describedby` |
| Overlays | Focus trap; Escape closes; focus return to trigger |
| Touch | Targets ≥ **44×44 CSS px** на mobile |
| Color | Status/error — не только цвет (icon + text) |
| Motion | `prefers-reduced-motion` — уважать |

**Порядок предпочтений:** shadcn/Radix primitives → native HTML → custom ARIA  
**MUST NOT:** Hand-roll focus trap, roving tabindex, dialog semantics без крайней необходимости.

### FX-6 — Mobile-first и responsive overlays

Канонический выбор overlay по viewport:

| Viewport | Pattern | Детали |
|---|---|---|
| `< md` (mobile) | `Sheet side="bottom"` | `rounded-t-3xl`, drag handle |
| `≥ md` (tablet/desktop) | Centered `Dialog` | `rounded-3xl`, `sm:max-w-md` |
| Destructive action | `AlertDialog` | Никогда optimistic |

**Anti-pattern:** bottom Sheet на desktop без задокументированного исключения.

**Material Design 3:** на mobile — bottom sheet для actions/filters; на desktop — modal/docked input для форм.

### FX-7 — Немедленная обратная связь

- Mutations: pending UI + Sonner toast
- Optimistic toggles: `useOptimistic` + обязательный `toast.error` при откате
- Локальные правки (add chip, toggle) до Save — **без success toast spam**
- Ошибка save → `toast.error`
- Toast position: `bottom-center` на mobile, `bottom-right` на desktop

### FX-8 — Zero Dead Ends

Empty state и error state **MUST** содержать следующий шаг:
- Retry button для recoverable errors
- CTA для empty states («Создайте первую тренировку»)
- Link для 403/404

### FX-9 — Prototype Fidelity

- Шрифты, border-radius, spacing, shadows — из design tokens
- Прототип — visual reference, не product law
- Прототип не переопределяет PRD и не добавляет scope

### FX-10 — Доверие, приватность, предотвращение ошибок

- Destructive action → confirm **до** мутации (AlertDialog)
- Dismiss overlay на backdrop:
  - Informational → OK
  - Форма с несохранёнными данными → confirm или явный Cancel
- Не показывать лишние PII

---

## §3 — Pulse Enforcement Matrix

| Принцип | Product contract | Cursor Rule | Design Lab |
|---------|-----------------|-------------|------------|
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

## §4 — Overlay Decision Tree

```
Focused task / form / confirmation?
  ├─ Mobile (< md)     → Sheet bottom
  ├─ Desktop (≥ md)    → Dialog centered
  └─ Destructive       → AlertDialog (never optimistic)

Secondary filters / quick actions on mobile?
  └─ Sheet bottom, single primary «Apply» + dismiss

Contextual hint, 1–2 controls?
  └─ Popover (not modal)

NEVER: nested modals
NEVER: modal opening another modal
```

### Overlay Ship Checklist (12 пунктов)

- [ ] Правильный тип: Sheet `< md` / Dialog `≥ md`
- [ ] Title описывает задачу («Новый интервал», не «Подтвердите»)
- [ ] Description через `SheetDescription` / `DialogDescription` когда неочевидно
- [ ] Footer: один primary + один dismiss (Cancel / Close)
- [ ] Focus trap: Tab не уходит за overlay
- [ ] Focus return: при закрытии → trigger button
- [ ] Escape закрывает overlay
- [ ] Max width: simple form `max-w-md`, complex `max-w-lg`
- [ ] Body overlay scrolls; page scroll locked
- [ ] Semantics: Radix/shadcn `role="dialog"`, `aria-modal`, labelled title
- [ ] Animation: entrance ~200ms; exit не блокирует interaction
- [ ] Нет nested modals

---

## §5 — Forms в overlays

### Обязательные правила (MUST)

| ID | Правило |
|---|---|
| FO-1 | Semantic `<form>` с `onSubmit`; Enter submits |
| FO-2 | `Field` + `FieldLabel` + `FieldError` — не голый `Label` + `<p>` |
| FO-3 | Field error → `aria-invalid="true"` + `border-destructive` |
| FO-4 | Footer: `Cancel` (`variant="outline"`) + primary submit; на mobile — `flex gap-2` |
| FO-5 | Pending submit: `disabled` + `aria-busy` + gerund label из `@/lib/messages` |

### Желательные правила (SHOULD)

| ID | Правило |
|---|---|
| FO-6 | Related fields (start/end time) → `grid grid-cols-2 gap-3` на `≥ sm` |
| FO-7 | Helper text → `FieldDescription` (muted), отдельно от error |
| FO-8 | При submit fail → focus на первое невалидное поле |

### Time Inputs (schedule domain)

| ID | Правило |
|---|---|
| TM-MUST-1 | Display format **24-hour** (`HH:mm`) — consistent with interval chips и booking UI |
| TM-MUST-2 | **Anti-pattern:** native `type="time"` без locale control → 12h AM/PM на en-US системах при 24h chips |
| TM-SHOULD-1 | Prefer catalog control (`TimeSlotButton` pattern) или masked input / Select columns — verify Context7 |
| TM-SHOULD-2 | Validate `end > start` inline before close; message из `@/lib/messages` |

### Pending State Pattern

```tsx
// ✅ Правильный паттерн pending для Server Action
const [isPending, startTransition] = useTransition();

function handleSubmit(formData: FormData) {
  startTransition(async () => {
    const result = await createItem(formData);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(messages.item.created);
      onClose();
    }
  });
}

<button
  type="submit"
  disabled={isPending}
  aria-busy={isPending}
>
  {isPending ? messages.saving : messages.save}
</button>
```

---

## §6 — Component Patterns

### Button

```tsx
// ✅ Один primary на экран
<Button variant="default" disabled={isPending} aria-busy={isPending}>
  {isPending ? 'Сохранение...' : 'Сохранить'}
</Button>

// Минимальная touch target — 44×44px
// className="min-h-[44px] min-w-[44px]"
```

### Empty State

```tsx
// ✅ Zero dead end — всегда с CTA
function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <Icon className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {action && <Button onClick={action.onClick}>{action.label}</Button>}
    </div>
  );
}
```

### Loading Skeleton

```tsx
// ✅ Skeleton matching layout — не spinner на весь экран
function CardSkeleton() {
  return (
    <div className="space-y-3 rounded-xl border p-4">
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
    </div>
  );
}
```

### Optimistic UI

```tsx
// ✅ useOptimistic + обязательный откат
function ToggleFavorite({ itemId, initialFav }: Props) {
  const [optimisticFav, setOptimisticFav] = useOptimistic(initialFav);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      setOptimisticFav(prev => !prev); // немедленно
      try {
        await toggleFavorite(itemId);
      } catch {
        toast.error(messages.errors.generic); // ОБЯЗАТЕЛЬНЫЙ откат
      }
    });
  }

  return (
    <button onClick={handleToggle} aria-pressed={optimisticFav}>
      <HeartIcon className={optimisticFav ? 'fill-current' : ''} aria-hidden="true" />
      <span className="sr-only">
        {optimisticFav ? messages.removeFromFav : messages.addToFav}
      </span>
    </button>
  );
}
```

---

## §7 — Screen States → Implementation

| State | UX | Next.js 16 реализация |
|---|---|---|
| `happy` | Primary task, данные есть | Default page content (RSC) |
| `empty` | Почему пусто + CTA | Conditional render + EmptyState |
| `loading` | Layout-preserving skeleton | `loading.tsx`, `Suspense`, `Skeleton` |
| `error` | Actionable message + retry | `error.tsx`, `toast.error`, `FieldError` |
| `forbidden` | Clear 403, no data leak | Server redirect / forbidden shell |
| `mutation pending` | Busy on trigger only | `aria-busy`, `disabled`, gerund label |

---

## §8 — Aesthetic Execution

### Типографика

```tsx
// ❌ Generic — никогда
className="font-sans" // defaults to Inter/system

// ✅ Pulse — обязательно (Warm Forest)
// font-heading → Source Serif 4 (display/titles)
// font-sans   → Manrope (UI body)
// font-mono   → JetBrains Mono (code/times)
// Определены в globals.css через next/font
```

### Цвет и токены

```tsx
// ✅ Всегда через токены — никогда hardcode hex
className="bg-background text-foreground"
className="text-muted-foreground"
className="bg-primary text-primary-foreground"
className="border-destructive" // error state

// ✅ CSS variables для dynamic values
style={{ '--progress': `${value}%` } as React.CSSProperties}
```

### Анимации

```tsx
// ✅ Только transform и opacity → Composite only
// Entrance: ~200ms ease-out
// Exit: ~150ms ease-in (быстрее)
// Hover: ~100ms

// ✅ Respect prefers-reduced-motion
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}

// ✅ Tailwind
className="transition-transform duration-200 ease-out"
className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-4"
```

### Пространство и сетка

```tsx
// ✅ Consistent spacing scale
// gap-2 (8px), gap-3 (12px), gap-4 (16px), gap-6 (24px)
// px-4 на mobile, px-6 на md, px-8 на lg

// ✅ Mobile container
className="mx-auto max-w-screen-lg px-4 md:px-6"

// ✅ Card / surface
className="rounded-2xl border bg-card p-4 shadow-sm"
// Desktop upgrade
className="md:rounded-3xl md:p-6"
```

---

## §9 — Component Checklists Quick Reference

Перед ship конкретного surface — пройти релевантный чеклист:

| Surface | Checklist items |
|---------|-----------------|
| **Buttons** | One primary per view; loading state `aria-busy`; min touch 44px; focus-visible ring |
| **Forms** | Field + FieldLabel + FieldError; pending on submit; no placeholder-only labels |
| **Modals / Sheets** | § Overlay Ship Checklist (12 пунктов) |
| **Cards / Lists** | Scannable hierarchy; empty state CTA; skeleton matches card layout |
| **Navigation** | Consistent labels per role; safe-area insets on mobile |
| **Time Inputs** | 24h `HH:mm`; no bare `type="time"`; validate `end > start` |

---

## §10 — Pre-Merge Agent Checklist

Перед каждым UI-коммитом агент **MUST** пройти этот список:

### Context7 & Catalog
- [ ] Context7 verified for touched primitives (shadcn, React, Next.js)
- [ ] Design Lab catalog import — не one-off markup
- [ ] Prototype parity проверен на **390px** и **md**
- [ ] Product docs updated if behavior changed (**product-docs-alignment**)

### Design Thinking
- [ ] Purpose сформулирован: кто пользователь, какая задача
- [ ] Aesthetic direction — Warm Forest tokens, не generic fallback
- [ ] Один primary action на экран определён

### States
- [ ] Все 7 состояний реализованы (default, hover, focus, disabled, pending, error, empty/loading)
- [ ] Mutation pending — на триггере, не на странице
- [ ] Empty state содержит CTA или next step

### Overlay (если есть)
- [ ] Sheet `< md` / Dialog `≥ md`
- [ ] Footer: primary + cancel
- [ ] Focus trap + Escape + focus return
- [ ] Нет nested modals

### Form (если есть)
- [ ] `Field` + `FieldLabel` + `FieldError`
- [ ] `aria-invalid` на полях с ошибкой
- [ ] Pending state на submit button
- [ ] Time inputs: 24h формат, no bare `type="time"`

### Accessibility
- [ ] Все иконки-кнопки имеют `aria-label`
- [ ] Декоративные иконки имеют `aria-hidden="true"`
- [ ] Focus visible на всех интерактивных элементах
- [ ] Touch targets ≥ 44×44px
- [ ] `lang` атрибут на `<html>` корректен
- [ ] Status/error обозначены не только цветом

### Code Quality
- [ ] Один icon family (`lucide-react`)
- [ ] Нет emoji как иконки
- [ ] Labels из `@/lib/messages`, не ad hoc strings
- [ ] Нет hardcode hex цветов — только токены
- [ ] `npm run lint` + typecheck чисто

---

## §11 — Anti-Patterns (запрещено)

| ❌ Anti-pattern | ✅ Правильно |
|---|---|
| Generic spinner на весь экран при mutation | `aria-busy` + `disabled` на кнопке |
| `dangerouslySetInnerHTML` без DOMPurify | DOMPurify или React escaping |
| `outline: none` без замены | `focus-visible:ring-2 focus-visible:ring-ring` |
| Emoji как иконки | `lucide-react` |
| Ad hoc copy strings | `@/lib/messages` |
| Hardcode цвета (`#FF5500`) | CSS tokens (`text-primary`, `bg-destructive`) |
| Bottom sheet на desktop | Dialog centered |
| Nested modals | Переработать UX flow |
| `<div onClick>` вместо `<button>` | Семантический HTML |
| `type="time"` без locale control | Masked input / Select columns |
| Success toast на каждое локальное изменение | Toast только при server commit |
| Decoration without purpose | Убрать или обосновать |
| Generic Inter + purple gradient | Warm Forest tokens: Source Serif 4 / Manrope |
| `import * as Icons from 'lucide-react'` | `import { Search, User } from 'lucide-react'` |
| Status/error только цветом | Icon + text + цвет |
| Дублировать Design Lab примитив | Расширить CVA/atom variant, добавить Lab-секцию |

---

## §12 — Быстрый справочник: Tailwind классы по назначению

```tsx
// Overlay backdrop
"fixed inset-0 bg-black/50 z-50"

// Sheet mobile (bottom)
"fixed inset-x-0 bottom-0 rounded-t-3xl bg-background p-6"

// Dialog desktop (centered)
"fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-background p-6 sm:max-w-md"

// Focus ring (все интерактивные)
"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"

// Touch target min size
"min-h-[44px] min-w-[44px] flex items-center justify-center"

// Error field border
"border-destructive aria-invalid:border-destructive"

// Pending button
"disabled:opacity-50 disabled:pointer-events-none"

// Screen reader only
"sr-only"

// Skeleton
"animate-pulse rounded-md bg-muted"

// Empty state container
"flex flex-col items-center justify-center gap-4 py-16 text-center"

// Card surface
"rounded-2xl border bg-card p-4 shadow-sm md:rounded-3xl md:p-6"
```

---

## Related Documents

| Документ | Отношение |
|----------|-----------|
| `docs/design/ux_ui_principles.md` | Pulse MVP UX principles P1–P8 |
| `docs/design/styleguide.md` | Component recipes, Sheet/Dialog breakpoints |
| `docs/design/forms_and_validation_ux.md` | Field-level validation UX |
| `docs/design/interaction_design_contract.md` | Toast, confirm, optimistic |
| `docs/design/ux_ui_faang_best_practices_for_agents.md` | FAANG-level agent reference (Pulse canon) |
| `docs/design/accessibility_requirements.md` | WCAG 2.1 AA product contract |
| `docs/implementation/mvp/specs/design_system_lab_spec.md` | FX-1–FX-10, catalog inventory |
| `docs/guidelines/react/ai_semantics_a11y_guidelines.md` | Implementation a11y |
| `docs/guidelines/react/ai_form_handling_pattern.md` | Form pending/state patterns |
| `docs/guidelines/react/ai_optimistic_ui_pattern.md` | useOptimistic patterns |
| `docs/guidelines/nextjs/ai_loading_patterns.md` | Route vs mutation loading |
| `docs/default_docs/fitness-platform-design-system.md` | Warm Forest visual canon |

---

## Changelog

| Date | Change |
|---|---|
| 2026-05-28 | v2.0 — добавлены: Precedence, Context7 table, Synthesis/sources, 8-step Design Thinking workflow (Catalog First, Prototype Anchor, Context7 Verify, States Matrix), Pulse Enforcement Matrix, Time Inputs rules (TM-MUST/SHOULD), Component Checklists Quick Reference, расширен Pre-Merge Checklist, Related Documents, Warm Forest как explicit default |
| 2026-05-28 | v1.0 — initial; синтез FAANG UX/UI best practices + frontend-design skill + Next.js 16 / React 19 stack |
