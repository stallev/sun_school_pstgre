# Wireframe: Trainer Services

**Тип:** Wireframe | **Статус:** Canonical | **Версия:** 1.0 | **Дата:** 2026-05-23 | **Волна:** W10  
**Route:** `/trainer/services` · **Prototype:** `t.services`

## Metadata

| Field | Value |
|-------|--------|
| **Primary CTA** | «Добавить услугу» |
| **Flow** | trainer_flow § Services |

## Components

Service `Card` rows, `Switch` active toggle (optimistic), `Dialog`/`Sheet` add-edit form, `Button`.

## Regions

1. **Header** — title + add button.
2. **Service list** — name, duration, price, active switch.
3. **Add/Edit sheet** — form fields; delete with confirm.

## Guardrails

- Optimistic toggle per ui-optimistic-mutations.
- At least one active service for booking eligibility.

## States

| State | Description |
|-------|-------------|
| happy | List with toggles |
| empty | «Добавьте первую услугу» + CTA |
| loading | Row skeletons |
| error | toast.error on toggle fail |
| forbidden | Non-trainer |

**Registry:** W10-18
