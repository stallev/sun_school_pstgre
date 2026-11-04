# UI copy and messages — Pulse

All user-visible product copy for **`apps/web`** lives in **`apps/web/src/lib/messages`**. Keys use **English identifiers**; values are localized per active **`AppLocale`** (`en` | `ru`).

**Methodology:** [`docs/meta/ai_first_project_methodology.md`](../../meta/ai_first_project_methodology.md)  
**Cursor rules:** **ui-messages-and-copy** (`.cursor/rules/ui-messages-and-copy.mdc`) · **ui-messages-bundle-splitting** (`.cursor/rules/ui-messages-bundle-splitting.mdc`)  
**Locale strategy:** [`adr_008_i18n_ru_en_dictionary_slices.md`](../../prds/07_governance/adr_008_i18n_ru_en_dictionary_slices.md) · **Runtime:** ADR-008 §4 (отдельного runtime-spec нет)

---

## Why

- Single place to edit wording across locales.
- **Server Actions** and **components** must not diverge on the same validation or error text.
- TypeScript **`Messages`** type enforces key parity between locale files.

---

## Locales (P17)

| Locale | File | Role |
|--------|------|------|
| **`en`** | `en.ts` | **Default** — canonical key tree + English copy |
| **`ru`** | `ru.ts` | Russian copy — `satisfies Messages` |

**Default locale:** `en` (aligns with `user.locale` DDL).

**Resolution:** cookie `pulse_locale` → session → `Accept-Language` → `en`. See contract §3.

---

## Structure

Nested objects by domain:

| Namespace | Examples |
|-----------|----------|
| `site` | App name, default metadata |
| `auth` | Login, register, password reset |
| `booking` | Status labels, actions, errors |
| `trainer` | Onboarding, schedule, services |
| `admin` | Moderation, verification, reject reasons |
| `catalog` | Filters, empty states, wishlist |
| `locale` | Switcher labels, language names (P17) |

- **Validation** vs **server** errors separated where helpful (`booking.validation`, `booking.server`).
- **Enum/API values** (`client`, `pending`, `confirmed`) — `@sunschool/domain` or `@/lib/...` constants; **labels** in `messages`.
- **Mutation pending labels** — short gerund-style per locale (“Saving…”, “Сохраняем…”). See [`ai_form_handling_pattern.md`](./ai_form_handling_pattern.md) §4.
- **Plurals** — keyed branches (`one`, `few`, `many`) per [ADR-008](../../prds/07_governance/adr_008_i18n_ru_en_dictionary_slices.md); no string concatenation with fixed word order.

---

## Import patterns (P17)

| Context | Import |
|---------|--------|
| Server Component / Action / DAL | `import { getMessages } from "@/lib/messages"` → `const messages = await getMessages()`, then `pick<Тип>Messages(messages)` for the route-group slice |
| Client Component | `use<Тип>Messages()` from that group's provider, or props from a Server parent. The provider does not import dictionaries |
| Types only | `import type { Messages } from "@/lib/messages/types"` |

**Legacy:** bare `MESSAGES` export from `ru.ts` — **deprecated** in P17; migrate to `getMessages()` on the server and a typed slice hook on the client. A single root `useMessages()` / `LocaleProvider` that holds every namespace is not the client API — see §Срезы словаря.

**MUST** add new keys to **both** `en.ts` and `ru.ts` in the same change.

---

## Срезы словаря и клиентский бандл

Клиентский JS страницы содержит только строки **этого типа страницы** и **текущей локали**. Полный словарь (все разделы × все локали) в клиентский бандл не попадает.

Серверный layout группы маршрутов выбирает локаль, берёт словарь и вызывает `pick<Тип>Messages`. Результат уходит в провайдер группы как props. Клиент читает его через `use<Тип>Messages()` или получает нужный подраздел пропсами. Смена языка — `router.refresh()`, повторный серверный рендер.

Чеклист, запреты импорта (`"use client"`, barrel, `no-restricted-imports`) и антипаттерны — правило **ui-messages-bundle-splitting**.

Pulse [`i18n_runtime_spec.md`](../../examples/pulse/docs/implementation/mvp/contracts/i18n_runtime_spec.md) I18N-MUST-8 (один корневой `LocaleProvider` и `useMessages()`) этим правилом перекрыт.

---

## Formatting (not in messages)

Dates, times, money, relative timestamps — **`@/lib/i18n/format.ts`** with explicit locale. Do not embed formatted dates inside message strings when values are dynamic — use placeholders: `` `{date}` ``.

**Trainer timezone** (ADR-004) is passed to formatters separately from UI locale.

---

## Agent rule

- No duplicate strings in DAL, actions, and UI for the same user-facing error.
- No inline Cyrillic/Latin user-visible strings in TSX — use messages.
- Deep links may use `?lang=en|ru` — see [`canonical_routes.md`](../../design/canonical_routes.md) §Locale query.

---

## Icons

Prefer **`lucide-react`** — **ui-icons-lucide** rule and [React README](./README.md).

**Reference:** Pulse snapshot [`copy_and_messages.md`](../../examples/pulse/docs/guidelines/react/copy_and_messages.md)

## Стоп-слова и форматы (P25, ADR-018)

- В `apps/web/src/lib/messages/ru/*.json` запрещены: `выборка`, `N=`, `п. п.`, `IANA`, `ADR`, `LEGACY`, `DTO` (в `en` — `sample`, `N=`, `IANA`, `ADR`). Проверка — vitest по словарю; исключение — только в самом тесте с причиной.
- Нет `N=` и других текстов в JSX: числа и единицы собираются из ключей словаря и `@/lib/i18n/format`.
- Один термин — один ключ глоссария (`glossary.*`); подсказка термина — ключ `*.hint`, ≤ 200 знаков.
- Подпись по значению домена (`AUDIT_ENTITY_TYPE`, `AUDIT_ACTION`, статусы) — через безопасный хелпер (`safeAdminMessage(...) ?? значение`), а не через бросающий `getMessage`; полнота ключей — тест паритета домен ↔ ru/en (Sentry `SUN_SCHOOL_POSTGRES_DEV-Q`, 2026-11-03).
- В `"use client"`-компонент передаются только нужные строки, не весь объект `pick*Messages` с функциями-форматтерами (Sentry `-1Y`/`-2C`, 135 событий).
- Значения `audit.actions.*` и `audit.entity_types.*` в `ru` — на русском языке (фразой действия), в `en` — на английском; проверка — тест словаря (P26-CU2).
- Числа и даты из DAL в компонент передаются числами / ISO, форматирует компонент через `@/lib/i18n/format` (P26-CU4); тест-страж на `toFixed(` и ISO-даты в `components` и `lib/analytics`.
