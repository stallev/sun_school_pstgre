# Pages Functional Specification — Pulse MVP

**Тип:** PRD / Spec  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-05-23  
**Волна:** W1  
**Зависит от:** [`mvp_scope.md`](./mvp_scope.md), [`canonical_routes.md`](../../design/canonical_routes.md), [`default_docs/fitness-platform-pages.md`](../../default_docs/fitness-platform-pages.md)  
**Связанные документы:** [`user_flows/users_mvp/`](./user_flows/users_mvp/), [`post_mvp_deferrals.md`](./post_mvp_deferrals.md), [`ux_ui_principles.md`](../../design/ux_ui_principles.md)

**Migrated from:** `docs/default_docs/fitness-platform-pages.md` (UI tokens → planned design contracts W2/W7)

---

## Purpose

Поведенческая спецификация **экранов MVP**: layout по breakpoints, primary actions, async states, auth gates. Единственный полный список URL — [`canonical_routes.md`](../../design/canonical_routes.md); здесь — **что** делает каждая страница, не дублирование route tree.

---

## Scope / Out of scope

**In scope:** все MVP routes из canonical_routes (✅), global shell, responsive rules, UX principles summary, per-page MUST behavior.

**Out of scope:** hex tokens (→ [`visual_identity_contract.md`](../../design/visual_identity_contract.md)), wireframes (W10), implementation code samples (→ guidelines), post-MVP routes.

---

## Route reference

**MUST** — не поддерживать второй route inventory. Таблицы ниже ссылаются на path из [`canonical_routes.md`](../../design/canonical_routes.md).

| Route group | Layout |
|-------------|--------|
| `(public)` | Top bar; без role nav |
| `(booking)` | Stripped chrome — wizard focus |
| `(client)` \| `(trainer)` \| `(admin)` | Top bar + bottom nav `<md` + sidebar `≥md` |

---

## Responsive & UX principles

### Breakpoints (Tailwind default)

| Zone | Range | Navigation |
|------|-------|------------|
| Mobile | `< md` (768px) | Bottom nav sticky |
| Tablet/Desktop | `≥ md` | Sidebar `hidden md:flex` |
| Desktop filters | `≥ lg` (1024px) | Filter sidebar on catalog |

**Critical prototype rules:** `md:hidden` bottom nav; `hidden md:flex` sidebar; edge-to-edge `-mx-4` only on mobile.

### UX principles (enforcement)

| Principle | Application |
|-----------|-------------|
| Progressive Disclosure | Wizard steps, tabs, sheets |
| Zero Dead Ends | Empty/error + CTA |
| Thumb Zone | Primary CTA bottom on mobile |
| One Primary Action | One `Button` default variant per screen |
| Immediate Feedback | Toast on mutations; optimistic toggles |
| Skeleton Loading | Match content layout |

Canon: [`ux_ui_principles.md`](../../design/ux_ui_principles.md), [`responsive_navigation_contract.md`](../../design/responsive_navigation_contract.md). Cursor Rules: `ui-mobile-first`, `ui-prototype-fidelity`.

---

## Global shell

### Top bar (all authenticated + public)

- Sticky `top-0`, blur backdrop, logo + utilities
- Mobile: hide avatar in bar (`hidden md:inline-flex` for avatar)
- Notifications popover: fixed below bar; overlay dismiss

### Role navigation

| Role | Bottom nav (mobile) | Sidebar (md+) |
|------|---------------------|---------------|
| Client | Home, Trainers, Sessions, Profile | Same labels |
| Trainer | Today, Schedule, Services, Clients, Income | + badges where needed |
| Admin | Overview, Trainers, Complaints, Refunds | Badge counts on queue |

Paths: см. user flows + canonical_routes.

---

## Auth & route protection

**Runtime:** Auth.js v5 Credentials, JWT, `role` in session (Context7 `/websites/authjs_dev` — jwt/session callbacks).

**Interception:** **`proxy.ts`** only ([ADR-002](../07_governance/adr_002_next162_vercel_runtime_policy.md)); `auth.config.ts` edge-safe; full `auth.ts` not imported in proxy.

| Prefix | Required role |
|--------|---------------|
| `/`, `/trainers`, `/auth/*` | public |
| `/book/*`, `/client/*` | client |
| `/trainer/*` | trainer |
| `/admin/*` | admin |

Object-level checks — [`policy_enforcement_contract.md`](../04_authorization_privacy/policy_enforcement_contract.md) (`policy/server`, not in proxy).

---

## Page specifications

### Public

| Path | Primary purpose | Primary CTA | Key states |
|------|-----------------|-------------|------------|
| `/` | Landing, value prop | Register / Browse trainers | — |
| `/trainers` | Catalog, filters, sort | Open profile | empty catalog, loading skeleton |
| `/trainers/[id]` | Trainer profile, tabs | Book session (client) / Wishlist | trainer not approved → limited view |

