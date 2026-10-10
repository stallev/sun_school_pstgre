# P07 Tasks — Booking Wizard

**Тип:** Tasks  
**Статус:** Canonical  
**Версия:** 2.1  
**Дата:** 2026-05-23  
**Волна:** W16  
**Зависит от:** [`P07_phase_description.md`](../phases_tasks_descriptions/P07_phase_description.md)  
**Связанные документы:** [`booking_wizard_spec.md`](../specs/booking_wizard_spec.md)

---

## Purpose

Чеклист **P07** — booking wizard only.

---

## 1. Domain & contracts

- [x] `createBooking` in `@pulse/domain`
- [x] `GenerateAvailableSlots` per schedule_slots_contract
- [x] Policy: `assertCanCreateBooking`
- [x] Serializable transaction for slot conflict ([FM-001](../../../prds/02_domain_model/failure_modes_catalog.md))

## 2. Booking wizard `/book/[trainerId]`

- [x] `(booking)` layout — stripped header, no bottom nav
- [x] Steps: Service → Slot → Confirm
- [x] `BookingWizard` + schedule grid wrapper
- [x] Trainer TZ labels on slots
- [x] Optional message field (max 500)
- [x] `createBooking` — pending status
- [x] Redirect `?booked=1` + `RedirectToast`
- [x] Pending: `disabled`, `aria-busy` on submit
- [x] **MUST NOT** payment UI (ADR-005)

## 3. Verification

- [x] `npm run typecheck`
- [x] `npm run lint`
- [ ] Smoke: full booking happy path
- [ ] Smoke: slot conflict → error toast
- [ ] Smoke: guest → login redirect
- [ ] Smoke: double submit → one booking

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P07_phase_description.md`](../phases_tasks_descriptions/P07_phase_description.md) | DoD |
| [`P08_tasks.md`](./P08_tasks.md) | Next — client hub |

**Registry:** W16
