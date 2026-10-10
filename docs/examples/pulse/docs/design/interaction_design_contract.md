# Interaction Design Contract — Pulse MVP

**Тип:** UX Contract  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-05-23  
**Волна:** W7  
**Зависит от:** [`ux_ui_principles.md`](./ux_ui_principles.md), Cursor Rules `ui-toast-mutations`, `ui-mutation-pending`, `ui-optimistic-mutations`  
**Связанные документы:** [`ui_states_contract.md`](./ui_states_contract.md), [`forms_and_validation_ux.md`](./forms_and_validation_ux.md), [`content_and_microcopy_contract.md`](./content_and_microcopy_contract.md)

**Technical refs (Context7):** Sonner — `/emilkowalski/sonner`; React `useOptimistic` — `/reactjs/react.dev`

---

## Purpose

Канон **интерактивного поведения Pulse MVP**: toast после мутаций, pending/busy UI, optimistic toggles, confirm dialogs для деструктивных действий. Продуктовый слой над Cursor Rules и React guidelines — **что** должен почувствовать пользователь, **когда** и **какой** feedback обязателен.

**Аудитория:** product, design, AI-агенты при реализации форм, toggles и admin actions в `apps/web`.

---

## Scope / Out of scope

**In scope:** Sonner toast policy, redirect+query pattern, mutation pending, optimistic UI surfaces, confirm dialogs, keyboard/focus при modals.

**Out of scope:** route-level loading/skeletons (→ [`ui_states_contract.md`](./ui_states_contract.md)); field validation UX (→ [`forms_and_validation_ux.md`](./forms_and_validation_ux.md)); тексты строк (→ [`content_and_microcopy_contract.md`](./content_and_microcopy_contract.md)); race resolution в domain (→ contracts W8).

---

## Definitions

| Термин | Значение |
|--------|----------|
| **Mutation** | Server Action или client `fetch`, создающий/обновляющий/удаляющий пользовательские данные |
| **PRODUCT_TOAST_DURATION_MS** | `2000` ms — стандартная длительность success/error toast после мутации |
| **Redirect toast pattern** | `?saved=1` (или аналог) на целевом URL + клиентский `useSearchParams` + `router.replace` без query |
| **Optimistic surface** | UI, где мгновенная смена состояния достаточна до ответа сервера (wishlist, service toggle) |
| **Destructive confirm** | Dialog/Sheet с явным подтверждением **до** отправки cancel/reject/delete |

---

## Requirements / Rules

### I1 — Sonner toast (мутации)

| ID | Rule |
|----|------|
| I1-MUST-1 | После **успешной** mutation — `toast.success` из `sonner`, текст из `@/lib/messages`, `duration: PRODUCT_TOAST_DURATION_MS` |
| I1-MUST-2 | После **ошибки** mutation — `toast.error` **всегда**; тот же duration |
| I1-MUST-3 | Глобальный `<Toaster />` — **один** в root layout; не дублировать провайдеры |
| I1-MUST-4 | Тексты toast — **только** `@/lib/messages`; не дублировать в action и компоненте |
| I1-SHOULD-1 | `position="top-center"` на mobile (не перекрывать Bottom Nav); `md:top-right` допустимо через responsive wrapper или единый `top-center` |
| I1-SHOULD-2 | `richColors` + `closeButton` на Toaster — success/error различимы визуально и для a11y |
| I1-MAY-1 | `toast.loading` — только для длительных client fetch без redirect; закрывать через `toast.dismiss` + success/error |

**Context7 (Sonner):** `Toaster` принимает `position`, `duration`, `toastOptions`, `theme="system"` — синхронизировать с `next-themes`.

**Исключения (документировать комментарием в коде):**

| Сценарий | Feedback channel |
|----------|------------------|
| Чистый redirect без изменения данных | Toast не нужен |
| Optimistic toggle — успех | `toast.success` **опционален**, если визуальная смена достаточна |
| Optimistic toggle — ошибка | `toast.error` **обязателен** |
| Inline autosave (trainer notes) | Subtle «Saved» indicator или debounced toast — один канал на экран |

### I2 — Redirect после Server Action

