# Responsive Navigation Contract — Pulse MVP

**Тип:** UX Contract  
**Статус:** Canonical  
**Версия:** 1.0  
**Дата:** 2026-05-23  
**Волна:** W2  
**Зависит от:** [`ux_ui_principles.md`](./ux_ui_principles.md), [`canonical_routes.md`](./canonical_routes.md), [`Fitness_Platform_Prototype_v1.html`](../prototypes/Fitness_Platform_Prototype_v1.html)  
**Связанные документы:** [`pages_functional_spec.md`](../prds/01_product_scope/pages_functional_spec.md), [`visual_identity_contract.md`](./visual_identity_contract.md)

**Migrated from:** `docs/default_docs/fitness-platform-pages.md` § Breakpoints; prototype `BottomNav` / `SideNav`

**Runtime note:** Tailwind v4 default breakpoints verified via Context7 (`/websites/tailwindcss`) — `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px, `2xl` 1536px. Pulse **MUST NOT** override defaults without ADR.

---

## Purpose

Контракт **адаптивной навигации и app shell** для всех role layouts MVP: breakpoints, Bottom Nav vs Sidebar, top bar, booking stripped chrome, safe areas.

---

## Scope / Out of scope

**In scope:** layout groups `(marketing)`, `(discovery)`, `(client)`, `(trainer)`, `(admin)`, `(booking)`, `(session)`; nav items per role; responsive visibility classes; container widths.

**Out of scope:** auth route guards (→ `pages_functional_spec` + W5 auth spec); icon set (→ `ui-icons-lucide`); implementation components (→ W9 `global_shell_spec`).

---

## Breakpoints & zones

| Zone | Tailwind | Range | Navigation model |
|------|----------|-------|------------------|
| Mobile | default, `< md` | &lt; 768px | Bottom Nav sticky; no sidebar |
| Tablet/Desktop | `md:`+ | ≥ 768px | Sidebar sticky; Bottom Nav hidden |
| Desktop filters | `lg:`+ | ≥ 1024px | Catalog filter sidebar; filter sheet hidden |

### Critical visibility classes

| Element | Mobile | md+ |
|---------|--------|-----|
| Bottom Nav | `md:hidden` | hidden |
| Sidebar | hidden | `hidden md:flex` |
| Catalog filter button | visible | `lg:hidden` |
| Catalog filter sidebar | hidden | `hidden lg:flex` |
| Top bar avatar | `hidden md:inline-flex` | visible |

---

## Route groups & chrome

| Group | Top bar | Role nav | Notes |
|-------|---------|----------|-------|
| `(marketing)` | ✅ sticky blur | ❌ | Landing, auth — logo + utilities; auth on `/` redirects to role dashboard |
| `(discovery)` | ✅ | ✅ when auth | `/trainers`, `/trainers/[id]` — `HybridAppShellGate`; guest: Top bar only |
| `(booking)` | ✅ minimal | ❌ | Wizard focus — no sidebar/bottom nav distraction |
| `(session)` | ✅ minimal | ❌ | Placeholder MVP |
| `(client)` | ✅ | Bottom + Sidebar | Full shell |
| `(trainer)` | ✅ | Bottom + Sidebar | Full shell + review banner when pending |
| `(admin)` | ✅ | Bottom + Sidebar | Badge counts on queue items |

**MUST** — единственный inventory paths: [`canonical_routes.md`](./canonical_routes.md).

---

## Top bar

| Requirement | Rule |
|-------------|------|
| Position | `sticky top-0 z-40/50`, backdrop blur, border-bottom |
| Content | Logo «Pulse» + role-agnostic utilities |
| Mobile | Compact height; avatar **hidden** in bar |
| Notifications | Popover below bar; overlay dismiss on outside click |
| Prototype parity | Role switcher in prototype — **dev/demo only**, not production |

---

## Bottom Nav (mobile)

**Component target:** `BottomNav` — `md:hidden`, grid equal columns per item count.

| Role | Items (label → path) | Icon intent |
|------|----------------------|-------------|
| **client** | Home → `/client/dashboard` | Home |
| | Trainers → `/trainers` | Search |
| | Sessions → `/client/bookings` | Calendar |
| | Profile → `/client/profile` | User |
| **trainer** | Today → `/trainer/dashboard` | Home |
| | Schedule → `/trainer/schedule` | Calendar |
| | Services → `/trainer/services` | Dumbbell |
| | Clients → `/trainer/clients` | Users |
| | Income → `/trainer/income` | Dollar |
| **admin** | Overview → `/admin/dashboard` | Home |
| | Trainers → `/admin/trainers` | Shield + badge |
| | Clients → `/admin/clients` | Users — **P18 planned**, no badge |
| | Complaints → `/admin/complaints` | Flag + badge |
| | Refunds → `/admin/refunds` | Refresh + badge |

### Bottom Nav rules

| ID | Rule |
|----|------|
| NAV-MUST-1 | Active item — icon pill `bg-primary-container` (bottom nav) or full-row pill (sidebar); label emphasis per design system |
| NAV-MUST-2 | `paddingBottom: env(safe-area-inset-bottom)` on nav element |
| NAV-MUST-3 | Badge counts on admin items when queue &gt; 0 |
| NAV-SHOULD-1 | `aria-current="page"` on active link/button |
| NAV-MUST-4 | Touch target ≥ 44×44px per item hit area |

**Prototype IDs:** `c.home`, `c.catalog`, … — см. [`prototype_route_mapping.md`](./prototype_route_mapping.md).

---

## Sidebar (md+)

**Component target:** `SidebarNav` — `hidden md:flex`, `sticky top-16`, `w-52 lg:w-60`, `border-r`.

| Requirement | Rule |
|-------------|------|
| Items | Same paths/labels as Bottom Nav for role |
| Placement | Inside `AppShellCanvas` (`max-w-[1400px]`), not viewport edge on ultra-wide |
| Section title | «Client» / «Trainer» / «Administrator» — mono uppercase caption |
| Active state | `rounded-full`, `bg-primary-container` |
| Badges | Same as Bottom Nav for admin |
| Footer slot | Optional help/card — non-blocking |

---

## Page container

```text
AppShellCanvas (md+): mx-auto max-w-[1400px] px-4 md:px-6 lg:px-8 — sidebar + main in one row (prototype parity)
PageContainer (in shell): flex-1 main column inside canvas; pb-24 md:pb-6 above bottom UI
PageContainer (standalone): mx-auto max-w-[1400px] — booking/session stripped layouts
Booking wizard: max-w narrower acceptable — centered column md+
```

---

## Layout-specific navigation

### Catalog `/trainers`

| Breakpoint | Filter UI |
|------------|-----------|
| &lt; lg | Filter button → **Sheet** (bottom on mobile, centered dialog md) |
| ≥ lg | **FilterSidebar** persistent |

### Trainer profile `/trainers/[id]`

| Breakpoint | CTA |
|------------|-----|
| Mobile | Sticky bottom bar «Book session» |
| md+ | CTA in sidebar / header region |

### Booking `/book/[trainerId]`

| Rule | Detail |
|------|--------|
| Chrome | Stripped — no role bottom nav |
| Steps | Back affordance in header; progress indicator |
| Desktop | Optional summary sidebar `md:`+ |

---

## Happy paths

1. Client mobile: open app → Bottom Nav «Trainers» → catalog **shell preserved** → profile → «Book» → wizard (no bottom nav) → complete → return to shell on `/client/bookings/[id]`.
2. Trainer tablet: sidebar «Schedule» → weekly grid; rotate to mobile → Bottom Nav «Schedule» same route.
3. Admin desktop: sidebar badge «3» on Trainers → queue list.

---

## Negative paths

| Scenario | UX |
|----------|-----|
| Authenticated user opens `/` | Redirect to role home (`/client/dashboard`, `/trainer/dashboard`, or `/admin/dashboard`) — landing for guests only |
| Deep link to protected route | After login, land on `callbackUrl`; nav reflects role |
| Unknown route | 404 page with link to role home |
| Trainer pending approval | Shell visible; banner in content — nav unchanged |

---

## Security paths

| Scenario | Behavior |
|----------|----------|
| Client session on `/trainer/*` | `proxy.ts` redirect — no trainer nav rendered |
| Public on `/client/*` | Redirect login — no partial shell leak |

Enforcement: W5 `authorization_matrix.md` *(planned)*; interception **`proxy.ts`** only (ADR-002).

---

## Concurrency notes

Nav badge counts may lag behind server — **SHOULD** refresh on focus or after mutation success. Optimistic badge update optional for admin queues.

---

## Drift risks & guards

| Risk | Guard |
|------|-------|
| Duplicate nav item lists in code | Single config module per role — W9 spec |
| `middleware.ts` in examples | Replace with `proxy.ts` narrative |
| Prototype 4 admin items vs missing `/admin/reviews` in nav | Reviews — admin sidebar entry **planned** wireframe W10; route exists in canonical_routes |

---

## Acceptance criteria

- [ ] Breakpoints match Tailwind defaults (Context7 verified)
- [ ] All three roles: bottom + sidebar item tables with canonical paths
- [ ] Route groups chrome documented
- [ ] Safe area + touch targets referenced
- [ ] No standalone full route tree duplicate
- [ ] Backlinks in `canonical_routes.md`, `ux_ui_principles.md`

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`ux_ui_principles.md`](./ux_ui_principles.md) | P3 Thumb Zone, P7 Edge-to-edge |
| [`canonical_routes.md`](./canonical_routes.md) | Path inventory |
| [`pages_functional_spec.md`](../prds/01_product_scope/pages_functional_spec.md) | Global shell summary |
| [`visual_identity_contract.md`](./visual_identity_contract.md) | Nav visual tokens |
| [`prototype_route_mapping.md`](./prototype_route_mapping.md) | Prototype screen IDs |
| [`global_shell_spec.md`](../implementation/mvp/specs/global_shell_spec.md) | Implementation (W9) |

**Registry:** [`documentation_creation_registry.md`](../meta/documentation_creation_registry.md) — wave W2-02

---

## Agent notes

- Catalog nav item «Trainers» points to **public** `/trainers` — matches prototype `c.catalog`. `(discovery)` layout renders role shell when session exists; guests see Top bar only.
- `(booking)` group intentionally omits Bottom Nav — do not «fix» by adding nav mid-wizard.
- Admin `/admin/reviews` in canonical routes but not in prototype nav — add to implementation nav config in P05.

---

## Change log

| Date | Change |
|------|--------|
| 2026-05-23 | v1.0 — responsive navigation contract (W2-02) |
