# P11 Tasks — Trainer Profile & Services

**Тип:** Tasks  
**Статус:** Canonical  
**Версия:** 2.0  
**Дата:** 2026-05-23  
**Волна:** W16  
**Зависит от:** [`P11_phase_description.md`](../phases_tasks_descriptions/P11_phase_description.md)  
**Связанные документы:** [`file_upload_contract.md`](../contracts/file_upload_contract.md)

---

## Purpose

Чеклист **P11** — trainer profile edit + services CRUD.

---

## 1. Trainer profile

- [x] `/trainer/profile` edit fields per spec
- [x] Blob upload photo/certs
- [x] Save toasts + pending UI

## 2. Services

- [x] `/trainer/services` CRUD
- [x] `ServiceCard` component
- [x] Active/hidden toggle — optimistic optional; `toast.error` on fail

## 3. Verification

- [x] `npm run typecheck`
- [x] `npm run lint`
- [ ] Smoke: service CRUD
- [ ] Smoke: MIME/size upload errors
- [ ] **MUST NOT** schedule editor (→ P12)

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P11_phase_description.md`](../phases_tasks_descriptions/P11_phase_description.md) | DoD |
| [`P12_tasks.md`](./P12_tasks.md) | Next — schedule |

**Registry:** W16
