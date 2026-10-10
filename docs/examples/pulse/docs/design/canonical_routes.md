# Canonical Routes — Pulse MVP

**Status:** Canonical — единственный full route inventory  
**Version:** 1.1  
**Date:** 2026-05-25

> Не дублировать этот список в других документах. Ссылайтесь на этот файл.  
> Детальная page spec: [`docs/prds/01_product_scope/pages_functional_spec.md`](../prds/01_product_scope/pages_functional_spec.md) (canonical)  
> Interim archive: [`docs/default_docs/fitness-platform-pages.md`](../default_docs/fitness-platform-pages.md)  
> User flows: [`docs/prds/01_product_scope/user_flows/users_mvp/`](../prds/01_product_scope/user_flows/users_mvp/)  
> Prototype mapping: [`prototype_route_mapping.md`](prototype_route_mapping.md)  
> Navigation contract: [`responsive_navigation_contract.md`](responsive_navigation_contract.md)

---

## Route groups (App Router)

| Group | Layout behavior |
|-------|-----------------|
| `(marketing)` | Top bar, no role nav — landing, auth |
| `(discovery)` | Hybrid shell: role nav when authenticated; Top bar only for guests |
| `(booking)` | Stripped header, no sidebar — booking wizard focus |
| `(session)` | Minimal — session placeholder MVP |
| `(client)` | Shell: top bar + bottom nav (mobile) / sidebar (md+) |
| `(trainer)` | Shell: top bar + bottom nav / sidebar |
| `(admin)` | Shell: top bar + bottom nav / sidebar |

---

## Public routes

| Path | Route file (target) | Role | MVP | Notes |
|------|----------------------|------|-----|-------|
| `/` | `(marketing)/page.tsx` | public | ✅ | Landing; auth users → role home via redirect |
| `/how-it-was-built` | `(marketing)/how-it-was-built/page.tsx` | public | ✅ | Development case study; EN/RU via cookie locale |
| `/features` | `(marketing)/features/page.tsx` | public | ✅ | Live MVP feature overview; EN/RU via cookie locale |
| `/trainers` | `(discovery)/trainers/page.tsx` | public | ✅ | Catalog + filters; shell when authenticated |
| `/trainers/[id]` | `(discovery)/trainers/[id]/page.tsx` | public | ✅ | Trainer public profile; shell when authenticated |
| `/auth/login` | `(marketing)/auth/login/page.tsx` | public | ✅ | Credentials login |
| `/auth/register` | `(marketing)/auth/register/page.tsx` | public | ✅ | Role selection + client reg |
| `/auth/register/trainer` | `(marketing)/auth/register/trainer/page.tsx` | public | ✅ | Trainer multi-step onboarding |

---

## Booking routes

| Path | Route file | Role | MVP | Notes |
|------|-----------|------|-----|-------|
| `/book/[trainerId]` | `(booking)/book/[trainerId]/page.tsx` | client | ✅ | 3-step wizard (service → slot → confirm) |
| `/book/[trainerId]/confirm` | `(booking)/book/[trainerId]/confirm/page.tsx` | client | ✅ | Optional confirm step if split from wizard |

---

## Session routes

| Path | Route file | Role | MVP | Notes |
|------|-----------|------|-----|-------|
| `/sessions/[sessionId]` | `(session)/sessions/[sessionId]/page.tsx` | client | ✅ | Placeholder — video post-MVP |

---

## Client routes

| Path | Route file | Role | MVP | Notes |
|------|-----------|------|-----|-------|
| `/client/dashboard` | `(client)/client/dashboard/page.tsx` | client | ✅ | Home, search, next session |
| `/client/bookings` | `(client)/client/bookings/page.tsx` | client | ✅ | Upcoming / Past / Cancelled |
| `/client/bookings/[id]` | `(client)/client/bookings/[id]/page.tsx` | client | ✅ | Booking detail |
| `/client/reviews/[bookingId]` | `(client)/client/reviews/[bookingId]/page.tsx` | client | ✅ | Post-session review |
| `/client/profile` | `(client)/client/profile/page.tsx` | client | ✅ | Profile + language row (P17); theme stub |

> **Note:** Client bottom nav lists Profile — route `/client/profile` stub added in P03; full settings in later phases.

---

## Trainer routes

| Path | Route file | Role | MVP | Notes |
|------|-----------|------|-----|-------|
| `/trainer/dashboard` | `(trainer)/trainer/dashboard/page.tsx` | trainer | ✅ | KPI, today, reviews |
| `/trainer/profile` | `(trainer)/trainer/profile/page.tsx` | trainer | ✅ | Edit public profile + language row (P17) |
| `/trainer/services` | `(trainer)/trainer/services/page.tsx` | trainer | ✅ | CRUD services |
| `/trainer/schedule` | `(trainer)/trainer/schedule/page.tsx` | trainer | ✅ | Weekly + exceptions |
| `/trainer/clients` | `(trainer)/trainer/clients/page.tsx` | trainer | ✅ | Client list |
| `/trainer/clients/[id]` | `(trainer)/trainer/clients/[id]/page.tsx` | trainer | ✅ | Client detail + notes |
| `/trainer/income` | `(trainer)/trainer/income/page.tsx` | trainer | ✅ | Income history (no Stripe MVP) |

