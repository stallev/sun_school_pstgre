# Wireframe: Client Booking Detail

**Тип:** Wireframe | **Статус:** Canonical | **Версия:** 1.1 | **Дата:** 2026-05-25 | **Волна:** W10  
**Route:** `/client/bookings/[id]` · **Prototype:** —

## Metadata

| Field | Value |
|-------|--------|
| **Primary CTA** | Context: «Отменить» (if allowed) or «Оставить отзыв» (completed, no review) |
| **Contract** | [`booking_lifecycle_contract.md`](../../../implementation/mvp/contracts/booking_lifecycle_contract.md) |

## Components

`PulseCard`, `StatusBadge`, `Button`, `ClientBookingReviewSubmitted`, `AlertDialog` cancel confirm, `RedirectToast` query `?booked=1`.

## Regions

1. **Status header** — badge + timeline hint.
2. **Details** — trainer, service, time (trainer TZ display), price snapshot, note.
3. **Review submitted** — when review exists: `ClientBookingReviewSubmitted` (rating + body + disclaimer).
4. **Actions** — Review CTA (tonal + Star, full width); Cancel/Join row; complaint/refund secondary.
5. **Back** — `CustomLink` quiet text → `/client/bookings`.

## Guardrails

- Object-level owner check (client_id).
- Cancel only valid transitions per lifecycle.
- Review CTA only when `completed` and `review IS NULL`.

## States

| State | Description |
|-------|-------------|
| happy | Detail + actions |
| review-submitted | `ClientBookingReviewSubmitted`; no review CTA |
| loading | Header skeleton |
| error | notFound / Alert |
| forbidden | IDOR → forbidden card |

**Registry:** W10-13
