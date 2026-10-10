# Prototype Route Mapping — Pulse MVP

**Тип:** UX Contract  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-05-23  
**Волна:** W2  
**Зависит от:** [`canonical_routes.md`](./canonical_routes.md), [`Fitness_Platform_Prototype_v1.html`](../prototypes/Fitness_Platform_Prototype_v1.html)  
**Связанные документы:** [`ux_ui_principles.md`](./ux_ui_principles.md), [`pages_functional_spec.md`](../prds/01_product_scope/pages_functional_spec.md)

---

## Purpose

Единая таблица соответствия: **HTML-прототип (screen ID / React component)** → **canonical App Router path** → **planned wireframe file (W10)**. Устраняет drift между demo prototype, PRD и будущими wireframes.

**Prototype file:** [`Fitness_Platform_Prototype_v1.html`](../prototypes/Fitness_Platform_Prototype_v1.html) — SPA с `ScreenRouter` switch по `screen` state.

---

## Scope / Out of scope

**In scope:** все MVP screens, представленные в прототипе; gaps (routes без прототипа); post-MVP prototype-only screens.

**Out of scope:** duplicate route definitions (→ `canonical_routes.md` only); wireframe content (→ W10).

---

## How prototype navigation works

```text
Top bar: role switcher (client | trainer | admin) — DEV/DEMO ONLY in production
BottomNav / SideNav: navItemsFor(role) → setScreen(id)
ScreenRouter: switch(screen) → React component
```

**Production:** real Auth.js session + `role` claim; no role toggle in top bar.

---

## Mapping table — prototype → canonical route

| Prototype `screen` ID | React component | Canonical path | Route group | Wireframe | Notes |
|----------------------|-----------------|----------------|-------------|-----------|-------|
| `c.home` | `ClientHome` | `/client/dashboard` | `(client)` | [`client_dashboard.md`](./wireframes/mvp/client_dashboard.md) | Prototype «Home» = client dashboard, not `/` landing |
| `c.catalog` | `ClientCatalog` | `/trainers` | `(public)` | [`public_trainers_catalog.md`](./wireframes/mvp/public_trainers_catalog.md) | Public catalog |
| `c.trainer` | `TrainerProfile` | `/trainers/[id]` | `(public)` | [`public_trainer_profile.md`](./wireframes/mvp/public_trainer_profile.md) | Dynamic `[id]` |
| `c.book` | `BookingFlow` | `/book/[trainerId]` | `(booking)` | [`booking_wizard.md`](./wireframes/mvp/booking_wizard.md) | 3-step wizard |
| `c.session` | `VideoSession` | `/sessions/[sessionId]` | `(session)` | [`session_placeholder.md`](./wireframes/mvp/session_placeholder.md) | **Prototype = post-MVP video UI**; MVP = text placeholder only |
| `c.bookings` | `ClientBookings` | `/client/bookings` | `(client)` | [`client_bookings_list.md`](./wireframes/mvp/client_bookings_list.md) | Tabs Upcoming/Past/Cancelled |
| `c.profile` | `ClientProfileScreen` | `/client/profile` | `(client)` | [`client_profile.md`](./wireframes/mvp/client_profile.md) | Settings, sign out |
| `t.home` | `TrainerHome` | `/trainer/dashboard` | `(trainer)` | [`trainer_dashboard.md`](./wireframes/mvp/trainer_dashboard.md) | KPI + today |
| `t.schedule` | `TrainerSchedule` | `/trainer/schedule` | `(trainer)` | [`trainer_schedule.md`](./wireframes/mvp/trainer_schedule.md) | Weekly + exceptions |
| `t.services` | `TrainerServices` | `/trainer/services` | `(trainer)` | [`trainer_services.md`](./wireframes/mvp/trainer_services.md) | CRUD + toggle |
| `t.clients` | `TrainerClients` | `/trainer/clients` | `(trainer)` | [`trainer_clients_list.md`](./wireframes/mvp/trainer_clients_list.md) | List only in prototype |
| `t.income` | `TrainerIncome` | `/trainer/income` | `(trainer)` | [`trainer_income.md`](./wireframes/mvp/trainer_income.md) | No Stripe MVP |
| `a.home` | `AdminHome` | `/admin/dashboard` | `(admin)` | [`admin_dashboard.md`](./wireframes/mvp/admin_dashboard.md) | KPI overview |
| `a.trainers` | `AdminTrainers` | `/admin/trainers` | `(admin)` | [`admin_trainers_queue.md`](./wireframes/mvp/admin_trainers_queue.md) | Queue tabs |
| `a.complaints` | `AdminComplaints` | `/admin/complaints` | `(admin)` | [`admin_complaints_list.md`](./wireframes/mvp/admin_complaints_list.md) | Priority badges |
| `a.refunds` | `AdminRefunds` | `/admin/refunds` | `(admin)` | [`admin_refunds.md`](./wireframes/mvp/admin_refunds.md) | Manual refunds |

