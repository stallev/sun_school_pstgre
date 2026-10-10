# Wireframe: Trainer Clients List

**Тип:** Wireframe | **Статус:** Canonical | **Версия:** 1.0 | **Дата:** 2026-05-23 | **Волна:** W10  
**Route:** `/trainer/clients` · **Prototype:** `t.clients`

## Metadata

| Field | Value |
|-------|--------|
| **Primary CTA** | Row → `/trainer/clients/[id]` |
| **Flow** | trainer_flow § Clients |

## Components

`Input` search, client row `Card`, avatar, last session date, `Skeleton`.

## Regions

1. **Search** — filter by name.
2. **Client list** — name, sessions count, last visit.

## Guardrails

- Only clients with booking history with this trainer.
- No email/phone unless policy allows (privacy).

## States

| State | Description |
|-------|-------------|
| happy | Searchable list |
| empty | «Пока нет клиентов» |
| loading | Row skeletons |
| error | Alert + Retry |
| forbidden | Non-trainer |

**Registry:** W10-20
