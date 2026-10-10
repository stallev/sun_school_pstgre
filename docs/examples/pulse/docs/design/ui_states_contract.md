# UI States Contract — Pulse MVP

**Тип:** UX Contract  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-05-23  
**Волна:** W7  
**Зависит от:** [`ux_ui_principles.md`](./ux_ui_principles.md), [`ai_loading_patterns.md`](../guidelines/nextjs/ai_loading_patterns.md)  
**Связанные документы:** [`interaction_design_contract.md`](./interaction_design_contract.md), [`pages_functional_spec.md`](../prds/01_product_scope/pages_functional_spec.md)

---

## Purpose

Канон **first-class UI states** для Pulse MVP: `empty`, `loading`, `error`, `forbidden` — per async region и per screen type. Отделяет **route/navigation loading** (Suspense, `loading.tsx`) от **mutation pending** (→ [`interaction_design_contract.md`](./interaction_design_contract.md)).

**Аудитория:** design, AI-агенты при wireframes (W10) и реализации `apps/web`.

---

## Scope / Out of scope

**In scope:** state matrix по типам экранов, skeleton rules, empty/error/forbidden patterns, Zero Dead Ends enforcement.

**Out of scope:** toast/pending на мутациях (→ interaction contract); form field errors (→ [`forms_and_validation_ux.md`](./forms_and_validation_ux.md)); authorization matrix (→ W5); hex/visual tokens (→ [`visual_identity_contract.md`](./visual_identity_contract.md)).

---

## Definitions

| State | Meaning | Typical mechanism |
|-------|---------|-------------------|
| **loading** | Данные региона ещё не пришли | `loading.tsx`, `<Suspense fallback>`, Skeleton |
| **empty** | Успешный ответ, zero rows | Empty state component + CTA |
| **error** | Fetch/action failed recoverable | `error.tsx`, inline Alert + Retry |
| **forbidden** | 403 / wrong role / unauthenticated | Redirect or forbidden shell |
| **mutation pending** | In-flight submit/toggle | Not a route state — см. I3 interaction contract |

---

## Requirements / Rules

### S1 — Loading

| ID | Rule |
|----|------|
| S1-MUST-1 | Async lists/cards — **Skeleton**, повторяющий layout финального контента (P6) |
| S1-MUST-2 | Independent data regions — **отдельные** Suspense boundaries (Context7 / Next.js 16 streaming) |
| S1-MUST-3 | Не full-page spinner для partial regions |
| S1-MUST-4 | `page.tsx` — лёгкий shell (params, auth, static chrome); тяжёлые `await` в child components |
| S1-SHOULD-1 | KPI grid, trainer cards, booking rows — distinct skeleton shapes |
| S1-MUST-5 | Не дублировать один и тот же full-page UI в `loading.tsx` **и** outer Suspense |

**Mechanisms (Next.js 16):**

| Mechanism | When |
|-----------|------|
| `loading.tsx` | New route segment navigation — instant route shell |
| `<Suspense fallback={<Skeleton />}>` | Multiple independent sources on one page |
| `error.tsx` | Pair with Suspense for fallible regions |

### S2 — Empty

| ID | Rule |
|----|------|
| S2-MUST-1 | Empty = icon/illustration + **heading** + **body** + **CTA or link** (P2 Zero Dead Ends) |
| S2-MUST-2 | Тексты из `@/lib/messages` — namespace `{domain}.empty.*` |
| S2-MUST-3 | Admin «All caught up» — **позитивный** empty (очередь пуста), не blank screen |
| S2-SHOULD-1 | Catalog filter empty — secondary CTA «Сбросить фильтры» |

### S3 — Error

| ID | Rule |
|----|------|
| S3-MUST-1 | Recoverable fetch error — `Alert` destructive variant + **Retry** button |
| S3-MUST-2 | Mutation error — `toast.error` (interaction contract) + preserve form input where safe |
| S3-MUST-3 | Non-recoverable (404 booking) — `notFound()` or dedicated empty-not-found with CTA home |
| S3-SHOULD-1 | `error.tsx` — log server-side; user sees generic message |

### S4 — Forbidden

| ID | Rule |
|----|------|
| S4-MUST-1 | Unauthenticated protected route → redirect `/auth/login?callbackUrl=` |
| S4-MUST-2 | Wrong role prefix → redirect login; **не** показывать чужой role shell |
| S4-MUST-3 | Object-level 403 (IDOR) → forbidden message + CTA «На главную» / dashboard role |
| S4-MUST-4 | Trainer `status != approved` — banner «Under review»; public listing hidden — не forbidden для owner |

### S5 — UI states matrix (by screen type)

#### Lists (bookings, catalog, admin queues)

| State | Visual | CTA |
|-------|--------|-----|
| loading | Row/card skeletons × N | — |
| empty | Icon + title + description | Primary path (e.g. «Найти тренера») |
| error | Alert + Retry | Retry refetch |
| forbidden | Redirect or minimal shell | Login / Home |

#### Detail pages (booking, trainer application, complaint)

| State | Visual | CTA |
|-------|--------|-----|
| loading | Header skeleton + body blocks | — |
| empty | N/A (404 if missing) | — |
| error | Alert region | Retry / back to list |
| forbidden | Forbidden card | Role dashboard link |

#### Dashboards (client, trainer, admin)

| State | Visual | CTA |
|-------|--------|-----|
| loading | KPI skeleton grid + list skeleton | — |
| partial empty | KPI show zeros; section empty with local CTA | Per-section |
| error | Section-level error without killing whole dashboard | Retry per region |

#### Forms (auth, onboarding, review)

