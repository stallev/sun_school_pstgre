# Wireframe: Trainer Income

**Тип:** Wireframe | **Статус:** Canonical | **Версия:** 1.0 | **Дата:** 2026-05-23 | **Волна:** W10  
**Route:** `/trainer/income` · **Prototype:** `t.income`

## Metadata

| Field | Value |
|-------|--------|
| **Primary CTA** | None primary — read-only list (export MAY post-MVP) |
| **Scope** | MVP — amounts from bookings, no Stripe UI |

## Components

Summary KPI `Card`, transaction list rows, `Badge`, period filter stub.

## Regions

1. **Summary** — month total, session count (computed from completed bookings).
2. **History table/list** — date, service, amount, status.
3. **Stripe banner** — «Выплаты скоро» info — not actionable MVP.

## Guardrails

- No Stripe Connect, no payout actions.
- Display currency from platform default.

## States

| State | Description |
|-------|-------------|
| happy | List + summary |
| empty | «Нет завершённых сессий» |
| loading | Table skeleton |
| error | Alert + Retry |
| forbidden | Non-trainer |

**Registry:** W10-22
