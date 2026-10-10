# Wireframe: Trainers Catalog

**Тип:** Wireframe | **Статус:** Canonical | **Версия:** 1.0 | **Дата:** 2026-05-23 | **Волна:** W10  
**Route:** `/trainers` · **Group:** `(public)` · **Role:** public · **Prototype:** `c.catalog`

## Metadata

| Field | Value |
|-------|--------|
| **Primary CTA** | Tap trainer card → `/trainers/[id]` |
| **Spec** | [`catalog_discovery_spec.md`](../../../implementation/mvp/specs/catalog_discovery_spec.md) |

## Components

`TrainerCard`, `Sheet` (mobile filters), `Input` search, `Badge`, `Skeleton`, `Button` filter, `SpecChip`.

## Regions

1. **Page header** — title + result count.
2. **Toolbar** — search; mobile «Filters» opens Sheet; desktop `lg:` FilterSidebar sticky.
3. **Active filter chips** — edge-to-edge mobile `-mx-4 px-4`.
4. **Trainer grid** — `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5`.
5. **Wishlist heart** — on card if client session (optimistic).

## Data dependencies

Approved trainers + ratings; URL `searchParams`: `q`, `maxPrice`, `minRating`, `specializations[]`.

## Guardrails

- Approved-only listing (INV-03).
- Guest wishlist → redirect login.

## States

| State | Description |
|-------|-------------|
| happy | Grid of cards |
| empty | «Нет тренеров» + CTA сбросить фильтры |
| loading | Card skeletons × 6 |
| error | Alert + Retry |
| forbidden | N/A (public) |

## Desktop (≥ lg)

```
┌────────────────────────────────────────────────────┐
│ TopBar                                             │
├────────────┬───────────────────────────────────────┤
│ Filter     │ Search · sort                         │
│ Sidebar    │ [chips]                               │
│ (lg+)      │ [Card][Card][Card]                    │
│            │ [Card][Card][Card]                    │
└────────────┴───────────────────────────────────────┘
```

## Mobile

```
┌────────────────────┐
│ TopBar             │
│ Search             │
│ [Filters] [chips→] │
│ [TrainerCard]      │
│ [TrainerCard]      │
└────────────────────┘
(+ client BottomNav when navigated from /client/*)
```

## Acceptance criteria

- [ ] Filter Sheet mobile; sidebar lg+
- [ ] Empty + reset filters CTA
- [ ] Heart optimistic per wishlist contract

**Registry:** W10-03
