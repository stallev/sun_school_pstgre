# Wireframe: Admin Client Detail

**Тип:** Wireframe | **Статус:** Canonical | **Версия:** 1.0 | **Дата:** 2026-05-25 | **Волна:** W10 / P18  
**Route:** `/admin/clients/[id]` · **Prototype:** —

## Metadata

| Field | Value |
|-------|--------|
| **Route group** | `(admin)` |
| **Role** | `admin` |
| **Primary CTA** | *None* — read-only support view (FX-2: no competing primary) |
| **Spec** | [`admin_people_ops_spec.md`](../../../implementation/mvp/specs/admin_people_ops_spec.md) |
| **Flow** | [`admin_flow.md`](../../../prds/01_product_scope/user_flows/users_mvp/admin_flow.md) § Поток 7 |
| **Privacy** | [`privacy_data_handling.md`](../../../prds/04_authorization_privacy/privacy_data_handling.md) |

## Components

`AdminClientDetailHeader`, `AdminPillTabs`, `PulseCard`, booking row with `StatusBadge`, `CustomLink`, `Skeleton`, `AdminQueueEmptyState`.

## Layout shell

Standard admin shell — see [`admin_trainer_approved_detail.md`](./admin_trainer_approved_detail.md).

## Regions

1. **Header** — `← Назад` → `/admin/clients`; `h1` client `fullName`.
2. **Summary card** — avatar lg, email, «На платформе с {date}», total bookings count (KPI mono).
3. **Tabs** (`AdminPillTabs`) — **Бронирования** (default) | **Жалобы** | **Возвраты**.
4. **Tab: Бронирования** — list rows:
   - Service name snapshot, trainer name (link → `/admin/trainers/[trainerProfileId]` if approved), `startsAt`, `StatusBadge`.
   - Row link → **no** `/admin/bookings/[id]` in P18 — read-only snippet only; optional future phase.
5. **Tab: Жалобы** — rows: priority badge, target trainer, status, createdAt → link `/admin/complaints/[id]`.
6. **Tab: Возвраты** — rows: amount, status, booking ref → link `/admin/refunds` or highlight card id.

## Guardrails

- **MUST NOT** show `trainer_client_note` (trainer-private).
- **MUST NOT** show password / auth tokens.
- IDOR: 404 if `user.role !== client`.
- No account suspend UI in P18.
- PII: email OK for admin; minimize in list views elsewhere.

## States

| State | Description |
|-------|-------------|
| happy | Summary + tab content |
| tab empty | «Нет бронирований» / «Нет жалоб» / «Нет возвратов» per tab |
| loading | Header + tab skeleton |
| error | Alert + Retry |
| forbidden | Non-admin |
| not found | 404 |

## Desktop layout (ASCII)

```
┌──────────┬──────────────────────────────────────────────────┐
│ Sidebar  │ ← Назад    Alex Client                           │
│          │ ┌─ Summary ─────────────────────────────────────┐ │
│          │ │ [Av] alex@pulse.dev · с 12 янв 2026 · 12 броней│ │
│          │ └───────────────────────────────────────────────┘ │
│          │ [ Бронирования ] [ Жалобы ] [ Возвраты ]         │
│          │ ┌─ Booking row ─────────────────────────────────┐ │
│          │ │ Pilates 50 · Maria P. · 24 мая · Confirmed     │ │
│          │ └───────────────────────────────────────────────┘ │
└──────────┴──────────────────────────────────────────────────┘
```

## Deep link entry points

| Source | Link label |
|--------|------------|
| `/admin/complaints/[id]` | «Профиль клиента» |
| `/admin/refunds` | Client name → `/admin/clients/[id]` |

## Acceptance criteria

- [ ] Read-only — no submit buttons on page
- [ ] Tabs match complaint/refund patterns (FX-1)
- [ ] Each empty tab has message (FX-8)
- [ ] Trainer name links to operational trainer detail when applicable

**Registry:** W10-32 · P18 planned