---

## Standalone prototype — public landing

| Canonical path | Prototype file | Wireframe | Phase |
|----------------|----------------|-----------|-------|
| `/` | [`Pulse Landing Page -Standalone-.html`](../prototypes/Pulse Landing Page -Standalone-.html) | [`public_landing.md`](./wireframes/mvp/public_landing.md) v2 | **P16** |

**Note:** Main SPA prototype [`Fitness_Platform_Prototype_v1.html`](../prototypes/Fitness_Platform_Prototype_v1.html) does **not** include `/` landing — use standalone file above.

---

## Canonical MVP routes WITHOUT prototype screen

These **MUST** be designed from PRD + user flows in W10 wireframes — no visual reference in HTML prototype.

| Canonical path | Source spec | Wireframe | Priority |
|----------------|-------------|-----------|----------|
| `/auth/login` | client_flow | [`auth_login.md`](./wireframes/mvp/auth_login.md) | P02 |
| `/auth/register` | client_flow | [`auth_register_client.md`](./wireframes/mvp/auth_register_client.md) | P02 |
| `/auth/register/trainer` | trainer_flow | [`auth_register_trainer.md`](./wireframes/mvp/auth_register_trainer.md) | P04 |
| `/book/[trainerId]/confirm` | pages_functional_spec | [`booking_confirm.md`](./wireframes/mvp/booking_confirm.md) | P03 — optional split step |
| `/client/bookings/[id]` | client_flow | [`client_booking_detail.md`](./wireframes/mvp/client_booking_detail.md) | P03 |
| `/client/reviews/[bookingId]` | client_flow | [`client_review_form.md`](./wireframes/mvp/client_review_form.md) | P03 |
| `/trainer/profile` | trainer_flow | [`trainer_profile_edit.md`](./wireframes/mvp/trainer_profile_edit.md) | P04 |
| `/trainer/clients/[id]` | trainer_flow | [`trainer_client_detail.md`](./wireframes/mvp/trainer_client_detail.md) | P04 |
| `/admin/trainers/[id]` | admin_flow | [`admin_trainer_application.md`](./wireframes/mvp/admin_trainer_application.md) | P05 |
| `/admin/complaints/[id]` | admin_flow | [`admin_complaint_detail.md`](./wireframes/mvp/admin_complaint_detail.md) | P05 |
| `/admin/reviews` | admin_flow | [`admin_reviews_moderation.md`](./wireframes/mvp/admin_reviews_moderation.md) | P05 — route in canonical; **not** in prototype nav |

---

## Prototype-only / non-MVP elements

| Prototype element | MVP behavior |
|-------------------|--------------|
| `VideoSession` full UI | `/sessions/[sessionId]` placeholder — defer Daily.co |
| Role switcher in TopBar | Real login + JWT role |
| «Join» video on cards | Toast «Video sessions coming soon» or hidden |
| Payment / Stripe UI | Absent — see `post_mvp_deferrals.md` |
| Live chat in video | Post-MVP |

