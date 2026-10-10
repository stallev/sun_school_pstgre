# P10 — Trainer Onboarding

**Тип:** Phase Description  
**Статус:** Canonical  
**Версия:** 2.0  
**Дата:** 2026-05-23  
**Волна:** W16  
**Зависит от:** [`P03_phase_description.md`](./P03_phase_description.md), [`trainer_onboarding_spec.md`](../specs/trainer_onboarding_spec.md), [`trainer_verification_contract.md`](../contracts/trainer_verification_contract.md), [`file_upload_contract.md`](../contracts/file_upload_contract.md)  
**Связанные документы:** [`P10_tasks.md`](../tasks/P10_tasks.md), wireframe W10-07

---

## Purpose

Фаза **P10** — `/auth/register/trainer` 5-step wizard → submit application → `pending` + dashboard banner.

**Аудитория:** AI-агенты после P09 (or parallel after P03 if team splits).

---

## Agent context budget

| # | Document | Why |
|---|----------|-----|
| 1 | [`P10_tasks.md`](../tasks/P10_tasks.md) | Checklist |
| 2 | [`trainer_onboarding_spec.md`](../specs/trainer_onboarding_spec.md) | Steps UX |
| 3 | [`trainer_verification_contract.md`](../contracts/trainer_verification_contract.md) | Submit |
| 4 | [`file_upload_contract.md`](../contracts/file_upload_contract.md) | PhotoSlot, certs |
| 5 | [`ui_component_phase_matrix.md`](../ui_component_phase_matrix.md) | P10 row |
| 6 | [`trainer_flow.md`](../../../prds/01_product_scope/user_flows/users_mvp/trainer_flow.md) | Journey |

**MUST NOT read** P11+ phase docs.

---

## Scope / Out of scope

### In scope

| Area | Deliverable |
|------|-------------|
| `/auth/register/trainer` | 5-step wizard |
| Uploads | Photo, certificates via Blob |
| Submit | `SubmitTrainerApplication` |

### Out of scope

- Admin approve (→ **P13**)
- Profile/services edit routes (→ **P11**)

---

## UI Catalog (this phase)

| Action | Component | Route |
|--------|-----------|-------|
| **CREATE** | Onboarding step components | `/auth/register/trainer` |
| **USE** | `WizardHeader`, `Progress`, `PhotoSlot`, `FileUploadZone`, `Field`, `Checkbox` | wizard |
| **MUST NOT** | Admin moderation UI | → P13 |

---

## Cross-phase dependencies

| Dependency | Blocker? | Notes |
|------------|----------|-------|
| **P02** auth | Yes | Register flow |
| **P03** shell | Yes | Trainer layout banner slot |

---

## Happy path smoke

1. New user completes 5 steps → submit → dashboard + «Under review» banner.
2. Timezone required step 1 (INV-01).

---

## Negative path smoke

| Scenario | Expected |
|----------|----------|
| Missing timezone | Validation error |
| Upload wrong MIME/size | Per file contract |
| Double submit application | One `submitted_at` |

---

## Security smoke

| Check | Expected |
|-------|----------|
| Blob URLs | Policy-gated |

---

## Concurrency & race check

| Scenario | Expected |
|----------|----------|
| Double submit wizard | Idempotent application |

---

## Drift risks & guards

| Risk | Guard |
|------|-------|
| Missing timezone (INV-01) | Required field step 1 |
| Mix with P02 client register | Separate route only |
| Double submit | Server idempotency |

---

## Definition of done

- [x] Wizard per spec + wireframe
- [x] TZ required; uploads per contract
- [x] Lint pass; typecheck pass (packages + web src)

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P10_tasks.md`](../tasks/P10_tasks.md) | Checklist |
| [`P11_phase_description.md`](./P11_phase_description.md) | Next — profile & services |

---

## Agent notes

- **Одна сессия = P10 only.**

---

## Acceptance criteria

- [x] Onboarding implementation to pending status (manual smoke pending)
