# P09 Tasks — Client Reviews

**Тип:** Tasks  
**Статус:** Canonical  
**Версия:** 2.1  
**Дата:** 2026-05-25  
**Волна:** W16  
**Зависит от:** [`P09_phase_description.md`](../phases_tasks_descriptions/P09_phase_description.md)  
**Связанные документы:** [`review_moderation_contract.md`](../contracts/review_moderation_contract.md)

---

## Purpose

Чеклист **P09** — review form `/client/reviews/[bookingId]`.

---

## 1. Reviews

- [x] `/client/reviews/[bookingId]` — `ReviewForm`
- [x] Interactive `RatingStars` required
- [x] `submitReview` → publish review + rating recalc (contract)
- [x] Guard: booking `completed`, no duplicate review
- [x] Pending UI + toasts on submit
- [x] List/detail «Отзыв оставлен» when review exists
- [x] List/detail CTA `tonal` + Star icon (prototype parity)

## 2. Cross-phase smoke note

- [x] Document seed/manual `completed` booking path if P12 not merged

**Smoke (seed, P12 not required):**

1. Login `client@pulse.dev` / `client123`
2. Run `npx prisma db seed` (from `packages/db`) so extended review fixtures exist
3. Open `/client/bookings` → **Past** — expect **5** completed cards:
   - **Review eligible (CTA «Оставить отзыв»):** Anna `…2205`, Dmitry `…2206`, Elena `…2207`
   - **Review submitted (disabled «Отзыв оставлен»):** Maria `…2203`, Ivan `…2208`
4. Positive submit: `/client/reviews/22222222-2222-4222-8222-222222222205` → 5★ + body ≥ 20 chars → redirect `/client/bookings/[id]?reviewed=1` → toast «Отзыв опубликован» → URL cleaned → card shows «Отзыв оставлен»
5. Repeat on `…2206` or `…2207` for additional manual runs
6. Negative: `/client/reviews/22222222-2222-4222-8222-222222222203` (Maria, already reviewed) → **redirect** `/client/bookings/…2203`; non-completed booking → 404

## 3. Verification

- [x] `npm run typecheck`
- [x] `npm run lint`
- [x] Smoke: submit review on completed booking
- [x] Smoke: deny non-completed / duplicate

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P09_phase_description.md`](../phases_tasks_descriptions/P09_phase_description.md) | DoD |
| [`P10_tasks.md`](./P10_tasks.md) | Next — trainer onboarding |
| [`seed_data_spec.md`](../../../prds/03_data_model/seed_data_spec.md) | Review fixture IDs |

**Registry:** W16