---

## Nav item mapping (prototype → path)

From `navItemsFor(role)` in prototype:

| Role | Prototype ID | Label | Canonical path |
|------|--------------|-------|----------------|
| client | `c.home` | Home | `/client/dashboard` |
| client | `c.catalog` | Trainers | `/trainers` |
| client | `c.bookings` | Sessions | `/client/bookings` |
| client | `c.profile` | Profile | `/client/profile` |
| trainer | `t.home` | Today | `/trainer/dashboard` |
| trainer | `t.schedule` | Schedule | `/trainer/schedule` |
| trainer | `t.services` | Services | `/trainer/services` |
| trainer | `t.clients` | Clients | `/trainer/clients` |
| trainer | `t.income` | Income | `/trainer/income` |
| admin | `a.home` | Overview | `/admin/dashboard` |
| admin | `a.trainers` | Trainers | `/admin/trainers` |
| admin | `a.complaints` | Complaints | `/admin/complaints` |
| admin | `a.refunds` | Refunds | `/admin/refunds` |

**Gap:** add `/admin/reviews` to production admin nav — not in prototype.

---

## Happy paths

1. Agent implements `/trainers` — opens prototype `c.catalog` + wireframe `public_trainers_catalog.md` for layout regions.
2. Agent implements booking — prototype `c.book` maps 1:1 to `/book/[trainerId]`.
3. Wireframe author uses this table to pick prototype section before writing markdown.

---

## Negative paths

| Situation | Rule |
|-----------|------|
| Agent copies VideoSession for MVP | **Forbidden** — use placeholder spec |
| New route invented in wireframe | **Forbidden** — add to `canonical_routes.md` first |
| Prototype payment flow | Ignore — not MVP |

---

## Security paths

Prototype bypasses auth via role toggle — **MUST NOT** ship in production. Mapping documents paths only; guards in `proxy.ts` + policy server.

---

## Concurrency notes

N/A — reference document.

---

## Drift risks & guards

| Risk | Guard |
|------|-------|
| `c.home` assumed to be `/` landing | This table — dashboard is `c.home` |
| Missing wireframes for auth routes | Explicit gap table above |
| Prototype screen IDs in production URLs | IDs are dev-only; URLs are canonical paths |
| Wireframe index out of sync | Update this file + `canonical_routes.md` § Wireframe index on W10 |

---

## Acceptance criteria

- [ ] All 16 prototype screens mapped to canonical paths
- [ ] Gap table for routes without prototype
- [ ] Post-MVP prototype elements flagged
- [ ] Nav mapping included
- [ ] No duplicate full route inventory
- [ ] Backlinks in `canonical_routes.md`, `ux_ui_principles.md`, `pages_functional_spec.md`

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`canonical_routes.md`](./canonical_routes.md) | Path inventory |
| [`pages_functional_spec.md`](../prds/01_product_scope/pages_functional_spec.md) | Page behavior |
| [`ux_ui_principles.md`](./ux_ui_principles.md) | P8 prototype fidelity |
| [`post_mvp_deferrals.md`](../prds/01_product_scope/post_mvp_deferrals.md) | Deferred features |
| [`responsive_navigation_contract.md`](./responsive_navigation_contract.md) | Nav paths |
| [`wireframes/route_index.md`](./wireframes/route_index.md) | W10 index |

**Registry:** [`documentation_creation_registry.md`](../meta/documentation_creation_registry.md) — wave W2-05

---

## Agent notes

- Open prototype in browser + search `ScreenRouter` for authoritative component list.
- When W10 wireframe created — replace `*(planned)*` in mapping column with link.
- Trainer client detail (`/trainer/clients/[id]`) — infer from list row tap pattern; no dedicated prototype screen.

---

## Change log

| Date | Change |
|------|--------|
| 2026-05-23 | W10 backlinks — wireframe links in mapping + gap table |
| 2026-05-23 | v1.0 — prototype route mapping (W2-05) |
