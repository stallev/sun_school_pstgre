# P13 — Admin Moderation

**Тип:** Phase Description  
**Статус:** Canonical  
**Версия:** 2.0  
**Дата:** 2026-05-23  
**Волна:** W16  
**Зависит от:** [`P12_phase_description.md`](./P12_phase_description.md), [`admin_verification_spec.md`](../specs/admin_verification_spec.md), [`complaint_refund_spec.md`](../specs/complaint_refund_spec.md)  
**Связанные документы:** [`P13_tasks.md`](../tasks/P13_tasks.md), [`mvp_scope.md`](../../../prds/01_product_scope/mvp_scope.md)

---

## Purpose

Фаза **P13** — admin contour: verification, complaints, refunds, review moderation. **MVP feature-complete** per `mvp_scope.md`.

**Аудитория:** AI-агенты после P12.

---

## Agent context budget

| # | Document | Why |
|---|----------|-----|
| 1 | [`P13_tasks.md`](../tasks/P13_tasks.md) | Checklist |
| 2 | [`admin_verification_spec.md`](../specs/admin_verification_spec.md) | Queue UX |
| 3 | [`complaint_refund_spec.md`](../specs/complaint_refund_spec.md) | Status transitions |
| 4 | [`trainer_verification_contract.md`](../contracts/trainer_verification_contract.md) | Approve/reject |
| 5 | [`review_moderation_contract.md`](../contracts/review_moderation_contract.md) | Hide/delete |
| 6 | [`authorization_matrix.md`](../../../prds/04_authorization_privacy/authorization_matrix.md) | Admin-only |
| 7 | [`ui_component_phase_matrix.md`](../ui_component_phase_matrix.md) | P13 row |

**MUST NOT read** P14+ phase docs.

---

## Scope / Out of scope

### In scope

| Area | Routes |
|------|--------|
| Dashboard | `/admin/dashboard` |
| Verification | `/admin/trainers`, `/admin/trainers/[id]` |
| Complaints | `/admin/complaints`, `/admin/complaints/[id]` |
| Refunds | `/admin/refunds` |
| Reviews | `/admin/reviews` |
| Client entry | Complaint/refund from booking detail if not in P08 |

### Out of scope

- Stripe refund API
- Email on approve/reject (→ **P21**)

---

## UI Catalog (this phase)

| Action | Component | Route |
|--------|-----------|-------|
| **CREATE** | `ModerationQueueRow`, admin table rows | `/admin/*` |
| **USE** | `PageHeader`, `StatusBadge`, `IconBadge`, confirm dialogs | admin |
| **USE** | Admin forms layout rule | detail pages |

---

## Cross-phase dependencies

| Dependency | Blocker? | Notes |
|------------|----------|-------|
| **P10** pending trainer | Yes | Verification queue |
| **P05** catalog cache | Yes | Revalidate on approve |

---

## Happy path smoke

1. Approve pending trainer → toast → visible in `/trainers`.
2. Complaint workflow → close.
3. Refund approve — DB only, no Stripe.
4. Hide review → removed from public profile.
5. Trainer → `/admin/*` denied.

---

## Negative path smoke

| Scenario | Expected |
|----------|----------|
| Reject without reason | Validation block |
| Empty queues | Empty states |

---

## Security smoke

| Check | Expected |
|-------|----------|
| Non-admin → `/admin/*` | Denied |
| IDOR complaint IDs | Admin policy only |

---

## Concurrency & race check

| Scenario | Expected |
|----------|----------|
| Dual admin approve | One wins; idempotent/error ([**FM-004**](../../../prds/02_domain_model/failure_modes_catalog.md)) |
| Approve + cache | Revalidate tag `trainers` |

---

## Drift risks & guards

| Risk | Guard |
|------|-------|
| Stripe in refund flow | post_mvp_deferrals |
| Approve without cache revalidate | P05 catalog stale |
| FM-004 dual approve | Contract |

---

## Definition of done

- [x] All admin routes + client entry points
- [x] MVP feature-complete per mvp_scope
- [x] Smoke + typecheck + lint pass (manual smoke: approve/non-admin — local QA)

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P13_tasks.md`](../tasks/P13_tasks.md) | Checklist |
| [`P14_phase_description.md`](./P14_phase_description.md) | Next — quality gate |

---

## Agent notes

- **Одна сессия = P13 only.**
- Primary CTA on trainer detail: **Approve**.

---

## Acceptance criteria

- [x] Admin E2E verification approve
- [x] MVP route inventory complete
