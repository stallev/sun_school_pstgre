# Forms and Validation UX — Pulse MVP

**Тип:** UX Contract  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-05-23  
**Волна:** W7  
**Зависит от:** [`ui_states_contract.md`](./ui_states_contract.md), [`ai_form_handling_pattern.md`](../guidelines/react/ai_form_handling_pattern.md)  
**Связанные документы:** [`interaction_design_contract.md`](./interaction_design_contract.md), [`content_and_microcopy_contract.md`](./content_and_microcopy_contract.md)

---

## Purpose

Канон **UX форм и валидации** Pulse MVP: labels, field errors, focus management, submit pending, multi-step onboarding. Продуктовый слой над shadcn `Field`/`Input` и Server Actions — как пользователь **видит** ошибки и прогресс.

**Аудитория:** design, AI-агенты при auth, booking, trainer onboarding, admin reject flows.

---

## Scope / Out of scope

**In scope:** field-level and form-level errors, required indicators, disabled/pending, multi-step progress, file upload field UX (visual only).

**Out of scope:** Zod/schema definitions (→ domain/packages); authorization (→ W5); toast policy (→ interaction contract); admin table layout (→ `admin-forms-layout` rule).

---

## Definitions

| Термин | Значение |
|--------|----------|
| **Field error** | Inline message под контролом; `border-destructive` + `FieldError` |
| **Form error** | Summary Alert вверху формы для non-field failures |
| **Gerund label** | Pending submit text: «Сохраняем…» из `@/lib/messages` |
| **Progress step** | Trainer onboarding / booking wizard — visible step indicator |

---

## Requirements / Rules

### F1 — Labels & structure

| ID | Rule |
|----|------|
| F1-MUST-1 | Каждый input **MUST** иметь visible `<Label>` или `aria-label` / `aria-labelledby` |
| F1-MUST-2 | `htmlFor` / `id` связаны; не полагаться только на placeholder |
| F1-MUST-3 | Required fields — `(обязательно)` в label или `*` + legend «* — обязательные поля» на длинных формах |
| F1-MUST-4 | Группы полей — `<fieldset>` + `<legend>` для radio/tile role selection |
| F1-SHOULD-1 | Helper text под полем — `text-muted-foreground text-sm`; не путать с error |

### F2 — Field validation UX

| ID | Rule |
|----|------|
| F2-MUST-1 | Client HTML5 validation — дополнение, не замена server validation |
| F2-MUST-2 | Server validation error → `FieldError` + `data-invalid` / `aria-invalid="true"` на Field |
| F2-MUST-3 | Error border — `border-destructive`; focus ring остаётся visible (a11y) |
| F2-MUST-4 | Ошибки **не** только toast — field-level для исправимых полей |
| F2-MUST-5 | Первое invalid field **SHOULD** receive focus on submit fail (`focus()` or `scrollIntoView`) |
| F2-SHOULD-1 | Password strength — inline hints, не blocking modal |

**Anti-pattern:** красный toast без указания поля; placeholder как единственный label.

### F3 — Submit & pending

| ID | Rule |
|----|------|
| F3-MUST-1 | Primary submit — один на форму (P4); см. interaction contract I3 |
| F3-MUST-2 | `disabled={pending}` на submit и опционально на inputs при lock |
| F3-MUST-3 | `aria-busy={pending}` на submit или `<form>` |
| F3-MUST-4 | Label: idle vs gerund из `@/lib/messages` |
| F3-SHOULD-1 | `Loader2Icon` inline on submit button |

### F4 — Success feedback

| ID | Rule |
|----|------|
| F4-MUST-1 | Successful create/update — toast **или** redirect+query (interaction contract) |
| F4-MUST-2 | Multi-step «Next» без финального submit — **no** success toast until terminal step |
| F4-SHOULD-1 | Trainer profile sections — optional subtle «Saved» for autosave fields |

### F5 — Multi-step forms

| ID | Rule |
|----|------|
| F5-MUST-1 | Trainer onboarding (~5 steps) — **progress bar** or step dots; current step labeled |
| F5-MUST-2 | Booking wizard — **3 steps** with titles: Service → Slot → Confirm |
| F5-MUST-3 | «Back» — secondary `outline`; не сбрасывает valid data on client |
| F5-MUST-4 | Final step — primary «Confirm» / «Submit»; pending on confirm only |
| F5-SHOULD-1 | Draft save per onboarding step (server) — pending on «Next» |

**Mobile:** primary CTA sticky bottom above Bottom Nav (P3).

### F6 — Destructive form actions

| ID | Rule |
|----|------|
| F6-MUST-1 | Cancel booking, reject trainer — separate from submit; opens confirm sheet (I5) |
| F6-MUST-2 | Admin reject — **required** reason textarea in confirm sheet |
| F6-MUST-3 | Destructive button — `variant="destructive"`; not sole primary on same row as Save |

