# Wireframe: Booking Wizard

**Тип:** Wireframe | **Статус:** Canonical | **Версия:** 1.0 | **Дата:** 2026-05-23 | **Волна:** W10  
**Route:** `/book/[trainerId]` · **Group:** `(booking)` · **Prototype:** `c.book`

## Metadata

| Field | Value |
|-------|--------|
| **Primary CTA** | Step 3 «Подтвердить бронирование» |
| **Spec** | [`booking_wizard_spec.md`](../../../implementation/mvp/specs/booking_wizard_spec.md) |

## Components

Stripped header, step indicator (1–3), radio service cards, `ScheduleGrid`, summary `Card`, `Textarea` note, `Button` Next/Back.

## Regions

1. **Header** — trainer mini (avatar + name); close → back.
2. **Step 1 Service** — radio list active services.
3. **Step 2 Slot** — day scroller + slot chips (trainer TZ label).
4. **Step 3 Confirm** — summary + optional message (500 max).
5. **Desktop sidebar** — sticky summary mirror (md+).

## Guardrails

- No bottom nav (stripped chrome).
- Client role only; no payment UI (ADR-005).
- FM-001 slot race → toast.error + refresh slots.

## States

| State | Description |
|-------|-------------|
| happy | Step flow |
| empty | No services / no slots → CTA back |
| loading | Slots skeleton |
| error | SLOT_UNAVAILABLE toast |
| forbidden | Guest → login callbackUrl |

## Mobile

```
┌────────────────────┐
│ ← Trainer · Step 2/3│
│ [Service cards]    │
│ or Slot grid       │
│ [Next →]           │
└────────────────────┘
```

**Registry:** W10-08
