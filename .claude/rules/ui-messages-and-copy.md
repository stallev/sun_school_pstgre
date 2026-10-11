---
description: UI copy, errors, labels — centralize in @/lib/messages for i18n readiness
paths:
  - "apps/web/src/**/*.tsx"
  - "apps/web/src/**/*.ts"
---
# UI messages and copy (`apps/web`)

**Guide:** [`docs/guidelines/react/copy_and_messages.md`](docs/guidelines/react/copy_and_messages.md)

## Source of truth

- User-visible strings from **`@/lib/messages`** (`en.ts`, `ru.ts`). Nested namespaces по доменам продукта (Pulse: `auth`, `booking`, `trainer`, `admin`, `site`, `locale`, …)
- **Default locale:** `en` · **Supported:** `en`, `ru` — see [`adr_009_ui_locale_strategy.md`](docs/prds/07_governance/adr_009_ui_locale_strategy.md)
- **Do not** duplicate the same sentence in Server Action and component.

## What belongs in messages

- Validation and server-action errors, form-level `formError`, alerts.
- Button labels, page titles, help text, toast strings.
- Default `metadata` title/description.
- **Display labels** for `<option>`; **domain/API values** — shared `@/lib/...` constants or `@sunschool/domain`.

## Пример namespaces (Pulse MVP)

- `auth` — login, register, password reset
- `booking` — statuses, actions, errors
- `trainer` — onboarding, schedule, services
- `admin` — moderation, verification
- `catalog` — filters, empty states

## Locales (P17)

- Server: `getMessages()` from `@/lib/messages`, then `pick<Тип>Messages` for the route-group slice
- Client: `use<Тип>Messages()` from that group's provider — not a root `LocaleProvider` with the full dictionary (**ui-messages-bundle-splitting**)
- **MUST** add keys to both `en.ts` and `ru.ts`
- Cookie-first locale — **no** `/[lang]/` URL prefix (ADR-009)
- Formatters: `@/lib/i18n/format.ts` — not hardcoded `ru-RU`

Reference: [`copy_and_messages.md`](docs/guidelines/react/copy_and_messages.md), [`i18n_runtime_spec.md`](docs/implementation/mvp/contracts/i18n_runtime_spec.md).
