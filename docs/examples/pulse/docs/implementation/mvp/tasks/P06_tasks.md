# P06 Tasks — Trainer Public Profile + Wishlist

**Тип:** Tasks  
**Статус:** Canonical  
**Версия:** 2.1  
**Дата:** 2026-05-23  
**Волна:** W16  
**Зависит от:** [`P06_phase_description.md`](../phases_tasks_descriptions/P06_phase_description.md)  
**Связанные документы:** [`wishlist_contract.md`](../contracts/wishlist_contract.md)

---

## Purpose

Чеклист **P06** — profile `/trainers/[id]` + wishlist.

---

## 1. Profile `/trainers/[id]`

- [x] 404 for non-approved / missing
- [x] Tabs: About, Services, Schedule preview, Reviews
- [x] Sticky CTA mobile / sidebar card desktop
- [x] Schedule preview — trainer timezone label
- [x] Reviews list (approved only)
- [x] Primary CTA «Book now» → `/book/[trainerId]`

## 2. Wishlist

- [x] `toggleWishlist` DAL + `POST /api/client/wishlist` (Class A transport per [`ios-safari-mutation-transport.mdc`](../../../../.cursor/rules/ios-safari-mutation-transport.mdc); semantics per [`wishlist_contract.md`](../contracts/wishlist_contract.md))
- [x] `useOptimistic` + `useTransition` on heart (profile + catalog card)
- [x] `toast.error` on failure
- [x] Guest: redirect login on tap

## 3. Verification

- [x] `npm run typecheck`
- [x] `npm run lint`
- [ ] Smoke: wishlist toggle + rollback
- [ ] Smoke: pending trainer 404
- [x] **MUST NOT** booking wizard (→ P07)

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P06_phase_description.md`](../phases_tasks_descriptions/P06_phase_description.md) | DoD |
| [`P07_tasks.md`](./P07_tasks.md) | Next — booking |

**Registry:** W16
