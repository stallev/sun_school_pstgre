# P07 — Booking Wizard

**Тип:** Phase Description  
**Статус:** Canonical  
**Версия:** 2.0  
**Дата:** 2026-05-23  
**Волна:** W16  
**Зависит от:** [`P06_phase_description.md`](./P06_phase_description.md), [`booking_wizard_spec.md`](../specs/booking_wizard_spec.md), [`booking_lifecycle_contract.md`](../contracts/booking_lifecycle_contract.md), [`schedule_slots_contract.md`](../contracts/schedule_slots_contract.md)  
**Связанные документы:** [`P07_tasks.md`](../tasks/P07_tasks.md), [`adr_005_mvp_booking_without_payment.md`](../../../prds/07_governance/adr_005_mvp_booking_without_payment.md)

---

## Purpose

Фаза **P07** — 3-step booking wizard `/book/[trainerId]`, `(booking)` stripped chrome, `createBooking` → `pending`, redirect `?booked=1` + toast. **No payment UI** (ADR-005).

**Аудитория:** AI-агенты после P06.

---

## Agent context budget

| # | Document | Why |
|---|----------|-----|
| 1 | [`P07_tasks.md`](../tasks/P07_tasks.md) | Checklist |
| 2 | [`booking_wizard_spec.md`](../specs/booking_wizard_spec.md) | Wizard UX |
| 3 | [`booking_lifecycle_contract.md`](../contracts/booking_lifecycle_contract.md) | FM-002 |
| 4 | [`schedule_slots_contract.md`](../contracts/schedule_slots_contract.md) | Slots + TZ |
| 5 | [`ui_component_phase_matrix.md`](../ui_component_phase_matrix.md) | P07 row |
| 6 | [`adr_005_mvp_booking_without_payment.md`](../../../prds/07_governance/adr_005_mvp_booking_without_payment.md) | No payment |

**MUST NOT read** P08+ phase docs.

---

## Scope / Out of scope

### In scope

| Area | Deliverable |
|------|-------------|
| `/book/[trainerId]` | Service → Slot → Confirm |
| Domain | `createBooking`, `GenerateAvailableSlots` |
| Layout | `(booking)` — no bottom nav |

### Out of scope

- Client bookings list (→ **P08**)
- Reviews (→ **P09**)
- Payment, email E-06

---

## UI Catalog (this phase)

| Action | Component | Route |
|--------|-----------|-------|
| **CREATE** | `BookingWizard`, schedule grid wrapper | `/book/[trainerId]` |
| **USE** | `WizardHeader`, `ChoiceCard`, `SummaryCard`, `SchedulePicker`, `TimeSlotButton`, `Progress`, `MetaRow` | wizard |
| **MUST NOT** | Payment UI | ADR-005 |

---

## Cross-phase dependencies

| Dependency | Blocker? | Notes |
|------------|----------|-------|
| **P06** profile CTA | Yes | Entry path |
| Trainer services + schedule | Yes | Seed |
| **P11** services (full) | No | Seed OK |

---

## In-scope routes

| Path | Content |
|------|---------|
| `/book/[trainerId]` | Wizard |

---

## Happy path smoke

1. Client → wizard → pick service → slot → confirm.
2. Submit → `pending` booking → redirect `/client/bookings/[id]?booked=1` + RedirectToast.
3. Guest → redirect login.

---

## Negative path smoke

| Scenario | Expected |
|----------|----------|
| Slot taken on submit | `toast.error`; no double book ([**FM-002**](../../../prds/02_domain_model/failure_modes_catalog.md)) |
| Unapproved trainer | Blocked at preload |

---

## Security smoke

| Check | Expected |
|-------|----------|
| Guest `/book/*` | Redirect login |
| Tampered trainerId | Policy deny |

---

## Concurrency & race check

| Scenario | Expected |
|----------|----------|
| Double submit confirm | One booking; UNIQUE slot (FM-002) |

---

## Drift risks & guards

| Risk | Guard |
|------|-------|
| Toast from Server Action before redirect | Query param pattern |
| TZ display | `TrainerProfile.timezone` |
| Payment UI creep | ADR-005 review |

---

## Definition of done

- [x] Wizard per spec; no payment UI
- [x] FM-001 handled (Serializable transaction + overlap)
- [x] Pending UI + redirect toast
- [x] typecheck + lint pass
- [ ] Manual smoke (happy path, slot conflict, guest, double submit)

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P07_tasks.md`](../tasks/P07_tasks.md) | Checklist |
| [`P08_phase_description.md`](./P08_phase_description.md) | Next — client hub |

---

## Agent notes

- **Одна сессия = P07 only.**

---

## Acceptance criteria

- [x] Booking create flow without payment (code complete)
- [ ] Manual E2E smoke verified locally
