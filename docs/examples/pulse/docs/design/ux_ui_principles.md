# UX/UI Principles — Pulse MVP

**Тип:** UX Contract  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-05-23  
**Волна:** W2  
**Зависит от:** [`pages_functional_spec.md`](../prds/01_product_scope/pages_functional_spec.md), [`Fitness_Platform_Prototype_v1.html`](../prototypes/Fitness_Platform_Prototype_v1.html)  
**Связанные документы:** [`responsive_navigation_contract.md`](./responsive_navigation_contract.md), [`visual_identity_contract.md`](./visual_identity_contract.md), [`accessibility_requirements.md`](./accessibility_requirements.md), [`prototype_route_mapping.md`](./prototype_route_mapping.md)

**Migrated from:** `docs/default_docs/fitness-platform-pages.md` § UX-принципы; user flows § role-specific UX

---

## Purpose

Канонические **UX-принципы Pulse MVP** для клиентов, тренеров и админов. Документ задаёт правила принятия решений при проектировании экранов, wireframes (W10) и реализации UI. Enforcement layer для кода — Cursor Rules и `docs/guidelines/`.

**Аудитория:** product, design, AI-агенты при реализации `apps/web`.

---

## Scope / Out of scope

**In scope:** принципы взаимодействия, иерархия действий, feedback, mobile-first поведение, связь с прототипом.

**Out of scope:** hex-токены и типографика (→ [`visual_identity_contract.md`](./visual_identity_contract.md)); детали навигации (→ [`responsive_navigation_contract.md`](./responsive_navigation_contract.md)); toast/optimistic паттерны (→ [`interaction_design_contract.md`](./interaction_design_contract.md)); бизнес-логика booking/auth.

---

## Definitions

| Термин | Значение |
|--------|----------|
| **Primary CTA** | Единственная главная кнопка экрана — `Button` variant `default` |
| **Secondary action** | `outline`, `ghost`, `link` — не конкурирует с primary |
| **Destructive action** | `destructive` + confirm dialog до мутации |
| **Thumb zone** | Нижняя треть viewport на mobile — зона primary touch targets |
| **Zero Dead End** | Empty/error state **всегда** содержит следующий шаг (CTA или link) |

---

## Requirements / Rules

### P1 — Progressive Disclosure

| ID | Rule |
|----|------|
| P1-MUST-1 | На экране показывать **только** информацию, нужную для текущего шага или задачи |
| P1-MUST-2 | Детали второго уровня — через **Tabs**, **Sheet**, **Dialog**, accordion — не перегружать первый экран |
| P1-SHOULD-1 | Booking wizard — **3 шага** (Service → Slot → Confirm); прогресс виден на каждом шаге |
| P1-SHOULD-2 | Trainer onboarding — multi-step с progress bar; auto-save при «Next» |

**Прототип:** `BookingFlow` — пошаговый выбор услуги и слота; `TrainerProfile` — табы About / Services / Schedule / Reviews.

**Anti-pattern:** все поля профиля тренера на одной длинной форме без группировки.

### P2 — Zero Dead Ends

| ID | Rule |
|----|------|
| P2-MUST-1 | **Empty state** списков — иллюстрация/иконка + заголовок + **primary или secondary CTA** |
| P2-MUST-2 | **Error state** — человекочитаемое объяснение + **Retry** или альтернативный путь |
| P2-MUST-3 | **403 / wrong role** — redirect login или forbidden shell с CTA «На главную» / «Войти» |
| P2-MUST-4 | Admin «All caught up» — позитивный empty (очередь пуста), не пустой экран |

**Примеры MVP:**

| Экран | Empty CTA |
|-------|-----------|
| `/client/bookings` (нет upcoming) | «Найти тренера» → `/trainers` |
| `/trainers` (нет результатов фильтра) | «Сбросить фильтры» |
| `/admin/complaints` (очередь пуста) | Подтверждение «Всё в порядке» |

**Anti-pattern:** «No data» без кнопки или ссылки.

### P3 — Thumb Zone First (Mobile)

