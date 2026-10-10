# P06 — Trainer Public Profile + Wishlist

**Тип:** Phase Description  
**Статус:** Canonical  
**Версия:** 2.0  
**Дата:** 2026-05-23  
**Волна:** W16  
**Зависит от:** [`P05_phase_description.md`](./P05_phase_description.md), [`catalog_discovery_spec.md`](../specs/catalog_discovery_spec.md), [`wishlist_contract.md`](../contracts/wishlist_contract.md)  
**Связанные документы:** [`P06_tasks.md`](../tasks/P06_tasks.md), wireframe [`public_trainer_profile.md`](../../../design/wireframes/mvp/public_trainer_profile.md)

---

## Purpose

Фаза **P06** — публичный профиль `/trainers/[id]` + optimistic wishlist для клиента. CTA «Book now» → `/book/[trainerId]`.

**Аудитория:** AI-агенты после P05.

---

## Agent context budget

| # | Document | Why |
|---|----------|-----|
| 1 | [`P06_tasks.md`](../tasks/P06_tasks.md) | Checklist |
| 2 | [`wishlist_contract.md`](../contracts/wishlist_contract.md) | FM-005 |
| 3 | [`catalog_discovery_spec.md`](../specs/catalog_discovery_spec.md) | Profile UX |
| 4 | [`public_trainer_profile.md`](../../../design/wireframes/mvp/public_trainer_profile.md) | Wireframe |
| 5 | [`ui_component_phase_matrix.md`](../ui_component_phase_matrix.md) | P06 row |

**MUST NOT read** P07+ phase docs.

---

## Scope / Out of scope

### In scope

| Area | Deliverable |
|------|-------------|
| `/trainers/[id]` | Tabs, schedule preview, reviews |
| Wishlist | Optimistic heart per contract |
| CTA | Book now → `/book/[trainerId]` |

### Out of scope

- Booking wizard (→ **P07**)
- Admin approve (→ **P13**)

---

## UI Catalog (this phase)

| Action | Component | Route |
|--------|-----------|-------|
| **CREATE** | Profile tab panels, wishlist control | `/trainers/[id]` |
| **USE** | `Tabs`, `RatingStars`, `StatusBadge`, `Button`, `SpecChip`, `PhotoSlot` | profile |
| **MUST NOT** | `BookingWizard` | → P07 |

---

## Cross-phase dependencies

| Dependency | Blocker? | Notes |
|------------|----------|-------|
| **P05** catalog | Yes | Navigation path |
| Auth for wishlist | Yes | P02 |

---

## In-scope routes

| Path | Content |
|------|---------|
| `/trainers/[id]` | Profile + wishlist |

---

## Happy path smoke

1. Open approved trainer → tabs render; TZ on schedule preview.
2. Client toggles wishlist → optimistic flip; persists on refresh.
3. Guest heart → login redirect.
4. «Book now» → `/book/[trainerId]`.
5. Pending trainer direct URL → 404.

---

## Negative path smoke

| Scenario | Expected |
|----------|----------|
| Wishlist error | Rollback + `toast.error` ([**FM-005**](../../../prds/02_domain_model/failure_modes_catalog.md)) |

---

## Security smoke

| Check | Expected |
|-------|----------|
| Pending trainer | 404 / not available |
| Anonymous wishlist mutate | Deny / redirect |

---

## Concurrency & race check

| Scenario | Expected |
|----------|----------|
| Double wishlist toggle | Idempotent final state (FM-005) |

---

## Drift risks & guards

| Risk | Guard |
|------|-------|
| Wishlist without optimistic rollback | Contract + ui-optimistic-mutations |
| PII on pending profile | 404 |
| Multiple primary CTAs | One «Book now» |

---

## Definition of done

- [x] Profile per wireframe + spec
- [x] Wishlist contract compliant
- [x] 404 non-approved
- [x] Smoke + typecheck + lint pass

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P06_tasks.md`](../tasks/P06_tasks.md) | Checklist |
| [`P07_phase_description.md`](./P07_phase_description.md) | Next — booking |

---

## Agent notes

- **Одна сессия = P06 only.**

---

## Acceptance criteria

- [x] Profile + wishlist smoke pass
