# Content and Microcopy Contract — Pulse MVP

**Тип:** UX Contract  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-05-23  
**Волна:** W7  
**Зависит от:** [`copy_and_messages.md`](../guidelines/react/copy_and_messages.md)  
**Связанные документы:** [`interaction_design_contract.md`](./interaction_design_contract.md), [`ui_states_contract.md`](./ui_states_contract.md)

**Migrated from:** product tone in `default_docs/fitness-platform-pages.md`; structure from lampto copy guidelines

---

## Purpose

Канон **тона, структуры и правил microcopy** Pulse MVP: что пишем пользователю, где хранятся строки, как формулируем toast, empty states, errors и pending labels. Продуктовый контракт; реализация — `@/lib/messages` + Cursor Rule `ui-messages-and-copy`.

**Аудитория:** product, content, AI-агенты — **запрещено** дублировать user-visible строки вне messages.

---

## Scope / Out of scope

**In scope:** tone of voice, message namespaces, toast/empty/error patterns, gerund pending labels, security-safe auth copy, i18n readiness rules.

**Out of scope:** marketing landing long-form (minimal on MVP `/`); legal pages post-MVP; email templates (→ [`email_notifications_matrix.md`](../prds/01_product_scope/email_notifications_matrix.md) post-MVP).

---

## Definitions

| Термин | Значение |
|--------|----------|
| **MESSAGES** | Exported object from `@/lib/messages` (default `ru.ts`) |
| **Namespace** | Top-level key: `auth`, `booking`, `trainer`, `admin`, `catalog`, `site`, `common` |
| **Gerund pending** | Short in-progress label on buttons: «Сохраняем…», «Бронируем…» |
| **Generic auth error** | Single message hiding account enumeration |

---

## Tone of voice

| Pillar | DO | DON'T |
|--------|----|-------|
| **Trust** | Clear, calm, specific next step | Alarmist или blame user |
| **Energy** | Active verbs, concise | Corporate jargon |
| **Human** | «Вы» / neutral imperative in RU MVP | Mixed ты/вы in same flow |
| **Honest** | «Скоро» for post-MVP features | Promise payment/video on MVP |

**Voice examples:**

| Context | Good | Bad |
|---------|------|-----|
| Empty bookings | «У вас пока нет предстоящих занятий» + CTA | «No data» |
| Error retry | «Не удалось загрузить. Попробуйте ещё раз.» | «Error 500» |
| Success booking | «Бронирование создано» | «Success!» |
| Pending trainer | «Профиль на проверке» | «ERROR: not approved» |

---

## Requirements / Rules

### C1 — Single source

| ID | Rule |
|----|------|
| C1-MUST-1 | All user-visible strings in **`@/lib/messages`** — components, actions, metadata |
| C1-MUST-2 | Keys — **English identifiers**; values — Russian for MVP |
| C1-MUST-3 | Same semantic error — **one** message key; no divergent action vs UI text |
| C1-MUST-4 | Enum **values** in code from `@pulse/domain`; **labels** in messages |

### C2 — Namespace structure

| Namespace | Contains |
|-----------|----------|
| `site` | App name, default metadata title/description |
| `common` | Retry, Cancel, Back, Save, generic errors |
| `auth` | Login, register, logout, password, generic auth failure |
| `booking` | Status labels, wizard steps, actions, validation, server errors, pending |
| `trainer` | Onboarding steps, schedule, services, under-review banner |
| `admin` | Queue labels, approve/reject, moderation, pending |
| `catalog` | Filters, sort, wishlist, empty catalog |
| `toast` | Optional shared toast titles if not colocated in domain namespace |

**SHOULD:** colocate toast with domain (`booking.createdToast`) unless shared.

### C3 — Toast copy

| ID | Rule |
|----|------|
| C3-MUST-1 | Success toast — **past or result statement**: «Сохранено», «Бронирование создано» |
| C3-MUST-2 | Error toast — **actionable or clear cause**: «Не удалось сохранить. Попробуйте позже.» |
| C3-MUST-3 | Duration — `PRODUCT_TOAST_DURATION_MS` (2000 ms); not overridden ad hoc |
| C3-MUST-4 | Optimistic error — domain-specific: «Не удалось обновить избранное» |
| C3-MAY-1 | Optimistic success toast — omit when visual state sufficient |

### C4 — Empty states

| ID | Rule |
|----|------|
| C4-MUST-1 | Structure: `title` + `description` + `actionLabel` keys per empty variant |
| C4-MUST-2 | Admin positive empty — celebratory neutral: «Все заявки обработаны» |
| C4-MUST-3 | CTA labels — verbs: «Найти тренера», «Сбросить фильтры» |

### C5 — Validation & errors

| ID | Rule |
|----|------|
| C5-MUST-1 | Field errors — specific: «Укажите email» |
| C5-MUST-2 | Login failure — **generic**: «Неверный email или пароль» |
| C5-MUST-3 | Register duplicate email — generic or «Не удалось создать аккаунт» — no «email exists» |
| C5-SHOULD-1 | Separate `*.validation.*` vs `*.server.*` keys where helpful |

