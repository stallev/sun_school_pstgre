# P19 Tasks — Complaint Resolution v2

**Тип:** Tasks  
**Статус:** Canonical  
**Версия:** 2.1  
**Дата:** 2026-05-25  
**Волна:** W23 *(renumbered from W22 P17; was W17 P20)*  
**Зависит от:** [`P19_phase_description.md`](../phases_tasks_descriptions/P19_phase_description.md)  
**Связанные документы:** [`adr_008_complaint_resolution_model.md`](../../../prds/07_governance/adr_008_complaint_resolution_model.md), [`complaint_refund_spec.md`](../specs/complaint_refund_spec.md), [`_migration_P17_to_P19.md`](../phases_tasks_descriptions/_migration_P17_to_P19.md)

**Former ID:** P17 (W22), P20 (W17).

---

## Purpose

Чеклист **P19** — complaint resolution v2: domain, schema, admin detail/list UX.

---

## 0. Gate

- [x] ADR-008 status ACCEPTED
- [ ] P14 DoD complete (`npm run typecheck`, `npm run lint`, UI states audit)

## 1. Domain & schema (Block A)

- [x] `COMPLAINT_RESOLUTION` / `COMPLAINT_RESOLUTIONS` in `@pulse/domain`
- [x] `closeComplaintInputSchema`: required `resolution`; conditional `adminNotes` (ADR-008 D3)
- [x] `validateCloseComplaint` + resolution/notes pairing helper
- [x] Prisma `ComplaintResolution` enum + `resolution` column on `Complaint`
- [x] Migration applied; `database_schema_v1.md` §8.2 synced
- [x] `closeComplaintMutation` persists `resolution`; audit `metadataJson`

## 2. Data layer (Block B)

- [x] `get-complaint-detail`: booking summary, related refund, audit timeline
- [x] Closed meta: `resolution`, `resolvedAt`, `resolvedByName`
- [x] Assignee from latest `complaint.review_started` audit
- [x] (SHOULD) `list-complaints`: in-review assignee + days in review

## 3. UI (Block C)

- [x] `ComplaintContextPanel` — booking snippet, refund status/link
- [x] `ComplaintAuditTimeline` — read-only audit entries
- [x] `ResolveComplaintDialog` — resolution select + notes textarea
- [x] `ComplaintClosedSummary` — resolution badge + notes when closed
- [x] `ComplaintDetailActionsBar` — «Finish review» on `in_review`
- [x] `ComplaintProcessedBanner` — assignee in in_review banner
- [x] Detail `page.tsx` composes new regions
- [x] `ComplaintRowActions` — quick close open-only
- [x] Messages in `@/lib/messages` for resolutions, dialog, validation

## 4. Verification (Block D)

- [x] `npm run typecheck`
- [x] `npm run lint`
- [ ] Smoke: open → review → resolve (each resolution)
- [ ] Smoke: quick close duplicate/spam from open
- [ ] Smoke: context panel with booking + refund
- [ ] Smoke: concurrent close → `alreadyProcessed`

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P19_phase_description.md`](../phases_tasks_descriptions/P19_phase_description.md) | DoD |
| [`ui_component_phase_matrix.md`](../ui_component_phase_matrix.md) | P19 row |

**Registry:** W23 (was W22 P17; W17 P20)
