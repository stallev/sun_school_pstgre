# Wireframe: Trainer Public Profile

**Тип:** Wireframe | **Статус:** Canonical | **Версия:** 1.0 | **Дата:** 2026-05-23 | **Волна:** W10  
**Route:** `/trainers/[id]` · **Group:** `(public)` · **Prototype:** `c.trainer`

## Metadata

| Field | Value |
|-------|--------|
| **Primary CTA** | «Забронировать» → `/book/[trainerId]` |
| **Spec** | catalog_discovery_spec |

## Components

`Tabs`, `Avatar`, `RatingStars`, `Badge`, `Button`, `Card`, `ScheduleGrid` preview, `Sheet` (mobile sticky bar).

## Regions

1. **Header** — avatar, name, rating, city, spec chips, wishlist heart (client).
2. **Tabs** — About | Services | Schedule | Reviews.
3. **Tab content** — bio, service list with prices, slot preview, review list.
4. **Sticky CTA** — mobile bottom bar; desktop sidebar card with service select + Book.

## Data dependencies

Trainer profile (approved), services, reviews aggregate, slot preview range.

## Guardrails

- `notFound` if not approved (public view).
- Guest book → login `callbackUrl`.

## States

| State | Description |
|-------|-------------|
| happy | Full profile + tabs |
| empty | Reviews tab empty state |
| loading | Header + tab skeleton |
| error | Alert + back to catalog |
| forbidden | N/A public read |

## Mobile

```
┌────────────────────┐
│ Cover + avatar     │
│ Name · ★ · chips   │
│ [Tabs scroll]      │
│ Tab panel          │
├────────────────────┤
│ STICKY [Book now]  │
└────────────────────┘
```

## Desktop

```
┌─────────────────────────────────────────────┐
│ TopBar                                      │
├──────────────────────────┬──────────────────┤
│ Header + Tabs content    │ Sticky book card │
│                          │ [Book now]       │
└──────────────────────────┴──────────────────┘
```

**Registry:** W10-04