### C6 — Pending (gerund) labels

| ID | Rule |
|----|------|
| C6-MUST-1 | Pattern: present continuous «…ем/…им» + ellipsis optional |
| C6-MUST-2 | One pending key per primary action: `submitting`, `booking`, `saving`, `approving` |
| C6-MUST-3 | Do not use pending text as toast |

**Examples:**

| Action | Idle | Pending |
|--------|------|---------|
| Save profile | «Сохранить» | «Сохраняем…» |
| Confirm booking | «Подтвердить» | «Бронируем…» |
| Admin approve | «Одобрить» | «Одобряем…» |

### C7 — Status & badges

| ID | Rule |
|----|------|
| C7-MUST-1 | Booking/trainer status labels — keys mirroring domain enums |
| C7-SHOULD-1 | Short labels for badges; longer for detail pages |
| C7-MUST-2 | Map in one module — no inline Russian status strings in TSX |

Domain statuses: [`lifecycle_models.md`](../prds/02_domain_model/lifecycle_models.md).

### C8 — i18n (P17)

| ID | Rule |
|----|------|
| C8-MUST-1 | User-visible copy in `@/lib/messages` — **`en.ts` + `ru.ts`** with shared `Messages` type |
| C8-MUST-2 | New keys added to **both** locale files in same change |
| C8-SHOULD-1 | No string concatenation with word order assumptions — use `{name}` placeholders |
| C8-SHOULD-2 | Pluralization — keyed branches (`bookings.count.one/few/many`) |
| C8-SHOULD-3 | Dates/money via `@/lib/i18n/format.ts` — not embedded in message strings |

**Canon:** [`adr_009_ui_locale_strategy.md`](../prds/07_governance/adr_009_ui_locale_strategy.md), [`i18n_runtime_spec.md`](../implementation/mvp/contracts/i18n_runtime_spec.md), [`copy_and_messages.md`](../guidelines/react/copy_and_messages.md).

---

## Happy paths

1. Developer adds booking success → adds `booking.toast.created` in messages → uses in RedirectToast.
2. Empty client bookings → `catalog.empty.upcomingTitle` + action from messages.
3. Wishlist error → single `catalog.wishlistError` in toast and nowhere else.

---

## Negative paths

| Scenario | Copy rule |
|----------|-----------|
| Server unknown error | `common.errorGeneric` — no stack trace |
| Partial form fail | Field-specific keys — not generic only |
| Rate limit (future) | `common.tooManyRequests` — calm, retry later |

---

## Security paths

| Scenario | Copy |
|----------|------|
| Login fail | Generic auth message (C5-MUST-2) |
| Reset password request | «Если аккаунт существует, мы отправим письмо» (post-MVP email) |
| 403 page | «У вас нет доступа» — no resource id leak |

Privacy: [`privacy_data_handling.md`](../prds/04_authorization_privacy/privacy_data_handling.md).

---

## Concurrency notes

N/A for copy layer — same messages whether race or not; UI may show generic server error.

---

## Drift risks & guards

| Risk | Guard |
|------|-------|
| Hardcoded Russian in TSX | Code review + `ui-messages-and-copy` |
| Action returns English errors | Actions return codes; UI maps to messages |
| Prototype strings copied | Extract to messages on implement |
| Toast ≠ empty copy duplication | Shared `description` keys where identical |

---

## Cursor Rule / Guideline enforcement

| Layer | Enforcement |
|-------|-------------|
| Code | `ui-messages-and-copy.mdc` |
| Structure | [`copy_and_messages.md`](../guidelines/react/copy_and_messages.md) |
| Toast timing | `ui-toast-mutations.mdc` |
| Product canon | **this contract** |

---

## Acceptance criteria

- [ ] Tone table + DO/DON'T
- [ ] C1–C8 MUST/SHOULD rules
- [ ] Namespace map for MVP domains
- [ ] Toast, empty, validation, pending patterns documented
- [ ] Security-safe auth copy explicit
- [ ] Happy / negative / security sections; drift guards
- [ ] Backlink in `interaction_design_contract.md`

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`copy_and_messages.md`](../guidelines/react/copy_and_messages.md) | Implementation guide |
| [`interaction_design_contract.md`](./interaction_design_contract.md) | When to toast |
| [`ui_states_contract.md`](./ui_states_contract.md) | Empty/error copy placement |
| [`forms_and_validation_ux.md`](./forms_and_validation_ux.md) | Field error display |
| [`typography_text_guidelines.md`](../guidelines/typography_text_guidelines.md) | Typography atoms for text |

**Registry:** [`documentation_creation_registry.md`](../meta/documentation_creation_registry.md) — wave W7-04

---

## Agent notes

- Metadata in `layout.tsx` — `site.title`, `site.description` from messages.
- Lucide icons — no text in icons; always visible or sr-only label.
- Admin reject reasons — preset chips (optional) + free text; labels in `admin.reject.*`.
- Do not translate domain enum strings in DB — only UI labels.

---

## Change log

| Date | Change |
|------|--------|
| 2026-05-23 | v1.0 — content and microcopy contract (W7-04) |
