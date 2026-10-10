# Wireframe: Admin Refunds

**Тип:** Wireframe | **Статус:** Canonical | **Версия:** 1.0 | **Дата:** 2026-05-23 | **Волна:** W10  
**Route:** `/admin/refunds` · **Prototype:** `a.refunds`

## Metadata

| Field | Value |
|-------|--------|
| **Primary CTA** | Row action «Approve refund» / «Reject» |
| **Spec** | complaint_refund_spec |

## Components

Refund request rows, amount, status `Badge`, `Button`, confirm `AlertDialog`, `Skeleton`.

## Regions

1. **Queue list** — booking ref, amount, reason, status pending.
2. **Row actions** — approve (DB status only — no Stripe MVP).
3. **Summary** — pending total amount (admin KPI).

## Guardrails

- Manual DB-only refunds MVP — no payment processor UI.
- toast on decision.

## States

| State | Description |
|-------|-------------|
| happy | Pending list |
| empty | «No pending refunds» |
| loading | Skeleton |
| error | toast.error |
| forbidden | Non-admin |

**Registry:** W10-28
