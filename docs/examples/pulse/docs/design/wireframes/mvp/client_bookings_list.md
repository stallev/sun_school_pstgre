# Wireframe: Client Bookings List

**Тип:** Wireframe | **Статус:** Canonical | **Версия:** 1.1 | **Дата:** 2026-05-25 | **Волна:** W10  
**Route:** `/client/bookings` · **Prototype:** `c.bookings`

## Metadata

| Field | Value |
|-------|--------|
| **Primary CTA** | Row tap → `/client/bookings/[id]` |
| **Past tab CTA** | «Оставить отзыв» (`Button tonal` + Star) when `completed` and no review |
| **Flow** | client_flow § Bookings |

## Components

`Tabs` (Upcoming | Past | Cancelled), booking row `PulseCard`, status `StatusBadge`, `ClientBookingReviewListAction`.

## Regions

1. **Page title** — «Мои сессии».
2. **Tabs** — filter by status group (pill variant, active = surface + shadow).
3. **List** — trainer avatar, service (`ContentText metaSecondary`), datetime (`metaPrimary`), status badge.
4. **Past actions** — full-width tonal review CTA **or** disabled «Отзыв оставлен» + rating stars.

## States

| State | Description |
|-------|-------------|
| happy | Tab list |
| past-review-eligible | Tonal «Оставить отзыв» → `/client/reviews/[bookingId]` |
| past-review-submitted | Disabled tonal «Отзыв оставлен» + `RatingStars` readonly |
| empty | Per-tab empty + «Найти тренера» |
| loading | Row skeletons × 5 |
| error | Alert + Retry |
| forbidden | Non-client |

## Mobile / Desktop

Same structure; **md:** two-column grid for past/upcoming cards.

## Prototype note

HTML prototype shows «Leave a review» on **all** completed rows without duplicate guard — **product canon** hides CTA when review exists and shows «Отзыв оставлен» instead.

**Registry:** W10-12