| ID | Rule |
|----|------|
| I2-MUST-1 | Toast из Server Action **не сработает** после `redirect()` — использовать query-параметр на целевом URL |
| I2-MUST-2 | Клиентский компонент `RedirectToast` (или аналог): `useSearchParams` → `toast.success` → `router.replace` без query |
| I2-MUST-3 | Query keys — константы в `@/lib/ui/...`, не magic strings (`saved`, `booked`, `approved`) |
| I2-SHOULD-1 | **Class B** critical submit на iOS Safari: fallback Route Handler сохраняет тот же redirect + query toast — см. [`ios-safari-mutation-transport-pattern.md`](../incidents/ios-safari-mutation-transport-pattern.md) |

**Pulse-примеры:**

| Flow | Pattern |
|------|---------|
| Booking created | redirect `/client/bookings/[id]?booked=1` |
| Review published | redirect `/client/bookings/[id]?reviewed=1` |
| Trainer profile saved | redirect `/trainer/profile?saved=1` или toast на той же странице без redirect |
| Admin approve | toast на той же странице (no redirect) |

### I3 — Mutation pending (busy)

| ID | Rule |
|----|------|
| I3-MUST-1 | `pending` из `useActionState`, `useFormStatus`, или `useTransition` |
| I3-MUST-2 | Submit: `disabled={pending}` + `aria-busy={pending}` |
| I3-MUST-3 | Label submit меняется на **герундий** из `@/lib/messages` («Сохраняем…», «Бронируем…») |
| I3-SHOULD-1 | Inline `Loader2Icon` на primary submit (`aria-hidden` при видимом тексте) |
| I3-MUST-4 | Форма может иметь `aria-busy={pending}` на `<form>` |

**Anti-pattern:** только смена opacity кнопки без `aria-busy` и без смены подписи.

### I4 — Optimistic UI

| ID | Rule |
|----|------|
| I4-MUST-1 | `setOptimisticState` — **только** внутри `startTransition` или React Action (Context7: иначе warning) |
| I4-MUST-2 | `isPending` из `useTransition` → `disabled` + `aria-busy` на control |
| I4-MUST-3 | При ошибке сервера — React откатывает optimistic state + **`toast.error` обязателен** |
| I4-MUST-4 | Toggle controls — `aria-pressed` для wishlist; Switch — shadcn `Switch` с label |

**MVP surfaces (optimistic):**

| Surface | Control | Не optimistic |
|---------|---------|---------------|
| Wishlist heart | Toggle | — |
| Trainer service `isActive` | Switch | — |
| Booking confirm | — | `useActionState` / redirect |
| Cancel booking | — | Confirm + `useTransition` |
| Admin reject trainer | — | Confirm + `useTransition` |

### I5 — Confirm dialogs (destructive)

| ID | Rule |
|----|------|
| I5-MUST-1 | Cancel booking, reject application, delete review, refund reject — **Dialog** (desktop) / **Sheet** (mobile `< sm`) |
| I5-MUST-2 | Primary в dialog — подтверждение действия; destructive — `Button variant="destructive"` |
| I5-MUST-3 | **No optimistic success** для destructive — ждать сервер, затем toast |
| I5-SHOULD-1 | Focus trap + Esc закрывает; return focus на trigger |
| I5-MUST-4 | Причина reject (admin) — required textarea **внутри** confirm sheet, не отдельный silent submit |

**Прототип:** admin Approve/Reject sheet; client cancel booking confirm.

### I6 — Filters & local state

| ID | Rule |
|----|------|
| I6-SHOULD-1 | Catalog filters — мгновенный UI (URL searchParams или local state); skeleton только при fetch |
| I6-MAY-1 | Debounce search 300ms — не блокировать ввод |

---

## Happy paths

1. **Form submit:** user fills form → submit label «Сохраняем…» + `aria-busy` → success toast 2s → UI reflects new state (or redirect+query toast).
2. **Wishlist toggle:** tap heart → instant fill → server OK → no flash; server fail → rollback + error toast.
3. **Admin reject:** tap Reject → sheet with reason → confirm → pending on button → toast «Отклонено» → row removed from queue.
4. **Booking redirect:** wizard confirm → redirect detail page → `?booked=1` → toast «Бронирование создано» → URL cleaned.

---

## Negative paths