| ID | Rule |
|----|------|
| P3-MUST-1 | Primary CTA на mobile — **sticky bottom bar**, bottom sheet footer или зона над Bottom Nav |
| P3-MUST-2 | Bottom Nav — sticky `bottom-0`, safe-area inset (`env(safe-area-inset-bottom)`) |
| P3-MUST-3 | Контент страницы — `pb-6` минимум над fixed/sticky bottom UI |
| P3-SHOULD-1 | Деструктивные действия **не** в thumb zone без confirm |

**Прототип:** sticky «Book session» на `TrainerProfile`; wizard CTA в нижней части `BookingFlow`.

**Anti-pattern:** единственная primary кнопка в верхнем правом углу на 375px viewport.

### P4 — One Primary Action

| ID | Rule |
|----|------|
| P4-MUST-1 | **Один** `Button` variant `default` на экран (view), исключая modals/sheets как overlay |
| P4-MUST-2 | Вторичные действия — `outline` / `ghost`; не более 2 visible secondary рядом с primary |
| P4-MUST-3 | Admin Approve/Reject — Reject `outline`/`destructive`, Approve `default`; визуально разведены |

**Anti-pattern:** два filled green buttons одного веса («Save» и «Continue» без иерархии).

### P5 — Immediate Feedback

| ID | Rule |
|----|------|
| P5-MUST-1 | Мутации данных — **Sonner toast** (success/error) или redirect + query toast pattern |
| P5-MUST-2 | In-flight — `disabled` + `aria-busy` на submit; gerund label из `@/lib/messages` |
| P5-SHOULD-1 | Wishlist / service active toggle — **optimistic UI** + `toast.error` при откате |
| P5-SHOULD-2 | Фильтры каталога — мгновенный UI response (optimistic или local state) |

**Enforcement:** `ui-toast-mutations`, `ui-mutation-pending`, `ui-optimistic-mutations`.

### P6 — Skeleton Loading

| ID | Rule |
|----|------|
| P6-MUST-1 | Async lists/cards — **Skeleton**, повторяющий layout финального контента |
| P6-MUST-2 | Не full-page spinner для partial regions — **Suspense boundaries** per region |
| P6-SHOULD-1 | KPI grid, trainer cards, booking rows — отдельные skeleton shapes |

**Anti-pattern:** центральный `Loader2` без структуры контента.

### P7 — Edge-to-Edge Mobile

| ID | Rule |
|----|------|
| P7-MUST-1 | Hero, cover photo, horizontal chips — `-mx-4 md:mx-0` на mobile |
| P7-MUST-2 | Edge-to-edge **только** `< md`; tablet+ возвращает page padding |
| P7-SHOULD-1 | Horizontal chip scroll — `overflow-x-auto no-scrollbar` |

**Прототип:** cover photo trainer profile; filter chips на catalog.

### P8 — Prototype Fidelity

| ID | Rule |
|----|------|
| P8-MUST-1 | Шрифты, размеры заголовков, spacing — из Warm Forest + HTML-прототип |
| P8-MUST-2 | Прототип **subordinate** canonical routes и PRD — не копировать post-MVP UI (video room, Stripe) |
| P8-SHOULD-1 | Role switcher в прототипе — dev-only; в prod — реальная auth session |

---

## Happy paths

1. **Discovery → booking:** каталог → профиль → login (если нужно) → wizard 3 шага → toast + redirect на booking detail.
2. **Trainer day:** dashboard KPI → schedule → toggle service → clients list → notes autosave.
3. **Admin moderation:** queue badge → application detail → approve sheet → toast → queue count обновлён.

---

## Negative paths

| Сценарий | UX response |
|----------|-------------|
| Login failure | Generic toast «Неверный email или пароль» — без утечки существования аккаунта |
| Slot taken при confirm | Error toast + refresh slots; wizard остаётся на шаге |
| Trainer not approved | Banner «Under review»; public listing скрыт |
| Post-MVP feature tap (video) | Toast «Скоро» / disabled — не silent fail |

Детали UX states — [`ui_states_contract.md`](./ui_states_contract.md).

---

## Security paths

