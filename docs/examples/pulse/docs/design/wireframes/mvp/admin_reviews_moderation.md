# Wireframe: Admin Reviews Moderation

**Тип:** Wireframe | **Статус:** Canonical | **Версия:** 1.0 | **Дата:** 2026-05-23 | **Волна:** W10  
**Route:** `/admin/reviews` · **Prototype:** — (gap — add to admin nav)

## Metadata

| Field | Value |
|-------|--------|
| **Primary CTA** | «Скрыть отзыв» / «Удалить» per row |
| **Contract** | [`review_moderation_contract.md`](../../../implementation/mvp/contracts/review_moderation_contract.md) |

## Components

Review row `Card`, `RatingStars` read-only, `Button` hide/delete, `AlertDialog` confirm, `Tabs` Visible | Hidden.

## Regions

1. **Tabs** — pending/visible/hidden per contract.
2. **Review list** — client alias, trainer, rating, excerpt, date.
3. **Moderation actions** — hide (soft) or delete (hard) with confirm.

## Guardrails

- Admin only; actions revalidate catalog/trainer ratings.
- Destructive delete requires confirm dialog.

## States

| State | Description |
|-------|-------------|
| happy | Moderation queue |
| empty | «No reviews to moderate» |
| loading | Card skeletons |
| error | toast.error |
| forbidden | Non-admin |

## Note

Route exists in canonical_routes but **not** in HTML prototype nav — MUST add «Reviews» to admin Sidebar/BottomNav in implementation.

**Registry:** W10-29