| Сценарий | Interaction response |
|----------|---------------------|
| Network/server error | `toast.error` + control re-enabled; form field errors inline where applicable |
| Validation error (server) | Inline `FieldError` + optional summary; **no** success toast |
| Slot taken (booking) | Error toast + refresh slots; wizard stays on step |
| Double submit | `disabled` + `aria-busy` blocks second click |
| Redirect toast missing query | No toast — acceptable only if same-page success feedback exists |

---

## Security paths

| Сценарий | Interaction |
|----------|-------------|
| 401 on mutation | Redirect login; no partial optimistic state persisted |
| 403 forbidden | Toast or forbidden shell; no «success» feedback |
| Sensitive admin action | Confirm required; no skip via keyboard double-enter |
| Auth error copy | Generic «Неверный email или пароль» — без утечки account existence |

---

## Concurrency notes

| Surface | UI при race | Domain resolution |
|---------|-------------|-------------------|
| Double booking submit | Second click blocked by pending | UNIQUE slot — contract W8 |
| Wishlist rapid toggle | `disabled` while pending | Last write wins + idempotent action |
| Optimistic service toggle | Rollback + error toast | Server truth on refresh |

Детали resolution — [`failure_modes_catalog.md`](../prds/02_domain_model/failure_modes_catalog.md); здесь только UX исход.

---

## Drift risks & guards

| Risk | Guard |
|------|-------|
| Toast strings in actions | ESLint/review — только `@/lib/messages` |
| Missing redirect toast | Checklist: every `redirect()` after mutation has query key or same-page toast |
| Optimistic on destructive flows | Code review against I4/I5 tables |
| Multiple Toaster instances | Single root layout provider |
| `setOptimistic` outside transition | React 19 warning — follow Context7 pattern |

---

## Cursor Rule / Guideline enforcement

| Rule area | Cursor Rule | Guideline |
|-----------|-------------|-----------|
| Toast | `ui-toast-mutations` | [`copy_and_messages.md`](../guidelines/react/copy_and_messages.md) |
| Pending | `ui-mutation-pending` | [`ai_form_handling_pattern.md`](../guidelines/react/ai_form_handling_pattern.md) §4 |
| Optimistic | `ui-optimistic-mutations` | [`ai_optimistic_ui_pattern.md`](../guidelines/react/ai_optimistic_ui_pattern.md) |
| Copy | `ui-messages-and-copy` | [`content_and_microcopy_contract.md`](./content_and_microcopy_contract.md) |
| A11y focus | `ui-semantics-a11y` | [`ai_semantics_a11y_guidelines.md`](../guidelines/react/ai_semantics_a11y_guidelines.md) |

---

## Acceptance criteria

- [ ] I1–I6 с MUST/SHOULD/MAY и Pulse examples
- [ ] Sonner Toaster config documented (Context7 aligned)
- [ ] Redirect+query pattern with named query keys
- [ ] Optimistic vs non-optimistic surfaces table complete
- [ ] Destructive confirm rules explicit
- [ ] Happy / negative / security / concurrency / drift sections present
- [ ] Backlinks in `ux_ui_principles.md`, `guidelines/react/README.md`

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`ux_ui_principles.md`](./ux_ui_principles.md) | P5 Immediate Feedback — parent principles |
| [`ui_states_contract.md`](./ui_states_contract.md) | Loading/error/forbidden vs mutation pending |
| [`forms_and_validation_ux.md`](./forms_and_validation_ux.md) | Field-level validation UX |
| [`content_and_microcopy_contract.md`](./content_and_microcopy_contract.md) | Toast and button copy canon |
| [`pages_functional_spec.md`](../prds/01_product_scope/pages_functional_spec.md) | Per-page primary actions |
| [`wishlist_contract.md`](../implementation/mvp/contracts/wishlist_contract.md) | Optimistic wishlist (W8) |

**Registry:** [`documentation_creation_registry.md`](../meta/documentation_creation_registry.md) — wave W7-01

---

## Agent notes

- Route `loading.tsx` ≠ mutation pending — не смешивать механизмы.
- Booking wizard: последний шаг — **не** optimistic; ждём ID booking от сервера.
- Admin approve может быть same-page toast без redirect — зафиксировать один паттерн per action в spec W9.
- Toaster `theme="system"` — согласован с `next-themes` на `<html>`.

---

## Change log

| Date | Change |
|------|--------|
| 2026-05-23 | v1.0 — interaction design contract (W7-01) |