### F7 — Special inputs

| ID | Rule |
|----|------|
| F7-MUST-1 | Date/time slot pick — touch targets ≥ 44px; selected slot visually distinct (primary container) |
| F7-MUST-2 | File upload (certificates) — drag zone + button; progress during upload; error per file |
| F7-MUST-3 | Rating stars (review) — keyboard selectable; `aria-label` per star group |
| F7-MUST-4 | Timezone display — label shows trainer TZ; см. ADR-004 |

---

## Form catalog (MVP)

| Form / flow | Steps | Key validation UX |
|-------------|-------|-------------------|
| `/auth/login` | 1 | Generic auth error toast; field errors for empty |
| `/auth/register` | 1–2 | Role tiles → client fields |
| `/auth/register/trainer` | ~5 | Step progress; per-step server errors |
| `/book/[trainerId]` | 3 | Slot required; conflict toast |
| `/client/reviews/[bookingId]` | 1 | Rating required; text min length |
| `/trainer/profile` | 1 (sections) | Inline field errors |
| `/trainer/services` | modal/sheet | Price/duration validation |
| `/admin/trainers/[id]` reject | confirm sheet | Reason required |

---

## Happy paths

1. User submits valid login → pending gerund → redirect dashboard (no field errors).
2. Trainer onboarding step 2 invalid → inline errors on fields → fix → Next succeeds.
3. Booking wizard step 3 confirm → pending → redirect detail + booked toast.
4. Admin reject with reason → pending on confirm → toast → queue updates.

---

## Negative paths

| Сценарий | UX |
|----------|-----|
| Empty required field | HTML5 + server `VALIDATION`; focus first error |
| Wrong password | Generic toast; password field not marked «wrong password» specifically |
| Slot no longer available | Toast + remain on slot step; slots refresh |
| Upload too large | Field error under upload; form not fully locked |
| Network fail on submit | Form-level Alert or toast; inputs preserved |

---

## Security paths

| Сценарий | UX |
|----------|-----|
| CSRF | Server Actions framework default — no user-visible change |
| Tampered hidden fields | Server rejects; generic validation error |
| Auth register enumeration | Same error copy for duplicate email (generic) |

---

## Concurrency notes

| Scenario | Form UX |
|----------|---------|
| Double submit | pending disables submit |
| Stale step data | Server returns error; user stays on step |
| Autosave overlap | Debounce; show single «Saving…» indicator |

---

## Drift risks & guards

| Risk | Guard |
|------|-------|
| Duplicate validation messages | Single source `@/lib/messages` |
| shadcn Field not wired | Checklist F2-MUST-2 |
| Toast replaces field errors | F2-MUST-4 |
| Wizard step count ≠ PRD | 3 booking / ~5 trainer — pages spec |

---

## Cursor Rule / Guideline enforcement

| Area | Cursor Rule | Guideline |
|------|-------------|-----------|
| Forms | `ui-mutation-pending`, `ui-toast-mutations` | [`ai_form_handling_pattern.md`](../guidelines/react/ai_form_handling_pattern.md) |
| Admin layout | `admin-forms-layout` | — |
| A11y | `ui-semantics-a11y` | [`ai_semantics_a11y_guidelines.md`](../guidelines/react/ai_semantics_a11y_guidelines.md) |
| Copy | `ui-messages-and-copy` | [`content_and_microcopy_contract.md`](./content_and_microcopy_contract.md) |

---

## Acceptance criteria

- [ ] F1–F7 with MUST/SHOULD
- [ ] MVP form catalog table complete
- [ ] Field vs form vs toast error hierarchy clear
- [ ] Multi-step rules aligned with pages spec
- [ ] Happy / negative / security / concurrency / drift sections
- [ ] Backlink in `interaction_design_contract.md`

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`ui_states_contract.md`](./ui_states_contract.md) | Form loading/error states |
| [`interaction_design_contract.md`](./interaction_design_contract.md) | Pending, toast, confirm |
| [`ux_ui_principles.md`](./ux_ui_principles.md) | P1, P3, P4 |
| [`pages_functional_spec.md`](../prds/01_product_scope/pages_functional_spec.md) | Form-heavy routes |
| [`accessibility_requirements.md`](./accessibility_requirements.md) | Labels, focus, errors a11y |

**Registry:** [`documentation_creation_registry.md`](../meta/documentation_creation_registry.md) — wave W7-03

---

## Agent notes

- Prefer `useActionState` when server returns `MutationResult` with field errors.
- `useFormStatus` in child submit button when form action on parent.
- Do not use optimistic UI for full form submit flows.
- Date/time inputs: display in trainer timezone per ADR-004.

---

## Change log

| Date | Change |
|------|--------|
| 2026-05-23 | v1.0 — forms and validation UX (W7-03) |