**`/trainers`:** mobile filter → bottom sheet; desktop `lg:` filter sidebar; chips edge-to-edge mobile only.

**`/trainers/[id]`:** tabs About / Services / Schedule / Reviews; sticky CTA; schedule inline slot pick → `/book/[trainerId]`.

### Auth

| Path | Behavior |
|------|----------|
| `/auth/login` | Email/password; generic error toast; callbackUrl support |
| `/auth/register` | Role tiles → client form |
| `/auth/register/trainer` | Multi-step (≈5); progress bar; draft save per step |

### Booking (`(booking)`)

| Path | Behavior |
|------|----------|
| `/book/[trainerId]` | 3-step: Service → Slot → Confirm |
| `/book/[trainerId]/confirm` | Optional split confirm step |

**MUST** — создаёт booking `pending`; toast + redirect `/client/bookings/[id]`; no payment UI.

### Session placeholder

| Path | Behavior |
|------|----------|
| `/sessions/[sessionId]` | Placeholder «Session details»; no Daily.co |

### Client

| Path | Behavior |
|------|----------|
| `/client/dashboard` | Welcome, next session, search entry, categories |
| `/client/bookings` | Tabs Upcoming / Past / Cancelled |
| `/client/bookings/[id]` | Detail, cancel action, status |
| `/client/reviews/[bookingId]` | Rating + text; only if booking completed |
| `/client/profile` | Settings, security, sign out |

### Trainer

| Path | Behavior |
|------|----------|
| `/trainer/dashboard` | KPI, today sessions, recent reviews |
| `/trainer/profile` | Edit public fields, certificates upload |
| `/trainer/services` | CRUD services, active toggle (optimistic) |
| `/trainer/schedule` | Weekly grid + exceptions calendar |
| `/trainer/clients` | Searchable list |
| `/trainer/clients/[id]` | Notes auto-save (private) |
| `/trainer/income` | History amounts (no Stripe) |

**MUST** — «Under review» banner when `status != approved`.

### Admin

| Path | Behavior |
|------|----------|
| `/admin/dashboard` | KPI, needs attention |
| `/admin/trainers` | Verification queue tabs |
| `/admin/trainers/[id]` | Approve / reject sheet |
| `/admin/complaints` | List + priority |
| `/admin/complaints/[id]` | Status transitions |
| `/admin/refunds` | Manual approve/reject (DB only) |
| `/admin/reviews` | Hide / delete review |

---

## API routes (summary)

| Path | MVP |
|------|-----|
| `/api/auth/[...nextauth]` | Auth.js handlers |
| `/api/jobs/*` | Cron triggers (planned) |
| `/api/upload` | Blob presign (planned) |

---

## Happy paths (cross-page)

1. Anonymous → `/trainers` → profile → login → booking wizard → pending booking → toast + `/client/bookings/[id]` (email E-06 post-MVP).
2. Trainer register → submit → admin approve → public listing live.
3. Client completed booking → review form → admin moderates review.

Детальные диаграммы — user flow files.

---

## Negative paths (UX)

| Screen type | Empty | Error | Forbidden |
|-------------|-------|-------|-----------|
| Lists (bookings, catalog) | CTA to discover / create | Retry + message | Redirect login or 403 shell |
| Wizard | — | Slot taken, validation | Wrong role → login |
| Forms | — | Field errors `border-destructive` | — |
| Admin queues | «All caught up» | Load failure | Non-admin → login |

**MUST** — mutation failure: `toast.error` ([`ui-toast-mutations`](../../../.cursor/rules/ui-toast-mutations.mdc)).

---

## Security paths

| Scenario | UX |
|----------|-----|
| Unauthenticated `/client/*` | Redirect `/auth/login?callbackUrl=` |
| Client opens `/trainer/*` | Redirect login |
| IDOR booking detail | 404 or forbidden shell (not leak existence) |
| Admin action without role | Deny at server; no optimistic success |

Matrix: [`authorization_matrix.md`](../04_authorization_privacy/authorization_matrix.md) (W5).

---

## Concurrency notes

| UI surface | Expected UX when race |
|------------|---------------------|
| Booking confirm | Error toast; no duplicate success |
| Wishlist toggle | Optimistic rollback + `toast.error` |
| Slot selection | Refresh slots or error |

Resolution details — contracts W8 (not duplicated here).

---

## Drift risks & guards

| Risk | Guard |
|------|-------|
| Pages spec vs canonical_routes | Routes change only in `canonical_routes.md` first |
| Interim pages doc vs this file | This file wins |
| `middleware.ts` in snippets | Replace with `proxy.ts` per ADR-002 |
| Prototype-only payment UI | Ignore; see `post_mvp_deferrals.md` |

---

## Requirements

