# P12 — Trainer Schedule & Clients

**Тип:** Phase Description  
**Статус:** Canonical  
**Версия:** 2.0  
**Дата:** 2026-05-23  
**Волна:** W16  
**Зависит от:** [`P11_phase_description.md`](./P11_phase_description.md), [`trainer_schedule_spec.md`](../specs/trainer_schedule_spec.md), [`schedule_slots_contract.md`](../contracts/schedule_slots_contract.md)  
**Связанные документы:** [`P12_tasks.md`](../tasks/P12_tasks.md), wireframes W10-19…21

**Context7 verified:** Next.js 16.2 — `loading.tsx` for `/trainer/schedule`.

---

## Purpose

Фаза **P12** — trainer schedule, clients, income, dashboard; **mark booking `completed`** (enables P09 reviews).

**Аудитория:** AI-агенты после P11.

---

## Agent context budget

| # | Document | Why |
|---|----------|-----|
| 1 | [`P12_tasks.md`](../tasks/P12_tasks.md) | Checklist |
| 2 | [`trainer_schedule_spec.md`](../specs/trainer_schedule_spec.md) | Schedule UX |
| 3 | [`schedule_slots_contract.md`](../contracts/schedule_slots_contract.md) | Intervals, TZ |
| 4 | [`privacy_data_handling.md`](../../../prds/04_authorization_privacy/privacy_data_handling.md) | Client notes |
| 5 | [`ui_component_phase_matrix.md`](../ui_component_phase_matrix.md) | P12 row |
| 6 | [`trainer_flow.md`](../../../prds/01_product_scope/user_flows/users_mvp/trainer_flow.md) | Clients |

**MUST NOT read** P13+ phase docs.

---

## Scope / Out of scope

### In scope

| Area | Routes |
|------|--------|
| Schedule | `/trainer/schedule` |
| Clients | `/trainer/clients`, `/trainer/clients/[id]` |
| Income | `/trainer/income` |
| Dashboard | `/trainer/dashboard` |
| Action | Mark booking `completed` |

### Out of scope

- Admin moderation (→ **P13**)
- Stripe payouts

---

## UI Catalog (this phase)

| Action | Component | Route |
|--------|-----------|-------|
| **CREATE** | `ClientListCard`, schedule editor modules | trainer routes |
| **USE** | `ScheduleDayPickerRow`, `DayPill`, `Calendar`, `KeyValueRow`, `PulseCardKpi`, `Tabs` | schedule, dashboard |
| **MUST NOT** | Admin queues | → P13 |

---

## Cross-phase dependencies

| Dependency | Blocker? | Notes |
|------------|----------|-------|
| **P11** services | Yes | Booking integration |
| **P07** bookings exist | Yes | Client detail |
| **P09** reviews | No | Complete action enables P09 |

---

## Happy path smoke

1. Save weekly schedule + exception → TZ displayed.
2. Client from P07 booking → visible on `/trainer/clients`.
3. Mark completed → client eligible for review (P09).
4. Cross-trainer client detail → denied.

---

## Negative path smoke

| Scenario | Expected |
|----------|----------|
| Invalid interval `end <= start` | Inline error |
| Overlapping save | Validation per contract |

---

## Security smoke

| Check | Expected |
|-------|----------|
| Trainer A → Trainer B client notes | Deny |

---

## Concurrency & race check

| Scenario | Expected |
|----------|----------|
| Overlapping schedule save | Last-write or validation per contract |

---

## Drift risks & guards

| Risk | Guard |
|------|-------|
| TZ not on schedule UI | INV-01 display line |
| Client notes privacy | Policy + privacy doc |
| Complete booking in wrong phase | P12 action only |

---

## Definition of done

- [x] All trainer ops routes per wireframes
- [x] TZ invariant; complete booking action
- [x] typecheck + lint pass
- [ ] Manual smoke (schedule, IDOR, complete → review)

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P12_tasks.md`](../tasks/P12_tasks.md) | Checklist |
| [`P13_phase_description.md`](./P13_phase_description.md) | Next — admin |

---

## Agent notes

- **Одна сессия = P12 only.**
- Auto-save trainer notes — debounce + error toast.

---

## Acceptance criteria

- [ ] Schedule + complete booking smoke pass (manual — see P12_tasks §4)
