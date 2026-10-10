# Wireframe: Booking Confirm (Optional Split)

**Тип:** Wireframe | **Статус:** Canonical | **Версия:** 1.0 | **Дата:** 2026-05-23 | **Волна:** W10  
**Route:** `/book/[trainerId]/confirm` · **Group:** `(booking)` · **Prototype:** —

## Metadata

| Field | Value |
|-------|--------|
| **Primary CTA** | «Подтвердить бронирование» |
| **Spec** | booking_wizard_spec (optional split from step 3) |

## Purpose

Optional dedicated confirm screen if wizard splits step 3 to separate route. **MAY** merge into single wizard route — implement one canonical path per phase P03.

## Regions

1. Summary card — trainer, service, datetime (local label), price snapshot.
2. Optional note field.
3. Submit → `createBooking` → redirect `/client/bookings/[id]?booked=1`.

## States

Same as wizard step 3: pending submit, FM-001 error, forbidden guest.

## Layout

Single column mobile; desktop centered `max-w-lg`.

**Registry:** W10-09