---

## Admin routes

| Path | Route file | Role | MVP | Notes |
|------|-----------|------|-----|-------|
| `/admin/dashboard` | `(admin)/admin/dashboard/page.tsx` | admin | ✅ | Overview KPI |
| `/admin/trainers` | `(admin)/admin/trainers/page.tsx` | admin | ✅ | Verification queue |
| `/admin/trainers/[id]` | `(admin)/admin/trainers/[id]/page.tsx` | admin | ✅ | Application detail (`pending`) + operational profile (`approved`/`rejected`) — [`admin_people_ops_spec.md`](../implementation/mvp/specs/admin_people_ops_spec.md) |
| `/admin/clients` | `(admin)/admin/clients/page.tsx` | admin | ⚠️ P18 | Client registry — search + list |
| `/admin/clients/[id]` | `(admin)/admin/clients/[id]/page.tsx` | admin | ⚠️ P18 | Client detail (read-only tabs) |
| `/admin/complaints` | `(admin)/admin/complaints/page.tsx` | admin | ✅ | Complaints list |
| `/admin/complaints/[id]` | `(admin)/admin/complaints/[id]/page.tsx` | admin | ✅ | Complaint detail |
| `/admin/refunds` | `(admin)/admin/refunds/page.tsx` | admin | ✅ | Manual refunds |
| `/admin/reviews` | `(admin)/admin/reviews/page.tsx` | admin | ✅ | Review moderation |

---

## API / Auth routes (Next.js conventions)

| Path | Purpose | MVP |
|------|---------|-----|
| `/api/auth/[...nextauth]` | Auth.js handlers | ✅ |
| `/api/jobs/*` | Cron-triggered job endpoints (planned) | ✅ |
| `/api/files/[fileAssetId]` | S3 presigned read proxy (ready assets) | ✅ |

---

## Locale query (P17 — cross-cutting)

**Contract:** [`i18n_runtime_spec.md`](../implementation/mvp/contracts/i18n_runtime_spec.md) · **ADR:** [`adr_009_ui_locale_strategy.md`](../prds/07_governance/adr_009_ui_locale_strategy.md)

| Query | Allowed values | Behavior |
|-------|----------------|----------|
| `lang` | `en`, `ru` | Set cookie `pulse_locale`; navigate to **same path** without `lang` param |

**Examples:**

| Request | Result |
|---------|--------|
| `/trainers?lang=en` | Cookie `en`; user sees `/trainers` in English |
| `/auth/login?lang=ru&callbackUrl=…` | Cookie `ru`; strip only `lang`; preserve other query params per auth rules |
| `/client/bookings?lang=fr` | Ignore invalid value; fall through locale resolver |

**MUST NOT** in P17:

- Add path prefixes `/en/…` or `/ru/…`
- Use `lang` for open redirects — same-origin path only after strip

Locale applies to **all routes** in this document; no separate localized route inventory.

---

## Middleware protection matrix (summary)

| Prefix | Required role |
|--------|---------------|
| `/`, `/trainers`, `/auth/*` | public |
| `/book/*` | client |
| `/client/*` | client |
| `/trainer/*` | trainer |
| `/admin/*` | admin |
| `/sessions/*` | client (owner of booking) |

Full matrix: [`authorization_matrix.md`](../prds/04_authorization_privacy/authorization_matrix.md) (canonical W5).

Public path allowlist pattern — see [`fitness-platform-pages.md`](../default_docs/fitness-platform-pages.md) § Middleware.

---

## Post-MVP routes (reserved, not implemented)

| Path | Feature |
|------|---------|
| `/sessions/[sessionId]/room` | Daily.co video room |
| `/trainer/payouts` | Stripe Connect dashboard |
| `/client/payments` | Payment methods |

Do not implement until ADR and contract exist. Schema fields may be nullable placeholders.

---

## Dev-only routes (not in production)

| Path | Route file | MVP | Notes |
|------|------------|-----|-------|
| `/design-system` | `(dev)/design-system/page.tsx` | ✅ | Design Lab — shared UI primitives showcase; `notFound()` in production unless `ALLOW_DESIGN_LAB=1`. Spec: [`design_system_lab_spec.md`](../implementation/mvp/specs/design_system_lab_spec.md) |

---

## Wireframe index

**Canonical index:** [`wireframes/route_index.md`](wireframes/route_index.md) — path → wireframe file (W10 complete).

**Prototype → route → wireframe:** [`prototype_route_mapping.md`](prototype_route_mapping.md).

Template: [`wireframes/_page_template.md`](wireframes/_page_template.md)

---

## Change log

| Date | Change |
|------|--------|
| 2026-05-25 | P17 — locale query `?lang=en\|ru` cross-cutting contract; profile language row |
| 2026-05-25 | P18 planned — `/admin/clients`, `/admin/clients/[id]`; trainer `[id]` operational modes; P16 = public landing v2 |
| 2026-05-23 | W10 — wireframe index links |
| 2026-05-23 | W15 — dev-only `/design-system` Design Lab route |
| 2026-05-23 | W2 backlinks — prototype_route_mapping, responsive_navigation_contract |
| 2026-05-23 | Link to canonical `pages_functional_spec.md` |
| 2026-05-23 | Initial canonical list from fitness-platform-pages.md |
