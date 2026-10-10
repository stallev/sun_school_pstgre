# Wireframe: Admin Clients Registry

**Тип:** Wireframe | **Статус:** Canonical | **Версия:** 1.0 | **Дата:** 2026-05-25 | **Волна:** W10 / P18  
**Route:** `/admin/clients` · **Prototype:** —

## Metadata

| Field | Value |
|-------|--------|
| **Route group** | `(admin)` |
| **Role** | `admin` |
| **Primary CTA** | Row click → `/admin/clients/[id]` |
| **Spec** | [`admin_people_ops_spec.md`](../../../implementation/mvp/specs/admin_people_ops_spec.md) |
| **Flow** | [`admin_flow.md`](../../../prds/01_product_scope/user_flows/users_mvp/admin_flow.md) § Поток 6 |

## Components

`PageHeader`, `Input` search (with search icon), `AdminClientRegistryRow` (`PulseCard` or table row), `Avatar`, `Skeleton`, `AdminQueueEmptyState` (neutral variant).

## Layout shell

| Breakpoint | Chrome |
|------------|--------|
| Mobile `< md` | TopBar + stacked cards + BottomNav |
| Desktop `≥ md` | TopBar + Sidebar + responsive table or card grid |

## Regions

1. **Page header** — `h1` «Клиенты»; subtitle muted «Реестр зарегистрированных клиентов» (no badge — not a queue).
2. **Search bar** — placeholder «Поиск по имени или email»; debounce 300ms; `max-w-[300px]` on desktop per **admin-forms-layout**.
3. **Results meta** — «Найдено: N» when query active.
4. **Client list**:
   - **Mobile:** `grid-cols-1` cards, full row tap target ≥ 44px.
   - **Desktop:** table `thead`: Имя | Email | Регистрация | Брони | → ; or 2-col card grid `md:grid-cols-2`.
5. **Row content** — avatar sm, `fullName`, `email`, `createdAt` (relative), `bookingsCount` mono.

## Data dependencies

- Query: `User` where `role = client`, order `createdAt DESC`.
- Search: `ILIKE` on `full_name`, `email` (paginate 20/page).
- Aggregate: `_count.clientBookings` per user.

## Guardrails

- Admin-only; FM-005.
- **No** bulk export / CSV in P18.
- **No** suspend/ban toggle (post-MVP).
- Do not show trainers or admins in this list.

## States

| State | Description |
|-------|-------------|
| happy | Default list (recent clients) |
| search results | Filtered rows |
| empty registry | «Пока нет клиентов» — rare post-seed |
| search empty | «Клиенты не найдены» + «Сбросить поиск» link |
| loading | Row skeletons (preserve search input) |
| error | Alert + Retry |
| forbidden | Non-admin redirect |

## Desktop layout (ASCII)

```
┌──────────┬──────────────────────────────────────────────────┐
│ Sidebar  │ Клиенты                                          │
│ · Clients│ Реестр зарегистрированных клиентов              │
│  (new)   │ [ 🔍 Поиск по имени или email    ]               │
│          ├──────────────────────────────────────────────────┤
│          │ Имя          Email           Регистр.  Брони    │
│          │ Alex Client  alex@…          3 мес.    12    →  │
│          │ Denis K.     denis@…         1 мес.     4    →  │
└──────────┴──────────────────────────────────────────────────┘
```

## Mobile layout (ASCII)

```
┌────────────────────────┐
│ Клиенты                │
│ [ 🔍 Поиск…          ] │
│ ┌────────────────────┐ │
│ │ Alex Client        │ │
│ │ alex@… · 12 броней │→│
│ └────────────────────┘ │
├────────────────────────┤
│ BottomNav (+ Clients)  │
└────────────────────────┘
```

## Navigation note

Add sidebar item **«Клиенты»** between «Тренеры» and «Жалобы» — **no badge**. See [`responsive_navigation_contract.md`](../../responsive_navigation_contract.md) (update on P18).

## Acceptance criteria

- [ ] Route in [`canonical_routes.md`](../../canonical_routes.md)
- [ ] Search + pagination spec in admin_people_ops_spec
- [ ] FX-8 empty search state with reset
- [ ] Privacy: admin-only email display

**Registry:** W10-31 · P18 planned
