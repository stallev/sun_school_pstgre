# P08 — Client Bookings Hub

**Тип:** Phase Description  
**Статус:** Canonical  
**Версия:** 2.0  
**Дата:** 2026-05-23  
**Волна:** W16  
**Зависит от:** [`P07_phase_description.md`](./P07_phase_description.md), [`booking_lifecycle_contract.md`](../contracts/booking_lifecycle_contract.md)  
**Связанные документы:** [`P08_tasks.md`](../tasks/P08_tasks.md), client wireframes W10-08…12

---

## Purpose

Фаза **P08** — client hub: `/client/dashboard`, `/client/bookings`, `/client/bookings/[id]`, `/client/profile`; cancel booking with business rules.

**Аудитория:** AI-агенты после P07.

---

## Agent context budget

| # | Document | Why |
|---|----------|-----|
| 1 | [`P08_tasks.md`](../tasks/P08_tasks.md) | Checklist |
| 2 | [`booking_lifecycle_contract.md`](../contracts/booking_lifecycle_contract.md) | Cancel rules |
| 3 | [`client_flow.md`](../../../prds/01_product_scope/user_flows/users_mvp/client_flow.md) | Hub journeys |
| 4 | [`ui_component_phase_matrix.md`](../ui_component_phase_matrix.md) | P08 row |
| 5 | [`ui_states_contract.md`](../../../design/ui_states_contract.md) | Empty/loading |

**MUST NOT read** P09+ phase docs.

---

## Scope / Out of scope

### In scope

| Area | Routes |
|------|--------|
| Dashboard | `/client/dashboard` |
| Bookings | `/client/bookings`, `/client/bookings/[id]` |
| Profile | `/client/profile` |
| Domain | `cancelBooking` |

### Out of scope

- Review form (→ **P09**)
- Complaint/refund entry (→ **P13** or stub)

---

## UI Catalog (this phase)

| Action | Component | Route |
|--------|-----------|-------|
| **CREATE** | `BookingListItem`, dashboard widgets | client hub |
| **USE** | `PulseCardKpi`, `StatusBadge`, `AlertDialog`, `Tabs` | client hub |
| **MUST NOT** | `ReviewForm` | → P09 |

---

## Cross-phase dependencies

| Dependency | Blocker? | Notes |
|------------|----------|-------|
| **P07** createBooking | Yes | List content |
| **P02** auth | Yes | Client role |

---

## Happy path smoke

1. `/client/bookings` — tabs Upcoming/Past/Cancelled.
2. Detail → cancel (>24h) → toast + `cancelled`.
3. Empty list → empty state + CTA catalog.
4. Profile → sign-out works.

---

## Negative path smoke

| Scenario | Expected |
|----------|----------|
| Cancel inside 24h | Business error |
| Invalid booking id | 404 |

---

## Security smoke

| Check | Expected |
|-------|----------|
| Client A → Client B booking | 403 / notFound (IDOR) |

---

## Concurrency & race check

| Scenario | Expected |
|----------|----------|
| Double cancel | Idempotent or error per contract |

---

## Drift risks & guards

| Risk | Guard |
|------|-------|
| IDOR on booking detail | Policy `assertCanReadBooking` |
| Cancel window in UI only | Domain rule in contract |
| Review UI in P08 | Defer to P09 |

---

## Definition of done

- [x] Hub routes per wireframes
- [x] Cancel + toasts + pending UI
- [x] IDOR denied
- [x] typecheck + lint pass
- [ ] Manual smoke (cancel, IDOR, empty state)

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P08_tasks.md`](../tasks/P08_tasks.md) | Checklist |
| [`P09_phase_description.md`](./P09_phase_description.md) | Next — reviews |

---

## Agent notes

- **Одна сессия = P08 only.**

---

## Acceptance criteria

- [x] Client hub smoke pass (code complete; manual E2E pending)