| Сценарий | UX |
|----------|-----|
| Unauthenticated protected route | Redirect `/auth/login?callbackUrl=` |
| Wrong role prefix | Login redirect; не показывать чужой shell |
| Sensitive admin action | Confirm dialog; no optimistic success |

Matrix: W5 [`authorization_matrix.md`](../prds/04_authorization_privacy/authorization_matrix.md) *(planned)*.

---

## Concurrency notes

UI при race — disabled submit, error toast, optimistic rollback. Resolution — contracts W8; здесь только UX исход.

| Surface | UX при конфликте |
|---------|------------------|
| Booking confirm | Error toast; пользователь остаётся в wizard |
| Wishlist toggle | Rollback + `toast.error` |
| Double submit form | `aria-busy` блокирует повтор |

---

## Drift risks & guards

| Risk | Guard |
|------|-------|
| Дублирование UX rules в specs | Ссылка на этот файл; не копировать таблицы принципов |
| Прототип ≠ MVP scope | [`prototype_route_mapping.md`](./prototype_route_mapping.md) + `post_mvp_deferrals.md` |
| Guidelines vs contract | Contract = product canon; guidelines = code enforcement |

---

## Cursor Rule / Guideline enforcement

| Principle | Cursor Rule | Guideline |
|-----------|-------------|-----------|
| P3, P7 | `ui-mobile-first` | — |
| P5 | `ui-toast-mutations`, `ui-mutation-pending`, `ui-optimistic-mutations` | `ai_form_handling_pattern.md` |
| P6 | `app-router-streaming-loading` | `ai_loading_patterns.md` |
| P8 | `ui-prototype-fidelity`, `ui-warm-forest-shadcn` | `typography_text_guidelines.md` |
| Semantic/a11y | `ui-semantics-a11y` | `ai_semantics_a11y_guidelines.md` |
| Copy | `ui-messages-and-copy` | `copy_and_messages.md` |

---

## Acceptance criteria

- [ ] Все 8 принципов (P1–P8) с MUST/SHOULD и anti-patterns
- [ ] Happy / negative / security / concurrency / drift секции present
- [ ] Таблица enforcement → Cursor Rules
- [ ] Нет duplicate route list (только ссылка на `canonical_routes.md`)
- [ ] Backlinks в `pages_functional_spec.md` обновлены
- [ ] Прототип cited как visual reference, не как product law для post-MVP

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`pages_functional_spec.md`](../prds/01_product_scope/pages_functional_spec.md) | Page-level behavior |
| [`responsive_navigation_contract.md`](./responsive_navigation_contract.md) | Nav shell (W2-02) |
| [`visual_identity_contract.md`](./visual_identity_contract.md) | Tokens & typography (W2-03) |
| [`accessibility_requirements.md`](./accessibility_requirements.md) | WCAG layer (W2-04) |
| [`prototype_route_mapping.md`](./prototype_route_mapping.md) | Prototype ↔ routes (W2-05) |
| [`interaction_design_contract.md`](./interaction_design_contract.md) | Toast, optimistic, confirm (W7) |
| [`ui_states_contract.md`](./ui_states_contract.md) | Empty/loading/error matrix (W7) |
| [`forms_and_validation_ux.md`](./forms_and_validation_ux.md) | Form field UX (W7) |
| [`content_and_microcopy_contract.md`](./content_and_microcopy_contract.md) | Tone & `@/lib/messages` (W7) |
| [`styleguide.md`](./styleguide.md) | Component recipes (W7) |
| [`global_shell_spec.md`](../implementation/mvp/specs/global_shell_spec.md) | App shell implementation (W9) |

**Registry:** [`documentation_creation_registry.md`](../meta/documentation_creation_registry.md) — wave W2-01

---

## Agent notes

- Не описывать hex/radius здесь — только поведенческие правила.
- «One Primary Action» — per **view**; modal может иметь свой primary без нарушения parent screen.
- Прототип `VideoSession` — post-MVP; MVP `/sessions/[sessionId]` — placeholder text only.
- При конфликте с interim `fitness-platform-pages.md` — этот файл wins.

---

## Change log

| Date | Change |
|------|--------|
| 2026-05-23 | v1.0 — canonical UX principles (W2-01) |
