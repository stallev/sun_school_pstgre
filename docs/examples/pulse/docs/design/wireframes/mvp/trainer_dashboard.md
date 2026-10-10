# Wireframe: Trainer Dashboard

**Тип:** Wireframe | **Статус:** Canonical | **Версия:** 1.0 | **Дата:** 2026-05-23 | **Волна:** W10  
**Route:** `/trainer/dashboard` · **Prototype:** `t.home`

## Metadata

| Field | Value |
|-------|--------|
| **Primary CTA** | Today session row → booking detail or schedule |
| **Flow** | trainer_flow § Today |

## Components

KPI cards, `TrainerReviewBanner` (if pending), session list, review snippets, `Skeleton`.

## Regions

1. **Review banner** — if `status != approved` — full width Alert.
2. **KPI row** — today count, week bookings, rating, income stub.
3. **Today sessions** — time-ordered list.
4. **Recent reviews** — 2–3 cards.

## States

| State | Description |
|-------|-------------|
| happy | KPI + lists |
| empty | No sessions today + CTA schedule |
| loading | KPI skeleton grid |
| error | Section Retry |
| forbidden | Non-trainer |

## Desktop

KPI `md:grid-cols-4`; two-column below for sessions + reviews.

**Registry:** W10-16