1. **MUST** — каждый MVP path в canonical_routes имеет строку в § Page specifications или явную ссылку на user flow.
2. **MUST** — один primary CTA per screen.
3. **MUST** — mobile-first layout before desktop enhancements.
4. **SHOULD** — wireframes (W10) trace to rows in this doc.
5. **MUST NOT** — duplicate full App Router tree (only canonical_routes).

---

## Acceptance criteria

- [ ] All MVP ✅ routes from canonical_routes covered
- [ ] Global shell + breakpoints documented
- [ ] Auth uses proxy.ts narrative (not middleware canon)
- [ ] Happy / negative / security / concurrency / drift sections present
- [ ] No standalone route list duplicating canonical_routes
- [ ] Links to user flows, mvp_scope, planned UX docs

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`canonical_routes.md`](../../design/canonical_routes.md) | Route inventory |
| [`mvp_scope.md`](./mvp_scope.md) | MVP boundaries |
| [`client_flow.md`](./user_flows/users_mvp/client_flow.md) | Client journeys |
| [`trainer_flow.md`](./user_flows/users_mvp/trainer_flow.md) | Trainer journeys |
| [`admin_flow.md`](./user_flows/users_mvp/admin_flow.md) | Admin journeys |
| [`default_docs/fitness-platform-pages.md`](../../default_docs/fitness-platform-pages.md) | Interim archive (visual detail) |
| [`Fitness_Platform_Prototype_v1.html`](../../prototypes/Fitness_Platform_Prototype_v1.html) | Visual reference |
| [`ux_ui_principles.md`](../../design/ux_ui_principles.md) | UX principles canon (W2) |
| [`responsive_navigation_contract.md`](../../design/responsive_navigation_contract.md) | Nav shell contract (W2) |
| [`visual_identity_contract.md`](../../design/visual_identity_contract.md) | Warm Forest tokens (W2) |
| [`accessibility_requirements.md`](../../design/accessibility_requirements.md) | WCAG 2.1 AA (W2) |
| [`prototype_route_mapping.md`](../../design/prototype_route_mapping.md) | Prototype ↔ routes (W2) |
| [`authorization_matrix.md`](../04_authorization_privacy/authorization_matrix.md) | Access control canon (W5) |
| [`policy_enforcement_contract.md`](../04_authorization_privacy/policy_enforcement_contract.md) | Enforcement layers (W5) |
| [`../03_data_model/seed_data_spec.md`](../03_data_model/seed_data_spec.md) | Dev fixtures for smoke routes (W6) |
| [`../../design/ui_states_contract.md`](../../design/ui_states_contract.md) | Empty/loading/error/forbidden matrix (W7) |
| [`../../design/interaction_design_contract.md`](../../design/interaction_design_contract.md) | Toast, pending, optimistic (W7) |
| [`../../design/forms_and_validation_ux.md`](../../design/forms_and_validation_ux.md) | Form validation UX (W7) |
| [`../../design/content_and_microcopy_contract.md`](../../design/content_and_microcopy_contract.md) | Microcopy & messages (W7) |
| [`../../design/styleguide.md`](../../design/styleguide.md) | Component recipes (W7) |
| [`../../implementation/mvp/specs/global_shell_spec.md`](../../implementation/mvp/specs/global_shell_spec.md) | App shell (W9) |
| [`../../implementation/mvp/specs/catalog_discovery_spec.md`](../../implementation/mvp/specs/catalog_discovery_spec.md) | Catalog & profile (W9) |
| [`../../implementation/mvp/specs/booking_wizard_spec.md`](../../implementation/mvp/specs/booking_wizard_spec.md) | Booking wizard (W9) |
| [`../../implementation/mvp/specs/trainer_onboarding_spec.md`](../../implementation/mvp/specs/trainer_onboarding_spec.md) | Trainer onboarding (W9) |
| [`../../implementation/mvp/specs/trainer_schedule_spec.md`](../../implementation/mvp/specs/trainer_schedule_spec.md) | Trainer schedule (W9) |
| [`../../implementation/mvp/specs/admin_verification_spec.md`](../../implementation/mvp/specs/admin_verification_spec.md) | Admin verification (W9) |
| [`../../implementation/mvp/specs/complaint_refund_spec.md`](../../implementation/mvp/specs/complaint_refund_spec.md) | Complaints & refunds (W9) |
| [`../../implementation/mvp/specs/password_reset_spec.md`](../../implementation/mvp/specs/password_reset_spec.md) | Password reset post-MVP (W9) |

**Registry:** [`documentation_creation_registry.md`](../../meta/documentation_creation_registry.md) — wave W1-05

---

## Agent notes

- Длинные Tailwind/hex блоки из interim — не копировать сюда; см. design system + W2 contracts.
- `/client/profile` — confirmed in canonical_routes; implement in P02/P03 if missing from early scaffold.
- Code samples остаются в guidelines (`ai_auth_implementation_guide.md`), не в PRD.

---

## Change log

| Date | Change |
|------|--------|
| 2026-05-23 | v1.0 — canonical page behavior spec |
