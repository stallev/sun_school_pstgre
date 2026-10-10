# Wireframe: Client Registration

**Тип:** Wireframe | **Статус:** Canonical | **Версия:** 1.0 | **Дата:** 2026-05-23 | **Волна:** W10  
**Route:** `/auth/register` · **Prototype:** —

## Metadata

| Field | Value |
|-------|--------|
| **Primary CTA** | «Создать аккаунт» (after role tile select) |
| **Flow** | client_flow § Onboarding |

## Components

`Card`, role tiles (2-up), `Form`, `Input`, `Checkbox`, `Button`, password strength indicator.

## Regions

1. **Role selection** — tiles «Я ищу тренера» (client) | «Я тренер» → `/auth/register/trainer`.
2. **Registration form** — name, email, password, confirm, terms checkbox.
3. **Submit** — creates client user → `/client/dashboard`.

## Guardrails

- Email uniqueness — inline field error (debounced).
- Trainer path exits to separate route.

## States

| State | Description |
|-------|-------------|
| happy | Role selected + form |
| empty | N/A |
| loading | Submit pending |
| error | Field errors / toast network |
| forbidden | Authenticated → dashboard |

## Layout

Mobile: tiles stack; form full width. Desktop: tiles side-by-side `grid-cols-2`, form `max-w-md`.

**Registry:** W10-06
