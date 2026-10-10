# P05 — Catalog Discovery

**Тип:** Phase Description  
**Статус:** Canonical  
**Версия:** 2.0  
**Дата:** 2026-05-23  
**Волна:** W16  
**Зависит от:** [`P04_phase_description.md`](./P04_phase_description.md), [`catalog_discovery_spec.md`](../specs/catalog_discovery_spec.md), [`cache_revalidation_policy.md`](../../../prds/05_runtime/cache_revalidation_policy.md)  
**Связанные документы:** [`P05_tasks.md`](../tasks/P05_tasks.md), wireframe [`public_trainers_catalog.md`](../../../design/wireframes/mvp/public_trainers_catalog.md)

---

## Purpose

Фаза **P05** — каталог `/trainers`: filters (URL searchParams), sort, pagination, `TrainerCard` grid. **Approved trainers only** (INV-03).

**Аудитория:** AI-агенты после P04.

---

## Agent context budget

| # | Document | Why |
|---|----------|-----|
| 1 | [`P05_tasks.md`](../tasks/P05_tasks.md) | Checklist |
| 2 | [`catalog_discovery_spec.md`](../specs/catalog_discovery_spec.md) | Catalog UX |
| 3 | [`public_trainers_catalog.md`](../../../design/wireframes/mvp/public_trainers_catalog.md) | Wireframe |
| 4 | [`ui_component_phase_matrix.md`](../ui_component_phase_matrix.md) | P05 row |
| 5 | [`cache_revalidation_policy.md`](../../../prds/05_runtime/cache_revalidation_policy.md) | Tag `trainers` |

**MUST NOT read** P06+ phase docs.

---

## Scope / Out of scope

### In scope

| Area | Deliverable |
|------|-------------|
| `/trainers` | Grid, filters, sort, pagination |
| Data | RSC — `status = approved` only |
| Cache | Tag `trainers` if applicable |

### Out of scope

- Profile `/trainers/[id]` (→ **P06**)
- Wishlist toggle (→ **P06**)
- Booking (→ **P07**)

---

## UI Catalog (this phase)

| Action | Component | Route |
|--------|-----------|-------|
| **CREATE** | `TrainerCard`, filter surfaces | `/trainers` |
| **USE** | `FilterChip`, `RadioGroup` tile, `Slider`, `Pagination`, `Empty`, `Skeleton`, `Sheet` | `/trainers` |
| **MUST NOT** | Profile tabs, wishlist heart | → P06 |

---

## Cross-phase dependencies

| Dependency | Blocker? | Notes |
|------------|----------|-------|
| **P03** shell | Yes | Public layout |
| Seed approved trainer | Yes | Grid smoke |

---

## In-scope routes

| Path | Content |
|------|---------|
| `/trainers` | Catalog only |

---

## Happy path smoke

1. Open `/trainers` → grid of approved trainers.
2. Apply filter → URL updates → grid refreshes.
3. Share URL → same filter state.
4. Pending trainer excluded from list.

---

## Negative path smoke

| Scenario | Expected |
|----------|----------|
| Empty catalog | Empty state + CTA |
| Invalid searchParams | Sanitize; no 500 |

---

## Security smoke

| Check | Expected |
|-------|----------|
| Query layer | Never `status != approved` |

---

## Concurrency & race check

N/A.

---

## Drift risks & guards

| Risk | Guard |
|------|-------|
| Invalid searchParams 500 | Zod/coerce defaults |
| Filter state not in URL | searchParams required |
| Wishlist in catalog phase | Defer to P06 |

---

## Definition of done

- [x] Catalog per spec + wireframe
- [x] URL-shareable filters
- [x] Approved-only enforced
- [x] Smoke + typecheck + lint pass

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P05_tasks.md`](../tasks/P05_tasks.md) | Checklist |
| [`P06_phase_description.md`](./P06_phase_description.md) | Next — profile |

---

## Agent notes

- **Одна сессия = P05 only.**

---

## Acceptance criteria

- [x] Catalog smoke pass
- [x] No profile route in PR