| State | Visual | CTA |
|-------|--------|-----|
| loading initial | Full form skeleton rare — prefer instant shell | — |
| validation error | Inline field errors | Fix fields |
| server error | Form-level Alert or toast | Retry submit |
| success | Toast or redirect+query | Next step |

#### Wizard (booking)

| State | Visual | CTA |
|-------|--------|-----|
| loading slots | Slot grid skeleton | — |
| empty slots | «Нет доступных слотов» + change date/service | Back step |
| slot conflict | Error toast | Refresh slots (interaction contract) |

---

## MVP route × state checklist

Ссылка на paths: [`canonical_routes.md`](./canonical_routes.md). Поведение страниц: [`pages_functional_spec.md`](../prds/01_product_scope/pages_functional_spec.md).

| Route group | loading | empty | error | forbidden |
|-------------|:-------:|:-----:|:-----:|:---------:|
| `/trainers` | grid skeleton | no results + reset filters | Alert + Retry | public |
| `/trainers/[id]` | profile skeleton | — | notFound | public (limited if unapproved) |
| `/client/bookings` | tab list skeleton | upcoming empty → find trainer | region error | client |
| `/client/bookings/[id]` | detail skeleton | — | notFound / error | owner client |
| `/trainer/services` | list skeleton | «Add first service» | Alert | trainer |
| `/trainer/schedule` | grid skeleton | no rules yet → setup CTA | Alert | trainer |
| `/admin/trainers` | queue skeleton | positive empty queue | Alert | admin |
| `/admin/complaints` | list skeleton | «All caught up» | Alert | admin |
| `/book/[trainerId]` | step skeleton | no slots | slot error toast | client |

---

## Happy paths

1. Navigate `/trainers` → instant shell + bottom nav → skeleton grid → populated cards.
2. `/client/bookings` upcoming tab empty → illustration + «Найти тренера» → `/trainers`.
3. Admin queue loaded, zero pending → success empty «Очередь пуста».
4. Booking detail error on fetch → Alert + Retry → successful render.

---

## Negative paths

| Сценарий | State handling |
|----------|----------------|
| Catalog filter → 0 results | **empty**, not error |
| API 500 on list | **error** + Retry; keep filters |
| Expired session mid-navigation | **forbidden** → login redirect |
| Trainer pending verification views own dashboard | banner warning, not 403 |
| Post-MVP feature (video room) | disabled UI + «Скоро» — not silent empty |

---

## Security paths

| Сценарий | State |
|----------|-------|
| Client opens `/trainer/*` | forbidden → login redirect |
| Client A opens Client B booking id | forbidden shell — no data leak in skeleton |
| Admin-only list as trainer | 403 — no row preview in HTML |

Authorization canon: [`authorization_matrix.md`](../prds/04_authorization_privacy/authorization_matrix.md).

---

## Concurrency notes

| Scenario | UI state behavior |
|----------|-------------------|
| Stale list after mutation | Revalidate/refetch; optional brief loading on manual refresh |
| Optimistic toggle fail | Revert visual state + error toast — list row count unchanged |
| Navigate away during loading | Cancel is implicit (React abort); no error toast |

Race resolution — contracts W8; spec/wireframe **ссылается**, не дублирует.

---

## Drift risks & guards

| Risk | Guard |
|------|-------|
| Spinner instead of skeleton | Review against S1-MUST-1 |
| Empty without CTA | P2 checklist in wireframes W10 |
| `loading.tsx` for button clicks | Separate mutation pending |
| One error boundary kills dashboard | Section-level Suspense + error |
| States not in wireframe | W10 template requires state list |

---

## Cursor Rule / Guideline enforcement

| State | Cursor Rule | Guideline |
|-------|-------------|-----------|
| loading | `app-router-streaming-loading` | [`ai_loading_patterns.md`](../guidelines/nextjs/ai_loading_patterns.md) |
| empty/error | `ux_ui_principles` P2 | this contract |
| forbidden | `auth-security`, `policy-packages` | [`authorization_matrix.md`](../prds/04_authorization_privacy/authorization_matrix.md) |
| visual | `ui-warm-forest-shadcn` | [`visual_identity_contract.md`](./visual_identity_contract.md) |

---

## Acceptance criteria

- [ ] S1–S5 with MUST/SHOULD rules
- [ ] Screen-type matrix (lists, detail, dashboard, forms, wizard)
- [ ] MVP route × state checklist covers canonical MVP paths
- [ ] Distinction loading vs mutation pending explicit
- [ ] Happy / negative / security / concurrency / drift sections
- [ ] Backlinks in `pages_functional_spec.md`, `ux_ui_principles.md`

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`ux_ui_principles.md`](./ux_ui_principles.md) | P2, P6 — parent principles |
| [`interaction_design_contract.md`](./interaction_design_contract.md) | Mutation feedback |
| [`forms_and_validation_ux.md`](./forms_and_validation_ux.md) | Form error states |
| [`pages_functional_spec.md`](../prds/01_product_scope/pages_functional_spec.md) | Per-page behavior |
| [`cache_revalidation_policy.md`](../prds/05_runtime/cache_revalidation_policy.md) | Post-mutation refresh |
| *(planned)* `wireframes/mvp/*` (W10) | Per-route state annotations |

**Registry:** [`documentation_creation_registry.md`](../meta/documentation_creation_registry.md) — wave W7-02

---

## Agent notes

- Skeleton **must** match card geometry from [`styleguide.md`](./styleguide.md) (W7-05).
- Public catalog may show loading while authenticated shell also loads — independent Suspense regions.
- `forbidden` ≠ HTTP 404 — different copy and CTA.
- Wireframes (W10): каждый async block перечисляет 4 states или «N/A static».

---

## Change log

| Date | Change |
|------|--------|
| 2026-05-23 | v1.0 — UI states contract (W7-02) |
