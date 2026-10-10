# Wireframe: Client Review Form

**Тип:** Wireframe | **Статус:** Canonical | **Версия:** 1.0 | **Дата:** 2026-05-23 | **Волна:** W10  
**Route:** `/client/reviews/[bookingId]` · **Prototype:** —

## Metadata

| Field | Value |
|-------|--------|
| **Primary CTA** | «Отправить отзыв» |
| **Contract** | [`review_moderation_contract.md`](../../../implementation/mvp/contracts/review_moderation_contract.md) |

## Components

`RatingStars` input, `Textarea`, `Form`, `Button`, trainer summary mini card.

## Regions

1. **Context** — booking summary (trainer, session date).
2. **Rating** — 1–5 stars (required).
3. **Comment** — optional text, max length.
4. **Submit** — redirect booking detail (`/client/bookings/[bookingId]?reviewed=1`) + query toast «Отзыв опубликован».

## Guardrails

- Only `completed` booking; one review per booking.
- Review pending moderation — copy in success toast.

## States

| State | Description |
|-------|-------------|
| happy | Form |
| loading | Submit pending |
| error | Validation |
| already_reviewed | Redirect to `/client/bookings/[bookingId]` (read model on detail) |
| forbidden | Wrong client or booking state |

**Registry:** W10-14
