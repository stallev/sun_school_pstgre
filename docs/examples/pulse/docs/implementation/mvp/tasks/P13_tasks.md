# P13 Tasks — Admin Moderation

**Тип:** Tasks  
**Статус:** Canonical  
**Версия:** 2.0  
**Дата:** 2026-05-23  
**Волна:** W16  
**Зависит от:** [`P13_phase_description.md`](../phases_tasks_descriptions/P13_phase_description.md)  
**Связанные документы:** [`admin_verification_spec.md`](../specs/admin_verification_spec.md), [`complaint_refund_spec.md`](../specs/complaint_refund_spec.md)

---

## Purpose

Чеклист **P13** — admin MVP feature-complete.

---

## 1. Admin dashboard

- [x] `/admin/dashboard` KPI + needs attention
- [x] Empty states when queues clear

## 2. Trainer verification

- [x] `/admin/trainers` tabs Pending / Approved / Rejected
- [x] `/admin/trainers/[id]` + documents
- [x] `ModerationQueueRow`
- [x] Approve / Reject + reject reason validation
- [x] Revalidate `trainers` cache tag

## 3. Complaints & refunds

- [x] `/admin/complaints` + detail workflows
- [x] `/admin/refunds` — DB only, no Stripe
- [x] Client complaint/refund entry if not in P08

## 4. Review moderation

- [x] `/admin/reviews` queue
- [x] Hide/delete per contract

## 5. Shell

- [x] Nav badge counts
- [x] Pending UI on all admin mutations

## 6. Verification

- [x] `npm run typecheck`
- [x] `npm run lint`
- [ ] Smoke: approve → visible in `/trainers`
- [ ] Smoke: non-admin denied
- [x] MVP routes vs [`canonical_routes.md`](../../../design/canonical_routes.md)

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P13_phase_description.md`](../phases_tasks_descriptions/P13_phase_description.md) | DoD |
| [`P14_tasks.md`](./P14_tasks.md) | Next — quality gate |

**Registry:** W16
