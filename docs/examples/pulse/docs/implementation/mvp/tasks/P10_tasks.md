# P10 Tasks — Trainer Onboarding

**Тип:** Tasks  
**Статус:** Canonical  
**Версия:** 2.1  
**Дата:** 2026-05-24  
**Волна:** W16  
**Зависит от:** [`P10_phase_description.md`](../phases_tasks_descriptions/P10_phase_description.md)  
**Связанные документы:** [`trainer_onboarding_spec.md`](../specs/trainer_onboarding_spec.md)

---

## Purpose

Чеклист **P10** — trainer onboarding wizard only.

---

## 1. Onboarding `/auth/register/trainer`

- [x] 5-step wizard with progress bar (+ step 0 credentials for guests)
- [x] Step 1: photo, **timezone** (required)
- [x] Steps 2–4: bio, certs + upload, services (skip allowed)
- [x] Step 5: preview + terms + `SubmitTrainerApplication`
- [x] Per-step save Server Actions
- [x] Redirect dashboard + review banner

## 2. File uploads

- [x] Blob upload per [`file_upload_contract.md`](../contracts/file_upload_contract.md)
- [x] `PhotoSlot`, `FileUploadZone`
- [x] Pending UI; error toast

## 3. Verification

- [x] `npm run lint` (packages + web)
- [x] `npm run typecheck` (packages; web `.next` stale validator excluded)
- [ ] Smoke: submit → pending status (manual)
- [ ] Smoke: missing timezone blocked (manual)
- [x] **MUST NOT** admin approve UI (→ P13)

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P10_phase_description.md`](../phases_tasks_descriptions/P10_phase_description.md) | DoD |
| [`P11_tasks.md`](./P11_tasks.md) | Next — profile & services |

**Registry:** W16
