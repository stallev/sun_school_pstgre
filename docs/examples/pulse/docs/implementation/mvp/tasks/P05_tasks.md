# P05 Tasks — Catalog Discovery

**Тип:** Tasks  
**Статус:** Canonical  
**Версия:** 2.0  
**Дата:** 2026-05-23  
**Волна:** W16  
**Зависит от:** [`P05_phase_description.md`](../phases_tasks_descriptions/P05_phase_description.md)  
**Связанные документы:** [`catalog_discovery_spec.md`](../specs/catalog_discovery_spec.md)

---

## Purpose

Чеклист **P05** — catalog `/trainers` only.

---

## 1. Catalog `/trainers`

- [x] RSC loader: approved trainers + aggregates
- [x] Filters: `q`, `maxPrice`, `minRating`, `specializations[]` in URL
- [x] Mobile: filter Sheet; desktop: sidebar `lg:`
- [x] Sort + pagination
- [x] `TrainerCard` component
- [x] Empty state when no results
- [x] Cache tag `trainers` if using tags policy

## 2. Verification

- [x] `npm run typecheck`
- [x] `npm run lint`
- [ ] Smoke: filter URL shareable
- [ ] Smoke: pending trainer not in list
- [ ] Smoke: invalid params — no 500
- [x] **MUST NOT** implement profile or wishlist (→ P06)

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P05_phase_description.md`](../phases_tasks_descriptions/P05_phase_description.md) | DoD |
| [`P06_tasks.md`](./P06_tasks.md) | Next — profile |

**Registry:** W16
