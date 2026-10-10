# P11 — Trainer Profile & Services

**Тип:** Phase Description  
**Статус:** Canonical  
**Версия:** 2.0  
**Дата:** 2026-05-23  
**Волна:** W16  
**Зависит от:** [`P10_phase_description.md`](./P10_phase_description.md), [`file_upload_contract.md`](../contracts/file_upload_contract.md)  
**Связанные документы:** [`P11_tasks.md`](../tasks/P11_tasks.md), wireframes W10-16…18

---

## Purpose

Фаза **P11** — `/trainer/profile`, `/trainer/services`: edit profile, Blob uploads, services CRUD + active toggle.

**Аудитория:** AI-агенты после P10.

---

## Agent context budget

| # | Document | Why |
|---|----------|-----|
| 1 | [`P11_tasks.md`](../tasks/P11_tasks.md) | Checklist |
| 2 | [`file_upload_contract.md`](../contracts/file_upload_contract.md) | Blob lifecycle |
| 3 | [`trainer_flow.md`](../../../prds/01_product_scope/user_flows/users_mvp/trainer_flow.md) | Services |
| 4 | [`ui_component_phase_matrix.md`](../ui_component_phase_matrix.md) | P11 row |
| 5 | [`privacy_data_handling.md`](../../../prds/04_authorization_privacy/privacy_data_handling.md) | Profile fields |

**MUST NOT read** P12+ phase docs.

---

## Scope / Out of scope

### In scope

| Area | Routes |
|------|--------|
| Profile edit | `/trainer/profile` |
| Services CRUD | `/trainer/services` |

### Out of scope

- Schedule (→ **P12**)
- Stripe payouts

---

## UI Catalog (this phase)

| Action | Component | Route |
|--------|-----------|-------|
| **CREATE** | `ServiceCard` | `/trainer/services` |
| **USE** | Blob upload, `Switch`, `Field`, `Textarea` | profile, services |
| **MUST NOT** | Schedule editor | → P12 |

---

## Cross-phase dependencies

| Dependency | Blocker? | Notes |
|------------|----------|-------|
| **P10** or seed trainer | Yes | Trainer session |
| **P07** booking | No | Services needed for book smoke later |

---

## Happy path smoke

1. Edit profile → save → toast.
2. Add service → toggle active → optional optimistic.
3. MIME/size upload errors surfaced.

---

## Negative path smoke

| Scenario | Expected |
|----------|----------|
| Service toggle error | `toast.error` + rollback if optimistic |

---

## Security smoke

| Check | Expected |
|-------|----------|
| Client → `/trainer/services` | Proxy deny |

---

## Concurrency & race check

N/A — standard CRUD.

---

## Drift risks & guards

| Risk | Guard |
|------|-------|
| Schedule in P11 scope | Route split P12 |
| Upload without contract | file_upload_contract |

---

## Definition of done

- [x] Profile + services CRUD
- [x] Upload errors per contract
- [ ] Smoke + typecheck + lint pass

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P11_tasks.md`](../tasks/P11_tasks.md) | Checklist |
| [`P12_phase_description.md`](./P12_phase_description.md) | Next — schedule |

---

## Agent notes

- **Одна сессия = P11 only.**

---

## Acceptance criteria

- [x] Services CRUD smoke pass
