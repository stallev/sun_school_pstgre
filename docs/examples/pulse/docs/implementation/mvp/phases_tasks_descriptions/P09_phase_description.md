# P09 — Client Reviews

**Тип:** Phase Description  
**Статус:** Canonical  
**Версия:** 2.0  
**Дата:** 2026-05-23  
**Волна:** W16  
**Зависит от:** [`P08_phase_description.md`](./P08_phase_description.md), [`review_moderation_contract.md`](../contracts/review_moderation_contract.md)  
**Связанные документы:** [`P09_tasks.md`](../tasks/P09_tasks.md)

---

## Purpose

Фаза **P09** — `/client/reviews/[bookingId]`: submit review after booking `completed`, status `pending` moderation.

**Аудитория:** AI-агенты после P08.

---

## Agent context budget

| # | Document | Why |
|---|----------|-----|
| 1 | [`P09_tasks.md`](../tasks/P09_tasks.md) | Checklist |
| 2 | [`review_moderation_contract.md`](../contracts/review_moderation_contract.md) | Submit rules |
| 3 | [`ui_component_phase_matrix.md`](../ui_component_phase_matrix.md) | P09 row |
| 4 | [`client_flow.md`](../../../prds/01_product_scope/user_flows/users_mvp/client_flow.md) | Review journey |

**MUST NOT read** P10+ phase docs.

---

## Scope / Out of scope

### In scope

| Area | Deliverable |
|------|-------------|
| `/client/reviews/[bookingId]` | Review form |
| Domain | `submitReview` |

### Out of scope

- Admin moderation UI (→ **P13**)
- Trainer mark completed (→ **P12** — seed/manual OK for smoke)

---

## UI Catalog (this phase)

| Action | Component | Route |
|--------|-----------|-------|
| **CREATE** | `ReviewForm` | `/client/reviews/[bookingId]` |
| **USE** | `RatingStars`, `Textarea`, `Button` | review form |

---

## Cross-phase dependencies

| Dependency | Blocker? | Notes |
|------------|----------|-------|
| **P08** booking detail link | Yes | Entry |
| **P12** mark completed | No | Seed/manual `completed` booking OK for smoke |

---

## Happy path smoke

1. Client with `completed` booking → review form → submit → pending moderation.
2. Link from booking detail when eligible.

---

## Negative path smoke

| Scenario | Expected |
|----------|----------|
| Non-completed booking | Deny |
| Duplicate review | Blocked |

---

## Security smoke

| Check | Expected |
|-------|----------|
| Wrong user's booking | Deny |

---

## Concurrency & race check

| Scenario | Expected |
|----------|----------|
| Double submit review | One review row |

---

## Drift risks & guards

| Risk | Guard |
|------|-------|
| P09 before P12 in dev | Document seed path in tasks |
| Review without completed guard | Contract enforcement |

---

## Definition of done

- [x] Review form per wireframe
- [x] Guards on status + duplicate
- [x] Smoke + typecheck + lint pass

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P09_tasks.md`](../tasks/P09_tasks.md) | Checklist |
| [`P10_phase_description.md`](./P10_phase_description.md) | Next — trainer onboarding |

---

## Agent notes

- **Одна сессия = P09 only.**
- Smoke MAY use seed completed booking from P12 manual step.

---

## Acceptance criteria

- [x] Review submit smoke pass
