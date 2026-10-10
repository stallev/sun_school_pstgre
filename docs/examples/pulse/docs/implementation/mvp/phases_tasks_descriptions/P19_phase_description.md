# P19 — Complaint Resolution v2

**Тип:** Phase Description  
**Статус:** Canonical  
**Версия:** 2.1  
**Дата:** 2026-05-25  
**Волна:** W23 *(renumbered from W22 P17; was W17 P20)*  
**Зависит от:** [`P14_phase_description.md`](./P14_phase_description.md), [`adr_008_complaint_resolution_model.md`](../../../prds/07_governance/adr_008_complaint_resolution_model.md), [`complaint_refund_spec.md`](../specs/complaint_refund_spec.md) v2  
**Связанные документы:** [`P19_tasks.md`](../tasks/P19_tasks.md), [`admin_flow.md`](../../../prds/01_product_scope/user_flows/users_mvp/admin_flow.md), [`_migration_P17_to_P19.md`](./_migration_P17_to_P19.md)

**Former ID:** P17 (W22), P20 (W17).

---

## Purpose

Фаза **P19** — улучшение admin workflow жалоб: контекст (бронь, возврат), исход (`resolution`) и обязательные заметки при закрытии, audit timeline, UX «Завершить рассмотрение». Status machine **не меняется**.

**Аудитория:** AI-агенты после P14 quality gate.

---

## Agent context budget

| # | Document | Why |
|---|----------|-----|
| 1 | [`P19_tasks.md`](../tasks/P19_tasks.md) | Checklist |
| 2 | [`adr_008_complaint_resolution_model.md`](../../../prds/07_governance/adr_008_complaint_resolution_model.md) | Decisions D1–D7 |
| 3 | [`complaint_refund_spec.md`](../specs/complaint_refund_spec.md) v2 | UX + CR-MUST-6..9 |
| 4 | [`lifecycle_models.md`](../../../prds/02_domain_model/lifecycle_models.md) | Complaint SM |
| 5 | [`database_schema_v1.md`](../../../prds/03_data_model/database_schema_v1.md) §8.2 | DDL |
| 6 | [`ui_component_phase_matrix.md`](../ui_component_phase_matrix.md) | P19 row |

**Wireframe:** [`admin_complaint_detail.md`](../../../design/wireframes/mvp/admin_complaint_detail.md) v2

**MUST NOT read** P18 people ops or P21 email in the same session unless cross-linking only.

---

## Scope / Out of scope

### In scope

| Area | Deliverable |
|------|-------------|
| Domain | `COMPLAINT_RESOLUTION`, extended `CloseComplaint` validation |
| Schema | `complaint_resolution` enum + `complaint.resolution` column |
| Admin detail | Context panel, audit timeline, resolve dialog, closed summary |
| Admin list | Quick close open-only; optional in-review assignee/days |
| Messages | Resolution labels, dialog copy, validation errors |

### Out of scope

- Email on close (P21, E-08)
- Stripe refund automation
- Reopen closed complaint
- Priority edit UI (`updateComplaintPriority` deferred)
- New admin booking route

---

## UI Catalog (this phase)

| Action | Component | Route |
|--------|-----------|-------|
| **CREATE** | `ComplaintContextPanel`, `ComplaintAuditTimeline`, `ResolveComplaintDialog`, `ComplaintClosedSummary` | `/admin/complaints/[id]` |
| **USE (extend)** | `ComplaintDetailActionsBar`, `ComplaintProcessedBanner`, `ComplaintRowActions` | admin complaints |
| **USE** | `ComplaintDetailCard`, `StatusBadge`, `Button`, admin forms layout | detail |

---

## Cross-phase dependencies

| Dependency | Blocker? | Notes |
|------------|----------|-------|
| **P14** complete | Yes | Quality gate before new features |
| **ADR-008** ACCEPTED | Yes | Resolution model |
| **P13** complaints base | Yes | Extends existing routes |
| **P21** email | No | Parallel post-MVP track |
| **P16** landing | No | Independent |

---

## Happy path smoke

1. Open complaint → Start review → banner with assignee.
2. Finish review → select resolution + notes → closed summary + timeline.
3. Open complaint → quick close with `duplicate` / `spam` (optional notes).
4. Detail shows booking context + related refund link when present.
5. `refund_recommended` shows refunds CTA without creating refund.

---

## Definition of done

- [ ] All [`P19_tasks.md`](../tasks/P19_tasks.md) checked
- [ ] `npm run typecheck` + `npm run lint`
- [ ] Docs synced per product-docs-alignment (spec v2 already updated)
- [ ] Manual smoke paths above

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P14_phase_description.md`](./P14_phase_description.md) | Prerequisite |
| [`P21_phase_description.md`](./P21_phase_description.md) | Independent (email) |

**Registry:** W23 (was W22 P17; W17 P20)
