# P12 Tasks — Trainer Schedule & Clients

**Тип:** Tasks  
**Статус:** Canonical  
**Версия:** 2.0  
**Дата:** 2026-05-23  
**Волна:** W16  
**Зависит от:** [`P12_phase_description.md`](../phases_tasks_descriptions/P12_phase_description.md)  
**Связанные документы:** [`trainer_schedule_spec.md`](../specs/trainer_schedule_spec.md)

---

## Purpose

Чеклист **P12** — schedule, clients, income, mark completed.

---

## 1. Schedule `/trainer/schedule`

- [x] Tabs Regular | Exceptions
- [x] Weekly intervals + day toggles
- [x] Exception calendar + block dates
- [x] TZ display from profile
- [x] `loading.tsx` skeleton
- [x] Save actions per contract

## 2. Clients & income

- [x] `/trainer/clients` — `ClientListCard`, search
- [x] `/trainer/clients/[id]` — history, private notes auto-save
- [x] `/trainer/income` — DB snapshot, no Stripe
- [x] `/trainer/dashboard` KPI cards

## 3. Booking completion

- [x] Mark booking `completed` use-case
- [x] Policy: trainer owns booking
- [x] Enables P09 review smoke

## 4. Verification

- [x] `npm run typecheck`
- [x] `npm run lint`
- [ ] Smoke: schedule save + invalid interval
- [ ] Smoke: cross-trainer client denied
- [ ] Smoke: complete booking → review eligible

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P12_phase_description.md`](../phases_tasks_descriptions/P12_phase_description.md) | DoD |
| [`P13_tasks.md`](./P13_tasks.md) | Next — admin |

**Registry:** W16
