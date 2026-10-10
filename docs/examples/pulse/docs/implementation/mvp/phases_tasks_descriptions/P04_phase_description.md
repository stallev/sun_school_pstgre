# P04 — Public Landing

**Тип:** Phase Description  
**Статус:** Canonical  
**Версия:** 2.0  
**Дата:** 2026-05-23  
**Волна:** W16  
**Зависит от:** [`P03_phase_description.md`](./P03_phase_description.md), [`catalog_discovery_spec.md`](../specs/catalog_discovery_spec.md)  
**Связанные документы:** [`P04_tasks.md`](../tasks/P04_tasks.md), wireframe [`public_landing.md`](../../../design/wireframes/mvp/public_landing.md)

---

## Purpose

Фаза **P04** — публичный landing `/` only: hero, categories, featured trainers, primary CTA → `/trainers`.

**Historical (W16):** первая MVP-версия landing. Визуально **superseded** фазой **P16** ([`public_landing_spec.md`](../specs/public_landing_spec.md)) — P04 DoD не переписывается задним числом.

**Аудитория:** AI-агенты после P03.

---

## Agent context budget

| # | Document | Why |
|---|----------|-----|
| 1 | [`P04_tasks.md`](../tasks/P04_tasks.md) | Checklist |
| 2 | [`catalog_discovery_spec.md`](../specs/catalog_discovery_spec.md) | Landing section |
| 3 | [`public_landing.md`](../../../design/wireframes/mvp/public_landing.md) | Wireframe W10-02 |
| 4 | [`ui_component_phase_matrix.md`](../ui_component_phase_matrix.md) | P04 row |
| 5 | [`client_flow.md`](../../../prds/01_product_scope/user_flows/users_mvp/client_flow.md) | Discovery entry |

**MUST NOT read** P05+ phase docs.

---

## Scope / Out of scope

### In scope

| Area | Deliverable |
|------|-------------|
| `/` | Full landing wireframe fidelity |
| Featured trainers | Approved-only query (stub OK if P05 seed pending) |
| CTA | Primary → `/trainers` |

### Out of scope

- Catalog `/trainers` (→ **P05**)
- Profile, wishlist (→ **P06**)
- Booking (→ **P07**)

---

## UI Catalog (this phase)

| Action | Component | Route |
|--------|-----------|-------|
| **CREATE** | Landing section modules | `/` |
| **USE** | `SectionTitle`, `PulseCard`, `Button`, `CustomLink`, `SpecChip` | `/` |
| **USE** | `TrainerCard` preview row | `/` (fixture OK) |
| **MUST NOT** | Catalog filters | → P05 |

---

## Cross-phase dependencies

| Dependency | Blocker? | Notes |
|------------|----------|-------|
| **P03** shell | Yes | `(public)` layout |
| Approved trainer seed | No | Fixture OK for featured row |

---

## In-scope routes

| Path | Content |
|------|---------|
| `/` | Landing only |

---

## Happy path smoke

1. Anonymous opens `/` → hero + categories render.
2. Primary CTA → `/trainers`.
3. Featured section shows approved trainers only (or fixture).

---

## Negative path smoke

| Scenario | Expected |
|----------|----------|
| No approved trainers | Featured empty state + CTA |

---

## Security smoke

| Check | Expected |
|-------|----------|
| Pending trainer in featured query | Excluded (INV-03) |

---

## Concurrency & race check

N/A.

---

## Drift risks & guards

| Risk | Guard |
|------|-------|
| Duplicate primary CTA | One `Button` default per screen |
| Hardcoded strings | `@/lib/messages` |
| Full catalog in P04 | Route scope `/` only |

---

## Definition of done

- [x] Landing matches wireframe + spec
- [x] CTA → `/trainers`
- [x] One primary CTA; responsive 390px/md
- [x] Smoke + typecheck + lint pass

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P04_tasks.md`](../tasks/P04_tasks.md) | Checklist |
| [`P05_phase_description.md`](./P05_phase_description.md) | Next — catalog |
| [`P16_phase_description.md`](./P16_phase_description.md) | Landing v2 replace |

---

## Agent notes

- **Одна сессия = P04 only.**

---

## Acceptance criteria

- [x] Landing smoke pass
- [x] No `/trainers` implementation in PR
