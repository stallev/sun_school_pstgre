# Wireframe: Admin Complaint Detail

**Тип:** Wireframe | **Статус:** Canonical | **Версия:** 2.0 | **Дата:** 2026-05-25 | **Волна:** W10 / P19  
**Route:** `/admin/complaints/[id]` · **Prototype:** —

## Metadata

| Field | Value |
|-------|--------|
| **Primary CTA** | «Finish review» (`in_review`) · «Start review» (`open`) |
| **Spec** | [`complaint_refund_spec.md`](../../../implementation/mvp/specs/complaint_refund_spec.md) v2 |
| **ADR** | [`adr_008_complaint_resolution_model.md`](../../../prds/07_governance/adr_008_complaint_resolution_model.md) |

## Components

`ComplaintProcessedBanner`, `ComplaintContextPanel`, `ComplaintDetailCard`, `ComplaintAuditTimeline`, `ResolveComplaintDialog`, `ComplaintClosedSummary`, `ComplaintDetailActionsBar`.

## Regions

1. **Header** — back link, title.
2. **Banner** — `in_review` (assignee) or `closed` (success).
3. **Context panel** — booking snippet (read-only), related refund status + link to `/admin/refunds`.
4. **Complaint meta** — reporter, trainer, priority/status badges, reason.
5. **Audit timeline** — review started, closed events.
6. **Actions** — sticky bar (`open` / `in_review`) or closed summary.

## Guardrails

- Valid status transitions only per lifecycle — resolution on close, not as status.
- PII minimization in display.
- No admin booking detail route — context read-only on this page.

## States

| State | Description |
|-------|-------------|
| open | Start review + optional quick close |
| in_review | Context + timeline + finish review dialog |
| closed | Resolution summary read-only |
| loading | Skeleton |
| error | Invalid transition toast |
| forbidden | Non-admin |

**Registry:** W10-27 · P19 sync 2026-05-25
